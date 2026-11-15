const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
test('missing Office second readings offer specific external discovery without substitution',()=>{
 const app=fs.readFileSync(path.join(__dirname,'../app.js'),'utf8');
 assert.match(app,/\[author, work, 'English translation'\]/);
 assert.match(app,/encodeURIComponent\(query\)/);
 assert.match(app,/Search for this author and work/);
 assert.match(app,/Search results are external references, not verified texts appointed for this date/);
 assert.match(app,/A verified translation of this appointed excerpt has not yet been bundled/);
});

test('missing Augustine readings have direct verified historical source links without invented Office text',()=>{
 const app=require('node:fs').readFileSync(require.resolve('../app.js'),'utf8');
 const marker='const OOR_PUBLIC_DOMAIN_SOURCES = Object.freeze(';
 const start=app.indexOf(marker),end=app.indexOf('\n  let oortxP = null;',start);
 assert.ok(start>=0&&end>start,'source mapping is installed immediately before the OOR loader');
 const source=app.slice(start,end);
 const pairs=[
  ['Augustine|On Psalm 127, 2','1801127.htm'],
  ['Augustine|On Psalm 140, 4-6','1801140.htm'],
  ['Augustine|On Psalm 148, 1-2','1801148.htm'],
  ['Augustine|Confessions 9, 10-11','110109.htm'],
  ['Augustine|Confessions 7, 10.18; 10, 27','110107.htm']
 ];
 for(const [key,leaf] of pairs){
  assert.ok(source.includes("'"+key+"'"),key);
  assert.ok(source.includes('https://www.newadvent.org/fathers/'+leaf),leaf);
 }
 assert.ok(source.includes('https://www.newadvent.org/fathers/110110.htm'));
 assert.match(app,/const publicDomainSources = OOR_PUBLIC_DOMAIN_SOURCES\[slot\.dataset\.k\] \|\| \[\]/);
 assert.match(app,/Read source edition:/);
 assert.match(app,/These historical source editions may use different wording or section boundaries/);
 assert.match(app,/A verified translation of this appointed excerpt has not yet been bundled/);
 assert.match(app,/Search results are external references, not verified texts appointed for this date/);
});

test('missing Athanasius and Tertullian readings link to their actual patristic works',()=>{
 const app=require('node:fs').readFileSync(require.resolve('../app.js'),'utf8');
 const source=app.slice(app.indexOf('const OOR_PUBLIC_DOMAIN_SOURCES'),app.indexOf('let oortxP = null;'));
 for(const [entry,link] of [
  ['Athanasius of Alexandria|On the Incarnation of the Word 8-9','2802.htm'],
  ['Athanasius of Alexandria|On the Incarnation of the Word 10','2802.htm'],
  ['Athanasius of Alexandria|The Life of Saint Anthony 2-4','2811.htm'],
  ['Tertullian|On Prayer 28-29','0322.htm'],
  ['Tertullian|On the Prescription of Heretics 20, 1-9; 21, 3; 22, 8-10','0311.htm']
 ]){
  const pos=source.indexOf("'"+entry+"'");
  assert.ok(pos>=0,entry);
  assert.ok(source.slice(pos,pos+260).includes('https://www.newadvent.org/fathers/'+link),entry);
 }
 const missing=require('../docs/office-of-readings-availability.json').missingReferences;
 for(const key of ['Athanasius of Alexandria|On the Incarnation of the Word 8-9','Athanasius of Alexandria|On the Incarnation of the Word 10','Tertullian|On Prayer 28-29'])
  assert.ok(missing.includes(key),'Source links do not falsely mark readings available: '+key);
});
