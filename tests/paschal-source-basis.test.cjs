'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const path=require('node:path'),L=require('../calendar.js'),S=require('../liturgy-schedule.js');
const app=fs.readFileSync(path.join(__dirname,'../app.js'),'utf8');

test('2026 Paschal source identities are church-specific and do not leak into other years',()=>{
 const ukrainian=S.paschalBasis(2026,'ukrainian'),melkite=S.paschalBasis(2026,'melkite');
 assert.equal(ukrainian.pascha,'2026-04-05');
 assert.match(ukrainian.label,/Edmonton/);
 assert.equal(ukrainian.source,'https://eeparchy.com/Easter%20Program%20.pdf');
 assert.equal(ukrainian.alternativePascha,'2026-04-12');
 assert.match(ukrainian.alternativeLabel,/St. George/);
 assert.equal(ukrainian.alternativeSource,'https://ugcc.ua/data/tserkovnyy-kalendar-ugkts-na-2026-rik-8059/');
 assert.equal(melkite.pascha,'2026-04-05');
 assert.match(melkite.label,/Newton/);
 assert.notEqual(melkite.source,ukrainian.source);
 assert.equal(melkite.alternativePascha,undefined);
 assert.equal(S.paschalBasis(2027,'ukrainian'),null);
 assert.equal(S.paschalBasis(2026,'ruthenian'),null);
 assert.equal(S.paschalBasis('2026','ukrainian'),null);
 assert.ok(Object.isFrozen(ukrainian)&&Object.isFrozen(melkite));
});

test('the chosen 2026 Gregorian Pascha remains consistent across all Byzantine calendar dates',()=>{
 for(const church of ['ukrainian','melkite']){
  const expected=S.paschalBasis(2026,church).pascha;
  const options={...L.DEFAULTS,byzPascha:'gregorian',byzSource:'edmonton',byzChurch:church};
  for(let i=0;i<365;i++){
   const d=L.add(L.D(2026,1,1),i),iso=L.iso(d);
   const day=L.byzantine(d,options);
   assert.equal(day.pascha,expected,church+' '+iso+' has a mismatched Paschal basis');
  }
 }
 assert.equal(S.service('2026-04-02','ukrainian').id,'basil');
 assert.equal(S.service('2026-04-02','ukrainian').verification,'verified');
 assert.equal(S.service('2026-04-04','ukrainian').id,'basil');
 assert.notEqual(S.service('2026-04-09','ukrainian').verification,'verified');
 assert.notEqual(S.service('2026-04-11','ukrainian').verification,'verified');
 assert.equal(S.service('2026-04-02','melkite').verification,'verified');
});

test('do not enable an incomplete alternate cycle with Edmonton-dated readings',()=>{
 // Until the new Paschal source table is integrated, both the visible
 // calendar and the fallback reading engine must use the same basis.
 assert.match(app,/S\.byzPascha\s*=\s*'gregorian'/);
 assert.match(app,/S\.byzSource\s*=\s*'edmonton'/);
 assert.match(app,/ByzLect\.read\(P\(iso\),\s*0,\s*L\.westernEaster/);
 assert.match(app,/paschalCoverageHTML\(\)/);
 assert.match(app,/not selectable yet/);
});
