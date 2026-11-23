const {chromium}=require('playwright');
const fs=require('node:fs');const path=require('node:path');const os=require('node:os');const assert=require('node:assert/strict');
const artifacts=process.env.ORA_ARTIFACT_DIR || path.join(os.tmpdir(),'ora-browser-audit');fs.mkdirSync(artifacts,{recursive:true});
(async()=>{
 const browser=await chromium.launch({...(process.env.ORA_CHROMIUM ? {executablePath:process.env.ORA_CHROMIUM} : fs.existsSync('/usr/bin/chromium') ? {executablePath:'/usr/bin/chromium'} : {}),headless:true,args:['--no-sandbox']});
 const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'allow'});
 const page=await context.newPage();const errors=[],results=[],violations=[];
 page.on('pageerror',e=>{errors.push(e.message);console.error('PAGE ERROR:',e.message)});
 await context.route('**/*',route=>route.request().url().startsWith(process.env.ORA_BASE_URL || 'http://127.0.0.1:8765/')?route.continue():route.abort());
 const base=process.env.ORA_BASE_URL || 'http://127.0.0.1:8765/';
 // Source coverage belongs in More, not among the spoken prayers. The
 // national April 12 cycle must not be presented as an active selection.
 await page.goto(`${base}index.html?tab=more&date=2026-04-05&rite=byz`);
 await page.locator('[data-act="byzchoice"][data-v="ukrainian"]').click();
 await page.locator('.more-paschal-basis summary').click();
 let basisText=await page.locator('.more-paschal-basis').innerText();
 assert.match(basisText,/April 5 Paschal cycle/);
 assert.match(basisText,/St. George/);
 assert.match(basisText,/2026-04-12/);
 assert.match(basisText,/new calendar/);
 assert.match(basisText,/Julian calendar for fixed feasts/);
 assert.equal(await page.locator('.more-paschal-basis a[href="https://eeparchy.com/parishes/st-george-parish"]').count(),1);
 assert.match(basisText,/not selectable yet/);
 assert.equal(await page.locator('.more-paschal-basis a[href="https://eeparchy.com/Easter%20Program%20.pdf"]').count(),1);
 assert.equal(await page.locator('.more-paschal-basis a[href="https://ugcc.ua/data/tserkovnyy-kalendar-ugkts-na-2026-rik-8059/"]').count(),1);
 await page.locator('[data-act="byzchoice"][data-v="melkite"]').click();
 if(!(await page.locator('.more-paschal-basis').evaluate(el=>el.open)))
  await page.locator('.more-paschal-basis summary').click();
 basisText=await page.locator('.more-paschal-basis').innerText();
 assert.match(basisText,/Melkite Diocese of Newton/);
 assert.doesNotMatch(basisText,/St. George|2026-04-12/);
 await page.locator('[data-act="byzchoice"][data-v="ukrainian"]').click();
 await page.goto(`${base}index.html?tab=more&date=2027-04-04&rite=byz`);
 await page.locator('.more-paschal-basis summary').click();
 assert.match(await page.locator('.more-paschal-basis').innerText(),/checked diocesan Paschal source for 2027 has not been bundled/);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 // Browser-level prayer text checks use the actual shared formatter and
 // rendered DOM, not only static inspection of implementation source.
 await page.goto(`${base}index.html?tab=liturgy&date=2026-11-15&rite=byz`);
 const prayerRender=await page.evaluate(()=>{
  const source=[
   {text:'PRIEST: Blessed is the Kingdom of the Father',page:1,y:300,height:12},
   {text:'and of the Son and of the Holy Spirit.',page:1,y:240,height:12},
   {text:'ALL: Amen.',page:2,y:350,height:12}
  ];
  const lines=LiturgicalFormat.combine(source);
  const parent=document.createElement('div');
  parent.className='reader-byzantine-prayers';
  for(const line of lines){
   const speaker=LiturgicalFormat.role(line);
   const p=document.createElement('p');p.className='byz-prayer-line';
   if(speaker){
    const label=document.createElement('span');label.className='byz-speaker';label.textContent=speaker.name;
    const words=document.createElement('span');words.className='byz-prayer-words';words.textContent=LiturgicalFormat.displayPrayer(speaker.words);
    p.append(label,words);
   }else p.textContent=LiturgicalFormat.displayPrayer(line);
   parent.append(p);
  }
  document.body.append(parent);
  const result=[...parent.querySelectorAll('p')].map(p=>p.innerText);
  parent.remove();
  return result;
 });
 assert.equal(prayerRender.length,2,'PDF page continuation should not create a separate prayer');
 assert.match(prayerRender[0],/Priest[\\s\\S]*Blessed is the Kingdom of the Father and of the Son and of the Holy Spirit/);
 assert.match(prayerRender[1],/All[\\s\\S]*Amen/);
 // Validate source boundaries in the real mobile browser. These fixtures
 // are synthetic; they cannot certify a complete private Melkite PDF.
 const melTest=await page.evaluate(()=>{
  const classify=LiturgicalFormat.melkiteReferenceBoundary;
  const rows=[
   'The celebrant(s) alternate with the Choir the singing of the hymns',
   'Table of Kontakia for the Year',
   'O Never-Failing Protectress of Christians',
   'The Trisagion Prayer of St. John Chrysostom',
   'PRIEST: Holy God, who rest in the saints.',
   'Table of Hirmoi for the Year',
   'On the great feasts the Hirmos is appointed.',
   'During the singing of the Hirmos, the Priest continues:',
   'PRIEST: Remember, O Lord, those who bring offerings.'
  ];
  let suppressed=false;
  const visible=[];
  for(const text of rows){
   const boundary=classify(text);
   if(boundary==='kontakia-start'||boundary==='hirmoi-start'){suppressed=true;continue;}
   if(suppressed){
    if(boundary==='kontakia-end'||boundary==='hirmoi-end')suppressed=false;
    else continue;
   }
   visible.push(text);
  }
  return {visible,transliteration:[
   'Arabic: Qud---doo---son---il---laah,',
   'Greek: A---gi---os o The---os,'
  ].map(text=>({text,instruction:LiturgicalFormat.instruction(text)}))};
 });
 assert.deepEqual(melTest.visible,[
  'The Trisagion Prayer of St. John Chrysostom',
  'PRIEST: Holy God, who rest in the saints.',
  'During the singing of the Hirmos, the Priest continues:',
  'PRIEST: Remember, O Lord, those who bring offerings.'
 ]);
 assert.ok(melTest.transliteration.every(x=>!x.instruction),'sung transliterations must remain visible');
 // Saint of the Day must appear below liturgical day for Byzantine Philip on November 14.
 for(const church of ['ukrainian','melkite']){
  await page.goto(`${base}index.html?tab=more&date=2026-11-14&rite=byz`);
  await page.locator(`[data-act="byzchoice"][data-v="${church}"]`).click();
  await page.goto(`${base}index.html?tab=today&date=2026-11-14&rite=byz`);
  await page.waitForTimeout(200);
  const card=page.locator('.today-saint-bio');
  assert.equal(await card.count(),1,`${church} Philip saint card`);
  assert.match(await card.innerText(),/Holy Apostle Philip/);
  assert.equal(await card.locator('.saint-bio-portrait').count(),0,'no invented portrait for Philip');
  assert.equal(await card.locator('.saint-bio-copy').count(),1,'biography visible without artwork');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 }
 // Roman Saint of the Day includes available optional memorials without
 // changing the weekday's green vestments or replacing a solemnity's title.
 for (const [date,name,vestment,optional] of [
  ['2026-11-23','Clement','g',true],
  ['2026-11-24','Andrew Dung-Lac','r',false],
  ['2026-11-25','Catherine','g',true]
 ]) {
  await page.goto(`${base}index.html?tab=today&date=${date}&rite=roman`);
  const card=page.locator('.today-saint-bio');
  assert.equal(await card.count(),1,'Roman saint card on '+date);
  assert.equal(await card.locator('.saint-bio-fallback').count(),0,'no placeholder artwork on '+date);
  assert.equal(await card.locator('.saint-bio-copy').count(),1,'biography remains visible on '+date);
  assert.match(await card.locator('.saint-bio-name').innerText(),new RegExp(name,'i'));
  assert.equal(await card.locator('.saint-bio-meta').innerText().then(t=>/Optional memorial/.test(t)),optional,'optional label on '+date);
  assert.equal(await page.locator('.gl[data-v="roman"]').getAttribute('data-vestment'),vestment,'Roman vestment on '+date);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'Roman saint card width on '+date);
 }
 await page.goto(`${base}index.html?tab=today&date=2026-11-22&rite=roman`);
 assert.equal(await page.locator('.today-saint-bio').count(),0,'Christ the King does not appoint displaced Cecilia as Saint of the Day');
 // Melkite's dated Sunday and Great Feasts must never show a generic
 // weekday commemoration badge merely because the source is diocesan.
 await page.goto(`${base}index.html?tab=more&date=2026-11-15&rite=byz`);
 await page.locator('[data-act="byzchoice"][data-v="melkite"]').click();
 for(const [date,badge] of [
  ['2026-11-15','Sunday'],
  ['2026-11-21','Major Feast'],
  ['2026-12-08','Commemoration'],
  ['2026-12-25','Major Feast']
 ]){
  await page.goto(`${base}index.html?tab=today&date=${date}&rite=byz`);
  const row=page.locator('.gl[data-v="byz"]');
  assert.equal(await row.locator('.gb').innerText(),badge,'Melkite rank on '+date);
  assert.ok((await row.innerText()).length>18,'Melkite day title on '+date);
  if(date==='2026-11-15'){
   assert.match(await row.innerText(),/Eighth Sunday after the Holy Cross Beginning of the Nativity Fast/);
   assert.doesNotMatch(await row.innerText(),/EIGHTH SUNDAY AFTER THE HOLY CROSS/);
  }
 }
 // Each verified Byzantine bio must replace the missing-bio placeholder.
 for(const church of ['ukrainian','melkite']){
  await page.goto(`${base}index.html?tab=more&date=2026-11-16&rite=byz`);
  await page.locator(`[data-act="byzchoice"][data-v="${church}"]`).click();
  for(const [day,name] of [['16','Matthew'],['17','Gregory the Wonderworker'],['18','Plato'],['19','Obadiah'],['20',church==='ukrainian'?'Josaphata':'Gregory the Decapolite']]){
    await page.goto(`${base}index.html?tab=today&date=2026-11-${day}&rite=byz`);
    const card=page.locator('.today-saint-bio');
    assert.equal(await card.count(),1,`${church} November ${day} biography visible`);
    assert.match(await card.locator('.saint-bio-name').innerText(),new RegExp(name,'i'));
    assert.doesNotMatch(await card.innerText(),/verified biographical summary has not yet been added/i);
    assert.match(await card.locator('a.saint-bio-source').getAttribute('href'),/^https:\/\//);
  }
 }
 for (const rite of ['roman','byz','sarum']) for(const tab of ['today','pray','readings','liturgy','justice','calendar','more']) {
  await page.goto(`${base}index.html?tab=${tab}&date=2026-11-15&rite=${rite}&kind=morning`);
  await page.waitForTimeout(150);
  assert.ok((await page.locator('#app').innerText()).length>100,`${rite} ${tab} content`);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${rite} ${tab} overflow`);
  await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
  const axe=await page.evaluate(()=>axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}}));
  violations.push(...axe.violations.map(v=>({rite,tab,id:v.id,impact:v.impact,examples:v.nodes.slice(0,3).map(n=>({html:n.html,summary:n.failureSummary}))})));
  const heading = page.locator('#app > .tab-heading');
  assert.equal(await heading.count(),1,`${tab} has one page heading`);
  assert.equal(await heading.locator('h1').innerText(),({today:'Today',pray:'Divine Office',readings:'Daily Mass Readings',liturgy:'Sacred Liturgy',justice:'Catholic Social Teaching',calendar:'Calendar',more:'More'})[tab]);
  // Read the current heading atomically: asynchronous feed rendering may replace it.
  const metrics = await page.evaluate(()=>{const el=document.querySelector('#app > .tab-heading h1');const s=getComputedStyle(el);return [s.fontFamily,s.fontSize,s.fontWeight,s.textAlign]});
  assert.equal(metrics[1],'24px');assert.equal(metrics[3],'start');
  results.push(`${rite}/${tab}`);
 }
 await require('./sacred-art-browser.cjs')(page,base,artifacts);
 await require('./liturgical-colors-browser.cjs')(page,base);
 await require('./roman-office-browser.cjs')(page,base,artifacts);
 await require('./byzantine-office-browser.cjs')(page,base,artifacts);
 await require('./theme-browser.cjs')(page,base);
 await require('./swipe-browser.cjs')(browser,base);
 await require('./justice-browser.cjs')(page,base,artifacts);
 await page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('ora.settings')||'{}');s.byzChurch='melkite';s.byzLiturgyChurch='melkite';s.byzAnna='9';delete s.ruthenian2026;localStorage.setItem('ora.settings',JSON.stringify(s));});
 await page.goto(`${base}index.html?tab=readings&rite=byz&date=2026-11-11`);
 assert.match(await page.locator('#app').innerText(),/Melkite Catholic Diocese of Newton/);
 assert.deepEqual(await page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('ora.settings'));return [s.byzChurch,s.byzLiturgyChurch]}),['melkite','melkite']);
 await page.goto(`${base}index.html?tab=more`);
 await page.locator('[data-act="byzchoice"][data-v="ukrainian"]').click();
 await page.goto(`${base}index.html?tab=readings&rite=byz&date=2026-11-11`);
 assert.match(await page.locator('#app').innerText(),/Edmonton/);
 assert.match(await page.locator('#app').innerText(),/Luke 12:48-59/);
 // References absent from bundled rolling RSS must be visible without a licensed text.
 await page.goto(`${base}index.html?tab=readings&rite=roman&date=2027-01-11`);
 await page.locator('.mass-citation-provenance').waitFor();
 const verifiedMass=await page.locator('#app').innerText();
 for(const reference of ['Hebrews 1:1-6','Psalm 97:1, 2b, 6, 7c, 9','Mark 1:15','Mark 1:14-20'])
   assert.ok(verifiedMass.includes(reference),'missing Mass citation '+reference);
 assert.match(verifiedMass,/Lectionary 305/);
 assert.equal(await page.locator('.reading-group .tx').count(),0);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 for(const rite of ['roman','byz']) {
  await page.goto(`${base}index.html?tab=pray&date=2026-11-15&rite=${rite}&kind=night`);
  assert.match(await page.locator('#app').innerText(), /Night Prayer|Song of Simeon|Nunc Dimittis|Compline/i);
  assert.equal(await page.locator('[data-act="kind"].on').getAttribute('data-v'),'night');
 }
 await page.goto(`${base}index.html?tab=justice&date=2026-11-11`);
 const intro=page.locator('.tab-heading');
 assert.equal(await intro.locator('h1').innerText(),'Catholic Social Teaching');
 await page.waitForFunction(()=>{const el=document.querySelector('.tab-heading');if(!el)return false;const h=el.getBoundingClientRect().height;return h>0 && h<110;});
 await page.screenshot({path:path.join(artifacts,'justice-simple-mobile.png'),fullPage:true});
 await page.goto(`${base}index.html?tab=liturgy&date=2026-11-15&rite=byz`);
 assert.match(await page.locator('#app').innerText(),/Twenty-fifth Sunday after Pentecost/);
 assert.equal(await page.locator('.simple-liturgy-readings').count(),0,'Scripture stays in Readings');
 await page.locator('[data-act="goReadings"]').click();
 assert.match(await page.locator('#app').innerText(),/Luke 10:25-37/);
 assert.equal(await page.locator('#nav [data-tab="readings"]').getAttribute('aria-current'),'page');
 await page.goto(`${base}index.html?tab=liturgy&date=2026-11-11&rite=sarum`);
 await page.locator('[data-act="liturgyview"][data-v="mass"]').click();
 assert.match(await page.locator('#app .card > h2').innerText(),/Saint Martin of Tours, Bishop/);
 assert.doesNotMatch(await page.locator('.simple-liturgy').innerText(),/Sarum Mass|Martinmas|After Trinity|Confessor/);
 await page.screenshot({path:path.join(artifacts,'current-roman-mass-mobile.png'),fullPage:true});
 await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
 const massAudit=await page.evaluate(()=>axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}}));
 violations.push(...massAudit.violations.map(v=>({tab:'liturgy-mass',id:v.id})));
 await page.locator('[data-act="liturgyview"][data-v="byz"]').click();
 assert.match(await page.locator('.service-summary').innerText(),/Divine Liturgy of St. John Chrysostom/);
 await require('./liturgical-format-browser.cjs')(page,base,artifacts,violations);
 await require('./liturgy-reader-browser.cjs')(page,context,base,artifacts,violations);
 await require('./epub-reader-browser.cjs')(page,context,base,artifacts,violations);
 await require('./roman-missal-browser.cjs')(page,context,base,artifacts,violations);
 await page.goto(`${base}index.html?tab=more`);await page.locator('[data-act="settings"]').click();
 await page.selectOption('#s_reading','large');await page.locator('[data-act="savesettings"]').click();
 await page.setViewportSize({width:320,height:740});
 await page.goto(`${base}index.html?tab=liturgy&rite=roman&date=2026-11-12`);
 await page.locator('[data-act="liturgyview"][data-v="mass"]').click();
 await page.waitForFunction(()=>document.querySelector('.reader-inline-text')?.textContent.includes('Fixture collect'));
 const romanFont=await page.locator('.reader-inline-text').evaluate(el=>parseFloat(getComputedStyle(el).fontSize));
 assert.ok(romanFont>20,'Roman Mass respects the large reading-size setting');
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'large Roman prayers at 320px');
 await page.goto(`${base}index.html?tab=justice`);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'large text at 320px');
 await page.emulateMedia({colorScheme:'dark'});
 await page.screenshot({path:path.join(artifacts,'justice-simple-dark-mobile.png'),fullPage:true});
 await page.setViewportSize({width:390,height:844});
 await page.goto(`${base}index.html?tab=today&date=2026-11-15&rite=sarum`);
 assert.doesNotMatch(await page.locator('.glance').innerText(),/St. Martin's Lent/);
 assert.match(await page.locator('.gl[data-v="sarum"]').innerText(),/St. Machutus/);
 await page.screenshot({path:path.join(artifacts,'traditional-sunday-mobile.png'),fullPage:true});
 await page.goto(`${base}index.html?tab=calendar&date=2026-11-15&rite=sarum`);
 assert.match(await page.locator('#app').innerText(),/St. Martin's Lent/);
 assert.match(await page.locator('#app').innerText(),/Sunday — no historical fast today/);
 await page.goto(`${base}index.html?tab=pray&date=2026-02-23&rite=roman&kind=readings`);
 fs.writeFileSync(path.join(artifacts,'accessibility-results.json'),JSON.stringify(violations,null,2));
 const poly=page.locator('.oortx-slot[data-k^="Church of Smyrna|"]');
 assert.equal(await poly.count(),1,'Polycarp available as Lenten commemoration');
 await page.waitForFunction(()=>document.querySelector('.oortx-slot[data-k^="Church of Smyrna|"]')?.textContent.includes('costly spices'));
 await page.screenshot({path:path.join(artifacts,'polycarp-mobile.png'),fullPage:true});
 await page.goto(`${base}index.html?tab=pray&rite=roman`);await page.locator('[data-act="rite"][data-v="sarum"]').click();
 await page.goto(`${base}index.html?tab=pray`);assert.equal(await page.locator('[data-act="rite"].on').getAttribute('data-v'),'sarum','tradition persists');
 await page.goto(`${base}index.html?tab=pray&rite=bogus&kind=bogus&date=2026-99-99`);assert.ok((await page.locator('#app').innerText()).length>100);
 await page.goto(`${base}index.html?tab=calendar&date=2026-11-15`);
 const next=page.locator('[data-act="mnext"]');await next.focus();await page.keyboard.press('Enter');assert.equal(await page.evaluate(()=>document.activeElement?.dataset.act),'mnext');
 await page.goto(`${base}index.html?tab=more`);await page.locator('[data-act="settings"]').click();
 assert.equal(await page.locator('#s_byzchurch').inputValue(),'ukrainian');await page.locator('[data-act="savesettings"]').click();
 for (const tab of ['today','pray','readings','calendar','liturgy']) {
  await page.goto(`${base}index.html?tab=${tab}&rite=byz&date=2026-12-09`);
  if(tab==='liturgy') await page.locator('[data-act="liturgyview"][data-v="byz"]').click();
  assert.match(await page.locator('#app').innerText(),/Conception of Saint Anna/,tab+' follows Edmonton December 9');
 }
 await page.goto(`${base}index.html?tab=calendar&rite=byz&date=2026-12-08`);
 assert.match(await page.locator('#app').innerText(),/Patapius/);
 assert.doesNotMatch(await page.locator('#app').innerText(),/Archeparchy of Winnipeg|your UGCC calendar/);
 await page.goto(`${base}index.html?tab=readings&rite=byz&date=2026-05-02`);
 assert.match(await page.locator('#app').innerText(),/source conflict and was withheld/);
 await page.goto(`${base}index.html?tab=more&rite=byz&date=2026-11-12`);
 await page.locator('.more-liturgy > summary').click();
 await page.locator('[data-act="liturgyview"][data-v="byz"]').click();
 // Both More and the deep link support the device-local reader.
 if(!await page.locator('.reader-offline > summary').isVisible())await page.locator('.more-liturgy > summary').click();
 await page.locator('.reader-offline > summary').click();
 await page.waitForFunction(()=>!document.querySelector('[data-reader="open"]').disabled);
 assert.equal(await page.locator('#nav [data-tab="calendar"]').count(),1);
 // Publisher sources are consolidated under More, separate from personal books.
 await page.locator('.more-sources > summary').click();
 assert.ok(await page.locator('a[href="https://eeparchy.com/calendar"]').count());
 assert.ok(await page.locator('a[href="https://www.usccb.org/prayer-and-worship/the-mass/order-of-mass"]').count());
 assert.equal(await page.locator('.simple-liturgy-readings').count(),0);

 await page.evaluate(async()=>{await navigator.serviceWorker.ready;if(!navigator.serviceWorker.controller)await new Promise(r=>navigator.serviceWorker.addEventListener('controllerchange',r,{once:true}));});
 // Store the large texts once, then verify deep links and prayer data with the network disabled.
 await page.evaluate(async()=>{for(const file of ['matins.json','fathers.json','oortext.json']){const r=await fetch(file);if(!r.ok)throw new Error(file);await r.json();}});
 await context.setOffline(true);
 await page.goto(`${base}index.html?tab=today&rite=sarum&date=2026-11-15`);
 assert.match(await page.locator('.gl[data-v="sarum"]').innerText(),/St. Machutus/);
 assert.doesNotMatch(await page.locator('.glance').innerText(),/St. Martin's Lent/);
 await page.goto(`${base}index.html?tab=pray&rite=roman&date=2026-12-24&kind=evening`);
 assert.match(await page.locator('#st0').innerText(),/Galatians 4:4-5/i);
 assert.match(await page.locator('#st0').innerText(),/adoption of sons/);
 await page.goto(`${base}index.html?tab=pray&rite=roman&date=2027-05-09&kind=evening`);
 assert.match(await page.locator('#st0').innerText(),/Therefore rejoice, O heavens/);
 assert.doesNotMatch(await page.locator('#st0').innerText(),/Woe to the earth/);
 await page.goto(`${base}index.html?tab=pray&rite=roman&date=2027-05-16&kind=evening`);
 assert.match(await page.locator('#st0').innerText(),/marriage of the Lamb is come/);
 const offline=await page.evaluate(async()=>{const out={};for(const f of ['matins.json','fathers.json','oortext.json']){const r=await fetch(f);out[f]=[r.status,Object.keys(await r.json()).length]}return out});
 assert.equal(offline['oortext.json'][1],require('../docs/office-of-readings-availability.json').bundled);assert.equal(offline['matins.json'][0],200);
 assert.deepEqual(errors,[]);
 await context.setOffline(false);
 for(const colorScheme of ['light','dark']) {
  await page.setViewportSize({width:1280,height:900});await page.emulateMedia({colorScheme});
  await page.goto(`${base}index.html?tab=calendar&rite=sarum&date=2026-11-15`);await page.waitForTimeout(200);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
  const audit=await page.evaluate(()=>axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}}));
  violations.push(...audit.violations.map(v=>({viewport:'desktop',colorScheme,id:v.id,examples:v.nodes.slice(0,3).map(n=>({html:n.html,summary:n.failureSummary}))})));
 }
 fs.writeFileSync(path.join(artifacts,'browser-results.json'),JSON.stringify({pages:results,offline,errors,violations},null,2));
 console.log(JSON.stringify({pages:results.length,offline,errors,violations},null,2));
 if(process.env.GITHUB_ACTIONS==='true'&&process.env.GITHUB_REF==='refs/heads/main'&&process.env.GITHUB_REPOSITORY==='carriebradley/Ora')
  await require('./published-smoke.cjs')(browser,artifacts);
 console.log('Ora browser audit: all page checks complete; closing browser.');
 await browser.close();
 console.log('Ora browser audit: browser closed cleanly.');
 assert.equal(violations.length,0,'automated accessibility violations');
})().catch(e=>{console.error(e);process.exit(1)});

