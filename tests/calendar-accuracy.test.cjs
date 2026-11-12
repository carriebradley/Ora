const {test}=require('node:test'),assert=require('node:assert/strict'),L=require('../calendar.js'),S=require('../liturgy-schedule.js');
const date=s=>new Date(s+'T00:00:00Z'),roman=s=>L.roman(date(s),{ascension:'sunday',corpus:'sunday',epiphany:'sunday'});
const titles=r=>[r.title,...r.also.map(x=>x.title)].join(' | ');
test('USCCB 2026 additions are optional choices, respecting their introduction year',()=>{
 const teresa=roman('2026-09-05'),newman=roman('2026-10-09');
 assert.equal(teresa.rank,'Weekday');assert.match(titles(teresa),/Teresa of Calcutta/);
 assert.equal(newman.rank,'Weekday');assert.match(titles(newman),/John Henry Newman/);assert.match(titles(newman),/John Leonardi/);assert.match(titles(newman),/Denis/);
 assert.ok(newman.also.every(x=>/Optional/.test(x.note)));
 assert.doesNotMatch(titles(roman('2024-09-05')),/Teresa of Calcutta/);
 assert.doesNotMatch(titles(roman('2025-10-09')),/John Henry Newman/);
});
test('June 13 collision leaves both memorials optional, and Sunday transfers remain configurable',()=>{
 const r=roman('2026-06-13');assert.equal(r.rank,'Weekday');assert.equal(r.color,'g');
 assert.match(titles(r),/Immaculate Heart/);assert.match(titles(r),/Anthony of Padua/);assert.ok(r.also.every(x=>/Optional/.test(x.note)));
 assert.match(roman('2026-01-04').title,/Epiphany/);assert.match(roman('2026-05-17').title,/Ascension/);assert.match(roman('2026-06-07').title,/Body and Blood/);
 assert.match(L.roman(date('2026-05-14'),{ascension:'thursday'}).title,/Ascension/);
});
test('Cheesefare aliturgical days and Edmonton source conflicts cannot silently select a book',()=>{
 for(const church of ['ukrainian','melkite']){
  for(const day of ['2026-02-11','2026-02-13'])assert.equal(S.service(day,church).id,'none');
  assert.equal(S.service('2026-04-02',church).id,'basil');assert.equal(S.service('2026-04-01',church).id,'presanctified');
  assert.equal(S.service('2026-04-02',church).verification,'calculated');
 }
 const conflict=S.service('2026-12-24','ukrainian');assert.equal(conflict.id,'unknown');assert.equal(conflict.verification,'source-conflict');assert.match(conflict.note,/Source conflict/);
 assert.equal(S.service('2026-12-24','melkite').id,'basil');assert.equal(S.service('2026-12-24','ruthenian').id,'basil');
 assert.equal(S.service('2026-11-12','sarum').id,'unknown');assert.equal(S.service(new Date('invalid'),'ukrainian').id,'unknown');
});
