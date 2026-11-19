const assert=require('node:assert/strict');
module.exports=async(page,base)=>{
 const blue='#3b729f',violet='#6a3f9a';
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
 assert.equal(await page.locator('.gl[data-v="sarum"] .gb').evaluate(el=>el.style.getPropertyValue('--badge-color')),violet,'St. Martin’s Lent remains purple on a Marian feast');
 await page.goto(`${base}index.html?tab=calendar&rite=roman&date=2026-12-08`);
 assert.match(await page.locator('.calendar-key').innerText(),/Blue · Marian feasts/);
 const dots=await page.locator('.cell[data-d="2026-12-08"] .dot').evaluateAll(ds=>ds.map(d=>d.style.getPropertyValue('--c')));
 assert.equal(dots[0],blue);assert.equal(dots[2],violet);
 for(const church of ['ukrainian','melkite']){
  await page.evaluate(church=>{const s=JSON.parse(localStorage.getItem('ora.settings')||'{}');s.byzChurch=church;localStorage.setItem('ora.settings',JSON.stringify(s));},church);
  await page.goto(`${base}index.html?tab=today&rite=byz&date=2026-12-09`);
  assert.equal(await page.locator('.gl[data-v="byz"] .gb').evaluate(el=>el.style.getPropertyValue('--badge-color')),violet,church);
  assert.equal(await page.evaluate(()=>document.documentElement.style.getPropertyValue('--lit')),violet,church);
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
   assert.equal(await row.locator('.gb').evaluate(el=>el.style.getPropertyValue('--badge-color')),violet,
    church+' '+date+' fasting observance must not be white');
  }
  await page.goto(`${base}index.html?tab=calendar&rite=byz&date=2026-11-17`);
  const fastChip=page.locator('.chip.fast').filter({hasText:/Nativity Fast/});
  assert.ok(await fastChip.count()>0,church+' Calendar must style fasting seasons as purple chips');
  await page.goto(`${base}index.html?tab=today&rite=byz&date=2026-11-21`);
  assert.equal(await page.locator('.gl[data-v="byz"] .gb').evaluate(el=>el.style.getPropertyValue('--badge-color')),violet,
   church+' major feast stays purple during the Nativity Fast');
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
  assert.equal(await byzCard.locator('.sw').evaluate(el=>el.style.getPropertyValue('--c')),fastingPurple,
   church+' Byzantine calendar card marker must be purple within the Nativity Fast');
  const layers=await page.locator('.legend button.on').evaluateAll(els=>els.map(el=>el.dataset.v));
  const byzIndex=layers.indexOf('byz');
  assert.ok(byzIndex>=0,church+' Byzantine month layer is enabled');
  assert.equal(await page.locator('.cell[data-d="2026-11-17"] .dot').nth(byzIndex)
   .evaluate(el=>el.style.getPropertyValue('--c')),fastingPurple,
   church+' Byzantine monthly calendar dot must match fasting color');
  await page.goto(`${base}index.html?tab=calendar&rite=byz&date=2026-11-21`);
  assert.equal(await page.locator('.calendar-byz-saints').locator('..').locator('.sw')
   .evaluate(el=>el.style.getPropertyValue('--c')),violet,
   church+' major Marian feast stays purple during fasting season');
 }
 // St. Martin’s Lent is a season indicator, including Sundays and feasts;
 // it does not change the underlying Sarum vestment colour or fast rules.
 for(const date of ['2026-11-11','2026-11-15','2026-11-19','2026-11-20','2026-12-08','2026-12-24']){
  await page.goto(`${base}index.html?tab=today&rite=sarum&date=${date}`);
  assert.equal(await page.locator('.gl[data-v="sarum"] .gb').evaluate(el=>el.style.getPropertyValue('--badge-color')),violet,date+' Traditional badge');
  assert.equal(await page.evaluate(()=>document.documentElement.style.getPropertyValue('--lit')),violet,date+' selected Traditional colour');
 }
 for(const date of ['2026-11-10','2026-12-25']){
  await page.goto(`${base}index.html?tab=today&rite=sarum&date=${date}`);
  assert.notEqual(await page.locator('.gl[data-v="sarum"] .gb').evaluate(el=>el.style.getPropertyValue('--badge-color')),violet,date+' outside St. Martin’s Lent');
 }
 await page.goto(`${base}index.html?tab=calendar&rite=sarum&date=2026-11-19`);
 assert.equal(await page.locator('.calendar-western-title').filter({hasText:'Thursday after the 24th Sunday'}).locator('..').locator('.sw').evaluate(el=>el.style.getPropertyValue('--c')),violet,'Traditional calendar marker');
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
