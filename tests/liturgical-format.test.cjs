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
