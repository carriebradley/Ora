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
  function card(id,{church='ukrainian',date='',dayTitle='',dayRank=''}={}){
    if(!labels[id])return '<p class="muted">No service book for this date.</p>';
    const roman=id==='roman';
    return `<section class="liturgical-text simple-liturgical-text" data-text-id="${id}" data-day-title="${escape(dayTitle)}" data-day-date="${escape(date)}" data-day-rank="${escape(dayRank)}" aria-label="Prayers of the day">
      ${roman?'':`<div class="step liturgy-opening"><div class="t">Sign of the Cross</div><div class="tx">${escape(CONTENT.TEXTS.cross)}</div></div>`}
      ${inlinePanel(roman)}
      <details class="reader-offline"><summary>${roman?'Manage saved Missal':id==='melkite-chrysostom'?'Manage Melkite Divine Liturgy PDF':'Manage saved Divine Liturgy book'}</summary>
        
        <p class="reader-status" role="status">Checking saved book…</p>
        <button class="btn" data-reader="open" disabled>Open original book</button>
        <label for="liturgical-file">Choose a PDF or EPUB</label>
        <input class="reader-file" id="liturgical-file" type="file" accept="application/pdf,application/epub+zip,.pdf,.epub" aria-describedby="reader-storage-note">
        <p class="muted" id="reader-storage-note" style="font-size:.78rem;line-height:1.45;margin:8px 0">Books and bookmarks stay on this device. Keep the original PDF or EPUB elsewhere: clearing Safari website data or reinstalling Ora may erase the saved copy.</p>
        ${id==='chrysostom'?'<p class="muted byz-book-source">Year-round English booklet: <a href="https://abvmcalgary.com/site/wp-content/uploads/2025/04/PDF-Divine-Liturgy-Eng.pdf" target="_blank" rel="noopener noreferrer">Ukrainian Catholic St. John Chrysostom</a>. Download it and select the PDF above; your saved book is not replaced automatically.</p>':id==='melkite-chrysostom'?'<p class="muted byz-book-source">Year-round English booklet: <a href="https://melkite.org/faith/faith-worship/new-english-translation-of-the-divine-liturgy" target="_blank" rel="noopener noreferrer">Melkite Diocese of Newton · St. John Chrysostom</a>. Download the diocesan PDF and select it above.</p>':''}
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
  // Shared layout parser; keep source-specific PDF page ranges separate.
  function addPrayerSections(sections,rows,heading=null){
    if(heading)sections.push({heading,lines:[]});
    if(!rows.length)return;
    const groups=[];
    for(const row of rows){
      const alternative=row.alternative||'';
      if(groups.at(-1)?.alternative!==alternative)groups.push({alternative,rows:[]});
      groups.at(-1).rows.push(row);
    }
    for(const group of groups){
      const combined=combinePdfLines(group.rows).filter(line=>
        !LiturgicalFormat.pdfFolioLine(line)&&
        !/^(?:page \d+|table of contents|contents|notes|rubrics)$/i.test(line));
      if(!combined.length)continue;
      if(group.alternative){
        const name=group.alternative==='sunday'?'Sunday':'Weekday';
        const choice=/^(?:Sunday|Weekday)\b/i.test(combined[0])?combined.shift():name;
        if(combined.length)sections.push({alternative:group.alternative,heading:choice,lines:combined});
      }else sections.push({lines:combined});
    }
  }
  async function edmontonPrayerText(book){
    if(book.numPages!==140)return null;
    const marker=await book.getPage(4);
    const meta=(await marker.getTextContent()).items.map(x=>x.str).join(' ').replace(/\s+/g,' ');
    if(!/official translation of the Ukrainian Greek/i.test(meta)||!/Chrysostom/i.test(meta))return null;
    const sections=[{heading:'Divine Liturgy of St. John Chrysostom',lines:[]}];
    // This 2012 edition alternates Ukrainian and English. The English proper
    // is on odd, one-based PDF pages 33–113. Omit facing-language pages and
    // the appendix, but keep the printed words and optional antiphons.
    for(let number=33;number<=113;number+=2){
      const page=await book.getPage(number);
      const items=(await page.getTextContent()).items;
      const rows=LiturgicalFormat.pdfRows(LiturgicalFormat.englishPdfItems(items),number).filter(row=>
        !/^Episcopal Divine Liturgy 2012 WEB|^Layout 1|^Page \d+/i.test(row.text));
      const heading=number===33?'Liturgy of the Word':number===69?'Liturgy of the Eucharist':number===83?'Anaphora':number===99?'Holy Communion':null;
      addPrayerSections(sections,number===39||number===45?LiturgicalFormat.edmontonFirstAntiphonRows(rows,number===45?'Entrance Antiphon':'First Antiphon'):rows,heading);
    }
    if(sections.reduce((n,part)=>n+part.lines.length,0)<3)return null;
    sections.edmonton2012=true;
    return LiturgicalFormat.expandEdmontonCherubicThreefold(LiturgicalFormat.expandEdmontonRemainingThreefold(
      LiturgicalFormat.expandEdmontonThreefoldResponses(LiturgicalFormat.expandEdmontonTrisagionTwofold(LiturgicalFormat.repairEdmontonWrappedWords(LiturgicalFormat.joinEdmontonCommunionPrayerPageBreak(LiturgicalFormat.joinEdmontonThanksgivingPageBreak(LiturgicalFormat.joinEdmontonLordsPrayerPageBreak(LiturgicalFormat.joinEdmontonChurchPrayerPageBreak(LiturgicalFormat.joinEdmontonCreedPageBreak(LiturgicalFormat.joinEdmontonGreatLitanyPageBreak(sections)))))))))));
  }

  // Generic PDF reading view for a user's private Melkite copy. Unlike the
  // alternating-language Edmonton booklet, do not assume fixed page numbers.
  async function standardPrayerText(book,id){
    const sections=[];let foundLiturgy=false;
    // The user's Melkite 2009 *final draft* contains Kairos, vesting,
    // prothesis, Orthros, and post-Liturgy appendices. Only its actual
    // Chrysostom Liturgy (PDF pages 30–96) belongs in this prayer view.
    // Identify the edition before applying page boundaries to other PDFs.
    let startPage=1,endPage=book.numPages,recognizedNewtonEdition=false;
    if(id==='melkite-chrysostom'&&book.numPages===159){
      const notice=await book.getPage(2);
      const imprint=(await notice.getTextContent()).items.map(item=>item.str).join(' ').replace(/\s+/g,' ');
      if(/FINAL\s+DRAFT\s+EDITION/i.test(imprint)&&/COMMON\s+ENGLISH\s+TRANSLATION/i.test(imprint)){
        startPage=30;endPage=96;foundLiturgy=true;recognizedNewtonEdition=true;
      }
    }
    for(let number=startPage;number<=endPage;number++){
      const page=await book.getPage(number),items=(await page.getTextContent()).items;
      const lines=LiturgicalFormat.pdfRows(id==='chrysostom'?LiturgicalFormat.englishPdfItems(items):items,number);
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
        if(LiturgicalFormat.pdfFolioLine(line)||/^(?:page \d+|table of contents|contents|notes|rubrics)$/i.test(line))return false;
        return true;
      });
      addPrayerSections(sections,end<0?lines:lines.slice(0,end),
        number===startPage&&startPage===30?'Divine Liturgy of St. John Chrysostom':null);
      if(end>=0)break;
    }
    if(recognizedNewtonEdition)sections.newton2009=true;
    return foundLiturgy&&sections.length?sections:null;
  }
  // Unknown user-saved PDFs still deserve a full scrollable reading view.
  // These bytes remain on-device. Preserve page order and never claim that
  // an unrecognized PDF is a verified liturgical edition or an English service.
  async function continuousSavedPdfText(book){
    const sections=[];
    for(let number=1;number<=book.numPages;number++){
      const page=await book.getPage(number);
      const content=await page.getTextContent();
      const rows=LiturgicalFormat.pdfRows(LiturgicalFormat.englishPdfItems(content.items),number);
      if(!rows.length)continue;
      const lines=combinePdfLines(rows);
      if(lines.length)sections.push({lines});
    }
    return sections.length?sections:null;
  }
  async function isEaster2018Booklet(book){
   if(book.numPages!==26)return false;
   const page=await book.getPage(1);
   const text=(await page.getTextContent()).items.map(i=>i.str).join(' ').replace(/\s+/g,' ');
   return /Easter\s*Season/i.test(text)&&/St\.?\s*Josaphat/i.test(text)&&/2018/.test(text);
  }
  // Editorial details stay in the collapsed saved-book manager, never
  // between a prayer heading and the spoken words.
  function showSeasonalBookletNote(section){
   const manager=section.querySelector('.reader-offline');
   if(!manager)return;
   manager.querySelector('.byz-seasonal-booklet-note')?.remove();
   const p=document.createElement('p');p.className='muted byz-seasonal-booklet-note';
   p.textContent='Saved edition: Easter season. For other dates, a year-round English booklet is available above.';
   manager.append(p);
  }

  // Visual call-and-response cues, inferred only from labels printed in the
  // saved booklet. Do not invent speaker assignments for unlabelled lines.
  const roleLine=LiturgicalFormat.role,liturgicalInstruction=LiturgicalFormat.instruction;
  function renderEdmontonPrayerText(target,sections){
    target.replaceChildren();
    target.classList.add('reader-byzantine-prayers');

    const headingPattern=/^(?:Great Litany|Litany of Peace|Small Litany|First Antiphon|Second Antiphon|Third Antiphon|Antiphon:\s*Psalm\s*\d+|Entrance Antiphon|Entrance with the Gospel|Little Entrance|Great Entrance|Prayer of Entrance|Trisagion(?: Hymn| Prayer)?|Prayer of the Trisagion|Only-Begotten Son|Cherubic Hymn|Prayer Before the Gospel|Prayer for the Faithful|Troparia(?:\s*&\s*Kontakia)?|Creed|Symbol of Faith|Prayer of the Cherubic Hymn|Litany for the Gifts|Anaphora|Holy Anaphora|Confession of Love|Thanksgiving|Remembrance|Epiclesis|The Lord.s Prayer|One is Holy|Communion Hymn|Prayer Before Holy Communion|Holy Communion|Blessing with the Holy Gifts|Prayer of Thanksgiving|Prayer Behind the Ambo|Dismissal)$/i;
    let lastLine=null,lastRole=null,lastMajor=null,lastHeading=null,pendingRole=null;
    // A printed annual hymn index is not an appointed prayer for today.
    // Skip it until the next recognized service heading. Keep the source
    // book and the separate date-specific proper records untouched.
    let inReferenceTable=false;
    // The Newton printed Kontakia/Hirmoi tables belong only to the Melkite
    // edition. Never apply their boundaries to Ukrainian or other books.
    const melkiteBook=target.closest('[data-text-id]')?.dataset.textId==='melkite-chrysostom'&&sections.newton2009===true;
    let container=target;
    const date=target.closest('[data-day-date]')?.dataset.dayDate;
    const sunday=date&&new Date(date+'T00:00:00Z').getUTCDay()===0;
    // On feasts the ordinary antiphons must not be mistaken for appointed propers.
    const specialRank=target.closest('[data-day-rank]')?.dataset.dayRank||'';
    const festal=/\b(?:feast|vigil|holy week|holy day)\b/i.test(specialRank);
    const shownSections=LiturgicalFormat.expandNewtonPeaceLitany(LiturgicalFormat.expandNewtonEktene(LiturgicalFormat.expandNewtonAitesis(LiturgicalFormat.expandNewtonCommunionPreparation(LiturgicalFormat.expandNewtonGiftLitany(sections)))));
    const optionalLitany=melkiteBook?LiturgicalFormat.newtonOptionalPetitions(shownSections):null;
    const baptismal=shownSections.edmonton2012===true?LiturgicalFormat.edmontonBaptismalAlternative(shownSections):null;
    let optionalLitanyDetails=null,baptismalDetails=null;
    for(let sectionIndex=0;sectionIndex<shownSections.length;sectionIndex++){
      const section=shownSections[sectionIndex];
      // PDF pages are extraction sections, not necessarily liturgical
      // paragraph boundaries. Retain a bare speaker cue for the next page,
      // but never carry it into a new heading or alternative antiphon.
      container=target;lastLine=null;lastRole=null;
      if(section.heading||section.alternative)pendingRole=null;
      if(section.alternative){
        const choice=document.createElement('details');choice.className='byz-antiphon-option';
        choice.open=!festal&&section.alternative===(sunday?'sunday':'weekday');
        const summary=document.createElement('summary');summary.textContent=section.heading||section.alternative;
        choice.append(summary);target.append(choice);container=choice;
      }
      if(section.heading&&!section.alternative){const h=document.createElement(section.dailyProper?'h4':'h3');h.className=section.dailyProper?'byz-prayer-heading byz-daily-proper-heading':'byz-major-heading';h.textContent=section.heading;container.append(h);lastMajor=section.heading;lastHeading=section.heading.toLowerCase();lastLine=null;lastRole=null;}
      for(let lineIndex=0;lineIndex<section.lines.length;lineIndex++){
        const raw=section.lines[lineIndex];
        const slot=sectionIndex+':'+lineIndex;
        if(baptismal?.starts.has(slot)){
          baptismalDetails=document.createElement('details');
          baptismalDetails.className='byz-antiphon-option byz-seasonal-hymn';
          const summary=document.createElement('summary');
          summary.textContent='Baptismal Hymn (only on appointed feasts)';
          baptismalDetails.append(summary);target.append(baptismalDetails);
          lastLine=null;lastRole=null;pendingRole=null;continue;
        }
        if(baptismalDetails){
          if(baptismal?.lines.has(slot))container=baptismalDetails;
          else{baptismalDetails=null;container=target;lastLine=null;lastRole=null;pendingRole=null;}
        }
        if(optionalLitany?.starts.has(slot)){
          optionalLitanyDetails=document.createElement('details');
          optionalLitanyDetails.className='byz-antiphon-option byz-optional-litany';
          const summary=document.createElement('summary');summary.textContent=optionalLitany.labels?.get(slot)||'Optional petitions';
          optionalLitanyDetails.append(summary);target.append(optionalLitanyDetails);
          lastLine=null;lastRole=null;pendingRole=null;continue;
        }
        if(optionalLitanyDetails){
          if(optionalLitany?.lines.has(slot))container=optionalLitanyDetails;
          else{optionalLitanyDetails=null;container=target;lastLine=null;lastRole=null;}
        }
        let text=String(raw||'').trim();
        // The verified optional Newton dismissal prints the mercy response
        // once followed by a repetition count. Supply the spoken triple only
        // inside its positively matched (and collapsed) optional block.
        if(optionalLitany?.triples.has(slot))text='Lord, have mercy. Lord, have mercy. Lord, have mercy.';
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
        const normalizedHeading=normalizePdfLine(text);
        // Only the exact source-verified boundary ends an annual reference
        // table. Generic headings inside the table must never resume prayer.
        const boundary=melkiteBook?LiturgicalFormat.melkiteReferenceBoundary(text):null;
        if(boundary==='kontakia-start'||boundary==='hirmoi-start'||boundary==='apolyses-start'){
          inReferenceTable=true;pendingRole=null;continue;
        }
        if(inReferenceTable){
          if(boundary==='kontakia-end'||boundary==='hirmoi-end'||boundary==='apolyses-end'){
            inReferenceTable=false;
          }else continue;
        }
        if(/^(?:Divine Liturgy of St\. John Chrysostom|Liturgy of the Word|Liturgy of the Eucharist|Anaphora|Holy Communion)$/i.test(text)){
          if(text!==lastMajor){const h=document.createElement('h3');h.className='byz-major-heading';h.textContent=text;container.append(h);lastMajor=text;lastHeading=text.toLowerCase();}
          lastLine=null;lastRole=null;pendingRole=null;continue;
        }
        if(heading || headingPattern.test(text) || isPdfHeading(text) ||
           boundary==='kontakia-end') {
          const normalized=normalizePdfLine(text);
          // PDFs repeat running headings at page breaks. Avoid a second
          // identical title, but retain headings that recur later in prayer.
          if(lastHeading!==normalized.toLowerCase()){
            const h=document.createElement('h4');h.className='byz-prayer-heading';h.textContent=normalized;container.append(h);
          }
          lastHeading=normalized.toLowerCase();lastLine=null;lastRole=null;pendingRole=null;continue;
        }
        let role=roleLine(text);
        // A bare printed label (e.g. PRIEST:) can end a PDF page.
        // Do not render an empty speaker block or lose its attribution.
        if(role&&!role.words){pendingRole=role;lastLine=null;lastRole=null;continue;}
        if(!role && liturgicalInstruction(text)){
          // Only prayers and responses belong in Ora's reading view.
          // Retain a printed minister attribution for the following prayer,
          // but never display posture, gesture, movement or other rubrics.
          pendingRole=LiturgicalFormat.speakerInstruction(text);
          lastLine=null;lastRole=null;continue;
        }
        // An explicit Arabic/Greek sung label must retain its language,
        // even if an unrelated minister cue ended the preceding PDF page.
        if(!role&&pendingRole&&!/^(?:Arabic|Greek)\s*:/i.test(text))role={...pendingRole,words:text};
        pendingRole=null;
        lastHeading=null;
        const p=document.createElement('p');
        p.className='byz-prayer-line';
        // Keep sung phonetic versions, but distinguish them visually from
        // the English prayer without changing their source spelling.
        const transliteration=text.match(/^(Arabic|Greek)\s*:\s*(.+)$/i);
        if(transliteration&&!role){
          p.classList.add('byz-transliteration');
          const language=document.createElement('span');
          language.className='byz-transliteration-label';
          language.textContent=transliteration[1];
          const words=document.createElement('span');
          words.className='byz-transliteration-words';
          words.textContent=LiturgicalFormat.displayPrayer(transliteration[2]);
          p.append(language,words);
          container.append(p);lastLine=p;lastRole=null;
          continue;
        }
        if(role){
          p.classList.add('byz-role-'+role.kind);
          const speaker=document.createElement('span');
          speaker.className='byz-speaker';speaker.textContent=role.name;
          p.append(speaker);

          if(role.words){
            const words=document.createElement('span');words.className='byz-prayer-words';words.textContent=LiturgicalFormat.displayPrayer(role.words);p.append(words);
          }
          lastRole=role.kind;
        }else{
          p.textContent=LiturgicalFormat.displayPrayer(text);lastRole=null;
        }
        container.append(p);lastLine=p;
      }
    }
  }
  // Compose the day's verified hymns around semantic headings in the user's
  // privately saved book. Unknown/seasonal editions remain unchanged.
  function arrangeDailyHymns(section,preview,sections,{recognized=true,seasonal=false}={}){
    const id=section.dataset.textId;
    if(!recognized||seasonal||!['chrysostom','melkite-chrysostom'].includes(id)||
       typeof LiturgyDocument==='undefined')return;
    const church=id.startsWith('melkite-')?'melkite':'ukrainian';
    const iso=section.dataset.dayDate,request=hydrateVersion;
    LiturgyDocument.loadRecord(church,iso).then(record=>{
      if(!record||!section.isConnected||request!==hydrateVersion||
         document.querySelector('.liturgical-text')!==section)return;
      const result=LiturgyDocument.compose(sections,record,{church,iso,id});
      if(result.placed.length)renderEdmontonPrayerText(preview,result.sections);
      section.dataset.placedDaily=result.placed.join(',');
      // Rehydrating an edited saved book may make an earlier hymn placement
      // unsafe. Restore all unplaced dated groups, not just remove placed
      // ones. This must work when zero groups can be inserted.
      const extra=document.querySelector('.byz-daily-propers[data-iso="'+iso+'"][data-church="'+church+'"]');
      if(extra){
        extra.replaceChildren();
        for(const [key,label] of Object.entries(LiturgyDocument.labels)){
          if(result.placed.includes(key))continue;
          const lines=LiturgicalFormat.properPrayerLines(record.groups?.[key]);
          if(!lines.length)continue;
          const group=document.createElement('section');
          group.className='byz-proper-group';group.dataset.proper=key;
          const heading=document.createElement('h3');heading.textContent=LiturgyDocument.properLabel(key,record.groups?.[key]);group.append(heading);
          for(const raw of lines){
            if(typeof raw!=='string'||!raw.trim())continue;
            const p=document.createElement('p');
            p.textContent=LiturgyDocument.displayLine(raw);group.append(p);
          }
          extra.append(group);
        }
      }
    });
  }
  async function hydrate(){
    const token=++hydrateVersion,section=document.querySelector('.liturgical-text');if(!section)return;
    section.querySelector('.byz-seasonal-booklet-note')?.remove();
    delete section.dataset.placedDaily;
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
          const reading=await prayerPreview(saved,book,async b=>{
            const liturgy=await standardPrayerText(b,section.dataset.textId);
            return liturgy?{sections:liturgy,recognized:true}:
              {sections:await continuousSavedPdfText(b),recognized:false};
          });
          if(!section.isConnected||token!==hydrateVersion)return;
          // A private, unrecognized PDF still reads continuously. Never
          // treat its unverified text as a known edition or inject dated hymns.
          continuous=true;
          if(reading?.sections){
            renderEdmontonPrayerText(preview,reading.sections);
            if(reading.recognized)arrangeDailyHymns(section,preview,reading.sections);
            status.textContent=(reading.recognized?labels[section.dataset.textId]:
              'Saved PDF · continuous English text (unverified edition)')+' · saved privately on this device';
          }else{
            preview.textContent='No selectable English text was found in this PDF. Open the original book to view it.';
            status.textContent='Saved PDF · open original book for images · saved privately on this device';
          }
        }else if(section.dataset.textId==='chrysostom'&&book.kind!=='epub'){
          status.textContent='Preparing the English prayers from your saved Edmonton booklet…';
          const reading=await prayerPreview(saved,book,async b=>{
            const seasonal=await isEaster2018Booklet(b);
            const liturgy=await edmontonPrayerText(b)||await standardPrayerText(b,section.dataset.textId);
            if(liturgy)return {sections:LiturgicalFormat.startAtOpeningBlessing(liturgy),recognized:true,seasonal};
            const fallback=await continuousSavedPdfText(b);
            return {sections:fallback?LiturgicalFormat.startAtOpeningBlessing(fallback):null,recognized:false,seasonal};
          });
          if(!section.isConnected||token!==hydrateVersion)return;
          // Do not require a recognized edition merely to read the saved PDF
          // without the Previous/Next page controls.
          continuous=true;
          if(reading?.sections){
            renderEdmontonPrayerText(preview,reading.sections);
            arrangeDailyHymns(section,preview,reading.sections,{recognized:reading.recognized,seasonal:reading.seasonal});
            if(reading.seasonal)showSeasonalBookletNote(section);
            status.textContent=(reading.recognized?'Ukrainian Divine Liturgy':'Saved PDF · English-only continuous text')+' · saved privately on this device';
          }else{
            preview.replaceChildren();
            preview.textContent='No selectable English text was found in this PDF. Open original book to view it. If this file contains only Ukrainian, use an English-language edition instead.';
            status.textContent='Saved PDF · open original book for images · saved on this device';
          }
        }else if(book.kind==='epub'){
          const prayers=LiturgicalFormat.epubPrayerSections(book.sections);
          renderEdmontonPrayerText(preview,prayers);
          // Apply exactly dated hymns to eligible EPUBs too. Unrecognized
          // sections never receive guessed insertions; saved books remain immutable.
          arrangeDailyHymns(section,preview,prayers);
          continuous=true;
        }
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


