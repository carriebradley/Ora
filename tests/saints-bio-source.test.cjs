const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const app=fs.readFileSync(require.resolve('../app.js'),'utf8');
const source=fs.readFileSync(require.resolve('../docs/SAINTS-BIOGRAPHY-SOURCES-v283.md'),'utf8');

test('November 16-20 source-backed Byzantine biography set and correct precedence',()=>{
 for(const day of ['16','17','18','19']){
  assert.match(app,new RegExp("'11-"+day+"': \\{"));
 }
 assert.match(app,/const SHARED_BYZANTINE_SAINT_BIOS/);
 assert.equal((app.match(/\.\.\.SHARED_BYZANTINE_SAINT_BIOS/g)||[]).length,2);
 for(const name of ['Matthew','Gregory the Wonderworker','Plato of Ancyra','Prophet Obadiah','Josaphata Hordashevska','Gregory the Decapolite']){
  assert.ok(app.includes(name),name);
  assert.ok(source.includes(name),name+' source documented');
 }
 // Regional priorities differ on November 20, so each rite must have its own biography.
 assert.match(app,/ukrainian: \{\s+\.\.\.SHARED_BYZANTINE_SAINT_BIOS,\s+'11-20': \{\s+match: \/Josaphata Hordashevska/i);
 assert.match(app,/melkite: \{\s+\.\.\.SHARED_BYZANTINE_SAINT_BIOS,\s+'11-20': \{\s+match: \/Gregory/);
 assert.match(app,/const entry = listed && titles\.some\(item => listed\.match\.test\(item\)\) \? listed : null/);
 assert.match(app,/calendar\?\.also/);
 assert.match(app,/Commemorated in the selected liturgical calendar/);
 assert.match(app,/saint\.source \? /);
});

test('Marian feast titles alone do not create a Saint of the Day biography',()=>{
 assert.match(app,/const marianTitle = \/.*mother of god.*theotokos.*virgin mary.*blessed virgin.*our lady/);
 assert.match(app,/const namedSaint =/);
 assert.match(app,/!marianTitle\.test\(item\) \|\| namedSaint\.test\(item\)/);
});

test('November 14 Traditional feast has a verified Laurence O’Toole biography',()=>{
 assert.match(app, /sarum: \\{\\s+'11-14': \\{/);
 assert.match(app, /match: \\/Laurence O\\[/);
 assert.match(app, /name: 'Saint Laurence O’Toole'/);
 assert.match(app, /dublindiocese\\.ie\\/the-story-of-st-laurence-otoole/);
});
