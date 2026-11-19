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

    'The Litany of Peace',
    'DEACON: In peace let us pray to the Lord.',
    'ALL: Lord, have mercy. (To be repeated after each petition)',
    'For peace from on high and the salvation of our souls, let us pray to the Lord.',
    'For peace in the whole world, the well-being of the holy Churches of God, let us pray to the Lord.',
    'For this holy house and for those who enter it with faith, let us pray to the Lord.',
    'For (our Father and Patriarch N., if present,) our Father and (Arch)Bishop N., let us pray to the Lord.',
    'For the government and for the armed forces, let us pray to the Lord.',
    'For this city, for every city and country place, let us pray to the Lord.',
    'For favorable weather, an abundance of the fruits of the earth, let us pray to the Lord.',
    'For the travelers by sea, air and land, for the sick and captives, let us pray to the Lord.',
    'For our deliverance from all affliction, wrath, danger and need, let us pray to the Lord.',
    'Help us, save us, have mercy on us and protect us, O God, by Your grace.',
    'Let us remember our all-\u00ad\u2010\u2011holy, spotless, most highly blessed and glorious Lady the Theotokos.',
    'ALL: To You, O Lord.','PRIEST: Fixture Litany of Peace conclusion.',
    'Little Entrance','The celebrant(s) alternate with the Choir the singing of the hymns as indicated',
    'Table of Kontakia for the Year','Fixture annual Kontakia index must be hidden.',
    'The Trisagion Prayer of St. John Chrysostom',
    'PRIEST: O Holy of Holies, our only holy God.',
    'The Trisagion Prayer of St. Basil the Great',
    'PRIEST: God, the Holy, who rest among the saints.',
    'The Trisagion Hymn','ALL: Holy God, Holy Mighty One.','Epistle'
   ],
   58:[
    'T H E E K T E N E','(Ecumenic Petitions)',
    'DEACON: Let us all say with our whole soul and our whole mind, let us all say:',
    'ALL: Lord, have mercy. (three times -\u00ad\u2010\u2011 to be repeated after each petition.)',
    'Lord Almighty, God of our fathers, we pray to You, hear us and have mercy.',
    'Have mercy on us, O God, in Your great mercy, we pray to You, hear us and have mercy.',
    'After the third petition, some other appropriate ecumenic petitions may be said.',
    'Again, we pray for our Father and (Arch)Bishop N. and for his honorable presbyterate.',
    'Again, we pray for the priests, the deacons, the monks, the nuns and all our brothers and sisters in Christ.',
    'Again, we pray for mercy, life, peace, health and salvation.'
   ],
   59:[
    'Again, we pray for the blessed and ever to be remembered founders of this holy church.',
    'Again, we pray for those who bear offerings and all the people here present.',
    'DEACON: Wisdom.','Prayer of the Ektene (said quietly by the Priest):',
    'PRIEST: Fixture Ektene concluding prayer.'
   ],
   63:['The Cherubic Hymn','ALL: Fixture choir hymn remains singular.'],
   64:[
    'The Priest is joined by the Deacon; they both bow three times, repeating quietly the Cherubic Hymn:',
    'Priest: We who mystically represent the Cherubim, and sing to the Life-Giving Trinity the thrice-holy hymn, let us lay aside all earthly cares, to receive the King of all.',
    'Deacon: Invisibly escorted by angel hosts. Alleluia Alleluia. Alleluia.',
    'Then the Priest kisses the Antimension. Fixture direction.'
   ],
   67:[
    'L I T A N Y O F T H E G I F T S',
    'DEACON: Let us complete our prayer to the Lord.',
    'ALL: Lord, have mercy. (To be repeated after each petition)',
    'DEACON: For the precious gifts here offered, let us pray to the Lord.',
    'Optional:',
    'For this holy house and those who enter it with faith, let us pray to the Lord.',
    'For our deliverance from all affliction, let us pray to the Lord.',
    'Help us, save us, have mercy on us and protect us, O God, by Your grace.',
    'The Priest prays the following prayer:'
   ],
   68:[
    'Prayer of Offering','PRIEST: Lord God Almighty who alone are holy.',
    'PRIEST: Fixture Only-\u00ad\u2010\u2011Begotten prayer.',
    'ALL: The Father, the Son and the Holy Spirit, Trinity, one in essence and undivided. After “The Father, the Son…,” “I will love You, Lord…” may also be sung.'
   ],
   78:[
    'P R E P A R A T I O N F O R H O L Y C O M M U N I O N',
    'DEACON: Now that we have remembered all the saints, again and again in peace let us pray to the Lord.',
    'ALL: Lord, have mercy. (To be repeated after each petition)',
    'For the precious gifts here offered and sanctified, let us pray to the Lord.'
   ],
   79:[
    'That our God who loves mankind, having received these gifts on His altar, may send down His divine grace and the gift of the Holy Spirit, let us pray.',
    'Optional:',
    'For our deliverance from all affliction, let us pray to the Lord.',
    'Help us, save us, have mercy on us and protect us, O God, by Your grace.',
    'T H E A I T E S I S',
    'That this day may be peaceful, let us ask the Lord.',
    'ALL: Grant this, O Lord. (To be repeated after each petition.)',
    'For an angel of peace, let us ask the Lord.',
    'For forgiveness of sins, let us ask the Lord.',
    'For peace in the world, let us ask the Lord.',
    'That our life may be peaceful, let us ask the Lord.',
    'That our end may be painless, let us ask.'
   ],
   93:[
    'A P O L Y S I S',
    'PRIEST: Glory to You, Christ God, our hope, glory to You.',
    'Optional:',
    'ALL: Glory be to the Father, and to the Son, and to the Holy Spirit, now and always and forever and ever. Amen.',
    'Lord, have mercy. (Three times)',
    'Give the blessing, Master, in the name of the Lord.',
    'On Sundays and Feast days:',
    'PRIEST: Fixture Sunday dismissal.'
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
 assert.equal(await preview.locator('.byz-role-priest').filter({hasText:'We who mystically represent the Cherubim'}).count(),3,
  'the source-marked priest stanza appears three times');
 assert.equal(await preview.locator('.byz-role-deacon').filter({hasText:'Invisibly escorted by angel hosts'}).count(),3,
  'each stanza retains its deacon response');
 assert.equal((text.match(/Fixture choir hymn remains singular/g)||[]).length,1,
  'the preceding congregational hymn remains singular');
 assert.doesNotMatch(text,/they both bow three times, repeating quietly/,'the verified direction is not spoken prayer');
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
 assert.equal((text.match(/Lord, have mercy/g)||[]).length,40,
  'Litany of Peace, Ektene, Gifts and Communion responses must all display');
 assert.equal((text.match(/To You, O Lord/g)||[]).length,2,
  'Litany of Peace and Aitesis each preserve one distinct concluding response');
 assert.match(text,/Fixture Ektene concluding prayer/);
 assert.doesNotMatch(text,/After the third petition, some other appropriate ecumenic petitions may be said/,
  'optional-petition instructions must not read as prayer');
 assert.match(text,/Preparation for Holy Communion/);
 assert.match(text,/Fixture Only-Begotten prayer\./,'verified composite hyphen is displayed as a single hyphen');
 assert.doesNotMatch(text,/Fixture Only-\u2010\u2011Begotten/,'redundant font hyphens do not appear');
 assert.match(text,/The Father, the Son and the Holy Spirit, Trinity, one in essence and undivided\./,
  'retain the actual All response following the prayer of offering');
 assert.doesNotMatch(text,/After “The Father, the Son.*may also be sung/,
  'printed inline chant-selection note must not be read as prayer');
 const optional=preview.locator('details.byz-optional-litany');
 assert.equal(await optional.count(),3,'Gifts, Communion and dismissal optional blocks must stay distinct');
 assert.deepEqual(await optional.locator('summary').allTextContents(),['Optional petitions','Optional petitions','Optional dismissal responses']);
 assert.deepEqual(await optional.evaluateAll(nodes=>nodes.map(n=>n.open)),[false,false,false],
  'unappointed material must be collapsed by default');
 assert.ok((await optional.first().textContent()).includes('For this holy house'),
  'optional petitions remain accessible without losing source words');
 assert.ok((await optional.nth(1).textContent()).includes('For our deliverance'),
  'Communion alternatives remain accessible in their own section');
 const dismissalText=await optional.last().textContent();
 assert.equal((dismissalText.match(/Lord, have mercy\./g)||[]).length,3,
  'optional dismissal must have three fully spoken responses');
 assert.doesNotMatch(dismissalText,/Three times/,'editorial count must not be displayed');
 assert.match(text,/Fixture Sunday dismissal/,'appointed dismissal stays in the main prayer flow');
 assert.equal((text.match(/Grant this, O Lord/g)||[]).length,6,
  'six source-directed Aitesis responses must be visible');
 assert.equal((text.match(/To You, O Lord/g)||[]).length,2,
  'each distinct concluding response stays singular in its own litany');
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
