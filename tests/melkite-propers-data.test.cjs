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
