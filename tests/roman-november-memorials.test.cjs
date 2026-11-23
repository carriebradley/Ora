'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const L=require('../calendar.js');

const d=iso=>new Date(iso+'T00:00:00Z');
const app=fs.readFileSync(path.join(__dirname,'../app.js'),'utf8');
const alternate=(info,name)=>info.also.find(x=>x.title.includes(name));

test('2026 Roman November 22 solemnity excludes Cecilia as an appointed saint',()=>{
 const c=L.roman(d('2026-11-22'));
 assert.match(c.title,/Christ, King of the Universe/);
 assert.equal(c.rank,'Solemnity');
 assert.equal(c.color,'w');
 assert.match(alternate(c,'Cecilia').note,/Outranked/);
});
test('2026 November 23 Roman weekday retains three genuine optional choices',()=>{
 const c=L.roman(d('2026-11-23'));
 assert.equal(c.rank,'Weekday');
 assert.equal(c.color,'g');
 for(const name of ['Clement I','Columban','Miguel Agustín Pro']){
  assert.equal(alternate(c,name)?.note,'Optional commemoration',name);
 }
});
test('November 24 mandatory martyrs and November 25 Catherine option match USCCB',()=>{
 const c24=L.roman(d('2026-11-24')),c25=L.roman(d('2026-11-25'));
 assert.match(c24.title,/Andrew Dung-Lac/);
 assert.equal(c24.rank,'Memorial');
 assert.equal(c24.color,'r');
 assert.equal(c25.rank,'Weekday');
 assert.equal(c25.color,'g');
 assert.equal(alternate(c25,'Catherine of Alexandria')?.note,'Optional commemoration');
});
test('Roman saint card checks weekday optional titles without selecting their vestment',()=>{
 assert.match(app,/const optionalTitles = S\.rite === 'roman' && calendar\?\.rank === 'Weekday'/);
 assert.match(app,/filter\(item => item\?\.note === 'Optional commemoration'\)/);
 assert.match(app,/const optionalSaint = S\.rite === 'roman' && optionalTitles\.includes\(primary\)/);
 assert.match(app,/Optional memorial/);
 assert.match(app,/Saint Andrew Dung-Lac and Companions/);
});
