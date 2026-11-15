const assert=require('node:assert/strict'),path=require('node:path');
module.exports=async(page,base,artifacts,violations)=>{
 await page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('ora.settings')||'{}');s.byzChurch='melkite';localStorage.setItem('ora.settings',JSON.stringify(s));});
 await page.goto(`${base}index.html?tab=liturgy&rite=byz&date=2026-11-12`);
 await page.locator('[data-act="liturgyview"][data-v="byz"]').click();
 // Fictional PDF-shaped rows exercise the real UI extraction path. Nothing is
 // written to device storage, and no publisher or user's book is uploaded.
 await page.evaluate(async()=>{
  const originalGet=LiturgyReader.get,originalLoad=LiturgyReader.load;
  const rows=[['The Divine Liturgy',790],['T H E D I V I N E A N D H O L Y L I T',775],['U R G Y O F S A I N T J O H N C H R Y',760],['S O S T O M',745],['L I T U R G Y O F T H E',730],['W O R D',715],['PRIEST: Blessed is the Kingdom. Fixture opening',680],['continues on the following row.',665],['ALL: Fixture response.',635],['The Priest and the Deacon on his right stand before the Holy Table.',605],['For the peace of the world, fixture petition.',565],['(Amen.)',530],['Appendix',495],['Fixture appendix must stay out.',465]];
  LiturgyReader.get=async id=>({id,name:'fictional.pdf',format:'pdf',pages:1,page:1,updated:1,blob:new Blob()});
  LiturgyReader.load=async()=>({numPages:1,getPage:async()=>({getTextContent:async()=>({items:rows.map(([str,y])=>({str,transform:[1,0,0,12,20,y]}))})}),destroy:async()=>{}});
  try{await LiturgicalText.hydrate();}finally{LiturgyReader.get=originalGet;LiturgyReader.load=originalLoad;}
 });
 const text=page.locator('.reader-inline-text');
 assert.equal(await page.locator('.liturgy-opening .t').innerText(),'Sign of the Cross');
 assert.equal(await page.locator('.liturgy-opening .tx').innerText(),await page.evaluate(()=>CONTENT.TEXTS.cross));
 for(const width of [320,390,800]){
  await page.setViewportSize({width,height:844});
  const sizes=await page.evaluate(()=>[document.querySelector('.liturgy-opening .tx'),document.querySelector('.byz-prayer-words')].map(el=>getComputedStyle(el).fontSize));
  assert.equal(sizes[0],sizes[1],'Divine Liturgy matches the standard prayer text size');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 }
 await page.setViewportSize({width:390,height:844});

 assert.deepEqual(await text.locator('.byz-major-heading').allTextContents(),['Divine Liturgy of St. John Chrysostom','Liturgy of the Word']);
 assert.match(await text.innerText(),/Fixture opening continues on the following row/);
 assert.match(await text.innerText(),/For the peace of the world, fixture petition/);
 assert.match(await text.innerText(),/\(Amen\.\)/);
 assert.doesNotMatch(await text.innerText(),/Fixture appendix|stand before the Holy Table/);
 assert.equal(await text.locator('.byz-role-priest').count(),1);assert.equal(await text.locator('.byz-role-all').count(),1);
 assert.equal(await page.locator('.reader-inline-controls').isVisible(),false,'whole-service view has no irrelevant page controls');
 await text.locator('.byz-rubrics-toggle').click();assert.equal(await text.locator('.byz-rubric').isVisible(),true);
 await text.locator('.byz-rubrics-toggle').click();assert.equal(await text.locator('.byz-rubric').isVisible(),false);
 for(const colorScheme of ['light','dark']){
  await page.emulateMedia({colorScheme});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
  const audit=await page.evaluate(()=>axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}}));
  violations.push(...audit.violations.map(v=>({tab:'formatted-private-liturgy',colorScheme,id:v.id,examples:v.nodes.map(n=>({html:n.html,summary:n.failureSummary}))})));
  await page.screenshot({path:path.join(artifacts,`private-liturgy-${colorScheme}.png`),fullPage:true});
 }
 await page.emulateMedia({colorScheme:'light'});
 await page.evaluate(async()=>{
  const originalGet=LiturgyReader.get,originalLoad=LiturgyReader.load;
  document.querySelector('.liturgical-text').dataset.textId='melkite-presanctified';
  LiturgyReader.get=async id=>({id,name:'fictional-presanctified.pdf',format:'pdf',pages:1,page:1,updated:2,blob:new Blob()});
  LiturgyReader.load=async()=>({numPages:1,getPage:async()=>({getTextContent:async()=>({items:[{str:'PRIEST: Blessed is our God. Fixture Presanctified opening.',transform:[1,0,0,12,20,700]}]})}),destroy:async()=>{}});
  try{await LiturgicalText.hydrate();}finally{LiturgyReader.get=originalGet;LiturgyReader.load=originalLoad;}
 });
 assert.match(await page.locator('.reader-inline-text').innerText(),/Fixture Presanctified opening/,'Presanctified has a distinct opening boundary');
 await page.evaluate(async()=>{
  const get=LiturgyReader.get,load=LiturgyReader.load;
  document.querySelector('.liturgical-text').dataset.textId='melkite-chrysostom';
  const item=(str,x,y,width=100)=>({str,width,height:12,transform:[1,0,0,12,x,y]});
  const items=[item('The Divine Liturgy',20,780),item('PRIEST: Blessed is the Kingdom. Fixture opening.',20,755,340),item('First Antiphon',20,730),item('Sunday (Ordinary)',20,700),item('Weekday (Ordinary)',200,700),item('ALL: Fixture Sunday words',20,670),item('ALL: Fixture weekday words',200,670),item('continued left.',20,655),item('continued right.',200,655),item('The Priest says:',20,620,330),item('Fixture common prayer without a printed label.',20,600,330),item('Priest (quietly): Fixture quiet prayer.',20,570,330)];
  LiturgyReader.get=async id=>({id,name:'fixture-columns.pdf',format:'pdf',pages:1,updated:3,blob:new Blob()});
  LiturgyReader.load=async()=>({numPages:1,getPage:async()=>({getTextContent:async()=>({items})}),destroy:async()=>{}});
  try{await LiturgicalText.hydrate();}finally{LiturgyReader.get=get;LiturgyReader.load=load;}
 });
 const choices=page.locator('.byz-antiphon-option');assert.equal(await choices.count(),2);
 assert.equal(await choices.nth(0).evaluate(el=>el.open),false);
 assert.equal(await choices.nth(1).evaluate(el=>el.open),true);
 assert.match(await choices.nth(1).innerText(),/weekday words continued right/);
 assert.doesNotMatch(await choices.nth(1).innerText(),/Sunday words|continued left/);
 assert.equal(await page.locator('.byz-role-priest').count(),3);
 assert.equal(await page.locator('.byz-prayer-line .byz-rubric').isVisible(),false);
 await page.locator('.byz-rubrics-toggle').click();assert.equal(await page.locator('.byz-prayer-line .byz-rubric').isVisible(),true);
 await page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('ora.settings'));s.byzChurch='ukrainian';localStorage.setItem('ora.settings',JSON.stringify(s));});

 // The recognized bilingual Edmonton booklet should use the exact same
 // continuous text presentation as Melkite, without extracting Ukrainian-
 // language facing pages or the later appendices.
 await page.goto(base+'index.html?tab=liturgy&rite=byz&date=2026-11-15');
 await page.locator('[data-act="liturgyview"][data-v="byz"]').click();
 await page.evaluate(async()=>{
   const get=LiturgyReader.get,load=LiturgyReader.load;
   const row=(str,y)=>({str,width:260,height:12,transform:[1,0,0,12,20,y]});
   const content={
     33:['PRIEST 1: Blessed is the Kingdom.','DCN 2: Fixture Ukrainian litany.','ALL: Amen.','The priest bows.'],
     35:['First Antiphon','ALL: Fixture Ukrainian antiphon.'],
     69:['DEACON 1: Fixture Eucharistic invitation.'],
     83:['BISHOP: Fixture anaphora.'],
     99:['ALL: Fixture Communion response.'],
     113:['ALL: Fixture conclusion.'],
     34:['Ukrainian facing-language page must never appear'],
     115:['Appendix content must never appear']
   };
   LiturgyReader.get=async id=>({id,name:'edmonton-fixture.pdf',format:'pdf',pages:140,page:1,updated:100,blob:new Blob()});
   LiturgyReader.load=async()=>({numPages:140,getPage:async number=>({
     getTextContent:async()=>({items:(number===4?
       ['Official translation of the Ukrainian Greek Catholic Church: St. John Chrysostom']:
       content[number]||[]).map((s,i)=>row(s,760-i*34))})
   }),destroy:async()=>{}});
   try{await LiturgicalText.hydrate();}finally{LiturgyReader.get=get;LiturgyReader.load=load;}
 });
 const ukrainian=page.locator('.reader-inline-text');
 assert.equal(await ukrainian.locator('.byz-major-heading').first().innerText(),'Divine Liturgy of St. John Chrysostom');
 assert.deepEqual(await ukrainian.locator('.byz-major-heading').allTextContents(),[
   'Divine Liturgy of St. John Chrysostom','Liturgy of the Word',
   'Liturgy of the Eucharist','Anaphora','Holy Communion'
 ]);
 assert.match(await ukrainian.innerText(),/Fixture Ukrainian litany/);
 assert.match(await ukrainian.innerText(),/Fixture Ukrainian antiphon/);
 assert.doesNotMatch(await ukrainian.innerText(),/Ukrainian facing-language page|Appendix content|The priest bows/);
 assert.equal(await ukrainian.locator('.byz-role-deacon').count(),2);
 assert.equal(await ukrainian.locator('.byz-role-priest .byz-speaker').first().innerText(),'Priest 1');
 assert.equal(await ukrainian.locator('.byz-role-deacon .byz-speaker').first().innerText(),'Deacon 2');
 assert.equal(await page.locator('.reader-inline-controls').isVisible(),false);
 for(const width of [320,390]){
   await page.setViewportSize({width,height:844});
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'Edmonton text must fit mobile width');
   assert.equal(await page.evaluate(()=>getComputedStyle(document.querySelector('.liturgy-opening .tx')).fontSize),
     await page.evaluate(()=>getComputedStyle(document.querySelector('.byz-prayer-words')).fontSize),
     'Ukrainian prayers retain Melkite reading type scale');
 }
 await page.setViewportSize({width:390,height:844});
 await ukrainian.locator('.byz-rubrics-toggle').click();
 assert.equal(await ukrainian.locator('.byz-rubric').first().isVisible(),true);
 await ukrainian.locator('.byz-rubrics-toggle').click();
 assert.equal(await ukrainian.locator('.byz-rubric').first().isVisible(),false);
 // A different user-owned Ukrainian PDF may not have the Edmonton page
 // count; generic prayer detection must still produce the same UI.
 await page.evaluate(async()=>{
  const get=LiturgyReader.get,load=LiturgyReader.load;
  LiturgyReader.get=async id=>({id,name:'ukrainian-other.pdf',format:'pdf',pages:1,page:1,updated:101,blob:new Blob()});
  LiturgyReader.load=async()=>({numPages:1,getPage:async()=>({
   getTextContent:async()=>({items:[
    {str:'The Divine Liturgy',transform:[1,0,0,12,20,700]},
    {str:'PRIEST: Blessed is the Kingdom. Fixture generic Ukrainian PDF.',transform:[1,0,0,12,20,670]},
    {str:'ALL: Fixture generic response.',transform:[1,0,0,12,20,630]}
   ]})
  }),destroy:async()=>{}});
  try{await LiturgicalText.hydrate();}finally{LiturgyReader.get=get;LiturgyReader.load=load;}
 });
 assert.match(await ukrainian.innerText(),/Fixture generic Ukrainian PDF/);
 assert.equal(await page.locator('.reader-inline-controls').isVisible(),false,'generic Ukrainian PDF uses continuous text');
 // Reproduce the reported 26-page saved PDF: its edition cannot be identified,
 // but all selectable pages must appear in one scroll without Previous/Next.
 await page.evaluate(async()=>{
   const get=LiturgyReader.get,load=LiturgyReader.load;
   LiturgyReader.get=async id=>({id,name:'unknown-ukrainian.pdf',format:'pdf',pages:26,page:2,updated:102,blob:new Blob()});
   LiturgyReader.load=async()=>({
     numPages:26,
     getPage:async number=>({
       getTextContent:async()=>({items:[
         {str:'Text from saved page '+number+'.',width:220,height:12,transform:[1,0,0,12,20,720]},
         {str:'ALL: Response on saved page '+number+'.',width:220,height:12,transform:[1,0,0,12,20,680]}
       ]})
     }),
     destroy:async()=>{}
   });
   try{await LiturgicalText.hydrate();}finally{LiturgyReader.get=get;LiturgyReader.load=load;}
 });
 assert.match(await ukrainian.innerText(),/Text from saved page 1/);
 assert.match(await ukrainian.innerText(),/Text from saved page 26/);
 assert.match(await ukrainian.locator('.byz-unrecognized-pdf-note').innerText(),/English-only continuous text from your saved PDF \(26 pages\)/);
 assert.equal(await page.locator('.reader-inline-controls').isVisible(),false,'all 26 pages appear without inline pagination');
 assert.equal(await ukrainian.locator('.byz-role-all').count(),26);
 for(const width of [320,390]){
   await page.setViewportSize({width,height:844});
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'unrecognized PDF stays within phone width');
 }
 await page.setViewportSize({width:390,height:844});
 // Mixed-language 26-page file: Ukrainian and English share lines and pages.
 await page.evaluate(async()=>{
  const get=LiturgyReader.get,load=LiturgyReader.load;
  const item=(str,x,y)=>({str,width:155,height:12,transform:[1,0,0,12,x,y]});
  LiturgyReader.get=async id=>({id,name:'bilingual-26.pdf',format:'pdf',pages:26,page:2,updated:104,blob:new Blob()});
  LiturgyReader.load=async()=>({
   numPages:26,getPage:async n=>({
    getTextContent:async()=>({items:n%2?[
      item('Господи, помилуй.',20,720),
      item('ALL: Lord, have mercy on page '+n+'.',230,720),
      item('ДИЯКОН: У мирі Господеві помолімся.',20,680),
      item('DEACON: In peace let us pray.',230,680),
      item('ALL: Amen. / ВСІ: Амінь.',20,640)
    ]:[
      item('Слава Тобі, Господи, слава Тобі.',20,720),
      item('PRIEST: Glory to You, O Lord, page '+n+'.',230,720)
    ]})
   }),destroy:async()=>{}
  });
  try{await LiturgicalText.hydrate();}finally{LiturgyReader.get=get;LiturgyReader.load=load;}
 });
 const englishView=await ukrainian.innerText();
 assert.match(englishView,/Lord, have mercy on page 1/);
 assert.match(englishView,/Glory to You, O Lord, page 26/);
 assert.match(englishView,/In peace let us pray/);
 assert.doesNotMatch(englishView,/[\u0400-\u052f]/u);
 assert.equal(await page.locator('.reader-inline-controls').isVisible(),false);
 assert.match(await ukrainian.locator('.byz-unrecognized-pdf-note').innerText(),/English-only continuous text/);
 // Scanned/image-only PDFs cannot be converted into text without OCR; retain
 // access to Open original book and do not return to paged inline navigation.
 await page.evaluate(async()=>{
   const get=LiturgyReader.get,load=LiturgyReader.load;
   LiturgyReader.get=async id=>({id,name:'image-only.pdf',format:'pdf',pages:3,page:1,updated:103,blob:new Blob()});
   LiturgyReader.load=async()=>({
     numPages:3,getPage:async()=>({getTextContent:async()=>({items:[]})}),destroy:async()=>{}
   });
   try{await LiturgicalText.hydrate();}finally{LiturgyReader.get=get;LiturgyReader.load=load;}
 });
 assert.match(await ukrainian.innerText(),/No selectable English text was found/i);
 assert.equal(await page.locator('.reader-inline-controls').isVisible(),false,'scanned PDF does not return inline page buttons');

 console.log('Byzantine formatting: continuous paragraphs, tracked headings, source speakers, hidden rubrics, preserved petitions, appendix boundary, light/dark and mobile overflow passed.');
};
