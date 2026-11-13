/* Documents stay in IndexedDB on this device. No upload or remote PDF viewer. */
(function(){
  'use strict';
  const labels={roman:'Roman Mass',chrysostom:'St. John Chrysostom · Edmonton', 'melkite-chrysostom':'St. John Chrysostom · Melkite',basil:'St. Basil the Great',presanctified:'Presanctified Gifts · Ukrainian','melkite-basil':'St. Basil the Great · Melkite','melkite-presanctified':'Presanctified Gifts · Melkite'};
  const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const previewBooks=new Map(),prayerPreviews=new Map();let hydrateVersion=0;
  async function prayerPreview(saved,book,parser){
    const cached=prayerPreviews.get(saved.id);
    if(!cached||cached.updated!==saved.updated)prayerPreviews.set(saved.id,{updated:saved.updated,promise:parser(book)});
    return prayerPreviews.get(saved.id).promise;
  }
  function inlinePanel(roman){return `<div class="reader-inline-panel" ${roman?'data-roman="true"':''}><div class="reader-inline-text" aria-label="Prayers of the day" hidden></div>${roman?'':'<div class="row reader-inline-controls" hidden><button class="btn" data-reader="inline-prev">Previous</button><span class="reader-inline-page muted"></span><button class="btn" data-reader="inline-next">Next</button></div>'}</div>`;}
  function card(id,{church='ukrainian',date='',dayTitle=''}={}){
    if(!labels[id])return '<p class="muted">No service book for this date.</p>';
    const roman=id==='roman';
    return `<section class="liturgical-text simple-liturgical-text" data-text-id="${id}" data-day-title="${escape(dayTitle)}" data-day-date="${escape(date)}" aria-label="Prayers of the day">
      ${roman?'':`<div class="step liturgy-opening"><div class="t">Sign of the Cross</div><div class="tx">${escape(CONTENT.TEXTS.cross)}</div></div>`}
      ${inlinePanel(roman)}
      <details class="reader-offline"><summary>${roman?'Manage saved Missal':id==='melkite-chrysostom'?'Manage Melkite Divine Liturgy PDF':'Manage saved Divine Liturgy book'}</summary>
        
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
  function appendMassPart(target,label,blocks){
    if(!blocks?.length)return;
    const wrapper=document.createElement('section');wrapper.className='roman-mass-part';
    const h=document.createElement('h3');h.textContent=label;wrapper.append(h);
    for(const block of blocks){const el=document.createElement(['p','h4','pre','blockquote'].includes(block.tag)?block.tag:'p');el.textContent=block.text;if(block.role==='all')el.classList.add('roman-response');wrapper.append(el);}
    target.append(wrapper);
  }
  function renderEucharistic(section,book){
    const choice=section.dataset.eucharisticChoice||'1',target=section.querySelector('.roman-eucharistic-text');if(!target)return;
    section.querySelectorAll('[data-reader="eucharistic"]').forEach(b=>{const on=b.dataset.choice===choice;b.classList.toggle('on',on);b.setAttribute('aria-pressed',String(on));});
    target.replaceChildren();const part=RomanMissal.fixed(book.sections,choice);
    if(part){for(const block of RomanMissal.prayers(part).blocks){const el=document.createElement(['p','h4','pre'].includes(block.tag)?block.tag:'p');el.textContent=block.text;if(block.role==='all')el.classList.add('roman-response');target.append(el);}}
    else target.textContent='This Eucharistic Prayer was not found in your saved Missal.';
  }
  function renderRoman(section,book,part){
    const target=section.querySelector('.reader-inline-text');target.replaceChildren();
    const proper=RomanMissal.propers(part),fixed=type=>{const s=RomanMissal.fixed(book.sections,type);return s?RomanMissal.prayers(s).blocks:null;};
    appendMassPart(target,'Entrance Antiphon',proper.entrance);
    appendMassPart(target,'Gloria',fixed('gloria'));
    appendMassPart(target,'Collect',proper.collect);
    // Readings are available in their own tab.
    appendMassPart(target,'Apostles’ Creed',fixed('apostles'));
    if(!fixed('apostles'))appendMassPart(target,'Nicene Creed',fixed('creed'));
    appendMassPart(target,'Prayer over the Offerings',proper.offerings);
    const sectionEp=document.createElement('section');sectionEp.className='roman-mass-part roman-eucharistic';
    const heading=document.createElement('h3');heading.textContent='Eucharistic Prayer';sectionEp.append(heading);
    const opts=document.createElement('div');opts.className='roman-eucharistic-options';opts.setAttribute('role','group');opts.setAttribute('aria-label','Choose Eucharistic Prayer');
    for(const n of ['1','2','3','4']){const button=document.createElement('button');button.type='button';button.className='btn';button.dataset.reader='eucharistic';button.dataset.choice=n;button.textContent=['I','II','III','IV'][Number(n)-1];opts.append(button);}
    sectionEp.append(opts);const text=document.createElement('div');text.className='roman-eucharistic-text';text.setAttribute('aria-live','polite');sectionEp.append(text);target.append(sectionEp);
    renderEucharistic(section,book);
    appendMassPart(target,'Communion Antiphon',proper.communion);
    appendMassPart(target,'Prayer after Communion',proper.after);
  }

  // The 2012 Edmonton episcopal booklet alternates Ukrainian and English pages.
  // Process only a device-local copy, and never package or transmit its content.
  // Combine physical PDF lines without joining distinct responses. Tracking
  // spaces and soft hyphenation are artifacts of the PDF, not prayer text.
  const normalizePdfLine=LiturgicalFormat.normalize,isPdfHeading=LiturgicalFormat.heading,combinePdfLines=LiturgicalFormat.combine;
  async function edmontonPrayerText(book){
    if(book.numPages!==140)return null;
    const marker=await book.getPage(4);
    const meta=(await marker.getTextContent()).items.map(x=>x.str).join(' ').replace(/\s+/g,' ');
    if(!/official translation of the Ukrainian Greek/i.test(meta)||!/Chrysostom/i.test(meta))return null;
    const sections=[];
    // PDF pages 33-113 (one-based, odd pages) are the English liturgy proper.
    // Page 115 starts additional personal prayers and page 31 episcopal preparation.
    for(let number=33;number<=113;number+=2){
      const page=await book.getPage(number);
      const items=(await page.getTextContent()).items;
      const lines=LiturgicalFormat.pdfRows(items,number);
      const clean=combinePdfLines(lines).filter(line=>{
        if(/^\d{1,3}$/.test(line))return false;
        if(/^Episcopal Divine Liturgy 2012 WEB|^Layout 1|^Page \d+/i.test(line))return false;
        return true;
      });
      const heading=number===33?'Liturgy of the Word':number===69?'Liturgy of the Eucharist':number===83?'Anaphora':number===99?'Holy Communion':null;
      sections.push({heading,lines:clean});
    }
    return sections;
  }

  // Generic PDF reading view for a user's private Melkite copy. Unlike the
  // alternating-language Edmonton booklet, do not assume fixed page numbers.
  async function standardPrayerText(book,id){
    const sections=[];let foundLiturgy=false;
    // The user's Melkite 2009 *final draft* contains Kairos, vesting,
    // prothesis, Orthros, and post-Liturgy appendices. Only its actual
    // Chrysostom Liturgy (PDF pages 30–96) belongs in this prayer view.
    // Identify the edition before applying page boundaries to other PDFs.
    let startPage=1,endPage=book.numPages;
    if(id==='melkite-chrysostom'&&book.numPages===159){
      const notice=await book.getPage(2);
      const imprint=(await notice.getTextContent()).items.map(item=>item.str).join(' ').replace(/\s+/g,' ');
      if(/FINAL\s+DRAFT\s+EDITION/i.test(imprint)&&/COMMON\s+ENGLISH\s+TRANSLATION/i.test(imprint)){
        startPage=30;endPage=96;foundLiturgy=true;
      }
    }
    for(let number=startPage;number<=endPage;number++){
      const page=await book.getPage(number),items=(await page.getTextContent()).items;
      const lines=LiturgicalFormat.pdfRows(items,number);
      if(!lines.length)continue;
      const full=lines.map(row=>row.text).join(' ');
      if(!foundLiturgy){
        // Avoid a table-of-contents match: liturgy must also have actual prayers.
        if(/(?:divine liturgy of (?:our father among the saints )?(?:saint|st\.?) john chrysostom|the divine liturgy)/i.test(full)&&/(?:blessed is the kingdom|in peace let us pray|lord, have mercy)/i.test(full))foundLiturgy=true;
        else if(/(?:blessed is the kingdom|(?:deacon|priest):\s*in peace let us pray to the lord)/i.test(full))foundLiturgy=true;
        else if(id.endsWith('presanctified')&&/blessed is our God/i.test(full))foundLiturgy=true;
        else continue;
      }
      const end=lines.findIndex(line=>/^(?:appendix|appendices|glossary|acknowledg(?:e)?ments|prayers (?:before|after) (?:the )?(?:divine liturgy|liturgy)|private prayers|about (?:this|the) (?:book|translation))$/i.test(line.text)||/^APPENDIX(?:\d+)?$/.test(String(line.text).replace(/[^a-z0-9]/gi,'').toUpperCase()));
      const clean=combinePdfLines(end<0?lines:lines.slice(0,end)).filter(line=>{
        if(/^(?:\d{1,4}|page \d+|table of contents|contents|notes|rubrics)$/i.test(line))return false;
        return true;
      });
      if(lines.some(row=>row.alternative)){
        const groups=[];
        for(const row of (end<0?lines:lines.slice(0,end))){
          const kind=row.alternative||'';
          if(groups.at(-1)?.alternative!==kind)groups.push({alternative:kind,rows:[]});
          groups.at(-1).rows.push(row);
        }
        for(const group of groups){
          const combined=combinePdfLines(group.rows).filter(line=>!/^\d{1,4}$/.test(line));
          if(!combined.length)continue;
          const heading=group.alternative?combined.shift():null;
          sections.push({alternative:group.alternative,heading,lines:combined});
        }
      }else if(clean.length)sections.push({heading:number===startPage&&startPage===30?'Divine Liturgy of St. John Chrysostom':null,lines:clean});
      if(end>=0)break;
    }
    return foundLiturgy&&sections.length?sections:null;
  }
  // Visual call-and-response cues, inferred only from labels printed in the
  // saved booklet. Do not invent speaker assignments for unlabelled lines.
  const roleLine=LiturgicalFormat.role,liturgicalInstruction=LiturgicalFormat.instruction;
  function renderEdmontonPrayerText(target,sections){
    target.replaceChildren();
    target.classList.add('reader-byzantine-prayers');
    target.classList.remove('byz-show-rubrics');
    const toolbar=document.createElement('div');
    toolbar.className='byz-reader-preferences';
    const toggle=document.createElement('button');
    toggle.type='button';toggle.className='byz-rubrics-toggle';
    toggle.textContent='Show liturgical instructions';
    toggle.setAttribute('aria-pressed','false');
    toggle.addEventListener('click',()=>{
      const visible=target.classList.toggle('byz-show-rubrics');
      toggle.setAttribute('aria-pressed',String(visible));
      toggle.textContent=visible?'Hide liturgical instructions':'Show liturgical instructions';
    });
    toolbar.append(toggle);target.append(toolbar);
    const headingPattern=/^(?:Great Litany|Litany of Peace|Small Litany|First Antiphon|Second Antiphon|Third Antiphon|Antiphon:\s*Psalm\s*\d+|Entrance Antiphon|Entrance with the Gospel|Little Entrance|Great Entrance|Prayer of Entrance|Trisagion(?: Hymn| Prayer)?|Prayer of the Trisagion|Only-Begotten Son|Cherubic Hymn|Prayer Before the Gospel|Prayer for the Faithful|Troparia(?:\s*&\s*Kontakia)?|Creed|Symbol of Faith|Prayer of the Cherubic Hymn|Litany for the Gifts|Anaphora|Holy Anaphora|Confession of Love|Thanksgiving|Remembrance|Epiclesis|The Lord.s Prayer|One is Holy|Communion Hymn|Prayer Before Holy Communion|Holy Communion|Blessing with the Holy Gifts|Prayer of Thanksgiving|Prayer Behind the Ambo|Dismissal)$/i;
    let lastLine=null,lastRole=null,lastMajor=null,lastHeading=null,pendingRole=null;
    let container=target;
    const date=target.closest('[data-day-date]')?.dataset.dayDate;
    const sunday=date&&new Date(date+'T00:00:00Z').getUTCDay()===0;
    for(const section of sections){
      container=target;lastLine=null;lastRole=null;pendingRole=null;
      if(section.alternative){
        const choice=document.createElement('details');choice.className='byz-antiphon-option';
        choice.open=section.alternative===(sunday?'sunday':'weekday');
        const summary=document.createElement('summary');summary.textContent=section.heading||section.alternative;
        choice.append(summary);target.append(choice);container=choice;
      }
      if(section.heading&&!section.alternative){const h=document.createElement('h3');h.className='byz-major-heading';h.textContent=section.heading;container.append(h);lastMajor=section.heading;lastHeading=section.heading.toLowerCase();lastLine=null;lastRole=null;}
      for(let lineIndex=0;lineIndex<section.lines.length;lineIndex++){
        const raw=section.lines[lineIndex];
        let text=String(raw||'').trim();
        // Some PDFs extract tracked uppercase display headings as isolated
        // letters and break a heading mid-word across physical lines.
        // Repair only known headings; never alter the wording of prayers.
        const compactHeading=s=>String(s).replace(/[^A-Za-z]/g,'').toUpperCase();
        const knownHeadings={
          THEKAIROSSERVICE:'The Kairos Service',
          PRAYERSBEFORETHEHOLYDOORS:'Prayers Before the Holy Doors',
          LITURGYOFTHEWORD:'Liturgy of the Word',
          LITURGYOFTHEEUCHARIST:'Liturgy of the Eucharist'
        };
        let heading=knownHeadings[compactHeading(text)];
        if(!heading&&lineIndex+1<section.lines.length){
          const joined=compactHeading(text+' '+section.lines[lineIndex+1]);
          heading=knownHeadings[joined];
          if(heading)lineIndex++;
        }
        if(heading)text=heading;
        if(!text)continue;
        if(/^(?:Liturgy of the Word|Liturgy of the Eucharist|Anaphora|Holy Communion)$/i.test(text)){
          if(text!==lastMajor){const h=document.createElement('h3');h.className='byz-major-heading';h.textContent=text;container.append(h);lastMajor=text;lastHeading=text.toLowerCase();}
          lastLine=null;lastRole=null;pendingRole=null;continue;
        }
        if(heading || headingPattern.test(text) || isPdfHeading(text)) {
          const normalized=normalizePdfLine(text);
          // PDFs repeat running headings at page breaks. Avoid a second
          // identical title, but retain headings that recur later in prayer.
          if(lastHeading!==normalized.toLowerCase()){
            const h=document.createElement('h4');h.className='byz-prayer-heading';h.textContent=normalized;container.append(h);
          }
          lastHeading=normalized.toLowerCase();lastLine=null;lastRole=null;pendingRole=null;continue;
        }
        let role=roleLine(text);
        if(!role && liturgicalInstruction(text)){
          const rubric=document.createElement('p');
          rubric.className='byz-rubric';
          const flag=document.createElement('span');flag.className='byz-rubric-label';flag.textContent='Instruction';
          const words=document.createElement('span');words.textContent=text;
          rubric.append(flag,words);container.append(rubric);
          pendingRole=LiturgicalFormat.speakerInstruction(text);
          lastLine=null;lastRole=null;pendingRole=null;continue;
        }
        if(!role&&pendingRole)role={...pendingRole,words:text};
        pendingRole=null;
        lastHeading=null;
        const p=document.createElement('p');
        p.className='byz-prayer-line';
        if(role){
          p.classList.add('byz-role-'+role.kind);
          const speaker=document.createElement('span');
          speaker.className='byz-speaker';speaker.textContent=role.name;
          p.append(speaker);
          if(role.cue){const cue=document.createElement('span');cue.className='byz-rubric';cue.textContent=role.cue;p.append(cue);}
          if(role.words){
            const words=document.createElement('span');words.className='byz-prayer-words';words.textContent=role.words;p.append(words);
          }
          lastRole=role.kind;
        }else{
          p.textContent=text;lastRole=null;
        }
        container.append(p);lastLine=p;
      }
    }
  }
  async function hydrate(){
    const token=++hydrateVersion,section=document.querySelector('.liturgical-text');if(!section)return;
    const status=section.querySelector('.reader-status'),preview=section.querySelector('.reader-inline-text'),controls=section.querySelector('.reader-inline-controls'),tools=null;
    try{const saved=await LiturgyReader.get(section.dataset.textId);if(!section.isConnected||token!==hydrateVersion)return;
      status.textContent=saved?`${saved.name} · ${saved.pages} ${saved.format==='epub'?'sections':'pages'} · saved on this device`:'No text saved for this service yet.';
      section.querySelector('[data-reader="open"]').disabled=!saved;section.querySelector('[data-reader="remove"]').disabled=!saved;
      if(!saved){previewBooks.delete(section.dataset.textId);prayerPreviews.delete(section.dataset.textId);preview.hidden=true;preview.replaceChildren();if(controls)controls.hidden=true;return;}
      let book,continuous=false;
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
        preview.classList.remove('reader-byzantine-prayers');
        if(roman){
          preview.replaceChildren();
          if(matches.length){
            renderRoman(section,book,book.sections[matches[0]-1]);
          }else{
            preview.textContent='Daily prayers are not available for this date in the saved Missal.';
          }
        }else if((section.dataset.textId.startsWith('melkite-')||['basil','presanctified'].includes(section.dataset.textId))&&book.kind!=='epub'){
          status.textContent='Preparing your saved prayers…';
          const liturgy=await prayerPreview(saved,book,b=>standardPrayerText(b,section.dataset.textId));
          if(!section.isConnected||token!==hydrateVersion)return;
          if(liturgy){
            renderEdmontonPrayerText(preview,liturgy);continuous=true;
            status.textContent=labels[section.dataset.textId]+' · saved privately on this device';
          }else preview.textContent='The prayers could not be identified in this PDF. Open the original book below to read it.';
        }else if(section.dataset.textId==='chrysostom'&&book.kind!=='epub'){
          status.textContent='Preparing the English prayers from your saved Edmonton booklet…';
          const liturgy=await prayerPreview(saved,book,edmontonPrayerText);
          if(!section.isConnected||token!==hydrateVersion)return;
          if(liturgy){
            renderEdmontonPrayerText(preview,liturgy);continuous=true;
            status.textContent='Edmonton Divine Liturgy · saved privately on this device';
          }else{
            const page=await book.getPage(selected),content=await page.getTextContent();
            preview.textContent=content.items.map(item=>item.str+(item.hasEOL?'\n':' ')).join('').trim()||'No selectable text on this page.';
          }
        }else if(book.kind==='epub'){const part=book.sections[selected-1];renderEdmontonPrayerText(preview,[{heading:part.title,lines:part.blocks.map(b=>b.kind==='instruction'?'Instruction: '+b.text:b.role==='all'?'ALL: '+b.text:b.text)}]);}
        else{const page=await book.getPage(selected),content=await page.getTextContent();if(!section.isConnected||token!==hydrateVersion)return;preview.textContent=content.items.map(item=>item.str+(item.hasEOL?'\n':' ')).join('').trim()||'This page has no selectable text. Use Open saved text for the original page.';}
        preview.hidden=false;if(controls)controls.hidden=continuous;if(controls)controls.querySelector('.reader-inline-page').textContent=`${book.kind==='epub'?'Section':'Page'} ${selected} of ${book.numPages}`;if(controls)controls.querySelector('[data-reader="inline-prev"]').disabled=selected<=1;if(controls)controls.querySelector('[data-reader="inline-next"]').disabled=selected>=book.numPages;
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
    if(action==='eucharistic'){section.dataset.eucharisticChoice=b.dataset.choice;const cached=previewBooks.get('roman');if(cached){const book=await cached.promise;renderEucharistic(section,book);}return;}
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


