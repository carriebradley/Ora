const {test}=require('node:test'),assert=require('node:assert/strict'),F=require('../liturgical-format.js'),M=require('../roman-missal.js');
test('PDF headings and paragraphs survive tracked letters and physical line breaks',()=>{
 assert.deepEqual(F.combine(['L I T U R G Y O F T H E','E U C H A R I S T','PRIEST: Fixture opening','continued on this row.','ALL: Fixture response.']),['Liturgy of the Eucharist','PRIEST: Fixture opening continued on this row.','ALL: Fixture response.']);
 assert.equal(F.heading('Holy God'),false,'title case alone is not a heading');
 assert.deepEqual(F.combine([{text:'Fixture paragraph.',y:500,height:12,page:1},{text:'Next paragraph.',y:465,height:12,page:1}]),['Fixture paragraph.','Next paragraph.']);
 assert.equal(F.normalize('Fixture\u00ad words\u2002here'),'Fixture words here');
});
test('rubrics never consume unlabelled petitions or parenthesized responses',()=>{
 for(const s of ['For the peace of the world, fixture petition.','(Amen.)','Lord, fixture prayer.','ALL: The priest fixture quotation.'])assert.equal(F.instruction(s),false,s);
 for(const s of ['The priest bows.','After the entrance, the deacon continues.','(All stand.)','Instruction: Fixture direction.'])assert.equal(F.instruction(s),true,s);
 assert.deepEqual(F.role('DCN 2: Fixture petition.'),{kind:'deacon',name:'Deacon',words:'Fixture petition.'});
 assert.equal(F.role('Fixture prayer.'),null);
});
test('Roman source rubrics stay hidden, including an entirely instructional section',()=>{
 const part={blocks:[{tag:'p',kind:'instruction',text:'Fixture direction without a keyword.'}]};
 assert.deepEqual(M.prayers(part).blocks,[]);
 const full={blocks:[{tag:'p',text:'Fixture biography.'},{tag:'h4',text:'Collect'},{tag:'p',text:'Fixture daily prayer.'},{tag:'p',text:'A reading from the fixture book'},{tag:'p',text:'Fixture Scripture remains in Readings.'},{tag:'h4',text:'Prayer over the Offerings'},{tag:'p',text:'Fixture offerings.'}]};
 assert.deepEqual(M.propers(full).collect.map(b=>b.text),['Fixture daily prayer.']);
 assert.deepEqual(M.propers(full).offerings.map(b=>b.text),['Fixture offerings.']);
});
test('Roman fixed prayers prefer a unique general form and never guess a seasonal variant',()=>{
 const sections=[{title:'EUCHARISTIC PRAYER I (Christmas Octave)',blocks:[]},{title:'EUCHARISTIC PRAYER I (THE ROMAN CANON)',blocks:[]},{title:'Apostles’ Creed',blocks:[]}];
 assert.equal(M.fixed(sections,'1'),sections[1]);assert.equal(M.fixed(sections,'apostles'),sections[2]);
 assert.equal(M.fixed([sections[0],{title:'EUCHARISTIC PRAYER I (Epiphany)',blocks:[]}],'1'),null);
 assert.equal(M.fixed([sections[0]],'1'),null,'a lone seasonal variant is not a general form');
 assert.equal(M.fixed([sections[1],sections[1]],'1'),null);
});

test('Edmonton episcopal ceremonial directions are classified separately',()=>{
 for(const text of [
  'The first protopresbyter bows to the bishop and enters the sanctuary.',
  'Having received the blessing, the deacon incenses the altar.',
  'The bishop elevating the holy Bread, exclaims:',
  'Singing, crying, exclaiming and saying the triumphal hymn.'
 ])assert.equal(F.instruction(text),true,text);
 for(const prayer of ['BISHOP: Let us give thanks to the Lord.','ALL: Lord, have mercy.','For the peace from on high and for the salvation of our souls, let us pray to the Lord.'])
  assert.equal(F.instruction(prayer),false,prayer);
 assert.deepEqual(F.combine([{text:'BISHOP:',y:500,page:1},{text:'Fixture prayer spoken by the bishop.',y:471,page:1}]),['BISHOP: Fixture prayer spoken by the bishop.']);
 assert.deepEqual(F.combine(['THE END OF THE DIVINE LITURGY','OF ST. JOHN CHRYSOSTOM']),[]);
});

