'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const L=require('../calendar.js'),S=require('../sarum.js'),D=require('../data.js'),C=require('../liturgical-colors.js');
L.setData(D);S.setData(D);
const date=s=>new Date(s+'T00:00:00Z');
test('Sunday is never an individual fast day in Roman, 1962, Byzantine, or Sarum calendars',()=>{
  for(let year=2026;year<=2029;year++){
    for(let day=L.D(year,1,1);day.getUTCFullYear()===year;day=L.add(day,1)){
      if(day.getUTCDay()!==0)continue;
      const iso=L.iso(day);
      const cases=[
        ['roman',L.roman(day)],
        ['1962',L.extraordinary(day)],
        ['traditional',S.sarum(day)],
        ...['ukrainian','melkite','ruthenian'].map(church=>[church,L.byzantine(day,{byzChurch:church})])
      ];
      for(const [rite,r] of cases){
        assert.equal(r.fast,'',iso+' '+rite+' has no Sunday fast');
        assert.equal(C.sunday(r),true,iso+' '+rite+' must carry its date');
        assert.equal(C.fasting(r,rite==='traditional'?'sarum':rite==='1962'?'ef':rite==='roman'?'roman':'byz'),false,iso+' '+rite+' must not have fasting colour');
      }
    }
  }
});
test('Sundays retain their season without claiming a fasting obligation',()=>{
  const byz=L.byzantine(date('2026-11-22'),{byzChurch:'ukrainian'});
  assert.match(byz.fastSeason,/Nativity Fast/);
  assert.equal(byz.fast,'');
  const sarum=S.sarum(date('2026-11-15'));
  assert.equal(sarum.historicalObservance.name,"St. Martin's Lent");
  assert.equal(sarum.fast,'');
  assert.match(sarum.historicalObservance.day,/Sunday/);
  for(const [rite,day] of [
    ['roman',L.roman(date('2027-02-15'))],
    ['byz',L.byzantine(date('2026-11-23'),{byzChurch:'ukrainian'})],
    ['sarum',S.sarum(date('2026-11-23'))]
  ])assert.equal(C.sunday(day),false,rite);
});
