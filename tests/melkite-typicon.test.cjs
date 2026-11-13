const test=require('node:test'),assert=require('node:assert/strict'),M=require('../melkite.js'),S=require('../liturgy-schedule.js');
test('November monthly typicon verifies only its twelve dated Melkite appointments',()=>{
 for(const day of ['01','08','13','14','15','16','21','22','25','26','29','30']){
  const d='2026-11-'+day;assert.equal(S.service(d,'melkite').verification,'verified');assert.equal(S.service(d,'melkite').id,'chrysostom');
 }
 assert.equal(S.service('2026-11-12','melkite').verification,'calculated');
 assert.equal(S.service('2026-11-13','ukrainian').verification,'calculated');
 assert.equal(M.typicon('2027-11-13'),null);
});
test('Orthros references and source discrepancies stay distinct from Liturgy readings',()=>{
 assert.equal(M.typicon('2026-11-15').orthrosNumber,3);
 assert.equal(M.typicon('2026-11-13').orthrosGospel,'John 10:1-9');
 assert.equal(M.read('2026-11-13').sets[0].r[0][0],'Orthros Gospel');
 assert.equal(M.read('2026-11-13').sets[0].r[2][0],'Gospel');
 assert.equal(M.calendar(new Date('2026-11-21T00:00:00Z'),{}).tone,8);
 for(const d of ['01','26','29'])assert.ok(M.read('2026-11-'+d).notes.length>1);
 assert.ok(M.read('2026-11-01').sets[0].r.some(r=>/1 Corinthians/.test(r[1])));
 assert.ok(M.read('2026-11-26').sets[0].r.some(r=>r[1]==='Luke 18:31-34'));
 assert.ok(M.read('2026-11-29').sets[0].r.some(r=>r[1]==='Luke 18:18-27'));
});
