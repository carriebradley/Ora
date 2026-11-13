// Runs only for main-branch pushes in the original repository (see caller).
// Verify the actual Pages deployment after its independently running build.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
module.exports=async function(browser,artifacts){
  const base='https://carriebradley.github.io/Ora/';
  const expected=fs.readFileSync(require.resolve('../sw.js'),'utf8').match(/const V = '(ora-v\d+)'/)[1];
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
  const errors=[];
  try{
    await context.route('**/*',route=>route.request().url().startsWith(base)?route.continue():route.abort());
    let ready=false;
    for(let attempt=0;attempt<18;attempt++){
      try{
        const response=await context.request.get(base+'sw.js?audit='+Date.now(),{timeout:10000,headers:{'Cache-Control':'no-cache'}});
        const app=await context.request.get(base+'app.js?audit='+Date.now(),{timeout:10000,headers:{'Cache-Control':'no-cache'}});
        ready=response.ok()&&app.ok()&&(await response.text()).includes(`const V = '${expected}'`)
          &&(await app.text()).includes(`const APP_BUILD = '${expected}'`);
      }catch(_){/* Pages may still be deploying. */}
      if(ready)break;
      if(attempt%3===0)console.log(`Waiting for published ${expected}, attempt ${attempt+1}/18`);
      await new Promise(resolve=>setTimeout(resolve,10000));
    }
    assert.ok(ready,'Pages must serve this build before the published mobile check');
    const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
    for(const colorScheme of ['light','dark']){
      await page.emulateMedia({colorScheme});
      for(const [kind,date,pattern]of [
        ['evening','2026-11-14',/Well done, my good and faithful servant/],
        ['morning','2026-11-15',/They will see the Son of Man coming in the clouds/],
        ['evening','2026-11-15',/By your trusting acceptance of trials/],
        ['evening','2026-12-17',/O Wisdom/],
        ['evening','2026-12-23',/O Emmanuel/],
        ['morning','2026-12-30',/born/],
        ['morning','2027-01-06',/seen his star/],
        ['evening','2027-05-14',/chosen you/],
        ['evening','2027-06-28',/How glorious are the apostles/],
        ['morning','2027-01-17',/Blessed art thou in the holy temple/],
        ['evening','2026-11-12',/Magnificat/i],
        ['evening','2026-12-24',/Galatians 4:4-5/i],
        ['evening','2026-12-25',/1 John 1:1-3/i],
        ['evening','2027-01-02',/1 Timothy 3/],
        ['evening','2027-04-05',/Colossians 1/],
        ['evening','2027-05-09',/Therefore rejoice, O heavens/],
        ['evening','2027-05-16',/marriage of the Lamb is come/],
        ['night','2027-03-30',/Regina Caeli/i]
      ]){
        await page.goto(`${base}index.html?tab=pray&rite=roman&kind=${kind}&date=${date}`);
        await page.locator('#st0').waitFor();
        assert.match(await page.locator('#st0').innerText(),pattern);
        for(const width of [390,320]){
          await page.setViewportSize({width,height:844});
          assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${kind}/${width}/${colorScheme} overflow`);
        }
        await page.setViewportSize({width:390,height:844});
        await page.screenshot({path:path.join(artifacts,`published-${date}-${kind}-${colorScheme}.png`),fullPage:true});
      }
    }

    await page.goto(`${base}index.html?tab=liturgy&rite=byz&date=2026-11-15`);
    await page.locator('[data-act="liturgyview"][data-v="byz"]').click();
    assert.equal(await page.locator('.liturgy-opening .t').innerText(),'Sign of the Cross');
    assert.equal(await page.locator('.liturgy-opening .tx').innerText(),await page.evaluate(()=>CONTENT.TEXTS.cross));
    for(const width of [320,390]){
      await page.setViewportSize({width,height:844});
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'Divine Liturgy opening fits the phone');
    }
    for(const rite of ['roman','byz','sarum']){
      await page.goto(`${base}index.html?tab=today&rite=${rite}&date=2026-11-13`);
      assert.equal(await page.locator('.artwork-facts dd').count(),2,'published art has date and origin');
      assert.ok((await page.locator('.artwork-facts dd').last().innerText()).trim());
      for(const width of [320,390]){
        await page.setViewportSize({width,height:844});
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'published art caption fits');
      }
    }
    await page.goto(`${base}index.html?tab=calendar&rite=roman&date=2026-12-08`);
    assert.equal(await page.evaluate(()=>document.documentElement.style.getPropertyValue('--lit')),'#3b729f','published Marian accent is blue');
    assert.match(await page.locator('.calendar-key').innerText(),/Blue · Marian feasts/);
    assert.deepEqual(errors,[],'published app JavaScript errors');
    fs.writeFileSync(path.join(artifacts,'published-results.json'),JSON.stringify({url:base,build:expected,widths:[320,390],colorSchemes:['light','dark'],hours:['morning','evening','night'],errors},null,2));
    console.log(`Published ${expected}: Lauds, Vespers and Compline passed at 320/390px in light/dark mode.`);
  }finally{await context.close();}
};
