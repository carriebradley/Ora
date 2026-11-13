const {test}=require('node:test');
const assert=require('node:assert/strict');
const L=require('../calendar.js');

// Regression anchors from the USCCB calendar for the 2027 liturgical year.
// Assert labels and their precedence without copying protected Office texts.
const title=(date,opts)=>L.roman(L.D(...date),opts).title;
test('2027 Roman temporal anchors and transferred Annunciation',()=>{
 assert.match(title([2026,11,29]),/(?:First|1st) Sunday of Advent/i);
 assert.match(title([2027,2,10]),/Ash Wednesday/i);
 assert.match(title([2027,3,25]),/Holy Thursday/i);
 assert.match(title([2027,3,28]),/Easter Sunday/i);
 assert.match(title([2027,4,5]),/Annunciation/i);
 assert.match(title([2027,5,16]),/Pentecost/i);
});
test('2027 Ascension follows configured US province',()=>{
 assert.match(title([2027,5,6],{ascension:'thursday'}),/Ascension/i);
 assert.doesNotMatch(title([2027,5,6],{ascension:'sunday'}),/Ascension/i);
 assert.match(title([2027,5,9],{ascension:'sunday'}),/Ascension/i);
});
