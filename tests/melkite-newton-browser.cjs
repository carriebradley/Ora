const assert=require('node:assert/strict'),path=require('node:path');
module.exports=async(page,base,artifacts)=>{
 await page.goto(base+'index.html?tab=liturgy&rite=byz&date=2026-11-15');
 await page.locator('[data-act="liturgyview"][data-v="byz"]').click();
 assert.equal(await page.locator('.liturgical-text').getAttribute('data-text-id'),'melkite-chrysostom');
 // Recognized 159-page Newton edition: page-two imprint, service pages 30-96.
 // All strings are synthetic, except verified structural source headings.
 await page.evaluate(async()=>{
  const oldGet=LiturgyReader.get,oldLoad=LiturgyReader.load;
  const pages={
   2:['FINAL DRAFT EDITION COMMON ENGLISH TRANSLATION'],
   30:[
    'The Divine Liturgy','PRIEST: Blessed is the Kingdom. Fixture opening.',
    'Little Entrance','The celebrant(s) alternate with the Choir the singing of the hymns as indicated',
    'Table of Kontakia for the Year','Fixture annual Kontakia index must be hidden.',
    'The Trisagion Prayer of St. John Chrysostom',
    'PRIEST: O Holy of Holies, our only holy God.',
    'The Trisagion Prayer of St. Basil the Great',
    'PRIEST: God, the Holy, who rest among the saints.',
    'The Trisagion Hymn','ALL: Holy God, Holy Mighty One.','Epistle'
   ],
   79:[
    'T H E A I T E S I S',
    'That this day may be peaceful, let us ask the Lord.',
    'ALL: Grant this, O Lord. (To be repeated after each petition.)',
    'For an angel of peace, let us ask the Lord.',
    'For forgiveness of sins, let us ask the Lord.',
    'For peace in the world, let us ask the Lord.',
    'That our life may be peaceful, let us ask the Lord.',
    'That our end may be painless, let us ask.'
   ],
   80:[
    'Let us ask for unity of faith and commend our whole life to Christ God.',
    'ALL: To You, O Lord.','The Lord’s Prayer'
   ],
   31:[
    'The Holy Gospel','Liturgy of the Eucharist','Anaphora',
    'PRIEST: Fixture Eucharistic prayer.',
    'Table of Hirmoi for the Year','Fixture annual Hirmoi index must be hidden.',
    'During the singing of the Hirmos, the Priest continues:',
    'PRIEST: Fixture prayer after Hirmoi.','One is Holy',
    'Holy Communion','ALL: Fixture Communion response.'
   ]
  };
  LiturgyReader.get=async id=>({
   id,name:'fictional-Newton-2009.pdf',format:'pdf',pages:159,
   page:1,updated:907,blob:new Blob()
  });
  LiturgyReader.load=async()=>({
   numPages:159,getPage:async n=>({
    getTextContent:async()=>({items:(pages[n]||[]).map((str,i)=>({
     str,width:330,height:12,transform:[1,0,0,12,20,800-i*31]
    }))})
   }),destroy:async()=>{}
  });
  try{await LiturgicalText.hydrate();}
  finally{LiturgyReader.get=oldGet;LiturgyReader.load=oldLoad;}
 });
 try{
  await page.waitForFunction(()=>{
   const section=document.querySelector('.liturgical-text');
   return section?.dataset.placedDaily==='prokeimenon,alleluia'&&
    section.querySelectorAll('.reader-inline-text .byz-daily-proper-heading').length===2;
  },null,{timeout:15000});
 }catch(error){
  const diagnostics=await page.evaluate(()=>({
   placed:document.querySelector('.liturgical-text')?.dataset.placedDaily,
   excerpt:document.querySelector('.reader-inline-text')?.textContent?.slice(0,1200)
  }));
  throw new Error('Recognized Newton PDF was not composed: '+JSON.stringify(diagnostics),{cause:error});
 }
 const preview=page.locator('.reader-inline-text'),text=await preview.innerText();
 assert.doesNotMatch(text,/Fixture annual (?:Kontakia|Hirmoi) index must be hidden|Table of (?:Kontakia|Hirmoi) for the Year/,
  'annual indexes must remain absent after dated hymns are inserted');
 const original=[
  'The Trisagion Prayer of St. John Chrysostom',
  'O Holy of Holies, our only holy God.',
  'The Trisagion Prayer of St. Basil the Great',
  'God, the Holy, who rest among the saints.',
  'Fixture prayer after Hirmoi.','Fixture Eucharistic prayer.',
  'Fixture Communion response.'
 ];
 for(const anchor of original)assert.equal(text.split(anchor).length-1,1,
  'prayer omitted or duplicated at a Newton annual-table boundary: '+anchor);
 const sequence=[
  'Fixture opening.','Little Entrance',
  'The Trisagion Prayer of St. John Chrysostom',
  'The Trisagion Prayer of St. Basil the Great',
  'The Trisagion Hymn','Prokeimenon','Epistle','Alleluia',
  'The Holy Gospel','Anaphora','Fixture Eucharistic prayer.',
  'Fixture prayer after Hirmoi.','Holy Communion','Fixture Communion response.'
 ];
 let last=-1;
 for(const phrase of sequence){
  const index=text.indexOf(phrase);
  assert.ok(index>last,'misordered Newton 2009 source and dated hymns: '+phrase);
  last=index;
 }
 assert.equal((text.match(/Grant this, O Lord/g)||[]).length,6,
  'six source-directed Aitesis responses must be visible');
 assert.equal((text.match(/To You, O Lord/g)||[]).length,1,
  'different concluding response stays singular');
 assert.doesNotMatch(text,/To be repeated after each petition/,
  'editorial directions are not prayers');
 assert.match(text,/The Aitesis/,'tracked heading remains legible');
 assert.deepEqual(await preview.locator('.byz-daily-proper-heading').allTextContents(),
  ['Prokeimenon','Alleluia']);
 const panel=page.locator('.byz-daily-propers[data-church="melkite"][data-iso="2026-11-15"]');
 assert.deepEqual(await panel.locator('.byz-proper-group').evaluateAll(nodes=>nodes.map(n=>n.dataset.proper)),
  ['troparia'],'unplaceable troparia must remain in Readings & propers');
 assert.equal(await page.locator('.reader-inline-controls').isVisible(),false);
 for(const width of [320,390]){
  await page.setViewportSize({width,height:844});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 }
 await page.setViewportSize({width:390,height:844});
 await page.screenshot({path:path.join(artifacts,'melkite-newton-after-hymns.png'),fullPage:true});
};
