/* Display-only formatting for private local books; contains no liturgical texts. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.LiturgicalFormat=factory();})(typeof self!=='undefined'?self:this,function(){
 const titles=['Divine Liturgy of St. John Chrysostom','The Litany of Peace','The Order of Antiphons','The Ektene','First Antiphon','Second Antiphon','Third Antiphon','The Kairos Service','Prayers Before the Holy Doors','Liturgy of the Word','Liturgy of the Eucharist','Blessing','Great Litany','Litany of Peace','Small Litany','First Antiphon','Second Antiphon','Third Antiphon','Entrance Antiphon','Entrance with the Gospel','Little Entrance','Great Entrance','Prayer of Entrance','Trisagion Hymn','Trisagion Prayer','Prayer of the Trisagion','Only-Begotten Son','Cherubic Hymn','Prayer Before the Gospel','Prayer for the Faithful','Troparia','Troparia & Kontakia','Creed','Symbol of Faith','Prayer of the Cherubic Hymn','Litany for the Gifts','Anaphora','Holy Anaphora','Confession of Love','Thanksgiving','Remembrance','Epiclesis','The Lord’s Prayer','One is Holy','Communion Hymn','Prayer Before Holy Communion','Holy Communion','Blessing with the Holy Gifts','Prayer of Thanksgiving','Prayer Behind the Ambo','Dismissal'];
 const compact=s=>String(s).replace(/[^a-z]/gi,'').toLowerCase(),heads=new Map(titles.map(t=>[compact(t),t]));
 heads.set(compact('The Divine and Holy Liturgy of Saint John Chrysostom'),'Divine Liturgy of St. John Chrysostom');
 function normalize(text){const s=String(text||'').replace(/[\u2002-\u200a\u202f]/g,' ').replace(/\u00ad/g,'').replace(/\s+/g,' ').trim();return heads.get(compact(s))||s;}
 function heading(text){return heads.has(compact(text))||/^Antiphon:\s*Psalm\s*\d+$/i.test(text);}
 function role(text){
  const m=String(text).match(/^\s*(?:the\s+)?(PRIEST(?:\s*\d+)?(?:\s+AND\s+DEACON)?|CELEBRANT|BISHOP|DEACON|DCN\s*\d*|PROTODEACON|ALL|PEOPLE|FAITHFUL|CONGREGATION|CHOIR|CLERGY|READER|LECTOR|VERSE|CANTOR|SUBDEACON|SERVER|ACOLYTE)(?:\s*\(([^)]+)\)|\s*,\s*(quietly|silently|aloud))?\s*:\s*(.*)$/i);if(!m)return null;
  const label=m[1].toUpperCase(),kind=/AND/.test(label)||label==='CLERGY'?'clergy':/^(?:PRIEST|CELEBRANT|BISHOP)/.test(label)?'priest':/^(?:DEACON|DCN|PROTODEACON)/.test(label)?'deacon':/^(?:ALL|PEOPLE|FAITHFUL|CONGREGATION)$/.test(label)?'all':'other';
  const name=label==='PRIEST AND DEACON'?'Priest and Deacon':kind==='priest'?(/BISHOP/.test(label)?'Bishop':'Priest'):kind==='deacon'?'Deacon':label[0]+label.slice(1).toLowerCase();
  return {kind,name,words:m[4].trim(),...(m[2]||m[3]?{cue:(m[2]||m[3]).trim()}: {})};
 }
 function speakerInstruction(text){
  const m=String(text).match(/^(?:the )?(priest(?:\s+and\s+(?:the\s+)?deacon)?|deacon|bishop|reader|cantor|choir|subdeacon|server|acolyte)\s+(?:[^:]*?\s+)?(?:says?|saying|prays?|praying|recites?|reciting|proclaims?|proclaiming|exclaims?|exclaiming)\s*(?:\([^)]*\))?\s*:\s*$/i);
  return m?role(m[1].replace(/\s+and\s+the\s+/i,' and ')+':'):null;
 }
 // Preserve parallel alternatives as separate columns; never interleave prayers.
 function pdfRows(items,page){
  const rows=new Map();
  for(const item of items){
   const text=normalize(item.str);if(!text)continue;
   const x=Number(item.transform?.[4]||0),y=Number(item.transform?.[5]||0),key=Math.round(y*2)/2;
   if(!rows.has(key))rows.set(key,[]);rows.get(key).push({x,text,width:Number(item.width)||0,height:Number(item.height)||12});
  }
  const sorted=[...rows.entries()].sort((a,b)=>b[0]-a[0]).map(([y,parts])=>({y,parts:parts.sort((a,b)=>a.x-b.x)}));
  const header=sorted.find(row=>/Sunday.*Ordinary.*Weekday.*Ordinary/i.test(row.parts.map(p=>p.text).join(' ')));
  const right=header?.parts.find(p=>/\bWeekday\b/i.test(p.text));
  if(!right)return sorted.map(row=>({text:row.parts.map(p=>p.text).join(' '),y:row.y,page,height:Math.max(...row.parts.map(p=>p.height))}));
  const cut=right.x-8,out=[],left=[],rightRows=[];let columns=false;
  const flush=()=>{out.push(...left,...rightRows);left.length=rightRows.length=0;};
  for(const row of sorted){
   if(row===header)columns=true;
   const l=row.parts.filter(p=>p.x<cut),r=row.parts.filter(p=>p.x>=cut);
   const spans=l.some(p=>p.width&&p.x+p.width>cut+12);
   if(columns&&spans&&!r.length){flush();columns=false;}
   const make=parts=>({text:parts.map(p=>p.text).join(' '),y:row.y,page,height:Math.max(...parts.map(p=>p.height))});
   if(columns){if(l.length)left.push({...make(l),alternative:'sunday'});if(r.length)rightRows.push({...make(r),alternative:'weekday'});}
   else out.push(make(row.parts));
  }
  flush();return out;
 }
 function instruction(text){
  const s=String(text||'').trim();if(!s||role(s))return false;
  if(/^(?:rubric|instructions?|note):/i.test(s))return true;
  // Ceremonial instructions printed in the Melkite 2009 source can start
  // with participles or with a pronoun rather than "The priest".
  if(/^(?:when the time comes for celebrating|bowing his uncovered head|blessing the deacon|l ifting the holy gospel|lifting the holy gospel|he (?:kisses|uncovers|replaces|bows|takes|turns|enters|leaves)|they (?:bow|enter|stand|make|return|revere|proceed)|it is permitted to chant|following the homily|during the distribution of the antidoron|the following (?:hymn|petitions|prayer)|on the feasts of the lord)\b/i.test(s))return true;
  if(/^the (?:priest|deacon|bishop) and (?:the )?(?:priest|deacon|bishop)(?: on his (?:right|left))? (?:stand|bow|uncover|raise|say|enter|turn|kneel)\b/i.test(s))return true;
  // Episcopal ceremony notes are directions, not prayers or responses.
  if(/^(?:the (?:first|second|third) (?:protopresbyter|concelebrant)|having received the blessing|the bishop (?:elevating|holding|raising)|the (?:priest|deacon|bishop)\s*,\s*(?:raising|holding|turning)|singing, crying, exclaiming and saying|the (?:protodeacon|deacon) opens the royal doors)\b/i.test(s))return true;
  if(/^[([](?:stand|sit|kneel|bow|quietly|silently|aloud|repeat|all stand|the priest|the deacon)\b/i.test(s))return true;
  if(/^(?:the |a |an )?(?:priest|deacon|protodeacon|bishop|celebrant|server|reader|cantor|choir|people|faithful|congregation|clergy|concelebrants|subdeacon|acolyte)\s+(?:then\s+|now\s+)?(?:stands?|sits?|kneels?|bows?|turns?|takes?|makes?|offers?|sings?|chants?|says?|prays?|recites?|enters?|exits?|proceeds?|raises?|continues?|responds?|places?|opens?|closes?|incenses?|censes?|blesses?|kisses?|holds?|lifts?|moves?|faces?|approaches?|departs?|receives?|distributes?|reads?|begins?|repeats?|goes?|comes?|removes?|puts?|washes?|covers?|uncovers?|pours?|carries?|gives?|hands?|returns?|walks?|crosses?)\b/i.test(s))return true;
  if(/^(?:during|after|before|while|when|then|meanwhile|at this point|at the conclusion|as the|following the|if the|once the)\s+(?:the |this |these |a |an )?(?:priest|deacon|bishop|celebrant|litany|hymn|prayer|entrance|gospel|people|choir|faithful|clergy|singing|chanting|reading|communion|gifts|service|troparion|antiphon|procession|holy doors|royal doors)\b/i.test(s))return true;
  return /^(?:on Sundays|on weekdays|on feast days|on great feasts|if there is|instead of|the royal doors|the holy doors|the iconostasis|the following prayer is|this prayer is)\b/i.test(s);
 }
 function combine(lines){
  const out=[];let current='',last=null;
  const flush=()=>{if(current)out.push(current);current='';};
  for(let i=0;i<lines.length;i++){
   const raw=lines[i];let text=normalize(typeof raw==='string'?raw:raw.text);
   if(!text){flush();last=null;continue;}
   if(/^\d{1,4}$/.test(text)||/^Episcopal Divine Liturgy 2012 WEB|^Layout 1|^Page \d+/i.test(text)||/^THE END OF THE DIVINE LITURGY$/i.test(text)||/^OF ST\. JOHN CHRYSOSTOM$/i.test(text))continue;
   // Repair only a known heading, including one split over two PDF rows.
   let candidate=text;
   for(let count=1;count<=5&&i+count<lines.length;count++){
    const next=lines[i+count];candidate+=' '+(typeof next==='string'?next:next.text);
    const key=compact(candidate),joined=heads.get(key);
    if(joined){text=joined;i+=count;break;}
    if(![...heads.keys()].some(h=>h.startsWith(key)))break;
   }
   const gap=last&&typeof raw==='object'&&last.page===raw.page&&Number.isFinite(last.y)&&Number.isFinite(raw.y)?last.y-raw.y:0;
   // A rubric ending in ':' introduces spoken words in the next paragraph.
   // Never let the prayer be swallowed into the hidden instruction.
   const followsRubric=/[:：]\s*$/.test(current)&&instruction(current)&&!instruction(text)&&!role(text);
   if(followsRubric||/^(?:Sunday|Weekday)\s*\(Ordinary\)/i.test(text)||heading(text)||role(text)||instruction(text)||(gap>Math.max(20,(raw.height||12)*1.7)&&!/^(?:BISHOP|PRIEST(?:\s*\d+)?|DEACON|DCN(?:\s*\d+)?|ALL|CHOIR|CLERGY):\s*$/i.test(current)))flush();
   if(!current)current=text;
   else if(/[-\u2010]$/.test(current)&&/^[a-z]/.test(text))current=current.slice(0,-1)+text;
   else current+=' '+text;
   if(heading(text)||/^(?:Sunday|Weekday)\s*\(Ordinary\)/i.test(text))flush();last=typeof raw==='object'?raw:null;
  }
  flush();return out;
 }
 return {normalize,heading,role,speakerInstruction,pdfRows,instruction,combine};
});
