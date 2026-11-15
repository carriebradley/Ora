/* Compose a continuous, date-aware service from a saved local prayer book.
 * Ordinary prayers are immutable. Dated hymns are inserted only between
 * unambiguous source headings; never guess or replace private PDF wording. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.LiturgyDocument=factory();
})(typeof self!=='undefined'?self:this,function(){
  'use strict';
  const labels={
    troparia:'Troparia and Kontakia',
    prokeimenon:'Prokeimenon',
    alleluia:'Alleluia',
    communion:'Communion Hymn'
  };
  const rules={
    troparia:{
      after:/^(?:Little Entrance|Entrance with the Gospel)$/i,
      before:/^Trisagion(?: Hymn| Prayer)?$/i,
      conflict:/^(?:Tropar(?:ion(?:s)?|ia)|Kontak(?:ion(?:s)?|ia)|Kondak(?:ion(?:s)?|ia))\b/i
    },
    prokeimenon:{
      after:/^Trisagion(?: Hymn| Prayer)?$/i,
      before:/^(?:Epistle|Epistle Reading|Apostle|Apostolic Reading)$/i,
      conflict:/^(?:Prokeimenon|Prokimenon)(?:\b.*)?$/i
    },
    alleluia:{
      after:/^(?:Epistle|Epistle Reading|Apostle|Apostolic Reading)$/i,
      before:/^(?:Gospel|Gospel Reading)$/i,
      conflict:/^Alleluia(?:\b.*)?$/i
    },
    communion:{
      after:/^(?:One is Holy|Prayer Before Holy Communion)$/i,
      before:/^(?:Holy Communion|Distribution of Holy Communion)$/i,
      conflict:/^(?:Communion Hymn|Communion Verse|Kinonikon)(?:\b.*)?$/i
    }
  };
  const isoPattern=/^2026-\d{2}-\d{2}$/;
  const sourceMonths=Object.freeze(['January','February','March','April','May','June',
    'July','August','September','October','November','December']);
  function validRecord(record,{church,iso,id,seasonal=false}={}){
    const expectedId=church==='ukrainian'?'chrysostom':church==='melkite'?'melkite-chrysostom':null;
    if(seasonal||!expectedId||id!==expectedId)return false;
    if(!record||record.church!==church||!isoPattern.test(iso||''))return false;
    if(church==='ukrainian')
      return record.source==='https://eeparchy.com/calendar/'+iso;
    if(church==='melkite')
      return record.iso===iso && record.source==='https://melkite.org/liturgical-resources' &&
        !!sourceMonths[Number(iso.slice(5,7))-1] &&
        record.typicon===sourceMonths[Number(iso.slice(5,7))-1]+'-2026.docx' &&
        !['2026-01-30','2026-12-24'].includes(iso);
    return false;
  }
  function headings(sections){
    const found=[];
    let n=0;
    sections.forEach((part,sectionIndex)=>{
      if(part.alternative)return;
      if(part.heading)found.push({text:String(part.heading).trim(),sectionIndex,lineIndex:-1,n:n++});
      (part.lines||[]).forEach((line,lineIndex)=>{
        found.push({text:String(line).trim(),sectionIndex,lineIndex,n:n++});
      });
    });
    return found;
  }
  function safeLines(lines){
    return Array.isArray(lines)&&lines.length>0&&lines.length<=40&&
      lines.every(line=>typeof line==='string'&&line.trim().length>0&&line.length<=1200&&
        !/[\u0400-\u052f\u0600-\u06ff]/u.test(line));
  }
  function displayLine(raw){
    return String(raw).replace(/^\s*(?:PROKIMENON|PROKEIMENON)\b/i,'Prokeimenon')
      .replace(/^\s*ALLELUIA\b/i,'Alleluia')
      .replace(/\s*\*\s*/g,' ')
      .replace(/\b(Tone\s+\d+)\)\)/gi,'$1)')
      .replace(/\.!(?=\s|$)/g,'!')
      .replace(/\s+([,.;:!?])/g,'$1')
      .replace(/\s{2,}/g,' ').replace(/\bgod\b/gi,'God').trim();
  }
  // A private saved book can be parsed independently of downloaded daily
  // hymns. Fetch only the selected church's verified dataset, with one shared
  // promise per church so the prayer reader and companion panel agree.
  const sourceFiles={ukrainian:'ukrainian-propers.json',melkite:'melkite-propers-2026.json'};
  const bookPromises={};
  async function loadRecord(church,iso){
    const filename=sourceFiles[church];
    if(!filename||!/^2026-\d{2}-\d{2}$/.test(iso||''))return null;
    if(!bookPromises[church]){
      bookPromises[church]=fetch('./'+filename,{cache:'no-store'})
        .then(res=>{if(!res.ok)throw new Error('Dated hymns unavailable');return res.json();})
        .catch(()=>{delete bookPromises[church];return null;});
    }
    const data=await bookPromises[church];
    if(data?.schema!==1)return null;
    const record=data.days?.[iso];
    const id=church==='ukrainian'?'chrysostom':'melkite-chrysostom';
    return validRecord(record,{iso,church,id})?record:null;
  }
  function compose(sections,record,context){
    const original=(sections||[]).map(part=>({...part,lines:[...(part.lines||[])]}));
    const remaining=Object.keys(labels).filter(key=>safeLines(record?.groups?.[key]));
    if(!validRecord(record,context))return {sections:original,placed:[],remaining:[]};
    const points=headings(original),insertions=new Map(),placed=[];
    for(const key of Object.keys(rules)){
      const lines=record?.groups?.[key];
      if(!safeLines(lines))continue;
      const rule=rules[key];
      const beginnings=points.filter(p=>rule.after.test(p.text));
      const endings=points.filter(p=>rule.before.test(p.text));
      if(beginnings.length!==1||endings.length!==1)continue;
      const start=beginnings[0],finish=endings[0];
      if(start.n>=finish.n||finish.n-start.n>120)continue;
      // Printed hymn headings can name a saint or tone, and may have a
      // minister prefix. Such existing words always occupy the slot.
      const collisions=points.filter(p=>p.n>start.n&&p.n<finish.n&&
        rule.conflict.test(p.text.replace(/^(?:(?:priest|deacon|dcn)(?:\s+\d+)?|all|people|choir|cantor|reader|lector|faithful|congregation)\s*:\s*/i,'')));
      // A printed, genuinely empty slot can accept the appointed words;
      // a heading with any intervening prayer text must remain untouched.
      const slotNames={
        troparia:/^Troparia(?:\s*(?:and|&)\s*Kontakia)?$/i,
        prokeimenon:/^(?:Prokeimenon|Prokimenon)$/i,
        alleluia:/^Alleluia$/i,
        communion:/^(?:Communion Hymn|Communion Verse|Kinonikon)$/i
      };
      const emptySlot=collisions.length===1&&slotNames[key].test(collisions[0].text)&&
        !points.some(p=>p.n>collisions[0].n&&p.n<finish.n);
      if(collisions.length&&!emptySlot)continue;
      // The source may not have an explicit place for a given hymn. In that
      // case preserve the original and leave that hymn in the daily panel.
      const item={dailyProper:key,heading:emptySlot?null:labels[key],lines:lines.map(displayLine)};
      const location=finish.sectionIndex+'|'+finish.lineIndex;
      if(!insertions.has(location))insertions.set(location,[]);
      insertions.get(location).push(item);
      placed.push(key);
    }
    if(!placed.length)return {sections:original,placed,remaining};
    const out=[];
    for(let i=0;i<original.length;i++){
      const part=original[i];
      const before=insertions.get(i+'|-1');
      if(before)out.push(...before);
      let heading=part.heading,buffer=[];
      const flush=()=>{
        if(heading||buffer.length)out.push({...part,heading,lines:buffer});
        buffer=[];heading=null;
      };
      for(let line=0;line<part.lines.length;line++){
        const at=insertions.get(i+'|'+line);
        if(at){flush();out.push(...at);}
        buffer.push(part.lines[line]);
      }
      flush();
    }
    return {sections:out,placed,remaining:remaining.filter(key=>!placed.includes(key))};
  }
  return {compose,labels,validRecord,displayLine,loadRecord};
});
