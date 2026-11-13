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
