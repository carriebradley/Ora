'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const cp=require('node:child_process');
const path=require('node:path');
const L=require('../calendar.js');
const S=require('../liturgy-schedule.js');
const root=path.resolve(__dirname,'..');

test('v1 Roman Office tracked sections remain present under every configured transfer option',()=>{
 const output=cp.execFileSync(process.execPath,[path.join(root,'tools/audit_roman_office_texts.cjs')],{
  encoding:'utf8',maxBuffer:10*1024*1024,timeout:90000
 });
 const actual=JSON.parse(output);
 assert.equal(actual.totals.offices,462,'November 2026–June 2027 Lauds/Vespers audit date window changed');
 assert.equal(actual.transferOptions.length,8,'All eight transfer combinations must be checked');
 for(const record of [actual,...actual.transferOptions]){
  const label=JSON.stringify(record.options);
  for(const field of ['antiphons','responsory','gospelAntiphon','intercessions','collect','appointedShortReading'])
   assert.equal(record.totals[field],record.totals.offices,label+' lacks '+field);
  assert.deepEqual(record.missingSourceIds,[],label+' has missing identified source IDs');
  assert.deepEqual(record.withheldPsalmodyIds,[],label+' has unmatched psalm antiphons');
  assert.deepEqual(record.withheldGospelAntiphonIds,[],label+' has withheld Gospel antiphons');
  assert.deepEqual(record.unresolvedOffices,[],label+' has unresolved office selections');
 }
 // Section-presence tests do not authenticate the liturgical text or every appointment.
 const statement=fs.readFileSync(path.join(root,'docs/ORA-V1-RELEASE-BASELINE-2026-11-15.md'),'utf8');
 assert.match(statement.replace(/\*\*/g,''),/not necessarily independently verified verbatim/i);
});

test('v1 calendar safeguards remain in place for joyful Sundays and conflicting services',()=>{
 const d=s=>new Date(s+'T00:00:00Z');
 const gaudete=L.roman(d('2026-12-13'));
 const laetare=L.roman(d('2027-03-07'));
 assert.match(gaudete.title,/Gaudete Sunday/i);
 assert.match(laetare.title,/Laetare Sunday/i);
 assert.equal(gaudete.color,'rose');
 assert.equal(laetare.color,'rose');
 const blocked=S.service('2026-12-24','ukrainian');
 assert.equal(blocked.id,'unknown');
 assert.equal(blocked.verification,'source-conflict');
 assert.equal(S.service('2026-12-24','melkite').id,'basil');
});

test('v1 release scope explicitly rejects unfinished text corpus and premature approval claims',()=>{
 const roadmap=fs.readFileSync(path.join(root,'docs/ORA-V1-COMPLETION-ROADMAP.md'),'utf8');
 const baseline=fs.readFileSync(path.join(root,'docs/ORA-V1-RELEASE-BASELINE-2026-11-15.md'),'utf8');
 assert.match(roadmap,/Roman-first Catholic spiritual companion/);
 assert.match(roadmap,/superseded as a planning assumption/);
 const fidelity=fs.readFileSync(path.join(root,'docs/ORA-V1-ROMAN-FIDELITY-GATE.md'),'utf8');
 assert.match(fidelity,/Morning Prayer \(Lauds\)/);
 assert.match(fidelity,/Mass — correct order and actual texts/);
 assert.match(fidelity,/Office of Readings.*Daytime Prayer.*Compline/);
 assert.match(fidelity,/Other rites remain first-class/);
 assert.match(roadmap,/Mass and the Liturgy of the Hours/);
 assert.match(fidelity,/Source-backed parity evidence/);
 assert.match(fidelity,/proposed .*acceptance framework|proposed .*acceptance/i);
 assert.match(roadmap,/iPhone\/Safari acceptance testing/);
 assert.match(baseline,/November 29, 2026/);
 assert.match(baseline,/not yet certified/i);
});
