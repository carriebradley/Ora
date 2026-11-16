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
