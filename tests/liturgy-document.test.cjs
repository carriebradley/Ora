const assert=require('node:assert/strict');
const test=require('node:test');
const D=require('../liturgy-document.js');

const sections=[
 {heading:'Liturgy of the Word',lines:[
  'PRIEST: Blessed is the Kingdom.','Little Entrance',
  'DEACON: Let us worship.','Trisagion','ALL: Holy God, Holy Mighty.',
  'Epistle','The Epistle may be read in the Readings tab.',
  'Gospel','The Gospel may be read in the Readings tab.',
  'Liturgy of the Eucharist','One is Holy',
  'Holy Communion','ALL: Receive the Body of Christ.','Dismissal'
 ]}
];
const sample={
 church:'ukrainian',source:'https://eeparchy.com/calendar/2026-11-15',
 groups:{
  troparia:['Troparion, Tone 8: Fictional hymn from the calendar.'],
  prokeimenon:['Prokeimenon, Tone 8','Fictional psalm response.'],
  alleluia:['Alleluia, Tone 8','Fictional Alleluia verse.'],
  communion:['Fictional appointed Communion hymn.']
 }
};
const context={church:'ukrainian',iso:'2026-11-15',id:'chrysostom'};
const joined=result=>result.sections.map(part=>[part.heading,...part.lines].filter(Boolean).join(' / ')).join('\n');

test('document module loads dated records and normalizes prayer typography',()=>{
 assert.equal(typeof D.loadRecord,'function');
 assert.equal(D.displayLine('PROKIMENON: (Tone 8)'), 'Prokeimenon: (Tone 8)');
 assert.equal(D.displayLine('ALLELUIA: (Tone 1)'), 'Alleluia: (Tone 1)');
 assert.equal(D.displayLine('The angels* give thanks * to God.'),'The angels give thanks to God.');
});

test('a genuinely empty printed hymn placeholder can receive dated words without duplicate headings',()=>{
 const placeholder=[{heading:'Liturgy of the Word',lines:[
  'Little Entrance','Troparia and Kontakia','Trisagion','Epistle','Gospel']}];
 const result=D.compose(placeholder,sample,context);
 assert.ok(result.placed.includes('troparia'));
 const phrase=joined(result);
 assert.equal((phrase.match(/Troparia and Kontakia/g)||[]).length,1);
 assert.ok(phrase.indexOf('Troparion, Tone 8')>phrase.indexOf('Troparia and Kontakia'));
 assert.ok(phrase.indexOf('Trisagion')>phrase.indexOf('Troparion, Tone 8'));
 assert.equal(JSON.stringify(placeholder[0].lines),
  JSON.stringify(['Little Entrance','Troparia and Kontakia','Trisagion','Epistle','Gospel']));
});

test('compose inserts date-specific hymns in their established positions without mutating ordinary prayers',()=>{
 const old=JSON.stringify(sections),result=D.compose(sections,sample,context);
 assert.deepEqual(result.placed,['troparia','prokeimenon','alleluia','communion']);
 assert.deepEqual(result.remaining,[]);
 assert.equal(JSON.stringify(sections),old,'do not mutate device-local book');
 const text=joined(result);
 const order=['Little Entrance','Troparion, Tone 8','Trisagion','Prokeimenon, Tone 8',
  'Epistle','Alleluia, Tone 8','Gospel','One is Holy','Fictional appointed Communion hymn','Holy Communion'];
 let prev=-1;
 for(const value of order){const next=text.indexOf(value);assert.ok(next>prev,'prayer order: '+value);prev=next;}
 assert.equal((text.match(/Blessed is the Kingdom/g)||[]).length,1);
});

test('missing or ambiguous boundaries leave the dated text separate, never guessed',()=>{
 const missing=[{heading:'Book',lines:['Opening Blessing','Great Litany','Dismissal']}];
 const outcome=D.compose(missing,sample,context);
 assert.deepEqual(outcome.placed,[]);
 assert.deepEqual(outcome.remaining,['troparia','prokeimenon','alleluia','communion']);
 assert.deepEqual(outcome.sections,missing);
 const repeated=[{heading:'Book',lines:['Little Entrance','Little Entrance','Trisagion']}];
 assert.equal(D.compose(repeated,sample,context).placed.includes('troparia'),false);
});

