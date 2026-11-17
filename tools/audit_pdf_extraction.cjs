#!/usr/bin/env node
'use strict';
// Inspect plain text extracted from a PDF; never edit or infer prayer wording.
const fs=require('node:fs');
const wordPattern=/[\p{L}\p{M}]+(?:[\u2019'-][\p{L}\p{M}]+)*/gu;
const sourceGlyph=/[\uE000-\uF8FF\uFFFD\u25A1]/gu;
const latin=/\p{Script=Latin}/u;
const cyrillic=/\p{Script=Cyrillic}/u;
// Parenthesized repetition cues are review candidates, not missing prayers.
const repetitionDirective=/\(\s*(?:to\s+be\s+repeated\s+after\s+each\s+petition|three\s+times(?:[\s\u00ad\u2010-\u2015-]*to\s+be\s+repeated\s+after\s+each\s+petition)?)\s*\.?\s*\)/gi;
function audit(input){
 const text=String(input??'');
 const pages=text.split('\f');
 if(pages.length>1&&!pages.at(-1).trim())pages.pop();
 const findings=[];
 const summary={'mixed-script-token':0,'private-use-glyph':0,'replacement-glyph':0,'repetition-rubric':0};
 for(let page=0;page<pages.length;page++){
  const lines=pages[page].split(/\r?\n/);
  for(let i=0;i<lines.length;i++){
   const line=lines[i];
   const excerpt=(start,end)=>line.slice(Math.max(0,start-45),Math.min(line.length,end+45)).trim();
   for(const m of line.matchAll(wordPattern)){
    if(!latin.test(m[0])||!cyrillic.test(m[0]))continue;
    const kind='mixed-script-token';
    findings.push({kind,page:page+1,line:i+1,column:m.index+1,token:m[0],excerpt:excerpt(m.index,m.index+m[0].length)});
    summary[kind]++;
   }
   for(const m of line.matchAll(repetitionDirective)){
    const kind='repetition-rubric';
    findings.push({kind,page:page+1,line:i+1,column:m.index+1,
     cue:/after\s+each\s+petition/i.test(m[0])?'after-each-petition':'three-times',
     excerpt:excerpt(m.index,m.index+m[0].length)});
    summary[kind]++;
   }
   for(const m of line.matchAll(sourceGlyph)){
    const n=m[0].codePointAt(0),kind=n>=0xE000&&n<=0xF8FF?'private-use-glyph':'replacement-glyph';
    findings.push({kind,page:page+1,line:i+1,column:m.index+1,codepoint:'U+'+n.toString(16).toUpperCase().padStart(4,'0'),excerpt:excerpt(m.index,m.index+1)});
    summary[kind]++;
   }
  }
 }
 return {pages:pages.length,summary,findings};
}
if(require.main===module){
 const path=process.argv[2];
 if(!path){console.error('Usage: node tools/audit_pdf_extraction.cjs extracted.txt');process.exitCode=2;}
 else{
  try{console.log(JSON.stringify(audit(fs.readFileSync(path,'utf8')),null,2));}
  catch(error){console.error(error.message);process.exitCode=2;}
 }
}
module.exports={audit};
