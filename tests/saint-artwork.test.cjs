'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const app=fs.readFileSync(path.join(__dirname,'../app.js'),'utf8');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');

const artStart=app.indexOf('const SAINT_ART_BY_NAME = Object.freeze(');
const artEnd=app.indexOf('\n  function todaySaintBio(',artStart);
function artworks(){
 assert.ok(artStart>=0&&artEnd>artStart,'curated saint art map exists');
 const source=app.slice(artStart,artEnd);
 return vm.runInNewContext(source+'\n SAINT_ART_BY_NAME');
}

test('matched saint paintings and icons have image identity, attribution and source',()=>{
 const map=artworks();
 for(const name of ['Saint Clement of Rome','Saint Catherine of Alexandria','Holy Great-Martyr Catherine of Alexandria','Saint Andrew Dung-Lac and Companions','Saint Martin of Tours']){
  const art=map[name];
  assert.ok(art,'missing expected saint art for '+name);
  assert.match(art.image,/^https:\/\/commons\.wikimedia\.org\/wiki\/Special:FilePath\//);
  assert.match(art.source,/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
  assert.ok(art.alt.includes(name.includes('Companions')?'Saint Andrew Dung-Lac':name.includes('Great-Martyr')?'Saint Catherine of Alexandria':name.replace('Saint Martin of Tours','Saint Martin of Tours').replace('Saint Clement of Rome','Saint Clement I')),'art identifies actual saint: '+name);
  assert.ok(art.credit.length>=10,'license attribution required');
 }
 assert.match(map['Saint Andrew Dung-Lac and Companions'].credit,/Nheyob.*CC BY-SA 3\.0/);
 assert.match(map['Saint Catherine of Alexandria'].credit,/public domain/i);
});

test('unsourced saint receives no image, fake icon, or reserved image space',()=>{
 const render=app.slice(app.indexOf('function todaySaintBio('),app.indexOf('function viewToday()'));
 assert.match(render,/art \? `<div class="saint-bio-portrait"/);
 assert.doesNotMatch(render,/saint-bio-fallback/);
 assert.doesNotMatch(render,/<svg/);
 assert.match(render,/\: ''\}/);
 assert.match(html,/\.saint-bio-portrait\{float:left;width:88px;/);
 assert.doesNotMatch(html,/\.saint-bio-fallback/);
});
test('unavailable remote image removes portrait and its source credit, leaving only the biography',()=>{
 const render=app.slice(app.indexOf('function todaySaintBio('),app.indexOf('function viewToday()'));
 assert.match(render,/onerror="this\.closest\('\.saint-bio-body'\)\.querySelector\('\.saint-bio-art-credit'\)\?\.remove\(\);this\.closest\('\.saint-bio-portrait'\)\.remove\(\)"/);
 assert.match(render,/class="saint-bio-copy"/);
 assert.match(render,/class="saint-bio-art-credit"/);
});
