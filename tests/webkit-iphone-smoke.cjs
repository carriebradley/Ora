'use strict';
// WebKit on Linux, with iPhone viewport/touch emulation. This is NOT iOS Safari
// and cannot certify installed-PWA storage retention across OS updates.
// Playwright WebKit ephemeral contexts cannot persist File/Blob in IndexedDB:
// https://github.com/microsoft/playwright/issues/42795
// Use a persistent context to match a regular Safari session.
const {webkit,devices}=require('playwright');
const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs');
const os=require('node:os');
const {epub}=require('./epub-reader-browser.cjs');
const base=process.env.ORA_BASE_URL||'http://127.0.0.1:8765/';
const out=process.env.ORA_WEBKIT_ARTIFACT_DIR||'/tmp/ora-webkit-audit';
fs.mkdirSync(out,{recursive:true});

function pdf(){
 const objects=['<< /Type /Catalog /Pages 2 0 R >>',
  '<< /Type /Pages /Kids [3 0 R 4 0 R] /Count 2 >>',
  '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 400] /Resources << /Font << /F1 5 0 R >> >> /Contents 6 0 R >>',
  '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 400] /Resources << /Font << /F1 5 0 R >> >> /Contents 7 0 R >>',
  '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'];
 for(const phrase of ['Ora WebKit fixture page one','Ora WebKit fixture page two']){
  const stream='BT /F1 14 Tf 20 350 Td ('+phrase+') Tj ET';
  objects.push('<< /Length '+stream.length+' >>\nstream\n'+stream+'\nendstream');
 }
 let data='%PDF-1.4\n';const offsets=[0];
 for(const [i,object] of objects.entries()){
  offsets.push(Buffer.byteLength(data));
  data+=(i+1)+' 0 obj\n'+object+'\nendobj\n';
 }
 const start=Buffer.byteLength(data);
 data+='xref\n0 8\n0000000000 65535 f \n'+
   offsets.slice(1).map(i=>String(i).padStart(10,'0')+' 00000 n \n').join('')+
   'trailer\n<< /Size 8 /Root 1 0 R >>\nstartxref\n'+start+'\n%%EOF\n';
 return Buffer.from(data);
}

