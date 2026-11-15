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
 assert.match(app,/ukrainian: \{[\s\S]*?'11-20': \{\s+match: \/Josaphata Hordashevska/i);
 assert.match(app,/melkite: \{[\s\S]*?'11-20': \{\s+match: \/Gregory/);
 assert.match(app,/const entry = listed && titles\.some\(item => listed\.match\.test\(item\)\) \? listed : null/);
 assert.match(app,/calendar\?\.also/);
 assert.match(app,/Commemorated in the selected calendar/);
 assert.match(app,/saint\.source \? /);
});

test('Marian feast titles alone do not create a Saint of the Day biography',()=>{
 assert.match(app,/const marianTitle = \/.*mother of god.*theotokos.*virgin mary.*blessed virgin.*our lady/);
 assert.match(app,/const namedSaint =/);
 assert.match(app,/!marianTitle\.test\(item\) \|\| namedSaint\.test\(item\)/);
});

test('November 14 Traditional feast has a verified Laurence O’Toole biography',()=>{
 const sarum=app.slice(app.indexOf('    sarum: {',app.indexOf('const TODAY_SAINT_BIOS')));
 assert.ok(sarum.includes("'11-14': {"));
 assert.ok(sarum.includes("name: 'Saint Laurence O’Toole'"));
 assert.ok(sarum.includes("dublindiocese.ie/the-story-of-st-laurence-otoole"));
});

test('November 22-25 saint bios follow the correct Ukrainian and Melkite dates',()=>{
 const section=app.slice(app.indexOf('const TODAY_SAINT_BIOS'),app.indexOf('function todaySaintBio'));
 const uk=section.slice(section.indexOf('    ukrainian: {'),section.indexOf('    melkite: {'));
 const mk=section.slice(section.indexOf('    melkite: {'),section.indexOf('    sarum: {'));
 const shared=app.slice(app.indexOf('const SHARED_BYZANTINE_SAINT_BIOS'),app.indexOf('const BYZANTINE_BIO_CATHERINE'));
 assert.ok(shared.includes("'11-22': {"));
 assert.ok(shared.includes("name: 'Holy Apostle Philemon'"));
 for(const block of [uk,mk])assert.ok(block.includes('...SHARED_BYZANTINE_SAINT_BIOS'));
 assert.ok(uk.includes("name: 'Saint Amphilochius of Iconium'"));
 assert.ok(mk.includes("name: 'Saint Gregory of Agrigentum'"));
 assert.ok(uk.includes("'11-24': BYZANTINE_BIO_CATHERINE"));
 assert.ok(uk.includes("'11-25': BYZANTINE_BIO_CLEMENT"));
 assert.ok(mk.includes("'11-24': BYZANTINE_BIO_CLEMENT"));
 assert.ok(mk.includes("'11-25': BYZANTINE_BIO_CATHERINE"));
 assert.ok(!section.includes("'11-21':"),'Marian feast alone should not generate a biography');
});

test('Curated Saint of the Day cards remain short',()=>{
 const entries=app.slice(app.indexOf('const SHARED_BYZANTINE_SAINT_BIOS'),app.indexOf('function todaySaintBio'));
 const bios=[...entries.matchAll(/bio: '([^']+)'/g)].map(item=>item[1]);
 assert.ok(bios.length>=12);
 for(const bio of bios){
   const words=bio.trim().split(/\s+/);
   assert.ok(words.length<=50,'Biography exceeds 50 words: '+bio.slice(0,55));
 }
});

test('Traditional November 15 St. Machutus (Malo) card has a brief verified biography',()=>{
 const sarum=app.slice(app.indexOf('    sarum: {',app.indexOf('const TODAY_SAINT_BIOS')));
 const entry=sarum.slice(sarum.indexOf("'11-15':"),sarum.indexOf("'11-14':"));
 assert.ok(entry.includes('match: /Machut'));
 assert.ok(entry.includes("name: 'Saint Machutus (Malo)'"));
 assert.ok(entry.includes('vaticannews.va/en/saints/11/15/saint-malo.html'));
 const match=entry.match(/bio: '([^']+)'/);
 assert.ok(match);
 assert.ok(match[1].split(/\s+/).length<=50);
});

test('Marian safeguard uses real word boundaries and keeps separately named saints',()=>{
 const vm=require('node:vm');
 const getMatcher=name=>{
   const token='const '+name+' = ';
   assert.ok(app.includes(token),'missing '+name);
   return vm.runInNewContext(app.split(token)[1].split(';')[0].trim());
 };
 const marian=getMatcher('marianTitle'),named=getMatcher('namedSaint');
 assert.ok(marian.test('The Entrance of the Mother of God'));
 assert.ok(marian.test('Dormition of the Theotokos'));
 assert.ok(!named.test('The Entrance of the Mother of God'));
 assert.ok(named.test('Saint Anna, Mother of the Virgin Mary'));
 assert.ok(!marian.test('Abbot Motherwell'));
});

test('Nov 26-30 biographies match Ukrainian and Melkite appointment titles',()=>{
 const vm=require('node:vm'),L=require('../calendar.js'),D=require('../data.js');
 L.setData(D);
 const start=app.indexOf('const SHARED_BYZANTINE_SAINT_BIOS = ');
 const end=app.indexOf('\n  };',start);
 assert.ok(start>=0&&end>start);
 const object=app.slice(start+'const SHARED_BYZANTINE_SAINT_BIOS = '.length,end+4);
 const bios=vm.runInNewContext('('+object+')');
 const names={'11-26':'Alypius','11-27':'James','11-28':'Stephen','11-29':'Paramon','11-30':'Andrew'};
 for(const [md,name] of Object.entries(names)){
  const bio=bios[md];
  assert.ok(bio&&bio.name.includes(name),md);
  assert.ok(bio.source.startsWith('https://www.oca.org/saints/lives/2026/11/'+md.slice(3)),md);
  assert.ok(bio.bio.trim().split(/\s+/).length<=50,md);
  for(const church of ['ukrainian','melkite']){
   const day=L.byzantine(new Date('2026-'+md+'T00:00:00Z'),{byzChurch:church,byzSource:'edmonton'});
   const titles=[day.title,...(day.also||[]).map(x=>x.title)];
   assert.ok(titles.some(t=>bio.match.test(t)),church+' '+md+' '+titles.join(' | '));
  }
 }
});

test('December 1-6 primary Byzantine saints match both Catholic typika',()=>{
 const vm=require('node:vm'),L=require('../calendar.js');
 const marker='const SHARED_BYZANTINE_SAINT_BIOS = ';
 const begin=app.indexOf(marker),end=app.indexOf('\n  };',begin);
 assert.ok(begin>=0&&end>begin);
 const entries=vm.runInNewContext('('+app.slice(begin+marker.length,end+4)+')');
 const names={'12-01':'Nahum','12-02':'Habakkuk','12-03':'Zephaniah',
  '12-04':'Barbara','12-05':'Sabbas','12-06':'Nicholas'};
 for(const [md,name] of Object.entries(names)){
  const entry=entries[md];
  assert.ok(entry&&entry.name.includes(name),md);
  assert.ok(entry.source.startsWith('https://www.oca.org/saints/'),md);
  assert.ok(entry.bio.trim().split(/\s+/).length<=50,md);
  for(const church of ['ukrainian','melkite']){
   const day=L.byzantine(new Date('2026-'+md+'T00:00:00Z'),{byzChurch:church,byzSource:'edmonton'});
   const titles=[day.title,...(day.also||[]).map(item=>item.title)];
   assert.ok(titles.some(title=>entry.match.test(title)),church+' '+md+': '+titles.join(' / '));
  }
 }
});

test('December 7-10 shared Byzantine cards match the appointed saint in both churches',()=>{
 const vm=require('node:vm'),L=require('../calendar.js');
 const marker='const SHARED_BYZANTINE_SAINT_BIOS = ';
 const start=app.indexOf(marker),end=app.indexOf('\n  };',start);
 assert.ok(start>=0&&end>start);
 const bios=vm.runInNewContext('('+app.slice(start+marker.length,end+4)+')');
 for(const [md,name] of Object.entries({'12-07':'Ambrose','12-08':'Patapius','12-09':'Anna','12-10':'Menas'})){
  const entry=bios[md];
  assert.ok(entry&&entry.name.includes(name),md);
  assert.ok(entry.bio.trim().split(/\s+/).length<=50,md);
  for(const church of ['ukrainian','melkite']){
   const c=L.byzantine(new Date('2026-'+md+'T00:00:00Z'),{byzChurch:church,byzSource:'edmonton'});
   const titles=[c.title,...(c.also||[]).map(item=>item.title)];
   assert.ok(titles.some(t=>entry.match.test(t)),church+' '+md+' titles: '+titles.join(' | '));
  }
 }
 assert.ok(!bios['12-09'].match.test('Annunciation of the Lord'),'Anna is not Annunciation');
});

test('December 11-15 saint biographies honor separate Ukrainian and Melkite precedence',()=>{
 const vm=require('node:vm'),L=require('../calendar.js');
 const sharedTag='const SHARED_BYZANTINE_SAINT_BIOS = ';
 const a=app.indexOf(sharedTag),b=app.indexOf('\n  };',a);
 const shared=vm.runInNewContext('('+app.slice(a+sharedTag.length,b+4)+')');
 const all=app.slice(app.indexOf('const TODAY_SAINT_BIOS'),app.indexOf('function todaySaintBio'));
 const uk=all.slice(all.indexOf('    ukrainian: {'),all.indexOf('    melkite: {'));
 const mk=all.slice(all.indexOf('    melkite: {'),all.indexOf('    sarum: {'));
 const titles=(md,church)=>{
  const c=L.byzantine(new Date('2026-'+md+'T00:00:00Z'),{byzChurch:church,byzSource:'edmonton'});
  return [c.title,...(c.also||[]).map(e=>e.title)];
 };
 for(const md of ['12-11','12-12','12-13','12-14']){
  const bio=shared[md];
  assert.ok(bio,md);
  assert.ok(bio.bio.trim().split(/\s+/).length<=50,md);
  for(const church of ['ukrainian','melkite'])assert.ok(titles(md,church).some(t=>bio.match.test(t)),md+' '+church);
 }
 assert.ok(uk.includes("'12-15': {"));
 assert.ok(uk.includes("name: 'Saint Stephen of Surozh'"));
 assert.ok(mk.includes("'12-15': {"));
 assert.ok(mk.includes("name: 'Holy Hieromartyr Eleutherius'"));
 assert.ok(titles('12-15','ukrainian')[0].includes('Stephen'));
 assert.ok(titles('12-15','melkite')[0].includes('Eleutherius'));
});

test('December 16-20 primary saints retain distinct December 19 commemorations',()=>{
 const vm=require('node:vm'),L=require('../calendar.js');
 const marker='const SHARED_BYZANTINE_SAINT_BIOS = ';
 const a=app.indexOf(marker),b=app.indexOf('\n  };',a);
 const bios=vm.runInNewContext('('+app.slice(a+marker.length,b+4)+')');
 for(const md of ['12-16','12-17','12-18','12-20']){
  const saint=bios[md];
  assert.ok(saint,md);
  assert.ok(saint.bio.trim().split(/\s+/).length<=50,md);
  for(const church of ['ukrainian','melkite']){
   const day=L.byzantine(new Date('2026-'+md+'T00:00:00Z'),{byzChurch:church,byzSource:'edmonton'});
   const titles=[day.title,...(day.also||[]).map(e=>e.title)];
   assert.ok(titles.some(t=>saint.match.test(t)),church+' '+md+': '+titles.join(' | '));
  }
 }
 const section=app.slice(app.indexOf('const TODAY_SAINT_BIOS'),app.indexOf('function todaySaintBio'));
 const uk=section.slice(section.indexOf('    ukrainian: {'),section.indexOf('    melkite: {'));
 const mk=section.slice(section.indexOf('    melkite: {'),section.indexOf('    sarum: {'));
 assert.ok(uk.includes("'12-19': {"));
 assert.ok(uk.includes("name: 'Holy Martyr Boniface'"));
 assert.ok(mk.includes("'12-19': SHARED_BYZANTINE_SAINT_BIOS['12-20']"));
 const dec19=new Date('2026-12-19T00:00:00Z');
 assert.match(L.byzantine(dec19,{byzChurch:'ukrainian',byzSource:'edmonton'}).title,/Boniface/);
 const melk=L.byzantine(dec19,{byzChurch:'melkite'});
 assert.ok([melk.title,...melk.also.map(e=>e.title)].some(t=>bios['12-20'].match.test(t)));
});

test('Christmas week biographies do not turn Nativity or Marian feast into a made-up saint',()=>{
 const vm=require('node:vm'),L=require('../calendar.js');
 const key='const SHARED_BYZANTINE_SAINT_BIOS = ';
 const first=app.indexOf(key),end=app.indexOf('\n  };',first);
 const bios=vm.runInNewContext('('+app.slice(first+key.length,end+4)+')');
 for(const md of ['12-21','12-22','12-23','12-24','12-27']){
  const entry=bios[md];
  assert.ok(entry,md);
  assert.ok(entry.bio.trim().split(/\s+/).length<=50,md);
  for(const church of ['ukrainian','melkite']){
   const c=L.byzantine(new Date('2026-'+md+'T00:00:00Z'),{byzChurch:church,byzSource:'edmonton'});
   assert.ok([c.title,...(c.also||[]).map(e=>e.title)].some(t=>entry.match.test(t)),church+' '+md);
  }
 }
 assert.equal(bios['12-25'],undefined);
 assert.equal(bios['12-26'],undefined);
 const block=app.slice(app.indexOf('const TODAY_SAINT_BIOS'),app.indexOf('function todaySaintBio'));
 const uk=block.slice(block.indexOf('    ukrainian: {'),block.indexOf('    melkite: {'));
 const mk=block.slice(block.indexOf('    melkite: {'),block.indexOf('    sarum: {'));
 assert.ok(uk.includes("'12-26': {"));
 assert.ok(uk.includes("name: 'Holy Hieromartyr Euthymius of Sardis'"));
 assert.ok(!mk.includes("'12-26':"),'Melkite December 26 is a Marian Synaxis');
 const day=L.byzantine(new Date('2026-12-26T00:00:00Z'),{byzChurch:'ukrainian',byzSource:'edmonton'});
 assert.ok([day.title,...day.also.map(e=>e.title)].some(t=>/Euthymius/.test(t)));
});

test('End of December retains martyrs, Innocents, and differing Melania dates',()=>{
 const vm=require('node:vm'),L=require('../calendar.js');
 const marker='const SHARED_BYZANTINE_SAINT_BIOS = ',a=app.indexOf(marker),b=app.indexOf('\n  };',a);
 const shared=vm.runInNewContext('('+app.slice(a+marker.length,b+4)+')');
 for(const md of ['12-28','12-29']){
  const bio=shared[md];
  assert.ok(bio,md);
  assert.ok(bio.bio.trim().split(/\s+/).length<=50,md);
  for(const church of ['ukrainian','melkite']){
   const c=L.byzantine(new Date('2026-'+md+'T00:00:00Z'),{byzChurch:church,byzSource:'edmonton'});
   assert.ok([c.title,...(c.also||[]).map(e=>e.title)].some(title=>bio.match.test(title)),church+' '+md);
  }
 }
 assert.ok(!/\b(?:2000|20,000)\b/.test(shared['12-28'].bio));
 const segment=app.slice(app.indexOf('const TODAY_SAINT_BIOS'),app.indexOf('function todaySaintBio'));
 const ua=segment.slice(segment.indexOf('    ukrainian: {'),segment.indexOf('    melkite: {'));
 const me=segment.slice(segment.indexOf('    melkite: {'),segment.indexOf('    sarum: {'));
 assert.ok(ua.includes("'12-31': BYZANTINE_BIO_MELANIA"));
 assert.ok(ua.includes("'12-30': {"),'Verified December 30 Ukrainian martyr now has a short card');
 assert.ok(me.includes("'12-30': BYZANTINE_BIO_MELANIA"));
 assert.ok(!me.includes("'12-31':"),'Melkite leave-taking does not invent named saint');
 const ua31=L.byzantine(new Date('2026-12-31T00:00:00Z'),{byzChurch:'ukrainian',byzSource:'edmonton'});
 const me30=L.byzantine(new Date('2026-12-30T00:00:00Z'),{byzChurch:'melkite'});
 assert.match(ua31.title,/Melania/);
 assert.match(me30.title,/Melany/);
});

test('Western saint cards use only the primary observance, not displaced commemorations',()=>{
 const L=require('../calendar.js'),S=require('../sarum.js');
 const ordinary=L.roman(new Date('2026-11-22T00:00:00Z'));
 assert.doesNotMatch(ordinary.title,/Cecilia/);
 assert.ok((ordinary.also||[]).some(e=>/Cecilia/.test(e.title)));
 const western=app.slice(app.indexOf('function todaySaintBio'),app.indexOf('function viewToday'));
 assert.match(western,/const titles = S\.rite === 'byz'/);
 assert.match(western,/: \[title\];/);
 const m=app.slice(app.indexOf('const WESTERN_SHARED_SAINT_BIOS'),app.indexOf('function todaySaintBio'));
 for(const day of ['11-22','11-30','12-06','12-13','12-26','12-27','12-28'])
   assert.ok(m.includes("'"+day+"':"),day);
 assert.ok(m.includes('...WESTERN_SHARED_SAINT_BIOS'));
 assert.match(S.sarum(new Date('2026-11-30T00:00:00Z')).title,/Andrew/);
});

test('Traditional seasonal biographies match their documented Sarum saints',()=>{
 const S=require('../sarum.js');
 const code=app.slice(app.indexOf('    sarum: {',app.indexOf('const TODAY_SAINT_BIOS')),app.indexOf('function todaySaintBio'));
 for(const [md,name]of Object.entries({
  '11-16':'Edmund Rich','11-17':'Hugh of Lincoln','11-20':'Edmund the Martyr',
  '12-04':'Osmund of Salisbury','12-12':'Finnian of Clonard','12-29':'Thomas Becket'
 })){
  const entry=code.slice(code.indexOf("'"+md+"':"));
  assert.ok(entry.startsWith("'"+md+"':"),md);
  assert.ok(entry.includes("name: 'Saint "+name+"'"),md);
  assert.ok(entry.includes('https://www.newadvent.org/cathen/'),md);
  const day=S.sarum(new Date('2026-'+md+'T00:00:00Z'));
  const word=name.split(' ')[0];
  assert.match([day.title,...(day.also||[]).map(x=>x.title)].join(' '),new RegExp(word,'i'),md);
 }
});


test('Roman St. Charles Borromeo and Traditional November–December saints have short, sourced cards',()=>{
 const L=require('../calendar.js'), S=require('../sarum.js');
 const entries=app.slice(app.indexOf('const TODAY_SAINT_BIOS'),app.indexOf('function todaySaintBio'));
 const roman=entries.slice(entries.indexOf('    roman: {'),entries.indexOf('    ukrainian: {'));
 const sarum=entries.slice(entries.indexOf('    sarum: {'));
 assert.ok(roman.includes("'11-04':"));
 assert.ok(roman.includes('saint-charles-borromeo/'));
 assert.match(L.roman(new Date('2026-11-04T00:00:00Z')).title,/Charles Borromeo/);
 for(const [date,name] of Object.entries({
  '11-03':'Malachy of Armagh','11-06':'Leonard of Noblac','11-13':'Brice of Tours',
  '11-24':'Chrysogonus','11-26':'Linus','12-31':'Sylvester I'
 })){
  const card=sarum.slice(sarum.indexOf("'"+date+"':"));
  assert.ok(card.startsWith("'"+date+"':"),date);
  assert.ok(card.includes('name: "Saint '+name+'"')||
   card.includes('name: "Pope Saint '+name+'"'),date+' name');
  assert.ok(card.includes('source: "https://'),date+' source');
  const summary=card.match(/bio: "([^"]+)"/);
  assert.ok(summary,date+' biography');
  assert.ok(summary[1].trim().split(/\s+/).length<=50,date+' length');
  const appointment=S.sarum(new Date('2026-'+date+'T00:00:00Z'));
  assert.ok(appointment.title,date+' Sarum appointment');
 }
 for(const [date,bio] of [['11-23','BYZANTINE_BIO_CLEMENT'],['11-25','BYZANTINE_BIO_CATHERINE']]){
  assert.ok(sarum.includes("'"+date+"': "+bio),date);
 }
 assert.ok(sarum.includes('evidence for his martyrdom remains uncertain'));
});

