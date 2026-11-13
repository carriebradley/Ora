const {test}=require('node:test'),assert=require('node:assert/strict');
const L=require('../calendar.js'),H=require('../hours.js');
const date=iso=>new Date(iso+'T00:00:00Z');
const us={epiphany:'sunday',ascension:'sunday',corpus:'sunday'};
const evening=(iso,options=us)=>H.modernPsalmody(L,date(iso),'V',options);
// Reference facts checked against the linked First Edition prayer bodies.
// No publisher antiphons or prayer translations are included in fixtures.
const cases=[
 ['2026-12-24',true,['p112','p147'],/Philippians 2:6-11/],
 ['2026-12-25',false,['p109(1-5,7)','p129'],/Colossians 1:12-20/],
 ['2026-12-26',true,['p112','p147'],/Ephesians 1:3-10/],
 ['2026-12-27',false,['p121','p126'],/Ephesians 1:3-10/],
 ['2026-12-28',false,['p109(1-5,7)','p129'],/Colossians 1:12-20/],
 ['2026-12-29',false,['p109(1-5,7)','p129'],/Colossians 1:12-20/],
 ['2026-12-30',false,['p109(1-5,7)','p129'],/Colossians 1:12-20/],
 ['2026-12-31',true,['p112','p147'],/Ephesians 1:3-10/],
 ['2027-01-01',false,['p121','p126'],/Ephesians 1:3-10/],
 ['2027-01-02',true,['p134(1-12)','p134(13-21)'],/1 Timothy 3:16/],
 ['2027-01-03',false,['p109(1-5,7)','p111'],/Revelation 15:3-4/],
 ['2027-01-09',true,['p134(1-12)','p134(13-21)'],/1 Timothy 3:16/],
 ['2027-01-10',false,['p109(1-5,7)','p111'],/Revelation 15:3-4/],
 ['2026-12-08',false,['p121','p126'],/Ephesians 1:3-10/]
];
test('Christmas, its octave and January feasts use their sourced evening psalmody',()=>{
 for(const [iso,first,psalms,canticle]of cases){
  const plan=evening(iso);assert.equal(plan.first,first,iso);
  assert.deepEqual(plan.items.slice(0,2),psalms,iso);assert.match(plan.items[2],canticle,iso);
 }
});
test('Epiphany proper moves with the selected jurisdiction instead of staying on a fixed civil date',()=>{
 const jan6={...us,epiphany:'jan6'};
 assert.equal(evening('2027-01-05',jan6).first,true);
 assert.match(evening('2027-01-05',jan6).items[2],/1 Timothy 3:16/);
 assert.match(evening('2027-01-06',jan6).items[2],/Revelation 15:3-4/);
 assert.doesNotMatch(evening('2027-01-05',us).items[2],/1 Timothy 3:16/);
 assert.equal(evening('2027-01-02',jan6).first,true,'First Vespers of the Second Sunday after Christmas remains a Sunday');
 assert.doesNotMatch(evening('2027-01-02',jan6).items[2],/1 Timothy 3:16/);
});
test('modern Psalm headings match the appointed reference numbering and leave historical text intact',()=>{
 const first=H.modern(L,date('2026-12-24'),'V',us);
 assert.match(first,/Psalm 113</);assert.match(first,/Psalm 147</);
 const second=H.modern(L,date('2026-12-25'),'V',us);
 assert.match(second,/Psalm 110</);assert.match(second,/Psalm 130</);
 const ordinary=H.modern(L,date('2027-01-17'),'V',us);
 assert.match(ordinary,/Psalm 115</,'the second half of Vulgate 113 is modern Psalm 115');
 const traditional=H.hour(L,date('2026-11-12'),'V');
 assert.match(traditional,/Douay psalm numbers/);
});

test('verified Vespers short readings use complete bundled public-domain passages',()=>{
 const R=require('../roman-office.js');
 const appointed=[
  ['2026-11-12','1 Peter 4:13-14',/resteth upon you\.$/],
  ['2026-12-24','Galatians 4:4-5',/adoption of sons\.$/],
  ['2026-12-25','1 John 1:1-3',/his Son Jesus Christ\.$/],
  ['2026-12-26','2 Corinthians 8:9',/you might be rich\.$/],
  ['2026-12-27','Philippians 2:6-7',/found as a man\.$/],
  ['2026-12-31','Galatians 4:4-5',/adoption of sons\.$/],
  ['2027-01-01','Galatians 4:4-5',/adoption of sons\.$/],
  ['2027-01-02','2 Timothy 1:9-10',/by the gospel:$/],
  ['2027-01-03','Titus 3:4-5',/renovation of the Holy Ghost;$/],
  ['2027-01-09','Acts 10:37-38',/God was with him\.$/],
  ['2027-01-10','Acts 10:37-38',/God was with him\.$/],
  ['2026-12-08','Romans 5:20-21',/Jesus Christ our Lord\.$/]
 ];
 for(const [iso,ref,ending]of appointed){
  const plan=evening(iso),reading=R.properReading(L,plan.d,'V',us,plan.first);
  assert.equal(reading.ref,ref,iso);assert.match(reading.text,ending,iso);
  assert.equal(reading.rights,'public-domain');assert.equal(reading.translation,'Douay-Rheims');
  const html=H.modern(L,date(iso),'V',us);
  assert.ok(html.includes('Short reading · '+ref),iso);
  assert.ok(html.includes(reading.text.replace(/&/g,'&amp;')),iso);
  assert.doesNotMatch(html,/Short reading \(traditional chapter\)/,iso);
 }
 // Shared octave psalmody does not imply a shared daily short reading.
 const ordinary=evening('2026-12-29');
 assert.equal(R.properReading(L,ordinary.d,'V',us,ordinary.first),null);
 assert.equal(R.properReading(L,date('2026-12-25'),'L',us),null);
 assert.match(H.modern(L,date('2026-11-15'),'V',us),/Short reading \(traditional chapter\)/);
});
