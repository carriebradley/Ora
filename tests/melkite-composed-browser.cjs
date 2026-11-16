const assert=require('node:assert/strict');
const path=require('node:path');
module.exports=async(page,base,artifacts)=>{
 // Fictional saved EPUB, real Melkite reader, real November 15 Newton hymns.
 await page.goto(base+'index.html?tab=liturgy&rite=byz&date=2026-11-15');
 await page.locator('[data-act="liturgyview"][data-v="byz"]').click();
 assert.equal(await page.locator('.liturgical-text').getAttribute('data-text-id'),'melkite-chrysostom');
 // Revert to the first book structure to confirm restored supplements
 // disappear again when their hymns become safe to insert.
 for(const protectedPrayer of [false,true,false]){
  await page.evaluate(async blocked=>{
   const get=LiturgyReader.get,load=LiturgyReader.load;
   const lines=[
    'PRIEST: Blessed is the Kingdom. Fixture Melkite opening.',
    'Great Litany','DEACON: Fixture opening petition.',
    'ALL: Lord, have mercy.','ALL: Lord, have mercy.','Little Entrance',
    ...(blocked?['The Trisagion Prayer of St. John Chrysostom',
     'PRIEST: Fixture fixed Trisagion prayer.']:[]),
    'The Trisagion Hymn','ALL: Holy God, Holy Mighty One.',
    'Epistle','The Holy Gospel','Liturgy of the Eucharist','Anaphora',
    'PRIEST: Fixture Anaphora prayer.','One is Holy','Holy Communion',
    'ALL: Fixture Communion response.','Dismissal'
   ];
   const parts=[
    {title:'Copyright',blocks:[{text:'Fixture editorial material.'}]},
    {title:'BLESSING',blocks:lines.map(text=>({text}))},
    {title:'Appendix',blocks:[{text:'Fixture appendix must not appear.'}]}
   ];
   LiturgyReader.get=async id=>({
    id,name:'fictional-melkite-composed.epub',format:'epub',pages:3,
    page:1,updated:blocked?901:900,blob:new Blob()
   });
   LiturgyReader.load=async()=>({
    kind:'epub',numPages:3,sections:parts,destroy:async()=>{}
   });
   try{await LiturgicalText.hydrate();}
   finally{LiturgyReader.get=get;LiturgyReader.load=load;}
  },protectedPrayer);
  const expected=protectedPrayer?'prokeimenon,alleluia':'troparia,prokeimenon,alleluia';
  try{
   await page.waitForFunction(expected=>{
    const section=document.querySelector('.liturgical-text');
    return section?.dataset.placedDaily===expected&&
     section.querySelectorAll('.reader-inline-text .byz-daily-proper-heading').length===
      expected.split(',').length;
   },expected,{timeout:15000});
  }catch(error){
   const state=await page.evaluate(()=>({
    date:document.querySelector('.liturgical-text')?.dataset.dayDate,
    id:document.querySelector('.liturgical-text')?.dataset.textId,
    placed:document.querySelector('.liturgical-text')?.dataset.placedDaily,
    status:document.querySelector('.reader-status')?.textContent,
    headings:[...document.querySelectorAll('.reader-inline-text .byz-daily-proper-heading')].map(h=>h.textContent),
    excerpt:document.querySelector('.reader-inline-text')?.textContent?.slice(0,800)
   }));
   throw new Error('Melkite dated composition did not complete: '+JSON.stringify(state),{cause:error});
  }
  const preview=page.locator('.reader-inline-text'),text=await preview.innerText();
  assert.deepEqual(await preview.locator('.byz-daily-proper-heading').allTextContents(),
   protectedPrayer?['Prokeimenon','Alleluia']:['Troparia and Kontakia','Prokeimenon','Alleluia']);
  const ordered=[
   'Fixture Melkite opening.','Great Litany','Fixture opening petition.','Little Entrance',
   ...(protectedPrayer?['Fixture fixed Trisagion prayer.']:['Troparia and Kontakia']),
   'The Trisagion Hymn','Prokeimenon','Epistle','Alleluia','The Holy Gospel',
   'Anaphora','Fixture Anaphora prayer.','Holy Communion','Fixture Communion response.'
  ];
  let position=-1;
  for(const phrase of ordered){
   const next=text.indexOf(phrase);
   assert.ok(next>position,'rendered Melkite prayer order fails at '+phrase);
   position=next;
  }
  assert.equal(await preview.locator('.byz-role-all .byz-prayer-words')
   .filter({hasText:'Lord, have mercy.'}).count(),2,'both identical litany responses survive');
  assert.equal(await preview.locator('.byz-role-priest .byz-prayer-words')
   .filter({hasText:'Fixture Anaphora prayer.'}).count(),1,'Eucharistic priest attribution survives');
  assert.equal(await preview.locator('.byz-role-deacon .byz-prayer-words')
   .filter({hasText:'Fixture opening petition.'}).count(),1,'deacon attribution survives');
  assert.doesNotMatch(text,/Fixture editorial material|Fixture appendix must not appear|Copyright/i);
  assert.equal(await page.locator('.reader-inline-controls').isVisible(),false);
  const extra=page.locator('.byz-daily-propers[data-church="melkite"][data-iso="2026-11-15"]');
  assert.equal(await extra.locator('.byz-proper-group[data-proper="troparia"]').count(),
   protectedPrayer?1:0,'withheld troparia stay in Readings & propers');
  for(const group of ['prokeimenon','alleluia'])
   assert.equal(await extra.locator('.byz-proper-group[data-proper="'+group+'"]').count(),0,
    group+' must not remain duplicated after insertion');
  for(const width of [320,390]){
   await page.setViewportSize({width,height:844});
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),
    false,'Melkite composed text overflows at '+width+'px');
  }
  await page.setViewportSize({width:390,height:844});
  await page.screenshot({path:path.join(artifacts,'melkite-composed-'+
   (protectedPrayer?'protected':'normal')+'.png'),fullPage:true});
 }
 console.log('Melkite on-screen composition: prayers, hymns, repeated responses and speaker labels passed.');
};
