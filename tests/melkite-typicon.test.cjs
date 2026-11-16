const test=require('node:test'),assert=require('node:assert/strict'),M=require('../melkite.js'),S=require('../liturgy-schedule.js');
test('November monthly typicon verifies only its twelve dated Melkite appointments',()=>{
 for(const day of ['01','08','13','14','15','16','21','22','25','26','29','30']){
  const d='2026-11-'+day;assert.equal(S.service(d,'melkite').verification,'verified');assert.equal(S.service(d,'melkite').id,'chrysostom');
 }
 for(const day of ['2026-01-04','2026-06-07','2026-12-06']){
  assert.equal(S.service(day,'melkite').verification,'verified');
  assert.match(S.service(day,'melkite').note,/monthly typicon/);
 }
 const hierarchs=S.service('2026-01-30','melkite');
 assert.equal(hierarchs.verification,'calculated','feast verification does not certify a service appointment');
 assert.equal(hierarchs.id,'chrysostom','do not substitute a different ordinary Liturgy');
 assert.match(hierarchs.sourceDiscrepancy,/Thursday/);
 assert.match(hierarchs.sourceDiscrepancy,/Friday/);
 assert.match(hierarchs.sourceDiscrepancy,/Three Holy Hierarchs/);
 assert.match(hierarchs.sourceDiscrepancy,/hymns remain withheld/);
 assert.equal(hierarchs.detailSource,'https://melkite.org/wp-content/uploads/2025/12/January-2026.docx');
 assert.equal(hierarchs.detailSourceLabel,'January typicon');
 assert.equal(S.service('2026-01-29','melkite').sourceDiscrepancy,undefined);
 assert.equal(S.service('2026-01-30','ukrainian').sourceDiscrepancy,undefined);
 const paramony=S.service('2026-12-24','melkite');
 assert.equal(paramony.verification,'source-conflict','December Chrysostom heading conflicts with Newton Nativity order');
 assert.equal(paramony.id,'basil');
 assert.match(paramony.title,/Vesperal.*Basil/);
 assert.match(paramony.note,/no morning Liturgy/);
 assert.match(paramony.note,/conflicting Chrysostom heading/);
 assert.equal(paramony.detailSource,'https://melkite.org/wp-content/uploads/2016/09/The-Feast-of-the-Nativity-of-Our-Lord-God-and-Savior-Jesus-Christ.pdf');
 assert.equal(S.service('2026-12-24','ukrainian').id,'unknown');
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
