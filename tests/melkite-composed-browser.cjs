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

 // Replacing an otherwise valid service with a book without unique structural
 // headings must restore all the day's dated hymns to Readings & propers.
 // Ordinary words, roles and repeated responses must remain intact.
 await page.evaluate(async()=>{
  const get=LiturgyReader.get,load=LiturgyReader.load;
  const lines=[
   'PRIEST: Blessed is the Kingdom. Fixture no-slot opening.',
   'Great Litany','DEACON: Fixture no-slot petition.',
   'ALL: Lord, have mercy.','ALL: Lord, have mercy.',
   'PRIEST: Fixture no-slot Anaphora prayer.',
   'ALL: Fixture no-slot Communion response.'
  ];
  const parts=[
   {title:'Copyright',blocks:[{text:'Fixture no-slot editorial note.'}]},
   {title:'BLESSING',blocks:lines.map(text=>({text}))},
   {title:'Appendix',blocks:[{text:'Fixture no-slot appendix.'}]}
  ];
  LiturgyReader.get=async id=>({
   id,name:'fictional-melkite-no-slots.epub',format:'epub',
   pages:3,page:1,updated:902,blob:new Blob()
  });
  LiturgyReader.load=async()=>({
   kind:'epub',numPages:3,sections:parts,destroy:async()=>{}
  });
  try{await LiturgicalText.hydrate();}
  finally{LiturgyReader.get=get;LiturgyReader.load=load;}
 });
 await page.waitForFunction(()=>{
  const section=document.querySelector('.liturgical-text');
  const extra=document.querySelector(
   '.byz-daily-propers[data-church="melkite"][data-iso="2026-11-15"]');
  return section?.dataset.placedDaily==='' &&
   extra?.querySelectorAll('.byz-proper-group').length===3;
 },null,{timeout:15000});
 const noSlotPreview=page.locator('.reader-inline-text');
 const noSlotText=await noSlotPreview.innerText();
 assert.match(noSlotText,/Fixture no-slot opening/,'ordinary opening remains');
 assert.match(noSlotText,/Fixture no-slot Anaphora prayer/,'ordinary Anaphora remains');
 assert.match(noSlotText,/Fixture no-slot Communion response/,'ordinary Communion remains');
 assert.equal(await noSlotPreview.locator('.byz-daily-proper-heading').count(),0,
  'do not insert hymns without verified structural boundaries');
 assert.equal(await noSlotPreview.locator('.byz-role-all .byz-prayer-words')
  .filter({hasText:'Lord, have mercy.'}).count(),2,
  'repeated petitions survive when no hymn is placeable');
 assert.doesNotMatch(noSlotText,/editorial note|no-slot appendix/i);
 const allExtra=page.locator(
  '.byz-daily-propers[data-church="melkite"][data-iso="2026-11-15"]');
 assert.deepEqual(await allExtra.locator('.byz-proper-group').evaluateAll(nodes=>
  nodes.map(node=>node.dataset.proper)),['troparia','prokeimenon','alleluia'],
  'all verified hymns must be restored after replacing the saved book');
 assert.match(await allExtra.textContent(),/Troparion|Troparia/i,
  "the original day’s hymn words remain available");
 for(const width of [320,390]){
  await page.setViewportSize({width,height:844});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),
   false,'unplaceable Melkite service overflows at '+width+'px');
 }
 await page.setViewportSize({width:390,height:844});
 await page.screenshot({
  path:path.join(artifacts,'melkite-composed-unplaceable.png'),
  fullPage:true
 });
 // The 2026 Paramony retains Basil's Vesperal service but not the
 // conflicting December typicon's unverified Chrysostom hymns.
 await page.goto(base+'index.html?tab=liturgy&rite=byz&date=2026-12-24');
 assert.match(await page.locator('.service-summary').textContent(),/Vesperal Divine Liturgy of St. Basil/);
 assert.equal(await page.locator('.liturgical-text').getAttribute('data-text-id'),'melkite-basil');
 assert.equal(await page.locator('.byz-daily-propers').count(),0,'conflicting dated hymns must not be appointed');
 const paramony=page.locator('.byz-liturgy-variations');
 assert.match(await paramony.textContent(),/not a morning Liturgy/);
 assert.match(await paramony.textContent(),/Chrysostom/);
 assert.equal(await paramony.locator('a[href="https://melkite.org/wp-content/uploads/2016/09/The-Feast-of-the-Nativity-of-Our-Lord-God-and-Savior-Jesus-Christ.pdf"]').count(),1);
 // Newton's annual calendar confirms this Friday feast, but the January
 // typicon misprints the weekday. Don't expose its quarantined hymns.
 await page.goto(base+'index.html?tab=liturgy&rite=byz&date=2026-01-30');
 assert.equal(await page.locator('.liturgical-text').getAttribute('data-text-id'),'melkite-chrysostom');
 assert.equal(await page.locator('.byz-daily-propers .byz-proper-group').count(),0,'January 30 quarantined hymns are never rendered');
 const hierarchs=page.locator('.byz-liturgy-variations');
 assert.match(await hierarchs.textContent(),/Thursday/);
 assert.match(await hierarchs.textContent(),/Friday/);
 assert.match(await hierarchs.textContent(),/Three Holy Hierarchs/);
 assert.equal(await hierarchs.locator('a[href="https://melkite.org/wp-content/uploads/2025/12/January-2026.docx"]').count(),1);
 await page.goto(base+'index.html?tab=liturgy&rite=byz&date=2026-01-29');
 assert.doesNotMatch(await page.locator('.byz-liturgy-variations').textContent(),/typicon labels January 30/);
 // The Ukrainian Edmonton calendar and UGCC national calendar disagree on
 // December 24. Unlike Newton's case, do not select Basil automatically.
 const originalSettings=await page.evaluate(()=>localStorage.getItem('ora.settings'));
 await page.evaluate(()=>{
  const s=JSON.parse(localStorage.getItem('ora.settings')||'{}');
  s.byzChurch='ukrainian';localStorage.setItem('ora.settings',JSON.stringify(s));
 });
 try{
  await page.goto(base+'index.html?tab=liturgy&rite=byz&date=2026-12-24');
  assert.match(await page.locator('.service-summary').textContent(),/confirm Edmonton directions/);
  assert.equal(await page.locator('.liturgical-text').count(),0,'no service reader can be appointed while Edmonton sources conflict');
  assert.match(await page.locator('.simple-liturgy').textContent(),/No service book for this date/);
  const sources=page.locator('.byz-liturgy-variations');
  const body=await sources.textContent();
  assert.match(body,/Edmonton says no Divine Liturgy/);
  assert.match(body,/UGCC 2026 national calendar appoints Vespers with St. Basil/);
  assert.equal(await page.locator('.byz-daily-propers .byz-proper-group').count(),0);
  assert.equal(await sources.locator('a[href="https://eeparchy.com/calendar/2026-12-24"]').count(),1);
  assert.equal(await sources.locator('a[href="https://ugcc.ua/data/tserkovnyy-kalendar-ugkts-na-2026-rik-8059/"]').count(),1);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 }finally{
  await page.evaluate(saved=>saved===null?localStorage.removeItem('ora.settings'):localStorage.setItem('ora.settings',saved),originalSettings);
 }
 console.log('Melkite and Ukrainian Nativity source conflict, prayer and hymn separation passed.');
};
