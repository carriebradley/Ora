const {chromium}=require('playwright');
const fs=require('node:fs');const path=require('node:path');const os=require('node:os');const assert=require('node:assert/strict');
const artifacts=process.env.ORA_ARTIFACT_DIR || path.join(os.tmpdir(),'ora-browser-audit');fs.mkdirSync(artifacts,{recursive:true});
(async()=>{
 const browser=await chromium.launch({...(process.env.ORA_CHROMIUM ? {executablePath:process.env.ORA_CHROMIUM} : fs.existsSync('/usr/bin/chromium') ? {executablePath:'/usr/bin/chromium'} : {}),headless:true,args:['--no-sandbox']});
 const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'allow'});
 const page=await context.newPage();const errors=[],results=[],violations=[];
 page.on('pageerror',e=>errors.push(e.message));
 await context.route('**/*',route=>route.request().url().startsWith(process.env.ORA_BASE_URL || 'http://127.0.0.1:8765/')?route.continue():route.abort());
 const base=process.env.ORA_BASE_URL || 'http://127.0.0.1:8765/';
 for (const rite of ['roman','byz','sarum']) for(const tab of ['today','pray','readings','justice','calendar','more']) {
  await page.goto(`${base}index.html?tab=${tab}&date=2026-11-15&rite=${rite}&kind=morning`);
  await page.waitForTimeout(150);
  assert.ok((await page.locator('#app').innerText()).length>100,`${rite} ${tab} content`);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${rite} ${tab} overflow`);
  await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
  const axe=await page.evaluate(()=>axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}}));
  violations.push(...axe.violations.map(v=>({rite,tab,id:v.id,impact:v.impact,examples:v.nodes.slice(0,3).map(n=>({html:n.html,summary:n.failureSummary}))})));
  results.push(`${rite}/${tab}`);
 }
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
 await page.goto(`${base}index.html?tab=more`);await page.locator('[data-act="settings"]').click();await page.selectOption('#s_byz_church','ruthenian');await page.locator('[data-act="savesettings"]').click();
 await page.goto(`${base}index.html?tab=today&rite=byz&date=2026-12-08`);assert.match(await page.locator('#app').innerText(),/Conception/);
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
