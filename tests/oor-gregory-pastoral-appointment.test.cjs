const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const readings=require('../oortext.json');
const inventory=require('../docs/office-of-readings-availability.json');

test('Gregory Pastoral Rule II.4 is appointed and attributed as a historical translation',()=>{
 const sandbox={self:{}};
 vm.runInNewContext(fs.readFileSync(require.resolve('../oor.js'),'utf8'),sandbox);
 const key='Gregory the Great|Pastoral Guide 2, 4';
 const indexed=Object.values(sandbox.self.OOR).some(x=>x.a==='Gregory the Great'&&x.w==='Pastoral Guide 2, 4');
 assert.ok(indexed,'The reading must match the indexed Office appointment');
 const record=readings[key];
 assert.ok(record,'Appointed passage must be bundled');
 assert.equal(record.edition,'historical-alternative');
 assert.equal(record.sourceUrl,'https://www.newadvent.org/fathers/36012.htm');
 assert.match(record.src,/not the First Edition ICEL wording/);
 assert.match(record.src,/James Barmby/);
 assert.match(record.src,/1895/);
 assert.equal(record.p.length,1);
 assert.ok(record.p[0].length>900);
 assert.match(record.p[0],/silence/i);
 assert.match(record.p[0],/speech/i);
 assert.equal(inventory.bundled,Object.keys(readings).length);
 assert.equal(inventory.available,inventory.bundled);
 assert.equal(inventory.available+inventory.missing,562);
});
