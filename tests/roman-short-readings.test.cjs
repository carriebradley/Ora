const {test}=require('node:test'),assert=require('node:assert/strict');
const D=require('../roman-short-readings.js'),H=require('../hours.js'),L=require('../calendar.js');
test('appointed short readings have clean public-domain verse text and provenance',()=>{
 assert.equal(Object.keys(D.records).length,191);
 for(const [ref,r]of Object.entries(D.records)){
  assert.equal(r.officeRef,ref);assert.equal(r.rights,'public-domain');assert.ok(r.text.length>35,ref);
  assert.ok(r.source.length);for(const u of r.source)assert.match(u,/^https:\/\/(www\.)?drbo.org\/chapter\/\d{5}\.htm$/);
  assert.doesNotMatch(r.text,/【|L\d+:|TOP OF PAGE|Content type:|< prev|\[\d+\]/,ref);
 }
 assert.equal(D.records['Judith 8:25-27'],undefined,'Greek/Vulgate passage has not been silently substituted');
});
test('different biblical numbering is aligned at passage boundaries',()=>{
 const hosea=D.records['Hosea 5:15b-16:2'];assert.equal(hosea.ref,'Hosea 6:1-3a');
 assert.match(hosea.text,/third day/);assert.match(hosea.text,/live in his sight\.$/);assert.doesNotMatch(hosea.text,/We shall know/);
 const micah=D.records['Micah 5:2, 3, 4a'];assert.equal(micah.ref,'Micah 5:3-5a');assert.match(micah.text,/And this man shall be our peace\.$/);
 assert.equal(D.records['Malachi 3:23-24'].ref,'Malachi 4:5-6');
 assert.equal(D.records['Zechariah 2:14-17'].ref,'Zechariah 2:10-13');
 assert.equal(D.records['Tobit 4:15a. 16a. 18a. 19'].ref,'Tobit 4:16,17,19,20');
});
test('ordinary appointed Scripture replaces historical chapters without changing section markup',()=>{
 const html=H.modern(L,new Date('2027-01-11T00:00:00Z'),'L',{epiphany:'sunday',ascension:'sunday',corpus:'sunday'});
 assert.match(html,/class="sec"><b>Short reading ·/);assert.doesNotMatch(html,/Short reading \(traditional chapter\)/);
 assert.match(html,/class="sec"><b>Responsory/);assert.match(html,/class="sec"><b>Intercessions/);
});
