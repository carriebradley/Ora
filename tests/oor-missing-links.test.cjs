const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
test('missing Office second readings offer specific external discovery without substitution',()=>{
 const app=fs.readFileSync(path.join(__dirname,'../app.js'),'utf8');
 assert.match(app,/\[author, work, 'English translation'\]/);
 assert.match(app,/encodeURIComponent\(query\)/);
 assert.match(app,/Search for this author and work/);
 assert.match(app,/Search results are external references, not verified texts appointed for this date/);
 assert.match(app,/A verified translation of this appointed excerpt has not yet been bundled/);
});
