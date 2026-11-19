'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const F=require('../liturgical-format.js');
const rows=lines=>lines.map(text=>({text}));

test('Edmonton Typica remains an optional choice and the common hymn stays outside',()=>{
 const source=rows(['Typica: Psalm 102','ALL: Bless the Lord, O my soul,',
  'Compassionate and merciful is the Lord,','Blessed are You, O Lord.',
  'Hymn to Christ','ALL: Shared hymn.']);
 const result=F.edmontonAdditionalAntiphonRows(source,'typica');
 assert.deepEqual(result.map(r=>r.alternative||''),['typica','typica','typica','typica','','']);
 assert.deepEqual(result.map(r=>r.text),source.map(r=>r.text));
 assert.ok(source.every(r=>!r.alternative),'source rows remain unchanged');
});

test('Edmonton Beatitudes end before the entrance directions',()=>{
 const source=rows(['The Beatitudes','ALL: Remember us, O Lord,',
  'Blessed are the first. Blessed are the second. Blessed are the third.',
  'Blessed are they fourth. Blessed are they fifth. Blessed are the sixth.',
  'Blessed are the seventh. Blessed are the eighth. Blessed are you ninth.',
  'Rejoice and be glad * for your reward will be great in heaven.',
  'The procession leaves the sanctuary through the north doors.']);
 const result=F.edmontonAdditionalAntiphonRows(source,'beatitudes');
 assert.ok(result.slice(0,-1).every(r=>r.alternative==='beatitudes'));
 assert.equal(result.at(-1).alternative,undefined);
 assert.deepEqual(result.map(r=>r.text),source.map(r=>r.text));
});

test('incomplete, duplicated and unknown antiphon structures remain untouched',()=>{
 const good=rows(['Typica: Psalm 102','ALL: Bless the Lord, O my soul,',
  'Compassionate and merciful is the Lord,','Blessed are You, O Lord.','Hymn to Christ']);
 for(const altered of [good.slice(0,-1),[...good,good[0]],good.filter(r=>!r.text.startsWith('Compassionate'))])
  assert.strictEqual(F.edmontonAdditionalAntiphonRows(altered,'typica'),altered);
 assert.strictEqual(F.edmontonAdditionalAntiphonRows(good,'other'),good);
});
