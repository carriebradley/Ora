'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');

const app=fs.readFileSync(path.join(__dirname,'../app.js'),'utf8');
const begin=app.indexOf('const SHARED_BYZANTINE_SAINT_BIOS = ');
const end=app.indexOf('function todaySaintBio(',begin);

function allBiographyMaps(){
 assert.ok(begin>=0&&end>begin,'Curated biography declarations must be available');
 // Parse the complete declarations, including shared records and rite-specific
 // aliases, so double-quoted and reused biographies receive the same checks.
 const declarations=app.slice(begin,end);
 return vm.runInNewContext('(()=>{\n'+declarations+'\nreturn {sharedByzantine:SHARED_BYZANTINE_SAINT_BIOS,sharedWestern:WESTERN_SHARED_SAINT_BIOS,roman:TODAY_SAINT_BIOS.roman,ukrainian:TODAY_SAINT_BIOS.ukrainian,melkite:TODAY_SAINT_BIOS.melkite,sarum:TODAY_SAINT_BIOS.sarum};\n})()');
}

test('all curated saint biographies across every rite are brief, complete and sourced',()=>{
 const maps=allBiographyMaps();
 let checked=0;
 for(const [rite,records] of Object.entries(maps)){
  for(const [md,bio] of Object.entries(records)){
   const loc=rite+' '+md;
   assert.match(md,/^\d{2}-\d{2}$/,loc+' has a valid month-day key');
   assert.equal(typeof bio.name,'string',loc+' needs a name');
   assert.ok(bio.name.trim().length>=4,loc+' needs a meaningful name');
   assert.equal(typeof bio.bio,'string',loc+' needs biography text');
   const words=bio.bio.trim().split(/\s+/);
   assert.ok(words.length>5&&words.length<=50,loc+' biography must be 6–50 words ('+words.length+')');
   assert.equal(typeof bio.meta,'string',loc+' needs a date/office descriptor');
   assert.ok(bio.meta.trim(),loc+' needs a descriptor');
   assert.equal(typeof bio.source,'string',loc+' needs a source link');
   assert.match(bio.source,/^https:\/\/[^/?#]+\//,loc+' needs a secure source URL');
   assert.equal(typeof bio.match?.test,'function',loc+' must have a feast-title matcher');
   checked++;
  }
 }
 assert.ok(checked>=90,'Expected at least 90 checked biography records across rites');
});

test('source-backed Western records are never displayed solely because of the date',()=>{
 assert.match(app,/const titles = S\.rite === 'byz'/);
 assert.match(app,/: \[title\];/);
 assert.match(app,/const entry = listed && titles\.some\(item => listed\.match\.test\(item\)\) \? listed : null/);
});
