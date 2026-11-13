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


test('fixed Compline additions preserve the Byzantine Creed and source provenance',()=>{
 assert.equal(B.fixedSource.rights,'public-domain');assert.match(B.fixedSource.translation,/1891/);
 assert.match(B.fixed.creed,/who proceedeth from the Father/);assert.doesNotMatch(B.fixed.creed,/proceedeth from the Father and the Son/);
 assert.match(B.fixed.doxology,/Every evening will I bless thee/);
 assert.match(B.fixed.prayerHours,/Sanctify our souls/);
 assert.deepEqual(C.FLOWS.byz.night.filter(s=>s.type==='byzfixed').map(s=>s.key),['comeWorship','doxology','creed','worthy','prayerHours','glory','moreHonourable','motherOfGod','beforeSleep','mostGlorious','trinityProtection']);
});
test('expanded companions preserve the order of fixed prayers and psalm groups',()=>{
 const night=C.FLOWS.byz.night.map(s=>s.key||s.title),v=C.FLOWS.byz.evening;
 assert.ok(night.indexOf('creed')<night.indexOf('worthy'));
 assert.ok(night.indexOf('worthy')<night.indexOf('prayerHours'));
 assert.ok(night.indexOf('motherOfGod')<night.indexOf('beforeSleep'));
 assert.match(B.fixed.motherOfGod,/^O thou Virgin/);assert.match(B.fixed.beforeSleep,/^And grant unto us/);
 assert.match(B.fixed.vespersVouchsafe,/despise not thou the works of thine own hands/);
 assert.equal(v.find(s=>s.title==='Lord, I have cried').psalms,'140;141;129;116');
 assert.ok(v.findIndex(s=>s.title==='Song of Simeon')<v.findIndex(s=>s.title==='Other appointed troparia · service book'));
});
test('Resurrection hymns use the verified Sunday tone, including Saturday Vespers',()=>{
 const d={tone:8,pascha:'2026-04-05',title:'Sunday'};
 assert.equal(B.resurrectionFor('morning','2026-11-15',d,true).text,B.resurrection['8'].text);
 assert.equal(B.resurrectionFor('evening','2026-11-14',d,true).date,'2026-11-15');
 for(const [kind,date,verified]of [['evening','2026-11-15',true],['morning','2026-11-14',true],['night','2026-11-15',true],['morning','2026-11-15',false],['morning','2026-04-05',true],['morning','2026-05-24',true]])assert.equal(B.resurrectionFor(kind,date,d,verified),null);
 assert.equal(Object.keys(B.resurrection).length,8);
 for(const h of Object.values(B.resurrection)){assert.ok(h.text.length>150);assert.doesNotMatch(h.text,/【|‚Ä|\ufffd/);}
});

test('upcoming great-feast troparia follow the feast and its preceding Vespers',()=>{
 const day={tone:8,pascha:'2026-04-05',title:'Great Feast'};
 for(const [morning,eve,title]of [['2026-11-21','2026-11-20',/Entrance/],['2026-12-25','2026-12-24',/Nativity/]]){
  const a=B.troparionFor('morning',morning,day,true),b=B.troparionFor('evening',eve,day,true);
  assert.match(a.title,title);assert.equal(a.text,b.text);assert.equal(b.date,morning);
  assert.equal(B.troparionFor('morning',morning,day,false),null);
  assert.equal(B.troparionFor('night',morning,day,true),null);
  assert.ok(!B.troparionFor('evening',morning,day,true)?.title.match(title));
 }
});
