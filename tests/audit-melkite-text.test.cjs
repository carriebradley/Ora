const {test}=require('node:test'),assert=require('node:assert/strict');
const {audit}=require('../tools/audit_melkite_text.cjs');
test('Melkite audit records source boundaries and preserves sung prayer',()=>{
 const report=audit(['Table of Kontakia for the Year','Annual entry','The Trisagion Prayer of St. John Chrysostom','PRIEST: Holy God, who rest among the saints.','Table of Hirmoi for the Year','Seasonal reference','During the singing of the Hirmos, the Priest continues:','PRIEST: Remember, O Lord.'].join('\n'));
 assert.equal(report.lines,8);
 assert.deepEqual(report.boundaries.map(x=>x.boundary),['kontakia-start','kontakia-end','hirmoi-start','hirmoi-end']);
 assert.deepEqual(report.findings,[]);
});
test('Melkite audit flags source defects without rewriting source',()=>{
 const report=audit('Table of Kontakia for the Year\nGreek: A---gi---os\nThe Trisagion Prayer of St. John Chrysostom\nPeace □ be to all.\nThe priest bows.');
 assert.deepEqual(report.findings.map(x=>x.kind),['replacement-glyph','possible-rubric']);
 assert.equal(report.findings[0].text,'Peace □ be to all.');
});
test('Melkite audit flags unclosed reference block',()=>{
 assert.equal(audit('Table of Hirmoi for the Year\nAn annual reference').findings[0].kind,'unclosed-reference-table');
});

test('Melkite passage comparison detects missing, reordered and duplicated prayer lines',()=>{
 const {comparePassages}=require('../tools/audit_melkite_text.cjs');
 const src='Priest: Blessed is the Kingdom.\nAll: Amen.\nDeacon: In peace let us pray.';
 const ok=comparePassages(src,src);
 assert.deepEqual(ok.findings,[]);
 assert.deepEqual(comparePassages(src,'Priest: Blessed is the Kingdom.\nDeacon: In peace let us pray.').findings.map(x=>x.kind),['missing']);
 assert.ok(comparePassages(src,'Deacon: In peace let us pray.\nAll: Amen.\nPriest: Blessed is the Kingdom.').findings.some(x=>x.kind==='out-of-order'));
 assert.deepEqual(comparePassages(src,src+'\nAll: Amen.').findings.map(x=>x.kind),['extra-occurrences']);
});
test('Repeated source responses are not automatically marked as duplicates',()=>{
 const {comparePassages}=require('../tools/audit_melkite_text.cjs');
 const src='All: Lord, have mercy.\nAll: Lord, have mercy.';
 assert.deepEqual(comparePassages(src,src).findings,[]);
});

test('Melkite comparison reports unexpected displayed prayers without removing them',()=>{
 const {comparePassages}=require('../tools/audit_melkite_text.cjs');
 const source='Priest: Blessed is the Kingdom.\nAll: Amen.';
 const rendered=source+'\nChoir: Unappointed seasonal hymn.';
 assert.deepEqual(comparePassages(source,rendered).findings.map(x=>x.kind),['unexpected-rendered']);
 assert.equal(comparePassages(source,rendered).findings[0].text,'Choir: Unappointed seasonal hymn.');
});

test('Equivalent prayer wording survives different physical line wrapping',()=>{
 const {comparePassages}=require('../tools/audit_melkite_text.cjs');
 const source='Priest: Blessed is the Kingdom of the Father\nand of the Son and of the Holy Spirit.\nAll: Amen.';
 const rendered='Priest: Blessed is the Kingdom of the Father and of the Son and of the Holy Spirit.\nAll: Amen.';
 assert.deepEqual(comparePassages(source,rendered).findings,[]);
 assert.ok(comparePassages(source,rendered.replace('Holy Spirit','Holy Ghost')).findings.length>0);
 assert.ok(comparePassages(source,'All: Amen.\nPriest: Blessed is the Kingdom of the Father and of the Son and of the Holy Spirit.').findings.length>0);
});

test('Melkite audit recognizes equivalent minister labels but not changed ministers',()=>{
 const {comparePassages}=require('../tools/audit_melkite_text.cjs');
 assert.deepEqual(comparePassages('Celebrant: Blessed is the Kingdom.\nPeople: Amen.','Priest: Blessed is the Kingdom.\nAll: Amen.').findings,[]);
 assert.deepEqual(comparePassages('DCN: In peace let us pray.','Deacon: In peace let us pray.').findings,[]);
 assert.ok(comparePassages('Deacon: In peace let us pray.','Priest: In peace let us pray.').findings.length>0);
});

