#!/usr/bin/env node
// Read-only audit: use Ora's own PDF.js and English prayer-row extraction.
// No source PDF or prayer bodies are copied to the public repository.
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {writeFile} from 'node:fs/promises';
const require=createRequire(import.meta.url);
const F=require('../liturgical-format.js');
const source='https://stjosaphat.ab.ca/wp-content/uploads/2020/05/PDF-Divine-Liturgy-Ukr-Eng.pdf';
const headings=[
 ['first-antiphon',/^FIRST ANTIPHON\b/i],
 ['second-antiphon',/^SECOND ANTIPHON\b/i],
 ['third-antiphon',/^THIRD ANTIPHON\b/i],
 ['sunday-antiphon',/^Sunday Antiphon\b/i],
 ['weekday-antiphon',/^Weekday Antiphon\b/i],
 ['typica',/^Typica\s*:\s*Psalm\b/i],
 ['beatitudes',/^(?:The\s+)?Beatitudes\b/i],
 ['small-litany',/^Small Litany\b/i],
 ['only-begotten-son',/^(?:Only[-\s]?Begotten Son|Hymn to Christ)\b/i],
 ['entrance',/^(?:The\s+)?(?:Small Entrance|Entrance of Christ|Little Entrance)\b/i]
];
async function inspect(){
 const reply=await fetch(source,{headers:{'User-Agent':'Ora-source-audit/1.0'},signal:AbortSignal.timeout(30000)});
 if(!reply.ok)throw Error('Source fetch returned HTTP '+reply.status);
 const bytes=new Uint8Array(await reply.arrayBuffer());
 if(bytes.length<10000||bytes.length>20*1024*1024)throw Error('Unexpected PDF size');
 const digest=createHash('sha256').update(bytes).digest('hex');
 const pdfjs=await import('../vendor/pdfjs/pdf.mjs');
 pdfjs.GlobalWorkerOptions.workerSrc=new URL('../vendor/pdfjs/pdf.worker.mjs',import.meta.url).href;
 const task=pdfjs.getDocument({data:bytes,isEvalSupported:false,enableXfa:false,useWasm:false,useSystemFonts:true});
 const book=await task.promise;
 const result={status:'ok',source,sha256:digest,pageCount:book.numPages,pages:[],warnings:[],
  note:'Diagnostic only: heading locations and row counts; no copyrighted prayer text stored.'};
 if(book.numPages!==31)result.warnings.push('Page count changed (expected 31)');
 for(const number of [4,5,6,7,8,9,10]){
  if(number>book.numPages)break;
  const page=await book.getPage(number);
  const items=(await page.getTextContent()).items;
  const english=F.englishPdfItems(items);
  const rows=F.pdfRows(english,number);
  const matches=[];
  for(let index=0;index<rows.length;index++){
   const t=rows[index].text.trim();
   for(const [name,re] of headings)if(re.test(t))matches.push({marker:name,row:index+1});
  }
  result.pages.push({pdfPage:number,items:items.length,englishItems:english.length,
   extractedRows:rows.length,cyrillicRows:rows.filter(r=>/[\u0400-\u052f]/u.test(r.text)).length,
   markers:matches});
 }
 await book.destroy();
 if(result.pages.some(p=>p.cyrillicRows))result.warnings.push('English extraction retained Cyrillic rows');
 result.status=result.warnings.length?'review':'ok';
 return result;
}
let result;
try{result=await inspect();}catch(e){result={status:'error',error:String(e?.message||e),
 note:'Read-only source diagnostic failed; Ora and local books unchanged.'};}
await writeFile('cathedral-pdfjs-audit.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
if(result.status==='error')process.exitCode=1;
