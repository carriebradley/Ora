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
        ['morning','2027-01-17',/Blessed art thou in the holy temple/],
        ['evening','2026-11-12',/Magnificat/i],
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
        await page.screenshot({path:path.join(artifacts,`published-${kind}-${colorScheme}.png`),fullPage:true});
      }
    }
    assert.deepEqual(errors,[],'published app JavaScript errors');
    fs.writeFileSync(path.join(artifacts,'published-results.json'),JSON.stringify({url:base,build:expected,widths:[320,390],colorSchemes:['light','dark'],hours:['morning','evening','night'],errors},null,2));
    console.log(`Published ${expected}: Lauds, Vespers and Compline passed at 320/390px in light/dark mode.`);
  }finally{await context.close();}
};
