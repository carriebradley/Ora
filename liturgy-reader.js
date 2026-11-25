/* Private, device-local PDF/EPUB library. No document upload or third-party viewer. */
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
  // PDF.js iterates ReadableStream chunks with for-await. Safari before 27
  // has getReader() but lacks ReadableStream[Symbol.asyncIterator].
  // Add the missing standard iterator only where the browser lacks it.
  // https://github.com/mozilla/pdf.js/issues/20973
  function ensureStreamAsyncIterator() {
    if(typeof ReadableStream!=='function'||typeof Symbol.asyncIterator==='undefined')return;
    const proto=ReadableStream.prototype;
    if(typeof proto[Symbol.asyncIterator]==='function')return;
    try {
      Object.defineProperty(proto,Symbol.asyncIterator,{
        configurable:true,writable:true,
        value:async function*(){
          const reader=this.getReader();
          let complete=false;
          try{
            for(;;){
              const chunk=await reader.read();
              if(chunk.done){complete=true;return;}
              yield chunk.value;
            }
          }finally{
            if(!complete)try{await reader.cancel();}catch(_){}
            reader.releaseLock();
          }
        }
      });
    }catch(_){/* Keep PDF page view available if a host freezes the prototype. */}
  }
  let pdfLibrary;
  async function library() {
    if (!pdfLibrary) pdfLibrary=import('./vendor/pdfjs/pdf.mjs').then(p=>{p.GlobalWorkerOptions.workerSrc=new URL('./vendor/pdfjs/pdf.worker.mjs',location.href).href;return p;}).catch(e=>{pdfLibrary=null;throw e;});
    return pdfLibrary;
  }
  async function load(source,format='pdf') {
    if(format==='epub')return EpubReader.load(source);
    // PDF.js transfers its input to the worker. Keep the saved bytes intact.
    const data=source instanceof ArrayBuffer?source.slice(0):await source.arrayBuffer();
    ensureStreamAsyncIterator();
    const p=await library();
    const task=p.getDocument({data:new Uint8Array(data),isEvalSupported:false,enableXfa:false,useSystemFonts:true,useWasm:false});
    task.onPassword=()=>{task.destroy();};
    return task.promise;
  }
  async function save(id,file) {
    if (!['roman','roman-office','chrysostom','melkite-chrysostom','basil','presanctified','melkite-basil','melkite-presanctified'].includes(id)) throw new Error('Unknown liturgical text.');
    if (!file || !file.size || file.size>MAX) throw new Error('Choose a PDF or EPUB smaller than 100 MB.');
    const head=new TextDecoder().decode(await file.slice(0,1024).arrayBuffer());
    const format=head.includes('%PDF-')?'pdf':head.startsWith('PK\x03\x04')?'epub':null;
    if(!format)throw new Error('This file is not a PDF or EPUB.');
    // WebKit can fail to read a persisted Blob with offline mode enabled.
    // Store the new Office book as bytes; existing books keep their Blob records.
    const contents=id==='roman-office'?{bytes:await file.arrayBuffer()}:{blob:file};
    const doc=await load(contents.bytes??contents.blob,format);
    const pages=doc.numPages;await doc.destroy();
    const record={id,format,name:file.name || 'Liturgical text.'+format,size:file.size,pages,page:1,...contents,updated:new Date().toISOString()};
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


