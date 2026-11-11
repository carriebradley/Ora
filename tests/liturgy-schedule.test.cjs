const {test}=require('node:test'),assert=require('node:assert/strict');
const {service}=require('../liturgy-schedule.js'),M=require('../melkite.js');
test('The ten Basil dates follow the 2026 Newton feast and Paschal calendar',()=>{
 const expected=['2026-01-01','2026-01-05','2026-02-22','2026-03-01','2026-03-08','2026-03-15','2026-03-22','2026-04-02','2026-04-04','2026-12-24'];
 assert.deepEqual(Object.keys(M.source.days).filter(d=>service(d).id==='basil'),expected);
 for(const d of expected)assert.match(service(d).title,/Basil/);
 assert.match(M.entry('2026-04-05').observance,/PASCHA/);
});
test('Lenten and Holy Week exceptions do not default to Chrysostom',()=>{
 for(const date of ['2026-02-18','2026-02-20','2026-03-19','2026-03-30','2026-03-31','2026-04-01'])assert.equal(service(date).id,'presanctified',date);
 for(const date of ['2026-02-16','2026-02-17','2026-02-19','2026-04-03'])assert.equal(service(date).id,'none',date);
 for(const date of ['2026-03-25','2026-03-28','2026-03-29','2026-04-05','2026-11-11'])assert.equal(service(date).id,'chrysostom',date);
});
test('Unverified years and invalid dates have no silently substituted service',()=>{
 for(const d of ['2027-01-01','2026-02-30','not-a-date',null])assert.equal(service(d).id,'unknown');
 assert.equal(service(new Date('2026-04-02T00:00:00Z')).id,'basil');
});
