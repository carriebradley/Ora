'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const D=require('../liturgy-document.js');
const E=require('../edmonton-2026.js');
const M=require('../melkite.js');
const S=require('../liturgy-schedule.js');
const ukrainian=require('../ukrainian-propers.json');
const melkite=require('../melkite-propers-2026.json');

const days2026=Array.from({length:365},(_,i)=>
 new Date(Date.UTC(2026,0,1+i)).toISOString().slice(0,10));
const categories=new Set(['troparia','prokeimenon','alleluia','communion']);
const book=[
 {heading:'Liturgy of the Word',lines:['PRIEST: Blessed is the Kingdom.','Little Entrance',
  'Trisagion','Epistle','Gospel','Liturgy of the Eucharist',
  'One is Holy','Holy Communion','ALL: Amen.']}
];
const text=sections=>sections.map(x=>[x.heading,...x.lines].filter(Boolean).join('\n')).join('\n');

test('all dated Ukrainian and Melkite hymns match an available church-specific source',()=>{
 assert.equal(ukrainian.schema,1);
 assert.equal(melkite.schema,1);
 assert.ok(Object.keys(ukrainian.days).length>=72,'Unexpectedly lost Ukrainian dated hymns');
 assert.equal(Object.keys(melkite.coverage).length,12,'Expected each Newton monthly typicon');
 assert.ok(Object.keys(melkite.days).length>=63,'Unexpectedly lost year-round Melkite dated hymns');
 assert.deepEqual([...S.monthlyChrysostomDates].sort(),Object.keys(melkite.days).sort(),
  'Verified appointment list must match the exact dated typikon import');
 assert.ok(!melkite.days['2026-01-30']&&!melkite.days['2026-12-24'],'quarantined dates cannot be appointed');
 assert.equal(melkite.coverage.January.quarantined[0].date,'2026-01-30');
 assert.equal(melkite.coverage.December.quarantined[0].date,'2026-12-24');
 const errors=[];
 for(const [church,dataset] of [['ukrainian',ukrainian],['melkite',melkite]]){
  const id=church==='ukrainian'?'chrysostom':'melkite-chrysostom';
  for(const [iso,record] of Object.entries(dataset.days)){
   assert.match(iso,/^2026-\d{2}-\d{2}$/);
   assert.equal(new Date(iso+'T12:00:00Z').toISOString().slice(0,10),iso);
   assert.ok(D.validRecord(record,{church,iso,id}),church+' '+iso+' invalid source identity');
   if(church==='ukrainian'){
    assert.ok(E.days[iso],iso+' has dated hymns but no verified Edmonton entry');
    assert.equal(E.withheld[iso],undefined,iso+' is a quarantined Edmonton date');
    assert.equal(record.source,E.days[iso].source,iso+' does not match Edmonton URL');
   }else{
    assert.equal(record.iso,iso,iso+' lacks exact Melkite day identity');
    assert.ok(M.entry(iso),iso+' absent from Newton annual calendar');
    const month=['January','February','March','April','May','June',
     'July','August','September','October','November','December'][Number(iso.slice(5,7))-1];
    assert.equal(record.typicon,month+'-2026.docx',iso+' must match its source month');
    assert.equal(S.service(iso,'melkite').id,'chrysostom',iso+' requires a different service');
    if(M.typicon(iso))assert.equal(M.typicon(iso).liturgy,'chrysostom',iso+' conflicts with verified monthly service');
   }
   const groups=Object.entries(record.groups||{});
   assert.ok(groups.length,'No appointed hymns: '+iso);
   for(const [group,lines] of groups){
    assert.ok(categories.has(group),iso+' unknown group '+group);
    assert.ok(Array.isArray(lines)&&lines.length>0&&lines.length<=40,iso+' invalid hymn length');
    for(const line of lines){
     assert.equal(typeof line,'string');
     assert.ok(line.trim().length>0&&line.length<=1200,iso+' empty or overlong hymn');
     assert.doesNotMatch(line,/[\u0400-\u052f\u0600-\u06ff]/u,iso+' non-English text');
     assert.doesNotMatch(D.displayLine(line),/\*|(?<![A-Za-z])god(?![A-Za-z])/,
      iso+' displayed text contains a chant marker or lowercase God');
    }
   }
   // Run the same compositor used in the app against every dated source
   // without rewriting the original service or inventing absent groups.
   const unchanged=JSON.stringify(book);
   const result=D.compose(book,record,{church,iso,id});
   assert.equal(JSON.stringify(book),unchanged,'Source ordinary was mutated');
   assert.deepEqual(new Set(result.placed),new Set(groups.map(([group])=>group)),
    iso+' failed to place an unambiguous dated group');
   assert.deepEqual(result.remaining,[],iso+' incorrectly left a placeable group separate');
   assert.equal((text(result.sections).match(/Blessed is the Kingdom/g)||[]).length,1);
   const otherChurch=church==='ukrainian'?'melkite':'ukrainian';
   const wrong=D.compose(book,record,{church:otherChurch,iso,id:otherChurch==='ukrainian'?'chrysostom':'melkite-chrysostom'});
   assert.deepEqual(wrong.placed,[],iso+' leaked a hymn into another church');
   const nextDay=new Date(Date.parse(iso+'T12:00:00Z')+86400000).toISOString().slice(0,10);
   assert.deepEqual(D.compose(book,record,{church,iso:nextDay,id}).placed,[],
    iso+' leaked its hymns onto another day');
  }
 }
 assert.deepEqual(errors,[]);
});

