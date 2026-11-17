'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const R=require('../tools/check-pwa-release.cjs');
const file=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
test('live PWA build marker matches service-worker cache version and caches each script',()=>{
 const version=R.validate(file('app.js'),file('sw.js'),file('index.html'));
 assert.match(version,/^ora-v\d+$/);
 assert.ok(R.shellFiles(file('sw.js')).includes('liturgy-reader-ui.js'));
 assert.ok(R.shellFiles(file('sw.js')).includes('liturgy-schedule.js'));
});
test('build update notice only offers strictly newer published worker versions',()=>{
 const app=file('app.js');
 assert.match(app,/Number\(match\[1\]\.slice\(5\)\) <= Number\(APP_BUILD\.slice\(5\)\)/);
 assert.equal(R.versionNumber('ora-v365')>R.versionNumber('ora-v364'),true);
 assert.equal(R.versionNumber('ora-v363')>R.versionNumber('ora-v364'),false);
});
test('release guard catches application changes but not documentation or readings refreshes',()=>{
 assert.equal(R.requiresBump(['app.js']),true);
 assert.equal(R.requiresBump(['liturgy-schedule.js']),true);
 assert.equal(R.requiresBump(['sw.js']),true);
 assert.equal(R.requiresBump(['index.html']),true);
 assert.equal(R.requiresBump(['ukrainian-propers.json']),true);
 assert.equal(R.requiresBump(['oortext.json']),true);
 assert.equal(R.requiresBump(['tests/pwa-release-version.test.cjs','docs/README.md','readings.json']),false);
 assert.throws(()=>R.validate(
  file('app.js').replace(R.appVersion(file('app.js')),'ora-v1'),file('sw.js'),file('index.html')
 ),/must match/);
});
