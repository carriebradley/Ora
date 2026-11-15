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
 assert.match(app,/Commemorated in the selected liturgical calendar/);
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