test('2026 service selector never silently claims a verified appointment without a dated typicon',()=>{
 const valid=new Set(['chrysostom','basil','presanctified','none','unknown']);
 for(const iso of days2026){
  const ua=S.service(iso,'ukrainian'),me=S.service(iso,'melkite');
  for(const [church,s] of [['ukrainian',ua],['melkite',me]]){
   assert.ok(valid.has(s.id),church+' '+iso+' unexpected service '+s.id);
   assert.equal(typeof s.title,'string');
   assert.ok(s.title.length>0);
   assert.equal(s.source,church==='ukrainian'?'https://eeparchy.com/calendar/'+iso:
    'https://melkite.org/liturgical-resources',church+' '+iso+' incorrect source');
   assert.ok(['calculated','verified','source-conflict'].includes(s.verification),
    church+' '+iso+' unclear verification state');
  }
  if(M.typicon(iso)){
   assert.equal(me.verification,'verified',iso+' typicon not respected');
   assert.equal(me.id,M.typicon(iso).liturgy,iso+' typicon service mismatched');
  }else if(S.monthlyChrysostomDates.includes(iso)){
   assert.equal(me.verification,'verified',iso+' dated Chrysostom heading ignored');
   assert.equal(me.id,'chrysostom');
  }else if(iso==='2026-12-24'){
   assert.equal(me.verification,'source-conflict','December typicon conflict must be disclosed');
   assert.equal(me.id,'basil','Newton Nativity book prescribes Vesperal Basil');
   assert.match(me.title,/Vesperal/);
   assert.ok(me.detailSource?.includes('The-Feast-of-the-Nativity'));
   assert.equal(melkite.days[iso],undefined,'conflicted dated hymns remain quarantined');
  }else if(['2026-04-02','2026-04-04'].includes(iso)){
   assert.equal(me.verification,'verified','Newton Holy Week service order appoints Vesperal Basil');
   assert.equal(me.id,'basil');
   assert.match(me.title,/Vesperal.*Basil/);
   assert.equal(me.detailSource,'https://melkite.org/faith/sunday-scriptures/behold-the-bridegroom-is-coming');
   assert.equal(melkite.days[iso],undefined,'no invented Holy Week dated hymn groups');
  }else assert.equal(me.verification,'calculated',iso+' claims unverified Melkite appointment');
  if(iso==='2026-12-24'){
   assert.equal(ua.id,'unknown');
   assert.equal(ua.verification,'source-conflict');
   assert.equal(ua.detailSource,'https://ugcc.ua/data/tserkovnyy-kalendar-ugkts-na-2026-rik-8059/');
   assert.match(ua.sourceDiscrepancy,/Edmonton.*UGCC 2026 national calendar/);
   assert.ok(ukrainian.days[iso],'retain original dated Edmonton hymn source for audit');
   assert.equal(ua.id,'unknown','the existing hymn record does not establish a Divine Liturgy appointment');
  }else if(['2026-04-02','2026-04-04'].includes(iso)){
   assert.equal(ua.id,'basil');
   assert.equal(ua.verification,'verified','Edmonton program confirms cathedral April 5 cycle');
   assert.equal(ua.detailSource,'https://eeparchy.com/Easter%20Program%20.pdf');
   assert.match(ua.sourceDiscrepancy,/April 12/);
  }else if(iso==='2026-04-01'){
   assert.equal(ua.id,'presanctified');
   assert.equal(ua.verification,'verified','Edmonton explicitly appoints Great Wednesday Presanctified Gifts');
  }else assert.equal(ua.verification,'calculated',iso+' claims unverified Ukrainian appointment');
 }
 assert.equal(S.service('2027-01-01','ukrainian').id,'unknown');
 assert.equal(S.service('2027-01-01','melkite').id,'unknown');
});

test('source conflicts and unappointed days stay outside the dated Liturgy view',()=>{
 const app=fs.readFileSync(require.resolve('../app.js'),'utf8');
 assert.match(app,/service\.verification!=='source-conflict'/);
 assert.match(app,/service\.id==='chrysostom'/);
 assert.equal(S.service('2026-04-03','ukrainian').id,'none');
 assert.equal(S.service('2026-12-24','ukrainian').verification,'source-conflict');
 // Edmonton's April 1 metadata contains both a generic "Divine Liturgy"
 // service label and a rubric saying it is not celebrated. Do not turn the
 // generic label into evidence of a Chrysostom Eucharistic appointment.
 assert.match(E.days['2026-04-01'].rubric,/Divine Liturgy is not celebrated/);
 assert.equal(S.service('2026-04-01','ukrainian').id,'presanctified');
 assert.equal(S.service('2026-04-01','ukrainian').verification,'verified');
 assert.match(S.service('2026-04-01','ukrainian').note,/Wednesday evening/);
});
