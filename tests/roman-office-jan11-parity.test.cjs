'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const R=require('../roman-office-texts.js'),S=require('../roman-short-readings.js'),H=require('../hours.js'),L=require('../calendar.js');
const d=new Date('2027-01-11T00:00:00Z');
const options={epiphany:'sunday',ascension:'sunday',corpus:'sunday'};

test('January 11 Lauds uses Monday Week I psalmody and the appointed 2 Thessalonians excerpt',()=>{
 const plan=H.modernPsalmody(L,d,'L',options),sel=R.select(L,d,'L',options,plan);
 assert.deepEqual(plan.items,['p5(2-10,12-13)','c211','p28']);
 assert.deepEqual(sel.psalmodyRefs,['Psalm 5','Canticle: 1 Chronicles 29:10-13','Psalm 29']);
 assert.equal(sel.readingRef,'2 Thessalonians 3:10b-13');
 const reading=S.records[sel.readingRef];
 assert.equal(reading.ref,sel.readingRef);
 assert.equal(reading.boundedOfficeExcerpt,true);assert.equal(reading.wholeVerses,false);
 assert.match(reading.text,/^If any man will not work, neither let him eat\./);
 assert.doesNotMatch(reading.text,/For also when we were with you/);
 const html=H.modern(L,d,'L',options);
 assert.match(html,/Morning Prayer \(Lauds\) · Psalter Week I/);
 assert.match(html,/Short reading · 2 Thessalonians 3:10b-13/);
 assert.match(html,/If any man will not work/);
 assert.match(html,/Douay–Rheims \(alternative translation\) · appointed excerpt/);
 assert.doesNotMatch(html,/For also when we were with you/);
 for(const ant of sel.antiphons)assert.ok(html.includes(ant),'missing official antiphon');
});
test('January 11 Vespers uses Monday Week I psalmody and the appointed Colossians excerpt',()=>{
 const plan=H.modernPsalmody(L,d,'V',options),sel=R.select(L,d,'V',options,plan);
 assert.deepEqual(sel.psalmodyRefs,['Psalm 11','Psalm 15','Canticle — Ephesians 1:3-10']);
 assert.equal(sel.readingRef,'Colossians 1:9b-11');
 const reading=S.records[sel.readingRef];
 assert.equal(reading.ref,sel.readingRef);
 assert.equal(reading.boundedOfficeExcerpt,true);assert.equal(reading.wholeVerses,false);
 assert.match(reading.text,/^That you may be filled with the knowledge of his will/);
 assert.doesNotMatch(reading.text,/Therefore we also, from the day that we heard it/);
 const html=H.modern(L,d,'V',options);
 assert.match(html,/Evening Prayer \(Vespers\) · Psalter Week I/);
 assert.match(html,/Short reading · Colossians 1:9b-11/);
 assert.match(html,/That you may be filled with the knowledge of his will/);
 assert.match(html,/Douay–Rheims \(alternative translation\) · appointed excerpt/);
 assert.doesNotMatch(html,/Therefore we also, from the day that we heard it/);
 for(const ant of sel.antiphons)assert.ok(html.includes(ant),'missing official antiphon');
});
test('properly bounded excerpts remain labeled as public-domain translations, not official U.S. wording',()=>{
 for(const ref of ['2 Thessalonians 3:10b-13','Colossians 1:9b-11']){
  assert.equal(S.records[ref].translation,'Douay-Rheims-Challoner');
  assert.equal(S.records[ref].rights,'public-domain');
  assert.equal(S.records[ref].officeRef,ref);
 }
});
test('January 11 Monday Gospel canticles and appointed weekday antiphons display in correct order',()=>{
 const R=require('../roman-office-texts.js');
 for(const [which,section,canticleName,expectedRef,antiphonStart] of [
  ['L','lauds.benedictus','Benedictus','Luke 1:68-79','Blessed be the Lord our God.'],
  ['V','vespers.magnificat','Magnificat','Luke 1:46-55','My soul proclaims the greatness of the Lord, for he has looked with favor']
 ]){
  const plan=H.modernPsalmody(L,d,which,options);
  const selected=R.select(L,d,which,options,plan);
  assert.ok(selected,'Monday Week I First Edition weekday source must be selected');
  assert.ok(selected.source.includes('ord-w01-mon-'),'weekday source should identify Monday Week I');
  const ant=selected.gospelAntiphon;
  assert.ok(ant&&ant.startsWith(antiphonStart),'wrong '+canticleName+' antiphon');
  const html=H.modern(L,d,which,options);
  const from=html.indexOf('<b>'+canticleName+'</b>');
  const to=html.indexOf('<b>Intercessions</b>',from);
  assert.ok(from!==-1&&to>from,section+' needs its appointed canticle before intercessions');
  const passage=html.slice(from,to);
  assert.ok(passage.includes(R.ordinary[which==='L'?'benedictus':'magnificat'].split('\\n')[0]),section+' includes the gospel canticle');
  assert.equal(passage.split(ant).length-1,2,section+' repeats the appointed antiphon before and after canticle');
  assert.equal(expectedRef,which==='L'?'Luke 1:68-79':'Luke 1:46-55');
 });
});
