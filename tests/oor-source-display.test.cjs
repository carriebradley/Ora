const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
test('Office readings keep full translation notes outside the prayer flow',()=>{
 const app=fs.readFileSync(path.join(__dirname,'../app.js'),'utf8');
 assert.match(app,/class="oortx-source"/);
 assert.match(app,/Translation and source/);
 assert.match(app,/const provenance=x.src\|\|x.sourceUrl/);
 assert.match(app,/slot.innerHTML = notice\+/);
 assert.match(app,/\+ notice \+ provenance/);
 assert.match(app,/rel="noopener noreferrer"/);
});
