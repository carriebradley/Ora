'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fixture=require('../docs/roman-liturgical-day-parity-2027-01-11.json');
const L=require('../calendar.js');
test('first full-day Roman parity fixture has all core Offices and Mass with source categories',()=>{
 assert.equal(fixture.schema,1);
 assert.equal(fixture.date,'2027-01-11');
 assert.equal(fixture.lectionaryNumber,305);
 assert.equal(fixture.psalterWeek,1);
 const kinds=new Set(fixture.sections.map(x=>x.office));
 for(const name of ['calendar','mass','invitatory','office-of-readings','lauds','daytime-midmorning','daytime-midday','daytime-midafternoon','vespers','compline'])assert.ok(kinds.has(name),'missing '+name);
 const ids=fixture.sections.map(x=>x.id);
 assert.equal(new Set(ids).size,ids.length,'no duplicate comparison rows');
 const validSources=new Set(['official-calendar','lectionary-index','publisher-first-edition-witness','pending']);
 const validComparison=new Set(['not-compared','match-calendar-appointment','match-approved','appointed-different-translation','legitimate-option','wrong-appointment','missing-content','out-of-order','source-conflict','unverified']);
 for(const section of fixture.sections){
  assert.match(section.sourceUrl,/^https:\/\//,'source witness required for '+section.id);
  assert.ok(section.expected&&section.oraModule&&section.element,'complete audit row '+section.id);
  assert.ok(validSources.has(section.sourceStatus),'invalid source kind '+section.id);
  assert.ok(validComparison.has(section.comparison),'invalid comparison status '+section.id);
  assert.equal(typeof section.oraCompared,'boolean');
  assert.equal(typeof section.textCompared,'boolean');
  if(section.comparison==='match-approved')assert.equal(section.textCompared,true,'certifying match requires wording comparison');
  if(section.comparison==='match-calendar-appointment')assert.equal(section.textCompared,false,'calendar appointment alone is not a text match');
  if(section.textCompared)assert.equal(section.oraCompared,true,'wording comparison requires Ora output');
 }
});
test('initial source selection does not claim completed liturgical parity',()=>{
 assert.ok(fixture.sections.length>=25);
 assert.deepEqual(fixture.sections.filter(section=>section.oraCompared).map(section=>section.id).sort(),
  ['calendar.day','lauds.psalmody','lauds.reading','vespers.psalmody','vespers.reading'].sort());
 assert.ok(fixture.sections.every(section=>!section.textCompared&&section.comparison!=='match-approved'),
  'No full-text First Edition certification was performed');
 assert.ok(fixture.sections.some(section=>!section.oraCompared&&section.comparison==='not-compared'),
  'Remaining audit rows must stay open');
 assert.deepEqual(fixture.massSections.map(x=>x.ref),['Hebrews 1:1-6','Psalm 97:1,2b,6,7c,9','Mark 1:15','Mark 1:14-20']);
});

test('January 11 2027 U.S. ordinary weekday matches the official calendar appointment',()=>{
 const d=new Date('2027-01-11T00:00:00Z');
 const day=L.roman(d,{epiphany:'sunday',ascension:'sunday',corpus:'sunday'});
 const row=fixture.sections.find(x=>x.id==='calendar.day');
 assert.equal(row.sourceStatus,'official-calendar');
 assert.equal(row.comparison,'match-calendar-appointment');
 assert.equal(row.oraCompared,true);
 assert.equal(row.textCompared,false,'no Mass or Hours prayer wording certified');
 assert.equal(day.date,'2027-01-11');
 assert.equal(day.title,'Monday of the 1st Week in Ordinary Time');
 assert.equal(day.rank,'Weekday');
 assert.equal(day.season,'Ordinary Time');
 assert.equal(day.color,'g');
 assert.equal(day.weekdayCycle,'I');
 assert.equal(day.sundayCycle,'B');
 assert.equal(day.fast,'');
 assert.equal(fixture.lectionaryNumber,305,'USCCB Lectionary number is reference data, not an Ora reading text verification');
 assert.equal(fixture.psalterWeek,1,'USCCB Psalter Week I is reference data');
});
