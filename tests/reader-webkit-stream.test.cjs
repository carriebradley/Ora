'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const source=fs.readFileSync(path.join(__dirname,'..','liturgy-reader.js'),'utf8');
const start=source.indexOf('  function ensureStreamAsyncIterator()');
const end=source.indexOf('  let pdfLibrary;',start);
assert.ok(start>=0&&end>start,'Reader stream shim should be independently testable');
const helper=source.slice(start,end);
function apply(Stream){
 return new Function('ReadableStream','Symbol',helper+'\nreturn ensureStreamAsyncIterator;')(Stream,Symbol)();
}

test('Safari stream compatibility consumes every PDF.js chunk and releases its reader',async()=>{
 class Stream{
  constructor(values){this.values=values;this.released=false;this.cancelled=false;}
  getReader(){
   let index=0;
   return {read:async()=>index<this.values.length?
    {done:false,value:this.values[index++]}:{done:true,value:undefined},
    cancel:async()=>{this.cancelled=true;},
    releaseLock:()=>{this.released=true;}};
  }
 }
 apply(Stream);
 assert.equal(typeof Stream.prototype[Symbol.asyncIterator],'function');
 const stream=new Stream([{items:[{str:'first'}]},{items:[{str:'second'}]}]);
 const seen=[];
 for await(const chunk of stream)seen.push(...chunk.items.map(x=>x.str));
 assert.deepEqual(seen,['first','second']);
 assert.equal(stream.released,true);
 assert.equal(stream.cancelled,false,'natural EOF should not cancel a completed stream');
 const early=new Stream([1,2,3]);
 for await(const chunk of early){assert.equal(chunk,1);break;}
 assert.equal(early.cancelled,true,'early stop cancels upstream PDF extraction');
 assert.equal(early.released,true,'even an early stop releases the reader lock');
});

test('Safari workaround does not override native async stream iteration',()=>{
 class NativeStream{}
 const native=function*(){yield 'already supported';};
 Object.defineProperty(NativeStream.prototype,Symbol.asyncIterator,{value:native});
 apply(NativeStream);
 assert.equal(NativeStream.prototype[Symbol.asyncIterator],native);
 assert.doesNotThrow(()=>apply(undefined));
});
