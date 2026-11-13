/* Reproducible section-availability audit, not certification of an entire Office. */
const L=require('../calendar.js'),H=require('../hours.js'),R=require('../roman-office-texts.js'),SR=require('../roman-short-readings.js'),RO=require('../roman-office.js');
L.setData(require('../data.js'));
function audit(options){
const totals={offices:0,proper:0,psalter:0,antiphons:0,responsory:0,gospelAntiphon:0,intercessions:0,collect:0,appointedShortReading:0};
const missing=new Set(),psalmody=new Set(),gospel=new Set(),unresolved=[];
for(let d=L.D(2026,11,12);d<=L.D(2027,6,30);d=L.add(d,1))for(const which of ['L','V']){
  const p=H.modernPsalmody(L,d,which,options),id=R.properId(L,p.d,which,options,p.first);
  const raw=R.record(id),r=R.select(L,p.d,which,options,p);
  totals.offices++;
  if(RO.properReading(L,p.d,which,options,p.first)||SR.records[r?.readingRef])totals.appointedShortReading++;
  if(r?.proper)totals.proper++;else if(r)totals.psalter++;
  for(const key of ['antiphons','responsory','gospelAntiphon','intercessions','collect'])if(r?.[key])totals[key]++;
  if(id&&!raw)missing.add(id);
  if(raw?.antiphons&&!r?.antiphons)psalmody.add(id);
  if(raw?.gospelAntiphon&&!r?.gospelAntiphon)gospel.add(id);
  if(!r)unresolved.push({date:L.iso(d),hour:which,observance:L.roman(p.d,options).title,id});
}
return {from:'2026-11-12',through:'2027-06-30',calendarData:'data.js including imported saints, with official rank corrections',options,totals,
  missingSourceIds:[...missing].sort(),withheldPsalmodyIds:[...psalmody].sort(),
  withheldGospelAntiphonIds:[...gospel].sort(),unresolvedOffices:unresolved};
}
const report=audit({epiphany:'sunday',ascension:'sunday',corpus:'sunday'});
report.transferOptions=[];
for(const epiphany of ['sunday','fixed'])for(const ascension of ['sunday','thursday'])for(const corpus of ['sunday','thursday']){
 const a=audit({epiphany,ascension,corpus});report.transferOptions.push({options:a.options,totals:a.totals,missingSourceIds:a.missingSourceIds,withheldPsalmodyIds:a.withheldPsalmodyIds,withheldGospelAntiphonIds:a.withheldGospelAntiphonIds,unresolvedOffices:a.unresolvedOffices});
}
console.log(JSON.stringify(report,null,2));
