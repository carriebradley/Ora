const {test}=require('node:test');
const assert=require('node:assert/strict');
const LitCal=require('../calendar.js');
const Hours=require('../hours.js');
test('12 November 2026: Roman Week IV Lauds matches appointed psalm references',()=>{
 const d=LitCal.D(2026,11,12),sel=Hours.modernPsalmody(LitCal,d,'L');
 assert.equal(sel.pw,4);
 assert.equal(sel.dow,4);
 assert.equal(sel.items[0],'p142(1-11)'); // Vulgate 142 = modern Psalm 143
 assert.match(sel.items[1],/Isaiah 66:10-14/);
 assert.equal(sel.items[2],'p146'); // Vulgate 146 = modern Psalm 147
});
test('12 November 2026: Roman Week IV Vespers divides Psalm 144 into two parts',()=>{
 const d=LitCal.D(2026,11,12),sel=Hours.modernPsalmody(LitCal,d,'V');
 assert.equal(sel.pw,4);
 assert.deepEqual(sel.items.slice(0,2),['p143(1-8)','p143(9-15)']);
 assert.match(sel.items[2],/Revelation 11:17-18/);
 assert.match(sel.items[2],/Revelation 12:10-12/);
});

test('solemnities and feasts use Sunday Week I psalmody at Roman Lauds',()=>{
 const sundayOne=Hours.modernPsalmody(LitCal,LitCal.D(2026,11,29),'L').items;
 for(const date of [[2026,12,8],[2027,2,2],[2027,3,29],[2027,4,5],[2027,6,11]]){
   const selection=Hours.modernPsalmody(LitCal,LitCal.D(...date),'L');
   assert.equal(selection.festiveMorning,true,date.join('-'));
   assert.deepEqual(selection.items,sundayOne,date.join('-'));
 }
 const memorial=Hours.modernPsalmody(LitCal,LitCal.D(2026,11,12),'L');
 assert.equal(memorial.festiveMorning,false);
 assert.equal(memorial.items[0],'p142(1-11)');
});

test('ordinary Roman Vespers has two psalm portions plus a New Testament canticle',()=>{
 // These 20 weekday assignments are from the published four-week Psalter
 // reference table (Fr Felix Just SJ); inspect in a standard Ordinary Time cycle.
 const matrix=[
  [1,1,'p10','p14'],[1,2,'p19','p20(2-8,14)'],[1,3,'p26(1-6)','p26(7-14)'],[1,4,'p29','p31'],[1,5,'p40','p45'],
  [2,1,'p44(2-10)','p44(11-18)'],[2,2,'p48(2-13)','p48(14-21)'],[2,3,'p61','p66'],[2,4,'p71(2-11)','p71(12-19)'],[2,5,'p114','p120'],
  [3,1,'p122','p123'],[3,2,'p124','p130'],[3,3,'p125','p126'],[3,4,'p131(1-10)','p131(11-18)'],[3,5,'p134(1-12)','p134(13-21)'],
  [4,1,'p135(1-9)','p135(10-26)'],[4,2,'p136(1-6)','p137'],[4,3,'p138(1-12)','p138(13-18,23-24)'],[4,4,'p143(1-8)','p143(9-15)'],[4,5,'p144(1-13)','p144(13-21)']
 ];
 // Four consecutive weeks in January 2027 start with Week I on Jan 11.
 for(const [week,dow,first,second] of matrix){
  const day=LitCal.add(LitCal.D(2027,1,11),((week-1)*7)+(dow-1));
  const selected=Hours.modernPsalmody(LitCal,day,'V');
  assert.equal(selected.pw,week,day.toISOString());
  assert.equal(selected.items.length,3,day.toISOString());
  assert.equal(selected.items[0],first,day.toISOString());
  assert.equal(selected.items[1],second,day.toISOString());
  assert.match(selected.items[2],/^b:/,day.toISOString());
 }
});
