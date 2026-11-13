const assert=require('node:assert/strict');
module.exports=async(page,base)=>{
 for(const church of ['melkite','ukrainian']){
  await page.evaluate(church=>{const s=JSON.parse(localStorage.getItem('ora.settings')||'{}');s.byzChurch=church;s.byzLiturgyChurch=church;localStorage.setItem('ora.settings',JSON.stringify(s));},church);
  for(const kind of ['morning','evening','night']){
   await page.goto(`${base}index.html?tab=pray&rite=byz&date=2026-11-13&kind=${kind}`);
   assert.match(await page.locator('.byz-office-guide').innerText(),/Prayer companion/);
   assert.equal(await page.locator('.step .t').first().innerText(),'Sign of the Cross');
   assert.equal(await page.locator('.step .tx').first().innerText(),await page.evaluate(()=>CONTENT.TEXTS.cross));
   await page.locator('.byz-fixed-psalms > summary').click();
   assert.ok((await page.locator('.byz-fixed-psalms .tx').first().innerText()).length>100);
   if(kind==='night')assert.doesNotMatch(await page.locator('.divine-office-card').innerText(),/Song of Simeon/);
   for(const width of [320,390]){
    await page.setViewportSize({width,height:844});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   }
  }
  for(const [date,paschal,heavenly]of [['2026-04-06',true,false],['2026-05-14',false,false],['2026-05-24',false,true]]){
   await page.goto(`${base}index.html?tab=pray&rite=byz&date=${date}&kind=morning`);
   const titles=await page.locator('.step .t').allTextContents();
   assert.equal(titles.includes('O Heavenly King'),heavenly);
   assert.equal(titles.includes('Paschal opening · three times'),paschal);
  }
 }
 await page.setViewportSize({width:390,height:844});
 console.log('Byzantine companions: both churches, all three hours, Psalm text, phone widths and seasonal opening boundaries passed.');
};
