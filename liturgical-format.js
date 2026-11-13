/* Display-only formatting for private local books; contains no liturgical texts. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.LiturgicalFormat=factory();})(typeof self!=='undefined'?self:this,function(){
 const titles=['The Kairos Service','Prayers Before the Holy Doors','Liturgy of the Word','Liturgy of the Eucharist','Blessing','Great Litany','Litany of Peace','Small Litany','First Antiphon','Second Antiphon','Third Antiphon','Entrance Antiphon','Entrance with the Gospel','Little Entrance','Great Entrance','Prayer of Entrance','Trisagion Hymn','Trisagion Prayer','Prayer of the Trisagion','Only-Begotten Son','Cherubic Hymn','Prayer Before the Gospel','Prayer for the Faithful','Troparia','Troparia & Kontakia','Creed','Symbol of Faith','Prayer of the Cherubic Hymn','Litany for the Gifts','Anaphora','Holy Anaphora','Confession of Love','Thanksgiving','Remembrance','Epiclesis','The Lord’s Prayer','One is Holy','Communion Hymn','Prayer Before Holy Communion','Holy Communion','Blessing with the Holy Gifts','Prayer of Thanksgiving','Prayer Behind the Ambo','Dismissal'];
 const compact=s=>String(s).replace(/[^a-z]/gi,'').toLowerCase(),heads=new Map(titles.map(t=>[compact(t),t]));
 function normalize(text){const s=String(text||'').replace(/[\u2002-\u200a\u202f]/g,' ').replace(/\u00ad/g,'').replace(/\s+/g,' ').trim();return heads.get(compact(s))||s;}
 function heading(text){return heads.has(compact(text))||/^Antiphon:\s*Psalm\s*\d+$/i.test(text);}
 function role(text){
  const m=String(text).match(/^\s*(PRIEST(?:\s*\d+)?|CELEBRANT|BISHOP|DEACON|DCN\s*\d*|PROTODEACON|ALL|PEOPLE|FAITHFUL|CHOIR|CLERGY|READER|LECTOR|VERSE|CANTOR)\s*:\s*(.*)$/i);if(!m)return null;
  const label=m[1].toUpperCase(),kind=/^(?:PRIEST|CELEBRANT|BISHOP)/.test(label)?'priest':/^(?:DEACON|DCN|PROTODEACON)/.test(label)?'deacon':/^(?:ALL|PEOPLE|FAITHFUL)$/.test(label)?'all':'other';
  return {kind,name:kind==='priest'?(/BISHOP/.test(label)?'Bishop':'Priest'):kind==='deacon'?'Deacon':kind==='all'?'All':label[0]+label.slice(1).toLowerCase(),words:m[2].trim()};
 }
 function instruction(text){
  const s=String(text||'').trim();if(!s||role(s))return false;
  if(/^(?:rubric|instructions?|note):/i.test(s))return true;
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
   const next=lines[i+1],joined=next&&heads.get(compact(text+' '+(typeof next==='string'?next:next.text)));
   if(joined){text=joined;i++;}
   const gap=last&&typeof raw==='object'&&last.page===raw.page&&Number.isFinite(last.y)&&Number.isFinite(raw.y)?last.y-raw.y:0;
   if(heading(text)||role(text)||instruction(text)||(gap>Math.max(20,(raw.height||12)*1.7)&&!/^(?:BISHOP|PRIEST(?:\s*\d+)?|DEACON|DCN(?:\s*\d+)?|ALL|CHOIR|CLERGY):\s*$/i.test(current)))flush();
   if(!current)current=text;
   else if(/[-\u2010]$/.test(current)&&/^[a-z]/.test(text))current=current.slice(0,-1)+text;
   else current+=' '+text;
   if(heading(text))flush();last=typeof raw==='object'?raw:null;
  }
  flush();return out;
 }
 return {normalize,heading,role,instruction,combine};
});
