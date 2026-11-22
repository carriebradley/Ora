const assert=require('node:assert/strict');
module.exports=async(page,base)=>{
 const blue='#3b729f',violet='#6a3f9a',legendViolet='#8a6ba4';
 await page.goto(`${base}index.html?tab=today&rite=roman&date=2026-12-08`);
 assert.equal(await page.evaluate(()=>document.documentElement.style.getPropertyValue('--lit')),blue);
 const navColour=async()=>page.locator('nav button.on').evaluate(button=>{
  const rgba=value=>{const canvas=document.createElement('canvas');canvas.width=canvas.height=1;const ctx=canvas.getContext('2d');ctx.fillStyle=value;ctx.fillRect(0,0,1,1);return [...ctx.getImageData(0,0,1,1).data].slice(0,3);};
  const luminance=rgb=>rgb.map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((n,v,i)=>n+v*[.2126,.7152,.0722][i],0);
  const contrast=(a,b)=>{const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
  const icon=rgba(getComputedStyle(button.querySelector('b')).color),label=rgba(getComputedStyle(button).color),bg=rgba(getComputedStyle(button.closest('nav')).backgroundColor);
  return {icon,label,iconContrast:contrast(icon,bg),labelContrast:contrast(label,bg)};
 });
 for(const theme of ['light','dark']){
  await page.evaluate(theme=>{document.documentElement.dataset.theme=theme;},theme);
  const {icon,label,iconContrast,labelContrast}=await navColour();
  assert.notDeepEqual(icon,label,theme+' selected Marian icon keeps its colour');
  assert.ok(iconContrast>=3,theme+' selected icon contrast');
  assert.ok(labelContrast>=4.5,theme+' selected label contrast');
 }
 await page.goto(`${base}index.html?tab=today&rite=roman&date=2026-12-25`);
 for(const theme of ['light','dark']){
  await page.evaluate(theme=>{document.documentElement.dataset.theme=theme;},theme);
  const {iconContrast,labelContrast}=await navColour();
  assert.ok(iconContrast>=3,theme+' white feast icon contrast');
  assert.ok(labelContrast>=4.5,theme+' white feast label contrast');
 }
 await page.goto(`${base}index.html?tab=today&rite=roman&date=2026-12-08`);
 assert.equal(await page.locator('.gl[data-v="roman"] .gb').evaluate(el=>el.style.getPropertyValue('--badge-color')),blue);
 assert.equal(await page.locator('.gl[data-v="sarum"] .gb').evaluate(el=>el.style.getPropertyValue('--badge-color')),blue,'Marian feast category remains blue despite St. Martin’s Lent');
 await page.goto(`${base}index.html?tab=calendar&rite=roman&date=2026-12-08`);
 assert.match(await page.locator('.calendar-key').innerText(),/Blue · Marian feasts/);
 const dots=await page.locator('.cell[data-d="2026-12-08"] .dot').evaluateAll(ds=>ds.map(d=>({vestment:d.dataset.vestment,category:d.dataset.category,ring:d.style.getPropertyValue('--ring'),dual:d.classList.contains('dual')})));
 assert.deepEqual(dots[0],{vestment:'w',category:'blue',ring:blue,dual:true},'Roman: white Marian vestment and blue category ring');
 assert.deepEqual(dots[2],{vestment:'w',category:'blue',ring:blue,dual:true},'Traditional: white vestment and blue Marian category; fast shown separately');
 for(const church of ['ukrainian','melkite']){
  await page.evaluate(church=>{const s=JSON.parse(localStorage.getItem('ora.settings')||'{}');s.byzChurch=church;localStorage.setItem('ora.settings',JSON.stringify(s));},church);
  await page.goto(`${base}index.html?tab=today&rite=byz&date=2026-12-09`);
  assert.equal(await page.locator('.gl[data-v="byz"] .gb').evaluate(el=>el.style.getPropertyValue('--badge-color')),blue,church+' Marian feast remains blue');
  assert.equal(await page.evaluate(()=>document.documentElement.style.getPropertyValue('--lit')),blue,church);
 }
 // A fasting season must be violet even when a weekday saint receives
 // a white diocesan commemoration; direct fast days also remain violet.
 for(const church of ['ukrainian','melkite']){
  await page.evaluate(church=>{const s=JSON.parse(localStorage.getItem('ora.settings')||'{}');s.byzChurch=church;localStorage.setItem('ora.settings',JSON.stringify(s));},church);
  for(const [date,fragment] of [
   ['2026-11-17',/Nativity Fast/],
   ['2026-11-20',/Nativity Fast/],
   ['2026-12-08',/Nativity Fast/]
  ]){
   await page.goto(`${base}index.html?tab=today&rite=byz&date=${date}`);
   const row=page.locator('.gl[data-v="byz"]');
   assert.doesNotMatch(await row.innerText(),fragment,church+' '+date+' keeps fasting detail in Calendar');
   assert.ok(await row.locator('.discipline-marker').count()>0,
    church+' '+date+' has separate purple fasting guidance');
  }
  await page.goto(`${base}index.html?tab=calendar&rite=byz&date=2026-11-17`);
  const fastChip=page.locator('.chip.fast').filter({hasText:/Nativity Fast/});
  assert.ok(await fastChip.count()>0,church+' Calendar must style fasting seasons as purple chips');
  await page.goto(`${base}index.html?tab=today&rite=byz&date=2026-11-21`);
  assert.equal(await page.locator('.gl[data-v="byz"] .gb').evaluate(el=>el.style.getPropertyValue('--badge-color')),blue,
   church+' Marian feast stays blue during the Nativity Fast');
  assert.ok(await page.locator('.gl[data-v="byz"] .discipline-marker').count()>0);
 }

 // The same Byzantine fasting color must be used in the selected-calendar
 // card marker and the month grid, not only the Today badge and fast chip.
 const fastingPurple='#6a3f9a';
 for(const church of ['ukrainian','melkite']){
  await page.evaluate(church=>{
   const s=JSON.parse(localStorage.getItem('ora.settings')||'{}');
   s.byzChurch=church;localStorage.setItem('ora.settings',JSON.stringify(s));
  },church);
  await page.goto(`${base}index.html?tab=calendar&rite=byz&date=2026-11-17`);
  const byzCard=page.locator('.calendar-byz-saints').locator('..');
  assert.ok(await byzCard.locator('.sw').getAttribute('data-category'),
   church+' Byzantine selected calendar has an observance category independent of fasting');
  const layers=await page.locator('.legend button.on').evaluateAll(els=>els.map(el=>el.dataset.v));
  const byzIndex=layers.indexOf('byz');
  assert.ok(byzIndex>=0,church+' Byzantine month layer is enabled');
  assert.ok(await page.locator('.cell[data-d="2026-11-17"] .f').count()>0,
   church+' fasting season has its own calendar ƒ marker');
  assert.ok(await page.locator('.cell[data-d="2026-11-17"] .dot').nth(byzIndex).getAttribute('data-category'));
  await page.goto(`${base}index.html?tab=calendar&rite=byz&date=2026-11-21`);
  assert.equal(await page.locator('.calendar-byz-saints').locator('..').locator('.sw')
   .getAttribute('data-category'),'blue',
   church+' major Marian feast category remains blue during fasting season');
  assert.ok(await page.locator('.cell[data-d="2026-11-21"] .f').count()>0);
 }
 // A negative source fasting label must not create a violet Today badge
 // or a 'fast' Calendar chip; other genuine fasting seasons stay purple.
 await page.goto(base+'index.html?tab=today&rite=roman&date=2026-11-16');
 await page.evaluate(()=>{
  window.__oraOriginalRoman=LitCal.roman;
  LitCal.roman=(...args)=>({
   ...window.__oraOriginalRoman(...args),
   rank:'Weekday',title:'Ordinary Weekday',season:'Ordinary Time',
   color:'w',fast:'No fast',fastSeason:'',isFeast:false,also:[]
  });
 });
 try{
  await page.locator('[data-act="next"]').first().click();
  const card=page.locator('.gl[data-v="roman"]');
  assert.notEqual(await card.locator('.gb').evaluate(el=>el.style.getPropertyValue('--badge-color')),legendViolet,
   'negative fast label must not turn a neutral Today badge violet');
  assert.notEqual((await card.locator('.gb').innerText()).trim(),'Fast Day',
   'negative fast label must not become a positive fasting badge');
  await page.locator('#nav [data-tab="calendar"]').click();
  const textChip=page.locator('.chip').filter({hasText:'No fast'});
  assert.ok(await textChip.count()>0,'retain original negative calendar guidance');
  assert.equal(await page.locator('.chip.fast').filter({hasText:'No fast'}).count(),0,
   'negative fasting guidance must not be visually styled as a fast');
 }finally{
  await page.evaluate(()=>{LitCal.roman=window.__oraOriginalRoman;delete window.__oraOriginalRoman;});
 }
 // St. Martin’s Lent is a season indicator, including Sundays and feasts;
 // it does not change the underlying Sarum vestment colour or fast rules.
 for(const date of ['2026-11-11','2026-11-19','2026-11-20','2026-12-08','2026-12-24']){
  await page.goto(`${base}index.html?tab=today&rite=sarum&date=${date}`);
  assert.ok(await page.locator('.gl[data-v="sarum"] .discipline-marker').count()>0,date+' Traditional seasonal fasting indicator');
  assert.ok(await page.locator('.gl[data-v="sarum"] .gb').evaluate(el=>el.style.getPropertyValue('--badge-color')),date+' retains its own observance colour');
 }
 for(const date of ['2026-11-10','2026-11-15','2026-12-25']){
  await page.goto(`${base}index.html?tab=today&rite=sarum&date=${date}`);
  assert.notEqual(await page.locator('.gl[data-v="sarum"] .gb').evaluate(el=>el.style.getPropertyValue('--badge-color')),legendViolet,date+' outside St. Martin’s Lent');
 }
 // Sundays within St. Martin's Lent are not fast days. The Sunday badge
 // and original Sunday liturgical colour take precedence over the season.
 await page.goto(`${base}index.html?tab=today&rite=sarum&date=2026-11-15`);
 const sundayBadge=(await page.locator('.gl[data-v="sarum"] .gb').innerText()).trim();
 assert.doesNotMatch(sundayBadge,/Fast Day|Strict Fast|Fasting Season|St\. Martin's Lent/,'Sunday retains a feast or Sunday badge, never a fasting badge');
 await page.goto(`${base}index.html?tab=calendar&rite=sarum&date=2026-11-15`);
 assert.equal(await page.locator('.cell[data-d="2026-11-15"] .f').count(),0);
 // Byzantine Sundays retain their Nativity Fast season name without an
 // individual fast-day label, purple fasting chip, or month-grid fast sign.
 for(const church of ['ukrainian','melkite']){
  await page.evaluate(church=>{const s=JSON.parse(localStorage.getItem('ora.settings')||'{}');s.byzChurch=church;localStorage.setItem('ora.settings',JSON.stringify(s));},church);
  await page.goto(`${base}index.html?tab=today&rite=byz&date=2026-11-22`);
  const byzBadge=(await page.locator('.gl[data-v="byz"] .gb').innerText()).trim();
  assert.doesNotMatch(byzBadge,/Fast Day|Strict Fast|Fasting Season/,church+' Sunday must not be a fast day');
  await page.goto(`${base}index.html?tab=calendar&rite=byz&date=2026-11-22`);
  const byzCard=page.locator('.calendar-byz-saints').locator('..');
  assert.ok(await byzCard.locator('.chip').filter({hasText:/Nativity Fast/}).count()>0,church+' season remains visible');
  assert.equal(await byzCard.locator('.chip.fast').filter({hasText:/Nativity Fast/}).count(),0,church+' Sunday season is not a fasting chip');
  assert.equal(await page.locator('.cell[data-d="2026-11-22"] .f').count(),0,church+' Sunday has no fast marker');
 }
 await page.goto(`${base}index.html?tab=calendar&rite=sarum&date=2026-11-19`);
 assert.equal(await page.locator('.calendar-western-title').filter({hasText:'Thursday after the 24th Sunday'}).locator('..').locator('.sw').getAttribute('data-category'),'v','Uncelebrated St. Martin penitential weekday remains violet');
 // Traditional Advent Sundays keep the red Sarum vestment color with a
 // violet category ring; Sundays must not acquire any fasting marker.
 await page.goto(`${base}index.html?tab=calendar&rite=sarum&date=2026-12-06`);
 const active=await page.locator('.legend button.on').evaluateAll(els=>els.map(el=>el.dataset.v));
 const sarumIndex=active.indexOf('sarum');
 assert.ok(sarumIndex>=0);
 const advent=page.locator('.cell[data-d="2026-12-06"] .dot').nth(sarumIndex);
 assert.equal(await advent.getAttribute('data-vestment'),'r','Sarum Sunday source rubric is red');
 assert.equal(await advent.getAttribute('data-category'),'v','Advent category is violet');
 assert.equal(await advent.evaluate(el=>el.style.getPropertyValue('--c')),'#a8232a');
 assert.equal(await advent.evaluate(el=>el.style.getPropertyValue('--ring')),'#8a6ba4');
 assert.equal(await advent.evaluate(el=>el.classList.contains('dual')),true);
 assert.equal(await page.locator('.cell[data-d="2026-12-06"] .f').count(),0,'no Sunday fast marker');
 assert.match(await page.locator('.cell[data-d="2026-12-06"]').getAttribute('aria-label'),/Vestment color red; calendar category violet/);
 // Gaudete is a rose calendar category even when Sarum rubrics retain red
 // as the actual Sunday vestment color.
 const gaudete=page.locator('.cell[data-d="2026-12-13"] .dot').nth(sarumIndex);
 assert.equal(await gaudete.getAttribute('data-vestment'),'r');
 assert.equal(await gaudete.getAttribute('data-category'),'rose');
 assert.equal(await gaudete.evaluate(el=>el.classList.contains('dual')),true);
 const ordinaryAdvent=page.locator('.cell[data-d="2026-12-02"] .dot').nth(sarumIndex);
 assert.equal(await ordinaryAdvent.getAttribute('data-vestment'),'v');
 assert.equal(await ordinaryAdvent.getAttribute('data-category'),'v');
 assert.equal(await ordinaryAdvent.evaluate(el=>el.classList.contains('dual')),false,'same color uses only one dot');
 const detail=page.locator('.calendar-western-title').last().locator('..').locator('.sw');
 assert.equal(await detail.getAttribute('data-vestment'),'r','selected Traditional vestment is red');
 assert.equal(await detail.getAttribute('data-category'),'v','selected Traditional category is violet');
 assert.match(await page.locator('.calendar-dot-guide').innerText(),/Sundays are not fasting days/);
 await page.goto(`${base}index.html?tab=calendar&rite=roman&date=2026-05-24`);
 const pentecost=page.locator('.cell[data-d="2026-05-24"] .dot').first();
 assert.equal(await pentecost.getAttribute('data-vestment'),'r');
 assert.equal(await pentecost.getAttribute('data-category'),'r');
 assert.equal(await pentecost.evaluate(el=>el.classList.contains('dual')),false,'red on red needs no ring');
 for(const width of [320,390]){
  await page.setViewportSize({width,height:844});
  for(const theme of ['light','dark']){
   await page.evaluate(theme=>{document.documentElement.dataset.theme=theme;},theme);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'dual dots fit '+width+'px '+theme);
  }
 }
 await page.setViewportSize({width:390,height:844});
 // Today uses precisely the same two-color dots and legend-category colors
 // as Calendar for all rites, including matching-color and Sunday cases.
 await page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('ora.settings')||'{}');s.byzChurch='melkite';localStorage.setItem('ora.settings',JSON.stringify(s));});
 await page.goto(`${base}index.html?tab=today&rite=byz&date=2026-11-10`);
 const martyrRow=page.locator('.gl[data-v="byz"]'),martyrBadge=martyrRow.locator('.gb');
 assert.equal(await martyrRow.locator('.today-dot').getAttribute('data-vestment'),'g','Byzantine November 10 vestment is green');
 assert.equal(await martyrRow.locator('.today-dot').getAttribute('data-category'),'r','Byzantine November 10 calendar category is red');
 assert.equal(await martyrBadge.evaluate(el=>el.style.getPropertyValue('--badge-fill')),'#3d7a4a','Byzantine martyr badge has green fill');
 assert.equal(await martyrBadge.evaluate(el=>el.style.getPropertyValue('--badge-color')),'#b23e3e','Byzantine martyr badge has red ring');
 assert.equal(await martyrBadge.evaluate(el=>el.classList.contains('dual')),true,'Byzantine martyr badge shows two colors');
 assert.match(await martyrBadge.evaluate(el=>getComputedStyle(el).boxShadow),/3px/,'Byzantine badge draws the red outer ring');
 await page.goto(`${base}index.html?tab=today&rite=byz&date=2026-11-11`);
 const wednesday=page.locator('.gl[data-v="byz"]');
 assert.match(await wednesday.locator('.gb').innerText(),/Martyr/);
 assert.equal(await wednesday.locator('.today-dot').getAttribute('data-category'),'r','Wednesday martyrs retain red classification');
 assert.equal(await wednesday.locator('.gb').evaluate(el=>el.style.getPropertyValue('--badge-fill')),'#3d7a4a','Wednesday vestment stays green');
 assert.equal(await wednesday.locator('.gb').evaluate(el=>el.style.getPropertyValue('--badge-color')),'#b23e3e','Wednesday martyr ring is red');
 assert.equal(await wednesday.locator('.discipline-marker').getAttribute('data-discipline'),'traditional','Wednesday abstinence stays separate');
 await page.goto(`${base}index.html?tab=calendar&rite=byz&date=2026-11-11`);
 const byzLayers=await page.locator('.legend button.on').evaluateAll(els=>els.map(el=>el.dataset.v));
 const martyrDot=page.locator('.cell[data-d="2026-11-11"] .dot').nth(byzLayers.indexOf('byz'));
 assert.equal(await martyrDot.getAttribute('data-category'),'r','Calendar also retains red martyr ring');
 assert.equal(await page.locator('.cell[data-d="2026-11-11"] .f').count(),1,'Calendar shows separate abstinence ƒ');
 assert.match(await page.locator('.calendar-dot-guide').innerText(),/Purple ƒ.*abstinence guidance/);
 await page.goto(`${base}index.html?tab=today&rite=roman&date=2026-04-13`);
 const easterRoman=page.locator('.gl[data-v="roman"]');
 assert.equal(await easterRoman.locator('.gb').innerText(),'Easter Season','Easter weekday is not Ordinary Day');
 assert.equal(await easterRoman.locator('.today-dot').getAttribute('data-category'),'w','Easter weekday category is white');
 await page.goto(`${base}index.html?tab=today&rite=roman&date=2026-04-19`);
 assert.equal(await page.locator('.gl[data-v="roman"] .today-dot').getAttribute('data-category'),'w','Easter Sunday is not ordinary green');
 await page.goto(`${base}index.html?tab=today&rite=sarum&date=2026-04-13`);
 assert.notEqual(await page.locator('.gl[data-v="sarum"] .today-dot').getAttribute('data-category'),'g','Traditional Eastertide cannot be ordinary green even when a feast takes precedence');
 assert.notEqual(await page.locator('.gl[data-v="sarum"] .gb').innerText(),'Ordinary Day','Traditional Eastertide is not labeled Ordinary Day');
 await page.goto(`${base}index.html?tab=calendar&rite=roman&date=2026-04-13`);
 assert.match(await page.locator('.calendar-key').innerText(),/Off-white · Easter\/Paschal season/);
 for(const [rite,date] of [
  ['sarum','2026-12-06'],['sarum','2026-12-13'],['sarum','2026-12-02'],
  ['roman','2026-12-08'],['roman','2026-05-24'],
  ['byz','2026-11-17'],['byz','2026-11-22']
 ]){
  await page.goto(`${base}index.html?tab=today&rite=${rite}&date=${date}`);
  const row=page.locator(`.gl[data-v="${rite}"]`),todayDot=row.locator('.today-dot');
  const pair=await todayDot.evaluate(el=>({vestment:el.dataset.vestment,category:el.dataset.category,inner:el.style.getPropertyValue('--c'),ring:el.style.getPropertyValue('--ring'),dual:el.classList.contains('dual')}));
  const categoryColor=await row.evaluate(el=>el.style.getPropertyValue('--today-category'));
  const badge=row.locator('.gb');
  assert.equal(await badge.evaluate(el=>el.style.getPropertyValue('--badge-color')),categoryColor,rite+' badge ring uses category palette on '+date);
  assert.equal(await badge.evaluate(el=>el.style.getPropertyValue('--badge-fill')),pair.inner,rite+' badge fill uses vestment colour on '+date);
  assert.equal(await badge.evaluate(el=>el.classList.contains('dual')),pair.dual,rite+' badge ring only when vestment and category differ on '+date);
  assert.equal(await row.getAttribute('data-vestment'),pair.vestment);
  assert.equal(await row.getAttribute('data-category'),pair.category);
  assert.match(await row.getAttribute('aria-label'),/Vestment color .*; calendar category /);
  if(rite==='sarum'&&date==='2026-12-06'){
   assert.deepEqual(pair,{vestment:'r',category:'v',inner:'#a8232a',ring:legendViolet,dual:true},'Sarum Sunday red with violet Advent ring');
   assert.doesNotMatch((await row.locator('.gb').innerText()).trim(),/Fast Day|Strict Fast/);
  }
  await page.goto(`${base}index.html?tab=calendar&rite=${rite}&date=${date}`);
  const active=await page.locator('.legend button.on').evaluateAll(els=>els.map(el=>el.dataset.v));
  const index=active.indexOf(rite);
  assert.ok(index>=0,rite+' layer visible');
  const calendarDot=page.locator(`.cell[data-d="${date}"] .dot`).nth(index);
  assert.deepEqual(await calendarDot.evaluate(el=>({vestment:el.dataset.vestment,category:el.dataset.category,inner:el.style.getPropertyValue('--c'),ring:el.style.getPropertyValue('--ring'),dual:el.classList.contains('dual')})),pair,rite+' Today and Calendar match on '+date);
 }
 await page.goto(`${base}index.html?tab=today&rite=sarum&date=2026-12-06`);
 for(const width of [320,390]){
  await page.setViewportSize({width,height:844});
  for(const theme of ['light','dark']){
   await page.evaluate(theme=>{document.documentElement.dataset.theme=theme;},theme);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'Today dots and badges fit '+width+'px '+theme);
  }
 }
 await page.setViewportSize({width:390,height:844});
 await page.goto(`${base}index.html?tab=today&rite=roman&date=2027-03-25`);
 assert.notEqual(await page.evaluate(()=>document.documentElement.style.getPropertyValue('--lit')),blue,'Holy Thursday keeps precedence over Annunciation');
 await page.goto(`${base}index.html?tab=today&rite=roman&date=2027-04-05`);
 assert.equal(await page.evaluate(()=>document.documentElement.style.getPropertyValue('--lit')),blue,'transferred Annunciation is blue');
 await page.goto(`${base}index.html?tab=calendar&rite=roman&date=2026-12-08`);
 await page.setViewportSize({width:320,height:844});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'expanded colour legend fits');
 await page.setViewportSize({width:390,height:844});
 await page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('ora.settings')||'{}');s.byzChurch='ukrainian';localStorage.setItem('ora.settings',JSON.stringify(s));});
 console.log('Marian blue: Today badges, calendar dots and legend, Ukrainian/Melkite feasts, transfer precedence and narrow layout passed.');
};
