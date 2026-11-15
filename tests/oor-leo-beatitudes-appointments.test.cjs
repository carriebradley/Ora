const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const texts=require('../oortext.json');
const inventory=require('../docs/office-of-readings-availability.json');

test('five Leo the Great Beatitudes readings use exactly the appointed sermon sections',()=>{
 const sandbox={self:{}};
 vm.runInNewContext(fs.readFileSync(require.resolve('../oor.js'),'utf8'),sandbox);
 const rows=Object.values(sandbox.self.OOR).filter(e=>e.a==='Leo the Great'&&/^Sermon 95/.test(e.w));
 assert.equal(rows.length,5);
 const selections={
  'Sermon 95 on the Beatitudes 1-2':2,
  'Sermon 95, 2-3':2,
  'Sermon 95, 4-6':3,
  'Sermon 95, 6-8':3,
  'Sermon 95, 8-9':2
 };
 for(const row of rows){
  const key=row.a+'|'+row.w,reading=texts[key];
  assert.ok(reading,key);
  assert.equal(reading.p.length,selections[row.w],key);
  assert.equal(reading.edition,'historical-alternative');
  assert.match(reading.src,/not the First Edition ICEL wording/);
  assert.match(reading.src,/1895/);
  assert.equal(reading.sourceUrl,'https://www.newadvent.org/fathers/360395.htm');
  assert.ok(reading.p.every(p=>p.length>150),key);
 }
 assert.equal(inventory.bundled,Object.keys(texts).length);
 assert.equal(inventory.available,103);
 assert.equal(inventory.missing,459);
});