test('Melkite preparation rubrics and tracked headings are not spoken prayers',()=>{
 for(const line of ['When the time comes for celebrating the Divine Liturgy, the Priest and Deacon bow.',
  'Bowing his uncovered head, the Deacon says:', 'He kisses the Priest’s right hand.',
  'The following petitions may be replaced by special petitions.',
  'It is permitted to chant the three traditional Antiphons.'])
  assert.equal(F.instruction(line),true,line);
 for(const line of ['Blessed is our God at all times.', 'Let us pray to the Lord.', 'All: Lord, have mercy.'])
  assert.equal(F.instruction(line),false,line);
 assert.equal(F.normalize('T H E  L I T A N Y  O F  P E A C E'),'The Litany of Peace');
 assert.equal(F.normalize('T H E  O R D E R  O F  A N T I P H O N S'),'The Order of Antiphons');
 assert.equal(F.normalize('T H E  E K T E N E'),'The Ektene');
});

test('spoken prayer after a rubric ending in a colon remains readable',()=>{
 const lines=[
  'The Deacon censes the Holy Table saying:',
  'Being God, You were present in the tomb by Your body,',
  'and yet in Hades by Your soul, in Paradise with the thief.',
  'Deacon: In peace let us pray to the Lord.',
  'All: Lord, have mercy.'
 ];
 const blocks=F.combine(lines);
 assert.equal(blocks.length,4);
 assert.equal(F.instruction(blocks[0]),true);
 assert.equal(F.instruction(blocks[1]),false);
 assert.match(blocks[1],/^Being God, You were present/);
 assert.match(blocks[1],/Paradise with the thief/);
});

test('source labels preserve quiet priest prayers, people and joint clergy',()=>{
 assert.deepEqual(F.role('Priest (quietly): Fixture private prayer.'),{kind:'priest',name:'Priest',words:'Fixture private prayer.',cue:'quietly'});
 assert.deepEqual(F.role('The People: Fixture response.'),{kind:'all',name:'People',words:'Fixture response.'});
 assert.equal(F.role('Priest and Deacon: Fixture joint prayer.').kind,'clergy');
 assert.equal(F.speakerInstruction('The Deacon censes the table saying:').kind,'deacon');
 assert.equal(F.speakerInstruction('The Priest says:').kind,'priest');
 assert.equal(F.speakerInstruction('The priest bows.'),null);
});
test('parallel ordinary antiphons keep complete columns before common prayers',()=>{
 const item=(str,x,y,width=100)=>({str,width,height:12,transform:[1,0,0,12,x,y]});
 const rows=F.pdfRows([item('First Antiphon',20,750),item('Sunday',20,720,40),item('(Ordinary)',65,720,65),item('Weekday (Ordinary)',200,720),item('ALL: Left fixture',20,690),item('ALL: Right fixture',200,690),item('left continuation.',20,675),item('right continuation.',200,675),item('PRIEST: Fixture common prayer across the full page.',20,640,340)],1);
 assert.deepEqual(rows.map(r=>r.alternative||'common'),['common','sunday','sunday','sunday','weekday','weekday','weekday','common']);
 assert.deepEqual(F.combine(rows.filter(r=>r.alternative==='sunday')),['Sunday (Ordinary)','ALL: Left fixture left continuation.']);
 assert.doesNotMatch(F.combine(rows.filter(r=>r.alternative==='sunday')).join(' '),/Right|right/);
});

test('Melkite long tracked title is repaired across three physical rows',()=>{
 const rows=['T H E D I V I N E A N D H O L Y L I T','U R G Y O F S A I N T J O H N C H R Y','S O S T O M','DEACON: Fixture spoken words.'];
 assert.deepEqual(F.combine(rows),['Divine Liturgy of St. John Chrysostom','DEACON: Fixture spoken words.']);
 const rubric='The Priest and the Deacon on his right stand before the Holy Table. They uncover their heads, and raise their hands saying the following prayer:';
 assert.equal(F.instruction(rubric),true);
 assert.deepEqual(F.combine([rubric,'PRIEST AND DEACON: Fixture prayer.']),[rubric,'PRIEST AND DEACON: Fixture prayer.']);
 assert.equal(F.instruction('The priest and the deacon are your servants, O Lord.'),false);
});
