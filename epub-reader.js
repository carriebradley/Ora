/* Device-local EPUB text reader. Never inserts book markup or loads its resources. */
(function(root){
  'use strict';
  const ENTRY_MAX=8*1024*1024, TEXT_MAX=32*1024*1024, COUNT_MAX=5000;
  const decoder=new TextDecoder('utf-8',{fatal:true});
  const fail=()=>{throw new Error('Choose an unencrypted EPUB with readable text.');};
  function path(base,href){
    if(!href||/^[a-z][a-z\d+.-]*:|^\/|\\/i.test(href))return fail();
    const parts=base.split('/');parts.pop();
    for(const part of decodeURIComponent(href.split('#')[0]).split('/')){
      if(part==='..'){if(!parts.length)return fail();parts.pop();}
      else if(part&&part!=='.')parts.push(part);
    }
    return parts.join('/');
  }
  function xml(text){
    if(/<!ENTITY|<!DOCTYPE[^>]*\[/i.test(text))return fail();
    text=text.replace(/<!DOCTYPE[^>]*>/gi,'');
    // XHTML 1 EPUBs can use HTML named entities. Expand single entity tokens,
    // never document markup, into numeric references before the inert XML parse.
    text=text.replace(/&([a-z][a-z\d]+);/gi,(token,name)=>{
      if(['amp','lt','gt','quot','apos'].includes(name))return token;
      const area=document.createElement('textarea');area.innerHTML=token;
      if(area.value===token)return token;
      return Array.from(area.value,c=>'&#'+c.codePointAt(0)+';').join('');
    });
    const doc=new DOMParser().parseFromString(text,'application/xml');
    if(doc.getElementsByTagName('parsererror').length)return fail();
    return doc;
  }
  const elements=(doc,name)=>Array.from(doc.getElementsByTagNameNS('*',name));
  const blocked=new Set(['script','style','head','iframe','object','embed','svg','audio','video','noscript']);
  function crc32(data){let crc=0xffffffff;for(const byte of data){crc^=byte;for(let b=0;b<8;b++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}return (crc^0xffffffff)>>>0;}
  function words(node){
    if(node.nodeType===3)return node.nodeValue;
    if(node.nodeType!==1||blocked.has(node.localName))return '';
    if(node.localName==='br')return '\n';
    return Array.from(node.childNodes,words).join('');
  }
  async function load(blob){
    const buffer=await blob.arrayBuffer(),bytes=new Uint8Array(buffer),v=new DataView(buffer);
    const u16=i=>v.getUint16(i,true),u32=i=>v.getUint32(i,true);
    let end=-1;
    for(let i=bytes.length-22;i>=Math.max(0,bytes.length-65557);i--){
      if(u32(i)===0x06054b50&&i+22+u16(i+20)===bytes.length){end=i;break;}
    }
    if(end<0||u16(end+4)||u16(end+6)||u16(end+8)!==u16(end+10))return fail();
    const count=u16(end+10),size=u32(end+12),start=u32(end+16),files=new Map();
    if(!count||count>COUNT_MAX||start+size>end)return fail();
    let cursor=start;
    for(let n=0;n<count;n++){
      if(cursor+46>start+size||u32(cursor)!==0x02014b50)return fail();
      const flags=u16(cursor+8),method=u16(cursor+10),compressed=u32(cursor+20),expanded=u32(cursor+24);
      const names=u16(cursor+28),extra=u16(cursor+30),comment=u16(cursor+32),local=u32(cursor+42);
      if(cursor+46+names+extra+comment>start+size||u16(cursor+34)||flags&1||compressed===0xffffffff||expanded===0xffffffff||local===0xffffffff)return fail();
      const name=decoder.decode(bytes.subarray(cursor+46,cursor+46+names));
      if(files.has(name)||name.startsWith('/')||name.split('/').includes('..')||name.includes('\\'))return fail();
      files.set(name,{method,compressed,expanded,local,crc:u32(cursor+16)});cursor+=46+names+extra+comment;
    }
    if(cursor!==start+size||files.has('META-INF/encryption.xml'))return fail();
    let total=0;
    async function read(name){
      const e=files.get(name);if(!e||e.expanded>ENTRY_MAX||e.local+30>start||u32(e.local)!==0x04034b50)return fail();
      if(u16(e.local+6)&1||u16(e.local+8)!==e.method)return fail();
      const from=e.local+30+u16(e.local+26)+u16(e.local+28);
      if(from+e.compressed>start)return fail();
      let data;
      if(e.method===0)data=bytes.subarray(from,from+e.compressed);
      else if(e.method===8){
        let stream;try{stream=new DecompressionStream('deflate-raw');}catch(_){throw new Error('This browser cannot open compressed EPUBs. Open the original in Books.');}
        const reader=blob.slice(from,from+e.compressed).stream().pipeThrough(stream).getReader(),chunks=[];
        let length=0;
        try{for(;;){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>ENTRY_MAX||total+length>TEXT_MAX){await reader.cancel();return fail();}chunks.push(value);}}finally{reader.releaseLock();}
        data=new Uint8Array(length);let offset=0;for(const chunk of chunks){data.set(chunk,offset);offset+=chunk.length;}
      }else return fail();
      total+=data.length;if(data.length!==e.expanded||total>TEXT_MAX||crc32(data)!==e.crc)return fail();
      return decoder.decode(data);
    }
    if((await read('mimetype')).trim()!=='application/epub+zip')return fail();
    const container=xml(await read('META-INF/container.xml'));
    const packagePath=elements(container,'rootfile')[0]?.getAttribute('full-path');
    if(!packagePath||!files.has(packagePath))return fail();
    const pkg=xml(await read(packagePath)),manifest=new Map();
    for(const item of elements(pkg,'item'))manifest.set(item.getAttribute('id'),item);
    const sections=[];
    for(const ref of elements(pkg,'itemref')){
      const item=manifest.get(ref.getAttribute('idref'));if(!item)return fail();
      if(item.getAttribute('media-type')!=='application/xhtml+xml')continue;
      const doc=xml(await read(path(packagePath,item.getAttribute('href'))));
      const body=elements(doc,'body')[0];if(!body)return fail();
      let current={title:elements(doc,'title')[0]?.textContent?.trim()||'Section '+(sections.length+1),blocks:[]};
      function flush(){if(current.blocks.length){sections.push(current);if(sections.length>COUNT_MAX)return fail();}}
      function visit(node){
        if(node.nodeType===3){if(node.nodeValue.trim())current.blocks.push({tag:'p',text:node.nodeValue.trim()});return;}
        if(node.nodeType!==1||blocked.has(node.localName))return;
        const tag=node.localName;
        if(tag==='img'){current.blocks.push({tag:'p',text:'[Image: '+(node.getAttribute('alt')||'see original book')+']'});return;}
        if(['h1','h2'].includes(tag)){
          const title=words(node).trim();if(!title)return;
          flush();current={title,blocks:[]};return;
        }
        if(['p','pre','blockquote','li','dt','dd','h3','h4','h5','h6'].includes(tag)){
          const text=words(node).trim();if(text)current.blocks.push({tag:/^h\d$/.test(tag)?'h4':tag==='pre'?'pre':'p',text});return;
        }
        for(const child of node.childNodes)visit(child);
      }
      visit(body);flush();
    }
    if(!sections.length)return fail();
    return {kind:'epub',numPages:sections.length,sections,destroy:async()=>{}};
  }
  root.EpubReader={load};
})(typeof window!=='undefined'?window:globalThis);
