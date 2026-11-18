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
 assert.deepEqual(F.role('DCN 2: Fixture petition.'),{kind:'deacon',name:'Deacon 2',words:'Fixture petition.'});
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








test('Edmonton Cherubic Hymn repeats only the complete clergy stanza in recognized 2012 edition',()=>{
 const hymn='Let us who mystically represent the cherubim, singing the Thrice-holy Hymn to the life-giving Trinity, lay aside cares. That we may receive the King of all, escorted invisibly by ranks of angels. Alleluia, alleluia, alleluia';
 const first='ALL: Let us who mystically represent the cherubim. Fixture opening.';
 const closing='ALL: That we may receive the King of all. Fixture Great Entrance continuation.';
 const source=[{lines:['Cherubic Hymn',first,'BISHOP: Fixture prayer.']},
  {lines:['CLERGY: '+hymn+' (\u2020bow). (3)','The bishop proceeds to the preparation table.']},
  {lines:['Great Entrance','DCN 1: Fixture entrance.',closing]}];
 source.edmonton2012=true;
 const before=JSON.stringify(source),output=F.expandEdmontonCherubicThreefold(source);
 assert.equal(output.edmonton2012,true);
 assert.equal(output[1].lines[0],'CLERGY: '+[hymn,hymn,hymn].join(' '));
 assert.equal(output[0].lines[1],first,'people sing the opening once');
 assert.equal(output[2].lines[2],closing,'Great Entrance continuation remains singular');
 assert.equal(output[1].lines[1],source[1].lines[1],'source directions remain intact');
 assert.doesNotMatch(output[1].lines[0],/\(\s*3\s*\)|bow/i);
 assert.equal(JSON.stringify(source),before,'device-local source must not be rewritten');
 assert.strictEqual(F.expandEdmontonCherubicThreefold(output),output,'idempotent');
 const unknown=source.map(part=>({...part,lines:[...part.lines]}));
 assert.strictEqual(F.expandEdmontonCherubicThreefold(unknown),unknown);
 for(const [section,index] of [[0,0],[0,1],[1,0],[1,1],[2,0]]){
  const altered=source.map(part=>({...part,lines:[...part.lines]}));altered.edmonton2012=true;
  altered[section].lines.splice(index,1);
  assert.strictEqual(F.expandEdmontonCherubicThreefold(altered),altered,'missing source anchor: '+section+':'+index);
 }
 const extra=source.map(part=>({...part,lines:[...part.lines]}));extra.edmonton2012=true;
 extra[1].lines.unshift('CLERGY: '+hymn+' (\u2020bow). (3)');
 assert.strictEqual(F.expandEdmontonCherubicThreefold(extra),extra,'ambiguous double stanza fails closed');
 const modified=source.map(part=>({...part,lines:[...part.lines]}));modified.edmonton2012=true;
 modified[1].lines[0]=modified[1].lines[0].replace('ranks of angels','a different company');
 assert.strictEqual(F.expandEdmontonCherubicThreefold(modified),modified,'unverified wording fails closed');
});

test('Edmonton p. 57 renders two spoken iterations of each source-marked initial hymn',()=>{
 const lines=[
  'Trisagion Hymn','ALL: †Holy God, Holy and Mighty, Holy and Immortal, have mercy on us. (2)',
  'Baptismal Hymn',
  'On the Nativity of Christ, Theophany, Saturday of Lazarus, Holy Saturday, Easter Week and Pentecost, we sing the Baptismal Hymn:',
  'ALL: All you who have been baptized into Christ, you have put on Christ. Alleluia. (2)',
  'CLERGY: Fixture Greek chant.','DEACON: Give glory to Christ, our God!',
  'ALL: †Glory be to the Father, and to the Son, and to the Holy Spirit. You have put on Christ. Alleluia.',
  'The bishop proceeds to the high place:','DEACON: Master, proceed.'
 ];
 const original=[{lines:[...lines]}];original.edmonton2012=true;
 const snapshot=JSON.stringify(original),expanded=F.expandEdmontonTrisagionTwofold(original);
 assert.equal(expanded.edmonton2012,true);
 assert.deepEqual([...F.edmontonBaptismalAlternative(expanded).starts],['0:2'],
  'seasonal grouping must remain recognized after expanding marked repetitions');
 assert.equal((expanded[0].lines[1].match(/Holy God, Holy and Mighty,/g)||[]).length,2);
 assert.equal((expanded[0].lines[4].match(/All you who have been baptized into Christ/g)||[]).length,2);
 assert.doesNotMatch(expanded[0].lines[1]+expanded[0].lines[4],/\(2\)/);
 assert.equal(expanded[0].lines[7],lines[7],'concluding response unchanged');
 assert.equal(JSON.stringify(original),snapshot,'original source not rewritten');
 assert.strictEqual(F.expandEdmontonTrisagionTwofold(expanded),expanded,'idempotent after expansion');
 const unknown=original.map(part=>({...part,lines:[...part.lines]}));
 assert.strictEqual(F.expandEdmontonTrisagionTwofold(unknown),unknown);
 for(const omission of [1,3,4,5,6,7,8,9]){
  const altered=[{lines:lines.filter((_,i)=>i!==omission)}];altered.edmonton2012=true;
  assert.strictEqual(F.expandEdmontonTrisagionTwofold(altered),altered,'altered edition remains untouched');
 }
});

test('Edmonton seasonal Baptismal Hymn is collapsed only with a complete source signature',()=>{
 const lines=[
  'Trisagion Hymn','ALL: Holy God, Holy and Mighty, Holy and Immortal, have mercy on us. (2)',
  'Baptismal Hymn',
  'On the Nativity of Christ, Theophany, Saturday of Lazarus, Holy Saturday, Easter Week and Pentecost, we sing the Baptismal Hymn:',
  'ALL: All you who have been baptized into Christ, you have put on Christ. Alleluia. (2)',
  'CLERGY: Fixture Greek chant.','DEACON: Give glory to Christ, our God!',
  'ALL: †Glory be to the Father, and to the Son, and to the Holy Spirit. You have put on Christ. Alleluia.',
  'The bishop proceeds to the high place:','DEACON: Master, proceed.','BISHOP: Normal continuation.'
 ];
 const source=[{lines:[...lines]}];source.edmonton2012=true;
 const snapshot=JSON.stringify(source),found=F.edmontonBaptismalAlternative(source);
 assert.deepEqual([...found.starts],['0:2']);
 assert.deepEqual([...found.lines],['0:3','0:4','0:5','0:6','0:7','0:8']);
 assert.equal(JSON.stringify(source),snapshot);
 const unknown=source.map(s=>({...s,lines:[...s.lines]}));
 assert.equal(F.edmontonBaptismalAlternative(unknown).starts.size,0);
 for(const absent of [0,1,2,3,4,5,6,7,8,9]){
  const changed=[{lines:lines.filter((_,i)=>i!==absent)}];changed.edmonton2012=true;
  assert.equal(F.edmontonBaptismalAlternative(changed).starts.size,0,'missing pattern '+absent);
 }
 const repeated=[{lines:[...lines,'Baptismal Hymn']}];repeated.edmonton2012=true;
 assert.equal(F.edmontonBaptismalAlternative(repeated).starts.size,0);
});
test('the opening-blessing trim preserves positively identified edition markers',()=>{
 const source=[{lines:['Preface','Blessing','PRIEST: Blessed is the Kingdom.','ALL: Amen.']}];
 source.edmonton2012=true;
 const result=F.startAtOpeningBlessing(source);
 assert.equal(result.edmonton2012,true);
 assert.equal(result.newton2009,undefined);
 assert.deepEqual(source[0].lines,['Preface','Blessing','PRIEST: Blessed is the Kingdom.','ALL: Amen.']);
 const melkite=[...source];delete melkite.edmonton2012;melkite.newton2009=true;
 assert.equal(F.startAtOpeningBlessing(melkite).newton2009,true);
});


test('Edmonton appointment and Alleluia rubrics are not spoken prayer',()=>{
 for(const direction of [
  'See propers.',
  'The Prokimenon for the day. See propers.',
  'The “Alleluia” is sung in preparation for the proclamation of the holy Gospel. If psalm verses are chanted, the faithful respond after each verse with the refrain “Alleluia” (3).',
  'If psalm verses are chanted, the faithful respond after each verse.',
  'On the Nativity of Christ, Theophany, Saturday of Lazarus, Holy Saturday, Easter Week and Pentecost, we sing the Baptismal Hymn:'
 ])assert.equal(F.instruction(direction),true,'editorial direction: '+direction);
 for(const spoken of [
  'ALL: Alleluia, alleluia, alleluia.',
  'ALL: All you who have been baptized into Christ, you have put on Christ. Alleluia.',
  'DEACON: Wisdom! Let us be attentive.',
  'The Lord is my strength and my salvation.'
 ])assert.equal(F.instruction(spoken),false,'spoken words must remain: '+spoken);
});
test('Edmonton 2012 printed section labels remain headings, never prayer words',()=>{
 const verified=[
  'Hymn to Christ','The Beatitudes','The Entrance of Christ the High Priest',
  'The Light of Christ','Entrance of the High Priest','Baptismal Hymn',
  'Prokimenon','Epistle','Alleluia','Gospel','Prayer for the Church',
  'Concluding Blessing','Litany of Supplication','Surrender to God',
  'Communion of the Clergy','Communion of the Faithful',
  'Thanksgiving Hymn','Thanksgiving Litany','Ambo Prayer',
  'Final Blessing','Confession of Faith','Troparia and Kontakia'
 ];
 for(const text of verified){
  assert.equal(F.heading(text),true,'source heading not recognized: '+text);
  assert.equal(F.normalize(text),text,'printed title should stay intact: '+text);
 }
 const split=['THE ENTRANCE OF','CHRIST THE HIGH PRIEST',
  'Prayer of Entrance','BISHOP: Fixture episcopal entrance prayer.'];
 assert.deepEqual(F.combine(split),[
  'The Entrance of Christ the High Priest','Prayer of Entrance',
  'BISHOP: Fixture episcopal entrance prayer.'
 ],'wrapped source heading should not merge into the prayer');
 const sequence=F.combine([
  'Surrender to God','BISHOP: Peace be with all.',
  'ALL: And with your spirit.','Ambo Prayer',
  'PRIEST: Let us go forth in peace.','ALL: In the name of the Lord.'
 ]);
 assert.deepEqual(sequence,[
  'Surrender to God','BISHOP: Peace be with all.',
  'ALL: And with your spirit.','Ambo Prayer',
  'PRIEST: Let us go forth in peace.','ALL: In the name of the Lord.'
 ]);
 assert.equal(F.heading('Let us go forth in peace.'),false);
 assert.equal(F.heading('I believe in one God.'),false);
});

