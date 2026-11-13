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
test('other Marys, virgins, and optional or outranked Marian entries do not recolour a day',()=>{
 for(const title of ['Saint Mary Magdalene','Saint Mary of Egypt','Saint Therese, Virgin and Doctor','Saint Joseph, Spouse of the Blessed Virgin Mary','Christmas','Presentation of the Lord']){
  assert.equal(C.marian({title}),false,title);
 }
 assert.equal(C.marian({title:'Sunday of Advent',also:[{title:'Immaculate Conception'}]}),false);
});
