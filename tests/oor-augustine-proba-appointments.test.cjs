const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const texts=require('../oortext.json');
const inventory=require('../docs/office-of-readings-availability.json');

test('Augustine on prayer: six indexed selections preserve chapter boundaries and provenance',()=>{
 const sandbox={self:{}};
 vm.runInNewContext(fs.readFileSync(require.resolve('../oor.js'),'utf8'),sandbox);
 const rows=Object.values(sandbox.self.OOR).filter(e=>e.a==='Augustine'&&e.w?.startsWith('Letter 130 to Proba'));
 assert.equal(rows.length,6);
 const expected={
  'Letter 130 to Proba 8, 15.17–9, 18':3,
  'Letter 130 to Proba 9, 18–10, 20':3,
  'Letter 130 to Proba 11, 21–12, 22':2,
  'Letter 130 to Proba 12, 22–13, 24':3,
  'Letter 130 to Proba 14, 25-26':2,
  'Letter 130 to Proba 14, 27–15, 28':2
 };
 for(const row of rows){
  const key=row.a+'|'+row.w,entry=texts[key];
  assert.ok(entry,key);
  assert.equal(entry.p.length,expected[row.w],key);
  assert.equal(entry.edition,'historical-alternative',key);
  assert.match(entry.src,/not the First Edition ICEL wording/);
  assert.match(entry.src,/1887/);
  assert.equal(entry.sourceUrl,'https://www.newadvent.org/fathers/1102130.htm');
  assert.ok(entry.p.every(p=>p.length>160),key);
 }
 assert.equal(inventory.bundled,Object.keys(texts).length);
 assert.equal(inventory.available,98);
 assert.equal(inventory.missing,464);
});
