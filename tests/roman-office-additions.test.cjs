const {test}=require('node:test'),assert=require('node:assert/strict');
const L=require('../calendar.js'),H=require('../hours.js'),R=require('../roman-office-texts.js'),RO=require('../roman-office.js'),SR=require('../roman-short-readings.js');
L.setData(require('../data.js'));
const options={epiphany:'sunday',ascension:'sunday',corpus:'sunday'},date=s=>new Date(s+'T00:00:00Z');
const cases=[['2026-12-07','V'],['2027-01-04','V'],['2027-01-08','L'],['2027-01-25','L'],['2027-01-25','V'],['2027-02-22','L'],['2027-02-22','V'],['2027-03-21','L'],['2027-04-03','V'],['2027-05-03','V'],['2027-05-07','L'],['2027-05-07','V'],['2027-05-31','L'],['2027-05-31','V']];
test('all fourteen identified Roman office gaps now resolve sourced prayer sections',()=>{
 for(const [ds,which]of cases){
  const d=date(ds),p=H.modernPsalmody(L,d,which,options),r=R.select(L,p.d,which,options,p);
  for(const key of ['responsory','gospelAntiphon','intercessions','collect'])assert.ok(r?.[key],ds+'/'+which+'/'+key);
  assert.equal(r.antiphons.length,3);assert.ok(RO.properReading(L,p.d,which,options,p.first)||SR.records[r.readingRef]);
  assert.doesNotMatch(H.modern(L,d,which,options),/Intercessions \(devotional\)|Short reading \(traditional chapter\)|Scriptural refrain:/);
 }
});
test('the audit period has no missing core prayer or appointed-reading sections',()=>{
 let count=0;
 for(let d=L.D(2026,11,12);d<=L.D(2027,6,30);d=L.add(d,1))for(const which of ['L','V']){
  const p=H.modernPsalmody(L,d,which,options),r=R.select(L,p.d,which,options,p);count++;
  for(const key of ['antiphons','responsory','gospelAntiphon','intercessions','collect'])assert.ok(r?.[key],L.iso(d)+'/'+which+'/'+key);
  assert.ok(RO.properReading(L,p.d,which,options,p.first)||SR.records[r.readingRef],L.iso(d)+'/'+which+'/reading');
 }
 assert.equal(count,462);
});
test('Mother of the Church takes the confirmed USCCB supplement, not obsolete common Gospel antiphons',()=>{
 const d=date('2027-05-17');
 for(const [which,pattern]of [['L',/disciples devoted themselves with one accord/],['V',/Woman, behold your son/]]){
  const p=H.modernPsalmody(L,d,which,options),r=R.select(L,p.d,which,options,p);
  assert.match(r.gospelAntiphon,pattern);assert.match(r.properSource,/usccb.org/);assert.match(r.supplementCopyright,/2020/);
 }
 const heartDate=date('2024-06-08'),p=H.modernPsalmody(L,heartDate,'L',options),r=R.select(L,p.d,'L',options,p);
 assert.match(r.collect,/Heart of the Blessed Virgin Mary/);
});
test('the octave closing Saturday uses Second Sunday First Vespers and Saturday Compline',()=>{
 for(const year of [2026,2027,2028]){
  const d=L.add(L.westernEaster(year),6),p=H.modernPsalmody(L,d,'V',options);
  assert.equal(p.first,true);assert.equal(R.properId(L,p.d,'V',options,p.first),'easter-w02-sun-ep1');
  assert.equal(H.romanNightPlan(L,d,options).index,6);
 }
});
test('pre-Ascension Friday source is selected only for Sunday transfer',()=>{
 for(const w of ['L','V']){
  const d=date('2027-05-07'),p=H.modernPsalmody(L,d,w,options);
  assert.match(R.properId(L,p.d,w,options,p.first),/-before-ascension$/);
  const thursday={...options,ascension:'thursday'};
  assert.doesNotMatch(R.properId(L,p.d,w,thursday,p.first),/-before-ascension$/);
 }
});
test('additional Bible numbering and common selection preserve their actual sources',()=>{
 assert.equal(SR.records['Joel 2:27-3:1a'].ref,'Joel 2:27-28');assert.equal(SR.records['Joel 2:27-3:1a'].wholeVerses,true);
 assert.match(H.modern(L,date('2027-02-01'),'L',options),/LXX2012 · public-domain Septuagint/);
 const d=date('2027-01-04'),p=H.modernPsalmody(L,d,'V',options),r=R.select(L,p.d,'V',options,p);
 assert.match(r.selectionNote,/Common of Holy Women/);assert.deepEqual(r.antiphons,R.psalter(p.pw,p.dow,'V',p.first).antiphons);
 assert.match(R.record('0503-ep2').referenceNote,/verses 11–13/);
 assert.match(R.record('0222-mp').gospelAntiphon,/strengthen the faith of your brothers/);
 assert.match(R.record('easter-w01-fri-ep').responsory,/This is the day that the Lord has made/);
});


test('imported optional saints keep the official US optional rank and weekday office',()=>{
 for(const [ds,name]of [['2027-04-21',/Anselm/],['2027-05-21',/Magallanes/],['2027-06-09',/Ephrem/]]){
  const day=L.roman(date(ds),options);assert.equal(day.temporal,true);assert.ok(day.also.some(s=>name.test(s.title)));
  for(const which of ['L','V']){const p=H.modernPsalmody(L,date(ds),which,options),r=R.select(L,p.d,which,options,p);assert.ok(r.collect);assert.ok(r.gospelAntiphon);}
 }
 const d=date('2027-04-07'),p=H.modernPsalmody(L,d,'L',options),r=R.select(L,p.d,'L',options,p);
 assert.match(r.collect,/John Baptist de la Salle/);assert.match(r.weekdaySource,/easter-w02-wed-mp/);
 assert.deepEqual(r.antiphons,R.record('easter-w02-wed-mp').antiphons);
});
