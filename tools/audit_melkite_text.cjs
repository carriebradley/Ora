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

// Compare explicitly chosen prayer lines with a rendered text export.
// The caller must first exclude rubrics and optional unappointed alternatives.
// Exact normalized matching is conservative: a mismatch requires review.
function comparePassages(source,rendered){
 const normalize=s=>String(s||'').replace(/\s+/g,' ').trim().toLocaleLowerCase('en');
 // Normalize only known equivalent speaker labels. Preserve the prayer's
 // wording and never equate distinct ministers or erase response counts.
 const normalizeSpeaker=s=>s.replace(/^\s*(?:the\s+)?(?:celebrant|priest(?:\s+1)?)\s*:\s*/i,'Priest: ')
  .replace(/^\s*(?:dcn|deacon)\s*:\s*/i,'Deacon: ')
  .replace(/^\s*(?:people|faithful|congregation|all)\s*:\s*/i,'All: ');
 const src=String(source||'').split(/\r?\n/).map(x=>normalizeSpeaker(x.trim())).filter(Boolean);
 const view=String(rendered||'').split(/\r?\n/).map(x=>normalizeSpeaker(x.trim())).filter(Boolean);
 // Identical continuous text is equivalent regardless of physical PDF line
 // breaks. Keep punctuation and word order intact; do not use fuzzy matching.
 if(normalize(src.join(' '))===normalize(view.join(' ')))
  return {sourceLines:src.length,renderedLines:view.length,findings:[]};
 const counts=new Map(),positions=new Map();
 for(let i=0;i<view.length;i++){
  const key=normalize(view[i]);counts.set(key,(counts.get(key)||0)+1);
  if(!positions.has(key))positions.set(key,[]);
  positions.get(key).push(i+1);
 }
 const findings=[],seen=new Map();let previous=0;
 for(let i=0;i<src.length;i++){
  const key=normalize(src[i]);const count=(seen.get(key)||0)+1;seen.set(key,count);
  const hits=positions.get(key)||[];
  if(!hits.length){findings.push({kind:'missing',sourceLine:i+1,text:src[i]});continue;}
  if(count>hits.length){findings.push({kind:'insufficient-occurrences',sourceLine:i+1,text:src[i],expectedAtLeast:count,found:hits.length});continue;}
  const next=hits.find(pos=>pos>previous);
  if(next===undefined){
   findings.push({kind:'out-of-order',sourceLine:i+1,text:src[i],renderedLines:hits});
  }else previous=next;
 }
 for(const [key,hits] of positions){
  const expected=seen.get(key)||0;
  if(expected&&hits.length>expected)findings.push({kind:'extra-occurrences',text:view[hits[0]-1],expected,found:hits.length,renderedLines:hits});
  // A completely new displayed line is not necessarily an error (for
  // example an appointed proper), but must be explicitly reviewed.
  if(!expected)findings.push({kind:'unexpected-rendered',text:view[hits[0]-1],renderedLines:hits});
 }
 return {sourceLines:src.length,renderedLines:view.length,findings};
}
if(require.main===module){
 const file=process.argv[2],rendered=process.argv[3];
 if(!file){console.error('Usage: node tools/audit_melkite_text.cjs extracted.txt [rendered-prayers.txt]');process.exit(2);}
 const report=audit(fs.readFileSync(file,'utf8'));
 if(rendered)report.comparison=comparePassages(fs.readFileSync(file,'utf8'),fs.readFileSync(rendered,'utf8'));
 console.log(JSON.stringify(report,null,2));
 if(report.findings.length||report.comparison?.findings.length)process.exitCode=1;
}
module.exports={audit,comparePassages};
