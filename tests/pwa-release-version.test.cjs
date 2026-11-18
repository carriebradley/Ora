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
test('manual update reloads only after the advertised worker proves its build',()=>{
 const app=file('app.js');
 const start=app.indexOf("const updateButton = notice.querySelector('button')");
 const end=app.indexOf('document.body.appendChild(notice)',start);
 const code=app.slice(start,end);
 assert.ok(start>=0&&end>start,'update action must retain its guarded reload');
 const helper=code.indexOf('const activeBuild = async () =>');
 const update=code.indexOf('await reg.update()',helper);
 const initial=code.indexOf('let activated = await activeBuild() === match[1]',update);
 const wait=code.indexOf('await Promise.race',initial);
 const verifiedAfterChange=code.indexOf('activated = await activeBuild() === match[1]',wait);
 const reload=code.indexOf('location.reload()');
 assert.ok(helper>=0,'active worker build must be queried through its message port');
 assert.ok(update>helper,'registration is refreshed before readiness is decided');
 assert.ok(initial>update,'current worker build is checked after registration update');
 assert.ok(wait>initial,'unmatched workers wait for a controller change or bounded timeout');
 assert.ok(verifiedAfterChange>wait,'controller changes must be rechecked against the advertised build');
 assert.ok(reload>verifiedAfterChange,'reload is only reachable after the matching-build check');
 assert.match(code,/ORA_VERSION_QUERY/);
 assert.match(code,/setTimeout\(\(\) => \{[^}]*resolve\(null\); \}, 600\)/);
 assert.match(code,/setTimeout\(resolve, 5000\)/);
 assert.doesNotMatch(code,/controller\s*!==\s*offeredController/);
 assert.match(code,/Retry update/);
});
test('installed worker answers build handshake without touching saved prayer data',()=>{
 const vm=require('node:vm');
 const listeners=new Map();
 const worker=file('sw.js');
 vm.runInNewContext(worker,{self:{addEventListener:(name,fn)=>listeners.set(name,fn)}},{filename:'sw.js'});
 const messages=[];
 const send={postMessage:msg=>messages.push(JSON.parse(JSON.stringify(msg)))};
 listeners.get('message')({data:{type:'ORA_VERSION_QUERY'},ports:[send]});
 assert.deepEqual(messages,[{type:'ORA_VERSION',version:R.workerVersion(worker)}]);
 listeners.get('message')({data:{type:'other'},ports:[send]});
 assert.equal(messages.length,1,'unrelated messages have no effects');
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