test('Melkite comparison pinpoints a changed prayer word despite wrapped source lines',()=>{
 const {comparePassages}=require('../tools/audit_melkite_text.cjs');
 const source='Priest: Blessed is the Kingdom of the Father\nand of the Son and of the Holy Spirit.\nAll: Amen.';
 const rendered='Priest: Blessed is the Kingdom of the Father and of the Son and of the Holy Ghost.\nAll: Amen.';
 const report=comparePassages(source,rendered);
 assert.ok(report.findings.length>0,'changed prayer words still require review');
 assert.equal(report.firstDifference.sourceLine,2);
 assert.equal(report.firstDifference.renderedLine,1);
 assert.equal(report.firstDifference.sourceDifferingWords,1);
 assert.equal(report.firstDifference.renderedDifferingWords,1);
 assert.match(report.firstDifference.sourceExcerpt,/Spirit/);
 assert.match(report.firstDifference.renderedExcerpt,/Ghost/);
});
test('Melkite comparison locates an omitted word without inventing replacement wording',()=>{
 const {comparePassages}=require('../tools/audit_melkite_text.cjs');
 const report=comparePassages('Priest: In peace let us pray.\nAll: Amen.','Priest: In peace let pray.\nAll: Amen.');
 assert.ok(report.findings.length>0);
 assert.equal(report.firstDifference.sourceDifferingWords,1);
 assert.equal(report.firstDifference.renderedDifferingWords,0);
 assert.match(report.firstDifference.sourceExcerpt,/us pray/);
});
test('Melkite comparison still identifies changed ministers and omitted final responses',()=>{
 const {comparePassages}=require('../tools/audit_melkite_text.cjs');
 const minister=comparePassages('Deacon: In peace let us pray.','Priest: In peace let us pray.');
 assert.ok(minister.findings.length>0);
 assert.match(minister.firstDifference.sourceExcerpt,/Deacon/);
 const omitted=comparePassages('Priest: Blessed is the Kingdom.\nAll: Amen.','Priest: Blessed is the Kingdom.');
 assert.ok(omitted.findings.some(x=>x.kind==='missing'));
 assert.equal(omitted.firstDifference.sourceDifferingWords,2);
 assert.equal(omitted.firstDifference.renderedDifferingWords,0);
 assert.equal(comparePassages('All: Amen.','People: Amen.').firstDifference,undefined);
});


test('Melkite audit finds two separate prayer-word substitutions without modifying text',()=>{
 const {comparePassages}=require('../tools/audit_melkite_text.cjs');
 const source='Priest: Blessed is the Kingdom.\nAll: Amen.\nDeacon: In peace let us pray.\nAll: Lord, have mercy.';
 const shown='Priest: Blessed is the Realm.\nAll: Amen.\nDeacon: In silence let us pray.\nAll: Lord, have mercy.';
 const report=comparePassages(source,shown);
 assert.equal(report.diffTruncated,false);
 assert.equal(report.differences.length,2);
 assert.deepEqual(report.differences.map(x=>x.kind),['changed','changed']);
 assert.equal(report.differences[0].sourceDifferingWords,1);
 assert.equal(report.differences[1].renderedDifferingWords,1);
 assert.match(report.differences[0].sourceExcerpt,/Kingdom/);
 assert.match(report.differences[1].renderedExcerpt,/silence/);
 assert.ok(report.findings.length>0);
});
test('Melkite audit separates added and omitted words in different petitions',()=>{
 const {comparePassages}=require('../tools/audit_melkite_text.cjs');
 const source='Deacon: In peace let us pray.\nAll: Lord, have mercy.\nPriest: Through the prayers of the saints.';
 const shown='Deacon: In peace now let us pray.\nAll: Lord, have mercy.\nPriest: Through prayers of the saints.';
 const report=comparePassages(source,shown);
 assert.equal(report.differences.length,2);
 assert.deepEqual(report.differences.map(x=>x.kind),['added','omitted']);
 assert.deepEqual(report.differences.map(x=>[x.sourceDifferingWords,x.renderedDifferingWords]),[[0,1],[1,0]]);
});
test('Repeated responses remain in order and do not conceal nearby differences',()=>{
 const {comparePassages}=require('../tools/audit_melkite_text.cjs');
 const source='All: Lord, have mercy.\nPriest: Have mercy on us, O God.\nAll: Lord, have mercy.\nDeacon: Again let us pray.\nAll: Lord, have mercy.';
 const shown='All: Lord, have mercy.\nPriest: Have mercy on us, O Lord.\nAll: Lord, have mercy.\nDeacon: Once let us pray.\nAll: Lord, have mercy.';
 const report=comparePassages(source,shown);
 assert.equal(report.differences.length,2);
 assert.ok(report.differences.every(x=>x.kind==='changed'));
 assert.equal(comparePassages(source,source).findings.length,0);
});
test('Large unrelated text is marked unresolved, never claimed to be fully aligned',()=>{
 const {comparePassages}=require('../tools/audit_melkite_text.cjs');
 const source='Priest: '+Array.from({length:240},(_,i)=>'alpha'+i).join(' ');
 const rendered='Priest: '+Array.from({length:240},(_,i)=>'beta'+i).join(' ');
 const report=comparePassages(source,rendered);
 assert.equal(report.diffTruncated,true);
 assert.equal(report.differences.length,1);
 assert.equal(report.differences[0].kind,'unresolved');
 assert.ok(report.findings.length>0);
});
test('Minister labels and line wrapping do not generate word differences',()=>{
 const {comparePassages}=require('../tools/audit_melkite_text.cjs');
 const original='Celebrant: Blessed is the Kingdom of the Father\nand of the Son.\nPeople: Amen.';
 const displayed='Priest: Blessed is the Kingdom of the Father and of the Son.\nAll: Amen.';
 const report=comparePassages(original,displayed);
 assert.deepEqual(report.findings,[]);
 assert.equal(report.differences,undefined);
 const reordered=comparePassages('Priest: Peace.\nAll: Amen.','All: Amen.\nPriest: Peace.');
 assert.ok(reordered.findings.length>0);
 assert.ok(reordered.differences.length>0);
});


