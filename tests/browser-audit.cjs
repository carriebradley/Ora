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
  const metrics = await heading.locator('h1').evaluate(el=>{const s=getComputedStyle(el);return [s.fontFamily,s.fontSize,s.fontWeight,s.textAlign]});
  assert.equal(metrics[1],'24px');assert.equal(metrics[3],'start');
  results.push(`${rite}/${tab}`);
 }
 await page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('ora.settings')||'{}');s.byzChurch='melkite';s.byzLiturgyChurch='melkite';s.byzAnna='9';delete s.ruthenian2026;localStorage.setItem('ora.settings',JSON.stringify(s));});
 await page.goto(`${base}index.html?tab=readings&rite=byz&date=2026-11-11`);
 assert.match(await page.locator('#app').innerText(),/Melkite Catholic Diocese of Newton/);
 assert.deepEqual(await page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('ora.settings'));return [s.byzChurch,s.byzLiturgyChurch]}),['melkite','melkite']);
 await page.goto(`${base}index.html?tab=more`);
 await page.locator('[data-act="byzchoice"][data-v="ukrainian"]').click();
 await page.goto(`${base}index.html?tab=readings&rite=byz&date=2026-11-11`);
 assert.match(await page.locator('#app').innerText(),/Edmonton/);
 assert.match(await page.locator('#app').innerText(),/Luke 12:48-59/);
 for(const rite of ['roman','byz']) {
  await page.goto(`${base}index.html?tab=pray&date=2026-11-15&rite=${rite}&kind=night`);
  assert.match(await page.locator('#app').innerText(), /Night Prayer|Song of Simeon/);
  assert.equal(await page.locator('[data-act="kind"].on').getAttribute('data-v'),'night');
 }
 await page.goto(`${base}index.html?tab=justice&date=2026-11-11`);
 const intro=page.locator('.tab-heading');
 assert.equal(await intro.locator('h1').innerText(),'Catholic Social Teaching');
 await page.waitForFunction(()=>{const el=document.querySelector('.tab-heading');if(!el)return false;const h=el.getBoundingClientRect().height;return h>0 && h<110;});
 await page.screenshot({path:path.join(artifacts,'justice-simple-mobile.png'),fullPage:true});
 await page.goto(`${base}index.html?tab=liturgy&date=2026-11-15&rite=byz`);
 assert.match(await page.locator('#app').innerText(),/Twenty-fifth Sunday after Pentecost/);
 assert.match(await page.locator('#app').innerText(),/Luke 10:25-37/);
 assert.ok(await page.locator('a[href="https://eeparchy.com/calendar/2026-11-15"]').count());
 assert.equal(await page.locator('a[href*="melkite.org"]').count(),0);
 assert.ok(await page.locator('a[href="https://nweparchy.ca/menaion/"]').count());
 await page.goto(`${base}index.html?tab=liturgy&date=2026-11-11&rite=sarum`);
 await page.locator('[data-act="liturgyview"][data-v="mass"]').click();
 assert.equal(await page.locator('#app .card > h2').innerText(),'Roman Mass');
 assert.match(await page.locator('#app').innerText(),/Saint Martin of Tours, Bishop/);
 assert.doesNotMatch(await page.locator('#app').innerText(),/Sarum Mass|Martinmas|After Trinity|Confessor/);
 assert.match(await page.locator('#app').innerText(),/current Roman Catholic lectionary/);
 assert.equal(await page.locator('a[href="https://www.usccb.org/committees/divine-worship/policies/mass-settings-texts"]').count(),1);
 assert.equal(await page.locator('a[href="https://www.usccb.org/prayer-and-worship/the-mass/order-of-mass"]').count(),1);
 await page.screenshot({path:path.join(artifacts,'current-roman-mass-mobile.png'),fullPage:true});
 await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
 const massAudit=await page.evaluate(()=>axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}}));
 violations.push(...massAudit.violations.map(v=>({tab:'liturgy-mass',id:v.id})));
 await page.locator('[data-act="liturgyview"][data-v="byz"]').click();
 assert.equal(await page.locator('#app .card > h2').innerText(),'Divine Liturgy of St. John Chrysostom');
 await require('./liturgy-reader-browser.cjs')(page,context,base,artifacts,violations);
 await require('./epub-reader-browser.cjs')(page,context,base,artifacts,violations);
 await page.goto(`${base}index.html?tab=more`);await page.locator('[data-act="settings"]').click();
 await page.selectOption('#s_reading','large');await page.locator('[data-act="savesettings"]').click();
 await page.setViewportSize({width:320,height:740});
 await page.goto(`${base}index.html?tab=justice`);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'large text at 320px');
 await page.emulateMedia({colorScheme:'dark'});
 await page.screenshot({path:path.join(artifacts,'justice-simple-dark-mobile.png'),fullPage:true});
 await page.setViewportSize({width:390,height:844});
 await page.goto(`${base}index.html?tab=today&date=2026-11-15&rite=sarum`);
 assert.match(await page.locator('.glance').innerText(),/St. Martin's Lent/);
 assert.match(await page.locator('#app').innerText(),/Sunday — no historical fast today/);
 await page.screenshot({path:path.join(artifacts,'traditional-sunday-mobile.png'),fullPage:true});
 await page.goto(`${base}index.html?tab=pray&date=2026-02-23&rite=roman&kind=morning`);
 fs.writeFileSync(path.join(artifacts,'accessibility-results.json'),JSON.stringify(violations,null,2));
 const poly=page.locator('.oortx-slot[data-k^="Church of Smyrna|"]');
 assert.equal(await poly.count(),1,'Polycarp available as Lenten commemoration');
 // Open the office and its reading as a user does. Setting nested `open`
 // attributes while the outer office is hidden races asynchronous page updates.
 await page.locator('.step').filter({has:poly}).locator(':scope > details > summary').click();
 await poly.locator('..').locator(':scope > summary').click();
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
 await context.route('https://eeparchy.com/calendar/2026-11-12',route=>route.fulfill({status:200,contentType:'text/html',body:'<!doctype html><title>Source fixture</title><p>Official-source reader test</p>'}));
 await page.locator('.liturgical-text a[href="https://eeparchy.com/calendar/2026-11-12"]').click();
 await page.waitForFunction(()=>document.querySelector('#source-reader').open);
 assert.equal(await page.locator('#source-reader-frame').isVisible(),true);
 assert.equal(await page.locator('#source-reader-original').getAttribute('href'),'https://eeparchy.com/calendar/2026-11-12');
 await page.locator('#source-reader-close').click();

 await page.evaluate(async()=>{await navigator.serviceWorker.ready;if(!navigator.serviceWorker.controller)await new Promise(r=>navigator.serviceWorker.addEventListener('controllerchange',r,{once:true}));});
 // Store the large texts once, then verify deep links and prayer data with the network disabled.
 await page.evaluate(async()=>{for(const file of ['matins.json','fathers.json','oortext.json']){const r=await fetch(file);if(!r.ok)throw new Error(file);await r.json();}});
 await context.setOffline(true);
 await page.goto(`${base}index.html?tab=today&rite=sarum&date=2026-11-15`);assert.match(await page.locator('#app').innerText(),/St. Martin's Lent/);
 const offline=await page.evaluate(async()=>{const out={};for(const f of ['matins.json','fathers.json','oortext.json']){const r=await fetch(f);out[f]=[r.status,Object.keys(await r.json()).length]}return out});
 assert.equal(offline['oortext.json'][1],64);assert.equal(offline['matins.json'][0],200);
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
 await browser.close();assert.equal(violations.length,0,'automated accessibility violations');
})().catch(e=>{console.error(e);process.exit(1)});

