const assert=require('node:assert/strict'),path=require('node:path');
module.exports=async(page,context,base,artifacts,violations)=>{
 const uploads=[],watch=r=>{if(['POST','PUT','PATCH'].includes(r.method()))uploads.push(r.url());};page.on('request',watch);
 await page.goto(`${base}index.html?tab=liturgy&date=2026-11-12&rite=roman`);
 await page.locator('[data-act="liturgyview"][data-v="mass"]').click();
 await page.locator('.reader-offline > summary').click();
 await page.locator('#liturgical-file').setInputFiles({name:'fictional-fixture.epub',mimeType:'application/epub+zip',buffer:require('./epub-reader-browser.cjs').epub(false,true)});
 await page.waitForFunction(()=>document.querySelector('.reader-inline-text')?.textContent.includes('Fixture collect'));
 await page.locator('.reader-offline > summary').click();
 const prayers=page.locator('.reader-inline-text');
 assert.equal(await prayers.isVisible(),true,'prayers remain visible with management collapsed');
 assert.equal(await page.locator('dialog[open]').count(),0);
 for(const text of ['Fixture entrance.','Fixture offerings.','Fixture communion.','Fixture after communion.'])assert.ok((await prayers.innerText()).includes(text),text);
 assert.doesNotMatch(await prayers.innerText(),/Fixture (?:Gloria|Apostles|Nicene) response/,'weekday memorial does not appoint Gloria or Creed');
 assert.doesNotMatch(await prayers.innerText(),/Fixture (?:biography|Scripture|hidden|Gloria instruction|Eucharistic direction|Christmas variant|Nicene response)/);
 assert.equal(await prayers.locator('.roman-response').count(),0,'weekday omits Gloria/Creed but keeps private book text untouched');
 assert.match(await prayers.innerText(),/The priest decides which permitted prayer is used at Mass/);
 assert.doesNotMatch(await prayers.innerText(),/Fixture general Eucharistic prayer one\./);
 assert.equal(await prayers.locator('[data-reader="eucharistic"][aria-pressed="true"]').count(),0,
   'no Eucharistic Prayer should be preselected');
 await page.locator('[data-reader="eucharistic"][data-choice="1"]').click();
 await page.waitForFunction(()=>document.querySelector('.roman-eucharistic-text')?.textContent.includes('Fixture general Eucharistic prayer one.'));
 assert.equal(await prayers.locator('[data-reader="eucharistic"][data-choice="1"]').getAttribute('aria-pressed'),'true');
 await page.locator('[data-reader="eucharistic"][data-choice="2"]').click();
 await page.waitForFunction(()=>document.querySelector('.roman-eucharistic-text')?.textContent.includes('Fixture Eucharistic prayer two.'));
 assert.doesNotMatch(await prayers.innerText(),/Fixture general Eucharistic prayer one/);
 await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
 const audit=await page.evaluate(()=>axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}}));
 violations.push(...audit.violations.map(v=>({tab:'inline-private-missal',id:v.id,examples:v.nodes.map(n=>({html:n.html,summary:n.failureSummary}))})));
 await page.screenshot({path:path.join(artifacts,'inline-private-missal.png'),fullPage:true});
 await page.goto(`${base}index.html?tab=liturgy&date=2027-01-11&rite=roman`);
 // Read the rendered sections in one snapshot. Feed refreshes can rebuild
 // the prayer view while the saved EPUB preview is being hydrated.
 const weekday=await page.waitForFunction(()=>{
  const preview=document.querySelector('.reader-inline-text.reader-inline-missal');
  const sections=Array.from(preview?.querySelectorAll('.roman-mass-part')??[]);
  if(!sections.some(section=>section.textContent.includes('Fixture first-week collect.')))return false;
  const headings=sections.map(section=>section.querySelector('h3')?.textContent);
  const communion=sections[headings.indexOf('Communion Antiphon')];
  return {
   headings,
   communion:Array.from(communion?.querySelectorAll('p')??[],p=>p.textContent),
   pressed:preview.querySelectorAll('[data-reader="eucharistic"][aria-pressed="true"]').length
  };
 });
 const mass=await weekday.jsonValue();
 assert.deepEqual(mass.headings,[
  'Entrance Antiphon','Collect','Prayer over the Offerings','Eucharistic Prayer',
  'Communion Antiphon','Prayer after Communion'
 ]);
 assert.deepEqual(mass.communion,[
  'Fixture first-week communion.','Or: Jn 10: 10','Fixture first-week communion alternative.'
 ]);
 assert.equal(mass.pressed,0,'ordinary Monday leaves Eucharistic Prayer selection open');
 await page.goto(`${base}index.html?tab=liturgy&date=2027-05-16&rite=roman`);
 const pentecost=await page.waitForFunction(()=>{
  const preview=document.querySelector('.reader-inline-text.reader-inline-missal');
  const text=preview?.textContent;
  return text?.includes('Fixture Pentecost day collect.') ? text : false;
 });
 const pentecostText=await pentecost.jsonValue();
 assert.doesNotMatch(pentecostText,/Fixture Pentecost vigil collect/);
 assert.match(pentecostText,/Fixture Pentecost day entrance/);
 assert.match(pentecostText,/Fixture Pentecost day prayer after communion/);
 assert.match(pentecostText,/Fixture Gloria response/);
 assert.match(pentecostText,/Fixture Nicene response/);
 await page.goto(`${base}index.html?tab=liturgy&date=2026-11-15&rite=roman`);
 await page.waitForFunction(()=>document.querySelector('.reader-inline-text')?.textContent.includes('Fixture Sunday prayer'));
 await prayers.waitFor({state:'visible'});
 assert.match(await prayers.innerText(),/Fixture Gloria response/,'Sunday normally includes Gloria');
 assert.match(await prayers.innerText(),/Fixture Nicene response/,'Nicene Creed is standard');
 assert.doesNotMatch(await prayers.innerText(),/Fixture Apostles response/,'Apostles alternative begins collapsed');
 const creedAlternative=page.locator('.roman-mass-alternative');
 assert.equal(await creedAlternative.count(),1);
 assert.equal(await creedAlternative.evaluate(el=>el.open),false);
 await creedAlternative.locator('summary').click();
 assert.equal(await creedAlternative.evaluate(el=>el.open),true);
 assert.match(await creedAlternative.innerText(),/Fixture Apostles response/,'Apostles alternative is accessible');
 await page.evaluate(async()=>{await navigator.serviceWorker.ready;});await context.setOffline(true);await page.reload();
 await page.waitForFunction(()=>document.querySelector('.reader-inline-text')?.textContent.includes('Fixture Sunday prayer'));
 assert.equal(await page.locator('dialog[open]').count(),0);await context.setOffline(false);
 await page.goto(`${base}index.html?tab=liturgy&date=2026-12-25&rite=roman`);
 const openMissal=prayers.getByRole('button',{name:'Open saved Missal'});
 const ambiguity=await page.waitForFunction(()=>{
  const preview=document.querySelector('.reader-inline-text.reader-inline-missal');
  if(!preview?.querySelector('button[data-reader="open"]'))return false;
  return {
   text:preview.textContent,
   eucharisticButtons:preview.querySelectorAll('[data-reader="eucharistic"]').length
  };
 });
 const message=await ambiguity.jsonValue();
 assert.match(message.text,/more than one section for this date/);
 assert.doesNotMatch(message.text,/Fixture Christmas (?:vigil|day) collect/);
 assert.equal(message.eucharisticButtons,0);
 await openMissal.click();

 const book=page.locator('#liturgical-reader');
 await book.getByText('Fixture collect for private reading.',{exact:true}).waitFor();
 const search=book.getByLabel('Find a prayer or section');
 const section=book.locator('#reader-section');
 await search.fill('Fixture Christmas vigil collect.');
 await book.getByText('1 matching sections',{exact:true}).waitFor();
 await section.selectOption(await section.locator('option').getAttribute('value'));
 await book.getByText('Fixture Christmas vigil collect.',{exact:true}).waitFor();

 await search.fill('Fixture Christmas day collect.');
 await book.getByText('1 matching sections',{exact:true}).waitFor();
 const chosen=await section.locator('option').getAttribute('value');
 await section.selectOption(chosen);
 await book.getByText('Fixture Christmas day collect.',{exact:true}).waitFor();
 assert.doesNotMatch(await book.locator('#reader-text').innerText(),/Fixture Christmas vigil collect/);
 await page.waitForFunction(async selected=>(await LiturgyReader.get('roman'))?.page===Number(selected),chosen);
 assert.equal(await book.getByRole('link',{name:'Download original EPUB'}).getAttribute('download'),'fictional-fixture.epub');
 await book.getByRole('button',{name:'Close'}).click();
 await page.evaluate(async()=>{await navigator.serviceWorker.ready;});
 await context.setOffline(true);
 try{
   await page.reload();
   await openMissal.click();
   await book.getByText('Fixture Christmas day collect.',{exact:true}).waitFor();
   assert.equal(await section.inputValue(),chosen,'saved Missal opens at the selected section offline');
   await book.getByRole('button',{name:'Close'}).click();
 }finally{
   await context.setOffline(false);
 }
 await page.goto(`${base}index.html?tab=liturgy&date=2026-11-13&rite=roman`);
 await page.waitForFunction(()=>document.querySelector('.reader-inline-text')?.textContent.includes('Daily prayers are not available'));
 assert.deepEqual(uploads,[],'private text is never uploaded');page.off('request',watch);
 console.log('Inline Roman prayers: date matching, displayed propers, source rubrics/responses, deliberate Eucharistic choice, unmatched dates and offline reopening passed.');
};