test('Traditional group martyrs and St Thomas retain source-backed short biographies',()=>{
 const S=require('../sarum.js');
 const section=app.slice(app.indexOf('    sarum: {',app.indexOf('const TODAY_SAINT_BIOS')),app.indexOf('function todaySaintBio'));
 const rows=[
  ['11-08','The Four Crowned Martyrs','Four Crowned Martyrs'],
  ['11-09','Saint Theodore of Amasea','Theodore'],
  ['12-21','Saint Thomas the Apostle','Thomas']
 ];
 for(const [md,name,calendarName] of rows){
  const block=section.slice(section.indexOf("'"+md+"':"));
  assert.ok(block.startsWith("'"+md+"':"),md);
  assert.ok(block.includes('name: "'+name+'"'),md);
  const bio=block.match(/bio: "([^"]+)"/);
  assert.ok(bio,md);
  assert.ok(bio[1].trim().split(/\s+/).length<=50,md);
  assert.ok(block.includes('source: "https://'),md);
  let found=false;
  for(let year=2025;year<=2036;year++){
   const record=S.sarum(new Date(year+'-'+md+'T00:00:00Z'));
   if(record.title.includes(calendarName)){found=true;break;}
  }
  assert.ok(found,'At least one Sarum year must primarily appoint '+calendarName+' on '+md);
 }
 assert.ok(section.includes('Their exact identities are uncertain'));
});

