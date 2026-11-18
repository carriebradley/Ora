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
  // Exact printed title variants already recognized by the source formatter.
  // Their structural aliases never rewrite any displayed heading or prayer.
  const sourceHeadingAliases=new Map([
    ['The Trisagion Hymn','Trisagion Hymn'],
    ['The Holy Gospel','Gospel']
  ].map(([printed,short])=>[printed.toLocaleLowerCase('en'),short]));
  function headingAnchor(value){
    const text=String(value).trim();
    return sourceHeadingAliases.get(text.toLocaleLowerCase('en'))||text;
  }
  function headings(sections){
    const found=[];
    let n=0;
    sections.forEach((part,sectionIndex)=>{
      if(part.alternative)return;
      if(part.heading)found.push({text:String(part.heading).trim(),anchor:headingAnchor(part.heading),sectionIndex,lineIndex:-1,n:n++});
      (part.lines||[]).forEach((line,lineIndex)=>{
        found.push({text:String(line).trim(),anchor:headingAnchor(line),sectionIndex,lineIndex,n:n++});
      });
    });
    return found;
  }
  function safeLines(lines){
    return Array.isArray(lines)&&lines.length>0&&lines.length<=40&&
      lines.every(line=>typeof line==='string'&&line.trim().length>0&&line.length<=1200&&
        !/[\u0400-\u052f\u0600-\u06ff]/u.test(line)&&
        !/^Kondakion of the Ointment-Bearing women \(Tone 2\): Trisagion or Instead of the Trisagion(?:\s*:|\s+[“"])/i.test(line));
  }
  // Dated source lines saying "Instead of..." designate replacements for
  // particular fixed prayers. Until the precise slot can be authenticated
  // against the saved edition, display these hymns in the dated companion
  // section rather than inserting them beside the unchanged fixed prayer.
  function hasFeastSubstitution(lines){
    return Array.isArray(lines)&&lines.some(line=>
      typeof line==='string'&&/^\s*Instead of\b/i.test(line));
  }
  function properLabel(key,lines){
    return (labels[key]||key)+(hasFeastSubstitution(lines)?' · Includes feast substitutions':'');
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
    // Retain the verified Newton 2009 edition identity after adding dated
    // hymns. The continuous reader uses it to hide annual reference tables.
    const preserveEdition=items=>{
      if(sections?.newton2009===true)items.newton2009=true;
      if(sections?.edmonton2012===true)items.edmonton2012=true;
      return items;
    };
    const original=preserveEdition((sections||[]).map(part=>({...part,lines:[...(part.lines||[])]})));
    const remaining=Object.keys(labels).filter(key=>safeLines(record?.groups?.[key]));
    if(!validRecord(record,context))return {sections:original,placed:[],remaining:[]};
    const points=headings(original),insertions=new Map(),placed=[];
    // A later major part appearing before an earlier one means PDF heading
    // extraction is ambiguous. Preserve the local prayer book and leave its
    // dated hymns in the supplemental panel rather than guess at placement.
    const milestones=[
      [/^(?:Little Entrance|Entrance with the Gospel)$/i,10],
      [/^Trisagion(?: Hymn| Prayer)?$/i,20],
      [/^(?:Epistle|Epistle Reading|Apostle|Apostolic Reading)$/i,30],
      [/^(?:Gospel|Gospel Reading)$/i,40],
      [/^(?:Liturgy of the Eucharist|Great Entrance)$/i,50],
      [/^(?:Anaphora|Holy Anaphora)$/i,60],
      [/^(?:One is Holy|Prayer Before Holy Communion)$/i,70],
      [/^(?:Holy Communion|Distribution of Holy Communion)$/i,80],
      [/^Dismissal$/i,90]
    ];
    let latestStage=0;
    for(const point of points){
      const match=milestones.find(([pattern])=>pattern.test(point.anchor));
      if(!match)continue;
      if(match[1]<latestStage)return {sections:original,placed:[],remaining};
      latestStage=match[1];
    }
    for(const key of Object.keys(rules)){
      const lines=record?.groups?.[key];
      if(!safeLines(lines)||hasFeastSubstitution(lines))continue;
      const rule=rules[key];
      const beginnings=points.filter(p=>rule.after.test(p.anchor));
      const endings=points.filter(p=>rule.before.test(p.anchor));
      if(beginnings.length!==1||endings.length!==1)continue;
      const start=beginnings[0],finish=endings[0];
      if(start.n>=finish.n||finish.n-start.n>120)continue;
      // Never split a printed fixed prayer or the bare speaker cue
      // introducing its next line. Leave this dated group separate instead.
      const between=points.filter(p=>p.n>start.n&&p.n<finish.n);
      const protectedPrayer=/^(?:(?:The\s+)?Trisagion Prayer of St\.?\s+(?:John Chrysostom|Basil the Great)|(?:The\s+)?Prayer (?:of the Trisagion|Before the Gospel|Before Holy Communion|of the Cherubic Hymn|for the Faithful)|(?:The\s+)?(?:Great Litany|Litany of Peace|Small Litany)|(?:Holy\s+)?Anaphora)$/i;
      const unfinishedCue=/^(?:(?:PRIEST|CELEBRANT|BISHOP|DEACON|PROTODEACON|DCN|ALL|PEOPLE|CHOIR|READER|CANTOR)(?:\s+\d+)?(?:\s+AND\s+DEACON)?\s*:\s*|(?:The\s+)?(?:priest|deacon|bishop|reader|choir)\b[^:]{0,120}\b(?:says?|prays?|chants?|sings?|proclaims?|recites?|exclaims?)\s*:\s*)$/i;
      if(between.some(p=>protectedPrayer.test(p.text))||
         unfinishedCue.test(points[finish.n-1]?.text||''))continue;
      // Printed hymn headings can name a saint or tone, and may have a
      // minister prefix. Such existing words always occupy the slot.
      const printedWords=text=>text.replace(
        /^(?:(?:priest|deacon|dcn)(?:\s+\d+)?|all|people|choir|cantor|reader|lector|faithful|congregation)\s*:\s*/i,'');
      const isPrintedHymn=text=>rule.conflict.test(printedWords(text));
      const collisions=points.filter(p=>p.n>start.n&&p.n<finish.n&&isPrintedHymn(p.text));
      // The same variable hymn may already be printed elsewhere in the book.
      // For Alleluia, distinguish an appointed heading from a spoken cheer
      // such as "ALL: Alleluia!" outside the Gospel-acclamation slot.
      const outsideMatches=text=>isPrintedHymn(text)&&
        (key!=='alleluia'||/^Alleluia(?:$|:|[,\s-]+(?:Tone\s+\d+|Verses?|Hymn|Psalm)\b)/i.test(printedWords(text)));
      if(points.some(p=>(p.n<start.n||p.n>finish.n)&&outsideMatches(p.text)))continue;
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
    return {sections:preserveEdition(out),placed,remaining:remaining.filter(key=>!placed.includes(key))};
  }
  return {compose,labels,validRecord,displayLine,loadRecord,hasFeastSubstitution,properLabel};
});
