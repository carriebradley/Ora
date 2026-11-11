/* Documents stay in IndexedDB on this device. No upload or remote PDF viewer. */
(function(){
  'use strict';
  const labels={roman:'Roman Mass',chrysostom:'St. John Chrysostom',basil:'St. Basil the Great',presanctified:'Presanctified Gifts'};
  const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function card(id){
    if(!labels[id])return '<p class="muted">No service book is selected for this date. Consult the monthly directions above.</p>';
    return `<section class="liturgical-text" data-text-id="${id}" aria-label="Liturgical Text"><h3>Liturgical Text</h3><p class="muted">${escape(labels[id])} · a PDF saved privately on this device. Daily readings update with the date; the PDF retains its own pages.</p><p class="reader-status" role="status">Checking saved text…</p><div class="reader-inline-text" aria-label="Saved liturgical text preview" hidden style="white-space:pre-wrap;line-height:1.7;max-height:55vh;overflow:auto"></div><div class="row"><button class="btn fill" data-reader="open" disabled>Open Text</button></div><details><summary>Choose or replace text</summary><label for="liturgical-file">PDF for ${escape(labels[id])}</label><input class="reader-file" id="liturgical-file" type="file" accept="application/pdf,.pdf"><p class="muted">Up to 100 MB. A new file replaces only this service’s book. Browser storage can be cleared; keep your original PDF.</p><button class="btn" data-reader="remove" disabled>Remove saved text</button></details><details><summary>Source texts</summary>${id==='roman'?'<p><a href="https://www.liturgyoffice.org.uk/Missal/Text/MCFL.pdf" target="_blank" rel="noopener">Order of Mass · England and Wales</a></p><p class="muted">Official 2011 leaflet of the fixed prayers and responses, with copyright notices. It is not the complete Missal or the daily propers. Save the PDF to Files, then choose it above.</p>':`${['chrysostom','basil'].includes(id)?'<p><a class="btn" href="https://mci.archpitt.org/servicebooks/DivineLiturgies.pdf" target="_blank" rel="noopener">Official Pittsburgh service book · Chrysostom and Basil</a></p><p class="muted">English people’s book with prayers, responses and hymns. Save the original PDF to Files, then choose it above for this service. The same book covers both liturgies; it does not contain every clergy prayer. Keep its copyright notices.</p>':''}${id==='presanctified'?'<p class="muted">MCI does not currently offer the official Pittsburgh Presanctified book electronically. <a href="https://mci.archpitt.org/Publications.html" target="_blank" rel="noopener">Publication information</a>. You may select your own permitted PDF above.</p>':''}`}</details></section>`;
  }
  async function hydrate(){
    const section=document.querySelector('.liturgical-text');if(!section)return;
    const status=section.querySelector('.reader-status');
    try{const record=await LiturgyReader.get(section.dataset.textId);if(!section.isConnected)return;
      status.textContent=record?`${record.name} · ${record.pages} pages · saved on this device`:'No PDF saved for this service yet.';
      section.querySelector('[data-reader="open"]').disabled=!record;section.querySelector('[data-reader="remove"]').disabled=!record;
      const preview=section.querySelector('.reader-inline-text');
      if(record){
        try{
          const pdf=await LiturgyReader.load(record.blob);
          try{
            const page=await pdf.getPage(Math.max(1,Math.min(pdf.numPages,record.page||1)));
            const content=await page.getTextContent();
            if(!section.isConnected)return;
            const value=content.items.map(item=>item.str+(item.hasEOL?'\n':' ')).join('').trim();
            preview.textContent=value||'This page has no selectable text. Use Open Text for the original page.';
            preview.hidden=false;
          }finally{await pdf.destroy();}
        }catch(_){if(section.isConnected){preview.textContent='Preview unavailable. Use Open Text to view the saved PDF.';preview.hidden=false;}}
      }else{preview.hidden=true;preview.textContent='';}
    }catch(_){if(section.isConnected)status.textContent='Device storage is unavailable. You can still open the source links.';}
  }
  let doc=null,task=null,session=0,pageVersion=0,pageNumber=1,record=null,objectURL=null,returnFocus=null,textMode=false;
  const dialog=()=>document.getElementById('liturgical-reader');
  async function cleanup(){
    ++session;++pageVersion;if(task){task.cancel();task=null;}
    const old=doc;doc=null;record=null;if(objectURL){URL.revokeObjectURL(objectURL);objectURL=null;}if(old)await old.destroy();
  }
  async function showPage(number){
    if(!doc||!record)return;
    const version=++pageVersion,myDoc=doc,myRecord=record;
    if(task){task.cancel();task=null;}
    pageNumber=Math.max(1,Math.min(doc.numPages,Math.floor(Number(number)||1)));
    const d=dialog(),input=d.querySelector('#reader-number'),status=d.querySelector('#reader-status');
    input.value=pageNumber;d.querySelector('[data-reader="previous"]').disabled=pageNumber===1;d.querySelector('[data-reader="next"]').disabled=pageNumber===doc.numPages;
    status.textContent='Loading page…';
    try{
      const p=await myDoc.getPage(pageNumber);if(version!==pageVersion)return;
      const canvas=d.querySelector('canvas'),text=d.querySelector('#reader-text');canvas.hidden=textMode;text.hidden=!textMode;
      if(textMode){const content=await p.getTextContent();if(version!==pageVersion)return;text.textContent=content.items.map(i=>i.str+(i.hasEOL?'\n':' ')).join('');if(!text.textContent.trim())text.textContent='This page is an image without selectable text. Use Page view.';}
      else{
        const original=p.getViewport({scale:1}),width=Math.min(860,d.clientWidth-34),ratio=Math.min(devicePixelRatio||1,2);
        const viewport=p.getViewport({scale:Math.max(100,width)/original.width*ratio});canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);
        canvas.setAttribute('aria-label',`Page ${pageNumber} of ${myDoc.numPages}. Select Text view for readable text.`);
        task=p.render({canvasContext:canvas.getContext('2d'),viewport});await task.promise;if(version!==pageVersion)return;task=null;
      }
      status.textContent=`Page ${pageNumber} of ${myDoc.numPages}`;
      await LiturgyReader.bookmark(myRecord.id,pageNumber);
    }catch(e){if(version===pageVersion&&e.name!=='RenderingCancelledException')status.textContent='This page could not be displayed. Try Text view or Open original PDF.';}
  }
  async function open(id,button){
    await cleanup();const token=++session;returnFocus=button;textMode=false;
    const d=dialog();d.innerHTML='<h2 id="reader-title">Liturgical Text</h2><div class="reader-tools"><div class="row"><button class="btn" data-reader="close">Close</button><button class="btn" data-reader="previous" disabled aria-label="Previous page">‹</button><label for="reader-number" style="margin:0">Page <input id="reader-number" type="number" min="1" value="1" step="1"></label><button class="btn" data-reader="next" disabled aria-label="Next page">›</button><button class="btn" data-reader="mode" aria-pressed="false">Text view</button></div><p id="reader-status" role="status">Opening text…</p><a id="reader-original" class="btn" hidden target="_blank" rel="noopener">Open original PDF</a></div><canvas id="reader-page" role="img" aria-label="Liturgical text page" hidden></canvas><div id="reader-text" hidden></div>';
    d.showModal();
    try{
      const saved=await LiturgyReader.get(id);if(token!==session)return;if(!saved)throw new Error('No saved text.');
      const loaded=await LiturgyReader.load(saved.blob);if(token!==session){await loaded.destroy();return;}
      doc=loaded;record=saved;d.querySelector('h2').textContent='Liturgical Text · '+labels[id];
      d.querySelector('#reader-number').max=loaded.numPages;objectURL=URL.createObjectURL(saved.blob);const original=d.querySelector('#reader-original');original.href=objectURL;original.hidden=false;
      await showPage(saved.page||1);
    }catch(_){if(token===session)d.querySelector('#reader-status').textContent='The PDF could not be opened. Encrypted or damaged PDFs are not supported.';}
  }
  document.addEventListener('click',async e=>{
    const b=e.target.closest('[data-reader]');if(!b)return;
    const action=b.dataset.reader,section=b.closest('.liturgical-text'),id=section?.dataset.textId;
    if(action==='open'){await open(id,b);return;}
    if(action==='remove'){
      if(!confirm('Remove this service’s saved PDF from this device?'))return;
      try{await LiturgyReader.remove(id);await hydrate();}catch(_){section.querySelector('.reader-status').textContent='The text could not be removed. Please try again.';}return;
    }
    if(action==='close'){dialog().close();return;}
    if(action==='previous')await showPage(pageNumber-1);
    if(action==='next')await showPage(pageNumber+1);
    if(action==='mode'){textMode=!textMode;b.textContent=textMode?'Page view':'Text view';b.setAttribute('aria-pressed',String(textMode));await showPage(pageNumber);}
  });
  document.addEventListener('change',async e=>{
    if(e.target.id==='reader-number'){await showPage(e.target.value);return;}
    if(e.target.id!=='liturgical-file')return;
    const file=e.target.files[0],section=e.target.closest('.liturgical-text');if(!file||!section)return;
    const id=section.dataset.textId,status=section.querySelector('.reader-status');e.target.disabled=true;
    try{const previous=await LiturgyReader.get(id);if(previous&&!confirm('Replace the saved PDF for '+labels[id]+'?'))return;
      status.textContent='Checking and saving PDF…';await LiturgyReader.save(id,file);await hydrate();
    }catch(error){if(section.isConnected)status.textContent='PDF was not saved. '+(error.name==='QuotaExceededError'?'Device storage is full.':error.message==='This file is not a PDF.'?error.message:'Choose an unencrypted, valid PDF smaller than 100 MB.')+' Your previous text is unchanged.';
    }finally{e.target.disabled=false;e.target.value='';}
  });
  document.addEventListener('DOMContentLoaded',()=>{
    dialog().addEventListener('close',()=>{cleanup().catch(()=>{});(returnFocus?.isConnected?returnFocus:document.querySelector('[data-reader="open"]'))?.focus();});
  });
  window.LiturgicalText={card,hydrate};
})();