(async()=>{
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'ora-webkit-profile-'));
 let context,page;
 try{
  context=await webkit.launchPersistentContext(profile,{...devices['iPhone 13'],viewport:{width:390,height:844},serviceWorkers:'allow',headless:true});
  page=context.pages()[0]||await context.newPage();
  const pageErrors=[];
  page.on('pageerror',error=>pageErrors.push(error.message));
  page.on('console',message=>{if(message.type()==='error')console.error('WEBKIT_CONSOLE_ERROR',message.text());});
  // No external requests should be needed to operate local saved books.
  await context.route('**/*',route=>route.request().url().startsWith(base)?route.continue():route.abort());
  for(const tab of ['today','pray','readings','liturgy','calendar','more']){
   await page.goto(base+'index.html?tab='+tab+'&rite=byz&date=2026-11-21',{waitUntil:'domcontentloaded'});
   await page.locator('#app .tab-heading h1').waitFor();
   assert.ok((await page.locator('#app').innerText()).length>50,'WebKit '+tab+' must not be blank');
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,
     'iPhone-size WebKit '+tab+' must not scroll horizontally');
  }
  await page.evaluate(()=>{
   const s=JSON.parse(localStorage.getItem('ora.settings')||'{}');
   s.theme='dark';s.readingSize='large';s.byzChurch='ukrainian';
   localStorage.setItem('ora.settings',JSON.stringify(s));
  });
  await page.setViewportSize({width:320,height:700});
  await page.reload();
  assert.equal(await page.evaluate(()=>document.documentElement.style.getPropertyValue('--reading-scale').trim()),'1.18');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,
   '320px, large text and dark mode must not overflow');
  await page.setViewportSize({width:390,height:844});
  await page.goto(base+'index.html?tab=liturgy&rite=byz&date=2026-11-11');
  const saved=page.locator('.liturgical-text[data-text-id="chrysostom"]');
  await saved.waitFor();
  await saved.locator('.reader-offline summary').click();
  await page.locator('#liturgical-file').setInputFiles({
   name:'webkit-private-test.pdf',mimeType:'application/pdf',buffer:pdf()
  });
  await page.waitForFunction(()=>!document.querySelector('[data-reader="open"]')?.disabled,
   null,{timeout:12000}).catch(async error=>{
    const detail=await page.evaluate(async()=>{
     const element=document.querySelector('.liturgical-text');
     let saved=null;
     try{
      const record=await LiturgyReader.get('chrysostom');
      saved=record?{name:record.name,size:record.size,page:record.page}:null;
     }catch(e){saved={error:e.message};}
     return {status:element?.querySelector('.reader-status')?.textContent,
      fileValue:element?.querySelector('#liturgical-file')?.value,
      fileDisabled:element?.querySelector('#liturgical-file')?.disabled,
      buttonDisabled:element?.querySelector('[data-reader="open"]')?.disabled,
      storage:saved};
    });
    console.error('WEBKIT_PDF_SAVE_DIAGNOSTICS',JSON.stringify(detail));
    throw error;
   });
  await page.evaluate(async()=>LiturgyReader.bookmark('chrysostom',2));
  await page.reload();
  await page.waitForFunction(()=>!document.querySelector('[data-reader="open"]')?.disabled);
  let first=await page.evaluate(async()=>{
   const book=await LiturgyReader.get('chrysostom');
   return {page:book?.page,pages:book?.pages,name:book?.name,bytes:book?.blob?.size};
  });
  assert.equal(first.page,2,'WebKit must persist the PDF bookmark after reload');
  assert.equal(first.pages,2);
  assert.ok(first.bytes>100);
  await page.locator('.reader-offline summary').click();
  await page.locator('[data-reader="open"]').click();
  await page.waitForFunction(()=>document.querySelector('#reader-status')?.textContent==='Page 2 of 2');
  await page.locator('[data-reader="mode"]').click();
  await page.waitForFunction(()=>document.querySelector('#reader-text')?.textContent.includes('page two'),
   null,{timeout:9000}).catch(async error=>{
    const detail=await page.evaluate(()=>({
     status:document.querySelector('#reader-status')?.textContent,
     text:document.querySelector('#reader-text')?.textContent?.slice(0,600),
     textHidden:document.querySelector('#reader-text')?.hidden,
     canvasHidden:document.querySelector('#reader-page')?.hidden,
     modeText:document.querySelector('[data-reader="mode"]')?.textContent,
     currentPage:document.querySelector('#reader-number')?.value
    }));
    console.error('WEBKIT_PDF_TEXTVIEW_DIAGNOSTICS',JSON.stringify(detail));
    throw error;
   });
  await page.locator('[data-reader="close"]').click();
  // A second book must not overwrite the first book's IndexedDB record.
  await page.evaluate(async data=>{
   const bytes=Uint8Array.from(data);
   const file=new File([bytes],'webkit-private-test.epub',{type:'application/epub+zip'});
   await LiturgyReader.save('basil',file);
   await LiturgyReader.bookmark('basil',2);
  },Array.from(epub()));
  await context.setOffline(true);
  const offline=await page.evaluate(async()=>{
   const pdf=await LiturgyReader.get('chrysostom');
   const epub=await LiturgyReader.get('basil');
   return {pdf:pdf&&{page:pdf.page,bytes:pdf.blob.size},epub:epub&&{
    page:epub.page,bytes:epub.blob.size,format:epub.format}};
  });
  assert.equal(offline.pdf.page,2,'WebKit offline PDF record');
  assert.equal(offline.epub.page,2,'WebKit offline EPUB bookmark');
  assert.equal(offline.epub.format,'epub');
  await context.setOffline(false);
  await page.reload();
  const restored=await page.evaluate(async()=>{
   const rec=await LiturgyReader.get('basil');
   const book=await LiturgyReader.load(rec.blob,rec.format);
   const text=book.sections.map(s=>s.blocks.map(b=>b.text).join(' ')).join(' ');
   const n=book.numPages;
   await book.destroy();
   return {page:rec.page,n,hasPrayer:/Thanksgiving|communion/i.test(text),
    stillHasPdf:!!await LiturgyReader.get('chrysostom')};
  });
  assert.equal(restored.page,2,'WebKit EPUB bookmark persists across reload');
  assert.ok(restored.n>=2,'WebKit EPUB sections parse');
  assert.equal(restored.hasPrayer,true,'WebKit EPUB text remains readable');
  assert.equal(restored.stillHasPdf,true,'WebKit book slots are isolated');
  assert.deepEqual(pageErrors,[],'no uncaught app errors in WebKit');
  console.log('WebKit iPhone-emulation: tabs, 320px large text, PDF, EPUB, offline IndexedDB reads, bookmarks and reload passed');
 }catch(error){
  if(page)await page.screenshot({path:path.join(out,'webkit-failure.png'),fullPage:true}).catch(()=>{});
  throw error;
 }finally{
  if(context)await context.close();
  fs.rmSync(profile,{recursive:true,force:true});
 }
})().catch(err=>{console.error(err);process.exitCode=1;});
