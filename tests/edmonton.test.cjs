const {test}=require('node:test'),assert=require('node:assert/strict');
const E=require('../edmonton.js'),L=require('../calendar.js'),S=require('../liturgy-schedule.js');
const d=s=>new Date(s+'T00:00:00Z');
const day=s=>L.byzantine(d(s),{byzChurch:'ukrainian',byzSource:'edmonton'});
test('Edmonton imports bounded facts and citations, with a full fixed Menaion',()=>{
 assert.equal(Object.keys(E.source.days).length,184);
 assert.equal(Object.keys(E.source.fixed).length,366);
 for(const [date,e] of Object.entries(E.source.days)){
  assert.equal(e.source,date==='2026-12-30'
   ? 'https://www.eeparchy.com/calendar?month=12&year=2026'
   : 'https://eeparchy.com/calendar/'+date);
  assert.deepEqual(Object.keys(e).sort(),date==='2026-12-30'?['rank','readingSource','references','rubric','services','source','title','tone']:['rank','references','rubric','services','source','title','tone']);
  assert.ok(e.title.length<1000&&e.rubric.length<1500);
  for(const [label,cite] of e.references){assert.match(label,/Epistle|Gospel/);assert.match(cite,/\d/);assert.ok(cite.length<200);}
 }
 assert.match(day('2026-11-12').title,/Josaphat/);
 assert.deepEqual(E.read('2026-11-12').sets[0].r,[['Epistle','Hebrews 4:14-5:10'],['Gospel','John 10:9-16']]);
 assert.equal(day('2026-11-15').tone,8);assert.equal(day('2026-11-15').rank,'Sunday');
 assert.match(day('2026-11-15').fastSeason,/Nativity/);
 assert.match(day('2026-12-09').title,/Conception of Saint Anna/);
 assert.match(day('2026-12-08').title,/Patapius/);
 assert.equal(E.read('2026-11-08').sets[0].r.length,4,'both sets of readings retained');
 const copy=E.read('2026-11-12');copy.sets[0].r[0][1]='changed';assert.notEqual(E.read('2026-11-12').sets[0].r[0][1],'changed');
});
test('missing and conflicting dates are explicit; no Canadian obligation is imposed as U.S. fasting',()=>{
 for(const date of ['2026-01-18','2026-05-02','2026-06-06','2026-07-01','2027-11-12']){
  assert.equal(E.entry(date),null);assert.equal(day(date).sourceKind,'menaion-calculated');assert.match(day(date).fastingNote,/No verified Edmonton/);assert.equal(day(date).fast,'');
 }
 assert.match(day('2026-05-02').sourceNote,/conflict/);
 assert.match(day('2026-05-02').title,/Athanasius/);
 assert.equal(day('2026-11-21').canadianObligation,true);
 assert.match(day('2026-11-21').fastingNote,/Canadian practice/);
 assert.equal(day('2026-11-21').fast,'');
 assert.doesNotMatch(L.byzantine(d('2026-12-08'),{byzChurch:'melkite',byzSource:'edmonton'}).title,/Patapius/);
 for(let x=d('2026-01-01');x<d('2027-01-01');x=L.add(x,1)){const r=day(x.toISOString().slice(0,10));assert.ok(r.title&&r.rank&&r.sourceUrl);}
});
test('calculated service schedules state their limits and do not repeat in other years',()=>{
 for(const church of ['ukrainian','melkite'])for(const date of ['2026-02-24','2026-03-09','2026-03-19','2026-04-01']){
  assert.equal(S.service(date,church).id,'presanctified');
  if(church==='ukrainian'&&date==='2026-04-01'){
   assert.equal(S.service(date,church).verification,'verified');
   assert.match(S.service(date,church).note,/Edmonton appoints.*Presanctified.*Wednesday evening/);
   assert.match(S.service(date,church).note,/no-Divine-Liturgy note/);
  }else assert.match(S.service(date,church).note,/Calculated common Byzantine/);
 }
 assert.equal(S.service('2027-04-01','ukrainian').id,'unknown');
});

test('December 30 Edmonton month view and UGCC national calendar restore an independently verified day',()=>{
 const date='2026-12-30',record=E.entry(date),observance=day(date);
 assert.ok(record,'The former 404 date now has a verified Edmonton monthly entry');
 assert.match(record.title,/Martyr Anysia/);
 assert.match(record.title,/Zoticus/);
 assert.equal(record.source,'https://www.eeparchy.com/calendar?month=12&year=2026');
 assert.equal(record.readingSource,'https://ugcc.ua/data/tserkovnyy-kalendar-ugkts-na-2026-rik-8059/');
 assert.deepEqual(E.read(date).sets[0].r,[['Epistle','James 1:1-18'],['Gospel','Mark 10:11-16']]);
 assert.match(E.read(date).notes[0],/Patriarchal Liturgical Commission/);
 assert.equal(observance.sourceKind,'edmonton');
 assert.equal(observance.sourceUrl,record.source);
 assert.match(observance.sourceNote,/monthly calendar/);
 assert.equal(observance.fast,'');
 assert.equal(E.source.withheld[date],undefined);
 assert.deepEqual(record.services,[],'No service schedule is inferred from the monthly view');
});
