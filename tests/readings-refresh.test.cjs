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
const date='2026-11-24';
const full={sections:[{label:'Gospel',cite:'Luke 21:5-11'}]};
const fresh={...full,audio:'2418304374'};

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
 assert.equal(h.st.readings[date].full.audio,'2418304374');
 assert.deepEqual(h.counts(),{requests:2,renders:1});
 assert.equal(await h.refresh(),false);
 assert.deepEqual(h.counts(),{requests:2,renders:1},'existing player is not fetched or rebuilt');
});
test('a failed refresh preserves existing readings and can be retried',async()=>{
 const h=await setup({responses:[new Error('offline'),{}, {[date]:fresh}]});
 assert.equal(await h.refresh(),false);
 assert.equal(await h.refresh(),false);
 assert.deepEqual(h.st.readings[date],{full});
 assert.equal(await h.refresh(),true);
 assert.equal(h.st.readings[date].full.audio,'2418304374');
 assert.deepEqual(h.counts(),{requests:4,renders:1});
});
test('background and overlapping refreshes do not fetch twice or interrupt prayer',async()=>{
 const h=await setup({tab:'pray',visible:false});
 assert.equal(await h.refresh(),false);
 assert.deepEqual(h.counts(),{requests:1,renders:0});
 h.document.visibilityState='visible';
 const pending=h.refresh();
 assert.equal(await h.refresh(),false);
 assert.equal(await pending,true);
 assert.equal(h.st.readings[date].full.audio,'2418304374');
 assert.deepEqual(h.counts(),{requests:2,renders:0});
});
test('do not rebuild a visible existing iframe, or another rite',async()=>{
 for(const options of [{existingPlayer:true},{readRite:'byz'},{readRite:'sarum'}]){
  const h=await setup(options);
  assert.equal(await h.refresh(),true);
  assert.deepEqual(h.counts(),{requests:2,renders:0});
 }
});
test('a date already showing a recording never requests or replaces it',async()=>{
 const h=await setup({previous:{full:fresh}});
 assert.equal(await h.refresh(),false);
 assert.deepEqual(h.counts(),{requests:1,renders:0});
 assert.equal(h.st.readings[date].full.audio,'2418304374');
});
test('visible retry and five-minute refresh are installed',()=>{
 assert.match(app,/visibilitychange', \(\) => \{ if \(document.visibilityState === 'visible'\) refreshReadingsFeed\(\); \}/);
 assert.match(app,/setInterval\(refreshReadingsFeed, 5 \* 60 \* 1000\)/);
});
