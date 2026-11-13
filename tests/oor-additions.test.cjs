const {test}=require('node:test'),assert=require('node:assert/strict'),texts=require('../oortext.json');
test('seven added Office readings preserve approved wording, responsories and rights notices',()=>{
 const added=Object.entries(texts).filter(([,r])=>r.rights==='icel-web-policy');assert.equal(added.length,7);
 for(const [key,r]of added){assert.ok(r.p.join(' ').length>1000,key);assert.ok(r.responsory.length>100,key);assert.match(r.acknowledgment,/© 1974/);assert.match(r.src,/No ICEL affiliation or endorsement/);assert.match(r.sourceUrl,/^https:\/\/divineoffice.org\/[\w-]+\/$/);assert.doesNotMatch(r.p.join(' '),/【|PSALMODY|CONCLUDING PRAYER|Login to/);}
 assert.match(texts['Cyril of Jerusalem|Catechesis 15, 1-3'].p[0],/^We do not preach only one coming of Christ/);
 assert.match(texts['Basil the Great|On the Holy Spirit 15, 35'].p.at(-1),/only one death and one resurrection/);
 assert.match(texts['Conrad of Marburg|Letter of 1232'].title,/Elizabeth/);
});
