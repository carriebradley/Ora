const assert=require('node:assert/strict');
module.exports=async(page,base)=>{
 const blue='#3b729f';
 await page.goto(`${base}index.html?tab=today&rite=roman&date=2026-12-08`);
 assert.equal(await page.evaluate(()=>document.documentElement.style.getPropertyValue('--lit')),blue);
 assert.equal(await page.locator('.gl[data-v="roman"] .gb').evaluate(el=>el.style.getPropertyValue('--badge-color')),blue);
 assert.equal(await page.locator('.gl[data-v="sarum"] .gb').evaluate(el=>el.style.getPropertyValue('--badge-color')),blue);
 await page.goto(`${base}index.html?tab=calendar&rite=roman&date=2026-12-08`);
 assert.match(await page.locator('.calendar-key').innerText(),/Blue · Marian feasts/);
 const dots=await page.locator('.cell[data-d="2026-12-08"] .dot').evaluateAll(ds=>ds.map(d=>d.style.getPropertyValue('--c')));
 assert.equal(dots[0],blue);assert.equal(dots[2],blue);
 for(const church of ['ukrainian','melkite']){
  await page.evaluate(church=>{const s=JSON.parse(localStorage.getItem('ora.settings')||'{}');s.byzChurch=church;localStorage.setItem('ora.settings',JSON.stringify(s));},church);
  await page.goto(`${base}index.html?tab=today&rite=byz&date=2026-12-09`);
  assert.equal(await page.locator('.gl[data-v="byz"] .gb').evaluate(el=>el.style.getPropertyValue('--badge-color')),blue,church);
  assert.equal(await page.evaluate(()=>document.documentElement.style.getPropertyValue('--lit')),blue,church);
 }
 // A fasting season must be violet even when a weekday saint receives
 // a white diocesan commemoration; direct fast days also remain violet.
 const violet='#6a3f9a';
 for(const church of ['ukrainian','melkite']){
  await page.evaluate(church=>{const s=JSON.parse(localStorage.getItem('ora.settings')||'{}');s.byzChurch=church;localStorage.setItem('ora.settings',JSON.stringify(s));},church);
  for(const [date,fragment] of [
   ['2026-11-17',/Nativity Fast/],
   ['2026-11-20',/Nativity Fast/],
   ['2026-12-08',/Nativity Fast/]
  ]){
   await page.goto(`${base}index.html?tab=today&rite=byz&date=${date}`);
   const row=page.locator('.gl[data-v="byz"]');
   assert.match(await row.innerText(),fragment,church+' '+date+' retains the season');
   assert.equal(await row.locator('.gb').evaluate(el=>el.style.getPropertyValue('--badge-color')),violet,
    church+' '+date+' fasting observance must not be white');
  }
  await page.goto(`${base}index.html?tab=calendar&rite=byz&date=2026-11-17`);
  const fastChip=page.locator('.chip.fast').filter({hasText:/Nativity Fast/});
  assert.ok(await fastChip.count()>0,church+' Calendar must style fasting seasons as purple chips');
  await page.goto(`${base}index.html?tab=today&rite=byz&date=2026-11-21`);
  assert.notEqual(await page.locator('.gl[data-v="byz"] .gb').evaluate(el=>el.style.getPropertyValue('--badge-color')),violet,
   church+' major feast retains its own color, even during the Nativity Fast');
 }
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
