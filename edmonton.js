/* Edmonton dated facts, with an explicit New Westminster fixed-Menaion fallback. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('./edmonton-2026.js'));
  else root.Edmonton=factory(root.EDMONTON_2026);
})(typeof self!=='undefined'?self:this,function(data){
  const iso=d=>typeof d==='string'?d:d.toISOString().slice(0,10);
  const entry=d=>data.days[iso(d)]||null;
  const displayTitle=s=>s.replace(/;?\s*(?:Octoechos\s+)?Tone\s+[1-8]\s*;?/gi,';').replace(/;\s*;/g,';').replace(/;\s*$/,'').trim();
  const rankFor=(e,d,fallback)=>/Feast of the (Lord|Mother of God)/i.test(e.rank)?'Great Feast':e.rank||(/Holy Week/.test(fallback.rank)?fallback.rank:d.getUTCDay()===0?'Sunday':'Commemoration');
  function read(d){
    const day=entry(d);if(!day)return null;
    return {sets:day.references.length?[{t:displayTitle(day.title),r:day.references.map(pair=>pair.slice())}]:[],notes:[day.references.length?'Reading references from the Ukrainian Catholic Eparchy of Edmonton’s dated page.':'Edmonton has not supplied usable reading references for this date. Consult its source page.']};
  }
  function calendar(d,fallback){
    const date=iso(d),e=entry(date),fixed=data.fixed[date.slice(5)];
    if(!e){
      const temporal=/Sunday|Great Feast|Holy Week|Holy Day|Vigil/.test(fallback.rank);
      const title=!temporal&&fixed?fixed.title:fallback.title;
      const also=temporal&&fixed&&!fallback.title.includes(fixed.title)?[{title:fixed.title,rank:'Fixed Menaion'}]:[];
      return {...fallback,title,also,fast:'',rank:temporal?fallback.rank:fixed?({'🕀':'Great Feast','🕁':'Vigil Feast','🕂':'Polyeleos Feast','🕃':'Saint with Six Stichera'}[fixed.symbol]||'Commemoration'):fallback.rank,
        sourceKind:'menaion-calculated',sourceUrl:data.menaionSource,
        fastingNote:'No verified Edmonton daily entry is bundled for this date. Fixed commemorations follow New Westminster; the seasonal cycle is calculated. Check your own eparchy for fasting obligations.',
        sourceNote:data.withheld[date]?'Edmonton’s entry was withheld because of a source date conflict.':'Edmonton has no verified daily entry bundled for this date.'};
    }
    const rubric=e.rubric||'';
    let fast='';
    if(/abstention from meat|abstinence from meat/i.test(rubric))fast='Abstinence from meat — Edmonton guidance';
    if(/strict fast|strict abstinence/i.test(rubric))fast='Strict fast — Edmonton guidance';
    let fastSeason=fallback.fastSeason;
    if(/Nativity Fast/i.test(rubric))fastSeason='Nativity Fast (Philip’s Fast)';
    else if(/Dormition Fast/i.test(rubric))fastSeason='Dormition Fast';
    else if(/Apostle[’']?s?[’']? Fast/i.test(rubric))fastSeason='Apostles’ Fast';
    else if(/Great Fast/i.test(rubric))fastSeason='Great Fast';
    return {...fallback,title:displayTitle(e.title),rank:rankFor(e,d,fallback),tone:e.tone,also:[],fast,fastSeason,
      sourceKind:'edmonton',sourceUrl:e.source,sourceNote:'Ukrainian Catholic Eparchy of Edmonton · dated calendar.',
      fastingNote:'Edmonton’s calendar describes Canadian practice. For binding U.S. obligations, follow your own eparchy’s directions and personal exemptions.',
      canadianObligation:/Holy Day of obligation/i.test(rubric)};
  }
  return {entry,read,calendar,source:data};
});
