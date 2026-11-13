const {test}=require('node:test'),assert=require('node:assert/strict');
const R=require('../roman-office.js'),H=require('../hours.js'),L=require('../calendar.js');
const us={epiphany:'sunday',ascension:'sunday',corpus:'sunday'};
const date=iso=>new Date(iso+'T00:00:00Z');
test('Revelation 11–12 canticle ends at the appointed clause instead of continuing into the woe',()=>{
 const text=R.canticleText('Revelation 11:17-18|Revelation 12:10-12');
 assert.equal(text.paragraphs.length,5);assert.equal(text.rights,'public-domain');
 assert.equal(text.paragraphs.at(-1),'Therefore rejoice, O heavens, and you that dwell therein.');
 assert.doesNotMatch(text.paragraphs.join(' '),/Woe to the earth|destroy them who have corrupted|I heard a loud voice/);
 assert.match(text.paragraphs.join(' '),/render reward to thy servants/);
 assert.match(text.paragraphs.join(' '),/blood of the Lamb/);
 for(const iso of ['2026-11-12','2027-05-08','2027-05-09']){
  const html=H.modern(L,date(iso),'V',us);
  assert.match(html,/Therefore rejoice, O heavens/);
  assert.doesNotMatch(html,/data-ref="Revelation 11:17/);
 }
});
test('Revelation 19 uses the four praise stanzas and excludes unappointed narrative',()=>{
 const text=R.canticleText('Revelation 19:1-7');assert.equal(text.paragraphs.length,4);
 assert.equal(text.translation,'Douay-Rheims');assert.equal(text.rights,'public-domain');
 const joined=text.paragraphs.join(' ');
 assert.doesNotMatch(joined,/harlot|smoke ascendeth|four and twenty ancients|voice of a great multitude/);
 assert.match(joined,/For true and just are his judgments/);
 assert.match(joined,/marriage of the Lamb is come/);
 for(const stanza of text.paragraphs){assert.ok(stanza.startsWith('Alleluia.'));assert.ok(stanza.endsWith('Alleluia.'));}
 for(const iso of ['2027-01-17','2027-03-30','2027-05-16']){
  const html=H.modern(L,date(iso),'V',us);assert.match(html,/marriage of the Lamb is come/);
  assert.doesNotMatch(html,/data-ref="Revelation 19:1-7/);
 }
 assert.equal(R.canticleText('Ephesians 1:3-10'),null,'unreviewed selections retain their existing Scripture path');
});
