'use strict';
// Avoid publishing new application code with the old installed-app cache ID.
// The cached private reader documents live in IndexedDB and are untouched.
const fs=require('node:fs'),path=require('node:path');
const {execFileSync}=require('node:child_process');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const appVersion=s=>s.match(/\bconst APP_BUILD\s*=\s*['"](ora-v\d+)['"]/)?.[1]||null;
const workerVersion=s=>s.match(/\bconst V\s*=\s*['"](ora-v\d+)['"]/)?.[1]||null;
const versionNumber=v=>v?Number(v.slice(5)):NaN;
const shellFiles=s=>{
 const array=s.match(/\bconst FILES\s*=\s*\[([\s\S]*?)\];/);
 return array?[...array[1].matchAll(/['"]([^'"]+)['"]/g)].map(m=>m[1]):[];
};
const indexScripts=s=>[...s.matchAll(/<script\s+src=["']([^"']+)["']/g)].map(m=>m[1]);
function requiresBump(files){
 return files.some(file=>
  file==='index.html'||file==='sw.js'||file==='manifest.webmanifest'||
  file==='icon.svg'||file==='icon-180.png'||
  ['oortext.json','ukrainian-propers.json','melkite-propers-2026.json'].includes(file)||
  file.startsWith('vendor/')||
  (file.endsWith('.js')&&!/^(?:tests|tools|docs|\.github)\//.test(file)));
}
function validate(app,worker,index){
 const a=appVersion(app),w=workerVersion(worker);
 if(!a||!w||a!==w)throw Error('APP_BUILD and service worker V must match: '+a+' vs '+w);
 if(!Number.isInteger(versionNumber(a)))throw Error('Invalid Ora app version '+a);
 const available=new Set(shellFiles(worker).map(f=>f.replace(/^\.\//,'')));
 const missing=indexScripts(index).filter(file=>!available.has(file));
 if(missing.length)throw Error('Script not available in offline shell: '+missing.join(', '));
 return a;
}
function checkChanged(){
 const changed=execFileSync('git',['diff','--name-only','HEAD^','HEAD'],{cwd:root,encoding:'utf8'})
  .split(/\r?\n/).filter(Boolean);
 if(!requiresBump(changed))return 'No runtime files changed';
 const previous=execFileSync('git',['show','HEAD^:sw.js'],{cwd:root,encoding:'utf8'});
 const before=workerVersion(previous),now=workerVersion(read('sw.js'));
 if(!before||!now||versionNumber(now)<=versionNumber(before)){
  throw Error('Runtime changed without advancing PWA shell version: '+before+' -> '+now+
   '. Update both sw.js V and app.js APP_BUILD.');
 }
 return 'PWA version advanced '+before+' -> '+now;
}
if(require.main===module){
 try{
  const v=validate(read('app.js'),read('sw.js'),read('index.html'));
  console.log('Ora '+v+': installed app and offline scripts consistent.');
  if(process.argv.includes('--changed'))console.log(checkChanged());
 }catch(error){console.error(error.message);process.exitCode=1;}
}
module.exports={appVersion,workerVersion,versionNumber,shellFiles,indexScripts,requiresBump,validate};
