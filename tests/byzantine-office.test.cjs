const {test}=require('node:test'),assert=require('node:assert/strict');
const B=require('../byzantine-office.js'),C=require('../content.js'),H=require('../hours.js');
test('both church companions use their own sources and complete daily-cycle guidance',()=>{
 for(const church of ['ukrainian','melkite']){
  const p=B.plan('morning',church,'2026-11-13','2026-04-05');
  assert.match(p.outlines[0],/3, 37, 62, 87, 102, 142/);
  assert.ok(p.sources.every(([,u])=>church==='melkite'?/melkite.org/.test(u):/eeparchy.com/.test(u)));
  assert.match(p.church,church==='melkite'?/Newton/:/Edmonton/);
 }
 assert.match(C.HOURS.byz.find(h=>h.hour==='compline').d,/Great Compline has a different order/);
 assert.equal(C.HOURS.byz.length,8);
});
test('Paschal opening and Heavenly King follow the Pascha to Pentecost boundaries',()=>{
 const p=day=>B.plan('morning','melkite',day,'2026-04-05');
 assert.equal(p('2026-04-04').heavenlyKing,true);
 assert.equal(p('2026-04-05').paschal,true);assert.equal(p('2026-04-11').brightWeek,true);
 assert.equal(p('2026-04-12').brightWeek,false);
 assert.equal(p('2026-05-13').paschal,true);assert.equal(p('2026-05-14').paschal,false);
 assert.equal(p('2026-05-23').heavenlyKing,false);assert.equal(p('2026-05-24').heavenlyKing,true);
});
test('private companions use a reader opening and Small Compline psalms instead of Simeon',()=>{
 for(const flow of Object.values(C.FLOWS.byz)){
  assert.equal(flow[0].title,'Sign of the Cross');assert.equal(flow[1].title,'Reader’s opening');
  for(const s of flow.filter(s=>s.type==='byzpsalms'))for(const n of s.psalms.split(';'))assert.ok(H.modernPsalm(n)[0]?.rows.length);
 }
 assert.equal(C.FLOWS.byz.night.some(s=>s.title==='Song of Simeon'),false);
 assert.equal(C.FLOWS.byz.night.find(s=>s.type==='byzpsalms').psalms,'50;69;142');
});
