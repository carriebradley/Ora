/* Display-only formatting for private local books; contains no liturgical texts. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.LiturgicalFormat=factory();})(typeof self!=='undefined'?self:this,function(){
 const titles=['The Holy Gospel','The Troparia & Kontakia','Divine Liturgy of St. John Chrysostom','The Litany of Peace','The Order of Antiphons','The Ektene','Prayer of the Ektene','Insistent Litany','Polychronion','First Antiphon','Second Antiphon','Third Antiphon','The Kairos Service','Prayers Before the Holy Doors','Liturgy of the Word','Liturgy of the Eucharist','Blessing','Great Litany','Litany of Peace','Small Litany','First Antiphon','Second Antiphon','Third Antiphon','Entrance Antiphon','Entrance with the Gospel','Little Entrance','Great Entrance','Prayer of Entrance','Trisagion Hymn','Trisagion Prayer','Prayer of the Trisagion','Only-Begotten Son','Cherubic Hymn','Prayer Before the Gospel','Prayer for the Faithful','Troparia','Troparia & Kontakia','Creed','Symbol of Faith','Prayer of the Cherubic Hymn','Litany for the Gifts','Litany of the Gifts','Prayer of Offering','Anaphora','Holy Anaphora','Confession of Love','Thanksgiving','Remembrance','Epiclesis','The Lord’s Prayer','One is Holy','Communion Hymn','Prayer Before Holy Communion','Preparation for Holy Communion','Holy Communion','Blessing with the Holy Gifts','Prayer of Thanksgiving','Prayer Behind the Ambo','Dismissal','Apolysis','Distribution of the Antidoron','The Aitesis','Hymn to Christ','The Beatitudes','The Entrance of Christ the High Priest','The Light of Christ','Entrance of the High Priest','Baptismal Hymn','Prokimenon','Epistle','Alleluia','Gospel','Prayer for the Church','Concluding Blessing','Litany of Supplication','Surrender to God','Communion of the Clergy','Communion of the Faithful','Thanksgiving Hymn','Thanksgiving Litany','Ambo Prayer','Final Blessing','Confession of Faith','Troparia and Kontakia'];
 // The Edmonton 2012 episcopal service prints additional headings in the
 // English service pages 33-113, some split across PDF lines. These are
 // headings, not spoken text; keep their wording and order intact.
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
   // Newton's font extracts ordinary compound hyphens as a run of three
   // different hyphen code points. Drop only redundant characters, retain '-'.
   .replace(/-\u2010\u2011/g,'-')
   .replace(/\b(well)-\s*-\s*(being)\b/gi,'$1-$2')
   // Newton 2009 PDF p. 68 appends an editorial chant alternative immediately
   // after this All response. Hide only the fully matched source note, never
   // the response or the independent "I will love You, Lord" prayer.
   .replace(/(\bThe\s+Father,\s+the\s+Son\s+and\s+the\s+Holy\s+Spirit,\s+Trinity,\s+one\s+in\s+essence\s+and\s+undivided\.)\s+After\s+[\u201c"]The\s+Father,\s+the\s+Son[^\r\n]{0,48}[\u201c"]I\s+will\s+love\s+You,\s+Lord[^\r\n]{0,48}may\s+also\s+be\s+sung\.\s*$/i,'$1')
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
  const m=String(text).match(/^\s*(?:the\s+)?(PRIESTS|PRIEST(?:\s*\d+)?(?:\s+AND\s+DEACON)?|CELEBRANT|BISHOP|DEACON(?:\s*\d+)?|DCN\s*\d*|PROTODEACON|ALL|PEOPLE|FAITHFUL|CONGREGATION|CHOIR|CLERGY|READER|LECTOR|VERSE|CANTOR|SUBDEACON|SERVER|ACOLYTE)(?:\s*\(([^)]+)\)|\s*,\s*(quietly|silently|aloud))?\s*:\s*(.*)$/i);if(!m)return null;
  const label=m[1].toUpperCase(),kind=/AND/.test(label)||label==='CLERGY'||label==='PRIESTS'?'clergy':/^(?:PRIEST|CELEBRANT|BISHOP)/.test(label)?'priest':/^(?:DEACON|DCN|PROTODEACON)/.test(label)?'deacon':/^(?:ALL|PEOPLE|FAITHFUL|CONGREGATION)$/.test(label)?'all':'other';
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
  // Edmonton 2012 English pp. 39, 45, 53, 57 and 59:
  // printed appointment/reading directions, not spoken service text.
  // Do not consume the people's actual sung Alleluia or Baptismal stanza.
  if(/^See propers\.$/i.test(s)||
     /^The Prokimenon for the day\.\s*See propers\.$/i.test(s)||
     /^The [“"]Alleluia[”"] is sung in preparation for the proclamation of\b/i.test(s)||
     /^If psalm verses are chanted,\s*the faithful respond\b/i.test(s)||
     /^On the Nativity of Christ,\s*Theophany,\s*Saturday of Lazarus,\s*Holy Saturday,\s*Easter Week and Pentecost,\s*we sing the Baptismal Hymn:\s*$/i.test(s))return true;
  // Edmonton 2012 p. 65: this is an editorial insertion cue, never prayer.
  if(/^Special petitions may be added here\.?$/i.test(s))return true;
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
  return Array.isArray(lines)?lines.filter(line=>typeof line==='string'&&line.trim()&&!instruction(line)&&
    !/^Kondakion of the Ointment-Bearing women \(Tone 2\): Trisagion or Instead of the Trisagion(?:\s*:|\s+[“"])/i.test(line)):[];
 }
 // English-only device-local display for bilingual Ukrainian PDFs.
 // Filter PDF items before merging coordinates: a single horizontal line
 // may contain Ukrainian on the left and English on the right.
 const CYRILLIC=/[\u0400-\u052f\u1c80-\u1c8f\u2de0-\u2dff\ua640-\ua69f]/u;
 const CYRILLIC_RUN=/[\u0400-\u052f\u1c80-\u1c8f\u2de0-\u2dff\ua640-\ua69f]+/gu;
 // Edmonton 2012 PDF pp. 39 and 45: the Sunday and weekday antiphons
 // are vertical alternatives, not two consecutive appointed hymns.
 // Only split an intact, positively identified page; leave unknown text alone.
 function edmontonFirstAntiphonRows(rows,title='First Antiphon'){
  if(!Array.isArray(rows))return rows;
  const find=pattern=>rows.flatMap((row,i)=>pattern.test(String(row.text||'').trim())?[i]:[]);
  if(!['First Antiphon','Entrance Antiphon'].includes(title))return rows;
  const head=find(title==='Entrance Antiphon'?/^Entrance Antiphon$/i:/^First Antiphon$/i),sun=find(/^Sundays:\s*$/i),weekday=find(/^Weekdays:\s*$/i);
  if(head.length!==1||sun.length!==1||weekday.length!==1||
     !(head[0]<sun[0]&&sun[0]<weekday[0]))return rows;
  const valid=part=>part.filter(row=>/^VERSE\s*:/i.test(row.text)).length===3&&
    part.filter(row=>/^ALL\s*:/i.test(row.text)).length===3;
  if(!valid(rows.slice(sun[0]+1,weekday[0]))||!valid(rows.slice(weekday[0]+1)))return rows;
  // The source's feast heading and page references are editorial directions,
  // not spoken words. Remove only the exact notes on these verified pages.
  const feast=find(/^Major Feast Days:\s*$/i),see=find(/^See propers\.\s*$/i);
  const removeFeast=feast.length===1&&see.length===1&&feast[0]>head[0]&&
    see[0]===feast[0]+1&&see[0]<sun[0];
  const note=title==='Entrance Antiphon'?/\s*\(Continue on p\.\s*47\)\s*$/i:
    /\s*\(Hymn to Christ,\s*p\.\s*39\)\s*$/i;
  return rows.flatMap((row,i)=>{
   if(i===sun[0]||i===weekday[0]||(removeFeast&&(i===feast[0]||i===see[0])))return [];
   if(i>sun[0]){
    const text=String(row.text||'').replace(note,'');
    if(!text.trim())return [];
    return [{...row,text,alternative:i<weekday[0]?'sunday':'weekday'}];
   }
   return [row];
  });
 }
 // The same Edmonton 2012 source prints a third choice on the next
 // English page: Typica after the first antiphon, and the Beatitudes after
 // the entrance antiphon. Keep the shared hymn and entrance directions
 // outside the disclosures. Call only for the identified 140-page edition.
 function edmontonAdditionalAntiphonRows(rows,kind){
  if(!Array.isArray(rows)||!['typica','beatitudes'].includes(kind))return rows;
  const find=re=>rows.flatMap((row,i)=>re.test(String(row.text||'').trim())?[i]:[]);
  const start=find(kind==='typica'?/^Typica:\s*Psalm\s*102$/i:/^The Beatitudes$/i);
  const end=find(kind==='typica'?/^Hymn to Christ$/i:/^The procession leaves the sanctuary\b/i);
  if(start.length!==1||end.length!==1||end[0]<=start[0]+1)return rows;
  const body=rows.slice(start[0]+1,end[0]);
  const text=body.map(row=>String(row.text||'').trim()).join(' ').replace(/\s+/g,' ');
  if(body.filter(row=>/^ALL\s*:/i.test(row.text)).length!==1)return rows;
  if(kind==='typica'){
   if(!/^ALL\s*:\s*Bless the Lord, O my soul\b/i.test(text)||
      !/Compassionate and merciful is the Lord/i.test(text)||
      !/Blessed are You, O Lord\.\s*$/i.test(text))return rows;
  }else{
   if(!/^ALL\s*:\s*Remember us, O Lord\b/i.test(text)||
      (text.match(/\bBlessed are (?:the|they|you)\b/gi)||[]).length!==9||
      !/Rejoice and be glad\s*\*?\s*for your reward will be great in heaven\.\s*$/i.test(text))return rows;
  }
  return rows.map((row,i)=>i>=start[0]&&i<end[0]?{...row,alternative:kind}:row);
 }
 // The 2012 episcopal PDF p. 57 prints PRIESTS without a colon. PDF.js
 // otherwise joins that Greek chant to the preceding people's response,
 // hiding its (2) boundary and preventing the seasonal hymn recognition.
 // Normalize only this complete, identified page's printed speaker cue.
 function edmontonTrisagionRows(rows){
  if(!Array.isArray(rows))return rows;
  const find=re=>rows.flatMap((row,i)=>re.test(String(row.text||'').trim())?[i]:[]);
  const head=find(/^Trisagion Hymn$/i),baptism=find(/^Baptismal Hymn$/i);
  const priests=find(/^PRIESTS\s+[^\u0370-\u03ff]*[\u0370-\u03ff]/u);
  const deacon=find(/^(?:DCN|DEACON)(?:\s+\d+)?\s*:\s*Give glory to Christ,\s*our God!$/i);
  if(head.length!==1||baptism.length!==1||priests.length!==1||deacon.length!==2||
     !(head[0]<priests[0]&&priests[0]<deacon[0]&&deacon[0]<baptism[0]&&baptism[0]<deacon[1]))return rows;
  const before=rows.slice(head[0]+1,priests[0]).map(r=>r.text).join(' ');
  if(!/^ALL\s*:\s*†?\s*Holy God,\s*Holy and Mighty,/i.test(before)||
     !/have mercy on us\.\s*\(2\)\s*$/i.test(before))return rows;
  return rows.map((row,i)=>i===priests[0]?{...row,text:String(row.text).replace(/^PRIESTS\s+/,'PRIESTS: ')}:row);
 }
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
  const starts=new Set(),lines=new Set(),labels=new Map(),triples=new Set();
  const result={starts,lines,labels,triples};
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
   ]},
   // Printed optional Apolysis response in Newton PDF p. 93 (printed p. 85).
   // Only if the complete three-response sequence is present, never appoint it.
   {head:'apolysis',end:'onsundaysandfeastdays',label:'Optional dismissal responses',tripleIndex:1,expected:[
    /^all\s*:\s*glory\s+be\s+to\s+the\s+father,\s*and\s+to\s+the\s+son\b/i,
    /^lord,\s*have\s+mercy\.\s*\(\s*three\s+times\s*\)$/i,
    /^give\s+the\s+blessing,\s*master,\s*in\s+the\s+name\s+of\s+the\s+lord\.?$/i
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
   if(rule.label)labels.set(key(marker),rule.label);
   if(Number.isInteger(rule.tripleIndex))triples.add(key(prayers[rule.tripleIndex]));
   for(const row of body)lines.add(key(row));
  }
  return result;
 }
 function newtonTrisagionHymns(sections){
  const starts=new Set(),lines=new Set(),labels=new Map(),triples=new Set(),result={starts,lines,labels,triples};
  if(!Array.isArray(sections)||sections.newton2009!==true)return result;
  const rows=sections.flatMap((part,section)=>(part.lines||[]).map((raw,index)=>({text:String(raw).trim(),section,index})));
  const key=row=>row.section+':'+row.index;
  const find=pattern=>rows.map((row,index)=>pattern.test(row.text)?index:-1).filter(index=>index>=0);
  const ordinary=/^(?:all\s*:\s*)?holy\s+god,\s*holy\s+mighty\s+one,\s*holy\s+immortal\s+one,\s*have\s+mercy\s+on\s+us\.\s*\(\s*three\s+times\s*\)\s*$/i;
  const baptismal=/^(?:all\s*:\s*)?all\s+of\s+you\s+who\s+have\s+been\s+baptized\s+into\s+christ,\s*have\s+put\s+on\s+christ\.\s*alleluia\.\s*\(\s*three\s+times\s*\)\s*$/i;
  const cross=/^(?:all\s*:\s*)?we\s+bow\s+in\s+worship\s+before\s+your\s+cross,\s*o\s+master,\s*and\s+we\s+give\s+praise\s+to\s+your\s+holy\s+resurrection\.\s*\(\s*three\s+times\s*\)\s*$/i;
  const [a,b,c]=[ordinary,baptismal,cross].map(find);
  if([a,b,c].some(hits=>hits.length!==1)||!(a[0]<b[0]&&b[0]<c[0]))return result;
  const heading=find(/^the\s+trisagion\s+hymn$/i);
  if(heading.length!==1||heading[0]>=a[0]||a[0]-heading[0]>8||!rows.slice(heading[0]+1,a[0]).some(row=>/^the\s+choir\s+and\s+the\s+celebrants\s+alternate\b/i.test(row.text)))return result;
  const baptismalIntro=/^on\s+the\s+feasts\s+of\s+the\s+nativity\s+of\s+our\s+lord\s+and\s+the\s+theophany\b/i,crossIntro=/^on\s+the\s+feast\s+of\s+the\s+exaltation\s+of\s+the\s+holy\s+cross\b/i;
  const intro=(at,pattern)=>rows.findIndex((row,index)=>index>=at-4&&index<at&&pattern.test(row.text));
  const bs=intro(b[0],baptismalIntro),cs=intro(c[0],crossIntro);
  const baptismalFinal=/^(?:all\s*:\s*)?all\s+of\s+you\s+who\s+have\s+been\s+baptized\s+into\s+christ,\s*have\s+put\s+on\s+christ\.\s*alleluia\.\s*$/i,crossFinal=/^(?:all\s*:\s*)?we\s+bow\s+in\s+worship\s+before\s+your\s+cross,\s*o\s+master,\s*and\s+we\s+give\s+praise\s+to\s+your\s+holy\s+resurrection\.\s*$/i;
  const be=rows.findIndex((row,index)=>index>b[0]&&index<c[0]&&baptismalFinal.test(row.text)),ce=rows.findIndex((row,index)=>index>c[0]&&crossFinal.test(row.text));
  if(bs<0||cs<0||be<0||ce<0||be-b[0]>18||ce-c[0]>18)return result;
  starts.add(key(rows[bs]));labels.set(key(rows[bs]),'Baptismal Hymn (only on appointed feasts)');
  starts.add(key(rows[cs]));labels.set(key(rows[cs]),'Cross Hymn (only on appointed feasts)');
  for(let i=bs;i<=be;i++)lines.add(key(rows[i]));for(let i=cs;i<=ce;i++)lines.add(key(rows[i]));
  for(const index of [a[0],b[0],c[0]])triples.add(key(rows[index]));return result;
 }
 // Newton 2009, PDF pp. 30-31: the priest and deacon say the first
 // verse twice and the second once; later the deacon says the latter three
 // times. The source combines the first two verses in one extracted line.
 // Recognize the complete surrounding source cues before expanding either.
 function expandNewtonOpeningPrayers(sections){
  if(!Array.isArray(sections)||sections.newton2009!==true)return sections;
  const rows=sections.flatMap((part,section)=>(part.lines||[]).map((raw,index)=>({text:String(raw).trim(),section,index})));
  const opening=/^(Glory to God in the highest, on earth peace, good will to men\.)\s*\(Twice\)\s*(O Lord, You shall open my lips and my mouth will declare Your praise\.)\s*\(Once\)$/i;
  const deacon=/^(O Lord, You shall open my lips and my mouth will declare Your praise\.)\s*\(Three times\)$/i;
  const find=pattern=>rows.map((row,index)=>pattern.test(row.text)?index:-1).filter(index=>index>=0);
  const [first,second]=[opening,deacon].map(find);
  if(first.length!==1||second.length!==1||first[0]>=second[0])return sections;
  const i=first[0],j=second[0],a=rows[i],b=rows[j];
  if(!rows[i-1]||!rows[i+1]||!rows[j-1]||!rows[j+1]||!rows[j+2]||
     rows[i-1].section!==a.section||rows[i+1].section!==a.section||
     rows[j-1].section!==b.section||rows[j+1].section!==b.section||rows[j+2].section!==b.section||
     !/^They bow three times saying:$/i.test(rows[i-1].text)||
     !/^The Priest kisses the Gospel and the Holy Table, while the Deacon kisses the Holy Table only\.$/i.test(rows[i+1].text)||
     !/^He kisses the Priest[’']s right hand,.*standing before the Holy Doors, he reverently bows three times saying:$/i.test(rows[j-1].text)||
     !/^He uncovers his head and proclaims in a mighty voice:$/i.test(rows[j+1].text)||
     !/^Deacon:\s*Give the blessing, Master\.$/i.test(rows[j+2].text))return sections;
  const [,glory,lips]=a.text.match(opening),deaconWords=b.text.match(deacon)[1];
  const out=sections.map((part,section)=>({...part,lines:(part.lines||[]).map((raw,index)=>{
   if(section===a.section&&index===a.index)return 'Priest and Deacon: '+[glory,glory,lips].join(' ');
   if(section===b.section&&index===b.index)return 'Deacon: '+[deaconWords,deaconWords,deaconWords].join(' ');
   return raw;
  })}));
  out.newton2009=true;return out;
 }

 function expandNewtonTrisagionHymns(sections){
  const hymns=newtonTrisagionHymns(sections);if(hymns.triples.size!==3)return sections;
  const out=sections.map((part,section)=>({...part,lines:(part.lines||[]).map((raw,index)=>{
   if(!hymns.triples.has(section+':'+index))return raw;const words=String(raw).replace(/\s*\(\s*three\s+times\s*\)\s*$/i,'').trim();return [words,words,words].join(' ');
  })}));out.newton2009=true;return out;
 }

 // Newton 2009 pp. 81 and 84 (PDF pp. 89 and 92) mark these two
 // concluding responses as threefold. Require both unique, ordered anchors
 // so a partial or edited private book is never rewritten for display.
 function expandNewtonConcludingThreefold(sections){
  if(!Array.isArray(sections)||sections.newton2009!==true)return sections;
  const rows=sections.flatMap((part,section)=>(part.lines||[]).map((raw,index)=>({text:String(raw).trim(),section,index})));
  const exalted=/^(?:priest|celebrant)(?:\s+\d+)?\s*:\s*May\s+You\s+be\s+exalted\s+above\s+the\s+heavens,\s*O\s+God,\s*and\s+Your\s+glory\s+above\s+all\s+the\s+earth\.\s*\(\s*three\s+times\s*\)\s*$/i;
  const name=/^all\s*:\s*Amen\.\s*Blessed\s+be\s+the\s+name\s+of\s+the\s+Lord,\s*now\s+and\s+for(?:\s*|-)ever\.\s*\(\s*three\s+times\s*\)\s*$/i;
  const found=pattern=>rows.map((row,index)=>pattern.test(row.text)?index:-1).filter(index=>index>=0);
  const [a,b]=[exalted,name].map(found);
  if(a.length!==1||b.length!==1||a[0]>=b[0])return sections;
  const targets=new Set([rows[a[0]].section+':'+rows[a[0]].index,rows[b[0]].section+':'+rows[b[0]].index]);
  const out=sections.map((part,section)=>({...part,lines:(part.lines||[]).map((raw,index)=>{
   if(!targets.has(section+':'+index))return raw;
   const words=String(raw).replace(/\s*\(\s*three\s+times\s*\)\s*$/i,'').trim();
   return [words,words,words].join(' ');
  })}));out.newton2009=true;return out;
 }

 // Newton 2009 PDF p. 64: the priest and deacon quietly repeat the complete
 // Cherubic Hymn together three times. Keep the source's two speaker lines
 // paired and do not alter the preceding people's hymn or the saved PDF.
 function expandNewtonCherubicThreefold(sections){
  if(!Array.isArray(sections)||sections.newton2009!==true)return sections;
  const rows=sections.flatMap((part,section)=>(part.lines||[]).map((text,index)=>({text:String(text).trim(),section,index})));
  const cues=rows.map((row,index)=>/^The Priest is joined by the Deacon; they both bow three times, repeating quietly the Cherubic Hymn:$/i.test(row.text)?index:-1).filter(index=>index>=0);
  if(cues.length!==1)return sections;
  const i=cues[0],cue=rows[i],priest=rows[i+1],deacon=rows[i+2],next=rows[i+3];
  const heading=rows.slice(0,i).filter(row=>/^The Cherubic Hymn$/i.test(row.text));
  if(heading.length!==1||!priest||!deacon||!next||
     priest.section!==cue.section||deacon.section!==cue.section||next.section!==cue.section||
     priest.index!==cue.index+1||deacon.index!==cue.index+2||next.index!==cue.index+3||
     !/^Priest:\s*We who mystically represent the Cherubim,\s*and sing to the Life[-\u00ad\u2010-\u2011]+Giving Trinity the thrice[-\u00ad\u2010-\u2011]+holy hymn,\s*let us lay aside all earthly cares,\s*to receive the King of all\.\s*$/i.test(priest.text)||
     !/^Deacon:\s*Invisibly escorted by angel hosts\.\s*Alleluia[.,]?\s+Alleluia[.,]?\s+Alleluia\.\s*$/i.test(deacon.text)||
     !/^Then the Priest kisses the Antimension\./i.test(next.text))return sections;
  const out=sections.map((part,section)=>({...part,lines:section!==cue.section?[...(part.lines||[])]:[
   ...part.lines.slice(0,cue.index),...Array.from({length:3},()=>[part.lines[priest.index],part.lines[deacon.index]]).flat(),...part.lines.slice(next.index)
  ]}));out.newton2009=true;return out;
 }

 // Newton 2009 PDF p. 64 embeds this prayer in a long stage direction.
 // Recover only the exact quoted words from the recognized private book;
 // the surrounding direction is still hidden by the reader.
 function expandNewtonProthesisPrayer(sections){
  if(!Array.isArray(sections)||sections.newton2009!==true)return sections;
  const rows=sections.flatMap((part,section)=>(part.lines||[]).map((text,index)=>({text:String(text).trim(),section,index})));
  if(rows.filter(row=>/^The Cherubic Hymn$/i.test(row.text)).length!==1)return sections;
  const pattern=/^Then the Priest kisses the Antimension\.[\s\S]*?The Priest censes it and returns the censer to the server\. The Priest and the Deacon bow three times saying quietly [“"](O God, forgive me the sinner and have mercy on me\.)[”"] The Deacon then says to the Priest in a low voice:$/i;
  const matches=rows.map(row=>({row,match:row.text.match(pattern)})).filter(x=>x.match);
  if(matches.length!==1)return sections;
  const {row,match}=matches[0],part=sections[row.section];
  const next=part.lines[row.index+1];
  if(next&&/^Priest and Deacon, quietly:/i.test(next))return sections;
  const prayer='Priest and Deacon, quietly: '+match[1];
  const out=sections.map((p,i)=>({...p,lines:i===row.section?[...p.lines.slice(0,row.index+1),prayer,prayer,prayer,...p.lines.slice(row.index+1)]:[...(p.lines||[])]}));
  out.newton2009=true;return out;
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
  const closing=after.filter(r=>/^let\s+us\s+remember\s+our\s+all-(?:[\u00ad\u2010\u2011]{0,3})holy\b/i.test(r.text));
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


 // Edmonton 2012 episcopal booklet, English PDF p. 71: the clergy's complete
 // Cherubic Hymn has a printed (3) after a separate bow direction. Repeat
 // those spoken words, not the opening people's verse or Great Entrance.
 // A marker, the edition identity, and the unique surrounding sequence
 // are required; unknown or modified PDFs remain untouched.
 // Edmonton 2012 English PDF pp. 35 and 37 split one Great Litany
 // petition across facing-language pages. Join only this exact, uniquely
 // matched continuation and its following response; never alter saved bytes.
 // Edmonton 2012 English PDF pp. 79 and 81 divide the Creed mid-sentence.
 // Join the complete, unique source-shaped boundary and retain its speaker.
 // Edmonton 2012 English pp. 89-91: the bishop's commemoration
 // continues over the page break before the people's response.
 // Edmonton 2012 English pp. 95-97 split the congregation's Lord's
 // Prayer before the bishop's doxology. Match only this complete boundary.
 // Edmonton 2012 English pp. 105-107 split the deacon's
 // Thanksgiving Litany invitation before the congregation's response.
 // Edmonton 2012 English pp. 99-101 continue the congregation's
 // Communion preparation prayer across the page boundary.
 function joinEdmontonCommunionPrayerPageBreak(sections){
  if(!Array.isArray(sections)||sections.edmonton2012!==true)return sections;
  const start=/^ALL\s*:\s*I believe,\s*O Lord,\s*and confess,\s*that You are\b/i;
  const end=/\bRemember me,\s*O Lord,\s*when You come into Your kingdom\.\s*$/i;
  const nextStart=/^\s*†?\s*Remember me,\s*O Master,\s*when You come into Your Kingdom\./i;
  const nextMiddle=/\bRemember me,\s*O Holy One,\s*when You come into Your Kingdom\./i;
  const nextEnd=/\bI have sinned without number;\s*forgive me,\s*O Lord\.\s*$/i;
  const matches=[];
  for(let i=0;i+1<sections.length;i++){
   const left=sections[i],right=sections[i+1],lines=left.lines||[],next=right.lines||[];
   if(left.alternative||right.alternative||right.heading||!lines.length||next.length<2)continue;
   if(start.test(lines.at(-1))&&end.test(lines.at(-1))&&nextStart.test(next[0])&&nextMiddle.test(next[0])&&
      nextEnd.test(next[0])&&/^Communion of the Clergy$/i.test(String(next[1]).trim()))matches.push(i);
  }
  if(matches.length!==1)return sections;
  const where=matches[0],out=sections.map((part,i)=>{
   if(i===where)return {...part,lines:[...part.lines.slice(0,-1),part.lines.at(-1)+' '+sections[i+1].lines[0]]};
   if(i===where+1)return {...part,lines:part.lines.slice(1)};
   return {...part,lines:[...(part.lines||[])]};
  });
  out.edmonton2012=true;return out;
 }
 function joinEdmontonThanksgivingPageBreak(sections){
  if(!Array.isArray(sections)||sections.edmonton2012!==true)return sections;
  const start=/^DCN\s*1\s*:\s*Stand aright!\s*Having received the divine,\s*holy,\s*immaculate,\s*immortal,\s*heavenly,\s*and\s*$/i;
  const continuation=/^life-giving,\s*awesome Mysteries of Christ,\s*let us rightly give thanks to the Lord\.\s*$/i;
  const response=/^ALL\s*:\s*Lord,\s*have mercy\.\s*$/i;
  const matches=[];
  for(let i=0;i+1<sections.length;i++){
   const left=sections[i],right=sections[i+1],lines=left.lines||[],next=right.lines||[];
   if(left.alternative||right.alternative||right.heading||!lines.length||next.length<2)continue;
   if(start.test(lines.at(-1))&&continuation.test(next[0])&&response.test(next[1]))matches.push(i);
  }
  if(matches.length!==1)return sections;
  const where=matches[0],out=sections.map((part,i)=>{
   if(i===where)return {...part,lines:[...part.lines.slice(0,-1),part.lines.at(-1)+' '+sections[i+1].lines[0]]};
   if(i===where+1)return {...part,lines:part.lines.slice(1)};
   return {...part,lines:[...(part.lines||[])]};
  });
  out.edmonton2012=true;return out;
 }
 function joinEdmontonLordsPrayerPageBreak(sections){
  if(!Array.isArray(sections)||sections.edmonton2012!==true)return sections;
  const start=/^ALL\s*:\s*Our Father,\s*Who art in heaven\b/i;
  const ending=/\band forgive us our\s*$/i;
  const continuation=/^trespasses as we forgive those who trespass against us\.\s*And lead us not into temptation but deliver us from evil\.\s*$/i;
  const doxology=/^BISHOP\s*:\s*For the kingdom,\s*the power,\s*and the glory\b/i;
  const matches=[];
  for(let i=0;i+1<sections.length;i++){
   const left=sections[i],right=sections[i+1],lines=left.lines||[],next=right.lines||[];
   if(left.alternative||right.alternative||right.heading||!lines.length||next.length<2)continue;
   if(start.test(lines.at(-1))&&ending.test(lines.at(-1))&&continuation.test(next[0])&&doxology.test(next[1]))matches.push(i);
  }
  if(matches.length!==1)return sections;
  const where=matches[0],out=sections.map((part,i)=>{
   if(i===where)return {...part,lines:[...part.lines.slice(0,-1),part.lines.at(-1)+' '+sections[i+1].lines[0]]};
   if(i===where+1)return {...part,lines:part.lines.slice(1)};
   return {...part,lines:[...(part.lines||[])]};
  });
  out.edmonton2012=true;return out;
 }
 function joinEdmontonChurchPrayerPageBreak(sections){
  if(!Array.isArray(sections)||sections.edmonton2012!==true)return sections;
  const start=/^BISHOP\s*:\s*Among the first,\s*remember,\s*O Lord,\s*the\b/i;
  const ending=/\bmay live in peace,\s*safety,\s*honour and health\s*$/i;
  const continuation=/^for many years,\s*and rightly impart the word of Your truth\.\s*$/i;
  const response=/^ALL\s*:\s*And remember all men and all women\.\s*$/i;
  const matches=[];
  for(let i=0;i+1<sections.length;i++){
   const left=sections[i],right=sections[i+1],lines=left.lines||[],next=right.lines||[];
   if(left.alternative||right.alternative||right.heading||!lines.length||next.length<2)continue;
   if(start.test(lines.at(-1))&&ending.test(lines.at(-1))&&continuation.test(next[0])&&response.test(next[1]))matches.push(i);
  }
  if(matches.length!==1)return sections;
  const where=matches[0],out=sections.map((part,i)=>{
   if(i===where)return {...part,lines:[...part.lines.slice(0,-1),part.lines.at(-1)+' '+sections[i+1].lines[0]]};
   if(i===where+1)return {...part,lines:part.lines.slice(1)};
   return {...part,lines:[...(part.lines||[])]};
  });
  out.edmonton2012=true;return out;
 }
 function joinEdmontonCreedPageBreak(sections){
  if(!Array.isArray(sections)||sections.edmonton2012!==true)return sections;
  const starts=/^ALL\s*:\s*I believe in one God,\s*the Father,\s*the Almighty\b/i;
  const ending=/\bHe suffered,\s*died and\s*$/i;
  const continuation=/^was buried\.\s+[\s\S]*\blife of the world to come\.\s*Amen\.\s*$/i;
  const matches=[];
  for(let i=0;i+1<sections.length;i++){
   const left=sections[i],right=sections[i+1],lines=left.lines||[],next=right.lines||[];
   if(left.alternative||right.alternative||right.heading||!lines.length||next.length<2)continue;
   if(starts.test(lines.at(-1))&&ending.test(lines.at(-1))&&continuation.test(next[0])&&
      /^Blessing$/i.test(String(next[1]).trim()))matches.push(i);
  }
  if(matches.length!==1)return sections;
  const where=matches[0],out=sections.map((part,i)=>{
   if(i===where)return {...part,lines:[...part.lines.slice(0,-1),part.lines.at(-1)+' '+sections[i+1].lines[0]]};
   if(i===where+1)return {...part,lines:part.lines.slice(1)};
   return {...part,lines:[...(part.lines||[])]};
  });
  out.edmonton2012=true;return out;
 }
 function joinEdmontonGreatLitanyPageBreak(sections){
  if(!Array.isArray(sections)||sections.edmonton2012!==true)return sections;
  const start=/^DCN\s*1\s*:\s*For the seafarers and travellers,\s*for the sick\s*$/i;
  const tail=/^and the suffering,\s*for those held captive,\s*and for their salvation,\s*let us pray to the Lord\.\s*$/i;
  const matches=[];
  for(let i=0;i+1<sections.length;i++){
   const left=sections[i],right=sections[i+1],lines=left.lines||[],next=right.lines||[];
   if(left.alternative||right.alternative||right.heading||!lines.length||next.length<2)continue;
   if(start.test(lines.at(-1))&&tail.test(next[0])&&/^ALL\s*:\s*Lord,\s*have mercy\.\s*$/i.test(next[1]))matches.push(i);
  }
  if(matches.length!==1)return sections;
  const where=matches[0];
  const out=sections.map((part,i)=>{
   if(i===where)return {...part,lines:[...part.lines.slice(0,-1),part.lines.at(-1)+' '+sections[i+1].lines[0]]};
   if(i===where+1)return {...part,lines:part.lines.slice(1)};
   return {...part,lines:[...(part.lines||[])]};
  });
  out.edmonton2012=true;
  return out;
 }
 function expandEdmontonCherubicThreefold(sections){
  if(!Array.isArray(sections)||sections.edmonton2012!==true)return sections;
  const rows=sections.flatMap((part,section)=>(part.lines||[])
   .map((text,index)=>({text:String(text).trim(),section,index})));
  const positions=title=>rows.flatMap((row,i)=>
   compact(row.text)===compact(title)?[i]:[]);
  const start=positions('Cherubic Hymn'),end=positions('Great Entrance');
  if(start.length!==1||end.length!==1||end[0]<=start[0]||
     end[0]-start[0]>65)return sections;
  const between=rows.slice(start[0]+1,end[0]);
  const initial=between.filter(row=>/^all\s*:\s*Let us who mystically represent the cherubim\b/i.test(row.text));
  const clergy=between.filter(row=>/^clergy\s*:/i.test(row.text));
  if(initial.length!==1||clergy.length!==1)return sections;
  const selected=clergy[0],where=between.indexOf(selected);
  if(where<=between.indexOf(initial[0]))return sections;
  const pattern=/^clergy\s*:\s*(Let us who mystically represent the cherubim\b[\s\S]{1,700}?\bAlleluia,\s*alleluia,\s*alleluia)\s*\(\s*\u2020\s*bow\s*\)\.\s*\(3\)\s*$/i;
  const match=selected.text.match(pattern);
  if(!match||
    !/\bThrice-holy Hymn to the life-giving Trinity\b/i.test(match[1])||
    !/\bThat we may receive the King of all\b/i.test(match[1])||
    !/\bescorted invisibly by ranks of angels\b/i.test(match[1])||
    !between.slice(where+1).some(row=>/^The bishop proceeds to the preparation table\b/i.test(row.text))||
    between.some(row=>row!==selected&&/\(\s*3\s*\)/.test(row.text)))
    return sections;
  const key=selected.section+':'+selected.index;
  const expanded=sections.map((part,section)=>({...part,lines:(part.lines||[]).map((raw,index)=>
   section+':'+index===key?'CLERGY: '+[match[1],match[1],match[1]].join(' '):raw)}));
  expanded.edmonton2012=true;
  return expanded;
 }

 // Edmonton 2012 episcopal liturgy pp. 65, 111: four litany replies
 // and one dismissal reply explicitly print "(3)" for repetition.
 // Only the exact recognized edition with all five occurrences qualifies.
 function expandEdmontonThreefoldResponses(sections){
  if(!Array.isArray(sections)||sections.edmonton2012!==true)return sections;
  const rows=sections.flatMap((part,section)=>(part.lines||[])
   .map((raw,index)=>({text:String(raw).trim(),section,index})));
  const head=rows.findIndex(r=>compact(r.text)==='insistentlitany');
  const close=rows.findIndex((r,i)=>i>head&&compact(r.text)==='dismissal');
  if(head<0||close<0)return sections;
  const exact=/^all\s*:\s*lord,\s*have\s+mercy\.\s*\(3\)\s*$/i;
  const counted=rows.slice(head+1,close).filter(r=>exact.test(r.text));
  const dismiss=rows.slice(close+1).filter(r=>
   /^all\s*:\s*[\u2020]?\s*glory\s+be\s+to\s+the\s+father\b/i.test(r.text)&&
   /lord,\s*have\s+mercy\.\s*\(3\)\s*\*\s*mas-?\s*ter,\s*give\s+the\s+blessing\./i.test(r.text));
  if(counted.length!==4||dismiss.length!==1||
   rows.filter(r=>/\blord,\s*have\s+mercy\.\s*\(3\)/i.test(r.text)).length!==5)
   return sections;
  const matches=new Set(counted.map(r=>r.section+':'+r.index));
  const dismissalSlot=dismiss[0].section+':'+dismiss[0].index;
  const out=sections.map((part,section)=>({...part,lines:(part.lines||[]).map((line,index)=>{
   const key=section+':'+index;
   if(matches.has(key))return String(line).replace(/\s*\(3\)\s*$/,' Lord, have mercy. Lord, have mercy.');
   if(key===dismissalSlot)return String(line)
    .replace(/Lord,\s*have\s+mercy\.\s*\(3\)/i,'Lord, have mercy. Lord, have mercy. Lord, have mercy.')
    .replace(/\bMas-\s*ter(?=,\s*give\s+the\s+blessing\.)/i,'Master');
   return line;
  })}));
  out.edmonton2012=true;
  return out;
 }



 // The English pages of the 2012 Edmonton source have 97 words broken
 // at printed line endings (74 exact non-compound split patterns).
 // The generic combiner preserves hyphens to protect genuine compounds in
 // other books. Repair only source-confirmed fragments in this edition.
 const EDMONTON_WRAPPED_SPLITS=new Set(
  'ac-claim,acknow-ledge,al-leluia,al-ways,apos-tles,as-cended,at-tentive,be-came,be-gotten,be-half,be-stowed,ben-efit,bod-ies,cheru-bim,com-mandments,com-mend,con-fidence,con-science,condem-nation,condemna-tion,confi-dence,de-ceased,dea-con,en-able,en-trance,ene-mies,evan-gelists,ex-change,fa-ther,fa-thers,for-giveness,for-sake,for-ward,glo-rify,glori-ous,govern-ment,har-mony,heav-ens,im-mortal,immacu-late,in-cense,in-finite,incon-ceivable,jus-tice,king-dom,like-ness,lov-ing,mag-nificent,mas-ter,mys-teries,nothing-ness,of-fered,offer-ing,par-don,par-takes,per-sons,pre-sented,pres-byters,pres-ent,priest-hood,pro-todeacon,re-ceived,re-spond,sal-vation,sanc-tify,sanc-tuary,ser-vant,spiri-tual,sup-per,sup-plications,through-out,to-gether,tribula-tion,ven-eration'.split(',')
 );
 function repairEdmontonWrappedWords(sections){
  if(!Array.isArray(sections)||sections.edmonton2012!==true)return sections;
  let changed=false;
  const repaired=sections.map(part=>({...part,lines:(part.lines||[]).map(line=>{
   const next=String(line).replace(/\b([A-Za-z]{2,})-([a-z]{2,})\b/g,(whole,a,b)=>{
    if(!EDMONTON_WRAPPED_SPLITS.has((a+'-'+b).toLowerCase()))return whole;
    changed=true;return a+b;
   });
   return next;
  })}));
  if(!changed)return sections;
  repaired.edmonton2012=true;
  return repaired;
 }

 // Edmonton 2012 English PDF pp. 79, 99, 109 prints three other explicit
 // "(3)" directions: the bishop's confession of love, a short private
 // prayer within One is Holy, and the people's post-Ambo hymn.
 // The Amen before the last hymn is said only once. Only expand a complete
 // matched trio in the positively identified local episcopal edition.
 function expandEdmontonRemainingThreefold(sections){
  if(!Array.isArray(sections)||sections.edmonton2012!==true)return sections;
  const rows=sections.flatMap((part,section)=>(part.lines||[])
   .map((text,index)=>({text:String(text).trim(),section,index})));
  const love=/^(?:bishop|priest)(?:\s+\d+)?\s*:\s*I will love You, O Lord, my strength;\s*the Lord is my stronghold and my refuge\.\s*\(3\)\s*$/i;
  const sinner=/\bGod,\s*be merciful to me,\s*a sinner\.\s*\(3\)\s*$/i;
  const hymn=/^all\s*:\s*Amen\.\s*Blessed be the name of the Lord now and for ever\.\s*\(3\)\s*$/i;
  const patterns=[love,sinner,hymn];
  const found=patterns.map(pattern=>rows.filter(r=>pattern.test(r.text)));
  if(found.some(group=>group.length!==1))return sections;
  const chosen=found.map(group=>group[0]);
  const positions=chosen.map(r=>rows.findIndex(x=>x.section===r.section&&x.index===r.index));
  if(!(positions[0]<positions[1]&&positions[1]<positions[2]))return sections;
  const slots=new Map(chosen.map((r,i)=>[r.section+':'+r.index,i]));
  const repeated=(text,phrase)=>String(text).replace(phrase,(_,words)=>[words,words,words].join(' '));
  const out=sections.map((part,section)=>({...part,lines:(part.lines||[]).map((line,index)=>{
   const which=slots.get(section+':'+index);
   if(which===0)return repeated(line,/(I will love You, O Lord, my strength;\s*the Lord is my stronghold and my refuge\.)\s*\(3\)\s*$/i);
   if(which===1)return repeated(line,/(God,\s*be merciful to me,\s*a sinner\.)\s*\(3\)\s*$/i);
   if(which===2)return repeated(line,/(Blessed be the name of the Lord now and for ever\.)\s*\(3\)\s*$/i);
   return line;
  })}));
  out.edmonton2012=true;
  return out;
 }

 // The Edmonton 2012 Baptismal Hymn (PDF p. 57) replaces the ordinary
 // Trisagion only on appointed feasts. Do not appoint it by default or
 // change unknown editions. A complete source signature is required.
 function edmontonBaptismalAlternative(sections){
  const starts=new Set(),lines=new Set(),found={starts,lines};
  if(!Array.isArray(sections)||sections.edmonton2012!==true)return found;
  const rows=sections.flatMap((part,section)=>(part.lines||[])
    .map((raw,index)=>({text:String(raw).trim(),section,index})));
  const match=(pattern,arr)=>arr.filter(row=>pattern.test(row.text));
  const ordinary=match(/^Trisagion Hymn$/i,rows);
  const alternate=match(/^Baptismal Hymn$/i,rows);
  if(ordinary.length!==1||alternate.length!==1)return found;
  const start=rows.indexOf(alternate[0]),before=rows.indexOf(ordinary[0]);
  if(start<=before||start-before>25)return found;
  const preceding=rows.slice(before+1,start);
  if(match(/^all\s*:\s*[\u2020]?\s*Holy God,\s*Holy and Mighty,\s*Holy and Immortal,\s*have mercy on us\.\s*(?:\(2\)|Holy God,\s*Holy and Mighty,\s*Holy and Immortal,\s*have mercy on us\.)$/i,preceding).length!==1)return found;
  const ends=match(/^(?:deacon|dcn)(?:\s+\d+)?\s*:\s*Master,\s*proceed\.$/i,rows.slice(start+1,start+14));
  if(ends.length!==1)return found;
  const body=rows.slice(start+1,rows.indexOf(ends[0]));
  const patterns=[
   /^On the Nativity of Christ,\s*Theophany,\s*Saturday of Lazarus,\s*Holy Saturday,\s*Easter Week and Pentecost,\s*we sing the Baptismal Hymn:$/i,
   /^all\s*:\s*All you who have been baptized into Christ,\s*you have put on Christ\.\s*Alleluia\.\s*(?:\(2\)|All you who have been baptized into Christ,\s*you have put on Christ\.\s*Alleluia\.)$/i,
   /^clergy\s*:\s*\S.+/i,
   /^(?:deacon|dcn)(?:\s+\d+)?\s*:\s*Give glory to Christ,\s*our God!$/i,
   /^all\s*:\s*[\u2020]?\s*Glory be to the Father\b/i,
   /^The bishop proceeds to the high place:$/i
  ];
  if(body.length!==patterns.length||!body.every((row,i)=>patterns[i].test(row.text)))return found;
  const slot=row=>row.section+':'+row.index;
  starts.add(slot(alternate[0]));
  for(const row of body)lines.add(slot(row));
  return found;
 }

 // Edmonton 2012 p. 57: the people's first Trisagion and Baptismal
 // responses each end in "(2)". The later doxology remains a distinct
 // concluding response; expand only the two marked initial stanzas.
 function expandEdmontonTrisagionTwofold(sections){
  if(!Array.isArray(sections)||sections.edmonton2012!==true||
     edmontonBaptismalAlternative(sections).starts.size!==1)return sections;
  const rows=sections.flatMap((part,section)=>(part.lines||[])
    .map((text,index)=>({text:String(text).trim(),section,index})));
  const ordinary=/^all\s*:\s*[\u2020]?\s*Holy God,\s*Holy and Mighty,\s*Holy and Immortal,\s*have mercy on us\.\s*\(2\)$/i;
  const baptism=/^all\s*:\s*All you who have been baptized into Christ,\s*you have put on Christ\.\s*Alleluia\.\s*\(2\)$/i;
  const found=[ordinary,baptism].map(pattern=>rows.filter(r=>pattern.test(r.text)));
  if(found.some(group=>group.length!==1))return sections;
  const chosen=found.map(group=>group[0]),slots=new Set(chosen.map(r=>r.section+':'+r.index));
  const out=sections.map((part,section)=>({...part,lines:(part.lines||[]).map((raw,index)=>{
   if(!slots.has(section+':'+index))return raw;
   return String(raw).replace(/^(all\s*:\s*)([\u2020]?\s*)(.+?\.)\s*\(2\)\s*$/i,
     (_,role,sign,words)=>role+sign+words+' '+words);
  })}));
  out.edmonton2012=true;
  return out;
 }

 // This is a *source fingerprint-locked* display classifier, not a typikon.
 // The 31-page St Josaphat cathedral booklet was checked with this same
 // PDF.js version and English row extraction on November 21, 2026.
 // All markers and physical row counts must match before tagging any line.
 function cathedralAntiphonRows(pages){
  const specs=[
   [4,39,[[18,/^FIRST ANTIPHON\b/i],[21,/^Sunday Antiphon\b/i]],[[21,39,'sunday']]],
   [5,36,[[1,/^Weekday Antiphon\b/i],[16,/^Typica\s*:\s*Psalm\b/i],[30,/^Small Litany\b/i]],[[1,15,'weekday'],[16,29,'typica']]],
   [6,35,[[15,/^SECOND ANTIPHON\b/i],[18,/^Sunday Antiphon\b/i]],[[18,35,'sunday']]],
   [7,38,[[1,/^Weekday Antiphon\b/i],[17,/^Typica\s*:\s*Psalm\b/i],[28,/^(?:Only[-\s]?Begotten Son|Hymn to Christ)\b/i]],[[1,16,'weekday'],[17,27,'typica']]],
   [8,33,[[1,/^Small Litany\b/i],[24,/^THIRD ANTIPHON\b/i],[27,/^Sunday Antiphon\b/i]],[[27,33,'sunday']]],
   [9,39,[[11,/^Weekday Antiphon\b/i],[27,/^(?:The\s+)?Beatitudes\b/i]],[[1,10,'sunday'],[11,26,'weekday'],[27,39,'beatitudes']]],
   [10,51,[[10,/^(?:The\s+)?(?:Small Entrance|Entrance of Christ|Little Entrance)\b/i]],[[1,9,'beatitudes']]]
  ];
  if(!pages||typeof pages!=='object')return null;
  for(const [page,size,markers] of specs){
   const rows=pages[page];
   if(!Array.isArray(rows)||rows.length!==size||rows.some(row=>typeof row?.text!=='string'||row.alternative))return null;
   if(!markers.every(([number,pattern])=>pattern.test(rows[number-1]?.text.trim()||'')))return null;
  }
  const tagged={};
  for(const [page,, ,spans] of specs){
   tagged[page]=pages[page].map((row,index)=>{
    const choice=spans.find(([start,end])=>index+1>=start&&index+1<=end);
    return choice?{...row,alternative:choice[2]}:{...row};
   });
  }
  return tagged;
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
  const result=sections.slice(si).map((part,i)=>({...part,...(i===0?{heading:null}:{}),lines:(part.lines||[]).slice(i===0?li:0)}));
  for(const part of result)part.lines=(part.lines||[]).filter(s=>!/^(?:WE\s+LEAVE\s+THE\s+WORLD(?:\s+STAND)?|STAND)$/i.test(s.trim()));
  const out=[{heading:'Liturgy of the Word',lines:[]},...result];
  if(sections.edmonton2012===true)out.edmonton2012=true;
  if(sections.newton2009===true)out.newton2009=true;
  if(sections.cathedral2020===true)out.cathedral2020=true;
  return out;
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
  // A recognizable opening prayer is not proof of the translation/edition.
  // Keep generic, privately saved PDFs readable without silently composing
  // official daily hymns into an unverified source book.
  function verifiedPrayerEdition(sections,id){
    return !!(sections&&(
      (id==='chrysostom'&&(sections.edmonton2012===true||sections.cathedral2020===true))||
      (id==='melkite-chrysostom'&&sections.newton2009===true)
    ));
  }
  return {verifiedPrayerEdition,normalize,displayPrayer,displayTitle,heading,role,speakerInstruction,properPrayerLines,pdfRows,cathedralAntiphonRows,edmontonFirstAntiphonRows,edmontonAdditionalAntiphonRows,edmontonTrisagionRows,pdfFolioLine,instruction,combine,englishPdfItems,melkiteReferenceBoundary,newtonOptionalPetitions,newtonTrisagionHymns,expandNewtonOpeningPrayers,expandNewtonTrisagionHymns,expandNewtonConcludingThreefold,expandNewtonCherubicThreefold,expandNewtonProthesisPrayer,expandNewtonPeaceLitany,expandNewtonEktene,expandNewtonGiftLitany,expandNewtonCommunionPreparation,expandNewtonAitesis,joinEdmontonGreatLitanyPageBreak,joinEdmontonCreedPageBreak,joinEdmontonChurchPrayerPageBreak,joinEdmontonLordsPrayerPageBreak,joinEdmontonThanksgivingPageBreak,joinEdmontonCommunionPrayerPageBreak,expandEdmontonCherubicThreefold,expandEdmontonThreefoldResponses,expandEdmontonRemainingThreefold,repairEdmontonWrappedWords,edmontonBaptismalAlternative,expandEdmontonTrisagionTwofold,startAtOpeningBlessing,epubPrayerSections};
});

