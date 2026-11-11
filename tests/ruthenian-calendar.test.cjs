const {test}=require('node:test'),assert=require('node:assert/strict');
const L=require('../calendar.js'),B=require('../byzlect.js');
const day=s=>L.byzantine(new Date(s+'T00:00:00Z'));
test('Pittsburgh default retains its own feast dates and annual local commemorations',()=>{
 assert.equal(L.DEFAULTS.byzChurch,'ruthenian');
 assert.match(day('2026-12-08').title,/Conception/);
 assert.doesNotMatch(day('2026-12-09').title,/Conception/);
 assert.match(day('2026-10-31').title,/Theodore Romzha/);
 assert.match(day('2026-12-12').title,/Guadalupe/);
 assert.match(day('2026-01-18').title,/Zacchaeus/);
 assert.match(B.read(L.D(2026,1,18),0,L.westernEaster,'ruthenian').sets[0].t,/Zacchaeus/);
 for(const [date,tone] of Object.entries(require('./byzantine-tones-2026.json').tones))assert.equal(day(date).tone,tone,date);
});
test('Pittsburgh fixed-feast dates also select the matching readings',()=>{
 const read=s=>B.read(new Date(s+'T00:00:00Z'),0,L.westernEaster,'ruthenian',L.byzAnnaDay(L.DEFAULTS));
 assert.ok(read('2026-12-08').sets.some(s=>/Conception|Anna/i.test(s.t)));
 assert.ok(!read('2026-12-09').sets.some(s=>/Conception|Anna/i.test(s.t)));
 assert.ok(read('2026-11-15').sets.flatMap(s=>s.r).some(([k,c])=>k==='Gospel'&&c==='Luke 10:25-37'));
});