test('printed troparia outside the insertion interval are never duplicated',()=>{
 const record=require('../melkite-propers-2026.json').days['2026-11-15'];
 const context={church:'melkite',iso:'2026-11-15',id:'melkite-chrysostom'};
 for(const printed of [
  'PRIEST: Troparion of the Resurrection (Tone 8): Existing appointed hymn.',
  'CHOIR: Kontakion, Tone 8: Existing appointed hymn.',
  'Troparia and Kontakia'
 ]){
  for(const side of ['before','after']){
   const fixed=[
    'PRIEST: Blessed is the Kingdom.',
    ...(side==='before'?[printed]:[]),
    'Little Entrance','The Trisagion Hymn','ALL: Holy God, Holy Mighty One.',
    'Epistle','The Holy Gospel',
    ...(side==='after'?[printed]:[]),
    'One is Holy','Holy Communion'
   ];
   const book=[{heading:'Liturgy of the Word',lines:fixed}];
   const result=D.compose(book,record,context);
   assert.equal(result.placed.includes('troparia'),false,printed+' / '+side);
   assert.equal(result.remaining.includes('troparia'),true,'withheld dated hymn remains accessible');
   assert.deepEqual(result.placed,['prokeimenon','alleluia'],
    'independent hymn categories can still be safely positioned');
   assert.deepEqual(result.sections.filter(s=>!s.dailyProper).flatMap(s=>s.lines),
    fixed,'original prayers and printed hymns must not change');
  }
 }
});

test('a book already containing its own troparia does not duplicate them',()=>{
 const original=[{heading:'Book',lines:['Little Entrance','Troparia and Kontakia','ALL: Existing words.','Trisagion']}];
 const result=D.compose(original,sample,context);
 assert.ok(!result.placed.includes('troparia'));
 assert.equal((joined(result).match(/Existing words/g)||[]).length,1);
});

test('never combine Ukrainian and Melkite editions, years or seasonal booklets',()=>{
 assert.deepEqual(D.compose(sections,sample,{...context,church:'melkite'}).placed,[]);
 assert.deepEqual(D.compose(sections,sample,{...context,iso:'2026-11-22'}).placed,[]);
 assert.deepEqual(D.compose(sections,sample,{...context,seasonal:true}).placed,[]);
 assert.deepEqual(D.compose(sections,sample,{...context,id:'basil'}).placed,[]);
 const melkite={...sample,church:'melkite',iso:'2026-11-15',source:'https://melkite.org/liturgical-resources',typicon:'November-2026.docx'};
 assert.deepEqual(D.compose(sections,melkite,{...context,church:'melkite',id:'melkite-chrysostom'}).placed,
  ['troparia','prokeimenon','alleluia','communion']);
 assert.deepEqual(D.compose(sections,melkite,{...context,church:'melkite',id:'melkite-chrysostom',iso:'2026-12-01'}).placed,[]);
 assert.deepEqual(D.compose(sections,melkite,{...context,church:'melkite',id:'melkite-chrysostom',iso:'2026-11-16'}).placed,[],
  'a valid November typicon source URL cannot authorize hymns for another date');
});

test('reject improperly formatted or mixed-script source lines',()=>{
 const bad={...sample,groups:{troparia:['ВСІ: Не зараз'],alleluia:['Fictional verse.']}};
 assert.deepEqual(D.compose(sections,bad,context).placed,['alleluia']);
 assert.deepEqual(D.compose(sections,bad,context).remaining,['alleluia'].filter(()=>false));
});


test('tone-labelled existing troparia and kondakia are never duplicated',()=>{
 for(const printed of [
  'Troparion, Tone 8: Existing resurrection hymn.',
  'Troparion of the Resurrection (Tone 8): Existing hymn.',
  'ALL: Troparion of the Saint (Tone 4): Existing hymn.',
  'Kondakion Presentation of the Virgin (Tone 4): Existing hymn.',
  'CHOIR: Kontakion, Tone 8: Existing hymn.'
 ]){
  const book=[{heading:'Book',lines:['Little Entrance',printed,'Trisagion','Epistle','Gospel']}];
  const result=D.compose(book,sample,context);
  assert.equal(result.placed.includes('troparia'),false,printed);
  assert.equal((joined(result).match(/Existing (?:resurrection )?hymn/g)||[]).length,1);
  assert.ok(result.remaining.includes('troparia'));
 }
});

test('Melkite dated hymns display without known import punctuation artifacts',()=>{
 assert.equal(D.displayLine('Troparion of the Resurrection (Tone 8)): Glory to You.!'),
  'Troparion of the Resurrection (Tone 8): Glory to You!');
 assert.equal(D.displayLine('Kondakion: God is merciful. Alleluia!'),
  'Kondakion: God is merciful. Alleluia!');
 assert.equal(D.displayLine('Lord, hear me. Next prayer!'),
  'Lord, hear me. Next prayer!');
});