test('Edmonton 2012 repairs only verified printed line-wraps and preserves real compounds',()=>{
 const source=[{lines:[
  'PRIEST: Pray for our sal-vation and govern-ment.','ALL: Al-leluia, all holy.',
  'BISHOP: Our loving-kindness, Only-begotten Son, life-giving Spirit and well-being.',
  'PRIEST: Im-mortal Fa-ther; Mys-teries, nothing-ness and pro-todeacon.',
  'PRIEST: Fixture non-verified semi-circular and word-breaks.'
 ]}];
 source.edmonton2012=true;
 const before=JSON.stringify(source),out=F.repairEdmontonWrappedWords(source);
 assert.equal(out.edmonton2012,true);
 assert.match(out[0].lines[0],/salvation and government/);
 assert.equal(out[0].lines[1],'ALL: Alleluia, all holy.');
 assert.match(out[0].lines[2],/loving-kindness, Only-begotten Son, life-giving Spirit and well-being/);
 assert.match(out[0].lines[3],/Immortal Father; Mysteries, nothingness and protodeacon/);
 assert.match(out[0].lines[4],/semi-circular and word-breaks/);
 assert.equal(JSON.stringify(source),before,'source must remain byte-for-byte intact');
 assert.strictEqual(F.repairEdmontonWrappedWords(out),out,'the repair is idempotent');
 const unknown=source.map(p=>({...p,lines:p.lines.slice()}));
 assert.strictEqual(F.repairEdmontonWrappedWords(unknown),unknown,'unrecognized books are never altered');
 const noSplit=[{lines:['ALL: Only-begotten Son and loving-kindness.']}];
 noSplit.edmonton2012=true;
 assert.strictEqual(F.repairEdmontonWrappedWords(noSplit),noSplit,'real compounds never trigger a rewrite');
});

test('Edmonton 2012 expands three other marked repetitions without repeating the Amen',()=>{
 const source=[{lines:[
  'Confession of Love',
  'BISHOP: I will love You, O Lord, my strength; the Lord is my stronghold and my refuge. (3)',
  'Confession of Faith'
 ]},{lines:[
  'One is Holy',
  'BISHOP: Fixture longer prayer. God, be merciful to me, a sinner. (3)',
  'ALL: One is holy, one is Lord.'
 ]},{lines:[
  'Ambo Prayer',
  'ALL: Amen. Blessed be the name of the Lord now and for ever. (3)',
  'Final Blessing'
 ]}];
 source.edmonton2012=true;
 const original=JSON.stringify(source),out=F.expandEdmontonRemainingThreefold(source);
 const all=out.flatMap(part=>part.lines);
 assert.equal(out.edmonton2012,true);
 assert.equal((all[1].match(/I will love You, O Lord, my strength;/g)||[]).length,3);
 assert.equal((all[4].match(/God, be merciful to me, a sinner\./g)||[]).length,3);
 assert.equal((all[7].match(/Blessed be the name of the Lord now and for ever\./g)||[]).length,3);
 assert.equal((all[7].match(/\bAmen\./g)||[]).length,1,'the preceding Amen is not repeated');
 assert.equal(JSON.stringify(source),original,'saved source remains unmodified');
 assert.strictEqual(F.expandEdmontonRemainingThreefold(out),out,'already expanded must be idempotent');
 const unknown=source.map(p=>({...p,lines:[...p.lines]}));
 assert.strictEqual(F.expandEdmontonRemainingThreefold(unknown),unknown,'other books must not be changed');
 for(const [section,index] of [[0,1],[1,1],[2,1]]){
  const changed=source.map(p=>({...p,lines:[...p.lines]}));changed.edmonton2012=true;
  changed[section].lines[index]=changed[section].lines[index].replace(' (3)','');
  assert.strictEqual(F.expandEdmontonRemainingThreefold(changed),changed,'missing marker must fail closed');
 }
 const swapped=source.map(p=>({...p,lines:[...p.lines]}));swapped.edmonton2012=true;
 [swapped[0],swapped[2]]=[swapped[2],swapped[0]];
 assert.strictEqual(F.expandEdmontonRemainingThreefold(swapped),swapped,'out-of-order source must not be altered');
 const extra=source.map(p=>({...p,lines:[...p.lines]}));extra.edmonton2012=true;
 extra[1].lines.push(source[1].lines[1]);
 assert.strictEqual(F.expandEdmontonRemainingThreefold(extra),extra,'duplicate source prayer must not be expanded');
});

