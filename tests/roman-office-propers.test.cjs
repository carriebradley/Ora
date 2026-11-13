const {test}=require('node:test');
const assert=require('node:assert/strict');
const L=require('../calendar.js'),H=require('../hours.js'),R=require('../roman-office-texts.js');
const options={epiphany:'sunday',ascension:'sunday',corpus:'sunday'};
function select(s,which='L',opts=options){const p=H.modernPsalmody(L,new Date(s+'T00:00:00Z'),which,opts);return R.select(L,p.d,which,opts,p);}

test('seasonal prayers replace the weekly fallbacks across Advent, Lent and Easter',()=>{
  for(const [s,id]of [['2026-12-01','adv-w01-tue-mp'],['2026-12-22','1222-adv-w04-tue-mp'],
    ['2027-02-10','lent-w00-wed-mp'],['2027-03-03','lent-w03-wed-mp'],['2027-04-01','easter-w01-thu-mp'],
    ['2027-04-08','easter-w02-thu-mp'],['2027-04-27','easter-w05-tue-mp']]){
    const r=select(s);assert.equal(r.id,id);assert.equal(r.antiphons.length,3);
    for(const part of ['responsory','gospelAntiphon','intercessions','collect'])assert.ok(r[part],`${id}/${part}`);
  }
});
test('proper evening prayers follow Christmas, transferred Annunciation and both Ascension settings',()=>{
  for(const [s,id,opts]of [['2026-12-24','1225-ep1',options],['2027-04-05','0325-ep2-annunciation',options],
    ['2027-05-08','ascension-thursday-ep1',options],['2027-05-05','ascension-thursday-ep1',{...options,ascension:'thursday'}]]){
    const r=select(s,'V',opts);assert.equal(r.id,id);assert.equal(r.antiphons.length,3);assert.ok(r.collect);assert.ok(r.gospelAntiphon);
  }
});
test('memorials use the current weekday psalms while preserving proper and Common prayers',()=>{
  const r=select('2026-11-12');assert.equal(r.id,'1112-mp');
  assert.deepEqual(r.antiphons,R.psalter(4,4,'L').antiphons);
  assert.match(r.collect,/Josaphat/);assert.match(r.intercessions,/martyrs/);
  assert.equal(select('2027-01-21').antiphons.length,3);
});
test('First Edition Sunday antiphons retain the sourced text at each hour across lectionary cycles',()=>{
  // USCCB March 2015, p. 9: the present English edition has one antiphon
  // at each hour. Three A/B/C alternatives belong to the revised edition.
  for(const s of ['2026-11-15','2026-11-22','2026-11-29','2027-02-14','2027-06-27']){
    for(const [day,which]of [[s,'L'],[s,'V'],[L.iso(L.add(new Date(s+'T00:00:00Z'),-1)),'V']]){
      const r=select(day,which);assert.ok(r.collect,day);assert.ok(r.gospelAntiphon,day);
      assert.equal(r.gospelAntiphon,R.record(r.id).gospelAntiphon,`${day}/${which}`);
    }
  }
  const expected={
    L:'They will see the Son of Man coming in the clouds with great glory and majesty.',
    I:'Well done, my good and faithful servant, you have been trustworthy in small things. Now share your master’s joy.',
    V:'By your trusting acceptance of trials, you will gain your life, says the Lord.'
  };
  // The 33rd Sunday in three successive years spans C, A and B.
  const cycles=new Set();
  for(const s of ['2026-11-15','2027-11-14','2028-11-19']){
    const d=new Date(s+'T00:00:00Z');cycles.add(L.roman(d,options).sundayCycle);
    assert.equal(select(s).gospelAntiphon,expected.L);
    assert.equal(select(s,'V').gospelAntiphon,expected.V);
    assert.equal(select(L.iso(L.add(d,-1)),'V').gospelAntiphon,expected.I);
  }
  assert.equal(cycles.size,3);
  assert.match(select('2026-12-25').gospelAntiphon,/Glory to God/);
  assert.ok(select('2027-05-16').gospelAntiphon);
});
test('a mismatched proper psalm set cannot label different psalms with its antiphons',()=>{
  const date=new Date('2026-12-25T00:00:00Z'),p=H.modernPsalmody(L,date,'L',options);
  const r=R.select(L,date,'L',options,{...p,items:['p1','p2','p3']});
  assert.equal(r.antiphons,undefined);assert.equal(r.psalmPrayers,undefined);assert.ok(r.collect);
});
test('checked feast Vespers and the Triduum receive their proper psalms and antiphons',()=>{
  for(const [s,first,second]of [['2026-11-21','p112','p116'],['2026-11-22','p109(1-5,7)','p144'],
    ['2026-11-30','p115','p125'],['2027-03-26','p115','p142(1-11)'],['2027-03-27','p115','p142(1-11)'],
    ['2027-05-22','p112','p147'],['2027-05-29','p110','p147'],['2027-05-30','p109(1-5,7)','p115'],
    ['2027-06-03','p112','p145'],['2027-06-04','p109(1-5,7)','p110'],['2027-06-24','p14','p111']]){
    const d=new Date(s+'T00:00:00Z'),p=H.modernPsalmody(L,d,'V',options);
    assert.deepEqual(p.items.slice(0,2),[first,second],s);
    assert.equal(R.select(L,p.d,'V',options,p).antiphons.length,3,s);
  }
  for(const s of ['2027-03-26','2027-03-27'])assert.match(select(s,'V').responsory,/Christ was obedient/);
});


