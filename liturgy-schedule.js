/* Gregorian 2026 common service cycle. Ukrainian/Melkite appointments are
 * calculated, with explicit source conflicts; Ruthenian reference rules remain
 * separate. Sources and limits: docs/ORA-AUDIT-2026-11-12.md. Not a parish timetable. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./melkite.js'));else root.LiturgySchedule=factory(root.Melkite);})(typeof self!=='undefined'?self:this,function(Melkite){
  const basil=new Set(['2026-01-01','2026-01-05','2026-02-22','2026-03-01','2026-03-08','2026-03-15','2026-03-22','2026-04-02','2026-04-04','2026-12-24']);
  const names={chrysostom:'Divine Liturgy of St. John Chrysostom',basil:'Divine Liturgy of St. Basil the Great',presanctified:'Liturgy of the Presanctified Gifts',none:'No Divine Liturgy prescribed',unknown:'Divine Liturgy · calendar unavailable'};
  // Exact dates whose Newton monthly typikon names St. John Chrysostom.
  // Keep synchronized with the dated, source-checked annual hymn import.
  const monthlyChrysostomDates=Object.freeze([
    '2026-01-04',
    '2026-01-18',
    '2026-02-01',
    '2026-02-02',
    '2026-02-08',
    '2026-02-15',
    '2026-03-21',
    '2026-03-25',
    '2026-03-29',
    '2026-04-05',
    '2026-04-12',
    '2026-04-19',
    '2026-04-23',
    '2026-04-25',
    '2026-04-26',
    '2026-05-03',
    '2026-05-14',
    '2026-05-17',
    '2026-05-24',
    '2026-05-31',
    '2026-06-04',
    '2026-06-07',
    '2026-06-14',
    '2026-06-21',
    '2026-06-23',
    '2026-06-24',
    '2026-06-28',
    '2026-06-29',
    '2026-07-05',
    '2026-07-12',
    '2026-07-19',
    '2026-07-20',
    '2026-08-02',
    '2026-08-06',
    '2026-08-09',
    '2026-08-15',
    '2026-08-16',
    '2026-08-23',
    '2026-08-30',
    '2026-09-01',
    '2026-09-06',
    '2026-09-08',
    '2026-09-13',
    '2026-09-14',
    '2026-09-20',
    '2026-09-26',
    '2026-09-27',
    '2026-10-01',
    '2026-10-04',
    '2026-10-11',
    '2026-10-18',
    '2026-10-25',
    '2026-10-26',
    '2026-11-01',
    '2026-11-08',
    '2026-11-15',
    '2026-11-21',
    '2026-11-22',
    '2026-11-29',
    '2026-12-06',
    '2026-12-13',
    '2026-12-20',
    '2026-12-27'
  ]);
  const confirmedMonthlyDates=new Set(monthlyChrysostomDates);
  const monthNames=['January','February','March','April','May','June','July','August','September','October','November','December'];
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
    let detailSource='',detailSourceLabel='',sourceDiscrepancy='';
    // Great Wednesday's two statements in Edmonton are compatible:
    // no Eucharistic Divine Liturgy, but the Presanctified Gifts are
    // explicitly appointed for Wednesday evening. Not a guessed cycle.
    if(church==='ukrainian'&&iso==='2026-04-01'){
      id='presanctified';title=names[id];verification='verified';
      note='Edmonton appoints the Liturgy of the Presanctified Gifts on Great Wednesday evening. Its no-Divine-Liturgy note refers to a Eucharistic celebration, not the Presanctified service. Parish times may vary.';
    }
    // Edmonton's 2026 eparchial Easter program documents Vespers and
    // St. Basil at St. Josaphat Cathedral on Great Thursday and Saturday
    // of the April 5 Paschal cycle. Other eparchial parishes, notably
    // St. George, celebrated Pascha on April 12. This verifies only
    // the April 5 cycle's documented cathedral/parish appointments.
    if(church==='ukrainian'&&['2026-04-02','2026-04-04'].includes(iso)){
      id='basil';title='Vesperal Divine Liturgy of St. Basil the Great';
      verification='verified';
      note='The Edmonton Eparchy’s 2026 Easter program confirms Vespers with St. Basil at St. Josaphat Cathedral on '+(iso==='2026-04-02'?'Great Thursday':'Great Saturday')+' (April 5 Paschal cycle). Other parishes, including St. George, followed an April 12 Pascha. Parish times and local Holy Week dates may differ; no dated hymns are inferred.';
      detailSource='https://eeparchy.com/Easter%20Program%20.pdf';
      detailSourceLabel='Edmonton 2026 Easter services';
      sourceDiscrepancy='This service is documented for Edmonton parishes following April 5 Pascha, including St. Josaphat Cathedral. Some Edmonton parishes, including St. George, celebrated Pascha on April 12. Check the local parish’s Holy Week dates; variable prayers and readings have not been assigned here.';
    }
    if(church==='ukrainian'&&iso==='2026-12-24'){
      id='unknown';verification='source-conflict';title='Divine Liturgy · confirm Edmonton directions';
      note='Source conflict: Edmonton’s dated December 24 calendar says the Divine Liturgy is not served, whereas the UGCC Patriarchal Liturgical Commission’s official 2026 calendar appoints Vespers with the Divine Liturgy of St. Basil the Great. No service has been selected automatically; confirm the local eparchy’s directions.';
      sourceDiscrepancy='Edmonton says no Divine Liturgy on Christmas Eve; the UGCC 2026 national calendar appoints Vespers with St. Basil. Ora has not selected either service or assigned dated hymns. Confirm local directions.';
      detailSource='https://ugcc.ua/data/tserkovnyy-kalendar-ugkts-na-2026-rik-8059/';
      detailSourceLabel='UGCC 2026 service calendar';
    }
    if(church==='melkite'&&Melkite?.typicon(iso)){
      id=Melkite.typicon(iso).liturgy;title=names[id];verification='verified';
      note='Appointed in the November 2026 monthly typicon prepared by Rev. Protodeacon Saleem Naber, Christ the Savior Melkite Catholic Church, Yonkers. Parish service times vary.';
    }else if(church==='melkite'&&id==='chrysostom'&&confirmedMonthlyDates.has(iso)){
      verification='verified';
      note='St. John Chrysostom is identified in the Diocese of Newton’s '+monthNames[Number(iso.slice(5,7))-1]+' 2026 monthly typicon. Parish service times and local directions vary.';
    }
    // Newton's Holy Week services prescribe Vespers joined to St. Basil
    // for Great Thursday and Great Saturday, unlike an ordinary Basil
    // Liturgy. This verifies the form, not a local time or printed hymns.
    if(church==='melkite'&&['2026-04-02','2026-04-04'].includes(iso)){
      id='basil';title='Vesperal Divine Liturgy of St. Basil the Great';
      verification='verified';
      note='The Diocese of Newton appoints Vespers with the Divine Liturgy of St. Basil for '+(iso==='2026-04-02'?'Great and Holy Thursday':'Great and Holy Saturday')+'. Parish celebration times vary; no date-specific hymns are inferred.';
      detailSource='https://melkite.org/faith/sunday-scriptures/behold-the-bridegroom-is-coming';
      detailSourceLabel='Melkite Holy Week service order';
    }
    // Newton's Nativity service book appoints a Vesperal Basil Liturgy on
    // the 2026 Paramony (Christmas is Friday), but the December 2026
    // monthly typicon contains a conflicting Chrysostom heading. Preserve
    // the appointed Vesperal book without claiming the sources agree.
    // Newton's 2026 annual calendar confirms the Three Hierarchs on Friday
    // January 30. Its January monthly typicon prints Thursday instead.
    // This validates the feast, not the unreviewed dated hymn selection.
    if(church==='melkite'&&iso==='2026-01-30'){
      sourceDiscrepancy='The January monthly typicon labels January 30 as Thursday; in 2026 it falls on Friday. The Diocese of Newton annual calendar confirms the feast of the Three Holy Hierarchs and its readings, but the misdated typicon hymns remain withheld.';
      detailSource='https://melkite.org/wp-content/uploads/2025/12/January-2026.docx';
      detailSourceLabel='January typicon';
    }
    if(church==='melkite'&&iso==='2026-12-24'){
      id='basil';title='Vesperal Divine Liturgy of St. Basil the Great';
      verification='source-conflict';
      note='The Diocese of Newton appoints St. Basil with Vespers on December 24, with no morning Liturgy. The December 2026 monthly typicon also contains a conflicting Chrysostom heading; dated hymns remain withheld.';
      detailSource='https://melkite.org/wp-content/uploads/2016/09/The-Feast-of-the-Nativity-of-Our-Lord-God-and-Savior-Jesus-Christ.pdf';
    }
    const source=church==='ukrainian'?'https://eeparchy.com/calendar/'+iso:church==='melkite'?'https://melkite.org/liturgical-resources':'https://mci.archpitt.org/LiturgicalCalendar2026.html';
    return {id,title,note,verification,source,
      ...(detailSource?{detailSource,detailSourceLabel:detailSourceLabel||'Nativity service order'}:{}),
      ...(sourceDiscrepancy?{sourceDiscrepancy}:{})};
  }
  // Source coverage is limited to 2026 and to the specific church named.
  // The April 12 Ukrainian cycle is documented but not yet selectable:
  // its dates, readings, office and propers must move as one unit.
  const coverage2026=Object.freeze({
    ukrainian:Object.freeze({
      year:2026,church:'ukrainian',pascha:'2026-04-05',
      label:'Edmonton · April 5 Paschal cycle (St. Josaphat Cathedral)',
      source:'https://eeparchy.com/Easter%20Program%20.pdf',
      alternativePascha:'2026-04-12',
      alternativeLabel:'National UGCC: new-style fixed feasts and April 12 Pascha',
      alternativeSource:'https://ugcc.ua/data/tserkovnyy-kalendar-ugkts-na-2026-rik-8059/',
      julianParishLabel:'St. George, Edmonton: Julian fixed feasts and April 12 Pascha',
      julianParishSource:'https://eeparchy.com/parishes/st-george-parish'
    }),
    melkite:Object.freeze({
      year:2026,church:'melkite',pascha:'2026-04-05',
      label:'Melkite Diocese of Newton · April 5 Paschal cycle',
      source:'https://melkite.org/liturgical-resources'
    })
  });
  function paschalBasis(year,church='ukrainian'){
    return year===2026&&Object.hasOwn(coverage2026,church)?coverage2026[church]:null;
  }
  return {service,monthlyChrysostomDates,paschalBasis};
});
