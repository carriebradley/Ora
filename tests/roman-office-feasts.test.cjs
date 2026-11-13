const {test}=require('node:test'),assert=require('node:assert/strict');
const L=require('../calendar.js'),H=require('../hours.js');
const date=iso=>new Date(iso+'T00:00:00Z');
const us={epiphany:'sunday',ascension:'sunday',corpus:'sunday'};
const evening=(iso,options=us)=>H.modernPsalmody(L,date(iso),'V',options);
// Primary prayer-body source links and limits are in the Office audit.
const cases=[
 ['2027-02-02',false,['p109(1-5,7)','p129'],/Colossians 1:12-20/],
 ['2027-03-18',true,['p112','p145'],/Ephesians 1:3-10/],
 ['2027-03-19',false,['p14','p111'],/Revelation 15:3-4/],
 ['2027-04-05',false,['p109(1-5,7)','p129'],/Colossians 1:12-20/],
 ['2027-05-08',true,['p112','p116'],/Revelation 11:17-18/],
 ['2027-05-09',false,['p109(1-5,7)','p46'],/Revelation 12:10-12/],
 ['2027-05-15',true,['p112','p146'],/Revelation 15:3-4/],
 ['2027-05-16',false,['p109(1-5,7)','p113(1-8)'],/Revelation 19:1-7/]
];
test('Presentation, Joseph, Annunciation, Ascension and Pentecost select sourced Vespers psalmody',()=>{
 for(const [iso,first,psalms,canticle]of cases){
  const p=evening(iso);assert.equal(p.first,first,iso);
  assert.deepEqual(p.items.slice(0,2),psalms,iso);assert.match(p.items[2],canticle,iso);
 }
});
test('Transferred Annunciation and weekday Presentation cannot steal the preceding evening',()=>{
 assert.equal(evening('2027-02-01').first,false);
 assert.notDeepEqual(evening('2027-02-01').items.slice(0,2),['p109(1-5,7)','p129']);
 assert.equal(evening('2027-04-04').first,false);
 assert.deepEqual(evening('2027-04-04').items.slice(0,2),['p109(1-5,7)','p113(1-8)']);
 // The same verified Annunciation I set is available when precedence permits it.
 const first=evening('2026-03-24');assert.equal(first.first,true);
 assert.deepEqual(first.items.slice(0,2),['p112','p147']);assert.match(first.items[2],/Philippians 2:6-11/);
});
test('Ascension proper follows both Thursday and Sunday settings',()=>{
 const thursday={...us,ascension:'thursday'};
 assert.deepEqual(evening('2027-05-05',thursday).items,evening('2027-05-08',us).items);
 assert.deepEqual(evening('2027-05-06',thursday).items,evening('2027-05-09',us).items);
 assert.notDeepEqual(evening('2027-05-06',us).items.slice(0,2),['p109(1-5,7)','p46']);
});
