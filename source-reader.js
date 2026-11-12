/* Mobile-first official-source reader. Remote PDF extraction requires publisher CORS permission. */
(function(){'use strict';
const allowed=new Set(['mci.archpitt.org','www.liturgyoffice.org.uk','www.usccb.org','eeparchy.com','melkite.org']);
const $=id=>document.getElementById(id);
let pdf=null,token=0,page=1,font=18,restore=null;
async function reset(){token++;const old=pdf;pdf=null;if(old)try{await old.destroy();}catch(_){}}
function update(){const d=$('source-reader');d.style.setProperty('--reader-font',font+'px');$('source-font-size').textContent=font+'px';}
async function showPage(){
 if(!pdf)return;const current=token;page=Math.max(1,Math.min(pdf.numPages,page));
 $('source-reader-text').textContent='Loading page…';$('source-page-label').textContent=page+' / '+pdf.numPages;
 $('source-prev').disabled=page===1;$('source-next').disabled=page===pdf.numPages;
 try{const p=await pdf.getPage(page),data=await p.getTextContent();if(current!==token)return;
 const lines=[];let line='';for(const item of data.items){line+=item.str+(item.hasEOL?'':' ');if(item.hasEOL){lines.push(line.trim());line='';}}if(line.trim())lines.push(line.trim());
 $('source-reader-text').textContent=lines.join('\n')||'This page contains no selectable text. Open the original PDF.';
 $('source-reader-text').scrollTop=0;
 }catch(_){if(current===token)$('source-reader-text').textContent='Unable to extract this page. Open the original document.';}
}
function showOriginal(url){
 $('source-reader-controls').hidden=true;
 $('source-reader-text').hidden=true;const frame=$('source-reader-frame');frame.hidden=false;frame.setAttribute('sandbox','allow-scripts allow-same-origin allow-popups');frame.src=url.href;
 $('source-reader-note').textContent='Original publisher document. If it cannot display here, use Open original. Personal files can also be opened in Optional offline text.';
}
async function open(a,url){
 await reset();const current=token;restore=a;page=1;const d=$('source-reader');
 $('source-reader-title').textContent=a.textContent.trim()||'Official source';
 $('source-reader-original').href=url.href;
 $('source-reader-text').hidden=false;$('source-reader-frame').hidden=true;$('source-reader-frame').removeAttribute('src');
 $('source-reader-text').textContent='Loading readable text…';$('source-reader-note').textContent='Single-column reading · official publisher source.';
 $('source-reader-pages').hidden=true;$('source-reader-controls').hidden=false;update();d.showModal();
 if(!/\.pdf$/i.test(url.pathname)){ showOriginal(url);return;}
 try{
   const lib=await import('./vendor/pdfjs/pdf.mjs');lib.GlobalWorkerOptions.workerSrc='./vendor/pdfjs/pdf.worker.mjs';
   const task=lib.getDocument({url:url.href,isEvalSupported:false,enableXfa:false});const loaded=await task.promise;
   if(current!==token){await loaded.destroy();return;}pdf=loaded;$('source-reader-pages').hidden=false;await showPage();
 }catch(_){if(current!==token)return;showOriginal(url);}
}
document.addEventListener('click',e=>{
 const button=e.target.closest('button');
 if(button?.id==='source-reader-close'){$('source-reader').close();return;}
 if(button?.id==='source-prev'){page--;showPage();return;}
 if(button?.id==='source-next'){page++;showPage();return;}
 if(button?.id==='source-font-minus'){font=Math.max(14,font-2);update();return;}
 if(button?.id==='source-font-plus'){font=Math.min(30,font+2);update();return;}
 const a=e.target.closest('a[href]');if(!a||!a.closest('#app'))return;
 if(!a.closest('.liturgical-text,.more-liturgy'))return;
 let url;try{url=new URL(a.href,location.href);}catch(_){return;}
 if(url.protocol!=='https:'||!allowed.has(url.hostname))return;
 e.preventDefault();open(a,url);
});
document.addEventListener('DOMContentLoaded',()=>{$('source-reader').addEventListener('close',()=>{reset();$('source-reader-frame').removeAttribute('src');restore?.focus();});});
})();
