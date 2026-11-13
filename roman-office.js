/* Roman Office date planning. Facts/rules only; no ICEL prayer translations.
 * Reference: current First Edition; GILH 88, 92, 133–137, 204–233;
 * Universal Norms 61; USCCB 2027 calendar. See the dated Office audit. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.RomanOffice=factory();
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const reference=Object.freeze({edition:'first',textStatus:'devotional-adaptation',scripture:'Douay-Rheims',authorizedStructuredSource:null});
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
    return {index,kind:solemnity?(context.first?'solemnity-i':'solemnity-ii'):sunday?(context.first?'sunday-i':'sunday-ii'):'weekday',observance:day.title,
      easter:day.season==='Easter Time',alleluia:!['Lent','Holy Week','Paschal Triduum'].includes(day.season),reference};
  }
  function properPsalmody(L,date,which,options={}){
    const day=L.roman(date,options),easter=L.westernEaster(date.getUTCFullYear()),offset=days(date,easter);
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
  return {reference,psalterWeek,evening,night,properPsalmody};
});