test('Outranked Sarum Saturninus and Sisinnius remain Calendar-only in Advent',()=>{
 const S=require('../sarum.js');
 const section=app.slice(app.indexOf('    sarum: {',app.indexOf('const TODAY_SAINT_BIOS')),app.indexOf('function todaySaintBio'));
 assert.ok(!section.includes("'11-29':"),'There is no unreachable saint-specific Today biography');
 for(let year=2025;year<=2036;year++){
  const day=S.sarum(new Date(year+'-11-29T00:00:00Z'));
  assert.doesNotMatch(day.title,/Saturninus|Sisinnius/i,'Advent takes precedence '+year);
 }
});

test('Traditional Martinmas and Saint Martin/Andrew octaves reuse sourced biographies only when observed',()=>{
 const S=require('../sarum.js');
 const shared=app.slice(app.indexOf('const WESTERN_SHARED_SAINT_BIOS'),app.indexOf('const TODAY_SAINT_BIOS'));
 const roman=app.slice(app.indexOf('    roman: {',app.indexOf('const TODAY_SAINT_BIOS')),app.indexOf('    ukrainian: {'));
 const sarum=app.slice(app.indexOf('    sarum: {',app.indexOf('const TODAY_SAINT_BIOS')),app.indexOf('function todaySaintBio'));
 assert.match(shared,/['"]11-11['"]:\s*\{ match: \/Martin of Tours\/i/);
 assert.ok(shared.includes('saint-martin-of-tours/'));
 assert.ok(sarum.includes("'11-11': SARUM_BIO_MARTIN"));
 assert.ok(sarum.includes("'11-18': SARUM_BIO_MARTIN"));
 assert.ok(sarum.includes("'12-07': WESTERN_SHARED_SAINT_BIOS['11-30']"));
 assert.ok(roman.includes('...WESTERN_SHARED_SAINT_BIOS'),'Roman November 11 keeps its existing biography through the shared map');
 for(const [md,saint] of [['11-11','Martin'],['11-18','Martin'],['12-07','Andrew']]){
  let observed=false;
  for(let year=2025;year<=2036;year++){
   const day=S.sarum(new Date(year+'-'+md+'T00:00:00Z'));
   if(new RegExp(saint,'i').test(day.title)){observed=true;break;}
  }
  assert.ok(observed,md+' must have an observed Sarum date within the test years');
 }
 // A displaced saint is never resurrected by the Today card just because its date matches.
 assert.match(app,/const entry = listed && titles\.some\(item => listed\.match\.test\(item\)\) \? listed : null/);
 assert.match(app,/: \[title\];/);
});

test('Sarum Martinmas and St Martin octave titles match their biography, not unrelated fast days',()=>{
 const S=require('../sarum.js');
 const match=/Martinmas|(?:St\.?|Saint)\s+Martin\b|Martin of Tours/i;
 const positives=["Martinmas / Saint Martin's Lent","Octave Day of St. Martin","St. Martin, Bishop"];
 for(const label of positives)assert.ok(match.test(label),label);
 assert.ok(!match.test("Third Sunday of Advent"));
 for(const md of ['11-11','11-18']){
  let sawMartin=false;
  for(let year=2025;year<=2036;year++){
   const title=S.sarum(new Date(year+'-'+md+'T00:00:00Z')).title;
   if(/Martinmas|St\.? Martin|Saint Martin/i.test(title)){
    sawMartin=true;
    assert.ok(match.test(title),year+' '+md+': '+title);
   }
  }
  assert.ok(sawMartin,'Sarum Martin observance is actually selected for '+md);
 }
 const defs=app.slice(app.indexOf('const SARUM_BIO_MARTIN'),app.indexOf('const TODAY_SAINT_BIOS'));
 assert.match(defs,/WESTERN_SHARED_SAINT_BIOS\['11-11'\]/);
 assert.match(defs,/match: \/Martinmas\|/);
 const dates=app.slice(app.indexOf('    sarum: {',app.indexOf('const TODAY_SAINT_BIOS')),app.indexOf('function todaySaintBio'));
 assert.match(dates,/'11-11': SARUM_BIO_MARTIN/);
 assert.match(dates,/'11-18': SARUM_BIO_MARTIN/);
});

test('December 30 Anysia bio belongs to the Ukrainian mode, not the Melkite Melania day',()=>{
 const L=require('../calendar.js');
 const src=app.slice(app.indexOf('const TODAY_SAINT_BIOS'),app.indexOf('function todaySaintBio'));
 const uk=src.slice(src.indexOf('    ukrainian: {'),src.indexOf('    melkite: {'));
 const mk=src.slice(src.indexOf('    melkite: {'),src.indexOf('    sarum: {'));
 assert.match(uk,/'12-30': \{\s*match: \/Anysia\/i/);
 assert.match(uk,/name: 'Holy Martyr Anysia of Thessalonica'/);
 const biography=uk.match(/name: 'Holy Martyr Anysia of Thessalonica'[\s\S]*?bio: '([^']+)'/);
 assert.ok(biography);
 assert.ok(biography[1].trim().split(/\s+/).length<=50);
 assert.ok(uk.includes('https://www.oca.org/saints/lives/2026/12/30/103691-virgin-martyr-anysia-at-thessalonica'));
 assert.match(L.byzantine(new Date('2026-12-30T00:00:00Z'),{byzChurch:'ukrainian',byzSource:'edmonton'}).title,/Anysia/);
 assert.ok(mk.includes("'12-30': BYZANTINE_BIO_MELANIA"),'Do not replace Melkite commemoration');
});

test('January Roman saint cards are sourced, short, and match observed Roman titles',()=>{
 const L=require('../calendar.js');
 const roman=app.slice(app.indexOf('    roman: {',app.indexOf('const TODAY_SAINT_BIOS')),app.indexOf('    ukrainian: {'));
 const names={'01-02':'Basil the Great','01-04':'Elizabeth Ann Seton','01-05':'John Neumann','01-17':'Anthony','01-21':'Agnes'};
 for(const [md,name] of Object.entries(names)){
  const row=roman.slice(roman.indexOf("'"+md+"':"));
  assert.ok(row.startsWith("'"+md+"':"),md);
  assert.ok(row.includes('source: "https://www.franciscanmedia.org/saint-of-the-day/'),md+' source');
  const biography=row.match(/bio: "([^"]+)"/);
  assert.ok(biography,md);
  assert.ok(biography[1].trim().split(/\s+/).length<=50,md);
  let observed=false;
  for(let year=2025;year<=2035;year++){
   const day=L.roman(new Date(year+'-'+md+'T00:00:00Z'));
   if(new RegExp(name,'i').test(day.title)){observed=true;break;}
  }
  assert.ok(observed,md+' is observed as the primary saint in some year');
 }
 assert.ok(roman.includes('Saint Basil the Great'));
 assert.ok(roman.includes('Saint Agnes of Rome'));
 const selector=app.slice(app.indexOf('function todaySaintBio'),app.indexOf('function viewToday'));
 assert.match(selector,/const titles = S\.rite === 'byz'/);
 assert.match(selector,/: \[title\];/);
});

test('Late January Roman cards respect named primary commemoration and Sunday precedence',()=>{
 const L=require('../calendar.js');
 const romans=app.slice(app.indexOf('    roman: {',app.indexOf('const TODAY_SAINT_BIOS')),app.indexOf('    ukrainian: {'));
 const names={'01-24':'Francis de Sales','01-25':'Conversion of Saint Paul','01-26':'Timothy and Titus','01-28':'Thomas Aquinas','01-31':'John Bosco'};
 for(const [md,title] of Object.entries(names)){
  const entry=romans.slice(romans.indexOf("'"+md+"':"));
  assert.ok(entry.startsWith("'"+md+"':"),md);
  assert.ok(entry.includes('source: "https://www.franciscanmedia.org/saint-of-the-day/'),md);
  const bio=entry.match(/bio: "([^"]+)"/);
  assert.ok(bio&&bio[1].trim().split(/\s+/).length<=50,md);
  const selected=Array.from({length:12},(_,i)=>L.roman(new Date((2025+i)+'-'+md+'T00:00:00Z')));
  assert.ok(selected.some(day=>day.title.includes(title)),md+' has an observed Roman title');
 }
 assert.ok(romans.includes('name: "Saint Timothy"'));
 assert.ok(romans.includes('name: "Saint Paul the Apostle"'));
 assert.doesNotMatch(L.roman(new Date('2027-01-31T00:00:00Z')).title,/John Bosco/);
 const selector=app.slice(app.indexOf('function todaySaintBio'),app.indexOf('function viewToday'));
 assert.match(selector,/: \[title\];/,'Sunday takes precedence over a displaced saint');
});

