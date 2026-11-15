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
 const melkite={...sample,church:'melkite',source:'https://melkite.org/liturgical-resources',typicon:'November-2026.docx'};
 assert.deepEqual(D.compose(sections,melkite,{...context,church:'melkite',id:'melkite-chrysostom'}).placed,
  ['troparia','prokeimenon','alleluia','communion']);
 assert.deepEqual(D.compose(sections,melkite,{...context,church:'melkite',id:'melkite-chrysostom',iso:'2026-12-01'}).placed,[]);
});

test('reject improperly formatted or mixed-script source lines',()=>{
 const bad={...sample,groups:{troparia:['ВСІ: Не зараз'],alleluia:['Fictional verse.']}};
 assert.deepEqual(D.compose(sections,bad,context).placed,['alleluia']);
 assert.deepEqual(D.compose(sections,bad,context).remaining,['alleluia'].filter(()=>false));
});
