/* Roman Office date planning and public-domain Scripture; no ICEL prayer translations.
 * Reference: current First Edition; GILH 88, 92, 133–137, 204–233;
 * Universal Norms 61; USCCB 2027 calendar. See the dated Office audit. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.RomanOffice=factory();
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const reference=Object.freeze({edition:'first',textStatus:'mixed-official-and-public-domain',scripture:'Douay-Rheims',authorizedStructuredSource:null});
  const days=(a,b)=>Math.round((a-b)/864e5);
  const cycle=n=>((n-1)%4+4)%4+1;
  function psalterWeek(L,date,options={}){
    const y=date.getUTCFullYear(),easter=L.westernEaster(y),advent=L.advent(y),christmas=L.D(y,12,25);
    if(date>=advent&&date<christmas)return cycle(Math.floor(days(date,advent)/7)+1);
    let epiphany=L.D(y,1,6);
    if(options.epiphany==='sunday'){
      const jan2=L.D(y,1,2);epiphany=L.add(jan2,(7-jan2.getUTCDay())%7);
    }
    const baptism=options.epiphany==='sunday'&&epiphany.getUTCDate()>=7
      ? L.add(epiphany,1):L.add(epiphany,7-epiphany.getUTCDay());
    if(date>=christmas||date<=baptism){
      const nativity=date>=christmas?christmas:L.D(y-1,12,25);
      const sunday=L.add(nativity,(7-nativity.getUTCDay())%7);
      // Week changes on Sunday, never on the anniversary of Christmas's weekday.
      return cycle(Math.max(1,Math.floor(days(date,sunday)/7)+1));
    }
    if(date<L.add(easter,-46)){
      const start=L.add(baptism,1),secondSunday=L.add(start,(7-start.getUTCDay())%7);
      return date<secondSunday?1:cycle(2+Math.floor(days(date,secondSunday)/7));
    }
    if(date<L.add(easter,-42))return 4;
    if(date<easter)return cycle(Math.floor(days(date,L.add(easter,-42))/7)+1);
    if(date<=L.add(easter,49))return cycle(Math.floor(days(date,easter)/7)+1);
    const sunday=L.add(date,-date.getUTCDay());
    return cycle(35-days(advent,sunday)/7);
  }
  function evening(L,date,options={}){
    const today=L.roman(date,options),nextDate=L.add(date,1),tomorrow=L.roman(nextDate,options);
    // Days within the Easter octave have no separate First Vespers.
    const nextHasFirst=!/within the Octave of Easter/i.test(tomorrow.title)
      &&(tomorrow.rank==='Solemnity'||nextDate.getUTCDay()===0);
    // The current celebration wins ties. This also protects the Triduum.
    const first=nextHasFirst&&tomorrow.p<today.p;
    return {d:first?nextDate:date,first,observance:first?tomorrow:today};
  }
  function night(L,date,options={}){
    const context=evening(L,date,options),day=context.observance;
    const solemnity=day.rank==='Solemnity';
    const sunday=context.d.getUTCDay()===0;
    const index=solemnity||sunday?(context.first?6:0):date.getUTCDay();
    return {index,sunday,kind:solemnity?(context.first?'solemnity-i':'solemnity-ii'):sunday?(context.first?'sunday-i':'sunday-ii'):'weekday',observance:day.title,
      easter:day.season==='Easter Time',octave:days(date,L.westernEaster(date.getUTCFullYear()))>=0&&days(date,L.westernEaster(date.getUTCFullYear()))<=7,
      alleluia:!['Lent','Holy Week','Paschal Triduum'].includes(day.season),reference};
  }
  const canticle=(label,ref)=>'b:Canticle · '+label+'|'+ref;
  const eph=canticle('Ephesians 1','Ephesians 1:3-10');
  const marianFirst=['p112','p147',eph],marianSecond=['p121','p126',eph];
  const christmasFirst=['p112','p147',canticle('Philippians 2','Philippians 2:6-11')];
  const christmasSecond=['p109(1-5,7)','p129',canticle('Colossians 1','Colossians 1:12-20')];
  const epiphanyFirst=['p134(1-12)','p134(13-21)',canticle('1 Timothy 3','1 Timothy 3:16')];
  const rev15=canticle('Revelation 15','Revelation 15:3-4');
  const epiphanySecond=['p109(1-5,7)','p111',rev15];
  const ascensionCanticle='b:Canticle · Revelation 11–12|Revelation 11:17-18|Revelation 12:10-12';
  // Sources and individual verification are recorded in the dated audit.
  // Match resolved observances so transferred celebrations keep their own Office.
  function properPsalmody(L,date,which,options={},first=false){
    const day=L.roman(date,options),easter=L.westernEaster(date.getUTCFullYear()),offset=days(date,easter);
    if(which==='V'){
      if(offset===-2||offset===-1)return ['p115','p142(1-11)','b:Canticle · Philippians 2|Philippians 2:6-11'];
      if(/^The Most Holy Trinity/.test(day.title))return first
        ? ['p112','p147',eph]:['p109(1-5,7)','p113(1-8)','b:Canticle · Revelation 19|Revelation 19:1-7'];
      if(/Body and Blood of Christ/.test(day.title))return first
        ? ['p110','p147',ascensionCanticle]:['p109(1-5,7)','p115','b:Canticle · Revelation 19|Revelation 19:1-7'];
      if(/Most Sacred Heart/.test(day.title))return first
        ? ['p112','p145','b:Canticle · Revelation 4–5|Revelation 4:11|Revelation 5:9-10|Revelation 5:12']
        : ['p109(1-5,7)','p110','b:Canticle · Philippians 2|Philippians 2:6-11'];
      if(/King of the Universe/.test(day.title))return first
        ? ['p112','p116','b:Canticle · Revelation 4–5|Revelation 4:11|Revelation 5:9-10|Revelation 5:12']
        : ['p109(1-5,7)','p144','b:Canticle · Revelation 19|Revelation 19:1-7'];
      if(/^Nativity of Saint John the Baptist/.test(day.title))return first
        ? ['p112','p145',eph]:['p14','p111',rev15];
      if(/^Saints Peter and Paul, Apostles/.test(day.title))return first
        ? ['p116','p147',eph]:['p115','p125',eph];
      if(/^Saint Matthias, Apostle/.test(day.title)&&day.season==='Easter Time')return ['p115','p125',eph];
      if(!first&&/^Saint Andrew, Apostle/.test(day.title))return ['p115','p125',eph];
      if(!first&&/^Presentation of the Lord$/.test(day.title))return [...christmasSecond];
      if(/^Annunciation of the Lord$/.test(day.title))return [...(first?christmasFirst:christmasSecond)];
      if(/^Saint Joseph, Spouse/.test(day.title))return first
        ? ['p112','p145',eph]:['p14','p111',rev15];
      if(/^The Ascension of the Lord$/.test(day.title))return first
        ? ['p112','p116',ascensionCanticle]:['p109(1-5,7)','p46',ascensionCanticle];
      if(/^Pentecost Sunday$/.test(day.title))return first
        ? ['p112','p146',rev15]:['p109(1-5,7)','p113(1-8)','b:Canticle · Revelation 19|Revelation 19:1-7'];
      if(/Nativity of the Lord \(Christmas\)/.test(day.title))return [...(first?christmasFirst:christmasSecond)];
      if(/Holy Family of Jesus/.test(day.title)||/Mary, the Holy Mother of God/.test(day.title))
        return [...(first?marianFirst:marianSecond)];
      if(/Epiphany of the Lord|Baptism of the Lord/.test(day.title))return [...(first?epiphanyFirst:epiphanySecond)];
      if(day.season==='Christmas Time'&&(/within the Octave of Christmas/.test(day.title)
        ||/^(?:Saint Stephen,|Saint John, Apostle|Holy Innocents,)/.test(day.title)))return [...christmasSecond];
      // Only Second Vespers has been independently checked for this solemnity.
      if(!first&&/Immaculate Conception of the Blessed Virgin Mary/.test(day.title))return [...marianSecond];
    }
    // Proper of Seasons through the Second Sunday of Easter; references only.
    if(offset>=0&&offset<=7){
      if(which==='L')return ['p62(2-9)','c210','p149'];
      if(which==='V')return ['p109(1-5,7)','p113(1-8)','b:Canticle · Revelation 19|Revelation 19:1-7'];
    }
    // Agnes is a memorial with proper psalmody, not the ordinary weekday set.
    if(which==='L'&&day.rank==='Memorial'&&/^Saint Agnes,/.test(day.title))
      return ['p62(2-9)','c210','p149'];
    return null;
  }
  // Douay–Rheims–Challoner Scripture, checked against the chapter witnesses
  // linked in the audit. Bundled so these short readings also work offline.
  const readings={
    galatians:{ref:'Galatians 4:4-5',text:'But when the fulness of the time was come, God sent his Son, made of a woman, made under the law: That he might redeem them who were under the law: that we might receive the adoption of sons.'},
    john:{ref:'1 John 1:1-3',text:'That which was from the beginning, which we have heard, which we have seen with our eyes, which we have looked upon, and our hands have handled, of the word of life: For the life was manifested; and we have seen and do bear witness, and declare unto you the life eternal, which was with the Father, and hath appeared to us: That which we have seen and have heard, we declare unto you, that you also may have fellowship with us, and our fellowship may be with the Father, and with his Son Jesus Christ.'},
    corinthians:{ref:'2 Corinthians 8:9',text:'For you know the grace of our Lord Jesus Christ, that being rich he became poor, for your sakes; that through his poverty you might be rich.'},
    philippians:{ref:'Philippians 2:6-7',text:'Who being in the form of God, thought it not robbery to be equal with God: But emptied himself, taking the form of a servant, being made in the likeness of men, and in habit found as a man.'},
    timothy:{ref:'2 Timothy 1:9-10',text:'Who hath delivered us and called us by his holy calling, not according to our works, but according to his own purpose and grace, which was given us in Christ Jesus before the times of the world. But is now made manifest by the illumination of our Saviour Jesus Christ, who hath destroyed death, and hath brought to light life and incorruption by the gospel:'},
    titus:{ref:'Titus 3:4-5',text:'But when the goodness and kindness of God our Saviour appeared: Not by the works of justice, which we have done, but according to his mercy, he saved us, by the laver of regeneration, and renovation of the Holy Ghost;'},
    acts:{ref:'Acts 10:37-38',text:'You know the word which hath been published through all Judea: for it began from Galilee, after the baptism which John preached, Jesus of Nazareth: how God anointed him with the Holy Ghost, and with power, who went about doing good, and healing all that were oppressed by the devil, for God was with him.'},
    peter:{ref:'1 Peter 4:13-14',text:'But if you partake of the sufferings of Christ, rejoice that when his glory shall be revealed, you may also be glad with exceeding joy. If you be reproached for the name of Christ, you shall be blessed: for that which is of the honour, glory, and power of God, and that which is his Spirit, resteth upon you.'},
    romans:{ref:'Romans 5:20-21',text:'Now the law entered in, that sin might abound. And where sin abounded, grace did more abound. That as sin hath reigned to death; so also grace might reign by justice unto life everlasting, through Jesus Christ our Lord.'}
  };
  for(const reading of Object.values(readings))Object.freeze(Object.assign(reading,{translation:'Douay-Rheims',rights:'public-domain'}));
  function properReading(L,date,which,options={},first=false){
    if(which!=='V')return null;
    const day=L.roman(date,options);
    if(/Nativity of the Lord \(Christmas\)/.test(day.title))return first?readings.galatians:readings.john;
    if(/Mary, the Holy Mother of God/.test(day.title))return readings.galatians;
    if(/Holy Family of Jesus/.test(day.title))return first?readings.corinthians:readings.philippians;
    if(/Epiphany of the Lord/.test(day.title))return first?readings.timothy:readings.titus;
    if(/Baptism of the Lord/.test(day.title))return readings.acts;
    if(!first&&/Immaculate Conception of the Blessed Virgin Mary/.test(day.title))return readings.romans;
    if(day.rank==='Memorial'&&/^Saint Josaphat,/.test(day.title))return readings.peter;
    return null;
  }
  // Public-domain clause excerpts following the First Edition canticle's
  // biblical selection. These are not the copyrighted ICEL/NAB wording.
  const canticles={
    'Revelation 11:17-18|Revelation 12:10-12':{
      ref:'Revelation 11:17–18; 12:10b–12a',translation:'Douay-Rheims',rights:'public-domain',
      paragraphs:[
        'We give thee thanks, O Lord God Almighty, who art, and who wast: because thou hast taken to thee thy great power, and thou hast reigned.',
        'And the nations were angry, and thy wrath is come, and the time of the dead, that they should be judged, and that thou shouldest render reward to thy servants the prophets and the saints, and to them that fear thy name, little and great.',
        'Now is come salvation, and strength, and the kingdom of our God, and the power of his Christ: because the accuser of our brethren is cast forth, who accused them before our God day and night.',
        'And they overcame him by the blood of the Lamb, and by the word of the testimony, and they loved not their lives unto death.',
        'Therefore rejoice, O heavens, and you that dwell therein.'
      ]
    },
    'Revelation 19:1-7':{
      ref:'See Revelation 19:1–7',translation:'Douay-Rheims',rights:'public-domain',
      paragraphs:[
        'Alleluia.\nSalvation, and glory, and power is to our God.\nFor true and just are his judgments.\nAlleluia.',
        'Alleluia.\nGive praise to our God, all ye his servants; and you that fear him, little and great.\nAlleluia.',
        'Alleluia.\nFor the Lord our God the Almighty hath reigned.\nLet us be glad and rejoice, and give glory to him.\nAlleluia.',
        'Alleluia.\nFor the marriage of the Lamb is come, and his wife hath prepared herself.\nAlleluia.'
      ]
    }
  };
  for(const text of Object.values(canticles)){Object.freeze(text.paragraphs);Object.freeze(text);}
  function canticleText(refs){return canticles[refs]||null;}
  return {reference,psalterWeek,evening,night,properPsalmody,properReading,canticleText};
});
