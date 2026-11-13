const assert=require('node:assert/strict'),path=require('node:path');
module.exports=async(page,base,artifacts)=>{
 for(const church of ['melkite','ukrainian']){
  await page.evaluate(church=>{const s=JSON.parse(localStorage.getItem('ora.settings')||'{}');s.byzChurch=church;s.byzLiturgyChurch=church;localStorage.setItem('ora.settings',JSON.stringify(s));},church);
  for(const kind of ['morning','evening','night']){
   await page.goto(`${base}index.html?tab=pray&rite=byz&date=2026-11-13&kind=${kind}`);
   assert.match(await page.locator('.byz-office-guide').innerText(),/Prayer companion/);
   assert.equal(await page.locator('.step .t').first().innerText(),'Sign of the Cross');
   assert.equal(await page.locator('.step .tx').first().innerText(),await page.evaluate(()=>CONTENT.TEXTS.cross));
   await page.locator('.byz-fixed-psalms > summary').first().click();
   assert.ok((await page.locator('.byz-fixed-psalms .tx').first().innerText()).length>100);
   if(kind==='night'){assert.match(await page.locator('.divine-office-card').innerText(),/Small Doxology/);assert.match(await page.locator('.divine-office-card').innerText(),/who proceedeth from the Father/);assert.match(await page.locator('.divine-office-card').innerText(),/Sanctify our souls/);}
   if(kind==='night')assert.doesNotMatch(await page.locator('.divine-office-card').innerText(),/Song of Simeon/);
   for(const width of [320,390]){
    await page.setViewportSize({width,height:844});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   }
  }
  for(const [date,paschal,heavenly]of [['2026-04-06',true,false],['2026-05-14',false,false],['2026-05-24',false,true]]){
   await page.goto(`${base}index.html?tab=pray&rite=byz&date=${date}&kind=morning`);
   if(date==='2026-04-06'){assert.equal(await page.locator('.byz-fixed-psalms').count(),0);assert.match(await page.locator('.byz-office-guide').innerText(),/Bright Week: use the Paschal order/);}
   const titles=await page.locator('.step .t').allTextContents();
   if(date==='2026-04-06')assert.equal(titles.includes('Trisagion Prayers'),false);
   assert.equal(titles.includes('O Heavenly King'),heavenly);
   assert.equal(titles.includes('Paschal opening · three times'),paschal);
  }
 }
 await page.goto(`${base}index.html?tab=pray&rite=byz&date=2026-11-15&kind=morning`);
 assert.match(await page.locator('.divine-office-card').innerText(),/Resurrection troparion · Tone 8/);
 assert.match(await page.locator('.divine-office-card').innerText(),/Thou didst descend from on high/);
 await page.goto(`${base}index.html?tab=pray&rite=byz&date=2026-11-14&kind=evening`);
 assert.match(await page.locator('.divine-office-card').innerText(),/Resurrection troparion · Tone 8/);
 await page.goto(`${base}index.html?tab=pray&rite=byz&date=2026-11-15&kind=evening`);
 assert.doesNotMatch(await page.locator('.divine-office-card').innerText(),/Resurrection troparion/);
 for(const [date,kind,pattern]of [['2026-11-20','evening',/Entrance of the Mother of God · Troparion/],['2026-11-21','morning',/Entrance of the Mother of God · Troparion/],['2026-12-24','evening',/Nativity of our Lord · Troparion/]]){
  await page.goto(`${base}index.html?tab=pray&rite=byz&date=${date}&kind=${kind}`);
  assert.match(await page.locator('.divine-office-card').innerText(),pattern);
 }
 await page.goto(`${base}index.html?tab=pray&rite=byz&date=2026-11-13&kind=night`);
 for(const colorScheme of ['light','dark']){
  await page.emulateMedia({colorScheme});await page.setViewportSize({width:390,height:844});
  await page.locator('.step').filter({has:page.locator('.t',{hasText:'Prayer to the Mother of God'})}).first().scrollIntoViewIfNeeded();
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.screenshot({path:path.join(artifacts,`byzantine-expanded-preview-${colorScheme}.jpg`),type:'jpeg',quality:30});
 }
 await page.emulateMedia({colorScheme:'light'});
 await page.setViewportSize({width:390,height:844});
 console.log('Byzantine companions: both churches, all three hours, Psalm text, phone widths and seasonal opening boundaries passed.');
};
