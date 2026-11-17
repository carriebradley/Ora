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

test('Newton 2009 repetition audit preserves source-page and separates instruction types',()=>{
 const source='All: Lord, have mercy. (To be repeated after each petition.)\n'
  +'All: Amen. (Three times)\f'
  +'All: Lord, have mercy. (three times -\u00ad\u2010\u2011 to be repeated after each petition.)\n'
  +'This person repeated the petition three times in ordinary speech.';
 const result=audit(source);
 assert.equal(result.pages,2);
 assert.equal(result.summary['repetition-rubric'],3);
 assert.deepEqual(result.findings.map(x=>[x.kind,x.page,x.line,x.cue]),[
  ['repetition-rubric',1,1,'after-each-petition'],
  ['repetition-rubric',1,2,'three-times'],
  ['repetition-rubric',2,1,'after-each-petition']
 ]);
 assert.match(result.findings[2].excerpt,/Lord, have mercy/);
 assert.doesNotMatch(result.findings[2].excerpt,/ordinary speech/);
});
