'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const L=require('../calendar.js'),R=require('../ukrainian-calendar-profiles.js'),S=require('../liturgy-schedule.js');
const ID='ugcc-national-new-style-2026',OLD='st-george-julian-2026';
test('UGCC national new-style calendar is separate from St George old-style parish',()=>{
 const n=R.profile(ID),o=R.profile(OLD);
 assert.equal(n.pascha,'2026-04-12');
 assert.equal(o.pascha,n.pascha);
 assert.equal(n.fixedFeasts,'gregorian');
 assert.equal(o.fixedFeasts,'julian');
 assert.equal(n.status,'staged');
 assert.equal(o.status,'reference-only');
 assert.match(o.source,/eeparchy\.com\/parishes\/st-george/);
 assert.equal(R.day(OLD,'2026-04-12'),null,'old-style parish has no invented national calendar');
 assert.equal(R.profile('nonexistent'),null);
 for(const iso of ['2025-04-20','2027-04-04','2026-02-30','not-a-date',null])
  assert.equal(R.day(ID,iso),null,'year and date validation '+iso);
 assert.ok(Object.isFrozen(n)&&Object.isFrozen(o));
});
test('full-year national calendar uses April 12 Pascha and civil-date fixed feasts',()=>{
 for(let i=0;i<365;i++){
  const iso=L.iso(L.add(L.D(2026,1,1),i));
  const d=R.day(ID,iso);
  assert.equal(d.date,iso);
  assert.equal(d.pascha,'2026-04-12',iso);
  assert.equal(d.source,R.profile(ID).source);
  assert.equal(d.observance.sourceKind,'national-cycle-calculated');
  assert.equal(d.fixedFeasts,'gregorian');
  assert.equal(d.calculatedReadings.verification,'calculated-not-appointed');
  assert.equal(d.appointedHymns,null);
 }
 const sample=[
  ['2026-02-23',/beginning of the Great Fast|1st Week of Great Lent/i],
  ['2026-04-04',/Lazarus Saturday/i],
  ['2026-04-05',/Palm Sunday/i],
  ['2026-04-09',/Great and Holy Thursday/i],
  ['2026-04-11',/Great and Holy Saturday/i],
  ['2026-04-12',/Pascha.*Resurrection/i],
  ['2026-04-19',/Thomas Sunday/i],
  ['2026-05-31',/Pentecost/i],
  ['2026-12-25',/Nativity/i]
 ];
 for(const [iso,re]of sample)assert.match(R.day(ID,iso).observance.title,re,iso);
 assert.doesNotMatch(R.day(ID,'2026-04-05').observance.title,/Pascha.*Resurrection/);
 assert.notEqual(R.day(ID,'2026-01-07').observance.title,'Nativity of Our Lord');
 const western={...L.DEFAULTS,byzChurch:'ukrainian',byzSource:'edmonton',byzPascha:'gregorian'};
 assert.equal(L.byzantine(L.D(2026,4,5),western).pascha,'2026-04-05');
 assert.equal(R.day(ID,'2026-04-05').pascha,'2026-04-12');
});
test('national verified appointments match dates in Patriarchal Liturgical Commission 2026',()=>{
 const expected={
  '2026-04-05':'chrysostom',
  '2026-04-06':'presanctified',
  '2026-04-07':'presanctified',
  '2026-04-08':'presanctified',
  '2026-04-09':'basil',
  '2026-04-11':'basil'
 };
 for(const [iso,id]of Object.entries(expected)){
  const d=R.day(ID,iso);
  assert.equal(d.service.id,id,iso);
  assert.equal(d.service.verification,'verified');
  assert.equal(d.service.source,R.profile(ID).source);
 }
 assert.match(R.day(ID,'2026-04-09').service.title,/Vesperal/);
 assert.match(R.day(ID,'2026-04-11').service.title,/Vesperal/);
 assert.equal(R.day(ID,'2026-04-10').service.id,'unknown','Royal Hours do not establish a Eucharistic Liturgy');
 assert.equal(R.day(ID,'2026-04-12').service.id,'unknown','Pascha Epistle/Gospel alone do not certify the specific service book');
 assert.equal(R.day(ID,'2026-04-02').service.verification,'unassigned');
 assert.equal(S.service('2026-04-02','ukrainian').verification,'verified','preserve separate Edmonton April 5');
 assert.equal(S.service('2026-04-09','ukrainian').verification,'calculated','do not leak national appointment into Edmonton');
});
test('explicit national readings are separate from fallback computed citations and date-specific hymns',()=>{
 for(const [iso,ep,gospel]of [
  ['2026-04-05','Philippians 4:4-9','John 12:1-18'],
  ['2026-04-11','Romans 6:3-11','Matthew 28:1-20'],
  ['2026-04-12','Acts 1:1-8','John 1:1-17']
 ]){
  const d=R.day(ID,iso);
  assert.deepEqual(d.officialLiturgyReadings.references,[['Epistle',ep],['Gospel',gospel]]);
  assert.equal(d.officialLiturgyReadings.verification,'selected-epistle-gospel-source-checked');
  assert.ok(d.calculatedReadings.sets.length>0);
  assert.equal(d.appointedHymns,null);
 }
 assert.equal(R.day(ID,'2026-04-09').officialLiturgyReadings.verification,'partial-source-check');
 assert.equal(R.day(ID,'2026-04-07').officialLiturgyReadings,null);
 assert.equal(R.day(ID,'2026-04-05').calculatedReadings.verification,'calculated-not-appointed');
});
