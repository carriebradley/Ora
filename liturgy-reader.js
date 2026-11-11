/* Private, device-local PDF library. No document upload or third-party viewer. */
(function(root) {
  'use strict';
  const DB = 'ora-liturgical-texts', VERSION = 1, MAX = 100 * 1024 * 1024;
  let opening;
  function database() {
    if (!opening) opening = new Promise((resolve,reject)=>{
      const r=indexedDB.open(DB,VERSION);
      r.onupgradeneeded=()=>r.result.createObjectStore('documents',{keyPath:'id'});
      r.onsuccess=()=>{const db=r.result;db.onversionchange=()=>{db.close();opening=null;};resolve(db);};
      r.onerror=()=>{opening=null;reject(r.error);};
      r.onblocked=()=>{opening=null;reject(new Error('Close other Ora windows and try again.'));};
    });
    return opening;
  }
  async function request(mode, work) {
    const db=await database();
    return new Promise((resolve,reject)=>{
      const tx=db.transaction('documents',mode);let value;
      const r=work(tx.objectStore('documents'));r.onsuccess=()=>{value=r.result;};
      tx.oncomplete=()=>resolve(value);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error || new Error('Document could not be saved.'));
    });
  }
  const get=id=>request('readonly',s=>s.get(id));
  const all=()=>request('readonly',s=>s.getAll());
  const remove=id=>request('readwrite',s=>s.delete(id));
  let pdfLibrary;
  async function library() {
    if (!pdfLibrary) pdfLibrary=import('./vendor/pdfjs/pdf.mjs').then(p=>{p.GlobalWorkerOptions.workerSrc=new URL('./vendor/pdfjs/pdf.worker.mjs',location.href).href;return p;}).catch(e=>{pdfLibrary=null;throw e;});
    return pdfLibrary;
  }
  async function load(blob) {
    const p=await library();
    const task=p.getDocument({data:new Uint8Array(await blob.arrayBuffer()),isEvalSupported:false,enableXfa:false,useSystemFonts:true,useWasm:false});
    task.onPassword=()=>{task.destroy();};
    return task.promise;
  }
  async function save(id,file) {
    if (!['roman','chrysostom','basil','presanctified'].includes(id)) throw new Error('Unknown liturgical text.');
    if (!file || !file.size || file.size>MAX) throw new Error('Choose a PDF smaller than 100 MB.');
    const head=new TextDecoder().decode(await file.slice(0,1024).arrayBuffer());
    if (!head.includes('%PDF-')) throw new Error('This file is not a PDF.');
    const doc=await load(file);const pages=doc.numPages;await doc.destroy();
    const record={id,name:file.name || 'Liturgical text.pdf',size:file.size,pages,page:1,blob:file,updated:new Date().toISOString()};
    await request('readwrite',s=>s.put(record));return record;
  }
  async function bookmark(id,page) {
    const db=await database();return new Promise((resolve,reject)=>{
      const tx=db.transaction('documents','readwrite'),s=tx.objectStore('documents'),r=s.get(id);
      r.onsuccess=()=>{const v=r.result;if(v){v.page=Math.max(1,Math.min(v.pages,page));s.put(v);}};
      tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
    });
  }
  root.LiturgyReader={all,get,save,remove,bookmark,load,MAX};
})(typeof window !== 'undefined' ? window : globalThis);
