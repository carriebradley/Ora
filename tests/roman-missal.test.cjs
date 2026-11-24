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