test('Edmonton 2012 expands four Insistent Litany replies and one dismissal reply only in matched editions',()=>{
 const source=[{lines:[
  'Insistent Litany','DCN 2: Petition A.','ALL: Lord, have mercy. (3)',
  'DCN 2: Petition B.','ALL: Lord, have mercy. (3)',
  'DCN 2: Petition C.','ALL: Lord, have mercy. (3)',
  'Special petitions may be added here.',
  'DCN 2: Petition D.','ALL: Lord, have mercy. (3)'
 ]},{lines:[
  'Dismissal','BISHOP: Fixture dismissal.',
  'ALL: †Glory be to the Father and to the Son and to the Holy Spirit,* now and for ever and ever. Amen.* Lord, have mercy. (3)* Mas-ter, give the blessing.',
  'BISHOP: Fixture conclusion.'
 ]}];
 source.edmonton2012=true;
 assert.equal(F.heading('Insistent Litany'),true);
 assert.equal(F.heading('Polychronion'),true);
 assert.equal(F.instruction('Special petitions may be added here.'),true);
 assert.equal(F.instruction('Special petitions may be added here for a family.'),false);
 const saved=JSON.stringify(source),result=F.expandEdmontonThreefoldResponses(source);
 const lines=result.flatMap(x=>x.lines);
 assert.equal(result.edmonton2012,true);
 const answers=lines.filter(x=>/^ALL: Lord, have mercy\./.test(x));
 assert.equal(answers.length,4);
 assert.equal(answers.filter(x=>(x.match(/Lord, have mercy\./g)||[]).length===3).length,4);
 const ending=lines.find(x=>x.startsWith('ALL: †Glory'));
 assert.equal((ending.match(/Lord, have mercy\./g)||[]).length,3);
 assert.match(ending,/Master, give the blessing\./);
 assert.doesNotMatch(ending,/\(3\)|Mas-ter/);
 assert.equal(JSON.stringify(source),saved);
 assert.strictEqual(F.expandEdmontonThreefoldResponses(result),result);
 const other=source.map(x=>({...x,lines:x.lines.slice()}));
 assert.strictEqual(F.expandEdmontonThreefoldResponses(other),other);
 const altered=source.map(x=>({...x,lines:x.lines.slice()}));altered.edmonton2012=true;
 altered[0].lines[6]='ALL: Lord, have mercy. (2)';
 assert.strictEqual(F.expandEdmontonThreefoldResponses(altered),altered);
 const half=source.map(x=>({...x,lines:x.lines.slice()}));half.edmonton2012=true;
 half[1].lines[2]=half[1].lines[2].replace(' (3)','');
 assert.strictEqual(F.expandEdmontonThreefoldResponses(half),half);
 const prejoined=source.map(x=>({...x,lines:x.lines.slice()}));prejoined.edmonton2012=true;
 prejoined[1].lines[2]=prejoined[1].lines[2].replace('Mas-ter','Master');
 assert.equal((F.expandEdmontonThreefoldResponses(prejoined)[1].lines[2].match(/Lord, have mercy\./g)||[]).length,3,
  'already-joined PDF extraction remains a valid recognized source');
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

test('additional Byzantine minister labels stay distinct from prayer text',()=>{
 for(const [label,expected] of [['Subdeacon','Subdeacon'],['Server','Server'],['Acolyte','Acolyte']]){
  assert.deepEqual(F.role(label+': Fixture words.'),{kind:'other',name:expected,words:'Fixture words.'});
  assert.deepEqual(F.speakerInstruction('The '+label+' says:'),{kind:'other',name:expected,words:''});
  assert.equal(F.instruction(label+': Fixture words.'),false);
 }
 assert.equal(F.role('SUBDEACON: Fixture words.').name,'Subdeacon');
 assert.deepEqual(F.combine(['SUBDEACON: Fixture petition.','SERVER: Fixture response.']),['SUBDEACON: Fixture petition.','SERVER: Fixture response.']);
});

test('joint clergy instruction cues retain both speakers',()=>{
 for(const line of ['The Priest and Deacon say:','The priest and the deacon pray:']){
  const speaker=F.speakerInstruction(line);
  assert.equal(speaker?.kind,'clergy',line);
  assert.equal(speaker?.name,'Priest and Deacon',line);
  assert.equal(speaker?.words,'',line);
 }
 assert.equal(F.speakerInstruction('The Deacon says:').kind,'deacon');
 assert.equal(F.speakerInstruction('The priest bows.'),null);
});

test('celebrant, protodeacon and lector cues preserve named voices',()=>{
 for(const [speaker,kind,name] of [
  ['Celebrant','priest','Priest'],
  ['Protodeacon','deacon','Deacon'],
  ['Lector','other','Lector']
 ]){
  assert.deepEqual(F.speakerInstruction('The '+speaker+' says:'),{kind,name,words:''});
  assert.deepEqual(F.role(speaker+': Fixture prayer.'),{kind,name,words:'Fixture prayer.'});
  assert.equal(F.instruction('The '+speaker+' says:'),true);
  assert.equal(F.instruction(speaker+': Fixture prayer.'),false);
 }
 assert.equal(F.speakerInstruction('The priest blesses the congregation.'),null);
});

test('PDF line joining does not erase printed compound hyphens',()=>{
 assert.deepEqual(F.combine(['Only-','begotten Son, have mercy.']),['Only-begotten Son, have mercy.']);
 assert.deepEqual(F.combine(['life‐','giving Cross.']),['life‐giving Cross.']);
 assert.deepEqual(F.combine(['Prayer to the','Mother of God.']),['Prayer to the Mother of God.']);
 assert.equal(F.normalize('incorrupt\u00adible'),'incorruptible');
});

test('voice cues in source directions stay attached to the following speaker',()=>{
 for(const [line,kind,cue] of [
  ['The priest says quietly:','priest','quietly'],
  ['The priest prays in a low voice:','priest','in a low voice'],
  ['The deacon proclaims aloud:','deacon','aloud'],
  ['The choir sings silently:','other','silently'],
  ['The bishop says (softly):','priest','softly']
 ]){
  const speaker=F.speakerInstruction(line);
  assert.equal(speaker?.kind,kind,line);
  assert.equal(speaker?.cue,cue,line);
  assert.equal(speaker?.words,'',line);
  assert.equal(F.instruction(line),true,line);
 }
 assert.equal(F.speakerInstruction('The priest walks toward the altar.'),null);
});

test('devotional mode classifies posture cues but preserves prayer words',()=>{
 for(const direction of [
  'Stand.', 'Sit.', 'Kneel.', 'All stand.', '(Sit.)',
  'Please stand.', 'The people sit.', 'Stand for the Gospel.',
  'The priest bows.', 'The deacon proclaims aloud:'
 ])assert.equal(F.instruction(direction),true,direction);
 for(const prayer of [
  'Let us stand well before God.',
  'ALL: Let us stand well before God.',
  'Lord, make me stand firm in Your truth.',
  'We stand before You with reverence.',
  'PRIEST: Peace be with you.',
  'For the peace of the world, fixture petition.'
 ])assert.equal(F.instruction(prayer),false,prayer);
 assert.equal(F.role('ALL: Lord, have mercy.').words,'Lord, have mercy.');
 assert.equal(F.speakerInstruction('The Priest says:').name,'Priest');
});

test('PDF-derived Byzantine prayers read without chant breaks or stray punctuation',()=>{
 const raw='ALL: Bless * the Lord , O my soul ! Glory to You ; now and ever .';
 const parsed=F.role(raw);
 const display=F.displayPrayer(parsed.words);
 assert.equal(display,'Bless the Lord, O my soul! Glory to You; now and ever.');
 assert.equal(F.displayPrayer('Peace * to all. * And to your spirit.'),'Peace to all. And to your spirit.');
 assert.equal(F.displayPrayer('O Lord ( who loves mankind ) , hear us .'),'O Lord (who loves mankind), hear us.');
 assert.equal(F.displayPrayer('Holy God… Holy Mighty! (Psalm 103:24)'),'Holy God… Holy Mighty! (Psalm 103:24)');
 assert.equal(F.displayPrayer('Only-begotten Son, have mercy.'),'Only-begotten Son, have mercy.');
 assert.equal(F.displayPrayer('The words * of prayer.'),'The words of prayer.');
 assert.equal(F.normalize(raw),raw,'the original parsed words must not be changed in memory');
 assert.equal(F.displayPrayer('ALL: \u201cGod be with you.\u201d'),'ALL: “God be with you.”');
});


test('spoken proclamations are rubrics when attributed to a minister',()=>{
 for(const line of ['The deacon proclaims aloud:','The priest exclaims:','The reader recites:','The cantor chants:']){
  assert.equal(F.instruction(line),true,line);
  assert.ok(F.speakerInstruction(line),line);
 }
 for(const line of ['Deacon: Let us attend.','Reader: Wisdom.'])assert.equal(F.instruction(line),false,line);
});

test('calendar and feast headings normalize uppercase words without touching prayers',()=>{
 const cases=[
  ['EIGHTH SUNDAY AFTER THE HOLY CROSS Beginning of the Nativity Fast','Eighth Sunday after the Holy Cross Beginning of the Nativity Fast'],
  ['THE HOLY APOSTLE PHILIP','The Holy Apostle Philip'],
  ['NATIVITY FAST (PHILIP’S FAST)','Nativity Fast (Philip’s Fast)'],
  ['Feast of St. JOHN XXIII in the USA','Feast of St. John XXIII in the USA'],
  ['MOTHER-OF-GOD','Mother-of-God'],
  ['FÊTE DE LA SAINTE FAMILLE','Fête de la Sainte Famille'],
  ['St. Machutus (Malo), Bishop and Confessor','St. Machutus (Malo), Bishop and Confessor']
 ];
 for(const [source,expected] of cases)assert.equal(F.displayTitle(source),expected,source);
 assert.equal(F.normalize('LORD, HAVE MERCY.'),'LORD, HAVE MERCY.','prayer text remains untouched');
});

test('the same calendar title formatter is used throughout the Today, Calendar and readings views',()=>{
 const fs=require('node:fs');
 const app=fs.readFileSync(require.resolve('../app.js'),'utf8');
 assert.match(app,/const displayTitle = LiturgicalFormat\.displayTitle/);
 assert.match(app,/const detailHTML = esc\(displayTitle\(shown\)\)/);
 assert.match(app,/byzantineCommemorations\(title\)\.map\(displayTitle\)/);
 assert.match(app,/westernCommemorations\(title\)\.map\(displayTitle\)/);
 assert.match(app,/esc\(displayTitle\(x\.title\)\)/);
 assert.match(app,/esc\(displayTitle\(m\.title\)\)/);
});

test('single-observance Calendar headings and chips use the shared capitalization rule',()=>{
 const fs=require('node:fs'),app=fs.readFileSync(require.resolve('../app.js'),'utf8');
 const branch='if (entries.length < 2) return esc(entries[0] || displayTitle(title || \'\'));';
 assert.equal(app.split(branch).length-1,2,'Both Western and Byzantine single titles must normalize');
 assert.ok(app.includes('esc(displayTitle(t))'),'Calendar chips use display capitalization');
 for(const [raw,expected] of [
  ['GREAT-MARTYR BARBARA','Great-Martyr Barbara'],
  ['HOLY PROPHET NAHUM','Holy Prophet Nahum'],
  ['NATIVITY FAST','Nativity Fast'],
  ['ALL-NIGHT VIGIL FEAST','All-Night Vigil Feast'],
  ['USCCB','USCCB']
 ])assert.equal(F.displayTitle(raw),expected);
});

test('Ukrainian numbered clergy use distinct readable speaker names',()=>{
 for(const [line,name,kind] of [
  ['PRIEST 1: Fixture opening.','Priest 1','priest'],
  ['PRIEST 2: Fixture reply.','Priest 2','priest'],
  ['DEACON 1: Fixture petition.','Deacon 1','deacon'],
  ['DCN 2: Fixture petition.','Deacon 2','deacon'],
  ['ALL: Amen.','All','all']
 ]){
  const role=F.role(line);
  assert.equal(role?.name,name,line);assert.equal(role?.kind,kind,line);
 }
 assert.deepEqual(F.combine([
  {text:'DEACON 2:',page:35,y:620,height:12},
  {text:'Fixture petition on the next line.',page:35,y:590,height:12},
  {text:'ALL: Fixture response.',page:35,y:565,height:12}
 ]),['DEACON 2: Fixture petition on the next line.','ALL: Fixture response.']);
});

test('bilingual Ukrainian text filtering preserves English responses on the same PDF row',()=>{
 const items=[
  {str:'Господи, помилуй.',transform:[1,0,0,12,20,720]},
  {str:'ALL: Lord, have mercy.',transform:[1,0,0,12,240,720]},
  {str:'PRIEST: Господи, помилуй',transform:[1,0,0,12,20,700]},
  {str:'DEACON: In peace let us pray / ДИЯКОН: В мирі Господеві помолімся',transform:[1,0,0,12,20,680]},
  {str:'Українською: Господи, помилуй. ALL: Amen.',transform:[1,0,0,12,20,660]},
  {str:'PRIEST: Glory to You, O Lord.',transform:[1,0,0,12,20,640]}
 ];
 const filtered=F.englishPdfItems(items);
 const combined=F.pdfRows(filtered,1).map(r=>r.text).join(' ');
 assert.doesNotMatch(combined,/[\u0400-\u052f]/u);
 assert.match(combined,/ALL: Lord, have mercy/);
 assert.match(combined,/DEACON: In peace let us pray/);
 assert.match(combined,/ALL: Amen/);
 assert.match(combined,/PRIEST: Glory to You, O Lord/);
 assert.doesNotMatch(combined,/PRIEST:\s+DEACON:/);
 assert.equal(F.englishPdfItems([{str:'Господи, помилуй.'}]).length,0);
 assert.deepEqual(F.englishPdfItems([{str:'ALL: Amen.',width:10}]),[{str:'ALL: Amen.',width:10}]);
});

test('Ukrainian prayers begin at the first blessing and drop seasonal cover headings',()=>{
 const s=[
  {lines:['DIVINE LITURGY','Easter Season','St. Josaphat Cathedral April 2018']},
  {lines:['WE LEAVE THE WORLD STAND','Blessing','DEACON: Master, give the blessing.','PRIEST: Blessed be the kingdom.','ALL: Amen.']},
  {lines:['Great Litany','DEACON: In peace let us pray to the Lord.']}
 ];
 const clean=F.startAtOpeningBlessing(s),body=clean.flatMap(x=>x.lines).join(' ');
 assert.equal(clean[0].heading,'Liturgy of the Word');
 assert.match(body,/Blessing DEACON: Master, give the blessing/);
 assert.match(body,/Great Litany DEACON/);
 assert.doesNotMatch(body,/WE LEAVE|Easter Season|St\. Josaphat/);
 const u=[{lines:['Unknown booklet','No identifiable opening.']}];
 assert.deepEqual(F.startAtOpeningBlessing(u),u);
});
test('facing-page numerals are not devotional text',()=>{
 const source=[
  {text:'ALL: Son of God, save us who sing to You: Alleluia.',page:35,y:600,height:12},
  {text:'10 11',page:35,y:80,height:12},
  {text:'Entrance with the Gospel',page:37,y:780,height:12},
  {text:'DEACON: Let us pray to the Lord.',page:37,y:750,height:12}
 ];
 assert.equal(F.pdfFolioLine('10 11'),true);
 assert.equal(F.pdfFolioLine('11'),true);
 for(const reference of ['10:11','Psalm 10:11','Verse 10 11','10–11','10 11 12'])
  assert.equal(F.pdfFolioLine(reference),false,reference);
 assert.deepEqual(F.combine(source),[
  'ALL: Son of God, save us who sing to You: Alleluia.',
  'Entrance with the Gospel',
  'DEACON: Let us pray to the Lord.'
 ]);
 assert.deepEqual(F.combine(['10 11']),[]);
 assert.deepEqual(F.combine(['Verse: Psalm 10:11','The Lord is King.']),[
  'Verse: Psalm 10:11 The Lord is King.'
 ]);
});

test('Divine Liturgy display capitalizes God without rewriting the source',()=>{
 const source='Verse: For god is a great Lord and a great King over all the earth.';
 assert.equal(F.displayPrayer(source),
  'Verse: For God is a great Lord and a great King over all the earth.');
 assert.equal(F.displayPrayer('GOD is merciful, and God is love.'),'God is merciful, and God is love.');
 assert.equal(F.displayPrayer("God's mercy, the gods of the nations, godly conduct."),
  "God's mercy, the gods of the nations, godly conduct.");
 assert.equal(source.includes('god'),true,'original words are unchanged');
});

test('underscore separators from PDFs are not spoken lines',()=>{
 assert.deepEqual(F.combine(['ALL: Lord, have mercy.','________________________','DEACON: A new petition.']),['ALL: Lord, have mercy.','DEACON: A new petition.']);
 assert.deepEqual(F.combine(['ALL: Amen. __________________________']),['ALL: Amen.']);
});

test('saved Byzantine EPUBs become a continuous prayer document without editorial sections',()=>{
 const sections=F.epubPrayerSections([
  {title:'Copyright',blocks:[{text:'Publisher metadata.'}]},
  {title:'DIVINE LITURGY',blocks:[{text:'Introductory note.'}]},
  {title:'BLESSING',blocks:[{text:'DEACON: Master, give the blessing.'},{text:'PRIEST: Blessed is the Kingdom.'},{kind:'instruction',text:'The priest bows.'},{role:'all',text:'Amen.'}]},
  {title:'The Prayer Sequence',blocks:[{tag:'h4',text:'The Litany of Peace'},{text:'DEACON: In peace let us pray to the Lord.'},{text:'ALL: Lord, have mercy.'}]},
  {title:'Appendix',blocks:[{text:'Fixture appendix.'}]},
  {title:'Afterword',blocks:[{text:'Unrelated end matter.'}]}
 ]);
 const body=sections.flatMap(part=>part.lines).join(' ');
 assert.match(body,/DEACON: Master, give the blessing/);
 assert.match(body,/ALL: Amen\./);
 assert.match(body,/DEACON: In peace let us pray to the Lord/);
 assert.match(body,/Instruction: The priest bows/,'rubric stays marked so the prayer renderer can hide it');
 assert.doesNotMatch(body,/Publisher metadata|Introductory note|Fixture appendix|Unrelated end matter/);
 assert.equal(sections[0].heading,'Liturgy of the Word');
 assert.equal(sections.at(-1).heading,'The Litany of Peace');
 assert.deepEqual(F.epubPrayerSections([{title:'First Prayer',blocks:[{role:'all',text:'ALL: Amen.'}]}])[0].lines,['ALL: Amen.'],'do not double-label printed responses');
});

test('inline minister cues retain spoken prayers instead of hiding them as rubrics',()=>{
 for(const [line,kind,words] of [
  ['The priest says: Blessed is the Kingdom.','priest','Blessed is the Kingdom.'],
  ['The deacon chants: In peace let us pray to the Lord.','deacon','In peace let us pray to the Lord.'],
  ['The reader proclaims: Wisdom!','other','Wisdom!'],
  ['The choir sings: Amen.','other','Amen.']
 ]){
  const spoken=F.role(line);
  assert.equal(spoken?.kind,kind,line);
  assert.equal(spoken?.words,words,line);
  assert.equal(F.instruction(line),false,'spoken prayer must remain visible: '+line);
 }
 for(const rubric of ['The priest says:', 'The deacon chants:', 'The priest bows.']){
  assert.equal(F.role(rubric),null,rubric);
  assert.equal(F.instruction(rubric),true,rubric);
 }
 assert.equal(F.role('PRIEST: Lord, have mercy.')?.words,'Lord, have mercy.');
 assert.equal(F.role('The priest says that the prayer is finished.'),null);
});

test('titled EPUB appendices and copyright chapters never resume as prayer',()=>{
 const book=[
  {title:'Copyright: Publisher Details',blocks:[{text:'Copyright metadata must not appear.'}]},
  {title:'The Divine Liturgy',blocks:[{text:'PRIEST: Blessed is the Kingdom.'},{text:'ALL: Amen.'}]},
  {title:'Appendix A — Editorial References',blocks:[{text:'Not a liturgical prayer.'}]},
  {title:'Additional Prayer',blocks:[{text:'This should not resume after an appendix.'}]}
 ];
 const sections=F.epubPrayerSections(book);
 const words=sections.flatMap(s=>s.lines).join(' ');
 assert.match(words,/Blessed is the Kingdom/);
 assert.match(words,/ALL: Amen/);
 assert.doesNotMatch(words,/Copyright metadata|Not a liturgical prayer|This should not resume/);
 const ordinary=F.epubPrayerSections([{title:'Prayer of Thanksgiving — After Communion',blocks:[{text:'PRIEST: Blessed is the Kingdom.'}]}]);
 assert.match(ordinary.flatMap(s=>s.lines).join(' '),/Blessed is the Kingdom/);
});

test('Melkite iPhone reader hides ceremonial notes without losing prayers',()=>{
 const directions=[
  'The Deacon replaces his hat and intones the Litany of Peace in a strong voice while standing before the Holy Doors.',
  'The Priest unfolds the Antimension.',
  'The choir and the celebrants alternate in singing the Trisagion Hymn: the',
  'He proclaims:'
 ];
 for(const line of directions)assert.equal(F.instruction(line),true,line);
 for(const prayer of ['Arabic: Qud---doo---son---il---laah,',
  'Greek: A---gi---os o The---os,',
  'Holy God, Holy Mighty One, Holy Immortal One, have mercy on us.',
  'Lord Jesus Christ: look upon Your servants the catechumens who have bowed',
  'All: Lord, have mercy.'])assert.equal(F.instruction(prayer),false,prayer);
 assert.equal(F.normalize('T H E T R I S A G I O N H Y M N'),'The Trisagion Hymn');
 assert.equal(F.displayPrayer('the well-- -being of the holy Churches of God'),
  'the well-being of the holy Churches of God');
 assert.equal(F.displayPrayer('Lord, have mercy. (To be repeated after each petition)'),
  'Lord, have mercy.');
 assert.equal(F.displayPrayer('Holy Immortal One, have mercy on us. (Three times)'),
  'Holy Immortal One, have mercy on us.');
});

test('PDF catechumen prayer stays one paragraph across vertical gap',()=>{
 const rows=[{text:'PRIEST: Lord Jesus Christ: look upon Your servants the catechumens who have bowed',page:22,y:500,height:12},
 {text:'their heads to You, and in due time make them worthy of regeneration.',page:22,y:449,height:12},
 {text:'ALL: Amen.',page:22,y:420,height:12}];
 assert.deepEqual(F.combine(rows),['PRIEST: Lord Jesus Christ: look upon Your servants the catechumens who have bowed their heads to You, and in due time make them worthy of regeneration.','ALL: Amen.']);
 assert.equal(F.instruction('Arabic: Qud---doo---son---il---laah,'),false);
 assert.equal(F.instruction('Greek: A---gi---os o The---os,'),false);
});

test('Melkite inline proclamation keeps the actual doxology',()=>{
 const rows=['He proclaims: That with us they too may glorify Your most noble and magnificent name.',
  'ALL: Amen.'];
 assert.deepEqual(F.combine(rows),[
  'That with us they too may glorify Your most noble and magnificent name.',
  'ALL: Amen.']);
 assert.equal(F.instruction('He proclaims:'),true);
});

test('Melkite antiphon selection commentary is not displayed as prayer',()=>{
 for(const note of [
  'For pastoral reasons, if only one Antiphon is done, the three Antiphon prayers may be distributed over the weekdays as follows: the first prayer, on Monday and Thursday; the second, on Tuesday and Friday and the third on Wednesday and Saturday.',
  'For Sundays and Commemorations of the Third Class For pastoral reasons, the Antiphons may be varied on Sundays according to the different tones. We may use Through the prayers of the Theotokos for Tones 1 and 5.'
 ])assert.equal(F.instruction(note),true,note);
 for(const prayer of [
  'The First Psalm of the Typika (Psalm 102)',
  'Through the prayers of the Theotokos, O Savior, save us.',
  'For the peace of the whole world, let us pray to the Lord.'
 ])assert.equal(F.instruction(prayer),false,prayer);
});

test('Melkite tracked Gospel heading and editorial movements',()=>{
 assert.equal(F.normalize('T H E H O L Y G O S P E L'),'The Holy Gospel');
 assert.equal(F.normalize('T H E T R O P A R I A & K O N T A K I A'),'The Troparia & Kontakia');
 for(const note of [
  'The Deacon, standing before the Holy Doors, takes the censer from the server and censes the Holy Table.',
  'The Priest hands the Deacon the Holy Gospel.',
  'The Epistle Reader, turning again to the Altar, chants the Alleluia verses as follows:',
  'On the Feasts of the Nativity of our Lord and the Theophany, their octaves, and their leave-takings (unless it is a Sunday)'
 ])assert.equal(F.instruction(note),true,note);
 assert.equal(F.displayPrayer('Peace □ be to all.'),'Peace be to all.');
 assert.equal(F.instruction('Holy God, Holy Mighty One, Holy Immortal One, have mercy on us.'),false);
});

test('annual Kontakia editorial block uses explicit source boundaries',()=>{
 const B=F.melkiteReferenceBoundary;
 assert.equal(B('The celebrant(s) alternate with the Choir'),'kontakia-start');
 assert.equal(B('Table of Kontakia for the Year'),'kontakia-start');
 assert.equal(B('The Trisagion Prayer of St. John Chrysostom'),'kontakia-end');
});

test('Newton annual Kontakia table ends before genuine Trisagion prayers',()=>{
 const B=F.melkiteReferenceBoundary;
 assert.equal(B('The celebrant(s) alternate with the Choir the singing of the hymns as indicated'),'kontakia-start');
 assert.equal(B('Table of Kontakia for the Year'),'kontakia-start');
 for(const line of ['Final Kontakion for Fixed Feasts:','Final Kontakion for ordinary Saturdays',
  'O Never-Failing Protectress of Christians'])assert.equal(B(line),null);
 assert.equal(B('The Trisagion Prayer of St. John Chrysostom'),'kontakia-end');
 assert.equal(B('The Trisagion Prayer of St. Basil the Great'),'kontakia-end');
 assert.equal(B('Table of Hirmoi for the Year'),'hirmoi-start');
 assert.equal(B('During the singing of the Hirmos, the Priest continues:'),'hirmoi-end');
 assert.equal(B('Priest: For the holy prophet and forerunner John the Baptist'),null);
});

test('Newton annual reference boundaries never apply to Ukrainian books',()=>{
 const fs=require('node:fs');
 const reader=fs.readFileSync(require.resolve('../liturgy-reader-ui.js'),'utf8');
 assert.match(reader,/const melkiteBook=target\.closest\('\[data-text-id\]'\)\?\.dataset\.textId==='melkite-chrysostom'/);
 assert.match(reader,/const boundary=melkiteBook\?LiturgicalFormat\.melkiteReferenceBoundary\(text\):null/);
});

test('Newton reference-table suppression requires verified 2009 PDF identity',()=>{
 const fs=require('node:fs');
 const reader=fs.readFileSync(require.resolve('../liturgy-reader-ui.js'),'utf8');
 assert.match(reader,/recognizedNewtonEdition=true/);
 assert.match(reader,/sections\.newton2009=true/);
 assert.match(reader,/sections\.newton2009===true/);
 assert.match(reader,/const boundary=melkiteBook\?LiturgicalFormat\.melkiteReferenceBoundary\(text\):null/);
});

test('PDF page boundary preserves pending speaker without crossing a heading',()=>{
 const fs=require('node:fs');
 const reader=fs.readFileSync(require.resolve('../liturgy-reader-ui.js'),'utf8');
 assert.match(reader,/if\(section\.heading\|\|section\.alternative\)pendingRole=null/);
 assert.ok(reader.includes('if(!role&&pendingRole&&!/^(?:Arabic|Greek)\\s*:/i.test(text))role={...pendingRole,words:text};'),
  'a split-page speaker must not swallow a printed Greek or Arabic chant label');
});

test('bare minister label at a page break is retained for the next prayer',()=>{
 const fs=require('node:fs');
 const reader=fs.readFileSync(require.resolve('../liturgy-reader-ui.js'),'utf8');
 assert.match(reader,/if\(role&&!role\.words\)\{pendingRole=role;lastLine=null;lastRole=null;continue;\}/);
 assert.deepEqual(F.role('PRIEST:'),{kind:'priest',name:'Priest',words:''});
 assert.deepEqual(F.role('DEACON:'),{kind:'deacon',name:'Deacon',words:''});
 assert.equal(F.role('PRIEST: Blessed is the Kingdom.')?.words,'Blessed is the Kingdom.');
});

test('Newton 2009 source audit: genuine prayers survive both annual tables',()=>{
 // Eparchy of Newton, LITURGY2009.pdf, printed pp. 39-43 and 66-68.
 // Source: https://melkite.org/wp-content/uploads/2012/02/LITURGY2009.pdf
 // These are selected exact source anchors, not a full-book transcription.
 const rows=[
  {text:'The celebrant(s) alternate with the Choir',expect:'kontakia-start'},
  {text:'Table of Kontakia for the Year',expect:'kontakia-start'},
  {text:'Final Kontakion for ordinary Sundays and Weekdays',expect:null},
  {text:'The Trisagion Prayer of St. John Chrysostom',expect:'kontakia-end'},
  {text:'O Holy of Holies, our only holy God',expect:null,prayer:true},
  {text:'The Trisagion Prayer of St. Basil the Great',expect:'kontakia-end'},
  {text:'God, the Holy, who rest among the saints',expect:null,prayer:true},
  {text:'Table of Hirmoi for the Year',expect:'hirmoi-start'},
  {text:'From 21 to 25 November: The Presentation of Our Lady',expect:null},
  {text:'During the singing of the Hirmos, the Priest continues:',expect:'hirmoi-end'},
  {text:'Priest: For the holy prophet and forerunner John the Baptist',expect:null,prayer:true}
 ];
 let table=null,visible=[];
 for(const row of rows){
  const boundary=F.melkiteReferenceBoundary(row.text);
  assert.equal(boundary,row.expect,row.text);
  if(boundary==='kontakia-start'||boundary==='hirmoi-start'){table=boundary;continue;}
  if(table){
   if(boundary==='kontakia-end'||boundary==='hirmoi-end')table=null;
   else continue;
  }
  visible.push(row.text);
  if(row.prayer)assert.equal(F.instruction(row.text),false,'real prayer suppressed: '+row.text);
 }
 assert.equal(table,null,'source audit must not leave reader inside reference table');
 for(const anchor of ['O Holy of Holies','God, the Holy','For the holy prophet']){
  assert.ok(visible.some(line=>line.includes(anchor)),'missing genuine prayer '+anchor);
 }
 assert.ok(!visible.some(line=>line.startsWith('From 21 to 25 November')));
});


test('inline spoken prayers survive stage directions and quiet voice cues',()=>{
 const cases=[
  ['The priest, turning to the people, says: Peace be to all.','priest','Peace be to all.'],
  ['The deacon, standing before the Holy Doors, proclaims: Wisdom! Let us attend.','deacon','Wisdom! Let us attend.'],
  ['The priest says quietly: Remember, O Lord, Your servants.','priest','Remember, O Lord, Your servants.'],
  ['The choir, together with the people, sings: Holy God, Holy Mighty One.','other','Holy God, Holy Mighty One.']
 ];
 for(const [source,kind,words] of cases){
  const spoken=F.role(source);
  assert.equal(spoken?.kind,kind,source);
  assert.equal(spoken?.words,words,source);
  assert.equal(F.instruction(source),false,'spoken prayer cannot be hidden: '+source);
 }
 assert.equal(F.role('The priest says quietly: Lord, have mercy.')?.cue,'quietly');
});

test('bare source directions remain hidden but retain a speaker for the next prayer',()=>{
 for(const [cue,name] of [
  ['The priest, turning to the people, says:','Priest'],
  ['The deacon, standing before the Holy Doors, proclaims:','Deacon'],
  ['The choir, together with the people, sings:','Choir']
 ]){
  assert.equal(F.role(cue),null,cue);
  assert.equal(F.instruction(cue),true,cue);
  assert.equal(F.speakerInstruction(cue)?.name,name,cue);
 }
 assert.equal(F.speakerInstruction('The priest says quietly:')?.cue,'quietly');
});

test('no unspoken ceremonial action is relabelled as a prayer',()=>{
 for(const line of [
  'The Deacon, standing before the Holy Doors, takes the censer from the server and censes the Holy Table.',
  'The priest, turning to the people, bows.',
  'The priest says that the prayer is finished.',
  'The priest, turning to the people, says:'
 ]){
  assert.equal(F.role(line),null,line);
  assert.equal(F.instruction(line),true,line);
 }
 assert.equal(F.speakerInstruction('The priest says that the prayer is finished.'),null);
});

// A printed inline ministry cue must never discard the words after the colon.
test('inline Byzantine minister cues preserve spoken text without parser errors',()=>{
 for(const [label,kind,name] of [
  ['Priest','priest','Priest'],['Deacon','deacon','Deacon'],
  ['Subdeacon','other','Subdeacon'],['Server','other','Server'],['Acolyte','other','Acolyte']
 ]){
  const prayer='Fixture words of prayer.';
  assert.deepEqual(F.role('The '+label+' says: '+prayer),{kind,name,words:prayer});
  assert.equal(F.instruction('The '+label+' says: '+prayer),false);
 }
 assert.deepEqual(F.role('The priest says quietly: Fixture private prayer.'),
  {kind:'priest',name:'Priest',words:'Fixture private prayer.',cue:'quietly'});
 assert.deepEqual(F.role('The subdeacon says quietly: Fixture private prayer.'),
  {kind:'other',name:'Subdeacon',words:'Fixture private prayer.',cue:'quietly'});
 assert.equal(F.role('The priest says:'),null,'bare cue must not be treated as spoken prayer');
});

// PDF glyphs inspected against Newton's 2009 official liturgy, printed pages 11 and 89.
test('Newton private-use blessing marks and ornamental bullets never appear in displayed prayers',()=>{
 assert.equal(F.displayPrayer('Priest: Blessed \uf058 is the union of Your holy things.'),
  'Priest: Blessed is the union of Your holy things.');
 assert.equal(F.displayPrayer('\uf076 Let our mouths be filled…'),
  'Let our mouths be filled…');
 assert.equal(F.displayPrayer('Priest: Peace \u2020 be to all.'),
  'Priest: Peace \u2020 be to all.','ordinary religious symbols remain untouched');
});

test('Edmonton 2012 English spans recover two verified mixed-script source words',()=>{
 const items=[
  {str:'\u0422he Light of Christ',width:12},
  {str:'taking the holy Bread, s\u0430\u0443s:',width:20},
  {str:'Господи, помилуй.',width:30}
 ];
 assert.deepEqual(F.englishPdfItems(items),[
  {str:'The Light of Christ',width:12},
  {str:'taking the holy Bread, says:',width:20}
 ]);
 assert.equal(F.englishPdfItems([{str:'Слава Ісусу Христу!'}]).length,0);
});


test('Newton 2009 feast apolyses are reference alternatives, not daily prayers',()=>{
 // Printed pp. 87-88 (PDF pp. 95-96). The current liturgy's concluding
 // prayers precede the tables; the Antidoron blessing follows the tables.
 const rows=[
  {text:'Priest: Through the prayers of our Holy Fathers',visible:true},
  {text:'All: Amen.',visible:true},
  {text:'Apolyses for the Fixed Feasts of the Lord and the Theotokos',boundary:'apolyses-start'},
  {text:'From 25 to 31 December:',visible:false},
  {text:'May Christ our true God who was born in a cave...',visible:false},
  {text:'Apolyses for the Movable Feasts',boundary:'apolyses-start'},
  {text:'Palm Sunday:',visible:false},
  {text:'May Christ our true God who entered Jerusalem...',visible:false},
  {text:'D I S T R I B U T I O N O F T H E A N T I D O R O N',boundary:'apolyses-end'},
  {text:'Priest: May the blessing of the Lord and His mercy be upon you.',visible:true}
 ];
 let inTable=false;
 const shown=[];
 for(const row of rows){
  const boundary=F.melkiteReferenceBoundary(row.text);
  assert.equal(boundary,row.boundary||null,'Unexpected reference boundary: '+row.text);
  if(boundary==='apolyses-start'){inTable=true;continue;}
  if(inTable){
   if(boundary==='apolyses-end')inTable=false;
   else continue;
  }
  if(F.heading(row.text))continue;
  shown.push(row.text);
 }
 assert.equal(inTable,false,'final Antidoron blessing must be outside the reference block');
 assert.ok(shown.some(line=>/Through the prayers of our Holy Fathers/.test(line)));
 assert.ok(shown.some(line=>/May the blessing of the Lord/.test(line)));
 assert.ok(!shown.some(line=>/born in a cave|entered Jerusalem/.test(line)));
 assert.equal(F.normalize('D I S T R I B U T I O N O F T H E A N T I D O R O N'),'Distribution of the Antidoron');
 const reader=require('node:fs').readFileSync(require.resolve('../liturgy-reader-ui.js'),'utf8');
 assert.match(reader,/boundary==='apolyses-start'/);
 assert.match(reader,/boundary==='apolyses-end'/);
});

test('dated hymns render prayer words but not editorial replacement directions in either fallback',()=>{
 const rows=[
  'Troparion, Tone 4: Glory to You, O Lord.',
  'Instead of “Blessed is He who comes…” we sing:',
  'All creation is filled with rejoicing today.',
  'Instead of “May our mouths…” and “Blessed be the Name…” we sing:',
  'ALL: Lord, have mercy.',
  'verse: The heavens tell the glory of God.',
  '   '
 ];
 assert.deepEqual(F.properPrayerLines(rows),[
  rows[0],rows[2],rows[4],rows[5]
 ]);
 assert.deepEqual(F.properPrayerLines(null),[]);
 assert.equal(F.instruction(rows[1]),true);
 const fs=require('node:fs'),app=fs.readFileSync(require.resolve('../app.js'),'utf8');
 const reader=fs.readFileSync(require.resolve('../liturgy-reader-ui.js'),'utf8');
 assert.match(app,/LiturgicalFormat\.properPrayerLines\(entry\.groups\?\.\[key\]\)/);
 assert.match(reader,/LiturgicalFormat\.properPrayerLines\(record\.groups\?\.\[key\]\)/);
});




test('Newton composite extraction hyphens retain one real hyphen in devotional words',()=>{
 const artifacts=[
  ['all-\u00ad\u2010\u2011holy','all-holy'],
  ['Only-\u00ad\u2010\u2011Begotten','Only-Begotten'],
  ['well-\u00ad\u2010\u2011being','well-being'],
  ['Life-\u00ad\u2010\u2011Giving','Life-Giving'],
  ['leave-\u00ad\u2010\u2011taking','leave-taking']
 ];
 for(const [source,expected] of artifacts)
  assert.equal(F.displayPrayer('Priest: '+source+'.'),'Priest: '+expected+'.',source);
 assert.equal(F.displayPrayer('Only-begotten'), 'Only-begotten',
  'ordinary printed compounds must stay exactly as written');
 assert.equal(F.displayPrayer('God—merciful'), 'God—merciful',
  'genuine em dash is not an extraction artifact');
 assert.equal(F.displayPrayer('God‐loving'),'God‐loving',
  'a single Unicode hyphen must remain unchanged');
});

test('Newton 2009 inline alternate-chant note never becomes the spoken All response',()=>{
 const response='All: The Father, the Son and the Holy Spirit, Trinity, one in essence and undivided.';
 const source=response+' After “The Father, the Son…,” “I will love You, Lord…” may also be sung.';
 assert.equal(F.displayPrayer(source),response);
 assert.equal(F.role(source)?.kind,'all');
 assert.equal(F.instruction(source),false,'response words should not become an editorial direction');
 assert.equal(F.displayPrayer(response),response,'the underlying response cannot be changed');
 assert.equal(F.displayPrayer('I will love You, Lord, my strength.'),'I will love You, Lord, my strength.',
  'separate sung prayer must be retained');
 assert.equal(F.displayPrayer(response+' After another explanation is offered.'),
  response+' After another explanation is offered.','unverified editorial patterns must not be guessed');
});

test('Newton 2009 printed repetition directions do not obscure spoken responses',()=>{
 const cases=[
  ['ALL: Lord, have mercy. (To be repeated after each petition)','ALL: Lord, have mercy.'],
  ['ALL: Lord, have mercy. (To be repeated after each petition.)','ALL: Lord, have mercy.'],
  ['ALL: Lord, have mercy. (three times -\u00ad\u2010\u2011 to be repeated after each petition.)','ALL: Lord, have mercy.'],
  ['ALL: Grant this, O Lord. (To be repeated after each petition.)','ALL: Grant this, O Lord.'],
  ['ALL: Lord, have mercy. (Three times)','ALL: Lord, have mercy.']
 ];
 for(const [source,expected] of cases){
  assert.equal(F.displayPrayer(source),expected);
  assert.equal(F.instruction(source),false,'do not hide printed spoken responses');
  assert.equal(F.role(source)?.kind,'all');
 }
 assert.equal(F.displayPrayer('Lord, have mercy. (Three times more, if desired.)'),
  'Lord, have mercy. (Three times more, if desired.)');
 assert.equal(F.displayPrayer('All: Lord, have mercy. (To be repeated after each petition.) Then another prayer.'),
  'All: Lord, have mercy. (To be repeated after each petition.) Then another prayer.');
});






test('Newton optional Apolysis stays collapsed and renders three spoken mercies if opened',()=>{
 const source=[{lines:[
  'A P O L Y S I S',
  'Priest: Glory to You, Christ God, our hope, glory to You.',
  'Optional:',
  'All: Glory be to the Father, and to the Son, and to the Holy Spirit, now and always and forever and ever. Amen.',
  'Lord, have mercy. (Three times)',
  'Give the blessing, Master, in the name of the Lord.',
  'On Sundays and Feast days:',
  'Priest: May Christ our True God save us.'
 ]}];
 source.newton2009=true;
 assert.equal(F.normalize(source[0].lines[0]),'Apolysis');
 assert.equal(F.heading(source[0].lines[0]),true);
 const snapshot=JSON.stringify(source),found=F.newtonOptionalPetitions(source);
 assert.deepEqual([...found.starts],['0:2']);
 assert.deepEqual([...found.lines],['0:3','0:4','0:5']);
 assert.deepEqual([...found.triples],['0:4']);
 assert.equal(found.labels.get('0:2'),'Optional dismissal responses');
 assert.equal(F.displayPrayer('Lord, have mercy. Lord, have mercy. Lord, have mercy.'),
  'Lord, have mercy. Lord, have mercy. Lord, have mercy.');
 assert.equal(JSON.stringify(source),snapshot,'saved source remains unchanged');
 const unknown=source.map(p=>({...p,lines:p.lines.slice()}));
 assert.equal(F.newtonOptionalPetitions(unknown).starts.size,0);
 for(const missing of ['Optional:','On Sundays and Feast days:','Lord, have mercy. (Three times)']){
  const changed=source.map(p=>({...p,lines:p.lines.filter(s=>s!==missing)}));
  changed.newton2009=true;
  assert.equal(F.newtonOptionalPetitions(changed).starts.size,0,'incomplete block cannot be regrouped: '+missing);
 }
 const changed=source.map(p=>({...p,lines:p.lines.slice()}));changed.newton2009=true;
 changed[0].lines[4]='Lord, have mercy. (Twice)';
 assert.equal(F.newtonOptionalPetitions(changed).triples.size,0,'another repetition count must not be guessed');
});

test('Newton optional blocks are identified only with their complete exact petition sequence',()=>{
 const source=[{lines:[
  'Litany of the Gifts',
  'Deacon: Let us complete our prayer to the Lord.',
  'All: Lord, have mercy.',
  'Deacon: For the precious gifts here offered, let us pray to the Lord.',
  'Optional:',
  'For this holy house and those who enter it with faith, reverence and fear of God, let us pray to the Lord.',
  'For our deliverance from all affliction, wrath, danger and need, let us pray to the Lord.',
  'Help us, save us, have mercy on us and protect us, O God, by Your grace.',
  'The Priest prays the following prayer:'
 ]},{lines:[
  'Prayer of Offering','Priest: Fixture prayer of offering.',
  'Preparation for Holy Communion',
  'Deacon: Now that we have remembered all the saints, let us pray to the Lord.',
  'All: Lord, have mercy.',
  'For the precious gifts here offered and sanctified, let us pray to the Lord.',
  'That our God who loves mankind may send down His divine grace, let us pray.',
  'Optional:'
 ]},{lines:[
  'For our deliverance from all affliction, wrath, danger and need, let us pray to the Lord.',
  'Help us, save us, have mercy on us and protect us, O God, by Your grace.',
  'The Aitesis','All: Grant this, O Lord.'
 ]}];
 source.newton2009=true;
 const snapshot=JSON.stringify(source),groups=F.newtonOptionalPetitions(source);
 assert.deepEqual([...groups.starts],['0:4','1:7']);
 assert.deepEqual([...groups.lines],['0:5','0:6','0:7','0:8','2:0','2:1']);
 assert.equal(JSON.stringify(source),snapshot,'original book remains intact');
 const unknown=source.map(p=>({...p,lines:p.lines.slice()}));
 assert.equal(F.newtonOptionalPetitions(unknown).lines.size,0,'unknown book has no source-specific grouping');
 const changed=source.map(p=>({...p,lines:p.lines.slice()}));changed.newton2009=true;
 changed[0].lines[6]='For an unverified optional intention, let us pray to the Lord.';
 const guarded=F.newtonOptionalPetitions(changed);
 assert.equal(guarded.lines.has('0:5'),false,'incomplete Gifts group must not be altered');
 assert.equal(guarded.lines.has('2:0'),true,'independent verified Communion group may still be recognized');
 const missing=source.map(p=>({...p,lines:p.lines.filter(s=>s!=='Prayer of Offering')}));missing.newton2009=true;
 assert.equal(F.newtonOptionalPetitions(missing).starts.has('0:4'),false,'the next required heading is a necessary boundary');
});

test('Newton Litany of Peace expands the ten unambiguous after-each-petition responses',()=>{
 const source=[{lines:[
  'The Litany of Peace',
  'Deacon: In peace let us pray to the Lord.',
  'All: Lord, have mercy. (To be repeated after each petition)',
  'For peace from on high and the salvation of our souls, let us pray to the Lord.',
  'For peace in the whole world, the well-being of the holy Churches of God, let us pray to the Lord.',
  'For this holy house and for those who enter it with faith, let us pray to the Lord.',
  'For (our Father and Patriarch N., if present,) our Father and (Arch)Bishop N., let us pray to the Lord.',
  'For the government and for the armed forces, let us pray to the Lord.'
 ]},{lines:[
  'For this city, for every city and country place, let us pray to the Lord.',
  'For favorable weather, an abundance of the fruits of the earth, let us pray to the Lord.',
  'For the travelers by sea, air and land, for the sick and captives, let us pray to the Lord.',
  'For our deliverance from all affliction, wrath, danger and need, let us pray to the Lord.',
  'Help us, save us, have mercy on us and protect us, O God, by Your grace.',
  'Let us remember our all-\u00ad\u2010\u2011holy, spotless, most highly blessed and glorious Lady the Theotokos.',
  'All: To You, O Lord.',
  'Priest: For all glory, honor and worship are Your due.'
 ]}];
 source.newton2009=true;
 const snapshot=JSON.stringify(source);
 const result=F.expandNewtonPeaceLitany(source),lines=result.flatMap(part=>part.lines);
 assert.equal(lines.filter(s=>/^All: Lord, have mercy/.test(s)).length,11);
 assert.equal(lines.filter(s=>s==='All: Lord, have mercy.').length,10);
 assert.equal(lines.filter(s=>s==='All: To You, O Lord.').length,1);
 assert.equal(result.newton2009,true);
 assert.equal(JSON.stringify(source),snapshot);
 assert.strictEqual(F.expandNewtonPeaceLitany(result),result,'idempotent after expansion');
 const unrecognized=source.map(part=>({...part,lines:[...part.lines]}));
 assert.strictEqual(F.expandNewtonPeaceLitany(unrecognized),unrecognized);
 const removed=source.map(part=>({...part,lines:part.lines.filter(s=>!s.startsWith('For favorable weather'))}));
 removed.newton2009=true;
 assert.strictEqual(F.expandNewtonPeaceLitany(removed),removed,'missing petition must fail closed');
 const alternative=source.map(part=>({...part,lines:[...part.lines]}));alternative.newton2009=true;
 alternative[0].lines[6]='For another intention, let us pray to the Lord.';
 assert.strictEqual(F.expandNewtonPeaceLitany(alternative),alternative);
 const already=source.map(part=>({...part,lines:[...part.lines]}));already.newton2009=true;
 already[1].lines.splice(1,0,'All: Lord, have mercy.');
 assert.strictEqual(F.expandNewtonPeaceLitany(already),already,'existing response must not be doubled');
 const noClose=source.map(part=>({...part,lines:part.lines.filter(s=>s!=='All: To You, O Lord.')}));noClose.newton2009=true;
 assert.strictEqual(F.expandNewtonPeaceLitany(noClose),noClose,'distinct concluding response required');
});

test('Newton 2009 Ektene expands eight threefold responses for the printed default petitions only',()=>{
 const source=[{lines:[
  'T H E E K T E N E','(Ecumenic Petitions)',
  'Deacon: Let us all say with our whole soul and our whole mind, let us all say:',
  'All: Lord, have mercy. (three times -\u00ad\u2010\u2011 to be repeated after each petition.)',
  'Lord Almighty, God of our fathers, we pray to You, hear us and have mercy.',
  'Have mercy on us, O God, in Your great mercy, we pray to You, hear us and have mercy.',
  'After the third petition, some other appropriate ecumenic petitions may be said. If used, four petitions below would be omitted.',
  'Again, we pray for our Father and (Arch)Bishop N. and for his honorable presbyterate.',
  '* In case there are guest Patriarchs or Bishops, they will be mentioned by name.'
 ]},{lines:[
  'Again, we pray for the priests, the deacons, the monks, the nuns and all our brothers and sisters in Christ.',
  'Again, we pray for mercy, life, peace, health, salvation and forgiveness.',
  'Again, we pray for the blessed and ever to be remembered founders of this holy church.',
  'Again, we pray for those who bear offerings, those who do good works and all the people here present.',
  'Deacon: Wisdom.','Prayer of the Ektene','Priest: Fixture concluding prayer.'
 ]}];
 source.newton2009=true;
 assert.equal(F.heading('T H E E K T E N E'),true);
 assert.equal(F.heading('Prayer of the Ektene'),true);
 assert.equal(F.normalize('The Ektene (Ecumenic Petitions)'),'The Ektene');
 assert.equal(F.normalize('Prayer of the Ektene (said quietly by the Priest):'),'Prayer of the Ektene');
 assert.equal(F.instruction('(said quietly by the Priest)'),true);
 assert.equal(F.instruction(source[0].lines[6]),true);
 assert.equal(F.instruction(source[0].lines[8]),true);
 const before=JSON.stringify(source);
 const expanded=F.expandNewtonEktene(source),rows=expanded.flatMap(p=>p.lines);
 assert.equal(expanded.newton2009,true);
 assert.equal(rows.filter(s=>s==='All: Lord, have mercy. Lord, have mercy. Lord, have mercy.').length,8);
 assert.equal(rows.filter(s=>/^Again, we pray\b/.test(s)).length,5);
 assert.equal(JSON.stringify(source),before,'the private source is unchanged');
 assert.strictEqual(F.expandNewtonEktene(expanded),expanded,'expansion is idempotent');
 const unknown=source.map(p=>({...p,lines:[...p.lines]}));
 assert.strictEqual(F.expandNewtonEktene(unknown),unknown,'other books must be unaffected');
 const minusFinal=source.map(p=>({...p,lines:p.lines.filter(s=>!s.startsWith('Again, we pray for those who bear'))}));
 minusFinal.newton2009=true;
 assert.strictEqual(F.expandNewtonEktene(minusFinal),minusFinal,'mandatory final petition required');
 const replacement=source.map(p=>({...p,lines:p.lines.slice()}));replacement.newton2009=true;
 replacement[0].lines[7]='Again, we pray for another special intention.';
 assert.strictEqual(F.expandNewtonEktene(replacement),replacement,'custom alternatives must not be assigned inferred responses');
 const preExpanded=source.map(p=>({...p,lines:p.lines.slice()}));preExpanded.newton2009=true;
 preExpanded[1].lines.splice(1,0,'All: Lord, have mercy.');
 assert.strictEqual(F.expandNewtonEktene(preExpanded),preExpanded,'existing answers must not be doubled');
 const changedCue=source.map(p=>({...p,lines:p.lines.slice()}));changedCue.newton2009=true;
 changedCue[0].lines[3]='All: Lord, have mercy.';
 assert.strictEqual(F.expandNewtonEktene(changedCue),changedCue,'missing source directive must fail closed');
});

test('Newton 2009 Aitesis faithfully expands five printed repeat-after-each-petition responses',()=>{
 const original=[{lines:[
  'T H E A I T E S I S','That this day be without sin, let us ask the Lord.',
  'All: Grant this, O Lord. (To be repeated after each petition.)',
  'For an angel of peace, let us ask the Lord.',
  'For forgiveness of sins, let us ask the Lord.',
  'For peace in the world, let us ask the Lord.',
  'That our life may be peaceful, let us ask the Lord.',
  'That our end may be painless, let us ask.'
 ]},{lines:[
  'Let us ask for unity of faith and commend our whole life to Christ God.',
  'All: To You, O Lord.','The Lord’s Prayer'
 ]}];
 original.newton2009=true;
 const saved=JSON.stringify(original);
 assert.equal(F.normalize('T H E A I T E S I S'),'The Aitesis');
 assert.equal(F.heading('T H E A I T E S I S'),true);
 const displayed=F.expandNewtonAitesis(original),lines=displayed.flatMap(p=>p.lines);
 assert.equal(lines.filter(s=>/^All: Grant this, O Lord/.test(s)).length,6);
 assert.equal(lines.filter(s=>s==='All: Grant this, O Lord.').length,5);
 assert.equal(lines.filter(s=>s==='All: To You, O Lord.').length,1);
 assert.equal(displayed.newton2009,true);
 assert.equal(JSON.stringify(original),saved,'source must remain unchanged');
 assert.strictEqual(F.expandNewtonAitesis(displayed),displayed,'idempotent');
 const unrecognized=original.map(p=>({...p,lines:p.lines.slice()}));
 assert.strictEqual(F.expandNewtonAitesis(unrecognized),unrecognized,'unrecognized source unaffected');
 const incomplete=original.map(p=>({...p,lines:p.lines.filter(s=>!s.includes('angel of peace'))}));
 incomplete.newton2009=true;
 assert.strictEqual(F.expandNewtonAitesis(incomplete),incomplete,'missing petition prevents guessing');
 const already=original.map(p=>({...p,lines:p.lines.slice()}));already.newton2009=true;
 already[0].lines.splice(4,0,'All: Grant this, O Lord.');
 assert.strictEqual(F.expandNewtonAitesis(already),already,'already expanded source unaffected');
});

test('Newton communion-preparation adds only two mandatory responses before Optional',()=>{
 const source=[{lines:[
  'P R E P A R A T I O N F O R H O L Y C O M M U N I O N',
  'Deacon: Now that we have remembered all the saints, again and again in peace let us pray to the Lord.',
  'All: Lord, have mercy. (To be repeated after each petition)',
  'For the precious gifts here offered and sanctified, let us pray to the Lord.'
 ]},{lines:[
  'That our God who loves mankind, having received these gifts on His holy and mystical altar in Heaven, may send down His divine grace and the gift of the Holy Spirit, let us pray.',
  'Optional:',
  'For our deliverance from all affliction, let us pray to the Lord.',
  'Help us, save us, have mercy on us and protect us, O God, by Your grace.',
  'T H E A I T E S I S',
  'All: Grant this, O Lord. (To be repeated after each petition.)'
 ]}];
 source.newton2009=true;
 const snapshot=JSON.stringify(source);
 assert.equal(F.normalize(source[0].lines[0]),'Preparation for Holy Communion');
 assert.equal(F.heading(source[0].lines[0]),true);
 assert.equal(F.normalize('L I T A N Y O F T H E G I F T S'),'Litany of the Gifts');
 const result=F.expandNewtonCommunionPreparation(source),lines=result.flatMap(p=>p.lines);
 assert.equal(lines.filter(x=>/^All: Lord, have mercy/.test(x)).length,3);
 assert.equal(lines.filter(x=>x==='All: Lord, have mercy.').length,2);
 assert.ok(lines.includes('For our deliverance from all affliction, let us pray to the Lord.'),
  'optional source wording is preserved but must not be expanded automatically');
 assert.equal(JSON.stringify(source),snapshot,'source text must be immutable');
 assert.equal(result.newton2009,true);
 assert.strictEqual(F.expandNewtonCommunionPreparation(result),result,'re-expansion must be disabled');
 const unknown=source.map(p=>({...p,lines:p.lines.slice()}));
 assert.strictEqual(F.expandNewtonCommunionPreparation(unknown),unknown,'unknown saved edition cannot receive responses');
 for(const fragment of ['Optional:','For the precious gifts here offered and sanctified, let us pray to the Lord.']){
  const altered=source.map(p=>({...p,lines:p.lines.filter(x=>x!==fragment)}));altered.newton2009=true;
  assert.strictEqual(F.expandNewtonCommunionPreparation(altered),altered,'incomplete source must fail closed: '+fragment);
 }
 const preExpanded=source.map(p=>({...p,lines:p.lines.slice()}));preExpanded.newton2009=true;
 preExpanded[1].lines.splice(1,0,'All: Lord, have mercy.');
 assert.strictEqual(F.expandNewtonCommunionPreparation(preExpanded),preExpanded,
  'pre-existing responses must never be doubled');
});

test('Newton Litany of the Gifts repeats its mandatory answer without appointing optional petitions',()=>{
 const source=[{lines:[
  'L I T A N Y O F T H E G I F T S',
  'Deacon: Let us complete our prayer to the Lord.',
  'All: Lord, have mercy. (To be repeated after each petition)',
  'Deacon: For the precious gifts here offered, let us pray to the Lord.',
  'Optional:',
  'For this holy house and those who enter it with faith, let us pray to the Lord.',
  'For our deliverance from all affliction, let us pray to the Lord.',
  'Help us, save us, have mercy on us and protect us, O God, by Your grace.'
 ]},{lines:['Prayer of Offering','Priest: Lord God Almighty who alone are holy.']}];
 source.newton2009=true;
 const snapshot=JSON.stringify(source);
 assert.equal(F.normalize(source[0].lines[0]),'Litany of the Gifts');
 assert.equal(F.normalize('P R A Y E R O F O F F E R I N G'),'Prayer of Offering');
 const expanded=F.expandNewtonGiftLitany(source);
 const lines=expanded.flatMap(x=>x.lines);
 assert.equal(lines.filter(x=>/^All: Lord, have mercy/.test(x)).length,2);
 assert.equal(lines.filter(x=>x==='All: Lord, have mercy.').length,1);
 assert.ok(lines.includes('For our deliverance from all affliction, let us pray to the Lord.'),
  'optional source prayer is not deleted');
 assert.equal(JSON.stringify(source),snapshot,'saved source words cannot be changed');
 assert.strictEqual(F.expandNewtonGiftLitany(expanded),expanded,'cannot repeat a previously expanded passage');
 const unrecognized=source.map(x=>({...x,lines:x.lines.slice()}));
 assert.strictEqual(F.expandNewtonGiftLitany(unrecognized),unrecognized);
 const missing=source.map(x=>({...x,lines:x.lines.filter(s=>s!=='Optional:')}));missing.newton2009=true;
 assert.strictEqual(F.expandNewtonGiftLitany(missing),missing,'without optional boundary, fail closed');
 const already=source.map(x=>({...x,lines:x.lines.slice()}));already.newton2009=true;
 already[0].lines.splice(4,0,'All: Lord, have mercy.');
 assert.strictEqual(F.expandNewtonGiftLitany(already),already,'do not duplicate source-expanded answers');
});


test('ambiguous extracted Melkite Trisagion choices are not displayed as prayer',()=>{
 const data=require('../melkite-propers-2026.json').days;
 for(const iso of ['2026-04-23','2026-04-25'])
  assert.deepEqual(F.properPrayerLines(data[iso].groups.troparia),[]);
 assert.deepEqual(F.properPrayerLines(['A genuine prayer.']),['A genuine prayer.']);
});


test('opening-blessing cleanup never mutates later cached source sections',()=>{
 const source=[{heading:'Cover',lines:['PRIEST: Blessed is the Kingdom.','ALL: Amen.']},
  {heading:'Later',lines:['STAND','DEACON: Fixture petition.','ALL: Fixture response.']}];
 source.edmonton2012=true;
 const before=JSON.stringify(source),output=F.startAtOpeningBlessing(source);
 assert.equal(JSON.stringify(source),before,'input remains unchanged');
 assert.deepEqual(output[2].lines,['DEACON: Fixture petition.','ALL: Fixture response.']);
 assert.notStrictEqual(output[2],source[1]);
 output[2].lines.push('fixture');
 assert.equal(JSON.stringify(source),before,'output edits cannot change input');
 assert.equal(output.edmonton2012,true);
});


test('Edmonton first antiphon separates source-marked Sundays and weekdays',()=>{
 const row=text=>({text,page:39});
 const verse=['VERSE: Fixture verse one.','ALL: Fixture reply one.','VERSE: Fixture verse two.','ALL: Fixture reply two.','VERSE: Fixture verse three.','ALL: Fixture reply three.'];
 const source=['First Antiphon','Major Feast Days:','See propers.','Sundays:',...verse,'Weekdays:',...verse].map(row);
 const snapshot=JSON.stringify(source),out=F.edmontonFirstAntiphonRows(source);
 assert.deepEqual(out.filter(x=>x.alternative==='sunday').map(x=>x.text),verse);
 assert.deepEqual(out.filter(x=>x.alternative==='weekday').map(x=>x.text),verse);
 assert.equal(JSON.stringify(source),snapshot);
 assert.deepEqual(out.filter(x=>!x.alternative).map(x=>x.text),['First Antiphon']);
 for(const index of [0,3,4,10,11]){
  const partial=source.filter((_,i)=>i!==index);
  assert.strictEqual(F.edmontonFirstAntiphonRows(partial),partial,'incomplete source fails closed');
 }
});


test('Edmonton entrance antiphon also keeps Sunday and weekday forms separate',()=>{
 const row=text=>({text,page:45});
 const verses=['VERSE: Fixture first.','ALL: Fixture one.','VERSE: Fixture second.','ALL: Fixture two.','VERSE: Fixture third.','ALL: Fixture three.'];
 const rows=['Entrance Antiphon','Major Feast Days:','See propers.','Sundays:',...verses,'Weekdays:',...verses].map(row);
 const out=F.edmontonFirstAntiphonRows(rows,'Entrance Antiphon');
 assert.deepEqual(out.filter(x=>x.alternative==='sunday').map(x=>x.text),verses);
 assert.deepEqual(out.filter(x=>x.alternative==='weekday').map(x=>x.text),verses);
 assert.strictEqual(F.edmontonFirstAntiphonRows(rows,'First Antiphon'),rows);
 assert.strictEqual(F.edmontonFirstAntiphonRows(rows,'Unknown'),rows);
});


test('Edmonton antiphon display removes only source page directions',()=>{
 const row=text=>({text});
 for(const [title,note] of [['First Antiphon','(Hymn to Christ, p. 39)'],['Entrance Antiphon','(Continue on p. 47)']]){
  const words=['VERSE: Fixture first.','ALL: One.','VERSE: Fixture second.','ALL: Two.','VERSE: Fixture third.','ALL: Three. '+note];
  const rows=[title,'Major Feast Days:','See propers.','Sundays:',...words,'Weekdays:',...words].map(row);
  const snapshot=JSON.stringify(rows),out=F.edmontonFirstAntiphonRows(rows,title);
  assert.equal(out.filter(r=>/ALL: Three\./.test(r.text)).length,2);
  assert.ok(out.every(r=>!r.text.includes(note)));
  assert.deepEqual(out.filter(r=>!r.alternative).map(r=>r.text),[title]);
  assert.equal(JSON.stringify(rows),snapshot,'source rows remain unchanged');
  const missing=rows.filter(r=>r.text!=='Weekdays:');
  assert.strictEqual(F.edmontonFirstAntiphonRows(missing,title),missing,'unrecognized pages are unchanged');
 }
});


test('Edmonton Great Litany petition remains one speaker across English page break',()=>{
 const a='DCN 1: For the seafarers and travellers, for the sick';
 const b='and the suffering, for those held captive, and for their salvation, let us pray to the Lord.';
 const source=[{lines:['ALL: Prior response.',a]},{lines:[b,'ALL: Lord, have mercy.','DCN 1: Next petition.']}];
 source.edmonton2012=true;
 const before=JSON.stringify(source),out=F.joinEdmontonGreatLitanyPageBreak(source);
 assert.equal(out[0].lines[1],a+' '+b);
 assert.deepEqual(out[1].lines,['ALL: Lord, have mercy.','DCN 1: Next petition.']);
 assert.equal(out.edmonton2012,true);assert.equal(JSON.stringify(source),before);
 assert.strictEqual(F.joinEdmontonGreatLitanyPageBreak(out),out,'idempotent');
 const unknown=source.map(x=>({...x,lines:[...x.lines]}));
 assert.strictEqual(F.joinEdmontonGreatLitanyPageBreak(unknown),unknown);
 const incomplete=[{lines:[a]},{lines:[b,'ALL: Another response.']}];incomplete.edmonton2012=true;
 assert.strictEqual(F.joinEdmontonGreatLitanyPageBreak(incomplete),incomplete);
 const duplicate=[...source,...source.map(x=>({...x,lines:[...x.lines]}))];duplicate.edmonton2012=true;
 assert.strictEqual(F.joinEdmontonGreatLitanyPageBreak(duplicate),duplicate);
});


test('Edmonton Creed stays a single congregational prayer across pages',()=>{
 const a='ALL: I believe in one God, the Father, the Almighty. Fixture Creed. He suffered, died and';
 const b='was buried. Fixture Creed continuation and the life of the world to come. Amen.';
 const source=[{lines:['Confession of Faith',a]},{lines:[b,'Blessing','DCN 2: Fixture petition.']}];source.edmonton2012=true;
 const before=JSON.stringify(source),out=F.joinEdmontonCreedPageBreak(source);
 assert.equal(out[0].lines[1],a+' '+b);assert.deepEqual(out[1].lines,['Blessing','DCN 2: Fixture petition.']);
 assert.equal(out.edmonton2012,true);assert.equal(JSON.stringify(source),before);
 assert.strictEqual(F.joinEdmontonCreedPageBreak(out),out);
 const missing=source.map(x=>({...x,lines:[...x.lines]}));missing.edmonton2012=true;missing[1].lines[1]='Other heading';
 assert.strictEqual(F.joinEdmontonCreedPageBreak(missing),missing);
 const unknown=source.map(x=>({...x,lines:[...x.lines]}));assert.strictEqual(F.joinEdmontonCreedPageBreak(unknown),unknown);
 const duplicate=[...source,...source.map(x=>({...x,lines:[...x.lines]}))];duplicate.edmonton2012=true;
 assert.strictEqual(F.joinEdmontonCreedPageBreak(duplicate),duplicate);
});


test('Edmonton Church commemoration retains bishop and response across pages',()=>{
 const a='BISHOP: Among the first, remember, O Lord, the fixture hierarchs, who may live in peace, safety, honour and health';
 const b='for many years, and rightly impart the word of Your truth.';
 const source=[{lines:['Prayer for the Church',a]},{lines:[b,'ALL: And remember all men and all women.','BISHOP: Fixture next prayer.']}];source.edmonton2012=true;
 const before=JSON.stringify(source),out=F.joinEdmontonChurchPrayerPageBreak(source);
 assert.equal(out[0].lines[1],a+' '+b);assert.deepEqual(out[1].lines,['ALL: And remember all men and all women.','BISHOP: Fixture next prayer.']);
 assert.equal(out.edmonton2012,true);assert.equal(JSON.stringify(source),before);assert.strictEqual(F.joinEdmontonChurchPrayerPageBreak(out),out);
 const altered=source.map(x=>({...x,lines:[...x.lines]}));altered.edmonton2012=true;altered[1].lines[1]='ALL: Another response.';
 assert.strictEqual(F.joinEdmontonChurchPrayerPageBreak(altered),altered);
 const unknown=source.map(x=>({...x,lines:[...x.lines]}));assert.strictEqual(F.joinEdmontonChurchPrayerPageBreak(unknown),unknown);
 const duplicate=[...source,...source.map(x=>({...x,lines:[...x.lines]}))];duplicate.edmonton2012=true;assert.strictEqual(F.joinEdmontonChurchPrayerPageBreak(duplicate),duplicate);
});


test('Edmonton Lord’s Prayer stays with the congregation over the page break',()=>{
 const a='ALL: Our Father, Who art in heaven. Fixture prayer and forgive us our';
 const b='trespasses as we forgive those who trespass against us. And lead us not into temptation but deliver us from evil.';
 const source=[{lines:[a]},{lines:[b,'BISHOP: For the kingdom, the power, and the glory are Yours.','ALL: Amen.']}];source.edmonton2012=true;
 const before=JSON.stringify(source),out=F.joinEdmontonLordsPrayerPageBreak(source);
 assert.equal(out[0].lines[0],a+' '+b);assert.deepEqual(out[1].lines,['BISHOP: For the kingdom, the power, and the glory are Yours.','ALL: Amen.']);
 assert.equal(JSON.stringify(source),before);assert.equal(out.edmonton2012,true);assert.strictEqual(F.joinEdmontonLordsPrayerPageBreak(out),out);
 const altered=source.map(x=>({...x,lines:[...x.lines]}));altered.edmonton2012=true;altered[1].lines[1]='BISHOP: Other doxology.';
 assert.strictEqual(F.joinEdmontonLordsPrayerPageBreak(altered),altered);
 const unknown=source.map(x=>({...x,lines:[...x.lines]}));assert.strictEqual(F.joinEdmontonLordsPrayerPageBreak(unknown),unknown);
 const duplicate=[...source,...source.map(x=>({...x,lines:[...x.lines]}))];duplicate.edmonton2012=true;assert.strictEqual(F.joinEdmontonLordsPrayerPageBreak(duplicate),duplicate);
});
