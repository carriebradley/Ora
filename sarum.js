/* Sarum — hybrid traditional (Sarum Use / Gaelic) calendar engine.
 * Temporal cycle computed from Easter; Ember Days, Rogation, vigils, octaves, medieval fasts,
 * and a fixed-feast table built from the user's own "Gaelic Sarum" calendars plus the standard
 * Sarum / medieval English feast list. Pure functions, no DOM.
 */
(function (root, factory) {
  const LC = (typeof module === 'object' && module.exports) ? require('./calendar.js') : root.LitCal;
  if (typeof module === 'object' && module.exports) module.exports = factory(LC);
  else root.Sarum = factory(LC);
})(typeof self !== 'undefined' ? self : this, function (LC) {
  'use strict';
  const { D, add, iso, westernEaster, advent, DN, ORD } = LC;
  const DAY = 864e5, diff = (a, b) => Math.round((a - b) / DAY), dow = d => d.getUTCDay(), same = (a, b) => a.getTime() === b.getTime();
  const sunBefore = d => add(d, -(dow(d) || 7)), sunOnOrBefore = d => add(d, -dow(d));
  let NOTES = {};
  function setData(data) { NOTES = (data && data.sarumNotes) || {}; }
  const note = k => NOTES[k] || '';

  // m/d|name|rank|color|octaveDays   rank: P principal feast, D double feast, S simple feast
  const FIXED = `1/1|Circumcision of Our Lord (Octave Day of Christmas)|D|w|0
1/25|Conversion of St. Paul|D|w|0
2/1|Feast of St. Brigid of Kildare (Imbolc)|D|w|0
2/2|Purification of Mary / Candlemas|P|w|0
2/22|Chair of St. Peter|D|w|0
2/24|St. Matthias, Apostle|D|r|0
3/17|Feast of St. Patrick|D|w|0
3/21|St. Benedict, Abbot|D|w|0
3/25|Lady Day (Annunciation)|P|w|0
4/23|Feast of St. George|D|r|0
4/25|St. Mark, Evangelist (Major Litany)|D|r|0
5/1|Bealtaine / Feast of St. Philip & St. James|D|r|0
5/3|Invention of the Holy Cross|D|r|0
5/16|Feast of St. Brendan the Navigator|D|w|0
6/3|Feast of St. Kevin of Glendalough|D|w|0
6/9|Feast of St. Colmcille (Columba)|D|w|0
6/11|St. Barnabas, Apostle|D|r|0
6/24|Nativity of St. John the Baptist|P|w|0
6/29|Feast of Sts. Peter and Paul & Octave|P|r|7
7/2|Visitation of the Blessed Virgin Mary|D|w|0
7/7|Translation of St. Thomas Becket & Octave|P|w|7
7/22|St. Mary Magdalene|D|w|0
7/25|St. James, Apostle|D|r|0
7/26|St. Anne, Mother of Mary|D|w|0
8/1|Lammas / St. Peter in Chains (Lughnasadh)|D|w|0
8/10|St. Laurence, Deacon and Martyr|D|r|0
8/15|Assumption of Mary & Octave|P|w|7
8/24|St. Bartholomew, Apostle|D|r|0
8/28|St. Augustine of Hippo|D|w|0
8/29|Beheading of St. John the Baptist|D|r|0
9/8|Nativity of the Virgin Mary & Octave|P|w|7
9/9|Feast of St. Ciarán of Clonmacnoise|D|w|0
9/14|Exaltation of the Holy Cross|D|r|0
9/21|St. Matthew, Apostle and Evangelist|D|r|0
9/25|Feast of St. Finbarr of Cork|D|w|0
9/29|Michaelmas (Feast of St. Michael)|P|w|0
10/13|Feast of St. Edward the Confessor|D|w|0
10/18|St. Luke, Evangelist|D|r|0
10/28|Sts. Simon and Jude, Apostles|D|r|0
11/1|All Saints (All Hallows)|P|w|0
11/2|All Souls (soul-cakes)|P|v|0
11/3|Feast of St. Malachy of Armagh|D|w|0
11/11|Martinmas / Saint Martin's Lent|D|w|0
11/14|Feast of St. Laurence O'Toole|D|w|0
11/22|St. Cecilia, Virgin and Martyr|D|r|0
11/25|St. Katherine of Alexandria|D|r|0
11/30|St. Andrew, Apostle|D|r|0
12/6|Feast of St. Nicholas (Boy Bishop Rule)|D|w|0
12/8|Conception of the Blessed Virgin Mary|D|w|0
12/13|St. Lucy, Virgin and Martyr|D|r|0
12/21|St. Thomas, Apostle|D|r|0
12/26|St. Stephen, First Martyr (Stephenmas)|D|r|0
12/27|St. John, Apostle and Evangelist|D|w|0
12/28|Holy Innocents (Childermas)|D|r|0
12/29|Martyrdom of St. Thomas Becket|D|r|0`.split('\n').map(l => {
    const [md, name, rank, color, oct] = l.split('|'), [m, d] = md.split('/').map(Number);
    return { m, d, name, rank, color, oct: +oct };
  });
  // vigil fasts: eve of the feast (anticipated to Saturday when it falls on a Sunday). [m,d,keyForNotes,name]
  const VIGILS = [[2, 2, 'Purification'], [2, 24, 'St. Matthias'], [3, 25, 'Lady Day'], [6, 24, 'St. John the Baptist'], [6, 29, 'Sts. Peter and Paul'], [7, 25, 'St. James'],
    [8, 15, 'the Assumption', 'Vigil Fast of the Assumption'], [8, 24, 'St. Bartholomew'], [9, 21, 'St. Matthew'], [10, 28, 'Sts. Simon and Jude'], [11, 1, 'All Hallows', 'Vigil Fast of All Hallows'],
    [11, 30, 'St. Andrew'], [12, 21, 'St. Thomas'], [12, 25, 'Christmas', 'Vigil Fast of Christmas']];
  const RANK = { P: 'Principal Feast', D: 'Double Feast', S: 'Feast' };
  const SCORE = { P: 90, D: 60, S: 30 };

  function emberWed(d0) { let e = add(d0, 1); while (dow(e) !== 3) e = add(e, 1); return e; }   // first Wednesday after d0

  function temporal(d) {
    const y = d.getUTCFullYear(), E = westernEaster(y), adv = advent(y), wd = DN[dow(d)], sun = dow(d) === 0;
    const sept = add(E, -63), ash = add(E, -46), pent = add(E, 49), trin = add(E, 56), corp = add(E, 60), epi = D(y, 1, 6);
    const T = (title, score, rank, color, season, x) => Object.assign({ title, score, rank, color, season, temporal: true }, x);
    const em = n => ({ ember: n, fast: `Ember Day (Quatuor Tempora) — ${n} fast`, noteKey: n + ' Ember Days' });
    const k = diff(d, E);

    // Advent & Christmastide
    if (d >= adv && d < D(y, 12, 25)) {
      const wk = Math.floor(diff(d, adv) / 7) + 1;
      const x = { noteKey: 'Season of Advent' };
      const wed = emberWed(D(y, 12, 13)), eb = [0, 2, 3].map(n => add(wed, n)).find(z => same(z, d));
      if (d.getUTCDate() === 24 && d.getUTCMonth() === 11) return T('Christmas Eve — Vigil Fast', 85, 'Vigil', 'v', 'Advent', { fast: 'Strict fast and abstinence', noteKey: 'Vigil Fast of Christmas' });
      if (sun) return T(`${ORD(wk)} Sunday of Advent`, 70, 'Sunday', 'v', 'Advent', x);
      if (eb) return T(`${wd} — Winter Ember Day`, 45, 'Ember Day', 'v', 'Advent', Object.assign(x, em('Winter'), { noteKey: 'Winter Ember Days (Advent Fast)' }));
      return T(`${wd} of the ${ORD(wk)} Week of Advent`, 10, 'Weekday', 'v', 'Advent', x);
    }
    if (d >= D(y, 12, 25) || d < epi) {
      const cy = d.getUTCMonth() === 11 ? y : y - 1, C = D(cy, 12, 25), n = diff(d, C), x = { noteKey: 'Christmastide & The 12 Days of Christmas' };
      if (n === 0) return T('Nativity of Our Lord (Christmas)', 100, 'Principal Feast', 'w', 'Christmastide', x);
      if (sun) return T('Sunday within the Octave of Christmas', 70, 'Sunday', 'w', 'Christmastide', x);
      return T(`${ORD(n + 1)} Day of Christmas`, 20, 'Weekday', 'w', 'Christmastide', x);
    }
    // Epiphanytide
    if (d < sept) {
      const o = diff(d, epi);
      if (o === 0) return T('Epiphany of Our Lord (Nollaig Beag)', 95, 'Principal Feast', 'w', 'Epiphanytide', { noteKey: 'Epiphany & Octave of Epiphany (Nollaig Beag)' });
      if (o === 7) return T('Octave Day of the Epiphany', 62, 'Octave Day', 'w', 'Epiphanytide', { noteKey: 'Epiphany & Octave of Epiphany (Nollaig Beag)' });
      const sn = Math.floor((o - 1) / 7) + 1;
      if (sun) return T(`${ORD(sn)} Sunday after Epiphany`, 70, 'Sunday', 'g', 'Epiphanytide', { noteKey: 'Time after Epiphany' });
      if (o < 7) return T(`${wd} within the Octave of Epiphany`, 40, 'Octave Day', 'w', 'Epiphanytide', { noteKey: 'Epiphany & Octave of Epiphany (Nollaig Beag)' });
      return T(`${wd} after the ${ORD(Math.floor((diff(sunOnOrBefore(d), epi) - 1) / 7) + 1)} Sunday after Epiphany`, 10, 'Weekday', 'g', 'Epiphanytide', { noteKey: 'Time after Epiphany' });
    }
    // Pre-Lent
    if (d < ash) {
      const j = diff(d, sept);
      if (j === 0) return T('Septuagesima Sunday', 75, 'Sunday', 'v', 'Pre-Lent', { noteKey: 'Septuagesima Sunday (Pre-Lent Begins)' });
      if (j === 7) return T('Sexagesima Sunday', 75, 'Sunday', 'v', 'Pre-Lent', { noteKey: 'Sexagesima Sunday' });
      if (j === 14) return T('Quinquagesima Sunday', 75, 'Sunday', 'v', 'Pre-Lent', { noteKey: 'Quinquagesima & Shrovetide Carnival' });
      if (j === 15) return T('Shrove Monday', 40, 'Shrovetide', 'v', 'Pre-Lent', { noteKey: 'Quinquagesima & Shrovetide Carnival' });
      if (j === 16) return T('Shrove Tuesday', 45, 'Shrovetide', 'v', 'Pre-Lent', { noteKey: 'Quinquagesima & Shrovetide Carnival', fast: 'Day of shriving (confession); dairy and fat cleared before Lent' });
      return T(`${wd} of ${['Septuagesima', 'Sexagesima', 'Quinquagesima'][Math.floor(j / 7)]} week`, 10, 'Weekday', 'v', 'Pre-Lent');
    }
    // Lent, Passiontide, Holy Week
    if (d < E) {
      const L1 = add(E, -42), lent = { noteKey: 'Season of Lent (An Charghas)' };
      const lentFast = 'Lenten fast — abstinence from meat, eggs and dairy';
      if (same(d, ash)) return T('Ash Wednesday (Caput Jejunii)', 95, 'Holy Day', 'v', 'Lent', { fast: 'Strict fast and abstinence', noteKey: 'Ash Wednesday (Start of Lent / An Charghas)' });
      if (k === -3) return T('Maundy Thursday', 100, 'Holy Week', 'w', 'Holy Week', { noteKey: 'Holy Week', fast: lentFast });
      if (k === -2) return T('Good Friday — Creeping to the Cross', 100, 'Holy Week', 'k', 'Holy Week', { noteKey: 'Holy Week', fast: 'Strict fast and abstinence' });
      if (k === -1) return T('Holy Saturday — Easter Even', 100, 'Holy Week', 'v', 'Holy Week', { noteKey: 'Holy Week', fast: 'Strict fast until the Vigil' });
      if (k === -7) return T('Palm Sunday', 100, 'Sunday', 'r', 'Holy Week', { noteKey: 'Holy Week' });
      if (k > -7) return T(`${wd} of Holy Week`, 95, 'Holy Week', 'v', 'Holy Week', { noteKey: 'Holy Week', fast: lentFast });
      if (k === -14) return T('Passion Sunday', 90, 'Sunday', 'v', 'Passiontide', { noteKey: 'Passiontide' });
      const pt = k > -14 ? 'Passiontide' : 'Lent', key = k > -14 ? 'Passiontide' : 'Season of Lent (An Charghas)';
      if (d < L1) return T(`${wd} after Ash Wednesday`, 30, 'Lenten Day', 'v', 'Lent', { fast: lentFast, noteKey: key });
      const wk = Math.floor(diff(d, L1) / 7) + 1;
      if (sun) { const s = diff(d, L1) / 7 + 1; return T(s === 1 ? '1st Sunday of Lent (Quadragesima)' : `${ORD(s)} Sunday of Lent`, 75, 'Sunday', 'v', pt, { noteKey: key }); }
      if (wk === 1 && [3, 5, 6].includes(dow(d))) return T(`${wd} — Spring Ember Day`, 45, 'Ember Day', 'v', 'Lent', Object.assign(em('Spring'), { fast: 'Ember Day — Lenten fast; no meat, eggs or dairy', noteKey: 'Spring Ember Days (Lenten Fast)' }));
      return T(`${wd} of the ${ORD(wk)} Week of Lent`, 30, 'Lenten Day', 'v', pt, { fast: lentFast, noteKey: key });
    }
    // Eastertide → Pentecost → Trinity
    if (d <= trin) {
      const eas = { noteKey: 'Easter Sunday & Octave of Easter (Paschaltide)' };
      if (k === 0) return T('Easter Sunday', 100, 'Principal Feast', 'w', 'Eastertide', eas);
      if (k < 7) return T(`${wd} within the Octave of Easter`, 96, 'Octave Day', 'w', 'Eastertide', eas);
      if (k === 7) return T('Low Sunday (Octave Day of Easter)', 90, 'Sunday', 'w', 'Eastertide', eas);
      if (k === 38) return T('Rogation Wednesday — Vigil of the Ascension', 55, 'Vigil', 'v', 'Eastertide', { fast: 'Vigil fast and abstinence', noteKey: 'Vigil Fast of the Ascension' });
      if (k >= 36 && k <= 38) return T(`Rogation ${wd}`, 50, 'Rogation Day', 'v', 'Eastertide', { fast: 'Rogation Day — litanies, procession, fast and abstinence', noteKey: 'Rogationtide Processions' });
      if (k === 39) return T('Ascension Day', 100, 'Principal Feast', 'w', 'Eastertide', { noteKey: 'Ascension Day & Octave of the Ascension' });
      if (k > 39 && k <= 46 && !sun) return T(`${wd} within the Octave of the Ascension`, 40, 'Octave Day', 'w', 'Eastertide', { noteKey: 'Ascension Day & Octave of the Ascension' });
      if (k === 42) return T('Sunday after the Ascension', 70, 'Sunday', 'w', 'Eastertide', { noteKey: 'Ascension Day & Octave of the Ascension' });
      if (k === 48) return T('Whitsun Eve — Vigil of Pentecost', 85, 'Vigil', 'v', 'Eastertide', { fast: 'Vigil fast; baptismal preparation', noteKey: 'Vigil Fast of Pentecost' });
      if (k === 49) return T('Pentecost (Whitsunday)', 100, 'Principal Feast', 'r', 'Whitsuntide', { noteKey: 'Pentecost (Whitsun) & Whitsun Octave' });
      if (k > 49 && k < 56) {
        if ([52, 54, 55].includes(k)) return T(`${wd} — Summer Ember Day (Whitsun Week)`, 80, 'Ember Day', 'r', 'Whitsuntide', Object.assign(em('Summer'), { noteKey: 'Summer Ember Days (Whitsuntide Fast)' }));
        return T(`${wd} within the Whitsun Octave`, 85, 'Octave Day', 'r', 'Whitsuntide', { noteKey: 'Pentecost (Whitsun) & Whitsun Octave' });
      }
      if (k === 56) return T('Trinity Sunday', 98, 'Principal Feast', 'w', 'Whitsuntide', { noteKey: 'Trinity Sunday' });
      if (sun) return T(`${ORD(k / 7)} Sunday after Easter`, 70, 'Sunday', 'w', 'Eastertide', eas);
      return T(`${wd} of the ${ORD(Math.floor(k / 7) + 1)} Week of Easter`, 10, 'Weekday', 'w', 'Eastertide', eas);
    }
    // after Trinity
    const kt = diff(d, trin), post = { noteKey: 'Sundays after Trinity (Green Season)' };
    if (same(d, corp)) return T('Corpus Christi', 100, 'Principal Feast', 'w', 'After Trinity', { noteKey: 'Feast of Corpus Christi & Octave' });
    if (kt > 4 && kt <= 11) return T(`${wd} within the Octave of Corpus Christi`, 45, 'Octave Day', 'w', 'After Trinity', { noteKey: 'Feast of Corpus Christi & Octave' });
    const holyCrossEmber = emberWed(D(y, 9, 14)), eb = [0, 2, 3].map(n => add(holyCrossEmber, n)).find(z => same(z, d));
    if (eb) return T(`${wd} — Autumn Ember Day (Holy Cross)`, 45, 'Ember Day', 'g', 'After Trinity', Object.assign(em('Autumn'), { noteKey: 'Autumn Ember Days (Holy Cross Fast)' }));
    const nS = Math.floor(kt / 7);
    if (sun) return T(`${ORD(nS)} Sunday after Trinity`, 70, 'Sunday', 'g', 'After Trinity', post);
    return T(`${wd} after the ${ORD(nS)} Sunday after Trinity`, 10, 'Weekday', 'g', 'After Trinity', post);
  }

  function sarum(d, o) {
    o = Object.assign({ ladyDayTransfer: true }, o);
    const y = d.getUTCFullYear(), E = westernEaster(y), t = temporal(d), items = [t];
    const feastDate = f => {
      let e = D(y, f.m, f.d);
      if (f.m === 3 && f.d === 25 && o.ladyDayTransfer) {
        const k = diff(e, E);
        if (k >= -7 && k <= 7) e = add(E, 8);
        else if (dow(e) === 0 && e < E && e > add(E, -46)) e = add(e, 1);
      }
      return e;
    };
    for (const f of FIXED) {
      const e = feastDate(f);
      if (same(e, d)) items.push({ title: f.name, score: SCORE[f.rank], rank: RANK[f.rank], color: f.color, season: t.season, noteKey: f.name, feast: true, transferred: e.getUTCDate() !== f.d || e.getUTCMonth() + 1 !== f.m });
      if (f.oct) {
        const j = diff(d, e);
        if (j > 0 && j <= f.oct) items.push({ title: j === f.oct ? `Octave Day of ${f.name.replace(/ & Octave$/, '')}` : `Day within the Octave of ${f.name.replace(/ & Octave$/, '')}`, score: j === f.oct ? 62 : 38, rank: 'Octave Day', color: f.color, season: t.season, noteKey: f.name });
      }
    }
    for (const [m, dd, key, nk] of VIGILS) {
      let v = add(D(y, m, dd), -1);
      if (m === 3 && dd === 25 && o.ladyDayTransfer) { const fe = feastDate({ m: 3, d: 25 }); v = add(fe, -1); if (diff(fe, E) >= 0 && diff(fe, E) <= 9) continue; }
      if (dow(v) === 0) v = add(v, -1);
      if (same(v, d) && !(t.rank === 'Holy Week' || t.rank === 'Principal Feast')) {
        // Lent already fasts; Christmas Eve handled by temporal
        if (!(m === 12 && dd === 25))
          items.push({ title: `Vigil of ${key}`, score: 50, rank: 'Vigil', color: 'v', season: t.season, fast: 'Vigil fast and abstinence', noteKey: nk || `Vigil Fast of ${key}` });
      }
    }
    items.sort((a, b) => b.score - a.score);
    const w = items[0];
    const also = items.slice(1).filter(i => i.score >= 30 || i.fast).map(i => ({ title: i.title, note: i.rank }));
    // fasts: strongest of any item; Fridays are days of abstinence
    let fast = items.map(i => i.fast).filter(Boolean)[0] || '';
    const y1 = d.getUTCMonth() * 100 + d.getUTCDate();
    const martin = (d >= D(y, 11, 11) && d < D(y, 12, 24)) && dow(d) !== 0 && !same(d, D(y, 11, 11));
    if (!fast && martin) fast = "St. Martin's Lent — abstinence from meat (medieval Gaelic Advent fast)";
    if (!fast && dow(d) === 5 && !(t.season === 'Eastertide' && diff(d, E) < 7)) fast = 'Friday — day of abstinence';
    const noteKey = w.noteKey || t.noteKey;
    return { title: w.title, rank: w.rank, color: w.color, season: t.season, fast, notes: note(noteKey) || note(t.noteKey || ''), also, date: iso(d), ember: !!(items.find(i => i.ember)) };
  }

  return { sarum, temporal, setData, FIXED, VIGILS };
});
