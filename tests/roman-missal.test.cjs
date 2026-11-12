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
