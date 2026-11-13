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
    if(proper)return {...proper,proper:true,id};
    if(!base)return null;
    // Psalter responsories/intercessions are appointed in Ordinary Time.
    // Sunday Gospel antiphons and collects belong to the particular Sunday,
    // not to the four-week psalter, so never recycle Week V's proper here.
    if(day.season==='Ordinary Time'){
      const selected={...base,id:base.source.split('/').filter(Boolean).at(-1)};
      if(plan.first||plan.dow===0||!day.temporal){delete selected.collect;delete selected.gospelAntiphon;}
      if(plan.festiveMorning||/^(?:Solemnity|Feast(?: of the Lord)?)$/.test(day.rank))return null;
      return selected;
    }
    // Before December 17 and on Lenten weekdays the psalmody is from the
    // weekday psalter. Proper antiphons at other seasons must be sourced.
    if(day.temporal&&plan.dow!==0&&!plan.first&&
      ((day.season==='Advent'&&date.getUTCDate()<17)||day.season==='Lent'))
      return {antiphons:base.antiphons,psalmPrayers:base.psalmPrayers,source:base.source};
    return null;
  }
  function properId(L,date,which,options={},first=false){
    const day=L.roman(date,options),hour=which==='L'?'mp':first?'ep1':date.getUTCDay()===0?'ep2':'ep';
    const md=L.iso(date).slice(5).replace('-','');
    if(!day.temporal){
      const fixed=[[/Annunciation of the Lord/,'0325'],[/Saint Joseph, Spouse/,'0319']].find(([re])=>re.test(day.title));
      return (fixed?fixed[1]:md)+'-'+(which==='L'?'mp':first?'ep1':'ep2');
    }
    const diff=Math.round((date-L.westernEaster(date.getUTCFullYear()))/864e5);
    if(day.season==='Advent'){
      const week=Math.floor((date-L.advent(date.getUTCFullYear()))/6048e5)+1;
      return `${date.getUTCMonth()===11&&date.getUTCDate()>=17?md+'-':''}adv-w0${week}-${days[date.getUTCDay()]}-${hour}`;
    }
    if(day.season==='Lent')return diff < -42 ? `lent-0${days[date.getUTCDay()]}-${hour}`
      :`lent-w0${Math.floor((diff+42)/7)+1}-${days[date.getUTCDay()]}-${hour}`;
    if(['Holy Week','Paschal Triduum'].includes(day.season))return `lent-hw-${days[date.getUTCDay()]}-${hour}`;
    if(day.season==='Easter Time')return diff<7?`easter-${days[date.getUTCDay()]}-${hour}`
      :`easter-w0${Math.floor(diff/7)+1}-${days[date.getUTCDay()]}-${hour}`;
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
