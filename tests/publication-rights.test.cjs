'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');

test('public Ora does not claim an unverified CCD digital-app license from RSS access',()=>{
 const app=read('app.js'),readme=read('README.md'),rights=read('docs/ORA-V1-PUBLICATION-RIGHTS.md');
 assert.doesNotMatch(app,/Used with permission via the USCCB daily readings feed/i);
 assert.match(app,/digital-application reproduction permission/i);
 assert.match(readme,/has \*\*not\*\* been verified/);
 assert.match(rights,/Status: \*\*Open/i);
 assert.match(rights,/November 29, 2026/);
 assert.match(rights,/up to 800 dates/);
 assert.match(rights,/No inquiry has been sent/);
});

test('feed material remains explicitly distinguished from permission for installing an offline PWA',()=>{
 const importer=read('fetch_readings.py'),sw=read('sw.js'),app=read('app.js');
 assert.match(importer,/KEEP_DAYS = 800/);
 assert.match(importer,/rights for that distribution are \*\*not verified\*\*/i);
 assert.match(sw,/readings\.json/);
 assert.match(app,/fetch\('readings\.json'/);
 const appBuild=app.match(/const APP_BUILD = '(ora-v\d+)'/);
 const workerBuild=sw.match(/const V = '(ora-v\d+)'/);
 assert.ok(appBuild&&workerBuild,'Both scripts declare a build number');
 assert.equal(appBuild[1],workerBuild[1]);
});
