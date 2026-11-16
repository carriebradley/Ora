const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const reader=fs.readFileSync(require.resolve('../liturgy-reader-ui.js'),'utf8');
test('Newton page restriction requires recognized edition, not merely Melkite selection',()=>{
 const functionText=reader.slice(reader.indexOf('async function standardPrayerText('),reader.indexOf('async function continuousSavedPdfText('));
 assert.match(functionText,/id==='melkite-chrysostom'&&book\.numPages===159/);
 assert.match(functionText,/FINAL\\s\+DRAFT\\s\+EDITION/);
 assert.match(functionText,/COMMON\\s\+ENGLISH\\s\+TRANSLATION/);
 assert.match(functionText,/startPage=30;endPage=96;foundLiturgy=true;recognizedNewtonEdition=true/);
 assert.match(functionText,/for\(let number=startPage;number<=endPage;number\+\+\)/);
 assert.match(functionText,/if\(recognizedNewtonEdition\)sections\.newton2009=true/);
});
test('Unknown saved PDF uses full continuous fallback rather than Newton page restrictions',()=>{
 const fallback=reader.slice(reader.indexOf('async function continuousSavedPdfText('),reader.indexOf('async function isEaster2018Booklet('));
 assert.match(fallback,/for\(let number=1;number<=book\.numPages;number\+\+\)/);
 assert.doesNotMatch(fallback,/startPage=30|endPage=96/);
});
