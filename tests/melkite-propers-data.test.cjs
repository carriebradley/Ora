const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
test('Melkite dated hymn imports are isolated from Ukrainian and Scripture',()=>{
 const data=JSON.parse(fs.readFileSync(path.join(__dirname,'..','melkite-propers-2026-11.json'),'utf8'));
 assert.equal(data.schema,1);
 for(const [iso,entry] of Object.entries(data.days)){
  assert.match(iso,/^2026-11-\d{2}$/);
  assert.equal(entry.church,'melkite');
  assert.equal(entry.iso,iso,'Every imported Melkite proper must identify its date');
  assert.equal(entry.source,'https://melkite.org/liturgical-resources');
  assert.equal(entry.typicon,'November-2026.docx');
  const keys=Object.keys(entry.groups);
  assert.ok(keys.length);
  assert.ok(keys.every(k=>['troparia','prokeimenon','alleluia'].includes(k)));
  for(const lines of Object.values(entry.groups)){
   assert.ok(Array.isArray(lines)&&lines.length);
   for(const line of lines){
    assert.equal(typeof line,'string');
    assert.ok(line.length>2&&line.length<=1200);
    assert.doesNotMatch(line,/[\u0600-\u06ff\u0400-\u052f]/u);
    assert.doesNotMatch(line,/^(?:BRETHREN|READING from|At that time|Homily)/i);
   }
  }
 }
 if(Object.keys(data.days).length)for(const iso of ['2026-11-15','2026-11-22']){
  assert.ok(data.days[iso]);
  assert.deepEqual(Object.keys(data.days[iso].groups),['troparia','prokeimenon','alleluia']);
 }
});


test('Newton year-round hymns preserve November and quarantine disputed dates',()=>{
 const year=JSON.parse(fs.readFileSync(path.join(__dirname,'..','melkite-propers-2026.json'),'utf8'));
 const november=JSON.parse(fs.readFileSync(path.join(__dirname,'..','melkite-propers-2026-11.json'),'utf8'));
 assert.equal(year.schema,1);
 assert.equal(year.year,2026);
 assert.equal(Object.keys(year.coverage).length,12);
 assert.equal(Object.keys(year.days).length,63);
 assert.equal(year.days['2026-01-30'],undefined);
 assert.equal(year.days['2026-12-24'],undefined);
 assert.deepEqual(year.coverage.January.quarantined[0],{
  date:'2026-01-30',printedWeekday:'Thursday',actualWeekday:'Friday'
 });
 assert.equal(new Date('2026-01-30T12:00:00Z').getUTCDay(),5);
 assert.match(year.coverage.January.source,/January-2026\.docx$/);
 assert.equal(year.coverage.December.quarantined[0].date,'2026-12-24');
 for(const [iso,rec] of Object.entries(november.days))assert.deepEqual(year.days[iso],rec,'November source preserved: '+iso);
 for(const [iso,rec] of Object.entries(year.days)){
  assert.equal(rec.church,'melkite');
  assert.equal(rec.iso,iso);
  assert.match(rec.typicon,/^[A-Za-z]+-2026\.docx$/);
  assert.equal(rec.source,'https://melkite.org/liturgical-resources');
  for(const lines of Object.values(rec.groups))for(const line of lines)
   assert.doesNotMatch(line,/Reading from (?:the )?(?:Epistle|Gospel)/i,'Scripture header in '+iso);
 }
});