test('Newton edition identity survives proper insertion and fallbacks',()=>{
 const melkite={
  ...sample,church:'melkite',iso:'2026-11-15',
  source:'https://melkite.org/liturgical-resources',typicon:'November-2026.docx'
 };
 const ctx={church:'melkite',iso:'2026-11-15',id:'melkite-chrysostom'};
 const saved=sections.map(part=>({...part,lines:[...part.lines]}));
 saved.newton2009=true;
 const before=JSON.stringify(saved);
 const placed=D.compose(saved,melkite,ctx);
 assert.ok(placed.placed.length>0,'exercise actual dated proper insertion');
 assert.equal(placed.sections.newton2009,true,
  'inserted hymns must not reveal Newton annual reference tables');
 assert.equal(saved.newton2009,true);
 assert.equal(JSON.stringify(saved),before,'saved prayer lines must not be modified');
 assert.equal(D.compose(saved,{...melkite,groups:{}},ctx).sections.newton2009,true,
  'no-placement fallback retains the edition');
 assert.equal(D.compose(saved,melkite,{...ctx,iso:'2026-12-01'}).sections.newton2009,true,
  'wrong-date fallback retains the edition');
 assert.equal(D.compose(saved,sample,context).sections.newton2009,true,
  'unrelated proper records cannot erase the private source identity');
 assert.equal(D.compose(sections,melkite,ctx).sections.newton2009,undefined,
  'an unrecognized source must never be marked as the Newton edition');
});


test('all Newton 2026 hymns preserve the source Trisagion, litanies and Eucharistic prayer order',()=>{
 const data=require('../melkite-propers-2026.json');
 const saved=[
  {heading:'Liturgy of the Word',lines:[
   'PRIEST: Blessed is the Kingdom of the Father.','ALL: Amen.',
   'Great Litany','DEACON: In peace let us pray to the Lord.',
   'ALL: Lord, have mercy.','ALL: Lord, have mercy.',
   'Little Entrance','Trisagion Hymn',
   'ALL: Holy God, Holy Mighty One, Holy Immortal One, have mercy on us.',
   'PRIEST: O Holy of Holies, our only holy God.','ALL: Amen.',
   'Epistle','DEACON: Let us attend.','Gospel','ALL: Glory to You, O Lord.'
  ]},
  {heading:'Liturgy of the Eucharist',lines:[
   'Great Entrance','DEACON: Let us complete our prayer.',
   'ALL: Lord, have mercy.','Anaphora',
   'PRIEST: Take, eat: this is My Body.','ALL: Amen.',
   'One is Holy','Holy Communion','ALL: Receive the Body of Christ.','Dismissal'
  ]}
 ];
 const originalLines=saved.flatMap(part=>[part.heading,...part.lines]);
 for(const [iso,record] of Object.entries(data.days)){
  const before=JSON.stringify(saved);
  const result=D.compose(saved,record,{church:'melkite',iso,id:'melkite-chrysostom'});
  assert.equal(JSON.stringify(saved),before,iso+' mutated the source');
  assert.deepEqual(result.placed,Object.keys(record.groups),
   iso+' failed to place its unambiguous appointed hymns');
  assert.deepEqual(result.sections.filter(s=>!s.dailyProper)
   .flatMap(s=>[s.heading,...s.lines].filter(Boolean)),originalLines,
   iso+' changed the source prayers, headings, repeats or their order');
  const out=joined(result);
  for(const prayer of [
   'In peace let us pray to the Lord.','O Holy of Holies, our only holy God.',
   'Take, eat: this is My Body.','Receive the Body of Christ.'
  ])assert.equal(out.split(prayer).length-1,1,iso+' lost or duplicated '+prayer);
  assert.equal(out.split('ALL: Lord, have mercy.').length-1,3,
   iso+' changed a repeated litany response');
  assert.ok(out.indexOf('Trisagion Hymn')<out.indexOf('Epistle'),iso+' reversed Trisagion/Epistle');
  assert.ok(out.indexOf('Anaphora')<out.indexOf('Holy Communion'),iso+' reversed Anaphora/Communion');
 }
});

