const assert=require('node:assert/strict'),path=require('node:path');
module.exports=async(page,base,artifacts,violations)=>{
 await page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('ora.settings')||'{}');s.byzChurch='melkite';localStorage.setItem('ora.settings',JSON.stringify(s));});
 await page.goto(`${base}index.html?tab=liturgy&rite=byz&date=2026-11-12`);
 await page.locator('[data-act="liturgyview"][data-v="byz"]').click();
 // Fictional PDF-shaped rows exercise the real UI extraction path. Nothing is
 // written to device storage, and no publisher or user's book is uploaded.
 await page.evaluate(async()=>{
  const originalGet=LiturgyReader.get,originalLoad=LiturgyReader.load;
  const rows=[['The Divine Liturgy',760],['L I T U R G Y O F T H E',730],['W O R D',715],['PRIEST: Blessed is the Kingdom. Fixture opening',680],['continues on the following row.',665],['ALL: Fixture response.',635],['The priest bows.',605],['For the peace of the world, fixture petition.',565],['(Amen.)',530],['Appendix',495],['Fixture appendix must stay out.',465]];
  LiturgyReader.get=async id=>({id,name:'fictional.pdf',format:'pdf',pages:1,page:1,updated:1,blob:new Blob()});
  LiturgyReader.load=async()=>({numPages:1,getPage:async()=>({getTextContent:async()=>({items:rows.map(([str,y])=>({str,transform:[1,0,0,12,20,y]}))})}),destroy:async()=>{}});
  try{await LiturgicalText.hydrate();}finally{LiturgyReader.get=originalGet;LiturgyReader.load=originalLoad;}
 });
 const text=page.locator('.reader-inline-text');
 assert.equal(await text.locator('.byz-major-heading').innerText(),'Liturgy of the Word');
 assert.match(await text.innerText(),/Fixture opening continues on the following row/);
 assert.match(await text.innerText(),/For the peace of the world, fixture petition/);
 assert.match(await text.innerText(),/\(Amen\.\)/);
 assert.doesNotMatch(await text.innerText(),/Fixture appendix|The priest bows/);
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
 await page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('ora.settings'));s.byzChurch='ukrainian';localStorage.setItem('ora.settings',JSON.stringify(s));});
 console.log('Byzantine formatting: continuous paragraphs, tracked headings, source speakers, hidden rubrics, preserved petitions, appendix boundary, light/dark and mobile overflow passed.');
};
