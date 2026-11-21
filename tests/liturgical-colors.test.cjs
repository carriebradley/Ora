const {test}=require('node:test'),assert=require('node:assert/strict');
const L=require('../calendar.js'),S=require('../sarum.js'),D=require('../data.js');
require('../edmonton.js');require('../melkite.js');
const C=require('../liturgical-colors.js'),date=s=>new Date(s+'T00:00:00Z');
L.setData(D);S.setData(D);
test('blue identifies observed Marian feasts across the three traditions',()=>{
 for(const [s,rite]of [['2026-12-08','roman'],['2027-04-05','roman'],['2027-05-31','roman'],['2026-02-02','sarum'],['2026-08-15','sarum']]){
  const r=rite==='roman'?L.roman(date(s)):S.sarum(date(s));
  assert.equal(C.display(r),'blue',r.title);
 }
 for(const church of ['ukrainian','melkite'])for(const s of ['2026-03-25','2026-08-15','2026-09-08','2026-11-21','2026-12-09']){
  const r=L.byzantine(date(s),{byzChurch:church});assert.equal(C.display(r),'blue',`${church}/${r.title}`);
 }
});
test('Marian display colour leaves vestment data and precedence intact',()=>{
 const day=L.roman(date('2026-12-08')),saved=JSON.stringify(day);
 assert.equal(day.color,'w');assert.equal(C.display(day),'blue');assert.equal(JSON.stringify(day),saved);
 const displaced=L.roman(date('2026-05-31'));assert.match(displaced.title,/Trinity/);assert.equal(C.marian(displaced),false);
 const holyThursday=L.roman(date('2027-03-25'));assert.match(holyThursday.title,/Holy Thursday/);assert.equal(C.marian(holyThursday),false);
});

test('fasting days and seasons are identified without changing calendar data',()=>{
 const martin={title:'A feast',color:'w',season:'After Trinity',historicalObservance:{name:"St. Martin's Lent"}};
 const before=JSON.stringify(martin);
 assert.equal(C.fasting(martin,'sarum'),true);
 assert.equal(C.fasting(martin,'roman'),false);
 assert.equal(C.fasting({fast:'Fast and abstinence',color:'r'},'roman'),true);
 assert.equal(C.fasting({fastSeason:'Nativity Fast',color:'w'},'byz'),true);
 assert.equal(C.fasting({season:'Lent',color:'w'},'roman'),true);
 assert.equal(C.fasting({season:'Passiontide',color:'r'},'sarum'),true);
 assert.equal(C.fasting({season:'Advent',color:'w'},'roman'),false);
 assert.equal(JSON.stringify(martin),before);
});
test('other Marys, virgins, and optional or outranked Marian entries do not recolour a day',()=>{
 for(const title of ['Saint Mary Magdalene','Saint Mary of Egypt','Saint Therese, Virgin and Doctor','Saint Joseph, Spouse of the Blessed Virgin Mary','Christmas','Presentation of the Lord']){
  assert.equal(C.marian({title}),false,title);
 }
 assert.equal(C.marian({title:'Sunday of Advent',also:[{title:'Immaculate Conception'}]}),false);
});


test('explicit fast-free wording does not create a false purple fasting day',()=>{
 const quiet={title:'Ordinary weekday',season:'Ordinary Time',color:'w'};
 for(const fast of ['No fast','No fasting','Fast-free','Fast is lifted','Fasting is lifted']){
  const day={...quiet,fast},before=JSON.stringify(day);
  assert.equal(C.fasting(day,'roman'),false,'No fasting observance: '+fast);
  assert.equal(JSON.stringify(day),before,'Display must not mutate the calendar');
 }
 assert.equal(C.fasting({...quiet,fast:'Fast and abstinence'},'roman'),true);
 // Fast seasons are visibly purple even when a particular feast is fast-free.
 assert.equal(C.fasting({...quiet,fast:'No fast',fastSeason:'Nativity Fast'},'byz'),true);
 assert.equal(C.fasting({...quiet,fast:'Fast-free',season:'Lent'},'roman'),true);
 assert.equal(C.fasting({...quiet,fast:'No fast',
   historicalObservance:{name:"St. Martin's Lent"}},'sarum'),true);
});


test('fast-free wording stays neutral across Today badge and Calendar chip decisions',()=>{
 const words=['No fast','No fasting','Fast-free','Fast free','Fast is lifted','Fasting is lifted'];
 for(const fast of words){
  assert.equal(C.fastFree(fast),true,fast);
  assert.equal(C.fasting({fast,season:'Ordinary Time'},'roman'),false,fast);
 }
 for(const fast of ['Fast and abstinence','No meat','Strict Fast','Great Fast']){
  assert.equal(C.fastFree(fast),false,fast);
 }
 assert.equal(C.fastFree(''),false);
 assert.equal(C.fasting({fast:'No fasting',fastSeason:'Nativity Fast'},'byz'),true);
 assert.equal(C.fasting({fast:'No fast',historicalObservance:{name:"St. Martin's Lent"}},'sarum'),true);
});
