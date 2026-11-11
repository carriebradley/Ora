/* Service selection for the Pittsburgh 2026 calendar and MCI service rules, Gregorian Pascha.
 * Rules and limits: docs/LITURGICAL-TEXT-READER.md. Not a parish timetable. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.LiturgySchedule=factory();})(typeof self!=='undefined'?self:this,function(){
  const basil=new Set(['2026-01-01','2026-01-05','2026-02-22','2026-03-01','2026-03-08','2026-03-15','2026-03-22','2026-04-02','2026-04-04','2026-12-24']);
  const names={chrysostom:'Divine Liturgy of St. John Chrysostom',basil:'Divine Liturgy of St. Basil the Great',presanctified:'Liturgy of the Presanctified Gifts',none:'No Divine Liturgy prescribed',unknown:'Divine Liturgy · calendar unavailable'};
  function service(iso){
    if(iso instanceof Date)iso=iso.toISOString().slice(0,10);
    const date=typeof iso==='string'&&/^2026-\d\d-\d\d$/.test(iso)?new Date(iso+'T12:00:00Z'):null;
    let id='unknown',note='A verified service calendar for this year has not been added.';
    if(date&&!isNaN(date)&&date.toISOString().slice(0,10)===iso){
      const w=date.getUTCDay();id='chrysostom';note='Usual Divine Liturgy for this date.';
      if(basil.has(iso)){id='basil';note='St. Basil’s Liturgy is appointed for this date.';}
      else if(iso==='2026-04-03'){id='none';note='Great and Holy Friday: no Eucharistic Divine Liturgy.';}
      else if(iso>='2026-03-30'&&iso<='2026-04-01'){id='presanctified';note='The first three days of Holy Week use the Presanctified Gifts.';}
      else if(iso>='2026-02-16'&&iso<='2026-03-27'&&w!==0&&w!==6&&iso!=='2026-03-25'){
        id=[3,5].includes(w)?'presanctified':'none';
        note=id==='presanctified'?'Usual Wednesday or Friday service of the Great Fast.':'Lenten weekday: no Eucharistic Divine Liturgy. Presanctified services may be celebrated according to parish directions.';
        if(['2026-02-24','2026-03-09','2026-03-19'].includes(iso)){id='presanctified';note=iso==='2026-03-19'?'Thursday of the Great Canon: Presanctified Gifts; consult parish directions.':'Presanctified Gifts for this Lenten feast, as listed in the MCI 2026 calendar.';}
      }
      else if(iso==='2026-03-25')note='Annunciation: St. John Chrysostom, including when joined to Vespers.';
    }
    return {id,title:names[id],note};
  }
  return {service};
});