test('Roman February biographies are sourced, concise, and match valid feast years',()=>{
 const L=require('../calendar.js');
 const roman=app.slice(app.indexOf('    roman: {',app.indexOf('const TODAY_SAINT_BIOS')),app.indexOf('    ukrainian: {'));
 const names={
  '02-05':'Agatha','02-06':'Paul Miki','02-10':'Scholastica',
  '02-14':'Cyril and Methodius','02-22':'Chair of Saint Peter','02-23':'Polycarp'
 };
 for(const [md,name] of Object.entries(names)){
  const row=roman.slice(roman.indexOf("'"+md+"':"));
  assert.ok(row.startsWith("'"+md+"':"),md);
  assert.ok(row.includes('source: "https://www.franciscanmedia.org/saint-of-the-day/'),md);
  const biography=row.match(/bio: "([^"]+)"/);
  assert.ok(biography&&biography[1].trim().split(/\s+/).length<=50,md);
  let appointed=false;
  for(let year=2025;year<=2035;year++){
   const today=L.roman(new Date(year+'-'+md+'T00:00:00Z'));
   if(today.title.includes(name)){appointed=true;break;}
  }
  assert.ok(appointed,md+' must be observed as the primary Roman feast in some year');
 }
});
test('2027 Lent suppresses the February Scholastica and Polycarp saint cards',()=>{
 const L=require('../calendar.js');
 const get=date=>L.roman(new Date(date+'T00:00:00Z'));
 assert.match(get('2027-02-10').title,/Ash Wednesday/);
 assert.doesNotMatch(get('2027-02-10').title,/Scholastica/);
 assert.match(get('2027-02-14').title,/(?:1st|First) Sunday of Lent/i);
 assert.doesNotMatch(get('2027-02-14').title,/Cyril|Methodius/);
 assert.equal(get('2027-02-23').season,'Lent');
 assert.doesNotMatch(get('2027-02-23').title,/Polycarp/);
 assert.match(get('2027-02-22').title,/Chair of Saint Peter/);
 assert.match(get('2028-02-10').title,/Scholastica/);
 assert.match(get('2028-02-23').title,/Polycarp/);
 const selector=app.slice(app.indexOf('function todaySaintBio'),app.indexOf('function viewToday'));
 assert.match(selector,/const titles = S\.rite === 'byz'/);
 assert.match(selector,/: \[title\];/);
});

