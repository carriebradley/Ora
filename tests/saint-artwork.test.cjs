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

test('missing/failed remote art retains a visible offline illustrated portrait',()=>{
 assert.match(app,/class="saint-bio-portrait"/);
 assert.match(app,/class="saint-bio-fallback"/);
 assert.match(app,/art \? `<a class="saint-bio-image-link"/);
 assert.match(app,/onerror="this\.parentElement\.remove\(\)"/);
 assert.match(app,/class="saint-bio-art-credit"/);
 assert.match(html,/\.saint-bio-fallback\{display:block;width:100%;height:100%\}/);
 assert.match(html,/\.saint-bio-portrait\{position:relative;float:left;/);
 assert.match(html,/@media \(max-width:370px\).*saint-bio-portrait/);
});
