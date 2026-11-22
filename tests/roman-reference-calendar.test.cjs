'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const L=require('../calendar.js');
const D=iso=>L.D(+iso.slice(0,4),+iso.slice(5,7),+iso.slice(8,10));
const us={epiphany:'sunday',ascension:'sunday',corpus:'sunday',ladyDayTransfer:true};
const thursday={...us,ascension:'thursday'};

test('USCCB 2027 transfer dates distinguish Thursday and Sunday Ascension',()=>{
 assert.match(L.roman(D('2027-05-06'),thursday).title,/Ascension/i);
 assert.doesNotMatch(L.roman(D('2027-05-06'),us).title,/Ascension/i);
 assert.match(L.roman(D('2027-05-09'),us).title,/Ascension/i);
 assert.doesNotMatch(L.roman(D('2027-05-09'),thursday).title,/Ascension/i);
});

test('USCCB 2027 transferred Annunciation remains appointed after Holy Week',()=>{
 const celebration=L.roman(D('2027-04-05'),us);
 assert.match(celebration.title,/Annunciation of the Lord/i);
 assert.equal(celebration.rank,'Solemnity');
 assert.doesNotMatch(L.roman(D('2027-03-25'),us).title,/Annunciation/i);
});

test('Roman reference edition and locality caveats remain visible to the V1 audit',()=>{
 const doc=fs.readFileSync(path.join(__dirname,'../docs/ROMAN-LITURGICAL-REFERENCE-BASELINE-2026-2027.md'),'utf8');
 for(const required of ['Roman Missal, Third Edition','1998/2001','2002','1975/1976','February 10, 2027','December 3, 2028','Boston','Newark','2027-04-05','2027-05-06','2027-05-09','2027-01-11'])
  assert.ok(doc.includes(required),'missing source-policy detail: '+required);
});
