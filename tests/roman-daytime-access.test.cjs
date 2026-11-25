'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const app=fs.readFileSync(path.join(__dirname,'../app.js'),'utf8');
const fixture=require('../docs/roman-liturgical-day-parity-2027-01-11.json');
const start=app.indexOf('  function romanDaytimeLinksHTML(iso) {');
const end=app.indexOf('  function viewPray() {',start);
assert.ok(start>=0&&end>start,'source-linked Daytime helper must precede Roman Prayer view');
const fragment=app.slice(start,end);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const html=(date,ascension)=>new Function('S','esc',fragment+'\nreturn romanDaytimeLinksHTML;')({ascension},esc)(date);

test('Roman Daytime source links use selected date and Ascension province setting',()=>{
 for(const [date,ascension,region] of [
  ['2027-01-11','sunday','usa'],['2027-05-06','thursday','usa.boston'],
  ['2027-05-09','sunday','usa'],['2026-11-25','thursday','usa.boston']
 ]){
  const out=html(date,ascension),stamp=date.replace(/-/g,'');
  for(const part of ['terce','sext','none'])assert.ok(out.includes('https://universalis.com/'+region+'/'+stamp+'/'+part+'.htm'),date+' '+part);
  assert.match(out,/target="_blank" rel="noopener noreferrer"/);
  assert.match(out,/requires internet/);
  assert.match(out,/does not yet contain the complete Daytime Hours/);
  assert.doesNotMatch(out,/data-tr="dra"|class="roman-office-credit"/,'no invented official prayer text');
 }
});
test('Daytime access is a collapsed Roman-only companion, not a substitute Hour',()=>{
 assert.match(app,/if \(rite === 'roman'\) h \+= romanDaytimeLinksHTML\(st\.date\)/);
 assert.match(fragment,/details class="roman-daytime-access"/);
 assert.doesNotMatch(fragment,/\<details[^>]*open\b/);
 assert.match(fragment,/complementary psalms/);
 assert.match(fragment,/GILH 77–83/);
});
test('first-day worksheet records still missing internal daytime texts',()=>{
 for(const id of ['daytime.midmorning','daytime.midday','daytime.midafternoon']){
  const row=fixture.sections.find(x=>x.id===id);
  assert.ok(row,id);
  assert.equal(row.oraCompared,true);
  assert.equal(row.textCompared,false);
  assert.equal(row.comparison,'missing-content');
  assert.match(row.sourceUrl,/catholicculture\.org/);
 }
});