test('a reversed major liturgical heading safely suspends dated hymn placement',()=>{
 const record={
  ...sample,church:'melkite',iso:'2026-11-15',
  source:'https://melkite.org/liturgical-resources',typicon:'November-2026.docx'
 };
 const ctx={church:'melkite',id:'melkite-chrysostom',iso:'2026-11-15'};
 for(const lines of [
  ['Little Entrance','Liturgy of the Eucharist','Trisagion','Epistle','Gospel','One is Holy','Holy Communion'],
  ['Little Entrance','Gospel','Trisagion','Epistle','One is Holy','Holy Communion'],
  ['Little Entrance','Trisagion','Epistle','Anaphora','Gospel','One is Holy','Holy Communion'],
  ['Little Entrance','Trisagion','Epistle','Gospel','Holy Communion','One is Holy']
 ]){
  const book=[{heading:'Liturgy of the Word',lines}];
  const outcome=D.compose(book,record,ctx);
  assert.deepEqual(outcome.placed,[],lines.join(' / '));
  assert.deepEqual(outcome.remaining,Object.keys(record.groups));
  assert.deepEqual(outcome.sections,book,'keep private source unchanged');
 }
});


test('all 63 Newton hymn dates place at printed Trisagion and Gospel titles without changing prayer text',()=>{
 const dataset=require('../melkite-propers-2026.json');
 const book=[{heading:'Liturgy of the Word',lines:[
  'PRIEST: Blessed is the Kingdom.','ALL: Lord, have mercy.',
  'Little Entrance','The Trisagion Hymn',
  'ALL: Holy God, Holy Mighty One, Holy Immortal One, have mercy on us.',
  'Epistle','The Holy Gospel','Liturgy of the Eucharist',
  'One is Holy','Holy Communion'
 ]}];
 const original=book.flatMap(s=>[s.heading,...s.lines]);
 for(const [iso,record] of Object.entries(dataset.days)){
  const result=D.compose(book,record,{church:'melkite',id:'melkite-chrysostom',iso});
  assert.deepEqual(result.placed,Object.keys(record.groups),iso+' did not place all its unambiguous groups');
  assert.deepEqual(result.sections.filter(s=>!s.dailyProper)
   .flatMap(s=>[s.heading,...s.lines].filter(Boolean)),original,
   iso+' changed the printed title or source prayer wording');
  assert.deepEqual(result.remaining,[],iso+' left placeable hymns separate');
  const txt=joined(result);
  assert.ok(txt.indexOf('Troparion')<txt.indexOf('The Trisagion Hymn'),iso+' troparia inserted too late');
  assert.ok(txt.indexOf('The Trisagion Hymn')<txt.indexOf('The Holy Gospel'),iso+' headings reversed');
 }
});

test('printed and shortened duplicate title anchors are treated as ambiguous',()=>{
 const dataset=require('../melkite-propers-2026.json');
 const record=dataset.days['2026-11-15'];
 const ctx={church:'melkite',id:'melkite-chrysostom',iso:'2026-11-15'};
 const duplicates=[{heading:'Liturgy of the Word',lines:[
  'Little Entrance','Trisagion Hymn','The Trisagion Hymn',
  'Epistle','The Holy Gospel','Gospel','One is Holy','Holy Communion'
 ]}];
 const outcome=D.compose(duplicates,record,ctx);
 assert.deepEqual(outcome.placed,[]);
 assert.deepEqual(outcome.sections,duplicates);
 const sectionHead=[{heading:'The Trisagion Hymn',lines:['Epistle','The Holy Gospel']}];
 assert.equal(D.compose(sectionHead,record,ctx).placed.includes('prokeimenon'),true);
});

test('Trisagion prayers and longer Gospel descriptions never authorize an inferred hymn position',()=>{
 const record=require('../melkite-propers-2026.json').days['2026-11-15'];
 const ctx={church:'melkite',id:'melkite-chrysostom',iso:'2026-11-15'};
 for(const title of [
  'The Trisagion Prayer of St. John Chrysostom',
  'The Trisagion Prayer of St. Basil the Great',
  'The Trisagion Hymn and Its History'
 ]){
  const book=[{heading:'Liturgy of the Word',lines:['Little Entrance',title,'Epistle','The Holy Gospel']}];
  const output=D.compose(book,record,ctx);
  assert.equal(output.placed.includes('troparia'),false,title);
  assert.equal(output.placed.includes('prokeimenon'),false,title);
 }
 const book=[{heading:'Liturgy of the Word',lines:[
  'Little Entrance','The Trisagion Hymn','Epistle','The Holy Gospel according to Luke'
 ]}];
 assert.equal(D.compose(book,record,ctx).placed.includes('alleluia'),false);
});

