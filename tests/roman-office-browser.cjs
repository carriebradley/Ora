const assert=require('node:assert/strict');
const path=require('node:path');
module.exports=async function(page,base,artifacts){
  for(const colorScheme of ['light','dark']){
    await page.setViewportSize({width:390,height:844});await page.emulateMedia({colorScheme});
    await page.goto(`${base}index.html?tab=pray&rite=roman&date=2027-01-17&kind=morning`);
    const office=page.locator('#st0');
    assert.match(await office.innerText(),/Blessed art thou in the holy temple/);
    assert.doesNotMatch(await office.innerText(),/Bow head|of_the_Blessed/);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    await page.screenshot({path:path.join(artifacts,`roman-lauds-${colorScheme}.png`),fullPage:true});
    await page.goto(`${base}index.html?tab=pray&rite=roman&date=2027-03-30&kind=night`);
    assert.match(await page.locator('#st0').innerText(),/Psalm 91/);
    assert.match(await page.locator('#st0').innerText(),/Regina Caeli/);
    assert.match(await page.locator('#st0').innerText(),/reign for ever and ever/);
    assert.equal(await page.locator('#st0 details[open]').count(),0);
    await page.screenshot({path:path.join(artifacts,`roman-compline-${colorScheme}.png`),fullPage:true});
  }
  await page.goto(`${base}index.html?tab=pray&rite=roman&date=2026-11-17&kind=night`);
  const text=await page.locator('#st0').innerText();
  assert.match(text,/Psalm 143/);assert.doesNotMatch(text,/destroy my enemies|cut off all/);
  await page.goto(`${base}index.html?tab=pray&rite=roman&date=2026-11-18&kind=night`);
  assert.match(await page.locator('#st0').innerText(),/Psalm 31/);
  assert.doesNotMatch(await page.locator('#st0').innerText(),/vessel that is destroyed/);
  await page.goto(`${base}index.html?tab=pray&rite=roman&date=2026-11-21&kind=night`);
  assert.match(await page.locator('#st0').innerText(),/thy children/);
  await page.goto(`${base}index.html?tab=pray&rite=roman&date=2027-02-10&kind=night`);
  assert.doesNotMatch(await page.locator('#st0').innerText(),/Alleluia/i);
  await page.setViewportSize({width:320,height:720});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.setViewportSize({width:390,height:844});await page.emulateMedia({colorScheme:'light'});
};
