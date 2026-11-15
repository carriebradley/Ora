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

test('additional Augustine psalm links are verified and ambiguous Psalm 33 section 29 stays unlinked',()=>{
 const app=require('node:fs').readFileSync(require.resolve('../app.js'),'utf8');
 const map=app.slice(app.indexOf('const OOR_PUBLIC_DOMAIN_SOURCES'),app.indexOf('let oortxP = null;'));
 for(const [key,leaf]of [
  ['Augustine|On Psalm 33, 7-8','1801033.htm'],
  ['Augustine|On Psalm 48, 7','1801048.htm'],
  ['Augustine|On Psalm 60, 2-3','1801060.htm'],
  ['Augustine|On Psalm 61, 4','1801061.htm'],
  ['Augustine|On Psalm 85, 1','1801085.htm'],
  ['Augustine|On Psalm 96, 14-15','1801096.htm']
 ]){
  const i=map.indexOf("'"+key+"'");
  assert.ok(i>=0,key);
  assert.ok(map.slice(i,i+210).includes('https://www.newadvent.org/fathers/'+leaf),key);
 }
 assert.ok(!map.includes("'Augustine|On Psalm 33, 29'"),
  'Do not imply section 29 is present in New Advent Psalm 33 edition');
 const inventory=require('../docs/office-of-readings-availability.json');
 assert.equal(inventory.available,105,'external links are not internally available translations');
});

test('Six Basil and Athanasius source links do not count as bundled Office readings',()=>{
 const app=require('node:fs').readFileSync(require.resolve('../app.js'),'utf8');
 const source=app.slice(app.indexOf('const OOR_PUBLIC_DOMAIN_SOURCES'),app.indexOf('let oortxP = null;'));
 const missing=new Set(require('../docs/office-of-readings-availability.json').missingReferences);
 for(const [key,url] of [
  ['Athanasius of Alexandria|Against the Pagans 40-42','2801.htm'],
  ['Athanasius of Alexandria|Against the Pagans 42-43','2801.htm'],
  ['Athanasius of Alexandria|Letter to Epictetus 5-9','2806059.htm'],
  ['Basil the Great|On the Holy Spirit 9, 22-23','3203.htm'],
  ['Basil the Great|On the Holy Spirit 15, 35-36','3203.htm'],
  ['Basil the Great|On the Holy Spirit 26, 61-64','3203.htm']
 ]){
  const p=source.indexOf("'"+key+"'");
  assert.ok(p>=0,key);
  assert.ok(source.slice(p,p+260).includes('https://www.newadvent.org/fathers/'+url),key);
  assert.ok(missing.has(key),'The historical edition is not a bundled appointed Office reading: '+key);
 }
 assert.match(app,/These historical source editions may use different wording or section boundaries/);
});

test('eleven Cyprian and Ambrose historical editions link without pretending the Office text is bundled',()=>{
 const fs=require('node:fs');
 const app=fs.readFileSync(require.resolve('../app.js'),'utf8');
 const map=app.slice(app.indexOf('const OOR_PUBLIC_DOMAIN_SOURCES'),app.indexOf('let oortxP = null;'));
 const missing=new Set(require('../docs/office-of-readings-availability.json').missingReferences);
 const cases=[
  ['Ambrose of Milan|On Virgins 1, 2.5.7-9','34071.htm'],
  ['Ambrose of Milan|On the Death of his Brother Satyrus 2','34032.htm'],
  ['Cyprian|On Mortality 18.24.26','050707.htm'],
  ...['1-3','4-6','8-9','11-12','13-15','18.22','23-24','28-30'].map(section=>
   ["Cyprian|On the Lord's Prayer "+section,'050704.htm'])
 ];
 assert.equal(cases.length,11);
 for(const [key,leaf] of cases){
  const pos=map.indexOf(JSON.stringify(key));
  assert.ok(pos>=0,'Missing direct source: '+key);
  assert.ok(map.slice(pos,pos+270).includes('https://www.newadvent.org/fathers/'+leaf),key);
  assert.ok(missing.has(key),'Link is not a bundled appointed excerpt: '+key);
 }
 assert.match(app,/These historical source editions may use different wording or section boundaries/);
 assert.equal(require('../docs/office-of-readings-availability.json').available,105);
});

test('Augustine Gospel of John tractate sources link directly to their historical edition',()=>{
 const fs=require('node:fs');
 const app=fs.readFileSync(require.resolve('../app.js'),'utf8');
 const map=app.slice(app.indexOf('const OOR_PUBLIC_DOMAIN_SOURCES'),app.indexOf('let oortxP = null;'));
 const inventory=require('../docs/office-of-readings-availability.json');
 const missing=new Set(inventory.missingReferences);
 const cases=[
  ['On the Gospel of John 123, 5','1701123.htm'],
  ['On the Gospel of John 124, 5','1701124.htm'],
  ['On the Gospel of John 124, 5.7','1701124.htm'],
  ['On the Gospel of John 15, 10-12.16-17','1701015.htm'],
  ['On the Gospel of John 17, 7-9','1701017.htm'],
  ['On the Gospel of John 26, 4-6','1701026.htm'],
  ['On the Gospel of John 34, 8-9','1701034.htm'],
  ['On the Gospel of John 35, 8-9','1701035.htm'],
  ['On the Gospel of John 65, 1-3','1701065.htm'],
  ['On the First Letter of John 1, 1.3','170201.htm'],
  ['On the first letter of John','1702.htm']
 ];
 assert.equal(cases.length,11);
 for(const [work,path] of cases){
  const key='Augustine|'+work,position=map.indexOf(JSON.stringify(key));
  assert.ok(position>=0,'A direct historical source is required for '+key);
  assert.ok(map.slice(position,position+240).includes('https://www.newadvent.org/fathers/'+path),key);
  assert.ok(missing.has(key),'A source link is not a bundled appointed reading: '+key);
 }
 assert.equal(inventory.available,105);
 assert.equal(inventory.bundled,105);
 assert.equal(inventory.indexed,562);
 assert.match(app,/These historical source editions may use different wording or section boundaries/);
});

test('seven additional Augustine treatise and Confessions editions remain external references',()=>{
 const app=require('node:fs').readFileSync(require.resolve('../app.js'),'utf8');
 const map=app.slice(app.indexOf('const OOR_PUBLIC_DOMAIN_SOURCES'),app.indexOf('let oortxP = null;'));
 const inventory=require('../docs/office-of-readings-availability.json');
 const missing=new Set(inventory.missingReferences);
 const pairs=[
  ['Against Faustus 20, 21','140620.htm'],
  ['The City of God 10, 6','120110.htm'],
  ['The Confessions 1, 1–2, 2.5, 5','110101.htm'],
  ['The Confessions 10, 1, 1–2, 2; 5, 7','110110.htm'],
  ['The Confessions 10, 26.37–29, 40','110110.htm'],
  ['The Confessions 10, 43, 68-70','110110.htm'],
  ['On the predestination of the saints','1512.htm']
 ];
 for(const [reference,leaf] of pairs){
  const key='Augustine|'+reference,position=map.indexOf(JSON.stringify(key));
  assert.ok(position>=0,key+' must offer a source link');
  assert.ok(map.slice(position,position+250).includes('https://www.newadvent.org/fathers/'+leaf),key);
  assert.ok(missing.has(key),'A historical source link must not be marked as an available Office excerpt: '+key);
 }
 assert.equal(inventory.available,105);
 assert.equal(inventory.indexed,562);
 assert.equal(inventory.bundled,105);
 assert.match(app,/A verified translation of this appointed excerpt has not yet been bundled/);
});
