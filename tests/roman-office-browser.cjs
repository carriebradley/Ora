const assert=require('node:assert/strict');
const path=require('node:path');
module.exports=async function(page,base,artifacts){
  await page.goto(`${base}index.html?tab=pray&rite=roman&date=2027-01-11&kind=morning`);
  for(const kind of ['morning','readings','evening','night']){
    await page.goto(`${base}index.html?tab=pray&rite=roman&date=2027-01-11&kind=${kind}`);
    assert.equal(await page.locator('.prayer-opening').count(),1);
    assert.equal(await page.locator('.prayer-opening .tx').innerText(),await page.evaluate(()=>CONTENT.TEXTS.cross));
    assert.equal(await page.evaluate(()=>document.querySelector('.prayer-opening').compareDocumentPosition(document.querySelector('#st0'))&Node.DOCUMENT_POSITION_FOLLOWING),4);
  }
  await page.goto(`${base}index.html?tab=pray&rite=roman&date=2027-01-11&kind=morning`);
  const official=page.locator('#st0');
  assert.match(await official.innerText(),/I lift up my heart to you, O Lord/);
  assert.match(await official.innerText(),/Give us your Spirit, Lord/);
  assert.match(await official.innerText(),/he has come to his people and set them free/);
  assert.doesNotMatch(await official.innerText(),/Intercessions \(devotional\)|Scriptural refrain:/);
  assert.equal(await official.locator('.roman-office-credit').count(),1);
  for(const colorScheme of ['light','dark'])for(const width of [320,390]){
    await page.emulateMedia({colorScheme});await page.setViewportSize({width,height:844});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    await page.screenshot({path:path.join(artifacts,`roman-icel-${width}-${colorScheme}.png`),fullPage:true});
    if(width===390)await page.screenshot({path:path.join(artifacts,`roman-icel-preview-${colorScheme}.jpg`),type:'jpeg',quality:30,fullPage:false});
  }
  // First Edition uses these same hour-specific Sunday antiphons in A/B/C.
  for(const [date,kind,pattern]of [
    ['2026-11-14','evening',/Well done, my good and faithful servant/],
    ['2026-11-15','morning',/They will see the Son of Man coming in the clouds/],
    ['2026-11-15','evening',/By your trusting acceptance of trials/]
  ]){
    await page.goto(`${base}index.html?tab=pray&rite=roman&date=${date}&kind=${kind}`);
    const text=await page.locator('#st0').innerText();assert.match(text,pattern);
    assert.doesNotMatch(text,/Scriptural refrain:/);
  }
  for(const [date,kind,pattern]of [
    ['2026-12-17','evening',/O Wisdom/],['2026-12-23','evening',/O Emmanuel/],
    ['2026-12-30','morning',/born/],['2027-01-06','morning',/seen his star/],
    ['2027-05-14','evening',/chosen you/],['2027-06-28','evening',/How glorious are the apostles/]
  ]){
    await page.goto(`${base}index.html?tab=pray&rite=roman&date=${date}&kind=${kind}`);
    const text=await page.locator('#st0').innerText();assert.match(text,pattern);
    assert.doesNotMatch(text,/Scriptural refrain:|Intercessions \(devotional\)/);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  }
  await page.goto(`${base}index.html?tab=pray&rite=roman&date=2026-11-19&kind=night`);
  assert.match(await page.locator('#st0').innerText(),/send peaceful sleep/);
  assert.match(await page.locator('#st0').innerText(),/restful night and a peaceful death/);
  assert.equal(await page.locator('#st0 .roman-office-credit').count(),1);
  for(const colorScheme of ['light','dark']){
    await page.setViewportSize({width:390,height:844});await page.emulateMedia({colorScheme});
    await page.goto(`${base}index.html?tab=pray&rite=roman&date=2027-01-17&kind=morning`);
    const office=page.locator('#st0');
    assert.match(await office.innerText(),/Blessed art thou in the holy temple/);
    assert.doesNotMatch(await office.innerText(),/Bow head|of_the_Blessed|\*/);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    await page.screenshot({path:path.join(artifacts,`roman-lauds-${colorScheme}.png`),fullPage:true});
    await page.goto(`${base}index.html?tab=pray&rite=roman&date=2027-03-30&kind=night`);
    assert.match(await page.locator('#st0').innerText(),/Psalm 91/i);
    assert.match(await page.locator('#st0').innerText(),/Regina Caeli/i);
    assert.match(await page.locator('#st0').innerText(),/reign for ever and ever/);
    assert.equal(await page.locator('#st0 details[open]').count(),0);
    await page.screenshot({path:path.join(artifacts,`roman-compline-${colorScheme}.png`),fullPage:true});
  }
  await page.goto(`${base}index.html?tab=pray&rite=roman&date=2026-11-17&kind=night`);
  const text=await page.locator('#st0').innerText();
  assert.match(text,/Psalm 143/i);assert.doesNotMatch(text,/destroy my enemies|cut off all/);
  await page.goto(`${base}index.html?tab=pray&rite=roman&date=2026-11-18&kind=night`);
  assert.match(await page.locator('#st0').innerText(),/Psalm 31/i);
  assert.doesNotMatch(await page.locator('#st0').innerText(),/vessel that is destroyed/);
  await page.goto(`${base}index.html?tab=pray&rite=roman&date=2026-11-21&kind=night`);
  assert.match(await page.locator('#st0').innerText(),/thy children/);
  await page.goto(`${base}index.html?tab=pray&rite=roman&date=2027-02-10&kind=night`);
  assert.doesNotMatch(await page.locator('#st0').innerText(),/Alleluia/i);
  await page.setViewportSize({width:320,height:720});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  for(const [date,firstPsalm,canticle]of [
    ['2026-12-24',113,/Philippians 2/],['2026-12-25',110,/Colossians 1/],
    ['2026-12-26',113,/Ephesians 1/],['2026-12-27',122,/Ephesians 1/],
    ['2027-01-02',135,/1 Timothy 3/],['2027-01-03',110,/Revelation 15/],
    ['2027-02-02',110,/Colossians 1/],['2027-03-19',15,/Revelation 15/],
    ['2027-04-05',110,/Colossians 1/],['2027-05-09',110,/Revelation 11/],
    ['2027-05-15',113,/Revelation 15/]
  ]){
    await page.goto(`${base}index.html?tab=pray&rite=roman&date=${date}&kind=evening`);
    assert.match(await page.locator('#st0 .psalm').first().innerText(),new RegExp('Psalm '+firstPsalm+'\\b','i'));
    assert.match(await page.locator('#st0').innerText(),canticle);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  }
  await page.setViewportSize({width:390,height:844});await page.emulateMedia({colorScheme:'light'});
  for(const [date,kind,prayer]of [
    ['2026-12-01','morning',/Jerusalem/],['2026-12-24','evening',/Christ/],
    ['2027-03-03','morning',/Lord/],['2027-04-01','morning',/This is the day the Lord has made/],
    ['2027-05-29','evening',/Lord/]
  ]){
    await page.goto(`${base}index.html?tab=pray&rite=roman&date=${date}&kind=${kind}`);
    const text=await page.locator('#st0').innerText();assert.match(text,prayer);
    assert.doesNotMatch(text,/Intercessions \(devotional\)|Collect \(traditional\)|Scriptural refrain:/);
    assert.equal(await page.locator('#st0 .roman-office-credit').count(),1);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  }
};
