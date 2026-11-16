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
