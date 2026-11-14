const {test}=require('node:test');
const assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const path=require('node:path');
const inventory=require('../docs/office-of-readings-availability.json');
const texts=require('../oortext.json');

test('Office of Readings inventory matches its current index and bundled texts',()=>{
 const audit=JSON.parse(execFileSync(process.execPath,[path.join(__dirname,'../tools/audit_oor_texts.cjs')],{encoding:'utf8'}));
 for(const field of ['scope','indexed','available','missing','bundled','approvedIcel']){
  assert.deepEqual(inventory[field],audit[field],field+' is out of date: rerun node tools/audit_oor_texts.cjs');
 }
 assert.deepEqual(inventory.missingReferences,audit.missingReferences,'missing reading list is out of date');
 assert.equal(inventory.indexed,inventory.available+inventory.missing);
 assert.equal(inventory.bundled,Object.keys(texts).length);
 assert.equal(new Set(inventory.missingReferences).size,inventory.missingReferences.length);
 for(const key of inventory.missingReferences)assert.equal(Object.hasOwn(texts,key),false,'missing reference is already bundled: '+key);
});

test('approved First Edition entries retain required provenance',()=>{
 const approved=Object.entries(texts).filter(([,entry])=>entry.rights==='icel-web-policy');
 assert.equal(approved.length,inventory.approvedIcel);
 for(const [key,entry] of approved){
  assert.ok(Array.isArray(entry.p)&&entry.p.some(p=>typeof p==='string'&&p.trim()),key);
  assert.match(entry.acknowledgment||'',/© 1974/,key);
  assert.match(entry.sourceUrl||'',/^https:\/\//,key);
  assert.match(entry.src||'',/No ICEL affiliation or endorsement/,key);
 }
});
