const {test}=require('node:test'),assert=require('node:assert/strict'),M=require('../roman-missal.js');
test('private Missal headings match saints, Sundays and weekday seasonal prayers',()=>{
 const sections=[
  {title:'November 12 Saint Josaphat, Bishop and Martyr Memorial'},
  {title:'THIRTY-THIRD SUNDAY IN ORDINARY TIME'},
  {title:'THIRTY-THIRD WEEK IN ORDINARY TIME'},
  {title:'Advent 1 | Monday'},
  {title:'SECOND SUNDAY OF EASTER (or of Divine Mercy)'},
  {title:'Sunday after the Epiphany of the Lord THE BAPTISM OF THE LORD Feast'},
  {title:'Last Sunday in Ordinary Time OUR LORD JESUS CHRIST, KING OF THE UNIVERSE Solemnity'},
  {title:'At Mass during the Day',context:'EASTER TIME'},
  {title:'Pentecost: at the Mass during the Day'},
  {title:'PENTECOST SUNDAY Solemnity At the Vigil Mass - Extended form'},
  {title:'COMMON OF ALL SAINTS'},
  {title:'November 1 ALL SAINTS Solemnity'}
 ];
 for(const [title,page] of [['Saint Josaphat, Bishop and Martyr',1],['33rd Sunday in Ordinary Time',2],['Monday of the 33rd Week in Ordinary Time',3],['Monday of the 1st Week of Advent',4],['Second Sunday of Easter (Sunday of Divine Mercy)',5],['The Baptism of the Lord',6],['Our Lord Jesus Christ, King of the Universe',7],['Easter Sunday of the Resurrection of the Lord',8],['Pentecost Sunday',9],['All Saints',12]])assert.deepEqual(M.match(sections,title),[page],title);
 assert.deepEqual(M.match(sections,'Saint Martin of Tours, Bishop'),[]);
 assert.deepEqual(M.match([{title:'All Saints'},{title:'All Saints'}],'All Saints'),[],'ambiguous sections are not guessed');
 const christmas='Nativity of the Lord (Christmas)';
 assert.deepEqual(M.lookup([{title:christmas},{title:christmas}],christmas),
  {selection:null,ambiguous:true},'a choice is available when both forms match');
 assert.deepEqual(M.lookup([],christmas),
  {selection:null,ambiguous:false},'a missing section remains a separate state');
 assert.deepEqual(M.order([{title:'The Introductory Rites'}]),[{title:'The Introductory Rites',page:1}]);
});

test('GIRM 53/68: ordinary Roman Mass shows Gloria and Creed by calendar rank and season',()=>{
 const L=require('../calendar.js');
 const options={epiphany:'sunday',ascension:'thursday',corpus:'sunday'};
 const cases=[
  [[2027,1,11],false,false,'ordinary Monday'],
  [[2026,11,15],true,true,'Ordinary Sunday'],
  [[2026,12,13],false,true,'Advent Sunday'],
  [[2027,3,7],false,true,'Lenten Sunday'],
  [[2026,12,8],true,true,'Immaculate Conception solemnity'],
  [[2027,2,2],true,false,'Presentation feast'],
  [[2027,5,6],true,true,'Boston Thursday Ascension']
 ];
 for(const [date,gloria,creed,description] of cases){
  const day=L.roman(L.D(...date),options);
  assert.deepEqual(M.ordinaryParts({rank:day.rank,season:day.season}),{gloria,creed},
    description+': '+day.rank+'/'+day.season);
 }
 assert.deepEqual(M.ordinaryParts({rank:'',season:''}),{gloria:false,creed:false},
   'unknown local Mass must not presume an obligation');
 assert.deepEqual(M.ordinaryParts({rank:'Sunday',season:'Holy Week'}),{gloria:false,creed:true},
   'Palm Sunday uses Creed but not Gloria');
});

test('first week in Ordinary Time preserves separate antiphons from a private Missal',()=>{
 const L=require('../calendar.js');
 const day=L.roman(L.D(2027,1,11));
 const part={title:'FIRST WEEK IN ORDINARY TIME',blocks:[
  {tag:'h4',text:'Entrance Antiphon'},
  {tag:'p',kind:'instruction',text:'Fixture entrance direction.'},
  {tag:'p',text:'Fixture entrance antiphon.'},
  {tag:'h4',text:'Collect'},
  {tag:'p',text:'Fixture collect.'},
  {tag:'h4',text:'Prayer over the Offerings'},
  {tag:'p',text:'Fixture offerings prayer.'},
  {tag:'h4',text:'Communion Antiphon Ps 36: 10'},
  {tag:'p',text:'Fixture first communion antiphon.'},
  {tag:'p',text:'Or: Jn 10: 10',kind:'instruction'},
  {tag:'p',text:'Fixture alternative communion antiphon.'},
  {tag:'h4',text:'Prayer after Communion'},
  {tag:'p',text:'Fixture concluding prayer.'},
  {tag:'p',kind:'instruction',text:'Or: see another section.'}
 ]};
 assert.deepEqual(M.match([part],day.title),[1]);
 const proper=M.propers(part);
 const displayed=Object.fromEntries(Object.entries(proper).map(([key,blocks])=>[key,blocks.map(block=>block.text)]));
 assert.deepEqual(displayed,{
  entrance:['Fixture entrance antiphon.'],
  collect:['Fixture collect.'],
  offerings:['Fixture offerings prayer.'],
  communion:['Fixture first communion antiphon.','Or: Jn 10: 10','Fixture alternative communion antiphon.'],
  after:['Fixture concluding prayer.']
 });
 assert.equal(M.prayers(part).blocks.some(block=>block.kind==='instruction'),false);
});

test('Pentecost daytime preview isolates explicitly marked forms in a saved Missal',()=>{
 const L=require('../calendar.js');
 const day=L.roman(L.D(2027,5,16));
 assert.equal(day.title,'Pentecost Sunday');
 const vigilText={tag:'p',text:'Fixture vigil collect.'};
 const dayText={tag:'p',text:'Fixture daytime collect.'};
 const heading=text=>({tag:'h4',text});
 const combined={title:day.title,blocks:[
  heading('At the Vigil Mass'),heading('Extended form'),heading('Collect'),vigilText,
  heading('At the Mass during the Day'),heading('Collect'),dayText,
  heading('Vigil Mass — Simple form'),heading('Collect'),vigilText
 ]};
 const preview=M.select([combined],day.title);
 assert.equal(preview.page,1);
 assert.deepEqual(M.propers(preview.part).collect,[dayText]);
 assert.equal(combined.blocks.length,10,'original book remains intact');
 assert.equal(M.select([{...combined,blocks:combined.blocks.slice(0,4)}],day.title),null,
  'a vigil-only group cannot supply the daytime Mass');
 assert.equal(M.select([{...combined,blocks:[...combined.blocks,heading('At the Mass during the Day'),dayText]}],day.title),null,
  'multiple daytime sections require a manual choice');
 const separate={title:'At the Mass during the Day',context:'Pentecost Sunday',blocks:[heading('Collect'),dayText]};
 assert.equal(M.select([separate],day.title).part,separate);
 assert.equal(M.select([{...separate,context:'Easter Time'}],day.title),null,
  'a generic daytime heading needs the correct context');
 assert.equal(M.select([combined,separate],day.title),null,
  'duplicate eligible sections are not selected automatically');
});