test('printed The Holy Gospel heading participates in the structural order check',()=>{
 const record=require('../melkite-propers-2026.json').days['2026-11-15'];
 const ctx={church:'melkite',id:'melkite-chrysostom',iso:'2026-11-15'};
 const book=[{heading:'Liturgy of the Word',lines:[
  'Little Entrance','The Holy Gospel','The Trisagion Hymn',
  'Epistle','One is Holy','Holy Communion'
 ]}];
 const result=D.compose(book,record,ctx);
 assert.deepEqual(result.placed,[]);
 assert.deepEqual(result.remaining,Object.keys(record.groups));
 assert.deepEqual(result.sections,book);
});


test('all Newton dates with Trisagion alternatives keep those prayers intact',()=>{
 const dataset=require('../melkite-propers-2026.json');
 const book=[{heading:'Liturgy of the Word',lines:[
  'PRIEST: Blessed is the Kingdom.','Little Entrance',
  'The Trisagion Prayer of St. John Chrysostom',
  'PRIEST: O Holy of Holies, our only holy God.','ALL: Amen.',
  'The Trisagion Prayer of St. Basil the Great',
  'PRIEST: God, the Holy, who rest among the saints.','ALL: Amen.',
  'The Trisagion Hymn','ALL: Holy God, Holy Mighty One.',
  'Epistle','The Holy Gospel','One is Holy','Holy Communion'
 ]}];
 const original=book.flatMap(s=>[s.heading,...s.lines]);
 for(const [iso,record] of Object.entries(dataset.days)){
  const result=D.compose(book,record,{church:'melkite',iso,id:'melkite-chrysostom'});
  assert.equal(result.placed.includes('troparia'),false,iso+' cannot split Trisagion prayers');
  if(record.groups.troparia)assert.ok(result.remaining.includes('troparia'),iso+' must keep withheld troparia available');
  for(const category of ['prokeimenon','alleluia']){
   if(record.groups[category])assert.ok(result.placed.includes(category),iso+' should still place safe '+category);
  }
  assert.deepEqual(result.sections.filter(s=>!s.dailyProper)
   .flatMap(s=>[s.heading,...s.lines].filter(Boolean)),original,
   iso+' changed fixed prayer words or their order');
 }
});

test('Alleluia placement never interrupts the Prayer Before the Gospel',()=>{
 const record=require('../melkite-propers-2026.json').days['2026-11-15'];
 const context={church:'melkite',iso:'2026-11-15',id:'melkite-chrysostom'};
 const book=[{heading:'Liturgy of the Word',lines:[
  'Little Entrance','The Trisagion Hymn','Epistle',
  'Prayer Before the Gospel','PRIEST: Shine in our hearts, O Master.',
  'ALL: Amen.','The Holy Gospel','One is Holy','Holy Communion'
 ]}];
 const result=D.compose(book,record,context);
 assert.ok(result.placed.includes('troparia'));
 assert.ok(result.placed.includes('prokeimenon'));
 assert.equal(result.placed.includes('alleluia'),false);
 assert.ok(result.remaining.includes('alleluia'));
 assert.deepEqual(result.sections.filter(s=>!s.dailyProper)
  .flatMap(s=>[s.heading,...s.lines].filter(Boolean)),
  book.flatMap(s=>[s.heading,...s.lines]));
});

test('unfinished speaker cues cannot be separated from the following heading',()=>{
 const record=require('../melkite-propers-2026.json').days['2026-11-15'];
 const context={church:'melkite',iso:'2026-11-15',id:'melkite-chrysostom'};
 for(const cue of ['PRIEST:','DEACON:','The priest says:','The deacon proclaims:']){
  const book=[{heading:'Liturgy of the Word',lines:[
   'Little Entrance',cue,'The Trisagion Hymn','Epistle',
   'The Holy Gospel','One is Holy','Holy Communion'
  ]}];
  const result=D.compose(book,record,context);
  assert.equal(result.placed.includes('troparia'),false,cue);
  assert.ok(result.remaining.includes('troparia'),cue);
  assert.ok(result.placed.includes('prokeimenon'),cue+' cannot block a different safe slot');
  assert.deepEqual(result.sections.filter(s=>!s.dailyProper)
   .flatMap(s=>[s.heading,...s.lines].filter(Boolean)),
   book.flatMap(s=>[s.heading,...s.lines]));
 }
});