test('Newton dual Kontakia cues and both Trisagion alternatives are legitimate',()=>{
 const source=[
  'The celebrant(s) alternate with the Choir the singing of the hymns as indicated',
  'Table of Kontakia for the Year',
  'Final Kontakion for ordinary Sundays and Weekdays',
  'The Trisagion Prayer of St. John Chrysostom',
  'O Holy of Holies, our only holy God',
  'The Trisagion Prayer of St. Basil the Great',
  'God, the Holy, who rest among the saints',
  'Table of Hirmoi for the Year',
  'From 21 to 25 November: The Presentation of Our Lady',
  'During the singing of the Hirmos, the Priest continues:',
  'Priest: For the holy prophet and forerunner John the Baptist'
 ].join('\n');
 const report=audit(source);
 assert.deepEqual(report.findings,[],'valid Newton alternatives are not broken tables');
 assert.equal(report.boundaries.length,6);
 assert.deepEqual(report.boundaries.map(x=>x.boundary),[
  'kontakia-start','kontakia-start','kontakia-end','kontakia-end','hirmoi-start','hirmoi-end'
 ]);
});

test('Unexpected Trisagion markers still trigger review and cannot erase a running table',()=>{
 const standalone=audit('The Trisagion Prayer of St. Basil the Great\nPRIEST: Holy God.');
 assert.deepEqual(standalone.findings.map(x=>x.kind),['unmatched-reference-end']);
 const repeated=audit('Table of Kontakia for the Year\nThe Trisagion Prayer of St. John Chrysostom\nThe Trisagion Prayer of St. John Chrysostom');
 assert.deepEqual(repeated.findings.map(x=>x.kind),['unmatched-reference-end']);
 const mismatched=audit('Table of Kontakia for the Year\nDuring the singing of the Hirmos, the Priest continues:\nFinal Kontakion\nThe Trisagion Prayer of St. John Chrysostom');
 assert.deepEqual(mismatched.findings.map(x=>x.kind),['unmatched-reference-end']);
});

test('Nested foreign reference table does not swallow the outer table closing marker',()=>{
 const report=audit('Table of Kontakia for the Year\nTable of Hirmoi for the Year\nFinal Kontakion\nThe Trisagion Prayer of St. John Chrysostom');
 assert.deepEqual(report.findings.map(x=>x.kind),['nested-reference-table']);
 assert.equal(report.findings.some(x=>x.kind==='unclosed-reference-table'),false);
});

test('Genuine prayers and repeated responses remain separately auditable around year tables',()=>{
 const {comparePassages}=require('../tools/audit_melkite_text.cjs');
 const source='Priest: O Holy of Holies, our only holy God.\nAll: Amen.\nAll: Lord, have mercy.\nAll: Lord, have mercy.\nPriest: For the holy prophet and forerunner John the Baptist.';
 assert.deepEqual(comparePassages(source,source).findings,[]);
 const lost=comparePassages(source,source.replace('All: Lord, have mercy.\nAll: Lord, have mercy.','All: Lord, have mercy.'));
 assert.ok(lost.findings.some(x=>x.kind==='insufficient-occurrences'));
 assert.ok(lost.differences.some(x=>x.kind==='omitted'));
});