test('Roman March through May saint cards follow titles and precedence',()=>{
 const L=require('../calendar.js');
 const roman=app.slice(app.indexOf('    roman: {',app.indexOf('const TODAY_SAINT_BIOS')),app.indexOf('    ukrainian: {'));
 const expected={'03-19':'Joseph','04-25':'Mark','04-29':'Catherine of Siena','05-02':'Athanasius','05-03':'Philip and James','05-14':'Matthias'};
 for(const [md,saint] of Object.entries(expected)){
  const entry=roman.slice(roman.indexOf("'"+md+"':"));
  assert.ok(entry.startsWith("'"+md+"':"),md);
  assert.ok(entry.includes('source: "https://www.franciscanmedia.org/saint-of-the-day/'),md);
  const bio=entry.match(/bio: "([^"]+)"/);
  assert.ok(bio&&bio[1].trim().split(/\s+/).length<=50,md);
  let observed=false;
  for(let year=2025;year<=2040;year++){
   const day=L.roman(new Date(year+'-'+md+'T00:00:00Z'));
   if(day.title.includes(saint)){observed=true;break;}
  }
  assert.ok(observed,md+' observed on some primary Roman calendar date');
 }
 assert.match(L.roman(new Date('2027-03-19T00:00:00Z')).title,/Saint Joseph/);
 assert.match(L.roman(new Date('2027-04-29T00:00:00Z')).title,/Catherine of Siena/);
 assert.doesNotMatch(L.roman(new Date('2027-04-25T00:00:00Z')).title,/Saint Mark/,'Easter Sunday outranks evangelist');
 assert.doesNotMatch(L.roman(new Date('2027-05-02T00:00:00Z')).title,/Athanasius/,'Easter Sunday outranks the memorial');
 assert.match(L.roman(new Date('2027-05-03T00:00:00Z')).title,/Philip and James/);
 assert.match(L.roman(new Date('2027-05-14T00:00:00Z')).title,/Matthias/);
});