test('ordinary litany before the Little Entrance remains untouched and allows safe hymns',()=>{
 const record=require('../melkite-propers-2026.json').days['2026-11-15'];
 const context={church:'melkite',iso:'2026-11-15',id:'melkite-chrysostom'};
 const book=[{heading:'Liturgy of the Word',lines:[
  'PRIEST: Blessed is the Kingdom.','Great Litany',
  'DEACON: In peace let us pray to the Lord.','ALL: Lord, have mercy.',
  'ALL: Lord, have mercy.','Little Entrance','The Trisagion Hymn',
  'ALL: Holy God, Holy Mighty One.','Epistle','The Holy Gospel',
  'Liturgy of the Eucharist','Anaphora','One is Holy','Holy Communion'
 ]}];
 const result=D.compose(book,record,context);
 assert.deepEqual(result.placed,Object.keys(record.groups));
 const rendered=result.sections.map(s=>[s.heading,...s.lines].filter(Boolean).join(' / ')).join('\n');
 assert.equal(rendered.split('ALL: Lord, have mercy.').length-1,2);
 assert.ok(rendered.indexOf('Great Litany')<rendered.indexOf('Little Entrance'));
 assert.ok(rendered.indexOf('Anaphora')<rendered.indexOf('Holy Communion'));
});

test('Melkite composition preserves fixed prayers byte-for-byte across all dated hymn slots',()=>{
 const record=require('../melkite-propers-2026.json').days['2026-11-15'];
 const context={church:'melkite',iso:'2026-11-15',id:'melkite-chrysostom'};
 const original=[{heading:'Liturgy of the Word',lines:[
  'PRIEST: Blessed is the Kingdom of the Father and of the Son and of the Holy Spirit.',
  'Great Litany','DEACON: In peace let us pray to the Lord.',
  'ALL: Lord, have mercy.','ALL: Lord, have mercy.',
  'Little Entrance','The Trisagion Hymn','ALL: Holy God, Holy Mighty One.',
  'Epistle','The Holy Gospel','Liturgy of the Eucharist',
  'Anaphora','PRIEST: Remember, O Lord, those who bring offerings.',
  'One is Holy','Holy Communion','ALL: Receive the Body of Christ.','Dismissal'
 ]}];
 const before=JSON.stringify(original);
 const result=D.compose(original,record,context);
 assert.equal(JSON.stringify(original),before,'source sections must not be mutated');
 const fixed=original.flatMap(section=>section.lines);
 const after=result.sections.filter(section=>!section.dailyProper).flatMap(section=>section.lines);
 assert.deepEqual(after,fixed,'dated hymns must never remove, duplicate, rewrite or reorder fixed prayer lines');
 assert.deepEqual(result.placed,Object.keys(record.groups));
});

test('Melkite multi-section service retains every minister and repeated prayer through dated composition',()=>{
 const record=require('../melkite-propers-2026.json').days['2026-11-15'];
 const context={church:'melkite',iso:'2026-11-15',id:'melkite-chrysostom'};
 const original=[
  {heading:'Liturgy of the Word',lines:[
   'PRIEST: Blessed is the Kingdom of the Father and of the Son and of the Holy Spirit.',
   'Great Litany','DEACON: In peace let us pray to the Lord.',
   'ALL: Lord, have mercy.','ALL: Lord, have mercy.',
   'Little Entrance','The Trisagion Hymn','ALL: Holy God, Holy Mighty One.',
   'Epistle','The Holy Gospel'
  ]},
  {heading:'Liturgy of the Eucharist',lines:[
   'Anaphora','PRIEST: Remember, O Lord, those who bring offerings.',
   'DEACON: Let us stand well.','ALL: Lord, have mercy.',
   'One is Holy','Holy Communion','ALL: Receive the Body of Christ.','Dismissal'
  ]}
 ];
 const snapshot=JSON.stringify(original);
 const result=D.compose(original,record,context);
 assert.equal(JSON.stringify(original),snapshot,'composition must not mutate either source section');
 const fixedBefore=original.flatMap(section=>section.lines);
 const fixedAfter=result.sections.filter(section=>!section.dailyProper).flatMap(section=>section.lines);
 assert.deepEqual(fixedAfter,fixedBefore,'all fixed prayers and role labels must survive in original order');
 assert.equal(fixedAfter.filter(line=>line==='ALL: Lord, have mercy.').length,3);
 assert.deepEqual(result.placed,Object.keys(record.groups));
 assert.ok(result.sections.findIndex(section=>section.heading==='Liturgy of the Eucharist')>
  result.sections.findIndex(section=>section.heading==='Liturgy of the Word'));
});
