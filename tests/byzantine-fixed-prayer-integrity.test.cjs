'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const D=require('../liturgy-document.js');
const sources=[
  ['ukrainian',require('../ukrainian-propers.json'),'chrysostom'],
  ['melkite',require('../melkite-propers-2026.json'),'melkite-chrysostom']
];

// Synthetic fixed service: the composer may insert only appointed propers.
// It may not discard, repeat, change, or reorder a printed prayer/response.
const book=[{heading:'Liturgy of the Word',lines:[
  'PRIEST: Blessed is the Kingdom.',
  'Great Litany',
  'DEACON: In peace let us pray to the Lord.',
  'ALL: Lord, have mercy.',
  'ALL: Lord, have mercy.',
  'Little Entrance',
  'Trisagion',
  'Epistle',
  'Gospel',
  'Liturgy of the Eucharist',
  'Anaphora',
  'PRIEST: Remember, O Lord, those who bring offerings.',
  'One is Holy',
  'Holy Communion',
  'ALL: Amen.',
  'Dismissal'
]}];
const originalLines=book.flatMap(section=>section.lines);
const originalSnapshot=JSON.stringify(book);

test('all recorded Ukrainian and Melkite dates preserve fixed liturgy prayers verbatim',()=>{
 let checked=0;
 for(const [church,dataset,id] of sources){
  assert.ok(Object.keys(dataset.days).length>0,church+' source is unexpectedly empty');
  for(const [iso,record] of Object.entries(dataset.days)){
   const result=D.compose(book,record,{church,iso,id});
   assert.equal(JSON.stringify(book),originalSnapshot,church+' '+iso+' mutated the source book');
   assert.ok(Array.isArray(result.sections),church+' '+iso+' yielded no sections');
   const fixed=result.sections.filter(section=>!section.dailyProper)
     .flatMap(section=>section.lines||[]);
   assert.deepEqual(fixed,originalLines,
     church+' '+iso+' dropped, duplicated, reordered, or rewrote a fixed prayer');
   assert.equal(fixed.filter(line=>line==='ALL: Lord, have mercy.').length,2,
     church+' '+iso+' changed printed response repetitions');
   checked++;
  }
 }
 assert.ok(checked>=130,'Expected both independently dated hymn collections');
});
