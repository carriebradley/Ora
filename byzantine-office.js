/* Daily office guidance. Facts and source links, not a translation of the Horologion. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.ByzantineOffice=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
 const outlines={
  morning:['Opening prayers; the Six Psalms (3, 37, 62, 87, 102, 142).','Litanies, God is the Lord (or Alleluia), and appointed troparia; kathismata and sessional hymns.','On appointed days: polyeleos, Gospel and resurrection material.','Psalm 50, the appointed canon, praises, doxology, petitions and dismissal.'],
  evening:['Opening prayers and Psalm 103; litany and appointed kathisma.','Lord, I Have Cried (Psalms 140, 141, 129, 116) with the appointed stichera.','O Gladsome Light, prokeimenon and readings when appointed.','Petitions, aposticha, Song of Simeon, Trisagion, appointed troparia and dismissal.'],
  night:['Opening prayers; Psalms 50, 69 and 142.','Small doxology, Creed and appointed canon.','Trisagion, appointed kontakion, Prayer of the Hours, concluding prayers and forgiveness.']
 };
 function plan(kind,church,iso,pascha){
  const age=Math.round((Date.parse(iso+'T00:00:00Z')-Date.parse(pascha+'T00:00:00Z'))/86400000);
  const ukrainian=church!=='melkite';
  return {outlines:outlines[kind]||outlines.morning,heavenlyKing:age<0||age>=49,paschal:age>=0&&age<39,brightWeek:age>=0&&age<7,
   church:ukrainian?'Ukrainian Catholic · Edmonton':'Melkite Catholic · Newton',
   sources:ukrainian?[['Edmonton daily services',/^2026-/.test(iso)?'https://eeparchy.com/calendar/'+iso:'https://eeparchy.com/calendar']]:[['Melkite liturgical resources','https://melkite.org/liturgical-resources'],['Melkite Horologion · book information','https://store.melkite.org/product/horologion/']],
   note:kind==='night'?'This outline is Small Compline. Great Compline has a different order, including the Prayer of Manasseh; consult the typikon in Lent and on festal eves.':'The appointed hymns, psalm divisions and festal or Lenten variations must come from the selected church’s service books and daily propers.'};
 }
 return {plan};
});
