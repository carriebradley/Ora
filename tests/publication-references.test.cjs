'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {spawnSync}=require('node:child_process');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const py=path.join(root,'publication_readings.py');
const importer=path.join(root,'fetch_readings.py');
function temp(fn){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ora-readings-rights-'));
 try{return fn(dir)}finally{fs.rmSync(dir,{recursive:true,force:true})}
}
function python(args,env={}){
 const done=spawnSync('python3',args,{encoding:'utf8',env:{...process.env,...env},cwd:root});
 assert.equal(done.status,0,done.stderr||done.stdout);return done;
}
test('citation-only archive removes every Scripture body and unknown copyrighted field',()=>{
 temp(dir=>{
  const input=path.join(dir,'feed.json'),output=path.join(dir,'refs.json');
  const corpus={'2026-11-21':{title:'An Ordinary Feast',
    link:'https://untrusted.example/evil',audio:12345,audio_suffix:'fixture-day',
    sections:[{label:'Reading 1',cite:'Romans 12:1-2',text:'PROTECTED FIXTURE BODY',notes:'MORE PROTECTED FIXTURE'}],
    dangerousHtml:'<b>PROTECTED FIXTURE</b>'},
    _copyright:'Fixture publisher acknowledgement',
    _justice:{items:[{author:'Fixture Public Domain',paras:['Authorized independent work']}]}};
  fs.writeFileSync(input,JSON.stringify(corpus));
  python([py,'--input',input,'--output',output]);
  const data=JSON.parse(fs.readFileSync(output,'utf8'));
  assert.equal(data._publication_mode,'references-only');
  assert.deepEqual(data['2026-11-21'].sections,[{label:'Reading 1',cite:'Romans 12:1-2'}]);
  assert.equal(data['2026-11-21'].link,'https://bible.usccb.org/bible/readings/112126.cfm');
  assert.equal(data['2026-11-21'].audio,'12345');
  assert.equal(data['2026-11-21'].audio_suffix,'fixture-day');
  assert.deepEqual(data._justice,corpus._justice);
  assert.equal(data._copyright,corpus._copyright);
  assert.doesNotMatch(JSON.stringify(data),/PROTECTED FIXTURE/);
  assert.equal(JSON.parse(fs.readFileSync(input,'utf8'))['2026-11-21'].sections[0].text,
    'PROTECTED FIXTURE BODY','the original archive must not be mutated');
  const invalid=spawnSync('python3',[py,'--input',input,'--output',input],{encoding:'utf8'});
  assert.notEqual(invalid.status,0,'prevent accidental overwriting during preparation');
 });
});
test('scheduled feed refresh can explicitly keep only citations across old and new days',()=>{
 temp(dir=>{
  const input=path.join(dir,'feed.json'),xml=path.join(dir,'feed.xml');
  fs.writeFileSync(input,JSON.stringify({'2026-11-20':{
   sections:[{label:'Gospel',cite:'John 1:1-2',text:'OLD PROTECTED PASSAGE'}]},
   '2026-11-21':{sections:[],audio:'12345',audio_suffix:'fixture-day'}}));
  fs.writeFileSync(xml,'<rss><channel><copyright>Fixture</copyright><item>'+
   '<title>Fixture feast</title><link>https://bible.usccb.org/bible/readings/112126.cfm</link>'+
   '<description>&lt;h4&gt;Reading 1 &lt;a&gt;Romans 12:1-2&lt;/a&gt;&lt;/h4&gt;'+
   '&lt;p&gt;NEW PROTECTED PASSAGE&lt;/p&gt;</description></item></channel></rss>');
  python([importer,'--file',xml,'--out',input,'--no-audio','--no-justice'],
    {ORA_READINGS_PUBLICATION_MODE:'references-only'});
  const updated=JSON.parse(fs.readFileSync(input,'utf8'));
  assert.equal(updated._publication_mode,'references-only');
  assert.deepEqual(updated['2026-11-20'].sections,[{label:'Gospel',cite:'John 1:1-2'}]);
  assert.equal(updated['2026-11-21'].sections[0].cite,'Romans 12:1-2');
  assert.equal(updated['2026-11-21'].audio,'12345');
  assert.equal(updated['2026-11-21'].audio_suffix,'fixture-day');
  assert.doesNotMatch(JSON.stringify(updated),/PROTECTED PASSAGE/);
 });
});
test('Roman readings renderer safely shows citations and official links without fake empty passages',()=>{
 const app=fs.readFileSync(path.join(root,'app.js'),'utf8');
 const start=app.indexOf('const readingsSpeech = r =>');
 const end=app.indexOf('/* OCA lists',start);
 const audioHelpers=app.slice(app.indexOf('  const MONTHS ='),app.indexOf('  let feed = null;'));
 assert.ok(start>=0&&end>start,'Roman renderer must be present');
 const st={readings:{'2026-11-21':{full:{
   title:'Fixture feast',sections:[{label:'Reading 1',cite:'Romans 12:1-2'},
     {label:'Gospel',cite:'John 1:1-2'}]}}}};
 const esc=s=>String(s??'').replace(/</g,'&lt;').replace(/>/g,'&gt;');
 const usccb=()=> 'https://bible.usccb.org/bible/readings/112126.cfm';
 const render=new Function('st','esc','displayTitle','speakBtn','usccb','fathersBlock',
   audioHelpers+app.slice(start,end)+'\nreturn {romanReadingsHTML,readingsSpeech};')(
    st,esc,s=>s,s=>'<button>'+esc(s)+'</button>',usccb,()=>'<p>Related patristic citation</p>');
 const compact=render.romanReadingsHTML('2026-11-21',false,true);
 const regular=render.romanReadingsHTML('2026-11-21',false,false);
 assert.match(compact,/Romans 12:1-2/);
 assert.match(compact,/official USCCB page/);
 assert.doesNotMatch(compact,/class="tx"/,'no empty excerpt container');
 assert.match(regular,/John 1:1-2/);
 assert.match(regular,/official USCCB page/);
 assert.match(render.readingsSpeech(st.readings['2026-11-21']),/Romans 12:1-2/);
 st.readings['2026-11-21'].full.sections[0].text='Printed verified example.';
 assert.match(render.romanReadingsHTML('2026-11-21',false,false),/Printed verified example/,
   'existing full-text display still works');
});

test('scheduled publishing mode sanitizes the archive even after an RSS fetch failure',()=>{
 const workflow=fs.readFileSync(path.join(root,'.github/workflows/readings.yml'),'utf8');
 assert.match(workflow,/vars\.ORA_READINGS_PUBLICATION_MODE/);
 assert.match(workflow,/continue-on-error:\s*true/);
 assert.match(workflow,/if:\s*env\.ORA_READINGS_PUBLICATION_MODE == 'references-only'/);
 assert.match(workflow,/python3 publication_readings\.py --input readings\.json --output/);
 assert.match(workflow,/mv \/tmp\/ora-public-references\.json readings\.json/);
});
