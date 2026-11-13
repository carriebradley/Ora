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
