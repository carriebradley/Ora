'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const app=fs.readFileSync(path.join(__dirname,'..','app.js'),'utf8');
const start=app.indexOf('  let feed = null;');
const end=app.indexOf('  const readingsSpeech =',start);
const execute=new Function('fetch','store','st','render','document',
 app.slice(start,end)+'\nreturn {initial: feedP, refreshReadingsFeed};');
const date='2026-11-25';
const full={sections:[{label:'Gospel',cite:'Luke 21:12-19'}]};
const fresh={...full,audio:'2418304674'};
async function setup({tab='readings',readRite='roman',previous={full},responses=[{[date]:fresh}],visible=true,existingPlayer=false}={}){
 const st={date,tab,readRite,readings:{[date]:previous}};
 let requests=0,renders=0,saved={};
 const payloads=[{[date]:full},...responses];
 const document={visibilityState:visible?'visible':'hidden',querySelector:()=>existingPlayer?{}:null};
 const {initial,refreshReadingsFeed}=execute(async()=>{
  const payload=payloads[requests++];
  if(payload instanceof Error)throw payload;
  return {ok:true,json:async()=>payload};
 },{get:()=>saved,set:(_,v)=>{saved=v;}},st,()=>{renders++;},document);
 await initial;
 return {st,document,refresh:refreshReadingsFeed,counts:()=>({requests,renders})};
}
test('late official recording replaces fallback on Roman Readings without a page reload',async()=>{
 const h=await setup();
 assert.equal(await h.refresh(),true);
 assert.equal(h.st.readings[date].full.audio,'2418304674');
 assert.deepEqual(h.counts(),{requests:2,renders:1});
 assert.equal(await h.refresh(),false);
 assert.deepEqual(h.counts(),{requests:2,renders:1});
});
test('failed or empty refresh preserves the current readings and can be retried',async()=>{
 const h=await setup({responses:[new Error('offline'),{}, {[date]:fresh}]});
 assert.equal(await h.refresh(),false);
 assert.equal(await h.refresh(),false);
 assert.deepEqual(h.st.readings[date],{full});
 assert.equal(await h.refresh(),true);
 assert.equal(h.st.readings[date].full.audio,'2418304674');
 assert.deepEqual(h.counts(),{requests:4,renders:1});
});
test('hidden tabs, existing recordings, other rites and prayer do not trigger a request',async()=>{
 for(const options of [{visible:false},{tab:'pray'},{readRite:'byz'},{readRite:'sarum'},{existingPlayer:true},{previous:{full:fresh}},{previous:'loading'}]){
  const h=await setup(options);
  assert.equal(await h.refresh(),false);
  assert.deepEqual(h.counts(),{requests:1,renders:0});
 }
});
test('overlapping requests are suppressed and switching dates cannot rebuild a different screen',async()=>{
 const h=await setup();
 const pending=h.refresh();
 assert.equal(await h.refresh(),false);
 h.st.date='2026-11-26';
 assert.equal(await pending,true);
 assert.equal(h.st.readings[date].full.audio,'2418304674');
 assert.deepEqual(h.counts(),{requests:2,renders:0});
});
test('switching to prayer while fetch is pending preserves that screen',async()=>{
 const h=await setup();
 const pending=h.refresh();
 h.st.tab='pray';
 assert.equal(await pending,true);
 assert.deepEqual(h.counts(),{requests:2,renders:0});
});
test('visible retry and five-minute refresh are installed',()=>{
 assert.match(app,/visibilitychange', \(\) => \{ if \(document.visibilityState === 'visible'\) refreshReadingsFeed\(\); \}/);
 assert.match(app,/setInterval\(refreshReadingsFeed, 5 \* 60 \* 1000\)/);
});
