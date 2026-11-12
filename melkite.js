/* Newton's dated calendar is authoritative for 2026 only. No prayer translations. */
(function(root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./melkite-2026.js'));
  else root.Melkite = factory(root.MELKITE_2026);
})(typeof self !== 'undefined' ? self : this, function(data) {
  const entry = date => data.days[typeof date === 'string' ? date : date.toISOString().slice(0,10)] || null;
  // The published PDF uses uppercase display typography; preserve raw data but
  // normalize commemorations at the import boundary for all app views.
  const titleCase = value => {
    const s = String(value || ''), letters = s.match(/[A-Za-z]/g) || [];
    if (letters.length < 5 || (s.match(/[A-Z]/g) || []).length / letters.length < .85) return s;
    const minor = new Set(['of','the','and','in','on','at','to','for','from','with','by']);
    return s.toLocaleLowerCase('en').replace(/\b[a-z]+(?:['’][a-z]+)?\b/g, (word, offset) =>
      offset && minor.has(word) ? word : word[0].toUpperCase() + word.slice(1)
    ).replace(/\b(Ii|Iii|Iv|Vi|Vii|Viii|Ix|Xi|Xii)\b/g, x => x.toUpperCase());
  };
  const books = {JN:'John',LK:'Luke',MK:'Mark',MT:'Matthew',COL:'Colossians',HEB:'Hebrews',TIM:'Timothy',COR:'Corinthians',ROM:'Romans',EPH:'Ephesians',PT:'Peter',JAS:'James',TI:'Titus',ACTS:'Acts',PHIL:'Philippians',THES:'Thessalonians',GAL:'Galatians',IS:'Isaiah',GEN:'Genesis',PROV:'Proverbs',JOEL:'Joel',ZECH:'Zechariah',JUDE:'Jude'};
  const reference = text => text.replace(/\b[A-Z]{2,5}\b/g, s => books[s] || s).replace(/\s*\(\d+\)/g,'');
  function read(date) {
    const e = entry(date); if (!e) return null;
    return {sets:[{t:titleCase(e.observance || e.saints || 'Daily Scripture readings'),r:e.references.map((r,i)=>[/\(\d+\)/.test(r) ? 'Orthros Gospel' : /^(MT|MK|LK|JN) /.test(r) ? 'Gospel' : /^(?:[123] )?(?:ACTS|ROM|COR|GAL|EPH|PHIL|COL|THES|TIM|TI|HEB|JAS|PT|JN|JUDE) /.test(r) ? 'Epistle' : 'Scripture reading '+(i+1),reference(r)])}],notes:[`Diocese of Newton · 2026 calendar · PDF page ${e.page}. References follow the printed calendar, including its unusual entries. Holy Week references are not a complete list of every service reading.`]};
  }
  function calendar(date, fallback) {
    const e = entry(date); if (!e) return {...fallback,title:'Melkite calendar unavailable',rank:'',season:'',tone:0,also:[],fast:'',fastSeason:'',fastingNote:'A verified Melkite calendar is unavailable for this year. Consult the Diocese of Newton’s annual calendar.'};
    const iso = date.toISOString().slice(0,10), md = iso.slice(5);
    let fastSeason = md >= '02-16' && md <= '03-27' ? 'Great Fast' : md >= '03-30' && md <= '04-04' ? 'Great and Holy Week' : md >= '06-01' && md <= '06-28' ? 'Apostles’ Fast' : md >= '08-01' && md <= '08-14' ? 'Theotokos’ Fast' : md >= '11-15' && md <= '12-24' ? 'Nativity Fast (Philip’s Fast)' : '';
    let fast = iso === '2026-02-16' || (md >= '04-02' && md <= '04-04') ? 'Fast — Newton Lenten discipline' : '';
    if (date.getUTCDay() === 5 && md >= '02-16' && md <= '04-03') fast += (fast ? '; ' : '') + 'abstinence from meat';
    // The diocesan minimum specifically requires Lenten Friday abstinence.
    // The wider Melkite tradition also observes Wednesdays and Fridays outside Lent.
    // Present the latter as traditional practice, not an additional legal obligation.
    const weekday = date.getUTCDay();
    const fastFree = (md >= '12-25' || md <= '01-06') ||
      (iso >= '2026-02-02' && iso <= '2026-02-08') ||
      (iso >= '2026-04-05' && iso <= '2026-04-11') ||
      (iso >= '2026-05-31' && iso <= '2026-06-06');
    if (!fastFree && !fast && (weekday === 3 || weekday === 5)) {
      fast = 'Traditional ' + (weekday === 5 ? 'Friday' : 'Wednesday') + ' abstinence — feast allowances may apply';
    }
    const notes = ['Melkite Catholic Diocese of Newton · 2026 calendar · page '+e.page+'. Seasonal fasts describe the observance; follow your parish’s directions and personal exemptions.'];
    if (md >= '06-20' && md <= '06-28') notes.push('The calendar also marks the shorter Apostles’ Fast from June 20.');
    if (md >= '12-10' && md <= '12-24') notes.push('The calendar also marks the shorter Nativity Fast from December 10.');
    return {...fallback,title:titleCase(e.observance || e.saints || 'Weekday'),rank:'Diocesan calendar',tone:e.tone,also:e.observance && e.saints ? [{title:titleCase(e.saints),rank:'Commemoration'}] : [],fast,fastSeason,fastingNote:notes.join(' '),sourcePage:e.page};
  }
  return {entry,read,calendar,source:data};
});
