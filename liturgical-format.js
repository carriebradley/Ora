/* Display-only formatting for private local books; contains no liturgical texts. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.LiturgicalFormat=factory();})(typeof self!=='undefined'?self:this,function(){
 const titles=['The Holy Gospel','The Troparia & Kontakia','Divine Liturgy of St. John Chrysostom','The Litany of Peace','The Order of Antiphons','The Ektene','Prayer of the Ektene','First Antiphon','Second Antiphon','Third Antiphon','The Kairos Service','Prayers Before the Holy Doors','Liturgy of the Word','Liturgy of the Eucharist','Blessing','Great Litany','Litany of Peace','Small Litany','First Antiphon','Second Antiphon','Third Antiphon','Entrance Antiphon','Entrance with the Gospel','Little Entrance','Great Entrance','Prayer of Entrance','Trisagion Hymn','Trisagion Prayer','Prayer of the Trisagion','Only-Begotten Son','Cherubic Hymn','Prayer Before the Gospel','Prayer for the Faithful','Troparia','Troparia & Kontakia','Creed','Symbol of Faith','Prayer of the Cherubic Hymn','Litany for the Gifts','Litany of the Gifts','Prayer of Offering','Anaphora','Holy Anaphora','Confession of Love','Thanksgiving','Remembrance','Epiclesis','The Lord’s Prayer','One is Holy','Communion Hymn','Prayer Before Holy Communion','Preparation for Holy Communion','Holy Communion','Blessing with the Holy Gifts','Prayer of Thanksgiving','Prayer Behind the Ambo','Dismissal','Distribution of the Antidoron','The Aitesis'];
 const compact=s=>String(s).replace(/[^a-z]/gi,'').toLowerCase(),heads=new Map(titles.map(t=>[compact(t),t]));
 heads.set(compact('The Divine and Holy Liturgy of Saint John Chrysostom'),'Divine Liturgy of St. John Chrysostom');
 function normalize(text){const s=String(text||'').replace(/[\u2002-\u200a\u202f]/g,' ').replace(/\u00ad/g,'').replace(/\s+/g,' ').trim();
  // Source headings may carry unspoken parenthetical titles or voice directions.
  const key=compact(s);
  if(key==='theekteneecumenicpetitions')return 'The Ektene';
  if(key==='prayeroftheektenesaidquietlybythepriest')return 'Prayer of the Ektene';
  return heads.get(key)||s;}
 // Some Melkite editions print heading letters with tracking and omit spaces.
 heads.set(compact('The Trisagion Hymn'),'The Trisagion Hymn');
 // Device-only display cleanup for PDF extraction and chant typography.
 // Never rewrite the saved PDF or the underlying liturgical text. Asterisks
 // mark chant pauses; they are not words to be read in quiet prayer.
 // Do not flatten sentence punctuation, ellipses, verse citations or hymnal
 // accents. In particular, a hyphenated compound is never changed here.
 function displayPrayer(input){
  return String(input??'')
   .replace(/[\u200b\u200c\u200d\u2060\ufeff]/g,'')
   .replace(/[\u2002-\u200a\u202f]/g,' ')
   .replace(/\u00ad/g,'')
   // Font-substituted Wingdings blessing crosses and decorative diamonds
   // occur in the Newton 2009 source; they are never spoken prayer words.
   .replace(/[\u25a1\ufffd\uf058\uf076]/g,'')
   .replace(/\s*[*\u2217\uff0a]+\s*/g,' ')
   .replace(/\s+([,.;:!?])/g,'$1')
   .replace(/-\s*-\s*-\s*/g,'-')
   .replace(/\b(well)-\s*-\s*(being)\b/gi,'$1-$2')
   .replace(/\s*\(\s*(?:To\s+be\s+repeated\s+after\s+each\s+petition|Three\s+times(?:[\s\u00ad\u2010-\u2015-]*To\s+be\s+repeated\s+after\s+each\s+petition)?)\s*\.?\s*\)\s*$/i,'')
   .replace(/([(\u2018\u201c])\s+/g,'$1')
   .replace(/\s+([)\u2019\u201d])/g,'$1')
   .replace(/[ \t]{2,}/g,' ')
   .replace(/\bgod\b/gi,'God')
   .trim();
 }
 const LOWER_TITLE_WORDS=new Set(['of','the','and','in','on','at','to','for','from','with','by','after','before','as','or','a','an','de','du','des','la','le']);
 const TITLE_ACRONYMS=new Set(['US','UK','USA','USCCB','UGCC','OCA','ICEL','PDF','EPUB','NRSVCE','RSVCE','NABRE','NRSV','RSV','KJV','ESV','AD','BC','EU']);
 const TITLE_CAPS=/(?<![\p{L}])[\p{Lu}]{2,}(?:['’]\p{Lu}+)?(?:-\p{Lu}+)*(?![\p{L}])/gu;
 const TITLE_ROMAN=/^(?=[MDCLXVI]+$)M{0,4}(?:CM|CD|D?C{0,3})(?:XC|XL|L?X{0,3})(?:IX|IV|V?I{0,3})$/;
 // Display formatting only: normalize even an ALL-CAPS phrase followed by
 // mixed-case text, without changing proper names, acronyms, or Roman numerals.
 function displayTitle(input){
  const text=String(input??'');
  return text.replace(TITLE_CAPS,(word,offset)=>{
   if(TITLE_ACRONYMS.has(word)||TITLE_ROMAN.test(word))return word;
   const prefix=text.slice(0,offset).trimEnd(),atStart=!prefix||/[(:;.!?—–]$/.test(prefix);
   return word.toLocaleLowerCase('en').split('-').map((part,index)=>
    LOWER_TITLE_WORDS.has(part)&&!(atStart&&index===0)
     ?part:part.charAt(0).toLocaleUpperCase('en')+part.slice(1)
   ).join('-');
  });
 }
 function heading(text){return heads.has(compact(text))||/^Antiphon:\s*Psalm\s*\d+$/i.test(text);}
 function role(text){
  // Preserve direct speech following an editorial speaker cue. Otherwise the
  // rubric classifier hides the entire line, including the spoken prayer.
  // A bare cue ending at ':' remains a rubric for the following line.
  // A source stage cue may share a line with words actually spoken.
  // Only explicit voice verbs plus a colon and real words count as speech.
  const spoken=String(text).match(/^\s*(?:the\s+)?(priest|celebrant|bishop|deacon|protodeacon|reader|lector|cantor|choir|people|faithful|congregation|subdeacon|server|acolyte)(?:\s*,\s*[^:\r\n]{1,140},)?\s+(?:says?|prays?|recites?|proclaims?|exclaims?|sings?|chants?)(?:\s+(quietly|silently|aloud|in a low voice|in a loud voice))?\s*:\s*(\S.*)$/i);
  if(spoken){
   const minister=role(spoken[1]+':');
   if(minister)return {...minister,words:spoken[3].trim(),...(spoken[2]?{cue:spoken[2].trim()}: {})};
  }
  const m=String(text).match(/^\s*(?:the\s+)?(PRIEST(?:\s*\d+)?(?:\s+AND\s+DEACON)?|CELEBRANT|BISHOP|DEACON(?:\s*\d+)?|DCN\s*\d*|PROTODEACON|ALL|PEOPLE|FAITHFUL|CONGREGATION|CHOIR|CLERGY|READER|LECTOR|VERSE|CANTOR|SUBDEACON|SERVER|ACOLYTE)(?:\s*\(([^)]+)\)|\s*,\s*(quietly|silently|aloud))?\s*:\s*(.*)$/i);if(!m)return null;
  const label=m[1].toUpperCase(),kind=/AND/.test(label)||label==='CLERGY'?'clergy':/^(?:PRIEST|CELEBRANT|BISHOP)/.test(label)?'priest':/^(?:DEACON|DCN|PROTODEACON)/.test(label)?'deacon':/^(?:ALL|PEOPLE|FAITHFUL|CONGREGATION)$/.test(label)?'all':'other';
  const number=label.match(/\b\d+\b/)?.[0]||'';
  const name=label==='PRIEST AND DEACON'?'Priest and Deacon':kind==='priest'?(/BISHOP/.test(label)?'Bishop':'Priest')+(number?' '+number:''):kind==='deacon'?'Deacon'+(number?' '+number:''):label[0]+label.slice(1).toLowerCase();
  return {kind,name,words:m[4].trim(),...(m[2]||m[3]?{cue:(m[2]||m[3]).trim()}: {})};
 }
 function speakerInstruction(text){
  // Hide a bare directional cue but preserve its minister for the next line.
  const directional=String(text).match(/^\s*(?:the\s+)?(priest|celebrant|bishop|deacon|protodeacon|reader|lector|cantor|choir)\s*,\s*[^:\r\n]{1,140},\s+(?:says?|saying|prays?|praying|recites?|reciting|proclaims?|proclaiming|exclaims?|exclaiming|sings?|singing|chants?|chanting)\s*(?:(quietly|silently|aloud|in a low voice|in a loud voice))?\s*:\s*$/i);
  if(directional){
   const speaker=role(directional[1]+':');
   return directional[2]?{...speaker,cue:directional[2].trim()}:speaker;
  }
  const m=String(text).match(/^(?:the )?(priest(?:\s+and\s+(?:the\s+)?deacon)?|celebrant|deacon|protodeacon|bishop|reader|lector|cantor|choir|subdeacon|server|acolyte)\s+(?:[^:]*?\s+)?(?:says?|saying|prays?|praying|recites?|reciting|proclaims?|proclaiming|exclaims?|exclaiming|sings?|singing|chants?|chanting)\s*(?:(quietly|silently|aloud|in a low voice|in a loud voice)|\(([^)]*)\))?\s*:\s*$/i);
  if(!m)return null;
  const speaker=role(m[1].replace(/\s+and\s+the\s+/i,' and ')+':');
  const cue=m[2]||m[3];
  return cue?{...speaker,cue:cue.trim()}:speaker;
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
  if(speakerInstruction(s))return true; // bare spoken-word cue has no words yet
  // Short posture directions must never be read as prayers. Do not match
  // devotional sentences such as "Let us stand before You, O Lord."
  if(/^\(?\s*(?:(?:the\s+)?(?:all|everyone|people|congregation|faithful|clergy|choir|priest|deacon|bishop|celebrant|reader)\s+)?(?:(?:please|now)\s+)?(?:stand(?:\s+up)?|sit(?:\s+down)?|kneel|bow|rise|be seated|remain (?:standing|seated|kneeling))(?:\s+(?:for the (?:gospel|reading)|in silence|together))?\s*[.)]?$/i.test(s))return true;
  if(/^\(?\s*(?:stand|sit|kneel)\s*(?:or|\/)\s*(?:stand|sit|kneel)\s*[.)]?$/i.test(s))return true;
  if(/^(?:rubric|instructions?|note):/i.test(s))return true;
  if(/^\(\s*(?:said quietly by (?:the\s+)?priest|ecumenic petitions)\s*\)\s*:?$/i.test(s))return true;
  if(/^(?:the deacon, standing before the holy doors, takes the censer|the priest hands the deacon the holy gospel|the epistle reader, turning again to the altar, chants|then, turning to the people, the deacon proclaims)\b/i.test(s))return true;
  if(/^on the feasts of the nativity of our lord and the theophany, their octaves\b/i.test(s))return true;
  // The saved Melkite ordinary contains prose about which optional antiphons
  // to select. These are editorial explanations, not words to pray.
  if(/^For pastoral reasons, if only one Antiphon is done\b/i.test(s))return true;
  // Newton's alternative-petition selection and episcopal footnotes are directions.
  if(/^After the third petition, some other appropriate ecumenic petitions may be said\b/i.test(s))return true;
  if(/^(?:\*\s*)?In case there are guest Patriarchs or Bishops\b/i.test(s))return true;
  if(/^For Sundays and Commemorations of the Third Class\b/i.test(s))return true;
  // Edition-specific stage directions seen in the privately saved Melkite
  // liturgy; never treat the actual Trisagion words as a direction.
  if(/^(?:the deacon replaces his hat and intones|the priest unfolds the antimension|the choir and the celebrants alternate in singing|he proclaims:)(?:\b|\s|$)/i.test(s))return true;
  // Preserve explicitly labeled Arabic/Greek sung transliterations.
  // Ceremonial instructions printed in the Melkite 2009 source can start
  // with participles or with a pronoun rather than "The priest".
  if(/^(?:when the time comes for celebrating|bowing his uncovered head|blessing the deacon|l ifting the holy gospel|lifting the holy gospel|he (?:kisses|uncovers|replaces|bows|takes|turns|enters|leaves)|they (?:bow|enter|stand|make|return|revere|proceed)|it is permitted to chant|following the homily|during the distribution of the antidoron|the following (?:hymn|petitions|prayer)|on the feasts of the lord)\b/i.test(s))return true;
  if(/^the (?:priest|deacon|bishop) and (?:the )?(?:priest|deacon|bishop)(?: on his (?:right|left))? (?:stand|bow|uncover|raise|say|enter|turn|kneel)\b/i.test(s))return true;
  // Episcopal ceremony notes are directions, not prayers or responses.
  if(/^(?:the (?:first|second|third) (?:protopresbyter|concelebrant)|having received the blessing|the bishop (?:elevating|holding|raising)|the (?:priest|deacon|bishop)\s*,\s*(?:raising|holding|turning)|singing, crying, exclaiming and saying|the (?:protodeacon|deacon) opens the royal doors)\b/i.test(s))return true;
  if(/^[([](?:stand|sit|kneel|bow|quietly|silently|aloud|repeat|all stand|the priest|the deacon)\b/i.test(s))return true;
  if(/^(?:the |a |an )?(?:priest|deacon|protodeacon|bishop|celebrant|server|reader|lector|cantor|choir|people|faithful|congregation|clergy|concelebrants|subdeacon|acolyte)\s+(?:then\s+|now\s+)?(?:stands?|sits?|kneels?|bows?|turns?|takes?|makes?|offers?|sings?|chants?|says?|saying|prays?|praying|recites?|reciting|proclaims?|proclaiming|exclaims?|exclaiming|enters?|exits?|proceeds?|raises?|continues?|responds?|places?|opens?|closes?|incenses?|censes?|blesses?|kisses?|holds?|lifts?|moves?|faces?|approaches?|departs?|receives?|distributes?|reads?|begins?|repeats?|goes?|comes?|removes?|puts?|washes?|covers?|uncovers?|pours?|carries?|gives?|hands?|returns?|walks?|crosses?)\b/i.test(s))return true;
  if(/^(?:during|after|before|while|when|then|meanwhile|at this point|at the conclusion|as the|following the|if the|once the)\s+(?:the |this |these |a |an )?(?:priest|deacon|bishop|celebrant|litany|hymn|prayer|entrance|gospel|people|choir|faithful|clergy|singing|chanting|reading|communion|gifts|service|troparion|antiphon|procession|holy doors|royal doors)\b/i.test(s))return true;
  return /^(?:on Sundays|on weekdays|on feast days|on great feasts|if there is|instead of|the royal doors|the holy doors|the iconostasis|the following prayer is|this prayer is)\b/i.test(s);
 }
 // Daily source records sometimes include editorial selection directions.
 // Keep the actual hymns and repeated responses, but not directions such as
 // 'Instead of ... we sing:' in either fallback display path.
 function properPrayerLines(lines){
  return Array.isArray(lines)?lines.filter(line=>typeof line==='string'&&line.trim()&&!instruction(line)):[];
 }
 // English-only device-local display for bilingual Ukrainian PDFs.
 // Filter PDF items before merging coordinates: a single horizontal line
 // may contain Ukrainian on the left and English on the right.
 const CYRILLIC=/[\u0400-\u052f\u1c80-\u1c8f\u2de0-\u2dff\ua640-\ua69f]/u;
 const CYRILLIC_RUN=/[\u0400-\u052f\u1c80-\u1c8f\u2de0-\u2dff\ua640-\ua69f]+/gu;
 function englishPdfItems(items){
  const out=[];
  for(const item of items||[]){
   const text=String(item.str??'')
   // Two verified English spans in the 2012 Edmonton episcopal book use
   // Cyrillic look-alikes. Restore only these complete English words
   // before the Ukrainian-language filter removes Cyrillic text.
   .replace(/\u0422he\b/g,'The')
   .replace(/\bs\u0430\u0443s\b/g,'says');
   if(!CYRILLIC.test(text)){if(text.trim())out.push(text===item.str?item:{...item,str:text});continue;}
   // A PDF library may place both languages in one text item.
   // Retain only Latin fragments, without inventing a translation.
   const english=text.split(/\s+(?:\/|\||•)\s+|\r?\n|\t/).map(part=>{
    const clean=CYRILLIC.test(part)?part.replace(CYRILLIC_RUN,' '):part;
    return clean.replace(/^[\s,.;:—–-]+|[\s,;:—–-]+$/g,'').trim();
   }).filter(part=>/[A-Za-z]{2}/.test(part)&&
    !/^(?:priest|bishop|deacon|dcn|all|people|choir|cantor|reader|verse)(?:\s+\d+)?\s*:?$/i.test(part));
   const str=english.join(' ').trim();
   if(str)out.push({...item,str});
  }
  return out;
 }
 // Facing-page PDFs sometimes combine two printed folios on one row (10 11).
 // Ignore those standalone numbering lines without deleting verse citations.
 function pdfFolioLine(text){
  return /^\d{1,4}(?:\s+\d{1,4})?$/.test(String(text||'').trim());
 }
 function combine(lines){
  const out=[];let current='',last=null;
  const flush=()=>{if(current)out.push(current);current='';};
  for(let i=0;i<lines.length;i++){
   const raw=lines[i];let text=normalize(typeof raw==='string'?raw:raw.text);
   if(!text){flush();last=null;continue;}
   // Some printed minister cues prefix the spoken doxology. Strip only
   // the editorial cue, not the prayer that follows its colon.
   text=text.replace(/^He proclaims:\s+(?=\S)/i,'');
   if(pdfFolioLine(text)||/^Episcopal Divine Liturgy 2012 WEB|^Layout 1|^Page \d+/i.test(text)||/^THE END OF THE DIVINE LITURGY$/i.test(text)||/^OF ST\. JOHN CHRYSOSTOM$/i.test(text))continue;
   if(/^[\s_\-\u2013\u2014]{8,}$/.test(text))continue;
   text=text.replace(/\s*_{8,}(?:\s*_{8,})*$/,'').trim();
   if(!text)continue;
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
   // PDF vertical spacing is not a paragraph boundary when a lowercase
   // continuation completes the same prayer sentence.
   const continuesSentence=!!current&&!/[.!?;:]\s*[”’"']?$/.test(current.trim())&&/^[a-z]/.test(text);
   if(followsRubric||/^(?:Sunday|Weekday)\s*\(Ordinary\)/i.test(text)||heading(text)||role(text)||instruction(text)||(gap>Math.max(20,(raw.height||12)*1.7)&&!continuesSentence&&!/^(?:BISHOP|PRIEST(?:\s*\d+)?|DEACON(?:\s*\d+)?|DCN(?:\s*\d+)?|ALL|CHOIR|CLERGY):\s*$/i.test(current)))flush();
   if(!current)current=text;
   // Keep a printed hard hyphen: without the source typography we cannot
   // distinguish a wrapped compound (Only-begotten) from a divided word.
   // Discretionary soft hyphens are removed by normalize().
   else if(/[-\u2010]$/.test(current)&&/^[a-z]/.test(text))current+=text;
   else current+=' '+text;
   if(heading(text)||/^(?:Sunday|Weekday)\s*\(Ordinary\)/i.test(text))flush();last=typeof raw==='object'?raw:null;
  }
  flush();return out;
 }
 // Source-verified boundaries in Newton's 2009 Chrysostom ordinary.
 // The printed year tables are reference material, but the two Trisagion
 // prayers following the Kontakia table are genuine liturgical alternatives.
 function melkiteReferenceBoundary(text){
  const s=normalize(text);
  if(/^The celebrant\(s\) alternate with the Choir\b/i.test(s)||
     /^Table of Kontakia for the Year\b/i.test(s))return 'kontakia-start';
  if(/^The Trisagion Prayer of St\.? (?:John Chrysostom|Basil the Great)\b/i.test(s))
    return 'kontakia-end';
  if(/^Apolyses for the (?:Fixed|Movable) Feasts\b/i.test(s))return 'apolyses-start';
  // Tracked display letters in Newton's printed heading are not prayer text.
  if(compact(s)==='distributionoftheantidoron')return 'apolyses-end';
  if(/^Table of Hirmoi for the Year\b/i.test(s))return 'hirmoi-start';
  if(/^During the singing of the Hirmos, the Priest continues\b/i.test(s))
    return 'hirmoi-end';
  return null;
 }

 // Newton 2009 Aitesis: one printed answer is prescribed after all six
 // petitions. Expand only when the unmodified, recognized edition contains
 // the unique heading, original rubric, five subsequent petitions and close.

 // In Newton 2009 (PDF pp. 78-79), the first answer is printed once
 // and explicitly prescribed after every subsequent petition. Only the
 // two mandatory petitions preceding the shaded Optional block are
 // unambiguous. Do not automatically appoint or expand optional petitions.

 // The Litany of the Gifts (Newton 2009 PDF p. 67) has exactly one
 // unambiguous required petition after its printed Lord-have-mercy cue.
 // The shaded Optional section is a different selection; never infer
 // responses or appointments for those extra petitions.

 // Newton 2009 PDF pp. 58-59: the Ektene prescribes a threefold response
 // after each petition. Four middle petitions may be replaced by alternatives.
 // Render the printed default sequence only after exact source verification,
 // without assigning responses to any unverified alternatives.

 // The Newton 2009 Litany of Peace prints the Lord-have-mercy response
 // once, prescribing it after every petition. The tenth following
 // petition ends before the distinct "To You, O Lord" commendation.
 // Never apply this source-specific expansion to an altered petition list.

 // In the recognized Newton 2009 edition (Gifts p. 67; Communion p. 79),
 // only the explicitly marked optional petition blocks are alternate material.
 // Identify them by entire section, exact opening label, every printed
 // optional petition and next mandatory heading. Return display coordinates;
 // never erase or mutate source paragraphs.
 function newtonOptionalPetitions(sections){
  const starts=new Set(),lines=new Set(),result={starts,lines};
  if(!Array.isArray(sections)||sections.newton2009!==true)return result;
  const entries=sections.flatMap((part,section)=>(part.lines||[])
   .map((raw,index)=>({text:String(raw).trim(),section,index})));
  const key=row=>row.section+':'+row.index;
  const rules=[
   {head:'litanyofthegifts',end:'prayerofoffering',expected:[
    /^for\s+this\s+holy\s+house\s+and\s+those\s+who\s+enter\s+it\s+with\s+faith\b/i,
    /^for\s+our\s+deliverance\s+from\s+all\s+affliction\b/i,
    /^help\s+us,\s*save\s+us,\s*have\s+mercy\s+on\s+us\s+and\s+protect\s+us\b/i
   ],trailer:/^the\s+priest\s+prays\s+the\s+following\s+prayer\s*:?$/i},
   {head:'preparationforholycommunion',end:'theaitesis',expected:[
    /^for\s+our\s+deliverance\s+from\s+all\s+affliction\b/i,
    /^help\s+us,\s*save\s+us,\s*have\s+mercy\s+on\s+us\s+and\s+protect\s+us\b/i
   ]}
  ];
  for(const rule of rules){
   const heads=entries.map((r,i)=>compact(r.text)===rule.head?i:-1).filter(i=>i>=0);
   if(heads.length!==1)continue;
   const end=entries.findIndex((r,i)=>i>heads[0]&&compact(r.text)===rule.end);
   if(end<0||end-heads[0]>38)continue;
   const scoped=entries.slice(heads[0]+1,end);
   const markers=scoped.map((r,i)=>/^optional\s*:?\s*$/i.test(r.text)?i:-1).filter(i=>i>=0);
   if(markers.length!==1)continue;
   const marker=scoped[markers[0]],body=scoped.slice(markers[0]+1);
   const prayers=body.filter(r=>!rule.trailer||!rule.trailer.test(r.text));
   if(prayers.length!==rule.expected.length||
      !prayers.every((r,i)=>rule.expected[i].test(r.text)))continue;
   starts.add(key(marker));
   for(const row of body)lines.add(key(row));
  }
  return result;
 }
 function expandNewtonPeaceLitany(sections){
  if(!Array.isArray(sections)||sections.newton2009!==true)return sections;
  const entries=sections.flatMap((part,section)=>(part.lines||[])
   .map((text,index)=>({text:String(text).trim(),section,index})));
  const headings=entries.map((row,i)=>compact(row.text)==='thelitanyofpeace'?i:-1).filter(i=>i>=0);
  if(headings.length!==1)return sections;
  const start=headings[0],end=entries.findIndex((r,i)=>i>start&&
   /^all\s*:\s*to\s+you,\s*o\s+lord\.?\s*$/i.test(r.text));
  if(end<0||end-start>40)return sections;
  const rows=entries.slice(start+1,end);
  const response=/^all\s*:\s*lord,\s*have\s+mercy\.?\s*\(\s*(?:to\s+be\s+repeated\s+)?after\s+each\s+petition\.?\s*\)$/i;
  const cues=rows.map((r,i)=>response.test(r.text)?i:-1).filter(i=>i>=0);
  if(cues.length!==1)return sections;
  const cue=cues[0],opening=rows.slice(0,cue),after=rows.slice(cue+1);
  if(opening.length!==1||
    !/^deacon\s*:\s*in\s+peace\s+let\s+us\s+pray\s+to\s+the\s+lord\.?$/i.test(opening[0].text)||
    after.some(r=>/^(?:all|choir|priest|deacon)\s*:/i.test(r.text)))return sections;
  const anchors=[
   /^for\s+peace\s+from\s+on\s+high\b/i,
   /^for\s+peace\s+in\s+the\s+whole\s+world\b/i,
   /^for\s+this\s+holy\s+house\b/i,
   /^for\s+\(?our\s+father\s+and\s+patriarch\b|^for\s+our\s+father\s+and\s+\(arch\)bishop\b/i,
   /^for\s+the\s+government\b/i,
   /^for\s+this\s+city\b/i,
   /^for\s+favorable\s+weather\b/i,
   /^for\s+the\s+travelers\s+by\s+sea\b/i,
   /^for\s+our\s+deliverance\s+from\s+all\s+affliction\b/i,
   /^help\s+us,\s*save\s+us,\s*have\s+mercy\s+on\s+us\b/i
  ];
  const petitions=after.filter(r=>/^(?:for\b|help\s+us\b)/i.test(r.text));
  const closing=after.filter(r=>/^let\s+us\s+remember\s+our\s+all-holy\b/i.test(r.text));
  if(petitions.length!==anchors.length||
     !petitions.every((r,i)=>anchors[i].test(r.text))||
     closing.length!==1||after.indexOf(closing[0])<after.indexOf(petitions.at(-1)))return sections;
  const target=new Set(petitions.map(r=>r.section+':'+r.index));
  const expanded=sections.map((part,section)=>({...part,lines:(part.lines||[])
   .flatMap((line,index)=>target.has(section+':'+index)?
     [line,'All: Lord, have mercy.']:[line])}));
  expanded.newton2009=true;
  return expanded;
 }
 function expandNewtonEktene(sections){
  if(!Array.isArray(sections)||sections.newton2009!==true)return sections;
  const entries=sections.flatMap((part,section)=>(part.lines||[])
   .map((text,index)=>({text:String(text).trim(),section,index})));
  const headings=entries.map((r,i)=>compact(r.text)==='theektene'?i:-1).filter(i=>i>=0);
  if(headings.length!==1)return sections;
  const start=headings[0],end=entries.findIndex((r,i)=>i>start&&compact(r.text)==='prayeroftheektene');
  if(end<0||end-start>50)return sections;
  const rows=entries.slice(start+1,end);
  const cuePattern=/^all\s*:\s*lord,\s*have\s+mercy\.\s*\(\s*three\s+times\b[\s\u00ad\-\u2010-\u2015]*to\s+be\s+repeated\s+after\s+each\s+petition\.?\s*\)$/i;
  const cues=rows.map((r,i)=>cuePattern.test(r.text)?i:-1).filter(i=>i>=0);
  if(cues.length!==1)return sections;
  const cue=cues[0],before=rows.slice(0,cue),after=rows.slice(cue+1);
  if(before.filter(r=>/^deacon\s*:\s*let\s+us\s+all\s+say\s+with\s+our\s+whole\s+soul\b/i.test(r.text)).length!==1||
     before.some(r=>/^(?:all|choir)\s*:/i.test(r.text))||
     after.some(r=>/^(?:all|choir)\s*:/i.test(r.text))||
     !after.some(r=>/^after\s+the\s+third\s+petition,\s*some\s+other\s+appropriate\s+ecumenic\s+petitions\s+may\s+be\s+said\b/i.test(r.text)))
    return sections;
  const anchors=[
   /^lord\s+almighty,\s*god\s+of\s+our\s+fathers\b/i,
   /^have\s+mercy\s+on\s+us,\s*o\s+god,\s*in\s+your\s+great\s+mercy\b/i,
   /^again,\s*we\s+pray\s+for\s+our\s+father\s+and\s+\(arch\)bishop\b/i,
   /^again,\s*we\s+pray\s+for\s+the\s+priests,\s*the\s+deacons\b/i,
   /^again,\s*we\s+pray\s+for\s+mercy,\s*life,\s*peace,\s*health\b/i,
   /^again,\s*we\s+pray\s+for\s+the\s+blessed\s+and\s+ever\s+to\s+be\s+remembered\s+founders\b/i,
   /^again,\s*we\s+pray\s+for\s+those\s+who\s+bear\s+offerings\b/i
  ];
  const petitions=after.filter(r=>/^(?:lord\s+almighty|have\s+mercy\s+on\s+us,\s*o\s+god|again,?\s*we\s+pray)\b/i.test(r.text));
  if(petitions.length!==anchors.length||!petitions.every((r,i)=>anchors[i].test(r.text)))
    return sections;
  const target=new Set(petitions.map(r=>r.section+':'+r.index));
  const originalCue=rows[cue].section+':'+rows[cue].index;
  const triple='All: Lord, have mercy. Lord, have mercy. Lord, have mercy.';
  const expanded=sections.map((part,section)=>({...part,lines:(part.lines||[])
   .flatMap((line,index)=>{
    const key=section+':'+index;
    return key===originalCue?[triple]:target.has(key)?[line,triple]:[line];
   })}));
  expanded.newton2009=true;
  return expanded;
 }
 function expandNewtonGiftLitany(sections){
  if(!Array.isArray(sections)||sections.newton2009!==true)return sections;
  const entries=sections.flatMap((part,section)=>(part.lines||[])
    .map((text,index)=>({text:String(text).trim(),section,index})));
  const headings=entries.map((row,i)=>compact(row.text)==='litanyofthegifts'?i:-1).filter(i=>i>=0);
  if(headings.length!==1)return sections;
  const start=headings[0],end=entries.findIndex((row,i)=>i>start&&compact(row.text)==='prayerofoffering');
  if(end<0||end-start>25)return sections;
  const rows=entries.slice(start+1,end);
  const response=/^all\s*:\s*lord,\s*have\s+mercy\.?\s*\(\s*to\s+be\s+repeated\s+after\s+each\s+petition\.?\s*\)$/i;
  const cues=rows.map((row,i)=>response.test(row.text)?i:-1).filter(i=>i>=0);
  if(cues.length!==1)return sections;
  const cue=cues[0],opening=rows.slice(0,cue),following=rows.slice(cue+1);
  if(opening.length!==1||
     !/^deacon\s*:\s*let\s+us\s+complete\s+our\s+prayer\s+to\s+the\s+lord\.?$/i.test(opening[0].text))
    return sections;
  const optional=following.findIndex(row=>/^optional\s*:/i.test(row.text));
  if(optional!==1)return sections;
  const required=following[0];
  if(!/^deacon\s*:\s*for\s+the\s+precious\s+gifts\s+here\s+offered,\s*let\s+us\s+pray\s+to\s+the\s+lord\.?$/i.test(required.text)||
     following.some(row=>/^all\s*:/i.test(row.text)))return sections;
  const target=required.section+':'+required.index;
  const expanded=sections.map((part,section)=>({...part,lines:(part.lines||[])
    .flatMap((line,index)=>section+':'+index===target?
      [line,'All: Lord, have mercy.']:[line])}));
  expanded.newton2009=true;
  return expanded;
 }
 function expandNewtonCommunionPreparation(sections){
  if(!Array.isArray(sections)||sections.newton2009!==true)return sections;
  const rows=sections.flatMap((part,section)=>(part.lines||[])
    .map((text,index)=>({text:String(text).trim(),section,index})));
  const headings=rows.map((r,i)=>compact(r.text)==='preparationforholycommunion'?i:-1).filter(i=>i>=0);
  if(headings.length!==1)return sections;
  const first=headings[0],last=rows.findIndex((r,i)=>i>first&&compact(r.text)==='theaitesis');
  if(last<0||last-first>30)return sections;
  const all=rows.slice(first+1,last);
  const response=/^all\s*:\s*lord,\s*have\s+mercy\.?\s*\(\s*to\s+be\s+repeated\s+after\s+each\s+petition\.?\s*\)$/i;
  const cues=all.map((r,i)=>response.test(r.text)?i:-1).filter(i=>i>=0);
  if(cues.length!==1)return sections;
  const cue=cues[0],opening=all.slice(0,cue),following=all.slice(cue+1);
  if(opening.length!==1||
     !/^deacon\s*:\s*now\s+that\s+we\s+have\s+remembered\s+all\s+the\s+saints\b/i.test(opening[0].text)||
     !/\blet\s+us\s+pray\s+to\s+the\s+lord\.?$/i.test(opening[0].text))return sections;
  const optional=following.findIndex(r=>/^optional\s*:/i.test(r.text));
  if(optional<0)return sections;
  const mandatory=following.slice(0,optional);
  if(mandatory.length!==2||
     !/^for\s+the\s+precious\s+gifts\s+here\s+offered\s+and\s+sanctified\b/i.test(mandatory[0].text)||
     !/\blet\s+us\s+pray\s+to\s+the\s+lord\.?$/i.test(mandatory[0].text)||
     !/^that\s+our\s+god\s+who\s+loves\s+mankind\b/i.test(mandatory[1].text)||
     !/\blet\s+us\s+pray\.?$/i.test(mandatory[1].text))return sections;
  if(following.some(r=>/^all\s*:/i.test(r.text)))return sections;
  const slots=new Set(mandatory.map(r=>r.section+':'+r.index));
  const expanded=sections.map((part,section)=>({...part,lines:(part.lines||[])
    .flatMap((line,index)=>slots.has(section+':'+index)?
      [line,'All: Lord, have mercy.']:[line])}));
  expanded.newton2009=true;
  return expanded;
 }
 function expandNewtonAitesis(sections){
  if(!Array.isArray(sections)||sections.newton2009!==true)return sections;
  const entries=sections.flatMap((part,section)=>(part.lines||[])
    .map((text,index)=>({text:String(text),section,index})));
  const headings=entries.map((row,i)=>compact(row.text)==='theaitesis'?i:-1)
    .filter(i=>i>=0);
  if(headings.length!==1)return sections;
  const start=headings[0];
  const sourceResponse=/^all\s*:\s*grant\s+this,\s*o\s+lord\.\s*\(\s*to\s+be\s+repeated\s+after\s+each\s+petition\.?\s*\)\s*$/i;
  const cuePositions=entries.map((row,i)=>i>start&&sourceResponse.test(row.text)?i:-1)
    .filter(i=>i>=0);
  if(cuePositions.length!==1)return sections;
  const cue=cuePositions[0];
  const end=entries.findIndex((row,i)=>i>cue&&
    /^all\s*:\s*to\s+you,\s*o\s+lord\.?\s*$/i.test(row.text));
  if(end<0||cue-start>9||end-cue>60)return sections;
  const petition=text=>/\blet\s+us\s+ask(?:\s+the\s+lord)?\.?\s*$/i.test(text);
  if(entries.slice(start+1,cue).filter(row=>petition(row.text)).length!==1)
    return sections;
  const between=entries.slice(cue+1,end);
  if(between.some(row=>/^\s*(?:all|priest|deacon)\s*:/i.test(row.text)))return sections;
  const repeated=between.filter(row=>petition(row.text));
  if(repeated.length!==5||
    !between.some(row=>/\blet\s+us\s+ask\s+for\s+unity\s+of\s+faith\b/i.test(row.text)))
    return sections;
  const after=new Set(repeated.map(row=>row.section+':'+row.index));
  const expanded=sections.map((part,section)=>({...part,lines:(part.lines||[])
    .flatMap((text,index)=>after.has(section+':'+index)?
      [text,'All: Grant this, O Lord.']:[text])}));
  expanded.newton2009=true;
  return expanded;
 }
 function startAtOpeningBlessing(sections){
  if(!Array.isArray(sections))return sections;
  let si=-1,li=-1;
  for(let i=0;i<sections.length;i++){
   const lines=sections[i]?.lines||[];
   for(let j=0;j<lines.length;j++){
    const row=lines[j];
    if(/^(?:(?:deacon|dcn)\s*:\s*master[,\s]+give the blessing|(?:priest|celebrant)\s*:\s*blessed\s+(?:be|is)\s+the kingdom)/i.test(row)){si=i;li=j;break;}
   }
   if(si>=0)break;
  }
  if(si<0)return sections;
  const first=sections[si].lines;
  for(let j=li-1;j>=Math.max(0,li-4);j--){
   if(/^Blessing$/i.test(first[j].trim())){li=j;break;}
   if(role(first[j]))break;
  }
  const result=sections.slice(si).map((part,i)=>i===0?{...part,heading:null,lines:part.lines.slice(li)}:part);
  for(const part of result)part.lines=(part.lines||[]).filter(s=>!/^(?:WE\s+LEAVE\s+THE\s+WORLD(?:\s+STAND)?|STAND)$/i.test(s.trim()));
  return [{heading:'Liturgy of the Word',lines:[]},...result];
 }
 // EPUB books are organized by spine sections rather than PDF pages. Keep
 // the saved Byzantine edition intact and display its liturgical words as a
 // single document. Recognized internal subheadings retain their structure.
 function epubPrayerSections(parts){
  // Match titled editorial chapters with a numbered/lettered suffix, while
  // leaving ordinary prayer sections and embedded references untouched.
  const editorial=/^(?:table of contents|contents|copyright(?: notice)?|preface|foreword|introduction|acknowledg(?:e)?ments?|bibliography|references|sources?|explanatory notes?|glossary|index|appendix(?:es)?(?:\s+[a-z0-9]+)?|publisher'?s? notes?|editor'?s? notes?|about (?:this|the) (?:edition|book))(?:\s*[:—–-]\s*.+)?$/i;
  const out=[];
  for(const part of parts||[]){
   const title=String(part?.title||'').trim();
   if(editorial.test(title)){
    // Back matter must never resume as if it were another prayer.
    if(out.length)break;
    continue;
   }
   let current={heading:title?displayTitle(title):null,lines:[]};
   for(const block of part?.blocks||[]){
    const words=String(block?.text||'').trim();
    if(!words)continue;
    if(block.tag==='h4'&&heading(words)){
     if(current.lines.length)out.push(current);
     current={heading:normalize(words),lines:[]};
     continue;
    }
    current.lines.push(block.kind==='instruction'?'Instruction: '+words:
     block.role==='all'&&!role(words)?'ALL: '+words:words);
   }
   if(current.lines.length)out.push(current);
  }
  return startAtOpeningBlessing(out);
 }
 return {normalize,displayPrayer,displayTitle,heading,role,speakerInstruction,properPrayerLines,pdfRows,pdfFolioLine,instruction,combine,englishPdfItems,melkiteReferenceBoundary,newtonOptionalPetitions,expandNewtonPeaceLitany,expandNewtonEktene,expandNewtonGiftLitany,expandNewtonCommunionPreparation,expandNewtonAitesis,startAtOpeningBlessing,epubPrayerSections};
});
