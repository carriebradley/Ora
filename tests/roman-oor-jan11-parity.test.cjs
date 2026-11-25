'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const L=require('../calendar.js');
L.setData(require('../data.js'));
const app=fs.readFileSync(path.join(__dirname,'../app.js'),'utf8');
const bibleIndex=fs.readFileSync(path.join(__dirname,'../oor.js'),'utf8');
const texts=require('../oortext.json');
const worksheet=require('../docs/roman-liturgical-day-parity-2027-01-11.json');
const options={epiphany:'sunday',ascension:'sunday',corpus:'sunday',ladyDayTransfer:true};
const d=L.D(2027,1,11);
const sandbox={self:{}};
vm.runInNewContext(bibleIndex,sandbox,{filename:'oor.js'});
const start=app.indexOf('  function oorHTML(iso) {');
const end=app.indexOf('  function sarumMassHTML(',start);
assert.ok(start>=0&&end>start,'readings renderer exists');
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const render=new Function('self','L','S','P','esc','bible','displayTitle',
 app.slice(start,end)+'\nreturn oorHTML;')(
 sandbox.self,L,options,
 s=>L.D(+s.slice(0,4),+s.slice(5,7),+s.slice(8,10)),
 esc, ref=>'https://www.drbo.org/?q='+encodeURIComponent(ref),s=>s
);
const rows=Object.fromEntries(worksheet.sections.map(row=>[row.id,row]));

test('January 11 selects appointed Monday Week I Scripture and Clement of Rome',()=>{
 assert.equal(L.roman(d,options).title,'Monday of the 1st Week in Ordinary Time');
 assert.equal(L.oorKey(d,options),'o1-1');
 const chosen=sandbox.self.OOR['o1-1'];
 assert.equal(chosen.r,'Sir 1:1-18');
 assert.equal(chosen.q,'sirach 1:1-18');
 assert.equal(chosen.a,'Clement of Rome');
 assert.match(chosen.w,/Letter to the Corinthians 59, 2/);
 const history=texts[chosen.a+'|'+chosen.w];
 assert.ok(history,'historically translated appointed excerpt is indexed');
 assert.match(history.src,/Kirsopp Lake.*1912/);
 assert.match(history.p[0],/^\[59:2\]/);
 assert.match(history.p.at(-1),/\[61:3\]/);
});

test('actual Ora rendering is an explicitly incomplete readings index',()=>{
 const html=render('2027-01-11');
 assert.match(html,/class="muted office-readings-limits"/);
 assert.match(html,/Readings index only — not the complete Office of Readings/);
 assert.match(html,/Sir 1:1-18/);
 assert.match(html,/data-ref="sirach 1:1-18"/);
 assert.match(html,/Clement of Rome/);
 assert.match(html,/data-k="Clement of Rome\|Letter to the Corinthians 59, 2–60, 4; 61, 3"/);
 assert.match(html,/Full office \(Universalis\)/);
 assert.doesNotMatch(html,/<b>Psalm 6<\/b>|<b>Psalm 9A<\/b>|class="psalmody"|<b>First responsory<\/b>|<b>Second responsory<\/b>/i,
  'do not mistake unrendered full Office material for completed content');
});

test('three measured gaps are recorded without falsely certifying translation fidelity',()=>{
 for(const id of ['oor.psalmody','oor.reading-one','oor.reading-two']){
  const row=rows[id];
  assert.ok(row,'the worksheet includes '+id);
  assert.equal(row.oraCompared,true,id);
  assert.equal(row.textCompared,false,id);
  assert.equal(row.comparison,'missing-content',id);
  assert.match(row.sourceUrl,/divineoffice\.org\/ord-w01-mon-or/);
  assert.ok(row.note.length>180,'document actual rendered gap for '+id);
 }
 assert.equal(worksheet.sections.filter(x=>x.oraCompared).length,24,
  'Daytime audit adds three bounded missing-content records without changing Office of Readings content');
 assert.equal(worksheet.sections.filter(x=>x.textCompared).length,0);
});
