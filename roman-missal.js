/* Matches calendar facts to headings in a private, device-local book. No book text. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.RomanMissal=factory();})(typeof self!=='undefined'?self:this,function(){
 const ordinals=['first','second','third','fourth','fifth','sixth','seventh','eighth','ninth','tenth','eleventh','twelfth','thirteenth','fourteenth','fifteenth','sixteenth','seventeenth','eighteenth','nineteenth','twentieth','twenty first','twenty second','twenty third','twenty fourth','twenty fifth','twenty sixth','twenty seventh','twenty eighth','twenty ninth','thirtieth','thirty first','thirty second','thirty third','thirty fourth'];
 function key(value){
  let s=value.toLowerCase().replace(/\([^)]*divine mercy[^)]*\)/g,'').normalize('NFKD').replace(/[’']/g,'').replace(/[^a-z0-9]+/g,' ').trim();
  s=s.replace(/^(january|february|march|april|may|june|july|august|september|october|november|december) \d{1,2}\b/,'');
  [...ordinals].sort((a,b)=>b.length-a.length).forEach(w=>{s=s.replace(new RegExp('\\b'+w+'\\b','g'),String(ordinals.indexOf(w)+1));});
  s=s.replace(/\b(\d+)(st|nd|rd|th)\b/g,'$1').replace(/\bst\b/g,'saint').replace(/\b(the|of|in|and|a|an|optional|memorial|feast|solemnity|transferred)\b/g,' ').replace(/\s+/g,' ').trim();
  s=s.replace(/nativity christmas/g,'christmas').replace(/^sunday after epiphany lord (?=baptism lord$)/,'').replace(/^1 sunday after pentecost (?=most holy trinity$)/,'').replace(/^last sunday ordinary time (?=our lord jesus christ king universe$)/,'').replace(/^pentecost (?:at )?mass during day$/,'pentecost sunday');
  const weekday=s.match(/^(monday|tuesday|wednesday|thursday|friday|saturday) (\d+) week (advent|lent|easter|ordinary time)$/);
  if(weekday)s=weekday[3]==='ordinary time'?weekday[2]+' week ordinary time':weekday[3]+' '+weekday[2]+' '+weekday[1];
  return s;
 }
 function match(sections,title){
  const wanted=key(title),hits=[];
  if(!wanted)return [];
  sections.forEach((s,i)=>{if(key(s.title)===wanted||(wanted==='easter sunday resurrection lord'&&key(s.context||'')==='easter time'&&/^(?:at )?mass during day$/.test(key(s.title))))hits.push(i+1);});
  return hits.length===1?hits:[]; // Never silently choose between alternative Masses.
 }
 function order(sections){return sections.flatMap((s,i)=>/^the introductory rites$/i.test(s.title.trim())?[{title:s.title,page:i+1}]:[]).slice(0,1);}

 // Display-only filtering: saved personal documents remain intact.
 const prayerHeading=/^(?:entrance antiphon|collect|prayer over the offerings|prayer after communion|communion antiphon|responsorial psalm|psalm \d+|first reading|second reading|gospel|alleluia|gloria|glory to god|apostles.? creed|nicene creed|profession of faith|kyrie|holy holy|sanctus|agnus dei|lamb of god|preface|eucharistic prayer|the introductory rites|the liturgy of the word|the liturgy of the eucharist|the concluding rites)\b/i;
 const direction=/^(?:rubric|instructions?\b|note to (?:the )?(?:priest|reader|celebrant)|the (?:priest|deacon|celebrant|reader) (?:then |now )?(?:says|takes|bows|stands|extends|raises|places|turns|invites|continues|joins|makes|returns|approaches)|(?:all |the people )?(?:stand|sit|kneel)\b|if (?:there is|appropriate|the)|when (?:the|all)|on (?:sundays|weekdays)|for (?:the|a) (?:optional|memorial)|see (?:page|the|also)|turn to |from the common of )/i;
 function prayers(part){
  if(!part||!Array.isArray(part.blocks))return part;
  const blocks=part.blocks;let start=blocks.findIndex(b=>prayerHeading.test(b.text.trim()));
  if(start<0)start=0; // Never discard a section without recognized labels.
  const kept=blocks.slice(start).filter(b=>!direction.test(b.text.trim())&&!/^\[Image:/.test(b.text.trim())&&!/^>>|^preface (?:of|i\b|ii\b)|^\[sample\]/i.test(b.text.trim())&&!/^(?:and all pray in silence|let us pray\.|the priest says|the priest continues)/i.test(b.text.trim()));
  return {...part,blocks:kept.length?kept:blocks};
 }
 function ordinary(sections){
  const wanted=[['Gloria',/^(?:gloria|glory to god in the highest)$/i],['Creed',/^(?:nicene creed|apostles.? creed|profession of faith|the creed)$/i]];
  return wanted.flatMap(([title,re])=>{const i=sections.findIndex(s=>re.test(s.title.trim()));return i<0?[]:[{title,page:i+1}];});
 }

 function fixed(sections,type){
  const patterns={
   gloria:/^(?:the )?(?:gloria|glory to god(?: in the highest)?|gloria in excelsis(?: deo)?)\b/i,
   creed:/^(?:the )?(?:nicene(?:[- ]constantinopolitan)? creed|profession of faith|the creed|creed)\b/i,
   1:/^(?:the )?eucharistic prayer (?:i|1)(?:\b|$)/i,
   2:/^(?:the )?eucharistic prayer (?:ii|2)(?:\b|$)/i,
   3:/^(?:the )?eucharistic prayer (?:iii|3)(?:\b|$)/i,
   4:/^(?:the )?eucharistic prayer (?:iv|4)(?:\b|$)/i
  };
  const re=patterns[type];if(!re)return null;
  const headings=sections.map((s,i)=>({s,i})).filter(x=>re.test(x.s.title.trim()));
  if(headings.length===1)return headings[0].s;
  // Some EPUBs place the title within a larger Order of Mass section.
  const embedded=sections.flatMap(s=>s.blocks.flatMap((b,i)=>re.test(b.text.trim())?[{s,i}]:[]));
  if(embedded.length!==1)return null;
  const {s,i}=embedded[0],ending=s.blocks.findIndex((b,j)=>j>i&&/^h[1-6]$/.test(b.tag)&&/^(?:the )?(?:eucharistic prayer|gloria|creed|profession of faith|communion rite|concluding rites)\b/i.test(b.text));
  return {title:s.blocks[i].text,blocks:s.blocks.slice(i+1,ending<0?undefined:ending)};
 }

 function propers(part){
  const out={entrance:[],collect:[],offerings:[],communion:[],after:[]};
  const heads=[['entrance',/^entrance antiphon\b/i],['collect',/^(?:collect|opening prayer)\b/i],['offerings',/^prayer over the offerings\b/i],['communion',/^communion antiphon\b/i],['after',/^prayer after communion\b/i]];
  let active=null;
  for(const block of prayers(part).blocks){
    const v=block.text.trim(),h=heads.find(([,re])=>re.test(v));
    if(h){active=h[0];const rest=v.replace(h[1],'').replace(/^[\s|:;·-]+/,'').trim();if(rest&&!/^(?:mt|mk|lk|jn|ps|cf|rev|rom|heb)\s*[.:]?\s*\d/i.test(rest))out[active].push({tag:'p',text:rest});continue;}
    if(!active)continue;
    // A new Mass heading closes the previous proper. Without this guard,
    // subsequent rites and copyright notes can leak into a daily prayer.
    if(/^(?:preface\b|liturgy of the|introductory rites\b|penitential act\b|the order of mass\b|eucharistic prayer\b|responsorial psalm\b|first reading\b|second reading\b|gospel\b|alleluia\b|offertory\b|communion rite\b|concluding rites\b|blessing\b|dismissal\b|copyright\b|all rights reserved)/i.test(v))active=null;
    if(!active || /^(?:>>|\[Image:)/.test(v))continue;
    out[active].push(block);
  }
  return out;
 }
 return {match,order,key,prayers,ordinary,fixed,propers};
});
