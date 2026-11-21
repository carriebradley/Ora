'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const F=require('../liturgical-format.js');

test('only independently source-verified PDF editions permit dated hymn placement',()=>{
 const unknown=[{heading:'Divine Liturgy of St. John Chrysostom',
   lines:['PRIEST: Blessed is the Kingdom.','Great Litany','ALL: Lord, have mercy.']}];
 const original=JSON.stringify(unknown);
 for(const id of ['chrysostom','melkite-chrysostom','basil','presanctified','melkite-basil']){
  assert.equal(F.verifiedPrayerEdition(unknown,id),false,id+' unknown source must not be verified by plausible headings');
 }
 const known=[
  ['chrysostom','edmonton2012'],
  ['chrysostom','cathedral2020'],
  ['melkite-chrysostom','newton2009']
 ];
 for(const [id,flag] of known){
  const source=unknown.map(x=>({...x}));
  source[flag]=true;
  assert.equal(F.verifiedPrayerEdition(source,id),true,id+' known source: '+flag);
  for(const other of ['chrysostom','melkite-chrysostom','basil']){
   if(other!==id)assert.equal(F.verifiedPrayerEdition(source,other),false,'edition cannot authenticate a different rite');
  }
 }
 assert.equal(F.verifiedPrayerEdition(null,'chrysostom'),false);
 assert.equal(F.verifiedPrayerEdition({...unknown,cathedral2020:'true'},'chrysostom'),false,
  'source identity flag must be a strict boolean');
 assert.equal(JSON.stringify(unknown),original,'source book is not modified');
});
