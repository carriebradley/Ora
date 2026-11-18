const {test}=require('node:test');
const assert=require('node:assert/strict');
const F=require('../liturgical-format.js');

test('Edmonton page-break repairs compose without changing the original service',()=>{
 const boundaries=[
  {
   join:'joinEdmontonGreatLitanyPageBreak',
   left:'DCN 1: For the seafarers and travellers, for the sick',
   right:'and the suffering, for those held captive, and for their salvation, let us pray to the Lord.',
   after:'ALL: Lord, have mercy.'
  },
  {
   join:'joinEdmontonCreedPageBreak',
   left:'ALL: I believe in one God, the Father, the Almighty. Fixture Creed. He suffered, died and',
   right:'was buried. Fixture Creed continuation and the life of the world to come. Amen.',
   after:'Blessing',
   following:'DCN 2: Fixture petition.'
  },
  {
   join:'joinEdmontonChurchPrayerPageBreak',
   left:'BISHOP: Among the first, remember, O Lord, the fixture hierarchs, who may live in peace, safety, honour and health',
   right:'for many years, and rightly impart the word of Your truth.',
   after:'ALL: And remember all men and all women.'
  },
  {
   join:'joinEdmontonLordsPrayerPageBreak',
   left:'ALL: Our Father, Who art in heaven. Fixture prayer and forgive us our',
   right:'trespasses as we forgive those who trespass against us. And lead us not into temptation but deliver us from evil.',
   after:'BISHOP: For the kingdom, the power, and the glory are Yours.'
  },
  {
   join:'joinEdmontonThanksgivingPageBreak',
   left:'DCN 1: Stand aright! Having received the divine, holy, immaculate, immortal, heavenly, and',
   right:'life-giving, awesome Mysteries of Christ, let us rightly give thanks to the Lord.',
   after:'ALL: Lord, have mercy.'
  },
  {
   join:'joinEdmontonCommunionPrayerPageBreak',
   left:'ALL: I believe, O Lord, and confess, that You are truly Christ. Fixture prayer. †Remember me, O Lord, when You come into Your kingdom.',
   right:'†Remember me, O Master, when You come into Your Kingdom. †Remember me, O Holy One, when You come into Your Kingdom. Fixture prayer. †I have sinned without number; forgive me, O Lord.',
   after:'Communion of the Clergy'
  }
 ];
 const headings=['Great Litany','Confession of Faith','Prayer for the Church','The Lord’s Prayer','Thanksgiving Litany','Prayer Before Holy Communion'];
 const sections=[];
 for(let i=0;i<boundaries.length;i++){
  const b=boundaries[i];
  sections.push({lines:[headings[i],b.left]});
  sections.push({lines:[b.right,b.after,...(b.following?[b.following]:[]),'PRIEST: Fixture boundary '+i+'.']});
 }
 sections.edmonton2012=true;
 const snapshot=JSON.stringify(sections);
 const joins=boundaries.map(b=>F[b.join]);
 for(const join of joins)assert.equal(typeof join,'function');
 const apply=input=>joins.reduce((current,join)=>join(current),input);
 const output=apply(sections);
 assert.equal(output.edmonton2012,true);
 assert.equal(JSON.stringify(sections),snapshot,'source sections must remain unchanged');
 for(let i=0;i<boundaries.length;i++){
  const b=boundaries[i],left=output[2*i],right=output[2*i+1];
  assert.equal(left.lines[1],b.left+' '+b.right,b.join+' must preserve the whole prayer and original speaker');
  assert.deepEqual(right.lines,[b.after,...(b.following?[b.following]:[]),'PRIEST: Fixture boundary '+i+'.'],b.join+' must preserve the following response and section');
 }
 assert.deepEqual(apply(output),output,'running all repairs twice cannot alter the completed service');
 const unknown=sections.map(part=>({...part,lines:[...part.lines]}));
 assert.strictEqual(apply(unknown),unknown,'other editions must not be rewritten');
});
