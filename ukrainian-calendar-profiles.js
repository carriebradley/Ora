/* Experimental 2026 Ukrainian Catholic calendar profiles.
 * Not loaded by Ora's UI until the profile settings, office, date-specific
 * readings, service books and propers have been verified together.
 * National UGCC 2026: NEW-STYLE Menaion, JULIAN Paschalion.
 * St. George Edmonton: OLD-STYLE Julian Menaion AND JULIAN Paschalion.
 * Never attach Edmonton's April 5 date-specific overlay to April 12 data. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('./calendar.js'),require('./byzlect.js'));
  else root.UkrainianCalendarProfiles=factory(root.LitCal,root.ByzLect);
})(typeof self!=='undefined'?self:this,function(L,ByzLect){
  'use strict';
  const NATIONAL='https://ugcc.ua/data/tserkovnyy-kalendar-ugkts-na-2026-rik-8059/';
  const PARISH='https://eeparchy.com/parishes/st-george-parish';
  const profiles=Object.freeze({
    'ugcc-national-new-style-2026':Object.freeze({
      id:'ugcc-national-new-style-2026',year:2026,
      label:'UGCC national 2026 · new-style fixed feasts and April 12 Pascha',
      status:'staged',pascha:'2026-04-12',
      fixedFeasts:'gregorian',paschalion:'julian',source:NATIONAL,
      description:'Source-checked Holy Week appointments; remaining date readings are calculated and unverified.'
    }),
    'st-george-julian-2026':Object.freeze({
      id:'st-george-julian-2026',year:2026,
      label:'St. George Edmonton 2026 · Julian fixed feasts and April 12 Pascha',
      status:'reference-only',pascha:'2026-04-12',
      fixedFeasts:'julian',paschalion:'julian',source:PARISH,
      description:'Parish uses the Julian calendar; a complete dated parish calendar is not bundled.'
    })
  });
  // These appointments and labels are explicit in the official UGCC
  // Patriarchal Liturgical Commission new-style calendar for 2026.
  // "unknown" on unlisted days means not independently source-appointed;
  // it must never invoke an Edmonton or Western-Pascha service fallback.
  const appointments=Object.freeze({
    '2026-03-25':Object.freeze({id:'chrysostom',title:'Vesperal Divine Liturgy of St. John Chrysostom',verification:'verified'}),
    '2026-04-04':Object.freeze({id:'chrysostom',title:'Divine Liturgy of St. John Chrysostom',verification:'verified'}),
    '2026-04-05':Object.freeze({id:'chrysostom',title:'Divine Liturgy of St. John Chrysostom',verification:'verified'}),
    '2026-04-06':Object.freeze({id:'presanctified',title:'Liturgy of the Presanctified Gifts',verification:'verified'}),
    '2026-04-07':Object.freeze({id:'presanctified',title:'Liturgy of the Presanctified Gifts',verification:'verified'}),
    '2026-04-08':Object.freeze({id:'presanctified',title:'Liturgy of the Presanctified Gifts',verification:'verified'}),
    '2026-04-09':Object.freeze({id:'basil',title:'Vesperal Divine Liturgy of St. Basil the Great',verification:'verified'}),
    '2026-04-10':Object.freeze({id:'unknown',title:'Royal Hours and Holy Friday services; Eucharistic appointment not inferred',verification:'unassigned'}),
    '2026-04-11':Object.freeze({id:'basil',title:'Vesperal Divine Liturgy of St. Basil the Great',verification:'verified'})
  });
  // Official UGCC readings shown independently of the calculated
  // Byzantine table. These are the liturgical Epistle/Gospel ONLY,
  // not an entire day's Matins, Royal Hours or Vespers readings.
  const checkedReferences=Object.freeze({
    '2026-04-05':Object.freeze([Object.freeze(['Epistle','Philippians 4:4-9']),Object.freeze(['Gospel','John 12:1-18'])]),
    '2026-04-09':Object.freeze([Object.freeze(['Epistle','1 Corinthians 11:23-32'])]),
    '2026-04-11':Object.freeze([Object.freeze(['Epistle','Romans 6:3-11']),Object.freeze(['Gospel','Matthew 28:1-20'])]),
    '2026-04-12':Object.freeze([Object.freeze(['Epistle','Acts 1:1-8']),Object.freeze(['Gospel','John 1:1-17'])])
  });
  const profile=id=>Object.hasOwn(profiles,id)?profiles[id]:null;
  const validISO=iso=>{
    if(typeof iso!=='string'||!/^2026-\d\d-\d\d$/.test(iso))return null;
    const d=new Date(iso+'T12:00:00Z');
    return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===iso?d:null;
  };
  function day(id,iso){
    const p=profile(id),d=validISO(iso);
    // Old-calendar parish cannot be derived from a national new-style
    // Menaion; its calendar is intentionally withheld pending a source.
    if(!p||p.status!=='staged'||!d)return null;
    const observance=L.byzantine(d,{...L.DEFAULTS,byzChurch:'ukrainian',
      byzSource:'computed',byzPascha:'julian',byzOldCal:false,byzAnna:'9'});
    const estimated=ByzLect.read(d,0,L.julianEaster,'ukrainian',9);
    const service=appointments[iso]||{id:'unknown',title:'Service appointment not independently verified',verification:'unassigned'};
    return {profileId:p.id,date:iso,pascha:observance.pascha,
      fixedFeasts:p.fixedFeasts,source:p.source,
      observance:{...observance,sourceKind:'national-cycle-calculated'},
      service:{...service,source:appointments[iso]?NATIONAL:null},
      calculatedReadings:{...estimated,verification:'calculated-not-appointed'},
      officialLiturgyReadings:checkedReferences[iso]?{
        references:checkedReferences[iso].map(pair=>pair.slice()),
        verification:iso==='2026-04-09'?'partial-source-check':'selected-epistle-gospel-source-checked',
        source:NATIONAL
      }:null,
      appointedHymns:null};
  }
  return Object.freeze({profile,day,profiles});
});
