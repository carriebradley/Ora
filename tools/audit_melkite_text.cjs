#!/usr/bin/env node
'use strict';
// Offline source audit. Input is an extracted text file; no network requests.
// Findings are review candidates, never permission to delete prayer text.
const fs=require('node:fs');
const F=require('../liturgical-format.js');
function audit(input){
 const rows=String(input||'').split(/\r?\n/).map((text,i)=>({line:i+1,text:text.trim()})).filter(x=>x.text);
 const findings=[],boundaries=[];let table=null;
 const add=(row,kind,detail)=>findings.push({line:row.line,kind,text:row.text,detail});
 for(const row of rows){
  const b=F.melkiteReferenceBoundary(row.text);
  if(b){
   boundaries.push({line:row.line,boundary:b});
   if(b.endsWith('-start')){
    if(table)add(row,'nested-reference-table','Another table began before the prior one ended');
    table=b.split('-')[0];
   }else{
    const family=b.split('-')[0];
    if(table!==family)add(row,'unmatched-reference-end','End marker without matching table');
    table=null;
   }
   continue;
  }
  if(table)continue;
  if(/[\u25a1\ufffd]/.test(row.text))add(row,'replacement-glyph','Unrecognized source character');
  if(/\b(?:the priest bows|all stand|the deacon replaces his hat)\b/i.test(row.text))
   add(row,'possible-rubric','Ceremonial instruction may be displayed');
  if(/\b[A-Za-z]{2,}---[A-Za-z]{2,}\b/.test(row.text))
   add(row,'phonetic-hyphenation','Review sung transliteration, do not silently rewrite');
 }
 if(table)findings.push({line:rows.at(-1)?.line||0,kind:'unclosed-reference-table',detail:table});
 return {lines:rows.length,boundaries,findings};
}
if(require.main===module){
 const file=process.argv[2];
 if(!file){console.error('Usage: node tools/audit_melkite_text.cjs extracted.txt');process.exit(2);}
 const report=audit(fs.readFileSync(file,'utf8'));
 console.log(JSON.stringify(report,null,2));
 if(report.findings.length)process.exitCode=1;
}
module.exports={audit};