test('June Roman saints have concise biographies with proper feast-date precedence',()=>{
 const L=require('../calendar.js');
 const roman=app.slice(app.indexOf('    roman: {',app.indexOf('const TODAY_SAINT_BIOS')),app.indexOf('    ukrainian: {'));
 const expected={'06-01':'Justin','06-03':'Charles Lwanga','06-11':'Barnabas',
  '06-13':'Anthony of Padua','06-24':'John the Baptist','06-29':'Peter and Paul'};
 for(const [md,saint] of Object.entries(expected)){
  const card=roman.slice(roman.indexOf("'"+md+"':"));
  assert.ok(card.startsWith("'"+md+"':"),md);
  assert.ok(card.includes('source: "https://www.franciscanmedia.org/saint-of-the-day/'),md);
  const bio=card.match(/bio: "([^"]+)"/);
  assert.ok(bio&&bio[1].trim().split(/\s+/).length<=50,md);
  assert.ok(Array.from({length:12},(_,i)=>L.roman(new Date((2025+i)+'-'+md+'T00:00:00Z')).title)
   .some(t=>t.includes(saint)),md+' is a primary commemoration in at least one year');
 }
 assert.doesNotMatch(L.roman(new Date('2026-06-13T00:00:00Z')).title,/Anthony of Padua/,
  'Immaculate Heart Saturday may displace Anthony in 2026');
 assert.match(L.roman(new Date('2027-06-13T00:00:00Z')).season,/Ordinary Time/,
  'calendar still supplies its appropriate season');
 assert.match(L.roman(new Date('2027-06-24T00:00:00Z')).title,/Nativity of Saint John the Baptist/);
 assert.match(L.roman(new Date('2027-06-29T00:00:00Z')).title,/Peter and Paul/);
});
