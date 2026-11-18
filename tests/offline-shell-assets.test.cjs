'use strict';
// Keep the install-time PWA asset list in sync with the actual distribution.
// The fake Cache.addAll in offline.test.cjs cannot detect nonexistent paths.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {shellFiles}=require('../tools/check-pwa-release.cjs');

const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const appRoot=new URL('https://offline.example/Ora/');
const assetPath=value=>{
  const url=new URL(value,appRoot);
  assert.equal(url.origin,appRoot.origin,'Core asset must be local: '+value);
  assert.ok(url.pathname.startsWith(appRoot.pathname),'Core asset must be within Ora scope: '+value);
  return url.pathname.slice(appRoot.pathname.length)||'./';
};
const assets=shellFiles(read('sw.js')).map(assetPath);
const precached=new Set(assets);
const requireCached=(value,origin)=>{
  const asset=assetPath(value);
  assert.ok(precached.has(asset),origin+' is not in service worker FILES: '+asset);
};
function attr(tag,name){
  const pairs=[...tag.matchAll(/([a-z-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/gi)];
  const match=pairs.find(pair=>pair[1].toLowerCase()===name);
  return match?.[2]||match?.[3]||null;
}

test('every pre-cached offline shell asset exists and has a unique in-scope path',()=>{
  assert.ok(assets.length>=30,'Unexpectedly small PWA shell');
  assert.equal(precached.size,assets.length,'Duplicate service worker cache path');
  assert.ok(precached.has('./'),'Offline document-root navigation should be cached');
  assert.ok(precached.has('index.html'),'Offline deep-link fallback should be cached');
  for(const file of assets){
    if(file==='./')continue;
    const location=path.join(root,file);
    assert.ok(fs.existsSync(location),'Missing pre-cached file: '+file);
    assert.ok(fs.statSync(location).isFile(),'Pre-cached path is not a file: '+file);
  }
});

test('every locally required HTML script, icon and manifest remains offline-installable',()=>{
  const html=read('index.html');
  const tags=[...html.matchAll(/<(?:script|link)\b[^>]*>/gi)].map(match=>match[0]);
  let checked=0;
  for(const tag of tags){
    if(/^<script\b/i.test(tag)){
      const src=attr(tag,'src');
      if(src){requireCached(src,'HTML script');checked++;}
      continue;
    }
    const rel=attr(tag,'rel');
    if(!rel||!/\b(?:stylesheet|manifest|icon|apple-touch-icon)\b/i.test(rel))continue;
    const href=attr(tag,'href');
    assert.ok(href,'Core link is missing its href: '+tag);
    requireCached(href,'HTML '+rel);
    checked++;
  }
  assert.ok(checked>=30,'HTML asset scan did not examine all application scripts');
});

test('installed-app start URL and both manifest icons are cached locally',()=>{
  const manifest=JSON.parse(read('manifest.webmanifest'));
  assert.equal(manifest.display,'standalone');
  assert.ok(manifest.start_url);
  requireCached('manifest.webmanifest','PWA manifest');
  requireCached(manifest.start_url,'PWA start_url');
  assert.ok(Array.isArray(manifest.icons)&&manifest.icons.length>=2);
  for(const icon of manifest.icons){
    assert.ok(icon.src&&icon.sizes,'Manifest icon needs a source and size');
    requireCached(icon.src,'Manifest icon');
  }
});

test('local private-book reader and downloaded liturgy prerequisites are available offline',()=>{
  for(const asset of [
    'liturgy-reader.js','liturgy-document.js','liturgy-reader-ui.js',
    'epub-reader.js','source-reader.js',
    'vendor/pdfjs/pdf.mjs','vendor/pdfjs/pdf.worker.mjs',
    'oortext.json','ukrainian-propers.json','melkite-propers-2026.json'
  ])requireCached(asset,'Core offline reader dependency');
});
