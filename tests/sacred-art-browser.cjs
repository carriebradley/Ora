const assert=require('node:assert/strict'),path=require('node:path');
module.exports=async(page,base,artifacts)=>{
 await page.goto(`${base}index.html?tab=today&rite=byz&date=2026-11-13`);
 // Cache fictional image fixtures so this verifies rotation independently of
 // external image services, which the enclosing audit deliberately blocks.
 await page.evaluate(()=>{
  const img='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="#c6ac68"/></svg>');
  for(const a of CONTENT.ART)if(!a.image)localStorage.setItem('ora.art3.'+a.q,JSON.stringify({img,url:a.source,source:'Browser fixture',at:Date.now()}));
 });
 for(const date of ['2026-11-13','2026-12-01']){
  await page.goto(`${base}index.html?tab=today&rite=byz&date=${date}`);
  const seen=new Set();
  for(let i=0;i<18;i++){
   const key=await page.locator('.art').getAttribute('data-art-key');
   assert.ok(!seen.has(key),'Another reaches all 18 Eastern works before repeating');seen.add(key);
   assert.equal(await page.locator('.artwork-facts dt').allTextContents().then(x=>x.join('|')),'Created|Origin');
   assert.equal(await page.locator('.artwork-facts dd').count(),2);
   assert.ok((await page.locator('.artwork-facts dd').first().innerText()).trim());
   assert.ok((await page.locator('.artwork-facts dd').last().innerText()).trim());
   const a=await page.evaluate(q=>CONTENT.ART.find(a=>a.q===q),key);assert.equal(a.tr,'East');
   assert.equal(await page.locator('.art [href]').first().getAttribute('href'),a.source);
   await page.locator('.art [data-act="artnext"]').click();
  }
  assert.equal(seen.size,18);
 }
 for(const rite of ['roman','sarum']){
  await page.goto(`${base}index.html?tab=today&rite=${rite}&date=2026-11-13`);
  assert.equal(await page.locator('.artwork-facts dd').count(),2);
 }
 await page.goto(`${base}index.html?tab=today&rite=byz&date=2026-11-13`);
 // The longest preserved-site origin and two-line uncertain date must wrap.
 const target=await page.evaluate(()=>CONTENT.ART.find(a=>a.t==='Christ Pantocrator').q);
 for(let i=0;i<18&&(await page.locator('.art').getAttribute('data-art-key'))!==target;i++)await page.locator('.art [data-act="artnext"]').click();
 for(const colorScheme of ['light','dark'])for(const width of [320,390]){
  await page.emulateMedia({colorScheme});await page.setViewportSize({width,height:844});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'art caption fits narrow phones');
  await page.locator('.art').screenshot({path:path.join(artifacts,`art-caption-${width}-${colorScheme}.png`)});
 }
 await page.emulateMedia({colorScheme:'light'});await page.setViewportSize({width:390,height:844});
 console.log('Sacred art: 18-work Eastern rotation, seasonal browsing, sourced date/origin captions and narrow-phone wrapping passed.');
};
