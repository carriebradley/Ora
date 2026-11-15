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
 assert.ok(!ua.includes("'12-30':"),'Edmonton December 30 date is unverified');
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
