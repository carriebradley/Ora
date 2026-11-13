/* Gregorian 2026 common service cycle. Ukrainian/Melkite appointments are
 * calculated, with explicit source conflicts; Ruthenian reference rules remain
 * separate. Sources and limits: docs/ORA-AUDIT-2026-11-12.md. Not a parish timetable. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./melkite.js'));else root.LiturgySchedule=factory(root.Melkite);})(typeof self!=='undefined'?self:this,function(Melkite){
  const basil=new Set(['2026-01-01','2026-01-05','2026-02-22','2026-03-01','2026-03-08','2026-03-15','2026-03-22','2026-04-02','2026-04-04','2026-12-24']);
  const names={chrysostom:'Divine Liturgy of St. John Chrysostom',basil:'Divine Liturgy of St. Basil the Great',presanctified:'Liturgy of the Presanctified Gifts',none:'No Divine Liturgy prescribed',unknown:'Divine Liturgy · calendar unavailable'};
  function service(iso,church='ukrainian'){
    if(!['ukrainian','melkite','ruthenian'].includes(church))return {id:'unknown',title:names.unknown,note:'No Byzantine service rules are configured for this tradition.',verification:'unavailable',source:''};
    if(iso instanceof Date)iso=Number.isNaN(iso.getTime())?'':iso.toISOString().slice(0,10);
    const date=typeof iso==='string'&&/^2026-\d\d-\d\d$/.test(iso)?new Date(iso+'T12:00:00Z'):null;
    let id='unknown',note='A verified service calendar for this year has not been added.';
    if(date&&!isNaN(date)&&date.toISOString().slice(0,10)===iso){
      const w=date.getUTCDay();id='chrysostom';note='Usual Divine Liturgy for this date.';
      if(['2026-02-11','2026-02-13'].includes(iso)){id='none';note='Wednesday or Friday of Cheesefare Week: no Divine Liturgy.';}
      else if(basil.has(iso)){id='basil';note='St. Basil’s Liturgy is appointed by the usual service cycle for this date.';}
      else if(iso==='2026-04-03'){id='none';note='Great and Holy Friday: no Eucharistic Divine Liturgy.';}
      else if(iso>='2026-03-30'&&iso<='2026-04-01'){id='presanctified';note='The first three days of Holy Week use the Presanctified Gifts.';}
      else if(iso>='2026-02-16'&&iso<='2026-03-27'&&w!==0&&w!==6&&iso!=='2026-03-25'){
        id=[3,5].includes(w)?'presanctified':'none';
        note=id==='presanctified'?'Usual Wednesday or Friday service of the Great Fast.':'Lenten weekday: no Eucharistic Divine Liturgy. Presanctified services may be celebrated according to parish directions.';
        if(['2026-02-24','2026-03-09','2026-03-19'].includes(iso)){id='presanctified';note=iso==='2026-03-19'?'Thursday of the Great Canon: Presanctified Gifts; consult parish directions.':'Presanctified Gifts for this Lenten feast; confirm local directions.';}
      }
      else if(iso==='2026-03-25')note='Annunciation: St. John Chrysostom, including when joined to Vespers.';
    }
    if(church!=='ruthenian'&&id!=='unknown')note+=' Calculated common Byzantine service cycle; local Ukrainian or Melkite directions and parish schedules must be checked.';
    let verification=id==='unknown'?'unavailable':church==='ruthenian'?'reference':'calculated';
    let title=names[id];
    if(church==='ukrainian'&&iso==='2026-12-24'){
      id='unknown';verification='source-conflict';title='Divine Liturgy · confirm Edmonton directions';
      note='Source conflict: the usual cycle calls for St. Basil, while Edmonton’s dated page says no Divine Liturgy. The service has not been selected automatically. Confirm the eparchy’s directions.';
    }
    if(church==='melkite'&&Melkite?.typicon(iso)){
      id=Melkite.typicon(iso).liturgy;title=names[id];verification='verified';
      note='Appointed in the November 2026 monthly typicon prepared by Rev. Protodeacon Saleem Naber, Christ the Savior Melkite Catholic Church, Yonkers. Parish service times vary.';
    }
    const source=church==='ukrainian'?'https://eeparchy.com/calendar/'+iso:church==='melkite'?'https://melkite.org/liturgical-resources':'https://mci.archpitt.org/LiturgicalCalendar2026.html';
    return {id,title,note,verification,source};
  }
  return {service};
});