test('recovered source IDs resolve to the appointed feast and hour',()=>{
  const cases=[
    ['2026-12-07','L','1207-mp',/instruct the people/],
    ['2026-12-17','V','1217-adv-w03-thu-ep2',/O Wisdom/],
    ['2026-12-23','V','1223-w04-wed-ep',/O Emmanuel/],
    ['2027-03-19','L','lent-0319-mp',/Nazareth/],
    ['2027-05-03','L','0503-philip-and-james-mp',/Philip found Nathanael/],
    ['2027-05-09','L','morning-prayer-ascension-thursday',/ascending to my Father/],
    ['2027-05-14','L','easter-0514-mp',/take his place/],
    ['2027-05-14','V','easter-0514-ep2',/chosen you/],
    ['2027-06-23','V','0624-ep1-nativity-of-john-baptist',/Zechariah entered the temple/],
    ['2027-06-28','V','0629-ep1-peter-and-paul',/How glorious are the apostles/],
    ['2027-06-29','L','0629-mp-peter-and-paul',/Simon Peter said/],
    ['2027-06-29','V','0629-ep2-peter-and-paul',/Paul the teacher/]
  ];
  for(const [s,which,id,gospel]of cases){
    const r=select(s,which);assert.equal(r.id,id,`${s}/${which}`);
    assert.match(r.gospelAntiphon,gospel);assert.ok(r.collect);assert.equal(r.antiphons.length,3);
    const html=H.modern(L,new Date(s+'T00:00:00Z'),which,options);
    assert.match(html,gospel);assert.doesNotMatch(html,/Scriptural refrain:|Intercessions \(devotional\)/);
  }
  assert.equal(select('2027-05-06','L',{...options,ascension:'thursday'}).id,'morning-prayer-ascension-thursday');
});

test('Christmas octave and after-Epiphany weekday propers use their own calendar context',()=>{
  for(const [s,which,id]of [
    ['2026-12-29','L','1229-mp'],['2026-12-29','V','1229-ep2'],
    ['2026-12-30','L','xmas-sixth-day-in-the-octave-mp'],
    ['2026-12-30','V','xmas-sixth-day-in-the-octave-ep'],['2026-12-31','L','1231-mp'],
    ['2027-01-06','L','xmas-after-epiphany-wed-mp'],['2027-01-06','V','xmas-after-epiphany-wed-ep2'],
    ['2027-01-07','L','xmas-after-epiphany-thu-mp'],['2027-01-07','V','xmas-after-epiphany-thu-ep'],
    ['2027-01-08','V','xmas-after-epiphany-fri-ep2'],['2027-01-09','L','xmas-after-epiphany-sat-mp']
  ]){
    const r=select(s,which);assert.equal(r.id,id,`${s}/${which}`);
    assert.equal(r.antiphons.length,3);assert.ok(r.gospelAntiphon);assert.ok(r.responsory);assert.ok(r.intercessions);assert.ok(r.collect);
  }
  assert.equal(select('2026-12-31','V').id,'0101-ep1');
  assert.equal(select('2027-01-09','V').id,'xmas-baptism-of-the-lord-ep1');
  assert.equal(select('2027-01-06','L',{...options,epiphany:'jan6'}).id,'xmas-epiphany-mp');
  // With Epiphany on January 7, January 6 is still before Epiphany.
  const d=new Date('2024-01-06T00:00:00Z');
  assert.doesNotMatch(R.properId(L,d,'L',options),/after-epiphany/);
});

test('new memorial witnesses keep weekday psalms and newly checked apostle Vespers keep proper psalms',()=>{
  for(const s of ['2026-12-07','2027-06-03']){
    const p=H.modernPsalmody(L,new Date(s+'T00:00:00Z'),'L',options),r=R.select(L,p.d,'L',options,p);
    assert.deepEqual(r.antiphons,R.psalter(p.pw,p.dow,'L').antiphons);
    assert.ok(r.collect);assert.ok(r.gospelAntiphon);
  }
  for(const [s,items]of [
    ['2027-05-14',['p115','p125']],['2027-06-23',['p112','p145']],
    ['2027-06-28',['p116','p147']],['2027-06-29',['p115','p125']]
  ]){
    const p=H.modernPsalmody(L,new Date(s+'T00:00:00Z'),'V',options);
    assert.deepEqual(p.items.slice(0,2),items,s);
    const r=select(s,'V');assert.deepEqual(r.antiphons,R.record(r.id).antiphons,s);
  }
});
