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
  const toggle=page.locator('[data-act="romaninvitatory"]');
  assert.equal(await toggle.getAttribute('aria-pressed'),'false','regular Lauds opening is default');
  assert.equal(await page.locator('#st0 .sec').first().locator('b').textContent(),'Opening');
  await toggle.click();
  const intro=page.locator('#st0 .sec').first();
  assert.equal(await toggle.getAttribute('aria-pressed'),'true');
  assert.match(await intro.textContent(),/Invitatory verse.*Lord, open my lips.*mouth will proclaim your praise/s);
  assert.doesNotMatch(await intro.textContent(),/God, come to my assistance|Glory to the Father/);
  assert.match(await page.locator('#st0').innerText(),/I lift up my heart to you, O Lord/,'proper psalms unchanged');
  await page.locator('[data-act="kind"][data-v="evening"]').click();
  assert.equal(await page.locator('[data-act="romaninvitatory"]').count(),0,'Vespers has no first-Lauds option');
  assert.equal(await page.locator('#st0 .sec').first().locator('b').textContent(),'Opening','Vespers stays unchanged');
  await page.locator('[data-act="kind"][data-v="morning"]').click();
  assert.equal(await page.locator('[data-act="romaninvitatory"]').getAttribute('aria-pressed'),'true','same-day session choice preserved');
  await page.locator('[data-act="romaninvitatory"]').click();
  assert.equal(await page.locator('#st0 .sec').first().locator('b').textContent(),'Opening','toggle restores original opening');
  await page.goto(`${base}index.html?tab=pray&rite=roman&date=2027-01-12&kind=morning`);
  assert.equal(await page.locator('[data-act="romaninvitatory"]').getAttribute('aria-pressed'),'false','choice not reused on another date');
  await page.goto(`${base}index.html?tab=pray&rite=roman&date=2027-01-11&kind=morning`);
  const official=page.locator('#st0');
  assert.match(await official.innerText(),/I lift up my heart to you, O Lord/);
  assert.match(await official.locator('.sec').filter({hasText:/Hymn · historical English/i}).first().textContent(),/historical English/);
  assert.match(await official.innerText(),/Concluding prayer/i);
  assert.match(await official.innerText(),/Give us your Spirit, Lord/);
  assert.match(await official.innerText(),/he has come to his people and set them free/);
  assert.doesNotMatch(await official.innerText(),/Intercessions \(devotional\)|Scriptural refrain:/);
  assert.equal(await official.locator('.roman-office-credit').count(),1);
  // The January 11 Monday Vespers source must survive actual browser rendering.
  await page.goto(`${base}index.html?tab=pray&rite=roman&date=2027-01-11&kind=evening`);
  const evening=page.locator('#st0');
  assert.match(await evening.innerText(),/Hymn · historical English/i);
  assert.match(await evening.innerText(),/Lord, bless your people/i);
  assert.match(await evening.innerText(),/Be compassionate to those who have died/i);
  const sequence=await evening.locator('.sec > b').allTextContents();
  const ordered=['Responsory','Magnificat','Intercessions','Our Father','Concluding prayer','Conclusion'];
  let lastIndex=-1;
  for(const section of ordered){
    const nextIndex=sequence.indexOf(section);
    assert.ok(nextIndex>lastIndex,'missing or out-of-order published Vespers '+section);
    lastIndex=nextIndex;
  }
  await page.goto(`${base}index.html?tab=pray&rite=roman&date=2027-01-11&kind=morning`);
  for(const colorScheme of ['light','dark'])for(const width of [320,390]){
    await page.emulateMedia({colorScheme});await page.setViewportSize({width,height:844});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    await page.screenshot({path:path.join(artifacts,`roman-icel-${width}-${colorScheme}.png`),fullPage:true});
    if(width===390)await page.screenshot({path:path.join(artifacts,`roman-icel-preview-${colorScheme}.jpg`),type:'jpeg',quality:30,fullPage:false});
  }
  for(const [date,kind,pattern]of [
    ['2027-01-25','morning',/persecutor of Christ/],['2027-01-25','evening',/instrument.*Paul|Apostle Paul/is],
    ['2027-02-22','morning',/strengthen the faith of your brothers/],
    ['2027-04-03','evening',/Evening Prayer I/],['2027-04-07','morning',/John Baptist de la Salle/],
    ['2027-05-07','evening',/Father will send the Holy Spirit/],
    ['2027-05-17','morning',/disciples devoted themselves with one accord/],
    ['2027-05-17','evening',/Woman, behold your son/],
    ['2027-05-31','evening',/All generations will call me blessed/],
    ['2027-02-01','morning',/LXX2012/],['2026-11-17','morning',/Elizabeth/],
    ['2027-06-21','morning',/Aloysius/]
  ]){
    await page.goto(`${base}index.html?tab=pray&rite=roman&date=${date}&kind=${kind}`);
    const text=await page.locator('#st0').innerText();assert.match(text,pattern);
    assert.doesNotMatch(text,/Intercessions \(devotional\)|Short reading \(traditional chapter\)|Scriptural refrain:/);
    assert.equal(await page.locator('.prayer-opening').count(),1);
  }
  for(const [date,pattern]of [['2026-12-02',/God’s Word will come to us/],['2026-12-04',/Desire for the vision of God/],['2026-12-05',/We hope for what we do not see/],['2026-12-06',/The voice in the wilderness/],['2026-12-09',/God’s promises are held out/],['2026-12-10',/Love desires to see God/],['2026-12-13',/The voice is John/],['2026-12-15',/On humility and peace/],['2026-11-17',/Elizabeth recognized and loved Christ/],['2026-11-29',/On the twofold coming of Christ/],['2026-11-30',/We have found the Messiah/],['2026-12-01',/The marvel of the Incarnation/],['2026-12-07',/By the grace of your words/],['2027-03-23',/By one death and resurrection/],['2027-03-24',/The perfection of love/]]){
    await page.goto(`${base}index.html?tab=pray&rite=roman&date=${date}&kind=readings`);
    await page.locator('.oortx-slot').filter({hasText:pattern}).waitFor();
    const slot=page.locator('.oortx-slot').first();assert.match(await slot.innerText(),/Responsory/);
    assert.equal(await slot.locator('.roman-office-credit').count(),2);
    assert.match(await slot.locator('.oortx-source').textContent(),/No ICEL affiliation or endorsement/);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  }
  for(const colorScheme of ['light','dark']){
    await page.emulateMedia({colorScheme});await page.evaluate(()=>{const h=document.querySelector('.oortx-slot h4');if(!h)throw Error('Second-reading title missing');scrollTo(0,h.getBoundingClientRect().top+scrollY-document.querySelector('header').getBoundingClientRect().height-16);});
    await page.screenshot({path:path.join(artifacts,`oor-expanded-preview-${colorScheme}.jpg`),type:'jpeg',quality:30});
  }
  await page.emulateMedia({colorScheme:'light'});
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
  // Source: First Edition Monday Night Prayer (Vol. III p. 1275), dated
  // ordinary weekday Jan 11 2027. Check rendered order and transparent
  // alternative-translation labels, not copyrighted word-for-word parity.
  await page.goto(`${base}index.html?tab=pray&rite=roman&date=2027-01-11&kind=night`);
  const mondayNight=page.locator('#st0');
  assert.deepEqual(await mondayNight.locator('div.sec > b').allTextContents(),[
    'Opening',
    'Hymn · historical English — Before the Ending of the Day (Neale, 1852)',
    'Psalm 86 · Douay–Rheims',
    'Short reading · 1 Thessalonians 5:9–10 · Douay–Rheims',
    'Responsory',
    'Canticle of Simeon (Nunc Dimittis)',
    'Concluding prayer',
    'Blessing',
    'Salve Regina'
  ],'Monday Compline order and translation provenance');
  const psalmAntiphons=await mondayNight.locator('div.sec').nth(2).locator('.ant').allTextContents();
  assert.equal(psalmAntiphons.length,2,'Monday psalm antiphon is repeated');
  assert.equal(psalmAntiphons[0],psalmAntiphons[1]);
  const canticleAntiphons=await mondayNight.locator('div.sec').nth(5).locator('.ant').allTextContents();
  assert.equal(canticleAntiphons.length,2,'Nunc Dimittis antiphon is repeated');
  assert.equal(canticleAntiphons[0],canticleAntiphons[1]);
  assert.equal(await mondayNight.locator('details:not([open]) > summary').filter({hasText:'Examination of conscience'}).count(),1,
    'examination is available but optional');
  assert.match(await mondayNight.innerText(),/Into your hands, Lord/i,'appointed responsory visible');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'Monday Compline fits narrow phone');
  // GILH 88, 230: the Immaculate Conception's First Vespers begin on
  // December 7, and its Second Vespers are December 8. The approved
  // First Edition source selects Sunday I / II patterns respectively.
  for(const [date,part,psalmLabels,reading]of [
    ['2026-12-07','First',['Psalm 4','Psalm 134'],'Deuteronomy 6:4–7'],
    ['2026-12-08','Second',['Psalm 91'],'Revelation 22:4–5']
  ]){
    await page.goto(`${base}index.html?tab=pray&rite=roman&date=${date}&kind=night`);
    const office=page.locator('#st0');
    assert.match(await office.locator('.roman-office-heading').innerText(),
      new RegExp('Night Prayer after '+part+' Vespers.*Immaculate Conception','i'),
      date+' identifies liturgical day and Vespers context');
    const headings=await office.locator('div.sec > b').allTextContents();
    assert.deepEqual(headings.filter(x=>x.startsWith('Psalm ')),
      psalmLabels.map(x=>x+' · Douay–Rheims'),date+' appointed psalmody');
    assert.ok(headings.includes('Short reading · '+reading+' · Douay–Rheims'),
      date+' appointed reading');
    assert.equal(await office.locator('details:not([open]) > summary').filter({hasText:'Examination of conscience'}).count(),1);
    assert.equal(await office.locator('div.sec > b').filter({hasText:'Canticle of Simeon'}).count(),1);
    assert.equal(await office.locator('div.sec > b').filter({hasText:'Concluding prayer'}).count(),1);
    assert.equal(await office.locator('div.sec > b').filter({hasText:'Blessing'}).count(),1);
    assert.equal(await office.locator('div.sec > b').filter({hasText:'Salve Regina'}).count(),1);
    assert.equal(await office.locator('.ant').count(),psalmLabels.length*2+2,
      date+' psalm and Nunc Dimittis antiphons repeated');
    await page.setViewportSize({width:320,height:720});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,
      date+' contextual label fits 320px');
    await page.setViewportSize({width:390,height:844});
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
