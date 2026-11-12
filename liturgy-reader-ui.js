/* Documents stay in IndexedDB on this device. No upload or remote PDF viewer. */
(function(){
  'use strict';
  const labels={roman:'Roman Mass',chrysostom:'St. John Chrysostom',basil:'St. Basil the Great',presanctified:'Presanctified Gifts'};
  const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const previewBooks=new Map();let hydrateVersion=0;
  function inlinePanel(roman){return `<div class="reader-inline-panel" ${roman?'data-roman="true"':''}><div class="reader-inline-text" aria-label="Prayers of the day" hidden></div>${roman?'<div class="roman-fixed-prayers" hidden><div class="roman-gloria"></div><div class="roman-creed"></div><section class="roman-eucharistic"><h3>Eucharistic Prayer</h3><div class="roman-eucharistic-options" role="group" aria-label="Choose Eucharistic Prayer"><button class="btn on" data-reader="eucharistic" data-choice="1" aria-pressed="true">I</button><button class="btn" data-reader="eucharistic" data-choice="2" aria-pressed="false">II</button><button class="btn" data-reader="eucharistic" data-choice="3" aria-pressed="false">III</button><button class="btn" data-reader="eucharistic" data-choice="4" aria-pressed="false">IV</button></div><div class="roman-eucharistic-text" aria-live="polite"></div></section></div>':''}${roman?'':'<div class="row reader-inline-controls" hidden><button class="btn" data-reader="inline-prev">Previous</button><span class="reader-inline-page muted"></span><button class="btn" data-reader="inline-next">Next</button></div>'}</div>`;}
  function card(id,{church='ukrainian',date='',dayTitle=''}={}){
    if(!labels[id])return '<p class="muted">No service book for this date.</p>';
    const roman=id==='roman';
    return `<section class="liturgical-text simple-liturgical-text" data-text-id="${id}" data-day-title="${escape(dayTitle)}" aria-label="Prayers of the day">
      ${inlinePanel(roman)}
      <details class="reader-offline"><summary>${roman?'Manage saved Missal':'Manage saved Divine Liturgy book'}</summary>
        <p class="reader-status" role="status">Checking saved book…</p>
        <button class="btn" data-reader="open" disabled>Open original book</button>
        <label for="liturgical-file">Choose a PDF or EPUB</label>
        <input class="reader-file" id="liturgical-file" type="file" accept="application/pdf,application/epub+zip,.pdf,.epub">
        <button class="btn" data-reader="remove" disabled>Remove saved book</button>
      </details>
    </section>`;
  }
  function bookOptions(section,book,query=''){
    const select=section.querySelector('#inline-book-section');if(!select)return;select.replaceChildren();
    const term=query.trim().toLocaleLowerCase();
    book.sections.forEach((part,i)=>{if(term&&![part.title,...part.blocks.map(b=>b.text)].join(' ').toLocaleLowerCase().includes(term))return;const option=document.createElement('option');option.value=i+1;option.textContent=(i+1)+'. '+part.title;select.append(option);});
    select.value=section.dataset.inlinePage;
  }
  function bookText(target,part,action,showLinks=true,clear=true){
    if(clear)target.replaceChildren();const h=document.createElement('h3');h.textContent=part.title;target.append(h);
    for(const block of part.blocks){const el=document.createElement(block.tag);el.textContent=block.text;target.append(el);}
    if(showLinks&&part.links?.length){const links=document.createElement('div');links.className='row reader-book-links';for(const link of part.links){const button=document.createElement('button');button.type='button';button.className='btn';button.dataset.reader=action;button.dataset.page=link.page;button.textContent=link.title;links.append(button);}target.append(links);}
  }
  function renderFixed(section,book){
    const fixed=section.querySelector('.roman-fixed-prayers');if(!fixed)return;
    fixed.hidden=false;
    for(const [type,selector,label] of [['gloria','.roman-gloria','Gloria'],['creed','.roman-creed','Nicene Creed']]){
      const target=fixed.querySelector(selector),part=RomanMissal.fixed(book.sections,type);
      target.replaceChildren();
      const h=document.createElement('h3');h.textContent=label;target.append(h);
      if(part)for(const block of RomanMissal.prayers(part).blocks){const el=document.createElement(block.tag);el.textContent=block.text;target.append(el);}
      else{const p=document.createElement('p');p.className='muted';p.textContent='Not found as a separate prayer in the saved Missal.';target.append(p);}
    }
    const choice=section.dataset.eucharisticChoice||'1';
    section.querySelectorAll('[data-reader="eucharistic"]').forEach(b=>{const active=b.dataset.choice===choice;b.classList.toggle('on',active);b.setAttribute('aria-pressed',String(active));});
    const target=fixed.querySelector('.roman-eucharistic-text');target.replaceChildren();
    const part=RomanMissal.fixed(book.sections,choice);
    if(part)for(const block of RomanMissal.prayers(part).blocks){const el=document.createElement(block.tag);el.textContent=block.text;target.append(el);}
    else target.textContent='Eucharistic Prayer '+choice+' was not found as a separate section in the saved Missal.';
  }
  async function hydrate(){
    const token=++hydrateVersion,section=document.querySelector('.liturgical-text');if(!section)return;
    const status=section.querySelector('.reader-status'),preview=section.querySelector('.reader-inline-text'),controls=section.querySelector('.reader-inline-controls'),tools=null;
    try{const saved=await LiturgyReader.get(section.dataset.textId);if(!section.isConnected||token!==hydrateVersion)return;
      status.textContent=saved?`${saved.name} · ${saved.pages} ${saved.format==='epub'?'sections':'pages'} · saved on this device`:'No text saved for this service yet.';
      section.querySelector('[data-reader="open"]').disabled=!saved;section.querySelector('[data-reader="remove"]').disabled=!saved;
      if(!saved){const fixed=section.querySelector('.roman-fixed-prayers');if(fixed)fixed.hidden=true;previewBooks.delete(section.dataset.textId);preview.hidden=true;preview.replaceChildren();if(controls)controls.hidden=true;return;}
      let book;
      try{
        if(saved.format==='epub'){
          const cached=previewBooks.get(saved.id);
          if(!cached||cached.updated!==saved.updated)previewBooks.set(saved.id,{updated:saved.updated,promise:LiturgyReader.load(saved.blob,saved.format)});
          book=await previewBooks.get(saved.id).promise;
        }else book=await LiturgyReader.load(saved.blob,saved.format);
        if(!section.isConnected||token!==hydrateVersion)return;
        const roman=section.dataset.textId==='roman'&&book.kind==='epub';
        const matches=roman?RomanMissal.match(book.sections,section.dataset.dayTitle):[];
        const selected=Math.max(1,Math.min(book.numPages,Number(section.dataset.inlinePage)||(matches[0])||saved.page||1));section.dataset.inlinePage=selected;
        
        preview.classList.toggle('reader-inline-missal',roman);
        if(roman){
          preview.replaceChildren();
          if(matches.length){
            const part=RomanMissal.prayers(book.sections[selected-1]);
            bookText(preview,part,'inline-jump',false,false);
            renderFixed(section,book);
          }else{
            preview.textContent='Daily prayers are not available for this date in the saved Missal.';
          }
        }else if(book.kind==='epub'){const part=book.sections[selected-1];preview.textContent=part.title+'\n\n'+part.blocks.map(b=>b.text).join('\n\n');}
        else{const page=await book.getPage(selected),content=await page.getTextContent();if(!section.isConnected||token!==hydrateVersion)return;preview.textContent=content.items.map(item=>item.str+(item.hasEOL?'\n':' ')).join('').trim()||'This page has no selectable text. Use Open saved text for the original page.';}
        preview.hidden=false;if(controls)controls.hidden=false;if(controls)controls.querySelector('.reader-inline-page').textContent=`${book.kind==='epub'?'Section':'Page'} ${selected} of ${book.numPages}`;if(controls)controls.querySelector('[data-reader="inline-prev"]').disabled=selected<=1;if(controls)controls.querySelector('[data-reader="inline-next"]').disabled=selected>=book.numPages;
      }catch(_){if(section.isConnected&&token===hydrateVersion){preview.textContent='Preview unavailable. Use Open saved text to view this book.';preview.hidden=false;}}
      finally{if(book&&book.kind!=='epub')await book.destroy();}
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
      if(myDoc.kind==='epub'){
        const part=myDoc.sections[pageNumber-1],text=d.querySelector('#reader-text');
        d.querySelector('canvas').hidden=true;text.hidden=false;text.replaceChildren();
        bookText(text,part,'jump');
        d.querySelector('#reader-section').value=String(pageNumber);
        status.textContent=`Section ${pageNumber} of ${myDoc.numPages}`;d.scrollTop=0;
        await LiturgyReader.bookmark(myRecord.id,pageNumber);return;
      }
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
    const d=dialog();d.innerHTML='<h2 id="reader-title">Liturgical Text</h2><div class="reader-tools"><div class="row"><button class="btn" data-reader="close">Close</button><button class="btn" data-reader="previous" disabled aria-label="Previous page">‹</button><label for="reader-number" style="margin:0"><span id="reader-unit">Page</span> <input id="reader-number" type="number" min="1" value="1" step="1"></label><button class="btn" data-reader="next" disabled aria-label="Next page">›</button><button class="btn" data-reader="mode" aria-pressed="false">Text view</button></div><div id="reader-chapters" hidden><label for="reader-search">Find a prayer or section</label><input id="reader-search" type="search" placeholder="Search saved book"><label for="reader-section">Section</label><select id="reader-section"></select><p id="reader-search-status" role="status"></p></div><p id="reader-status" role="status">Opening text…</p><a id="reader-original" class="btn" hidden target="_blank" rel="noopener">Open original PDF</a></div><canvas id="reader-page" role="img" aria-label="Liturgical text page" hidden></canvas><div id="reader-text" hidden></div>';
    d.showModal();
    try{
      const saved=await LiturgyReader.get(id);if(token!==session)return;if(!saved)throw new Error('No saved text.');
      const loaded=await LiturgyReader.load(saved.blob,saved.format);if(token!==session){await loaded.destroy();return;}
      doc=loaded;record=saved;d.querySelector('h2').textContent='Liturgical Text · '+labels[id];
      d.querySelector('#reader-number').max=loaded.numPages;objectURL=URL.createObjectURL(saved.blob);const original=d.querySelector('#reader-original');original.href=objectURL;original.hidden=false;
      if(loaded.kind==='epub'){d.querySelector('[data-reader="mode"]').hidden=true;d.querySelector('#reader-unit').textContent='Section';d.querySelector('#reader-chapters').hidden=false;original.textContent='Download original EPUB';original.download=saved.name;fillSections();}
      await showPage(saved.page||1);
    }catch(_){if(token===session)d.querySelector('#reader-status').textContent='This book could not be opened. Use an unencrypted PDF or EPUB with readable text.';}
  }
  function fillSections(query=''){
    if(!doc||doc.kind!=='epub')return;
    const select=dialog().querySelector('#reader-section');select.replaceChildren();
    const term=query.trim().toLocaleLowerCase();let found=0;
    doc.sections.forEach((section,i)=>{
      if(term&&!([section.title,...section.blocks.map(b=>b.text)].join(' ').toLocaleLowerCase().includes(term)))return;
      const option=document.createElement('option');option.value=i+1;option.textContent=(i+1)+'. '+section.title;select.append(option);found++;
    });
    select.value=String(pageNumber);dialog().querySelector('#reader-search-status').textContent=term?found+' matching sections':'';
  }
  document.addEventListener('input',async e=>{if(e.target.id==='reader-search')fillSections(e.target.value);if(e.target.id==='inline-book-search'){const section=e.target.closest('.liturgical-text'),cached=previewBooks.get(section.dataset.textId);if(cached)bookOptions(section,await cached.promise,e.target.value);}});
  document.addEventListener('click',async e=>{
    const b=e.target.closest('[data-reader]');if(!b)return;
    const action=b.dataset.reader,section=b.closest('.liturgical-text'),id=section?.dataset.textId;
    if(action==='eucharistic'){section.dataset.eucharisticChoice=b.dataset.choice;const cached=previewBooks.get('roman');if(cached){const book=await cached.promise;renderFixed(section,book);}return;}
    if(action==='jump'){await showPage(b.dataset.page);return;}
    if(action==='inline-jump'){if(!section)return;section.dataset.inlinePage=b.dataset.page;await LiturgyReader.bookmark(id,Number(b.dataset.page));await hydrate();return;}
    if(action==='inline-prev'||action==='inline-next'){if(!section)return;const current=Number(section.dataset.inlinePage)||1;section.dataset.inlinePage=Math.max(1,current+(action==='inline-next'?1:-1));section.querySelector('.reader-inline-text').textContent='Loading page…';await LiturgyReader.bookmark(id,Number(section.dataset.inlinePage));await hydrate();return;}
    if(action==='open'){await open(id,b);return;}
    if(action==='remove'){
      if(!confirm('Remove this service’s saved book from this device?'))return;
      try{await LiturgyReader.remove(id);await hydrate();}catch(_){section.querySelector('.reader-status').textContent='The text could not be removed. Please try again.';}return;
    }
    if(action==='close'){dialog().close();return;}
    if(action==='previous')await showPage(pageNumber-1);
    if(action==='next')await showPage(pageNumber+1);
    if(action==='mode'){textMode=!textMode;b.textContent=textMode?'Page view':'Text view';b.setAttribute('aria-pressed',String(textMode));await showPage(pageNumber);}
  });
  document.addEventListener('change',async e=>{
    if(e.target.id==='inline-book-section'){const section=e.target.closest('.liturgical-text');section.dataset.inlinePage=e.target.value;await LiturgyReader.bookmark(section.dataset.textId,Number(e.target.value));await hydrate();return;}
    if(e.target.id==='reader-section'){await showPage(e.target.value);return;}
    if(e.target.id==='reader-number'){await showPage(e.target.value);return;}
    if(e.target.id!=='liturgical-file')return;
    const file=e.target.files[0],section=e.target.closest('.liturgical-text');if(!file||!section)return;
    const id=section.dataset.textId,status=section.querySelector('.reader-status');e.target.disabled=true;
    try{const previous=await LiturgyReader.get(id);if(previous&&!confirm('Replace the saved book for '+labels[id]+'?'))return;
      status.textContent='Checking and saving text…';await LiturgyReader.save(id,file);delete section.dataset.inlinePage;await hydrate();
    }catch(error){if(section.isConnected)status.textContent='Text was not saved. '+(error.name==='QuotaExceededError'?'Device storage is full.':error.message==='This file is not a PDF or EPUB.'?error.message:'Choose an unencrypted PDF or EPUB with readable text, smaller than 100 MB.')+' Your previous text is unchanged.';
    }finally{e.target.disabled=false;e.target.value='';}
  });
  document.addEventListener('DOMContentLoaded',()=>{
    dialog().addEventListener('close',()=>{cleanup().catch(()=>{});(returnFocus?.isConnected?returnFocus:document.querySelector('[data-reader="open"]'))?.focus();});
  });
  window.LiturgicalText={card,hydrate};
})();

