const assert=require('node:assert/strict'),path=require('node:path');
function pdf(){
 const objects=['<< /Type /Catalog /Pages 2 0 R >>','<< /Type /Pages /Kids [3 0 R 4 0 R] /Count 2 >>','<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 400] /Resources << /Font << /F1 5 0 R >> >> /Contents 6 0 R >>','<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 400] /Resources << /Font << /F1 5 0 R >> >> /Contents 7 0 R >>','<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'];
 for(const s of ['Ora private reader test page one','Ora private reader test page two']){const stream=`BT /F1 14 Tf 20 350 Td (${s}) Tj ET`;objects.push(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);}
 let text='%PDF-1.4\n',offsets=[0];objects.forEach((o,i)=>{offsets.push(Buffer.byteLength(text));text+=`${i+1} 0 obj\n${o}\nendobj\n`});const xref=Buffer.byteLength(text);text+=`xref\n0 8\n0000000000 65535 f \n`+offsets.slice(1).map(n=>String(n).padStart(10,'0')+' 00000 n \n').join('')+`trailer\n<< /Size 8 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;return Buffer.from(text);
}
module.exports=async(page,context,base,artifacts,violations)=>{
 const requests=[];const watch=r=>{if(['POST','PUT','PATCH'].includes(r.method()))requests.push(r.url());};page.on('request',watch);
 await page.goto(`${base}index.html?tab=liturgy&date=2026-11-11`);
 await page.locator('[data-act="liturgyview"][data-v="byz"]').click();
 const choose=async(name)=>{await page.locator('.liturgical-text .reader-offline').first().locator('summary').click();await page.locator('#liturgical-file').setInputFiles({name,mimeType:'application/pdf',buffer:pdf()});await page.waitForFunction(()=>!document.querySelector('[data-reader="open"]').disabled);};
 await choose('<reader-test>.pdf');
 assert.equal(await page.locator('.reader-status img').count(),0);
 await page.locator('[data-reader="open"]').click();
 await page.waitForFunction(()=>document.querySelector('#reader-status')?.textContent==='Page 1 of 2');
 assert.equal(await page.locator('#reader-page').isVisible(),true);
 await page.locator('[data-reader="next"]').click();await page.waitForFunction(()=>document.querySelector('#reader-status')?.textContent==='Page 2 of 2');
 await page.locator('[data-reader="mode"]').click();await page.waitForFunction(()=>document.querySelector('#reader-text')?.textContent.includes('page two'));
 assert.equal(await page.locator('#reader-page').isVisible(),false);
 await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
 const audit=await page.evaluate(()=>axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}}));
 violations.push(...audit.violations.map(v=>({tab:'private-reader',id:v.id,examples:v.nodes.map(n=>({html:n.html,summary:n.failureSummary}))})));
 await page.screenshot({path:path.join(artifacts,'liturgical-text-reader.png'),fullPage:true});
 await page.locator('[data-reader="close"]').click();
 // An invalid replacement leaves the original and its bookmark intact.
 page.once('dialog',d=>d.accept());
 await page.locator('#liturgical-file').setInputFiles({name:'invalid.pdf',mimeType:'application/pdf',buffer:Buffer.from('not a PDF')});
 await page.waitForFunction(()=>document.querySelector('.reader-status')?.textContent.includes('previous text is unchanged'));
 await page.reload();await page.waitForFunction(()=>!document.querySelector('[data-reader="open"]').disabled);
 await page.locator('[data-reader="open"]').click();await page.waitForFunction(()=>document.querySelector('#reader-status')?.textContent==='Page 2 of 2');
 await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('#liturgical-reader').open);
 // Date selection chooses a different slot, rather than relabelling Chrysostom's PDF.
 await page.goto(`${base}index.html?tab=liturgy&date=2026-04-02`);
 assert.match(await page.locator('#app .card > h2').innerText(),/Basil the Great/);
 await page.waitForFunction(()=>document.querySelector('.reader-status')?.textContent.includes('No text saved'));
 await choose('Basil-test.pdf');
 assert.deepEqual(await page.evaluate(async()=>{const records=await LiturgyReader.all();return records.map(r=>r.id).sort();}),['basil','chrysostom']);
 await page.goto(`${base}index.html?tab=liturgy&date=2026-04-03`);
 assert.match(await page.locator('#app .card > h2').innerText(),/No Divine Liturgy/);assert.equal(await page.locator('[data-reader="open"]').count(),0);
 await page.goto(`${base}index.html?tab=liturgy&date=2026-04-01`);
 assert.match(await page.locator('#app .card > h2').innerText(),/Presanctified/);
 await page.evaluate(async()=>{await navigator.serviceWorker.ready;if(!navigator.serviceWorker.controller)await new Promise(r=>navigator.serviceWorker.addEventListener('controllerchange',r,{once:true}));});
 await context.setOffline(true);
 await page.goto(`${base}index.html?tab=liturgy&date=2026-11-11`);
 await page.waitForFunction(()=>!document.querySelector('[data-reader="open"]').disabled);
 await page.locator('[data-reader="open"]').click();await page.waitForFunction(()=>document.querySelector('#reader-status')?.textContent==='Page 2 of 2');
 await page.locator('[data-reader="mode"]').click();await page.waitForFunction(()=>document.querySelector('#reader-text')?.textContent.includes('page two'));
 await page.locator('[data-reader="close"]').click();await context.setOffline(false);
 await page.locator('.liturgical-text .reader-offline').first().locator('summary').click();page.once('dialog',d=>d.accept());await page.locator('[data-reader="remove"]').click();
 await page.waitForFunction(()=>document.querySelector('[data-reader="open"]').disabled);
 assert.equal(await page.evaluate(async()=>!!await LiturgyReader.get('basil')),true,'removal leaves the other service book intact');
 assert.deepEqual(requests,[],'private documents generate no upload requests');page.off('request',watch);
 console.log('Private PDF: validation, canvas, text, bookmarks, slots, deletion, offline and no uploads passed.');
};
