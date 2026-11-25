// Runs only for main-branch pushes in the original repository (see caller).
// Verify the actual Pages deployment after its independently running build.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
module.exports=async function(browser,artifacts){
  const base='https://carriebradley.github.io/Ora/';
  const expected=fs.readFileSync(require.resolve('../sw.js'),'utf8').match(/const V = '(ora-v\d+)'/)[1];
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
  const errors=[],resourceFailures=[];
  const prayerUrl=(kind,date)=>`${base}index.html?tab=pray&rite=roman&kind=${kind}&date=${date}`;
  const isAppResource=request=>request.url().startsWith(base)&&['document','script'].includes(request.resourceType());
  let step='initialization',currentUrl=base,lastDeployment=null,page=null;
  const checkpoint=(label,url=currentUrl)=>{
    step=label;currentUrl=url;
    const record={expected,sha:process.env.GITHUB_SHA||null,step,url,at:new Date().toISOString(),deployment:lastDeployment};
    fs.writeFileSync(path.join(artifacts,'published-progress.json'),JSON.stringify(record,null,2));
    console.log(`[published-smoke] ${label}: ${url}`);
  };
  const visit=async(url,label)=>{
    checkpoint(label,url);
    await page.goto(url);
    assert.deepEqual(resourceFailures,[],'published app document and script requests');
    assert.deepEqual(errors,[],'published app JavaScript errors');
  };
  try{
    checkpoint('waiting for published build',base);
    await context.route('**/*',route=>route.request().url().startsWith(base)?route.continue():route.abort());
    let ready=false;
    for(let attempt=0;attempt<18;attempt++){
      try{
        const response=await context.request.get(base+'sw.js?audit='+Date.now(),{timeout:10000,headers:{'Cache-Control':'no-cache'}});
        const app=await context.request.get(base+'app.js?audit='+Date.now(),{timeout:10000,headers:{'Cache-Control':'no-cache'}});
        const workerText=await response.text(),appText=await app.text();
        lastDeployment={
          workerStatus:response.status(),appStatus:app.status(),
          workerBuild:workerText.match(/const V = '(ora-v\d+)'/)?.[1]||null,
          appBuild:appText.match(/const APP_BUILD = '(ora-v\d+)'/)?.[1]||null
        };
        ready=response.ok()&&app.ok()&&lastDeployment.workerBuild===expected&&lastDeployment.appBuild===expected;
      }catch(e){lastDeployment={attempt:attempt+1,error:String(e)};}
      if(ready)break;
      if(attempt%3===0)checkpoint(`waiting for published ${expected}, attempt ${attempt+1}/18`,base);
      await new Promise(resolve=>setTimeout(resolve,10000));
    }
    assert.ok(ready,'Pages must serve this build before the published mobile check');
    checkpoint('published build ready',base);
    page=await context.newPage();
    page.on('pageerror',e=>errors.push(e.message));
    page.on('response',response=>{
      const status=response.status();
      if(status>=400&&isAppResource(response.request()))resourceFailures.push({url:response.url(),status});
    });
    page.on('requestfailed',request=>{
      if(isAppResource(request))resourceFailures.push({url:request.url(),error:request.failure()?.errorText});
    });

    // App and worker version markers can arrive before the rest of the shell.
    // Retry only when a document or script actually fails to load.
    const startupUrl=prayerUrl('evening','2026-11-14');
    for(let attempt=1;attempt<=3;attempt++){
      checkpoint(`published prayer startup ${attempt}/3`,startupUrl);
      try{
        await page.goto(startupUrl,{waitUntil:'domcontentloaded',timeout:15000});
        assert.deepEqual(resourceFailures,[],'published startup document and scripts loaded');
        assert.deepEqual(errors,[],'published prayer startup JavaScript errors');
        assert.ok(await page.locator('#st0').isVisible(),'published prayer rendered after page load');
        break;
      }catch(err){
        const retryable=resourceFailures.length>0&&resourceFailures.every(({status})=>
          status===undefined||status===404||status===408||status===429||status>=500);
        if(!retryable||attempt===3)throw err;
        console.log('[published-smoke] retrying startup after asset failure: '+JSON.stringify({attempt,resourceFailures,errors}));
        await new Promise(resolve=>setTimeout(resolve,5000));
        resourceFailures.length=0;
        errors.length=0;
      }
    }
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
        await visit(prayerUrl(kind,date),`Roman ${kind} ${date} ${colorScheme}`);
        await page.locator('#st0').waitFor();
        assert.match(await page.locator('#st0').innerText(),pattern);
        for(const width of [390,320]){
          await page.setViewportSize({width,height:844});
          assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${kind}/${width}/${colorScheme} overflow`);
        }
        await page.setViewportSize({width:390,height:844});
        checkpoint(`Roman ${kind} ${date} ${colorScheme} screenshot`);
        await page.screenshot({path:path.join(artifacts,`published-${date}-${kind}-${colorScheme}.png`),fullPage:true});
      }
    }

    await visit(`${base}index.html?tab=liturgy&rite=byz&date=2026-11-15`,'Byzantine Divine Liturgy');
    await page.locator('[data-act="liturgyview"][data-v="byz"]').click();
    assert.equal(await page.locator('.liturgy-opening .t').innerText(),'Sign of the Cross');
    assert.equal(await page.locator('.liturgy-opening .tx').innerText(),await page.evaluate(()=>CONTENT.TEXTS.cross));
    for(const width of [320,390]){
      await page.setViewportSize({width,height:844});
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'Divine Liturgy opening fits the phone');
    }
    for(const rite of ['roman','byz','sarum']){
      await visit(`${base}index.html?tab=today&rite=${rite}&date=2026-11-13`,`Artwork ${rite}`);
      assert.equal(await page.locator('.artwork-facts dd').count(),2,'published art has date and origin');
      assert.ok((await page.locator('.artwork-facts dd').last().innerText()).trim());
      for(const width of [320,390]){
        await page.setViewportSize({width,height:844});
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'published art caption fits');
      }
    }
    // Both joyful Sundays are rose. Laetare remains in Lent, but Sundays
    // are never fast days, so fasting-day purple must not override rose.
    for(const [date,badge,title,colour]of [
      ['2026-12-13','Gaudete',/Gaudete Sunday.*Third Sunday of Advent/,'#c9899e'],
      ['2027-03-07','Laetare',/Laetare Sunday.*Fourth Sunday of Lent/,'#c9899e']
    ]){
      await visit(`${base}index.html?tab=today&rite=roman&date=${date}`,`Rose Sunday ${date}`);
      const card=page.locator('.gl[data-v="roman"]');
      assert.equal(await card.locator('.gb').innerText(),badge,date+' rose Sunday badge');
      assert.match((await card.innerText()).replace(/\s+/g,' '),title,date+' correct joy Sunday');
      assert.equal(await page.evaluate(()=>document.documentElement.style.getPropertyValue('--lit')),colour,date+' Roman accent');
      for(const width of [320,390]){
        await page.setViewportSize({width,height:844});
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,date+' rose day has no horizontal overflow');
      }
      await page.setViewportSize({width:390,height:844});
    }
    await visit(`${base}index.html?tab=calendar&rite=roman&date=2026-12-08`,'Marian calendar accent');
    assert.equal(await page.evaluate(()=>document.documentElement.style.getPropertyValue('--lit')),'#8a6ba4','published Advent season accent is violet despite Marian feast');
    const guide = page.locator('.calendar-guide');
    assert.equal(await guide.evaluate(el => el.open),false,'published color guide is collapsed by default');
    await guide.locator('summary').click();
    assert.equal(await guide.evaluate(el => el.open),true,'published color guide opens on tap');
    assert.match(await page.locator('.calendar-key').innerText(),/Blue · Marian observance accent/);
    assert.deepEqual(errors,[],'published app JavaScript errors');
    fs.writeFileSync(path.join(artifacts,'published-results.json'),JSON.stringify({url:base,build:expected,widths:[320,390],colorSchemes:['light','dark'],hours:['morning','evening','night'],errors},null,2));
    checkpoint('published smoke passed');
    console.log(`Published ${expected}: Lauds, Vespers and Compline passed at 320/390px in light/dark mode.`);
  }catch(err){
    const failure={
      expected,sha:process.env.GITHUB_SHA||null,step,
      url:page?.url()||currentUrl,deployment:lastDeployment,errors,resourceFailures,
      error:err?.stack||String(err),at:new Date().toISOString()
    };
    fs.writeFileSync(path.join(artifacts,'published-failure.json'),JSON.stringify(failure,null,2));
    console.error('[published-smoke] FAILURE\n'+JSON.stringify(failure,null,2));
    if(page){
      try{await page.screenshot({path:path.join(artifacts,'published-failure.png'),fullPage:true,timeout:5000});}
      catch(screenshotError){console.error('[published-smoke] Screenshot unavailable:',String(screenshotError));}
    }
    throw err;
  }finally{await context.close();}
};
