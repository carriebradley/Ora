const {test}=require('node:test'),assert=require('node:assert/strict'),texts=require('../oortext.json');
test('added Office readings preserve approved wording, responsories and rights notices',()=>{
 const added=Object.entries(texts).filter(([,r])=>r.rights==='icel-web-policy');assert.equal(added.length,20);
 for(const [key,r]of added){assert.ok(r.p.join(' ').length>1000,key);assert.ok(r.responsory.length>100,key);assert.match(r.acknowledgment,/© 1974/);assert.match(r.src,/No ICEL affiliation or endorsement/);assert.match(r.sourceUrl,/^https:\/\/divineoffice.org\/[\w-]+\/$/);assert.doesNotMatch(r.p.join(' '),/【|PSALMODY|CONCLUDING PRAYER|Login to/);}
 assert.match(texts['Cyril of Jerusalem|Catechesis 15, 1-3'].p[0],/^We do not preach only one coming of Christ/);
 assert.match(texts['Basil the Great|On the Holy Spirit 15, 35'].p.at(-1),/only one death and one resurrection/);
 assert.match(texts['Conrad of Marburg|Letter of 1232'].title,/Elizabeth/);
});

test('Advent additions match existing temporal index and preserve reading boundaries',()=>{
 const fs=require('node:fs'),vm=require('node:vm'),c={self:{}};vm.runInNewContext(fs.readFileSync(require.resolve('../oor.js'),'utf8'),c);
 for(const key of ['a1-1','a1-3','a1-4','a1-5','a1-6','a2-0','a2-1','a2-3','a2-4','a2-6','a3-0','a3-2','a3-5']){
  const e=c.self.OOR[key],r=texts[e.a+'|'+e.w];assert.equal(r?.edition,'first',key);
  assert.match(r.sourceUrl,/adv-w0[123]-[a-z]+-or/);assert.doesNotMatch(r.responsory,/TE DEUM|You are God: we praise you|CONCLUDING PRAYER/);
 }
 assert.match(texts['Anselm of Canterbury|Proslogium 1'].p.at(-1),/love you in finding you/);
 assert.match(texts['Imitation of Christ|Book 2, 2-3'].p.at(-1),/first put up with them/);
});
