'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {audit}=require('../tools/audit_pdf_extraction.cjs');
test('source extraction audit finds mixed-script English tokens with page provenance',()=>{
 const report=audit('The Light. Тhe light.\nГосподи помилуй.\fTaking bread, sауs.\n');
 assert.equal(report.pages,2);
 assert.equal(report.summary['mixed-script-token'],2);
 assert.deepEqual(report.findings.map(x=>[x.kind,x.page,x.line,x.token]),[
  ['mixed-script-token',1,1,'Тhe'],['mixed-script-token',2,1,'sауs']
 ]);
});
test('source extraction audit flags private-use marks and damaged glyphs without changing text',()=>{
 const source='Priest \uF058 Blessed. \uF076 \u25A1 \uFFFD';
 const report=audit(source);
 assert.equal(report.summary['private-use-glyph'],2);
 assert.equal(report.summary['replacement-glyph'],2);
 assert.deepEqual(report.findings.map(x=>x.codepoint),['U+F058','U+F076','U+25A1','U+FFFD']);
 assert.equal(source,'Priest \uF058 Blessed. \uF076 \u25A1 \uFFFD');
});
test('ordinary Cyrillic-only lines, accents and religious symbols are not false positives',()=>{
 const report=audit('Українською молитва.\nPeace † be to all.\nÉléison.');
 assert.deepEqual(report.findings,[]);
});
