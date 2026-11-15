const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const app=fs.readFileSync(require.resolve('../app.js'),'utf8');
const source=fs.readFileSync(require.resolve('../docs/SAINTS-BIOGRAPHY-SOURCES-v283.md'),'utf8');

test('November 16-20 source-backed Byzantine biography set and correct precedence',()=>{
 for(const day of ['16','17','18','19']){
  assert.match(app,new RegExp("'11-"+day+"': \\{"));
 }
 assert.match(app,/const SHARED_BYZANTINE_SAINT_BIOS/);
 assert.equal((app.match(/\.\.\.SHARED_BYZANTINE_SAINT_BIOS/g)||[]).length,2);
 for(const name of ['Matthew','Gregory the Wonderworker','Plato of Ancyra','Prophet Obadiah','Josaphata Hordashevska','Gregory the Decapolite']){
  assert.ok(app.includes(name),name);
  assert.ok(source.includes(name),name+' source documented');
 }
 // Regional priorities differ on November 20, so each rite must have its own biography.
 assert.match(app,/ukrainian: \{[\s\S]*?'11-20': \{\s+match: \/Josaphata Hordashevska/i);
 assert.match(app,/melkite: \{[\s\S]*?'11-20': \{\s+match: \/Gregory/);
 assert.match(app,/const entry = listed && titles\.some\(item => listed\.match\.test\(item\)\) \? listed : null/);
 assert.match(app,/calendar\?\.also/);
 assert.match(app,/Commemorated in the selected calendar/);
 assert.match(app,/saint\.source \? /);
});

test('Marian feast titles alone do not create a Saint of the Day biography',()=>{
 assert.match(app,/const marianTitle = \/.*mother of god.*theotokos.*virgin mary.*blessed virgin.*our lady/);
 assert.match(app,/const namedSaint =/);
 assert.match(app,/!marianTitle\.test\(item\) \|\| namedSaint\.test\(item\)/);
});

test('November 14 Traditional feast has a verified Laurence O’Toole biography',()=>{
 const sarum=app.slice(app.indexOf('    sarum: {',app.indexOf('const TODAY_SAINT_BIOS')));
 assert.ok(sarum.includes("'11-14': {"));
 assert.ok(sarum.includes("name: 'Saint Laurence O’Toole'"));
 assert.ok(sarum.includes("dublindiocese.ie/the-story-of-st-laurence-otoole"));
});

test('November 22-25 saint bios follow the correct Ukrainian and Melkite dates',()=>{
 const section=app.slice(app.indexOf('const TODAY_SAINT_BIOS'),app.indexOf('function todaySaintBio'));
 const uk=section.slice(section.indexOf('    ukrainian: {'),section.indexOf('    melkite: {'));
 const mk=section.slice(section.indexOf('    melkite: {'),section.indexOf('    sarum: {'));
 const shared=app.slice(app.indexOf('const SHARED_BYZANTINE_SAINT_BIOS'),app.indexOf('const BYZANTINE_BIO_CATHERINE'));
 assert.ok(shared.includes("'11-22': {"));
 assert.ok(shared.includes("name: 'Holy Apostle Philemon'"));
 for(const block of [uk,mk])assert.ok(block.includes('...SHARED_BYZANTINE_SAINT_BIOS'));
 assert.ok(uk.includes("name: 'Saint Amphilochius of Iconium'"));
 assert.ok(mk.includes("name: 'Saint Gregory of Agrigentum'"));
 assert.ok(uk.includes("'11-24': BYZANTINE_BIO_CATHERINE"));
 assert.ok(uk.includes("'11-25': BYZANTINE_BIO_CLEMENT"));
 assert.ok(mk.includes("'11-24': BYZANTINE_BIO_CLEMENT"));
 assert.ok(mk.includes("'11-25': BYZANTINE_BIO_CATHERINE"));
 assert.ok(!section.includes("'11-21':"),'Marian feast alone should not generate a biography');
});

test('Curated Saint of the Day cards remain short',()=>{
 const entries=app.slice(app.indexOf('const SHARED_BYZANTINE_SAINT_BIOS'),app.indexOf('function todaySaintBio'));
 const bios=[...entries.matchAll(/bio: '([^']+)'/g)].map(item=>item[1]);
 assert.ok(bios.length>=12);
 for(const bio of bios){
   const words=bio.trim().split(/\s+/);
   assert.ok(words.length<=50,'Biography exceeds 50 words: '+bio.slice(0,55));
 }
});

test('Traditional November 15 St. Machutus (Malo) card has a brief verified biography',()=>{
 const sarum=app.slice(app.indexOf('    sarum: {',app.indexOf('const TODAY_SAINT_BIOS')));
 const entry=sarum.slice(sarum.indexOf("'11-15':"),sarum.indexOf("'11-14':"));
 assert.ok(entry.includes('match: /Machut'));
 assert.ok(entry.includes("name: 'Saint Machutus (Malo)'"));
 assert.ok(entry.includes('vaticannews.va/en/saints/11/15/saint-malo.html'));
 const match=entry.match(/bio: '([^']+)'/);
 assert.ok(match);
 assert.ok(match[1].split(/\s+/).length<=50);
});

test('Marian safeguard uses real word boundaries and keeps separately named saints',()=>{
 const vm=require('node:vm');
 const getMatcher=name=>{
   const token='const '+name+' = ';
   assert.ok(app.includes(token),'missing '+name);
   return vm.runInNewContext(app.split(token)[1].split(';')[0].trim());
 };
 const marian=getMatcher('marianTitle'),named=getMatcher('namedSaint');
 assert.ok(marian.test('The Entrance of the Mother of God'));
 assert.ok(marian.test('Dormition of the Theotokos'));
 assert.ok(!named.test('The Entrance of the Mother of God'));
 assert.ok(named.test('Saint Anna, Mother of the Virgin Mary'));
 assert.ok(!marian.test('Abbot Motherwell'));
});

test('Nov 26-30 biographies match Ukrainian and Melkite appointment titles',()=>{
 const vm=require('node:vm'),L=require('../calendar.js'),D=require('../data.js');
 L.setData(D);
 const start=app.indexOf('const SHARED_BYZANTINE_SAINT_BIOS = ');
 const end=app.indexOf('\n  };',start);
 assert.ok(start>=0&&end>start);
 const object=app.slice(start+'const SHARED_BYZANTINE_SAINT_BIOS = '.length,end+4);
 const bios=vm.runInNewContext('('+object+')');
 const names={'11-26':'Alypius','11-27':'James','11-28':'Stephen','11-29':'Paramon','11-30':'Andrew'};
 for(const [md,name] of Object.entries(names)){
  const bio=bios[md];
  assert.ok(bio&&bio.name.includes(name),md);
  assert.ok(bio.source.startsWith('https://www.oca.org/saints/lives/2026/11/'+md.slice(3)),md);
  assert.ok(bio.bio.trim().split(/\s+/).length<=50,md);
  for(const church of ['ukrainian','melkite']){
   const day=L.byzantine(new Date('2026-'+md+'T00:00:00Z'),{byzChurch:church,byzSource:'edmonton'});
   const titles=[day.title,...(day.also||[]).map(x=>x.title)];
   assert.ok(titles.some(t=>bio.match.test(t)),church+' '+md+' '+titles.join(' | '));
  }
 }
});

test('December 1-6 primary Byzantine saints match both Catholic typika',()=>{
 const vm=require('node:vm'),L=require('../calendar.js');
 const marker='const SHARED_BYZANTINE_SAINT_BIOS = ';
 const begin=app.indexOf(marker),end=app.indexOf('\n  };',begin);
 assert.ok(begin>=0&&end>begin);
 const entries=vm.runInNewContext('('+app.slice(begin+marker.length,end+4)+')');
 const names={'12-01':'Nahum','12-02':'Habakkuk','12-03':'Zephaniah',
  '12-04':'Barbara','12-05':'Sabbas','12-06':'Nicholas'};
 for(const [md,name] of Object.entries(names)){
  const entry=entries[md];
  assert.ok(entry&&entry.name.includes(name),md);
  assert.ok(entry.source.startsWith('https://www.oca.org/saints/'),md);
  assert.ok(entry.bio.trim().split(/\s+/).length<=50,md);
  for(const church of ['ukrainian','melkite']){
   const day=L.byzantine(new Date('2026-'+md+'T00:00:00Z'),{byzChurch:church,byzSource:'edmonton'});
   const titles=[day.title,...(day.also||[]).map(item=>item.title)];
   assert.ok(titles.some(title=>entry.match.test(title)),church+' '+md+': '+titles.join(' / '));
  }
 }
});
