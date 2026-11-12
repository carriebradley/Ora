const {test}=require('node:test');const assert=require('node:assert/strict');
const M=require('../melkite.js'),L=require('../calendar.js');
test('Newton calendar covers all 365 dates with page provenance and usable references',()=>{
 assert.equal(Object.keys(M.source.days).length,365);
 for(let d=new Date('2026-01-01');d.getUTCFullYear()===2026;d=L.add(d,1)){
  const e=M.entry(d);assert.equal(e.page,d.getUTCMonth()+3);assert.ok(e.references.length>=2);
  const r=L.byzantine(d,{byzChurch:'melkite'});assert.ok(r.title);assert.equal(r.sourcePage,e.page);
  for(const [,cite] of M.read(d).sets[0].r)assert.match(cite,/\d+:\d+/);
 }
});
test('Monthly image-checked anchors retain the Melkite calendar facts',()=>{
 const samples={
 '2026-01-01':['CIRCUMCISION','COL 2:8-12'],
 '2026-02-16':['Great Fast Begins','IS 1:1-20'],
 '2026-03-25':['ANNUNCIATION','LK 1:24-38'],
 '2026-04-05':['PASCHA','JN 1:1-17'],
 '2026-05-14':['ASCENSION','ACTS 1:1-12'],
 '2026-06-20':['shorter','ROM 6:11-17'],
 '2026-07-19':['FIRST SIX','TI 3:8-15'],
 '2026-08-15':['DORMITION','PHIL 2:5-11'],
 '2026-09-14':['EXALTATION','1 COR 1:18-24'],
 '2026-10-11':['SECOND','LK 8:5-15'],
 '2026-11-15':['Nativity Fast','LK 10:25-37'],
 '2026-12-09':['MATERNITY','GAL 4:22-27']};
 for(const [date,[name,cite]] of Object.entries(samples)){assert.ok(M.entry(date).observance.includes(name),date);assert.ok(M.entry(date).references.includes(cite),date);}
 assert.equal(M.entry('2026-11-15').tone,8);
 assert.match(M.entry('2026-12-10').observance,/shorter/);
 assert.match(M.entry('2026-04-02').references[2],/MT 26:40-75; 27:1-2$/,'composite Gospel is not truncated');
 assert.match(M.entry('2026-05-31').references[2],/19:27-30$/,'wrapped citation retained');
});
test('Melkite data never silently repeats in 2027 and the other traditions remain separate',()=>{
 assert.equal(M.entry('2027-04-05'),null);assert.equal(M.read('2027-04-05'),null);
 assert.match(L.byzantine(new Date('2027-04-05'),{byzChurch:'melkite'}).fastingNote,/unavailable/);
 assert.match(L.byzantine(new Date('2026-12-09'),{byzChurch:'melkite'}).title,/Maternity of Ann/);
 assert.match(L.byzantine(new Date('2026-12-08'),{byzChurch:'ruthenian'}).title,/Conception/);
 assert.equal(L.byzantine(new Date('2026-04-05'),{byzChurch:'melkite'}).fast,'','dagger is not a fasting rule');
});
