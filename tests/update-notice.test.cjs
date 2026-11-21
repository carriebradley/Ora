const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

test('overlapping published-update checks show only one notice',async()=>{
  const app=fs.readFileSync(process.env.ORA_APP_TEST_INPUT || path.join(__dirname,'..','app.js'),'utf8');
  const start=app.indexOf("const APP_BUILD =");
  const end=app.indexOf("  document.addEventListener('visibilitychange'",start);
  assert.ok(start>=0 && end>start,'update checker must exist');
  const appended=[], pending=[];
  const button={addEventListener(){}};
  const document={
    visibilityState:'visible',
    body:{appendChild(node){appended.push(node);}},
    createElement(){return {style:{},setAttribute(){},querySelector(){return button;}};}
  };
  const fetch=()=>new Promise(resolve=>pending.push(resolve));
  const build=(app.slice(start,end).match(/const APP_BUILD = '(ora-v\d+)'/)||[])[1];
  assert.ok(build);
  const check=new Function('document','fetch',app.slice(start,end)+'\nreturn checkForPublishedUpdate;')(document,fetch);
  const first=check(),second=check();
  assert.equal(pending.length,2,'checks must both be in flight');
  const response=()=>({ok:true,text:async()=>"const V = 'ora-v"+(Number(build.slice(5))+1)+"'"}); 
  pending[0](response());
  await first;
  pending[1](response());
  await second;
  assert.equal(appended.length,1,'a late response must not add a duplicate notice');
  await check();
  assert.equal(pending.length,2,'a visible notice prevents unnecessary checks');
});


test('a backgrounded page does not display a late update notice and checks again when visible',async()=>{
  const app=fs.readFileSync(process.env.ORA_APP_TEST_INPUT || path.join(__dirname,'..','app.js'),'utf8');
  const start=app.indexOf("const APP_BUILD =");
  const end=app.indexOf("  document.addEventListener('visibilitychange'",start);
  assert.ok(start>=0 && end>start);
  const notices=[],pending=[];
  const document={
    visibilityState:'visible',
    body:{appendChild(node){notices.push(node);}},
    createElement(){return {style:{},setAttribute(){},querySelector(){return {addEventListener(){}};}};}
  };
  const fetch=()=>new Promise(resolve=>pending.push(resolve));
  const build=app.slice(start,end).match(/const APP_BUILD = '(ora-v\\d+)'/)[1];
  const check=new Function('document','fetch',app.slice(start,end)+'\\nreturn checkForPublishedUpdate;')(document,fetch);
  const newer=()=>({ok:true,text:async()=>`const V = 'ora-v${Number(build.slice(5))+1}'`});
  const first=check();
  assert.equal(pending.length,1);
  document.visibilityState='hidden';
  pending.shift()(newer());
  await first;
  assert.equal(notices.length,0,'a delayed response cannot show a notice in the background');
  document.visibilityState='visible';
  const second=check();
  assert.equal(pending.length,1,'a visible page retries instead of suppressing the notice permanently');
  pending.shift()(newer());
  await second;
  assert.equal(notices.length,1);
});
