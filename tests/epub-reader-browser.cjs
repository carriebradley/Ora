const assert=require('node:assert/strict'),{deflateRawSync}=require('node:zlib');
function crc32(data){let c=0xffffffff;for(const b of data){c^=b;for(let i=0;i<8;i++)c=(c>>>1)^((c&1)?0xedb88320:0);}return(c^0xffffffff)>>>0;}
function epub(encrypted=false){
 const files={mimetype:'application/epub+zip','META-INF/container.xml':'<container xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="book/content.opf"/></rootfiles></container>',
 'book/content.opf':'<package xmlns="http://www.idpf.org/2007/opf"><manifest><item id="a" href="one.xhtml" media-type="application/xhtml+xml"/><item id="b" href="two.xhtml" media-type="application/xhtml+xml"/></manifest><spine><itemref idref="a"/><itemref idref="b"/></spine></package>',
 'book/one.xhtml':'<!DOCTYPE html><html xmlns="http://www.w3.org/1999/xhtml"><head><title>Book</title></head><body><h1>Opening prayers</h1><p>Original wording&nbsp;and responses.</p><script>window.epubExecuted=true;fetch("https://epub-invalid.example/attack")</script><img src="https://epub-invalid.example/image" alt="Book illustration"/></body></html>',
 'book/two.xhtml':'<html xmlns="http://www.w3.org/1999/xhtml"><head><title>Second</title></head><body><h1>Thanksgiving</h1><p>Searchable prayer after communion.</p></body></html>'};
 if(encrypted)files['META-INF/encryption.xml']='<encryption/>';
 const chunks=[],central=[];let offset=0;
 for(const [name,text] of Object.entries(files)){
  const n=Buffer.from(name),data=Buffer.from(text),zip=deflateRawSync(data),crc=crc32(data);
  const h=Buffer.alloc(30);h.writeUInt32LE(0x04034b50);h.writeUInt16LE(20,4);h.writeUInt16LE(8,8);h.writeUInt32LE(crc,14);h.writeUInt32LE(zip.length,18);h.writeUInt32LE(data.length,22);h.writeUInt16LE(n.length,26);
  chunks.push(h,n,zip);const c=Buffer.alloc(46);c.writeUInt32LE(0x02014b50);c.writeUInt16LE(20,4);c.writeUInt16LE(20,6);c.writeUInt16LE(8,10);c.writeUInt32LE(crc,16);c.writeUInt32LE(zip.length,20);c.writeUInt32LE(data.length,24);c.writeUInt16LE(n.length,28);c.writeUInt32LE(offset,42);central.push(c,n);offset+=h.length+n.length+zip.length;
 }
 const directory=Buffer.concat(central),end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50);end.writeUInt16LE(Object.keys(files).length,8);end.writeUInt16LE(Object.keys(files).length,10);end.writeUInt32LE(directory.length,12);end.writeUInt32LE(offset,16);
 return Buffer.concat([...chunks,directory,end]);
}
module.exports=async(page,context,base,artifacts,violations)=>{
 const uploads=[],remote=[];const watch=r=>{if(['POST','PUT','PATCH'].includes(r.method()))uploads.push(r.url());if(r.url().includes('epub-invalid.example'))remote.push(r.url());};page.on('request',watch);
 await page.goto(`${base}index.html?tab=liturgy&date=2026-11-12&rite=byz`);
 await page.locator('[data-act="liturgyview"][data-v="byz"]').click();
 await page.locator('.reader-offline > summary').click();
 await page.locator('#liturgical-file').setInputFiles({name:'private-test.epub',mimeType:'application/epub+zip',buffer:epub()});
 await page.waitForFunction(()=>document.querySelector('.reader-status')?.textContent.includes('2 sections'));
 await page.locator('[data-reader="open"]').click();
 await page.waitForFunction(()=>document.querySelector('#reader-status')?.textContent==='Section 1 of 2');
 assert.match(await page.locator('#reader-text').innerText(),/Original wording\s+and responses/);
 assert.equal(await page.evaluate(()=>!!window.epubExecuted),false);
 assert.equal(await page.locator('#reader-text script, #reader-text img').count(),0);
 await page.locator('#reader-search').fill('communion');
 assert.equal(await page.locator('#reader-section option').count(),1);
 await page.selectOption('#reader-section','2');
 await page.waitForFunction(()=>document.querySelector('#reader-status')?.textContent==='Section 2 of 2');
 assert.match(await page.locator('#reader-text').innerText(),/Thanksgiving/);
 await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
 const audit=await page.evaluate(()=>axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}}));
 violations.push(...audit.violations.map(v=>({tab:'private-epub',id:v.id,examples:v.nodes.map(n=>({html:n.html,summary:n.failureSummary}))})));
 await page.locator('[data-reader="close"]').click();
 page.once('dialog',d=>d.accept());
 await page.locator('#liturgical-file').setInputFiles({name:'encrypted.epub',mimeType:'application/epub+zip',buffer:epub(true)});
 await page.waitForFunction(()=>document.querySelector('.reader-status')?.textContent.includes('previous text is unchanged'));
 const corrupt=epub();corrupt[40]^=255;
 const rejected=await page.evaluate(async bytes=>{try{await EpubReader.load(new Blob([new Uint8Array(bytes)]));return false;}catch(_){return true;}},Array.from(corrupt));assert.equal(rejected,true);
 await page.evaluate(async()=>{await navigator.serviceWorker.ready;});await context.setOffline(true);
 await page.reload();await page.waitForFunction(()=>!document.querySelector('[data-reader="open"]').disabled);
 await page.locator('.reader-offline > summary').click();await page.locator('[data-reader="open"]').click();
 await page.waitForFunction(()=>document.querySelector('#reader-status')?.textContent==='Section 2 of 2');
 assert.match(await page.locator('#reader-text').innerText(),/communion/);
 await page.locator('[data-reader="close"]').click();await context.setOffline(false);
 assert.deepEqual(uploads,[]);assert.deepEqual(remote,[]);page.off('request',watch);
 console.log('Private EPUB: compressed XHTML, search, bookmarks, offline, inert markup, invalid replacement and no uploads passed.');
};
