/* First Edition Roman Office prayer texts. ICEL / ICET rights are separate
 * from Ora's code. Published permissions and source inventory: docs/roman-office-text-permissions.md. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('./roman-office-texts-data.js'));
  else root.RomanOfficeTexts=factory(root.RomanOfficeTextsData);
})(typeof globalThis!=='undefined'?globalThis:this,function(data){
  'use strict';
  const ordinary=Object.freeze({
    opening:'God, come to my assistance.\n— Lord, make haste to help me.',
    gloria:'Glory to the Father, and to the Son, and to the Holy Spirit:\n— as it was in the beginning, is now, and will be for ever. Amen.',
    ourFather:'Our Father who art in heaven,\nhallowed be thy name.\nThy kingdom come.\nThy will be done on earth,\nas it is in heaven.\nGive us this day our daily bread,\nand forgive us our trespasses,\nas we forgive those who trespass against us,\nand lead us not into temptation,\nbut deliver us from evil.',
    dismissal:'May the Lord bless us,\nprotect us from all evil and bring us to everlasting life.\n— Amen.',
    nightBlessing:'May the all-powerful Lord grant us a restful night and a peaceful death.\n— Amen.',
    benedictus:'Blessed be the Lord, the God of Israel;\nhe has come to his people and set them free.\nHe has raised up for us a mighty savior,\nborn of the house of his servant David.\nThrough his holy prophets he promised of old\nthat he would save us from our enemies,\nfrom the hands of all who hate us.\nHe promised to show mercy to our fathers\nand to remember his holy covenant.\n\nThis was the oath he swore to our father Abraham:\nto set us free from the hands of our enemies,\nfree to worship him without fear,\nholy and righteous in his sight all the days of our life.\nYou, my child, shall be called the prophet of the Most High;\nfor you will go before the Lord to prepare his way,\nto give his people knowledge of salvation\nby the forgiveness of their sins.\n\nIn the tender compassion of our God\nthe dawn from on high shall break upon us,\nto shine on those who dwell in darkness and the shadow of death,\nand to guide our feet into the way of peace.',
    magnificat:'My soul proclaims the greatness of the Lord,\nmy spirit rejoices in God my Savior\nfor he has looked with favor on his lowly servant.\nFrom this day all generations will call me blessed:\nthe Almighty has done great things for me,\nand holy is his Name.\n\nHe has mercy on those who fear him\nin every generation.\n\nHe has shown the strength of his arm,\nhe has scattered the proud in their conceit.\n\nHe has cast down the mighty from their thrones,\nand has lifted up the lowly.\n\nHe has filled the hungry with good things,\nand the rich he has sent away empty.\nHe has come to the help of his servant Israel\nfor he has remembered his promise of mercy,\nthe promise he made to our fathers,\nto Abraham and his children for ever.',
    nuncDimittis:'Lord, now you let your servant go in peace;\nyour word has been fulfilled:\n\nmy own eyes have seen the salvation\nwhich you have prepared in the sight of every people:\n\na light to reveal you to the nations\nand the glory of your people Israel.'
  });
  const days=['sun','mon','tue','wed','thu','fri','sat'];
  const record=id=>data.records[id]||null;
  function psalter(week,day,which,first=false){
    const hour=which==='L'?'mp':first?'ep1':day===0?'ep2':'ep';
    const sunday=first||day===0;
    return record(`ord-w${String(sunday?week+4:week).padStart(2,'0')}-${sunday?'sun':days[day]}-${hour}`);
  }
  function select(L,date,which,options,plan){
    const day=L.roman(date,options),base=psalter(plan.pw,plan.dow,which,plan.first);
    const id=properId(L,date,which,options,plan.first);
    const proper=record(id);
    if(proper){
      const selected={...proper,proper:true,id};
      if(day.rank==='Memorial'&&!(which==='L'&&/^Saint Agnes,/.test(day.title))){
        selected.antiphons=base?.antiphons;selected.psalmPrayers=base?.psalmPrayers;
        selected.psalmodyRefs=base?.psalmodyRefs;
      }
      // The current US English First Edition has one proper Gospel antiphon
      // per hour, used in all three lectionary years. A/B/C alternatives are
      // an addition to the forthcoming English Second Edition (USCCB, 2015).
      if(selected.psalmodyRefs&&!matchesPsalmody(selected.psalmodyRefs,plan.items)){
        delete selected.antiphons;delete selected.psalmPrayers;
      }
      return selected;
    }
    if(!base)return null;
    // Psalter responsories/intercessions are appointed in Ordinary Time.
    // Sunday Gospel antiphons and collects belong to the particular Sunday,
    // not to the four-week psalter, so never recycle Week V's proper here.
    if(day.season==='Ordinary Time'){
      const selected={...base,id:base.source.split('/').filter(Boolean).at(-1)};
      if(plan.first||plan.dow===0||!day.temporal||day.rank==='Memorial'){delete selected.collect;delete selected.gospelAntiphon;}
      if(plan.festiveMorning||/^(?:Solemnity|Feast(?: of the Lord)?)$/.test(day.rank))return null;
      return selected;
    }
    // Before December 17 and on Lenten weekdays the psalmody is from the
    // weekday psalter. Proper antiphons at other seasons must be sourced.
    if(day.temporal&&plan.dow!==0&&!plan.first&&
      ((day.season==='Advent'&&(date.getUTCMonth()===10||date.getUTCDate()<17))||day.season==='Lent'))
      return {antiphons:base.antiphons,psalmPrayers:base.psalmPrayers,source:base.source};
    return null;
  }
  function matchesPsalmody(refs,items){
    if(refs.length!==items.length)return false;
    const normalize=s=>s.toLowerCase().replace(/canticle|see|[–—·:-]/g,'').replace(/\s/g,'');
    return items.every((item,i)=>{
      if(item[0]==='p'){
        const n=+item.match(/^p(\d+)/)[1];
        const modern=n===113?(/113\(1-8\)/.test(item)?114:115):n===114||n===115?116:n===146||n===147?147:((n>=10&&n<=112)||(n>=116&&n<=145))?n+1:n;
        return refs[i]===`Psalm ${modern}`;
      }
      const expected=item==='c210'||item==='c220'?'Daniel 3':item==='c211'?'1 Chronicles 29':item.slice(2).split('|')[0];
      const prefix=expected.replace(/^Canticle · /,'').match(/^(?:[123] )?[A-Za-z]+ \d+/)?.[0];
      const actual=(refs[i]||'').replace(/^Canticle\s*(?:[–—·:-]\s*)?(?:See\s+)?/i,'').match(/^(?:[123] )?[A-Za-z]+ \d+/)?.[0];
      return !!prefix&&!!actual&&normalize(prefix)===normalize(actual);
    });
  }
  // Resolve the publisher's actual source IDs, which are not uniform date slugs.
  const properSources=Object.freeze({
    '0319-mp-joseph':'lent-0319-mp',
    '0503-mp':'0503-philip-and-james-mp',
    '0624-ep1':'0624-ep1-nativity-of-john-baptist',
    '0629-mp':'0629-mp-peter-and-paul',
    '0629-ep1':'0629-ep1-peter-and-paul',
    '0629-ep2':'0629-ep2-peter-and-paul',
    'ascension-thursday-mp':'morning-prayer-ascension-thursday',
    '1217-adv-w03-thu-ep':'1217-adv-w03-thu-ep2',
    '1223-adv-w04-wed-ep':'1223-w04-wed-ep'
  });
  function properId(L,date,which,options={},first=false){
    const id=rawProperId(L,date,which,options,first);
    if(/^0514-(?:mp|ep2)$/.test(id)&&L.roman(date,options).season==='Easter Time')return 'easter-'+id;
    return properSources[id]||id;
  }
  function rawProperId(L,date,which,options={},first=false){
    const day=L.roman(date,options),hour=which==='L'?'mp':first?'ep1':date.getUTCDay()===0?'ep2':'ep';
    const md=L.iso(date).slice(5).replace('-','');
    const feastHour=which==='L'?'mp':first?'ep1':'ep2';
    const named=[
      [/Nativity of the Lord \(Christmas\)/,'1225'],[/Holy Family of Jesus/,'holy-family'],
      [/Epiphany of the Lord/,'xmas-epiphany'],[/Baptism of the Lord/,'xmas-baptism-of-the-lord'],
      [/Pentecost Sunday/,'easter-pentecost'],[/Most Holy Trinity/,'ord-trinity-sunday'],
      [/Body and Blood of Christ/,'ord-corpus-christi'],[/Most Sacred Heart/,'ord-sacred-heart'],
      [/King of the Universe/,'ord-w34-sun']
    ].find(([re])=>re.test(day.title));
    if(named)return named[1]+'-'+feastHour;
    if(/Ascension of the Lord/.test(day.title))return which==='L'?'ascension-thursday-mp':first?'ascension-thursday-ep1':'evening-prayer-2-ascension-thursday';
    if(/Mary, the Holy Mother of God/.test(day.title))return which==='L'?'0101-mp':first?'0101-ep1':'xmas-0101-ep2';
    if(/Saint Joseph, Spouse/.test(day.title))return which==='L'?'0319-mp-joseph':first?'lent-0319-ep1':'0319-ep2-joseph';
    if(/Annunciation of the Lord/.test(day.title))return which==='L'?'0325-mp-annunciation':first?'sol-annunciation-ep1':'0325-ep2-annunciation';
    if(!day.temporal){
      const fixed=[[/Annunciation of the Lord/,'0325'],[/Saint Joseph, Spouse/,'0319']].find(([re])=>re.test(day.title));
      return (fixed?fixed[1]:md)+'-'+(which==='L'?'mp':first?'ep1':'ep2');
    }
    const diff=Math.round((date-L.westernEaster(date.getUTCFullYear()))/864e5);
    if(day.season==='Advent'){
      const week=Math.floor((date-L.advent(date.getUTCFullYear()))/6048e5)+1;
      return `${date.getUTCMonth()===11&&date.getUTCDate()>=17?md+'-':''}adv-w0${week}-${days[date.getUTCDay()]}-${hour}`;
    }
    if(day.season==='Christmas Time'){
      if(/^12(?:29|30|31)$/.test(md)){
        if(md==='1230')return `xmas-sixth-day-in-the-octave-${which==='L'?'mp':'ep'}`;
        return md+'-'+(which==='L'?'mp':'ep2');
      }
      // These weekday propers follow the observed Epiphany, including the US
      // Sunday transfer. A January date alone does not establish that context.
      let epiphany=L.D(date.getUTCFullYear(),1,6);
      if(options.epiphany==='sunday'){
        const jan2=L.D(date.getUTCFullYear(),1,2);epiphany=L.add(jan2,(7-jan2.getUTCDay())%7);
      }
      if(date>epiphany&&date.getUTCMonth()===0){
        const dow=days[date.getUTCDay()];
        const suffix=which==='L'?'mp':['wed','fri'].includes(dow)?'ep2':'ep';
        return `xmas-after-epiphany-${dow}-${suffix}`;
      }
    }
    if(day.season==='Lent')return diff < -42 ? `lent-w00-${days[date.getUTCDay()]}-${hour}`
      :`lent-w0${Math.floor((diff+42)/7)+1}-${days[date.getUTCDay()]}-${hour}`;
    if(['Holy Week','Paschal Triduum'].includes(day.season))return `lent-hw-${days[date.getUTCDay()]}-${hour}`;
    if(day.season==='Easter Time')return `easter-w0${Math.floor(diff/7)+1}-${days[date.getUTCDay()]}-${hour}`;
    if(day.season==='Ordinary Time'&&date.getUTCDay()===0){
      const week=day.title.match(/^(\d+)(?:st|nd|rd|th) Sunday/);
      return week?`ord-w${week[1].padStart(2,'0')}-sun-${hour}`:'';
    }
    return '';
  }
  function night(plan){
    const ids=['ord-sun-np2-w1-w3','ord-mon-np-w1-w3','ord-tue-np-w1-w3','ord-wed-np-w1-w3','ord-thu-np-w1-w3','ord-fri-np-w1-w3','sun-np1'];
    const base=record(ids[plan.index]);
    const special=plan.sunday?null:plan.kind==='solemnity-i'?record('ord-solemnities-not-on-sunday-np1')
      :plan.kind==='solemnity-ii'?record('ord-sol-np2'):null;
    const easter=plan.easter?record('easter-sun-np2'):null;
    return {...base,...(special?{collect:special.collect,source:special.source}:{}),
      ...(easter?{responsory:easter.responsory,gospelAntiphon:easter.gospelAntiphon}:{}),
      ...(plan.easter?{antiphons:base.antiphons.map(()=>'Alleluia, alleluia, alleluia.')}:{}),
      ...(plan.octave?{responsory:'This is the day the Lord has made;\nlet us rejoice and be glad, alleluia.'}:{})};
  }
  const esc=t=>String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function html(text){return String(text||'').split(/\n\s*\n/).map(p=>'<p>'+p.split('\n').map(line=>/^—/.test(line)?'<span class="roman-response">'+esc(line)+'</span>':esc(line)).join('<br>')+'</p>').join('');}
  function acknowledgment(){return '<p class="muted roman-office-credit" style="font-size:.7rem;line-height:1.45;margin-top:1.5rem">The English translation of The Liturgy of the Hours (Four Volumes) © 1974, International Commission on English in the Liturgy Corporation. All rights reserved.<br>English translations of the Benedictus, Magnificat, Nunc Dimittis and Gloria Patri © 1998, International Consultation on English Texts (ICET), and used by permission. www.englishtexts.org</p>';}
  return {ordinary,record,psalter,select,properId,night,html,acknowledgment,metadata:data.metadata};
});
