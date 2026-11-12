/* Official publisher sources are framed when permitted. Never proxy or bypass publisher restrictions. */
(function(){'use strict';
const allowed=new Set(['mci.archpitt.org','www.liturgyoffice.org.uk','www.usccb.org']);
const dialog=()=>document.getElementById('source-reader');
const frame=()=>document.getElementById('source-reader-frame');
function close(){const d=dialog();if(d.open)d.close();frame().removeAttribute('src');}
document.addEventListener('click',event=>{
 const closeButton=event.target.closest('#source-reader-close');if(closeButton){close();return;}
 const a=event.target.closest('a[href]');if(!a||!a.closest('.liturgical-text, #app'))return;
 if(!a.closest('.liturgical-text')&&!a.closest('#app .card'))return;
 if(!document.querySelector('nav [data-tab="liturgy"][aria-current="page"]'))return;
 let url;try{url=new URL(a.href,location.href);}catch(_){return;}
 if(url.protocol!=='https:'||!allowed.has(url.hostname))return;
 event.preventDefault();const d=dialog();document.getElementById('source-reader-title').textContent=a.textContent.trim()||'Official source';
 document.getElementById('source-reader-original').href=url.href;
 document.getElementById('source-reader-note').textContent='Viewing the publisher’s current source. If it does not load here, select Open original.';
 const isPdf=/\\.pdf$/i.test(url.pathname);
 if(isPdf){url.hash='view=FitH&zoom=page-width';document.getElementById('source-reader-note').textContent='Fit-to-width requested. If Safari ignores PDF zoom settings, use Open original for its native PDF controls.';}
 frame().src=url.href;d.showModal();
});
document.addEventListener('DOMContentLoaded',()=>{dialog().addEventListener('close',()=>frame().removeAttribute('src'));});
})();
