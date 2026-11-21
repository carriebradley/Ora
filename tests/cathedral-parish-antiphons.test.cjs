'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const F=require('../liturgical-format.js');
const D=require('../liturgy-document.js');
function fixture(){
 const specs=[
  [4,39,[[18,'FIRST ANTIPHON'],[21,'Sunday Antiphon: Psalm 65']]],
  [5,36,[[1,'Weekday Antiphon: Psalm 65'],[16,'Typica: Psalm 102'],[30,'Small Litany']]],
  [6,35,[[15,'SECOND ANTIPHON'],[18,'Sunday Antiphon: Psalm 66']]],
  [7,38,[[1,'Weekday Antiphon: Psalm 92'],[17,'Typica: Psalm 102'],[28,'Only-Begotten Son']]],
  [8,33,[[1,'Small Litany'],[24,'THIRD ANTIPHON'],[27,'Sunday Antiphon: Psalm 94']]],
  [9,39,[[11,'Weekday Antiphon: Psalm 94'],[27,'The Beatitudes']]],
  [10,51,[[10,'The Small Entrance']]]
 ];
 const pages={};
 for(const [page,count,markers] of specs){
  pages[page]=Array.from({length:count},(_,i)=>({text:'ALL: Source fixture '+page+'/'+(i+1)+'.',page}));
  for(const [row,text] of markers)pages[page][row-1].text=text;
 }
 return pages;
}
test('all source-matched antiphons are alternatives; small litanies, hymn and entrance remain shared',()=>{
 const source=fixture(),before=JSON.stringify(source),result=F.cathedralAntiphonRows(source);
 assert.ok(result);
 assert.equal(JSON.stringify(source),before,'source rows were mutated');
 const counts={};
 for(const page of Object.values(result))for(const row of page){
  if(row.alternative)counts[row.alternative]=(counts[row.alternative]||0)+1;
 }
 assert.deepEqual(counts,{sunday:54,weekday:47,typica:25,beatitudes:22});
 for(const [page,index] of [[5,30],[7,28],[8,1],[10,10]]){
  assert.equal(result[page][index-1].alternative,undefined,'shared prayer was hidden');
 }
 assert.equal(result[9][0].alternative,'sunday','third Sunday response continues across page break');
 assert.equal(result[10][8].alternative,'beatitudes','Beatitudes continue across page break');
 assert.equal(result[10][9].alternative,undefined,'entrance follows the optional Beatitudes');
});
test('changed, partial or unrelated cathedral PDF rows are never silently classified',()=>{
 const full=fixture();
 for(const changed of [
  {...full,5:full[5].slice(0,-1)},
  {...full,9:full[9].map((r,i)=>i===26?{...r,text:'Other heading'}:r)},
  {...full,7:full[7].map((r,i)=>i===27?{...r,text:'Missing shared hymn'}:r)},
  {...full,10:full[10].map((r,i)=>i===9?{...r,text:'Missing entrance'}:r)}
 ])assert.equal(F.cathedralAntiphonRows(changed),null);
 assert.equal(F.cathedralAntiphonRows({}),null);
});
test('cathedral edition identity survives the source trim and daily hymn compositor',()=>{
 const source=[{heading:'Liturgy of the Word',lines:[
  'DEACON: Master, give the blessing.','PRIEST: Blessed be the Kingdom.',
  'Little Entrance','Trisagion','Epistle','Gospel','Holy Communion'
 ]}];
 source.cathedral2020=true;
 const trimmed=F.startAtOpeningBlessing(source);
 assert.equal(trimmed.cathedral2020,true);
 const composed=D.compose(trimmed,null,{church:'ukrainian',iso:'2026-11-21',id:'chrysostom'});
 assert.equal(composed.sections.cathedral2020,true);
});
