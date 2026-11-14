const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const texts=require('../oortext.json');
const inventory=require('../docs/office-of-readings-availability.json');

test('Ambrose On the Mysteries alternate translations match all seven indexed appointments',()=>{
 const c={self:{}};
 vm.runInNewContext(fs.readFileSync(require.resolve('../oor.js'),'utf8'),c);
 const entries=Object.values(c.self.OOR).filter(e=>e.a==='Ambrose of Milan'&&/^On the Mysteries /.test(e.w));
 assert.equal(entries.length,7);
 for(const entry of entries){
  const key=entry.a+'|'+entry.w,record=texts[key];
  assert.ok(record,key);
  assert.equal(record.edition,'historical-alternative',key);
  assert.match(record.src,/not the First Edition ICEL wording/);
  assert.match(record.src,/1896/);
  assert.equal(record.sourceUrl,'https://www.newadvent.org/fathers/3405.htm');
  const numbers=entry.w.match(/\d+(?:-\d+)?/g).flatMap(s=>s.includes('-')?Array.from({length:+s.split('-')[1]-+s.split('-')[0]+1},(_,i)=>+s.split('-')[0]+i):[+s]);
  assert.equal(record.p.length,numbers.length,key);
  assert.ok(record.p.every(p=>p.length>50),key);
 }
 assert.equal(inventory.bundled,Object.keys(texts).length);
 assert.ok(inventory.available>=92);
 assert.ok(inventory.missing<=470);
});
