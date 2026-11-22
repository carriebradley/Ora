/* Ora's visual feast colours, separate from the source calendar's vestment data. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.LiturgicalColors=factory();
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const blue='#3b729f';
  function marian(day){
    const title=String(day?.title||'');
    if(/^(?:saint|st\.) joseph\b|^(?:saints|sts\.) joachim and ann[ae]\b/i.test(title))return false;
    return /\b(?:theotokos|mother of god|our lady|our blessed lady|blessed virgin|ever[- ]virgin|virgin mary|immaculate (?:heart|conception)|holy name of mary|queenship of mary|mary,? (?:the )?(?:holy )?mother|saint mary major)\b/i.test(title)
      || /\b(?:annunciation|assumption)\b/i.test(title)
      || /\b(?:nativity|visitation|presentation|purification|conception) of (?:the )?mary\b/i.test(title)
      || /\bmaternity of (?:saint )?ann[ae]?\b/i.test(title)
      || /^\s*(?:the )?dormition\s*$/i.test(title)
      || /\bconception of (?:the )?(?:(?:holy|saint|st\.?|righteous)\s+)*ann[ae]\b/i.test(title);
  }
  const display=day=>marian(day)?'blue':day?.color;
  // A Sunday may belong to a fasting season, but is not an individual fast day.
  // Read the calendar's UTC date rather than the viewer's timezone.
  function sunday(day){
    const date=String(day?.date||'');
    return /^\d{4}-\d{2}-\d{2}$/.test(date)&&new Date(date+'T00:00:00Z').getUTCDay()===0;
  }
  // A negative fasting statement is guidance, not a positive fast marker.
  // Share this check across Today badges, Calendar chips and season colours.
  function fastFree(fast){
    return /^(?:no\s+fast(?:ing)?|fast[- ]free|fast(?:ing)?\s+(?:is\s+)?lifted)\b/i.test(String(fast||'').trim());
  }
  // Display fasting periods consistently without changing a calendar's
  // source colour or implying that every date is a day of abstinence.
  function fasting(day,rite,fast=day?.fast){
    if(sunday(day))return false;
    const label=String(fast||'').trim();
    // A separately recorded fasting season remains purple even on a feast
    // whose individual fasting rule is lifted.
    return !!((label&&!fastFree(label))||day?.fastSeason||
      (rite==='sarum'&&day?.historicalObservance?.name==="St. Martin's Lent")||
      /^(?:Lent|Passiontide)$/i.test(day?.season||''));
  }
  // Indicate discipline separately from the feast or commemoration colour.
  // "Traditional" abstinence describes a practice, not a blanket legal obligation.
  function discipline(day,rite){
    if(sunday(day))return null;
    const label=String(day?.fast||'').trim();
    if(label&&!fastFree(label)){
      const traditional=/^traditional\b/i.test(label);
      const abstinence=/abstinen|no meat|without meat/i.test(label)&&!/\bfast\b|\bstrict\b/i.test(label);
      return {kind:traditional?'traditional':abstinence?'abstinence':'fast',
        short:traditional?'Trad. abstinence':abstinence?'Abstinence':'Fast',
        label:traditional?'Traditional abstinence (local practice; feast allowances may apply)':abstinence?'Abstinence guidance: '+label:'Fasting guidance: '+label};
    }
    const season=String(day?.fastSeason||'').trim()||
      (rite==='sarum'&&day?.historicalObservance?.name==="St. Martin's Lent"?"St. Martin's Lent":'')||
      (/^(?:Lent|Passiontide)$/i.test(day?.season||'')?day.season:'');
    return season?{kind:'season',short:'Fasting season',label:'Fasting season: '+season}:null;
  }
  const easterSeason=day=>/^(?:Easter Time|Eastertide|Paschaltide)$/i.test(String(day?.season||''));
  // A season guides daily prayer even when a saint's vestment differs.
  // Seasonal fasts include Sundays without making them individual fast days.
  function season(day,rite){
    const name=String(day?.season||'').trim(),title=String(day?.title||'');
    const fastSeason=String(day?.fastSeason||'').trim();
    if(rite!=='byz'&&/\b(?:Gaudete|Laetare) Sunday\b/i.test(title))
      return {color:'rose',label:name||'Joyful Sunday'};
    if(rite==='sarum'&&day?.historicalObservance?.name==="St. Martin's Lent")
      return {color:'v',label:"St. Martin's Lent"};
    if(rite==='byz'&&fastSeason)return {color:'v',label:fastSeason};
    // Easter/Pascha gold is a dedicated seasonal accent, distinct from yellow vestments.
    if(/^(?:Easter Time|Eastertide|Paschaltide|Pentecostarion)$/i.test(name))
      return {color:'gold',label:name};
    if(/^Whitsuntide$/i.test(name))return {color:'r',label:name};
    if(/Advent|Lent|Passiontide|Holy Week|Triodion|Pre-Lent|Triduum/i.test(name))
      return {color:'v',label:name};
    if(/Christmas|Christmastide|Nativity season/i.test(name))
      return {color:'w',label:name};
    const md=String(day?.date||'').slice(5);
    if(rite==='byz'&&(md>='12-25'||(md>='01-01'&&md<='01-06')))
      return {color:'w',label:'Nativity and Theophany'};
    return {color:'g',label:name||'Ordinary season'};
  }
  // Inner color is the source vestment; outer color is the season.
  // Yellow vestments and seasonal Easter gold use distinct palette shades.
  function pair(day,category){
    const vestment=day?.color||'w', outer=category||vestment;
    return {vestment,category:outer,dual:vestment!==outer};
  }
  return {blue,marian,display,fasting,fastFree,sunday,discipline,easterSeason,season,pair};
});
