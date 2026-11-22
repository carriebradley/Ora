'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'..','app.js'),'utf8');
const start=source.indexOf('  const hasReadingCitations =');
const end=source.indexOf('  const readingsSpeech =',start);
assert.ok(start>=0&&end>start,'Mass citation loader is present');
const loader=new Function('feedP','fetch','store','st','render','READINGS_API',
 source.slice(start,end)+'\nreturn {loadReadings,hasReadingCitations};');
const htmlStart=source.indexOf('  function romanReadingsHTML(');
const htmlEnd=source.indexOf('  /* OCA lists',htmlStart);
assert.ok(htmlStart>=0&&htmlEnd>htmlStart,'Roman readings renderer is present');
const citationValidator=new Function(source.slice(start,source.indexOf('  function loadReadings(',start))+
 '\nreturn hasReadingCitations;')();
const htmlFactory=new Function('st','esc','displayTitle','usccb','usccbAudio','speakBtn','fathersBlock','readingsSpeech','hasReadingCitations',
 source.slice(htmlStart,htmlEnd)+'\nreturn romanReadingsHTML;');
const iso='2027-01-11';

async function exercise(payload,{cached=null,feed={},reject=false}={}){
 const st={date:iso,readings:{}},writes=[];
 let requests=0,resolveDone;
 const done=new Promise(resolve=>{resolveDone=resolve;});
 const fetch=async url=>{requests++;
  assert.equal(url,'https://cpbjr.github.io/catholic-readings-api/readings/2027/01-11.json');
  if(reject)throw Error('network offline');
  return {ok:true,json:async()=>payload};
 };
 const store={get:(key)=>key==='ora.readings.'+iso?cached:null,
  set:(key,value)=>writes.push({key,value})};
 const {loadReadings}=loader(Promise.resolve(feed),fetch,store,st,()=>resolveDone(),
  'https://cpbjr.github.io/catholic-readings-api/readings');
 loadReadings(iso);
 assert.equal(st.readings[iso],'loading');
 await Promise.race([done,new Promise((_,reject)=>setTimeout(()=>reject(Error('No render after readings attempt')),2500))]);
 return {reading:st.readings[iso],writes,requests};
}
const render=reading=>{
 const st={readings:{[iso]:reading}};
 return htmlFactory(st,s=>String(s),s=>s,
  date=>'https://bible.usccb.org/bible/readings/'+date.slice(5,7)+date.slice(8,10)+date.slice(2,4)+'.cfm',
  ()=>'/audio',()=>'',()=>'',()=>' ',citationValidator)(iso);
};

test('invalid or missing third-party Mass citations never produce an empty truthy reading',async()=>{
 for(const payload of [{},{readings:{}},{readings:{firstReading:'  ',psalm:null,gospel:42}},
  {readings:[]},null]){
  const {reading,writes,requests}=await exercise(payload);
  assert.equal(reading,null,'invalid payload must be unavailable: '+JSON.stringify(payload));
  assert.deepEqual(writes,[]);
  assert.equal(requests,1);
  const html=render(reading);
  assert.match(html,/Readings aren.t available offline or for this date yet/);
  assert.match(html,/https:\/\/bible.usccb.org\/bible\/readings\/011127.cfm/);
 }
});

test('a legitimate partial citations result is available and cached without inventing text',async()=>{
 const {reading,writes,requests}=await exercise({readings:{gospel:' Mark 1:14-20 '}});
 assert.equal(requests,1);
 assert.deepEqual(reading,{first:'',psalm:'',second:'',gospel:'Mark 1:14-20'});
 assert.deepEqual(writes,[{key:'ora.readings.'+iso,value:reading}]);
 const html=render(reading);
 assert.match(html,/Gospel/);assert.match(html,/Mark 1:14-20/);
 assert.doesNotMatch(html,/Readings aren.t available/);
});

test('existing valid cached references are preferred to a network request',async()=>{
 const cached={first:'Hebrews 1:1-6',gospel:'Mark 1:14-20'};
 const {reading,writes,requests}=await exercise(null,{cached});
 assert.equal(reading,cached);
 assert.equal(requests,0);
 assert.deepEqual(writes,[]);
});

test('legacy empty cached records cannot conceal an unavailable or failed provider',async()=>{
 for(const cached of [{first:undefined,psalm:undefined},{first:'   '},[],{}]){
  const {reading,writes,requests}=await exercise(null,{cached,reject:true});
  assert.equal(reading,null);
  assert.equal(requests,1);
  assert.deepEqual(writes,[]);
 }
});

test('valid locally published USCCB feed still takes precedence over citation-only API',async()=>{
 const full={link:'https://bible.usccb.org/bible/readings/011127.cfm',
  sections:[{label:'Reading 1',cite:'Hebrews 1:1-6',text:'Authorized local fixture only'}]};
 const {reading,requests,writes}=await exercise(null,{feed:{[iso]:full}});
 assert.equal(reading.full,full);assert.equal(requests,0);assert.deepEqual(writes,[]);
});

test('invalid preloaded citation object renders a meaningful unavailable notice',()=>{
 const html=render({first:undefined,psalm:'',gospel:42});
 assert.match(html,/Readings aren.t available offline or for this date yet/);
 assert.doesNotMatch(html,/class="cite"/);
});
