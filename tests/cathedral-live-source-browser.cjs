'use strict';
// End-to-end, read-only/source-local verification. The PDF is downloaded to
// this ephemeral runner and selected as a browser-local file: never uploaded
// by Ora or copied to the repository/artifacts.
const assert=require('node:assert/strict');
const {spawn}=require('node:child_process');
const fs=require('node:fs');
const {createHash}=require('node:crypto');
const {chromium}=require('playwright');
const url='https://stjosaphat.ab.ca/wp-content/uploads/2020/05/PDF-Divine-Liturgy-Ukr-Eng.pdf';
const fingerprint='74cf0db74f1df45d74959969406b039102e5b11dff854a52942e6dea6be38c17';
const base='http://127.0.0.1:8765/';
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
(async()=>{
 let server,instance;
 try{
  const response=await fetch(url,{signal:AbortSignal.timeout(30000)});
  assert.ok(response.ok,'Cathedral PDF download failed: '+response.status);
  const buffer=Buffer.from(await response.arrayBuffer());
  assert.equal(createHash('sha256').update(buffer).digest('hex'),fingerprint);
  server=spawn('python3',['-m','http.server','8765'],{stdio:'ignore'});
  let online=false;
  for(let i=0;i<40;i++){
   try{const r=await fetch(base,{signal:AbortSignal.timeout(1000)});if(r.ok){online=true;break;}}catch(_){}
   await sleep(250);
  }
  assert.ok(online,'Local Ora HTTP server did not start');
  instance=await chromium.launch({headless:true,
   ...(process.env.ORA_CHROMIUM?{executablePath:process.env.ORA_CHROMIUM}:{}),
   args:['--no-sandbox']});
  const context=await instance.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
  const page=await context.newPage();
  await page.goto(base+'index.html?tab=liturgy&date=2026-11-11');
  await page.locator('[data-act="liturgyview"][data-v="byz"]').click();
  assert.equal(await page.locator('.liturgical-text').getAttribute('data-text-id'),'chrysostom');
  await page.locator('.reader-offline > summary').click();
  await page.locator('#liturgical-file').setInputFiles({
   name:'cathedral-source.pdf',mimeType:'application/pdf',buffer
  });
  await page.waitForFunction(()=>{
   const r=document.querySelector('.reader-inline-text');
   return r&&r.querySelectorAll('details.byz-antiphon-option').length>=9;
  },null,{timeout:90000});
  const report=await page.evaluate(()=>{
   const root=document.querySelector('.reader-inline-text');
   const choices=[...root.querySelectorAll('details.byz-antiphon-option')];
   const shared=[...root.children].filter(el=>!el.matches('details'))
     .map(el=>el.textContent||'').join(' ');
   return {
    status:'ok',
    choiceCount:choices.length,
    choicesClosed:choices.every(el=>!el.open),
    sharedSmallLitany:shared.includes('Small Litany'),
    sharedHymn:shared.includes('Only-Begotten Son'),
    sharedEntrance:/Entrance of Christ|Small Entrance/i.test(shared),
    pageOverflow:document.documentElement.scrollWidth>innerWidth
   };
  });
  assert.equal(report.choiceCount,9,'Three independent antiphon sets must yield nine choices');
  assert.equal(report.choicesClosed,true,'Do not appoint parish alternatives automatically');
  assert.equal(report.sharedSmallLitany,true,'The shared Small Litany must remain available');
  assert.equal(report.sharedHymn,true,'Only-Begotten Son must stay outside optional choices');
  assert.equal(report.sharedEntrance,true,'Entrance must follow the optional Beatitudes');
  assert.equal(report.pageOverflow,false,'The private prayer display must fit a phone');
  fs.writeFileSync('cathedral-browser-audit.json',JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report));
 }catch(e){const report={status:'error',error:String(e?.message||e)};
  fs.writeFileSync('cathedral-browser-audit.json',JSON.stringify(report,null,2)+'\n');
  console.error(JSON.stringify(report));process.exitCode=1;
 }finally{if(instance)await instance.close();if(server)server.kill('SIGTERM');}
})();
