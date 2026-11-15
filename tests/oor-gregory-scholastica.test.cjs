const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const texts=require('../oortext.json');
const audit=require('../docs/office-of-readings-availability.json');

test('St Scholastica second reading matches Gregory Dialogues II.33 and excludes source artifacts',()=>{
 const ctx={self:{}};
 vm.runInNewContext(fs.readFileSync(require.resolve('../oor.js'),'utf8'),ctx);
 const key='Gregory the Great|Dialogues 2, 33';
 assert.ok(Object.values(ctx.self.OOR).some(e=>e.a==='Gregory the Great'&&e.w==='Dialogues 2, 33'));
 const entry=texts[key];
 assert.ok(entry);
 assert.equal(entry.edition,'historical-alternative');
 assert.equal(entry.sourceUrl,'https://www.tertullian.org/fathers/gregory_02_dialogues_book2.htm');
 assert.match(entry.src,/not the First Edition ICEL wording/);
 assert.ok(entry.p.length>=4);
 const combined=entry.p.join(' ');
 assert.ok(combined.length>2000);
 for(const word of ['Scholastica','Benedict','rain','prayer'])assert.match(combined,new RegExp(word,'i'));
 assert.doesNotMatch(combined,/\|\s*\d{2,3}\b/);
 assert.doesNotMatch(combined,/Chapter Thirty-four/i);
 assert.doesNotMatch(combined,/God is charity\s+42\b/);
 assert.equal(audit.bundled,Object.keys(texts).length);
 assert.equal(audit.available,audit.bundled);
 assert.equal(audit.available+audit.missing,562);
});
