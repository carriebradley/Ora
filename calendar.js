/* LitCal — liturgical calendar engine
 * Roman Rite Ordinary Form (GNLY 1969/2002), Roman Rite Extraordinary Form (1962 / 1960 rubrics),
 * Byzantine Rite (Pascha reckoning and fixed-feast dating are user settings).
 * Dates are UTC-midnight Date objects. Pure functions, no DOM.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.LitCal = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* ---------- date helpers ---------- */
  const DAY = 864e5;
  const D = (y, m, d) => new Date(Date.UTC(y, m - 1, d));
  const add = (d, n) => new Date(d.getTime() + n * DAY);
  const diff = (a, b) => Math.round((a - b) / DAY);
  const dow = d => d.getUTCDay();
  const iso = d => d.toISOString().slice(0, 10);
  const same = (a, b) => a.getTime() === b.getTime();
  const sunOnOrBefore = d => add(d, -dow(d));
  const sunBefore = d => add(d, -(dow(d) || 7));
  const sunOnOrAfter = d => add(d, (7 - dow(d)) % 7);
  const sunAfter = d => add(d, 7 - dow(d));
  const ORD = n => { const v = n % 100, s = ['th', 'st', 'nd', 'rd']; return n + (s[(v - 20) % 10] || s[v] || s[0]); };
  const DN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const MN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const DEFAULTS = {
    ascension: 'thursday',   // 'thursday' (universal) | 'sunday' (most US provinces)
    corpus: 'thursday',      // 'thursday' (universal) | 'sunday'
    epiphany: 'jan6',        // 'jan6' (universal) | 'sunday' (USA)
    byzPascha: 'gregorian',  // 'gregorian' (same date as Western Easter) | 'julian' (Orthodox date)
    byzOldCal: false,        // true: Menaion dates follow the Julian calendar (+13 days)
    byzChurch: 'ruthenian',  // Pittsburgh; explicit Ukrainian/Melkite engines remain available for source checks
    byzAnna: 'default'       // 'default' | '8' | '9': follow the parish's observance
  };
  const opts = o => Object.assign({}, DEFAULTS, o || {});
  const byzAnnaDay = (o = {}) => o.byzAnna === '8' ? 8 : o.byzAnna === '9' ? 9 : o.byzChurch === 'ruthenian' ? 8 : 9;

  let EXTRA = [];            // extra fixed Roman OF entries [m,d,name,kind] from imported calendars
  function setData(data) { EXTRA = (data && data.romanExtra) || []; ofCache = null; }

  /* ---------- computus ---------- */
  function westernEaster(y) {
    const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4,
      f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30,
      i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7,
      m = Math.floor((a + 11 * h + 22 * l) / 451), mo = Math.floor((h + l - 7 * m + 114) / 31),
      da = ((h + l - 7 * m + 114) % 31) + 1;
    return D(y, mo, da);
  }
  const julianOffset = y => Math.floor(y / 100) - Math.floor(y / 400) - 2;
  function julianEaster(y) {   // returned as a Gregorian civil date
    const a = y % 4, b = y % 7, c = y % 19, d = (19 * c + 15) % 30, e = (2 * a + 4 * b - d + 34) % 7,
      mo = Math.floor((d + e + 114) / 31), da = ((d + e + 114) % 31) + 1;
    return add(D(y, mo, da), julianOffset(y));
  }
  const advent = y => add(sunBefore(D(y, 12, 25)), -21);

  /* ---------- Roman Rite, Ordinary Form ---------- */
  // m/d|name|kind|color   kind: S solemnity, FL feast of the Lord, F feast, M memorial, O optional memorial
  const OF_SEED = `1/1|Mary, the Holy Mother of God|S|w
1/2|Saints Basil the Great and Gregory Nazianzen|M|w
1/4|Saint Elizabeth Ann Seton|M|w
1/5|Saint John Neumann|M|w
1/17|Saint Anthony, Abbot|M|w
1/21|Saint Agnes, Virgin and Martyr|M|r
1/24|Saint Francis de Sales, Bishop and Doctor|M|w
1/25|Conversion of Saint Paul, Apostle|F|w
1/26|Saints Timothy and Titus, Bishops|M|w
1/28|Saint Thomas Aquinas, Priest and Doctor|M|w
1/31|Saint John Bosco, Priest|M|w
2/2|Presentation of the Lord|FL|w
2/5|Saint Agatha, Virgin and Martyr|M|r
2/6|Saint Paul Miki and Companions, Martyrs|M|r
2/10|Saint Scholastica, Virgin|M|w
2/14|Saints Cyril and Methodius|M|w
2/22|Chair of Saint Peter, Apostle|F|w
2/23|Saint Polycarp, Bishop and Martyr|M|r
3/7|Saints Perpetua and Felicity, Martyrs|M|r
3/17|Saint Patrick, Bishop|O|w
3/19|Saint Joseph, Spouse of the Blessed Virgin Mary|S|w
3/25|Annunciation of the Lord|S|w
4/25|Saint Mark, Evangelist|F|r
4/29|Saint Catherine of Siena, Virgin and Doctor|M|w
5/1|Saint Joseph the Worker|O|w
5/2|Saint Athanasius, Bishop and Doctor|M|w
5/3|Saints Philip and James, Apostles|F|r
5/14|Saint Matthias, Apostle|F|r
5/31|Visitation of the Blessed Virgin Mary|F|w
6/1|Saint Justin, Martyr|M|r
6/3|Saint Charles Lwanga and Companions, Martyrs|M|r
6/11|Saint Barnabas, Apostle|M|r
6/13|Saint Anthony of Padua, Priest and Doctor|M|w
6/24|Nativity of Saint John the Baptist|S|w
6/29|Saints Peter and Paul, Apostles|S|r
7/3|Saint Thomas, Apostle|F|r
7/11|Saint Benedict, Abbot|M|w
7/14|Saint Kateri Tekakwitha, Virgin|M|w
7/15|Saint Bonaventure, Bishop and Doctor|M|w
7/22|Saint Mary Magdalene|F|w
7/25|Saint James, Apostle|F|r
7/26|Saints Joachim and Anne, Parents of the Blessed Virgin Mary|M|w
7/29|Saints Martha, Mary and Lazarus|M|w
7/31|Saint Ignatius of Loyola, Priest|M|w
8/1|Saint Alphonsus Liguori, Bishop and Doctor|M|w
8/6|Transfiguration of the Lord|FL|w
8/8|Saint Dominic, Priest|M|w
8/10|Saint Lawrence, Deacon and Martyr|F|r
8/11|Saint Clare, Virgin|M|w
8/14|Saint Maximilian Kolbe, Priest and Martyr|M|r
8/15|Assumption of the Blessed Virgin Mary|S|w
8/22|Queenship of the Blessed Virgin Mary|M|w
8/24|Saint Bartholomew, Apostle|F|r
8/27|Saint Monica|M|w
8/28|Saint Augustine, Bishop and Doctor|M|w
8/29|Passion of Saint John the Baptist|M|r
9/3|Saint Gregory the Great, Pope and Doctor|M|w
9/8|Nativity of the Blessed Virgin Mary|F|w
9/9|Saint Peter Claver, Priest|M|w
9/14|Exaltation of the Holy Cross|FL|r
9/15|Our Lady of Sorrows|M|w
9/16|Saints Cornelius, Pope, and Cyprian, Bishop, Martyrs|M|r
9/21|Saint Matthew, Apostle and Evangelist|F|r
9/27|Saint Vincent de Paul, Priest|M|w
9/29|Saints Michael, Gabriel and Raphael, Archangels|F|w
9/30|Saint Jerome, Priest and Doctor|M|w
10/1|Saint Therese of the Child Jesus, Virgin and Doctor|M|w
10/2|Guardian Angels|M|w
10/4|Saint Francis of Assisi|M|w
10/7|Our Lady of the Rosary|M|w
10/15|Saint Teresa of Jesus, Virgin and Doctor|M|w
10/17|Saint Ignatius of Antioch, Bishop and Martyr|M|r
10/18|Saint Luke, Evangelist|F|r
10/28|Saints Simon and Jude, Apostles|F|r
11/1|All Saints|S|w
11/2|Commemoration of All the Faithful Departed (All Souls)|S|v
11/4|Saint Charles Borromeo, Bishop|M|w
11/9|Dedication of the Lateran Basilica|FL|w
11/10|Saint Leo the Great, Pope and Doctor|M|w
11/11|Saint Martin of Tours, Bishop|M|w
11/12|Saint Josaphat, Bishop and Martyr|M|r
11/13|Saint Frances Xavier Cabrini, Virgin|M|w
11/21|Presentation of the Blessed Virgin Mary|M|w
11/22|Saint Cecilia, Virgin and Martyr|M|r
11/30|Saint Andrew, Apostle|F|r
12/3|Saint Francis Xavier, Priest|M|w
12/6|Saint Nicholas, Bishop|O|w
12/7|Saint Ambrose, Bishop and Doctor|M|w
12/8|Immaculate Conception of the Blessed Virgin Mary|S|w
12/12|Our Lady of Guadalupe|F|w
12/13|Saint Lucy, Virgin and Martyr|M|r
12/14|Saint John of the Cross, Priest and Doctor|M|w
12/26|Saint Stephen, First Martyr|F|r
12/27|Saint John, Apostle and Evangelist|F|w
12/28|Holy Innocents, Martyrs|F|r`;
  const OF_P = { S: 3, FL: 5, F: 7, M: 10, O: 11 };
  const OF_RANK = { S: 'Solemnity', FL: 'Feast of the Lord', F: 'Feast', M: 'Memorial', O: 'Optional Memorial' };
  let ofCache = null;
  function ofTable() {
    if (ofCache) return ofCache;
    const t = OF_SEED.split('\n').map(l => { const [md, name, kind, color] = l.split('|'); const [m, d] = md.split('/').map(Number); return { m, d, name, kind, color }; });
    const have = new Set(t.map(e => e.m + '/' + e.d));
    for (const [m, d, name, kind] of EXTRA) {
      if (have.has(m + '/' + d)) continue;
      const color = /Martyr|Apostle(?!.*Evangelist)/.test(name) ? 'r' : 'w';
      t.push({ m, d, name, kind, color, imported: true }); have.add(m + '/' + d);
    }
    return (ofCache = t);
  }

  function ofEpi(y, o) {
    let epi, bap;
    if (o.epiphany === 'sunday') {
      epi = sunOnOrAfter(D(y, 1, 2));
      bap = epi.getUTCDate() >= 7 ? add(epi, 1) : add(epi, 7);
    } else {
      epi = D(y, 1, 6);
      bap = dow(epi) === 0 ? add(epi, 1) : sunAfter(epi);
    }
    return { epi, bap };
  }

  function ofTemporal(d, o) {
    const y = d.getUTCFullYear(), E = westernEaster(y), ash = add(E, -46), pent = add(E, 49);
    const adv = advent(y), ck = add(adv, -7), { epi, bap } = ofEpi(y, o);
    const wd = DN[dow(d)], sun = dow(d) === 0;
    const T = (title, p, rank, color, season) => ({ title, p, rank, color, season, temporal: true });

    if (d >= adv && d < D(y, 12, 25)) {
      const wk = Math.floor(diff(d, adv) / 7) + 1;
      if (sun) return T(`${ORD(wk)} Sunday of Advent`, 2, 'Sunday', wk === 3 ? 'rose' : 'v', 'Advent');
      if (d >= D(y, 12, 17)) return T(`${wd}, December ${d.getUTCDate()} — weekday of Advent`, 9, 'Weekday', 'v', 'Advent');
      return T(`${wd} of the ${ORD(wk)} Week of Advent`, 12, 'Weekday', 'v', 'Advent');
    }
    if (d >= D(y, 12, 25) || d <= bap) {                       // Christmas Time
      const cy = d.getUTCMonth() === 11 ? y : y - 1, C = D(cy, 12, 25), n = diff(d, C);
      if (n === 0) return T('The Nativity of the Lord (Christmas)', 2, 'Solemnity', 'w', 'Christmas Time');
      if (n >= 1 && n <= 6) {
        const hf = dow(C) === 0 ? n === 5 : sun;
        if (hf) return T('The Holy Family of Jesus, Mary and Joseph', 5, 'Feast of the Lord', 'w', 'Christmas Time');
        return T(`${wd} within the Octave of Christmas`, 9, 'Weekday', 'w', 'Christmas Time');
      }
      if (same(d, epi)) return T('The Epiphany of the Lord', 2, 'Solemnity', 'w', 'Christmas Time');
      if (same(d, bap)) return T('The Baptism of the Lord', 5, 'Feast of the Lord', 'w', 'Christmas Time');
      if (sun && d.getUTCMonth() === 0 && d.getUTCDate() >= 2 && d < epi) return T('Second Sunday after Christmas', 6, 'Sunday', 'w', 'Christmas Time');
      return T(`${wd} of Christmas Time`, 12, 'Weekday', 'w', 'Christmas Time');
    }
    if (d < ash) {                                              // Ordinary Time I
      const M = dow(bap) === 0 ? add(bap, 1) : bap, wk = Math.floor((diff(d, M) + 1) / 7) + 1;
      return sun ? T(`${ORD(wk)} Sunday in Ordinary Time`, 6, 'Sunday', 'g', 'Ordinary Time')
        : T(`${wd} of the ${ORD(wk)} Week in Ordinary Time`, 12, 'Weekday', 'g', 'Ordinary Time');
    }
    if (d < E) {                                                // Lent / Triduum
      const k = diff(E, d);
      if (same(d, ash)) return T('Ash Wednesday', 2, 'Holy Day', 'v', 'Lent');
      if (k === 3) return T('Holy Thursday', 1, 'Triduum', 'w', 'Paschal Triduum');
      if (k === 2) return T('Good Friday of the Passion of the Lord', 1, 'Triduum', 'r', 'Paschal Triduum');
      if (k === 1) return T('Holy Saturday', 1, 'Triduum', 'v', 'Paschal Triduum');
      if (k === 7) return T('Palm Sunday of the Passion of the Lord', 2, 'Sunday', 'r', 'Holy Week');
      if (k > 3 && k < 7) return T(`${wd} of Holy Week`, 2, 'Weekday', 'v', 'Holy Week');
      const L1 = add(E, -42);
      if (d < L1) return T(`${wd} after Ash Wednesday`, 9, 'Weekday', 'v', 'Lent');
      const wk = Math.floor(diff(d, L1) / 7) + 1;
      if (sun) { const s = diff(d, L1) / 7 + 1; return T(`${ORD(s)} Sunday of Lent`, 2, 'Sunday', s === 4 ? 'rose' : 'v', 'Lent'); }
      return T(`${wd} of the ${ORD(wk)} Week of Lent`, 9, 'Weekday', 'v', 'Lent');
    }
    if (d <= pent) {                                            // Easter Time
      const k = diff(d, E), wk = Math.floor(k / 7) + 1;
      if (k === 0) return T('Easter Sunday of the Resurrection of the Lord', 1, 'Solemnity', 'w', 'Easter Time');
      if (k < 7) return T(`${wd} within the Octave of Easter`, 2, 'Solemnity', 'w', 'Easter Time');
      if (k === 7) return T('Second Sunday of Easter (Sunday of Divine Mercy)', 2, 'Sunday', 'w', 'Easter Time');
      if (k === 49) return T('Pentecost Sunday', 2, 'Solemnity', 'r', 'Easter Time');
      if (k === 42 && o.ascension === 'sunday') return T('The Ascension of the Lord', 2, 'Solemnity', 'w', 'Easter Time');
      if (k === 39 && o.ascension !== 'sunday') return T('The Ascension of the Lord', 2, 'Solemnity', 'w', 'Easter Time');
      if (sun) return T(`${ORD(k / 7 + 1)} Sunday of Easter`, 2, 'Sunday', 'w', 'Easter Time');
      return T(`${wd} of the ${ORD(wk)} Week of Easter`, 12, 'Weekday', 'w', 'Easter Time');
    }
    // Ordinary Time II
    const k = diff(d, pent), sn = sunOnOrBefore(d), n = 34 - diff(ck, sn) / 7;
    if (k === 7) return T('The Most Holy Trinity', 3, 'Solemnity', 'w', 'Ordinary Time');
    if (o.corpus === 'sunday' ? k === 14 : k === 11) return T('The Most Holy Body and Blood of Christ (Corpus Christi)', 3, 'Solemnity', 'w', 'Ordinary Time');
    if (k === 19) return T('The Most Sacred Heart of Jesus', 3, 'Solemnity', 'w', 'Ordinary Time');
    if (k === 20) return T('Immaculate Heart of the Blessed Virgin Mary', 10, 'Memorial', 'w', 'Ordinary Time');
    if (k === 1) return T('Blessed Virgin Mary, Mother of the Church', 10, 'Memorial', 'w', 'Ordinary Time');
    if (same(d, ck)) return T('Our Lord Jesus Christ, King of the Universe', 3, 'Solemnity', 'w', 'Ordinary Time');
    return sun ? T(`${ORD(n)} Sunday in Ordinary Time`, 6, 'Sunday', 'g', 'Ordinary Time')
      : T(`${wd} of the ${ORD(n)} Week in Ordinary Time`, 12, 'Weekday', 'g', 'Ordinary Time');
  }

  /* Office of Readings key for the modern Liturgy of the Hours (matches the keys in oor.js) */
  function oorKey(d, o) {
    o = opts(o);
    const y = d.getUTCFullYear(), E = westernEaster(y), ash = add(E, -46), pent = add(E, 49);
    const adv = advent(y), ck = add(adv, -7), { epi, bap } = ofEpi(y, o), w = dow(d), m = d.getUTCMonth() + 1, dd = d.getUTCDate();
    if (d >= adv && d < D(y, 12, 25)) {
      const wk = Math.floor(diff(d, adv) / 7) + 1;
      if (w === 0) return 'a' + wk + '-0';
      return dd >= 17 && m === 12 ? 'd' + dd : 'a' + wk + '-' + w;
    }
    if (d >= D(y, 12, 25) || d <= bap) {
      if (m === 12) {
        const C = D(y, 12, 25), n = diff(d, C);
        if (n === 0) return 'xmas';
        if (n <= 6 && (dow(C) === 0 ? n === 5 : w === 0)) return 'hf';
        return dd >= 29 ? 'd' + dd : 'saint';
      }
      if (dd === 1) return 'jan1';
      if (same(d, epi)) return 'epi';
      if (same(d, bap)) return 'bap';
      return (d < epi ? 'j-' : 'pe-') + w;
    }
    if (d < ash) { const M = dow(bap) === 0 ? add(bap, 1) : bap; return 'o' + (Math.floor((diff(d, M) + 1) / 7) + 1) + '-' + w; }
    if (d < E) {
      const k = diff(E, d);
      if (k === 7) return 'palm';
      if (k < 7) return 'hw-' + w;
      const L1 = add(E, -42);
      if (d < L1) return 'ash-' + w;
      return 'l' + (Math.floor(diff(d, L1) / 7) + 1) + '-' + w;
    }
    if (d <= pent) {
      const k = diff(d, E);
      if (k === 49) return 'pent';
      if ((k === 42 && o.ascension === 'sunday') || (k === 39 && o.ascension !== 'sunday')) return 'asc';
      if (k === 39) return 'asc-thu';
      return 'e' + (Math.floor(k / 7) + 1) + '-' + w;
    }
    const k = diff(d, pent);
    if (k === 7) return 'trin';
    if (o.corpus === 'sunday' ? k === 14 : k === 11) return 'corp';
    if (k === 19) return 'sh';
    const sn = sunOnOrBefore(d);
    return 'o' + (34 - diff(ck, sn) / 7) + '-' + w;
  }

  function ofTransfer(e, y, o) {
    let eff = D(y, e.m, e.d);
    if (e.kind !== 'S') return eff;
    const E = westernEaster(y), ash = add(E, -46), k = diff(eff, E);
    if (e.m === 3 && e.d === 19) {
      if (dow(eff) === 0 && eff > ash && eff < E) eff = add(eff, 1);
      else if (k >= -7 && k <= -1) eff = add(E, -8);
    } else if (e.m === 3 && e.d === 25) {
      if (k >= -7 && k <= 7) eff = add(E, 8);
      else if (dow(eff) === 0 && eff > ash && eff < E) eff = add(eff, 1);
    } else if (e.m === 12 && e.d === 8) {
      if (dow(eff) === 0) eff = add(eff, 1);
    } else {
      let guard = 0;
      while (ofTemporal(eff, o).p <= 2 && guard++ < 8) eff = add(eff, 1);
    }
    return eff;
  }

  function ofCycles(d) {
    const y = d.getUTCFullYear(), X = d >= advent(y) ? y : y - 1;
    return { sundayCycle: ['A', 'B', 'C'][X % 3], weekdayCycle: (X + 1) % 2 === 1 ? 'I' : 'II' };
  }

  function roman(d, o) {
    o = opts(o);
    const y = d.getUTCFullYear(), t = ofTemporal(d, o), cands = [t];
    for (const e of ofTable()) {
      if (!same(ofTransfer(e, y, o), d)) continue;
      cands.push({ title: e.name, p: OF_P[e.kind], rank: OF_RANK[e.kind], color: e.color, season: t.season, kind: e.kind, transferred: e.m !== d.getUTCMonth() + 1 || e.d !== d.getUTCDate() });
    }
    cands.sort((a, b) => a.p - b.p || (b.temporal ? 1 : 0) - (a.temporal ? 1 : 0));
    const w = cands[0], also = [];
    for (const c of cands.slice(1)) if (c.p <= 11)
      also.push({ title: c.title, note: (w.p >= 9 && c.p >= 10) ? 'Optional commemoration' : 'Outranked — not observed this year' });
    const fast = [];
    if (w.title === 'Ash Wednesday' || /^Good Friday/.test(w.title)) fast.push('Day of fast and abstinence');
    else if (dow(d) === 5 && t.season === 'Lent' && w.kind !== 'S') fast.push('Friday of Lent — abstinence from meat');
    const c = ofCycles(d);
    return Object.assign({}, w, { also, fast: fast.join('; '), sundayCycle: c.sundayCycle, weekdayCycle: c.weekdayCycle, date: iso(d) });
  }

  /* ---------- Roman Rite, Extraordinary Form (1962 Missal; 1960 Code of Rubrics) ---------- */
  // m/d|name|class|color|flags   flags: L = feast of the Lord (displaces a Sunday), X = displaces even a class I Sunday
  const EF_SEED = `1/1|Circumcision of Our Lord|2|w|L
1/6|Epiphany of Our Lord|1|w|L
1/13|Commemoration of the Baptism of Our Lord|2|w|L
1/17|Saint Anthony, Abbot|3|w
1/18|Chair of Saint Peter at Rome|2|w
1/20|Saints Fabian and Sebastian, Martyrs|3|r
1/21|Saint Agnes, Virgin and Martyr|3|r
1/22|Saints Vincent and Anastasius, Martyrs|3|r
1/24|Saint Timothy, Bishop and Martyr|3|r
1/25|Conversion of Saint Paul|3|w
1/26|Saint Polycarp, Bishop and Martyr|3|r
1/27|Saint John Chrysostom|3|w
1/29|Saint Francis de Sales|3|w
1/31|Saint John Bosco|3|w
2/2|Purification of the Blessed Virgin Mary (Candlemas)|2|w|L
2/3|Saint Blaise, Bishop and Martyr|3|r
2/5|Saint Agatha, Virgin and Martyr|3|r
2/6|Saint Titus, Bishop|3|w
2/9|Saint Cyril of Alexandria|3|w
2/10|Saint Scholastica, Virgin|3|w
2/11|Apparition of the Blessed Virgin Mary Immaculate (Lourdes)|3|w
2/14|Saint Valentine, Priest and Martyr|3|r
2/22|Chair of Saint Peter at Antioch|2|w
2/24|Saint Matthias, Apostle|2|r
3/4|Saint Casimir, Confessor|3|w
3/7|Saint Thomas Aquinas|3|w
3/9|Saint Frances of Rome, Widow|3|w
3/12|Saint Gregory the Great|3|w
3/17|Saint Patrick, Bishop|3|w
3/19|Saint Joseph, Spouse of the Blessed Virgin Mary|1|w
3/21|Saint Benedict, Abbot|3|w
3/25|Annunciation of the Blessed Virgin Mary|1|w
4/11|Saint Leo the Great|3|w
4/21|Saint Anselm|3|w
4/23|Saint George, Martyr|3|r
4/25|Saint Mark, Evangelist (Major Litany)|2|r
4/29|Saint Peter of Verona, Martyr|3|r
4/30|Saint Catherine of Siena, Virgin|3|w
5/1|Saint Joseph the Workman|1|w
5/2|Saint Athanasius|3|w
5/5|Saint Pius V, Pope|3|w
5/10|Saint Antoninus, Bishop|3|w
5/11|Saints Philip and James, Apostles|2|r
5/13|Saint Robert Bellarmine|3|w
5/25|Saint Gregory VII, Pope|3|w
5/26|Saint Philip Neri|3|w
5/31|Queenship of the Blessed Virgin Mary|2|w
6/11|Saint Barnabas, Apostle|3|r
6/13|Saint Anthony of Padua|3|w
6/24|Nativity of Saint John the Baptist|1|w
6/29|Saints Peter and Paul, Apostles|1|r
6/30|Commemoration of Saint Paul|2|r
7/1|Most Precious Blood of Our Lord Jesus Christ|2|r|L
7/2|Visitation of the Blessed Virgin Mary|2|w
7/14|Saint Bonaventure|3|w
7/16|Our Lady of Mount Carmel|3|w
7/22|Saint Mary Magdalene|3|w
7/25|Saint James, Apostle|2|r
7/26|Saint Anne, Mother of the Blessed Virgin Mary|2|w
7/31|Saint Ignatius of Loyola|3|w
8/1|Saint Peter in Chains|3|w
8/2|Saint Alphonsus Liguori|3|w
8/4|Saint Dominic|3|w
8/5|Our Lady of the Snows|3|w
8/6|Transfiguration of Our Lord|2|w|L
8/7|Saint Cajetan|3|w
8/10|Saint Lawrence, Martyr|2|r
8/15|Assumption of the Blessed Virgin Mary|1|w
8/16|Saint Joachim, Father of the Blessed Virgin Mary|2|w
8/20|Saint Bernard|3|w
8/21|Saint Jane Frances de Chantal|3|w
8/22|Immaculate Heart of Mary|2|w
8/24|Saint Bartholomew, Apostle|2|r
8/28|Saint Augustine|3|w
8/29|Beheading of Saint John the Baptist|2|r
8/30|Saint Rose of Lima|3|w
9/3|Saint Pius X, Pope|3|w
9/8|Nativity of the Blessed Virgin Mary|2|w
9/12|Holy Name of Mary|3|w
9/14|Exaltation of the Holy Cross|2|r|L
9/15|Seven Sorrows of the Blessed Virgin Mary|3|w
9/16|Saints Cornelius and Cyprian, Martyrs|3|r
9/21|Saint Matthew, Apostle and Evangelist|2|r
9/24|Our Lady of Ransom|3|w
9/27|Saints Cosmas and Damian, Martyrs|3|r
9/29|Dedication of Saint Michael the Archangel|1|w
9/30|Saint Jerome|3|w
10/1|Saint Remigius|3|w
10/2|Holy Guardian Angels|3|w
10/3|Saint Therese of the Child Jesus|3|w
10/4|Saint Francis of Assisi|3|w
10/7|Holy Rosary of the Blessed Virgin Mary|2|w
10/11|Maternity of the Blessed Virgin Mary|2|w
10/15|Saint Teresa of Jesus|3|w
10/18|Saint Luke, Evangelist|2|r
10/24|Saint Raphael the Archangel|3|w
10/28|Saints Simon and Jude, Apostles|2|r
11/1|All Saints|1|w|X
11/2|Commemoration of All the Faithful Departed (All Souls)|1|v|X
11/4|Saint Charles Borromeo|3|w
11/9|Dedication of the Archbasilica of Our Savior|3|w
11/10|Saint Andrew Avellino|3|w
11/11|Saint Martin of Tours|3|w
11/13|Saint Didacus|3|w
11/18|Dedication of the Basilicas of Saints Peter and Paul|3|w
11/21|Presentation of the Blessed Virgin Mary|3|w
11/22|Saint Cecilia, Virgin and Martyr|3|r
11/23|Saint Clement I, Pope and Martyr|3|r
11/25|Saint Catherine of Alexandria, Virgin and Martyr|3|r
11/30|Saint Andrew, Apostle|2|r
12/3|Saint Francis Xavier|3|w
12/6|Saint Nicholas, Bishop|3|w
12/7|Saint Ambrose|3|w
12/8|Immaculate Conception of the Blessed Virgin Mary|1|w|X
12/13|Saint Lucy, Virgin and Martyr|3|r
12/21|Saint Thomas, Apostle|2|r
12/25|Nativity of Our Lord|1|w|L
12/26|Saint Stephen, First Martyr|2|r
12/27|Saint John, Apostle and Evangelist|2|w
12/28|Holy Innocents, Martyrs|2|r
12/29|Saint Thomas of Canterbury|3|r
12/31|Saint Sylvester I, Pope|3|w`;
  let efCache = null;
  function efTable() {
    return efCache || (efCache = EF_SEED.split('\n').map(l => {
      const [md, name, cls, color, flags] = l.split('|'); const [m, d] = md.split('/').map(Number);
      return { m, d, name, cls: +cls, color, lord: /L/.test(flags || ''), force: /X/.test(flags || '') };
    }));
  }
  const EF_RANK = { 1: 'Class I', 2: 'Class II', 3: 'Class III', 4: 'Class IV' };

  function efTemporal(d) {
    const y = d.getUTCFullYear(), E = westernEaster(y), sept = add(E, -63), ash = add(E, -46),
      pent = add(E, 49), adv = advent(y), wd = DN[dow(d)], sun = dow(d) === 0, epi = D(y, 1, 6),
      ckEF = sunOnOrBefore(D(y, 10, 31)), lastSun = sunBefore(adv);
    const T = (title, cls, color, season, x) => Object.assign({ title, cls, color, season, temporal: true, priv: false, sunday: sun && cls <= 2 }, x);
    const ferial = (name, color, season, cls) => T(name, cls || 4, color, season);

    if (d >= adv && d < D(y, 12, 25)) {                         // Advent
      const wk = Math.floor(diff(d, adv) / 7) + 1;
      if (sun) return T(`${ORD(wk)} Sunday of Advent`, 1, wk === 3 ? 'rose' : 'v', 'Advent', { priv: true });
      if (d.getUTCDate() === 24) return T('Vigil of the Nativity', 1, 'v', 'Advent', { priv: true });
      const e3 = add(adv, 14);
      const ember = [3, 5, 6].map(n => add(e3, n)).find(x => same(x, d));
      if (ember) return T(`Ember ${wd} in Advent`, 2, 'v', 'Advent', { fast: 'Ember Day — fast and partial abstinence' });
      if (d.getUTCDate() >= 17) return T(`${wd}, December ${d.getUTCDate()} — Greater Feria of Advent`, 2, 'v', 'Advent', { priv: true });
      return ferial(`${wd} of the ${ORD(wk)} Week of Advent`, 'v', 'Advent', 3);
    }
    if (d >= D(y, 12, 25) || d < epi) {                         // Christmastide
      const cy = d.getUTCMonth() === 11 ? y : y - 1, C = D(cy, 12, 25), n = diff(d, C);
      if (n === 0) return T('Nativity of Our Lord', 1, 'w', 'Christmastide', { priv: true });
      if (n >= 1 && n <= 6) {
        const hasSun = dow(C) !== 0, isOctSun = hasSun ? sun : n === 5;
        if (isOctSun) return T('Sunday within the Octave of Christmas', 2, 'w', 'Christmastide', { priv: true });
        return ferial(`${wd} within the Octave of Christmas`, 'w', 'Christmastide', 2);
      }
      if (d.getUTCMonth() === 0 && d.getUTCDate() === 1) return T('Octave Day of Christmas — Circumcision', 2, 'w', 'Christmastide');
      if (sun) return T('Most Holy Name of Jesus', 2, 'w', 'Christmastide', { priv: true });
      return ferial(`${wd} after the Circumcision`, 'w', 'Christmastide');
    }
    if (d < sept) {                                             // after Epiphany
      const k = diff(d, epi);
      if (same(d, epi)) return T('Epiphany of Our Lord', 1, 'w', 'Epiphany', { priv: true });
      const n = Math.floor((k - 1) / 7) + 1;
      if (sun) return n === 1 ? T('Holy Family — 1st Sunday after Epiphany', 2, 'w', 'After Epiphany', { priv: true })
        : T(`${ORD(n)} Sunday after Epiphany`, 2, 'g', 'After Epiphany', { priv: true });
      const sn = Math.floor((diff(sunOnOrBefore(d), epi) - 1) / 7) + 1;
      return ferial(k < dow(D(y, 1, 6)) + 7 && sunOnOrBefore(d) < epi ? `${wd} after Epiphany` : `${wd} after the ${ORD(sn)} Sunday after Epiphany`, 'g', 'After Epiphany');
    }
    if (d < ash) {                                              // Septuagesima
      const k = diff(d, sept);
      if (sun) return T(['Septuagesima Sunday', 'Sexagesima Sunday', 'Quinquagesima Sunday'][k / 7], 2, 'v', 'Septuagesima', { priv: true });
      return ferial(`${wd} of ${['Septuagesima', 'Sexagesima', 'Quinquagesima'][Math.floor(k / 7)]} week`, 'v', 'Septuagesima');
    }
    if (d < E) {                                                // Lent
      const k = diff(E, d);
      if (same(d, ash)) return T('Ash Wednesday', 1, 'v', 'Lent', { priv: true, fast: 'Fast and abstinence' });
      if (k === 3) return T('Holy Thursday — Mass of the Lord’s Supper', 1, 'w', 'Holy Week', { priv: true });
      if (k === 2) return T('Good Friday — Passion and Death of the Lord', 1, 'b', 'Holy Week', { priv: true, fast: 'Fast and abstinence' });
      if (k === 1) return T('Holy Saturday', 1, 'v', 'Holy Week', { priv: true });
      if (k === 7) return T('Palm Sunday', 1, 'r', 'Holy Week', { priv: true });
      if (k > 3 && k < 7) return T(`${wd} of Holy Week`, 1, 'v', 'Holy Week', { priv: true });
      if (k === 14) return T('Passion Sunday', 1, 'v', 'Passiontide', { priv: true });
      const L1 = add(E, -42);
      if (d < L1) return T(`${wd} after Ash Wednesday`, 3, 'v', 'Lent', { priv: true, fast: dow(d) === 5 ? 'Friday — abstinence' : '' });
      const wk = Math.floor(diff(d, L1) / 7) + 1;
      if (sun) return T(`${ORD(diff(d, L1) / 7 + 1)} Sunday of Lent`, 1, wk === 4 ? 'rose' : 'v', 'Lent', { priv: true });
      if (wk === 1 && [3, 5, 6].includes(dow(d))) return T(`Ember ${wd} in Lent`, 2, 'v', 'Lent', { fast: 'Ember Day — fast and partial abstinence' });
      return T(`${wd} of the ${ORD(wk)} Week of Lent${wk === 5 ? ' (Passion Week)' : ''}`, 3, 'v', k > 14 ? 'Lent' : 'Passiontide', { priv: true });
    }
    if (d <= pent) {                                            // Paschaltide
      const k = diff(d, E);
      if (k === 0) return T('Easter Sunday', 1, 'w', 'Paschaltide', { priv: true });
      if (k < 7) return T(`${wd} in Easter Week`, 1, 'w', 'Paschaltide', { priv: true });
      if (k === 7) return T('Low Sunday (Dominica in albis)', 1, 'w', 'Paschaltide', { priv: true });
      if (k >= 36 && k <= 38) return T(`Rogation ${wd}`, 2, 'v', 'Paschaltide', { fast: 'Rogation Day — litanies' });
      if (k === 39) return T('Ascension of Our Lord', 1, 'w', 'Paschaltide', { priv: true });
      if (k === 49) return T('Pentecost Sunday', 1, 'r', 'Paschaltide', { priv: true });
      if (sun) return T(k === 42 ? 'Sunday after the Ascension' : `${ORD(k / 7)} Sunday after Easter`, 2, 'w', 'Paschaltide', { priv: true });
      return ferial(`${wd} after the ${ORD(Math.floor(k / 7))} Sunday after Easter`, 'w', 'Paschaltide');
    }
    // after Pentecost
    const k = diff(d, pent);
    if (k === 1 || k === 2) return T(`${wd} in Whitsun Week`, 1, 'r', 'Whitsuntide', { priv: true });
    if (k >= 3 && k <= 6) {
      if ([3, 5, 6].includes(k)) return T(`Ember ${wd} in Whitsun Week`, 2, 'r', 'Whitsuntide', { priv: true, fast: 'Ember Day — fast and partial abstinence' });
      return ferial(`${wd} in Whitsun Week`, 'r', 'Whitsuntide', 2);
    }
    if (k === 7) return T('Most Holy Trinity Sunday', 1, 'w', 'After Pentecost', { priv: true });
    if (k === 11) return T('Corpus Christi', 1, 'w', 'After Pentecost', { priv: true });
    if (k === 19) return T('Most Sacred Heart of Jesus', 1, 'w', 'After Pentecost', { priv: true });
    if (same(d, ckEF)) return T('Our Lord Jesus Christ the King', 1, 'w', 'After Pentecost', { priv: true });
    const sn = sunOnOrBefore(d), nF = diff(sn, pent) / 7;
    const lab = same(sn, lastSun) ? 24 : nF >= 24 ? 23 : nF;
    const ember9 = (() => { const t3 = add(sunOnOrAfter(D(y, 9, 1)), 14); return [3, 5, 6].map(n => add(t3, n)).find(x => same(x, d)); })();
    if (ember9) return T(`Ember ${wd} in September`, 2, 'v', 'After Pentecost', { fast: 'Ember Day — fast and partial abstinence' });
    if (sun) return T(lab === 23 && nF >= 24 ? 'Sunday after the 23rd Sunday after Pentecost (surplus Sunday after Epiphany)' : `${ORD(lab)} Sunday after Pentecost`, 2, 'g', 'After Pentecost', { priv: true });
    return ferial(`${wd} after the ${ORD(lab)} Sunday after Pentecost`, 'g', 'After Pentecost');
  }

  function efBlocked(date, f) {
    const t = efTemporal(date);
    return t.cls <= 1 && t.priv && !f.force;
  }
  function efEff(f, y) {
    let eff = D(y, f.m, f.d), g = 0;
    if (f.cls !== 1) return eff;
    while (efBlocked(eff, f) && g++ < 12) eff = add(eff, 1);
    return eff;
  }

  function extraordinary(d, o) {
    const y = d.getUTCFullYear(), t = efTemporal(d), cands = [];
    for (const f of efTable()) if (same(efEff(f, y), d)) cands.push(f);
    let w = t, also = [];
    cands.sort((a, b) => a.cls - b.cls);
    for (const f of cands) {
      const wins = f.cls < t.cls || (f.cls === t.cls && !t.priv) || (f.lord && t.sunday && f.cls <= 2);
      if (wins && w === t) w = { title: f.name, cls: f.cls, color: f.color, season: t.season, sanctoral: true };
      else if (f.cls <= 3) also.push({ title: f.name, note: 'Commemoration' });
    }
    if (w !== t && (t.priv || t.cls <= 3)) also.unshift({ title: t.title, note: 'Commemoration' });
    return {
      title: w.title, rank: EF_RANK[w.cls], cls: w.cls, color: w.color === 'b' ? 'k' : w.color, season: t.season,
      also, fast: t.fast || '', date: iso(d)
    };
  }

  /* ---------- Byzantine Rite ---------- */
  // m/d|name|level    level: G great feast of the year, F feast, S saint   (revised-calendar / Gregorian civil dates)
  const BYZ_SEED = `9/1|Beginning of the Church Year (Indiction)|F
9/8|Nativity of the Mother of God|G
9/14|Universal Exaltation of the Precious and Life-giving Cross|G
10/1|Protection of the Mother of God (Pokrova)|F
10/26|Great-Martyr Demetrius|S
11/8|Synaxis of the Archangel Michael and the Bodiless Powers|F
11/12|Hieromartyr Josaphat|S
11/13|Saint John Chrysostom|S
11/14|Holy Apostle Philip|S
11/21|Entrance of the Mother of God into the Temple|G
11/30|Holy Apostle Andrew the First-called|F
12/6|Saint Nicholas the Wonderworker|F
12/9|Conception of the Mother of God by Saint Anna|F
12/25|Nativity of Our Lord, God and Saviour Jesus Christ|G
12/26|Synaxis of the Mother of God|F
12/27|Protomartyr and Archdeacon Stephen|S
1/1|Circumcision of Christ; Saint Basil the Great|F
1/6|Theophany of Our Lord|G
1/7|Synaxis of Saint John the Baptist|F
1/17|Saint Anthony the Great|S
1/25|Saint Gregory the Theologian|S
1/30|Three Holy Hierarchs|F
2/2|Meeting of Our Lord in the Temple|G
3/25|Annunciation of the Mother of God|G
4/23|Great-Martyr George|S
4/25|Holy Apostle and Evangelist Mark|S
5/21|Holy Equals-to-the-Apostles Constantine and Helen|S
6/24|Nativity of Saint John the Baptist|F
6/29|Holy Apostles Peter and Paul|F
7/20|Holy Prophet Elijah|S
8/1|Procession of the Venerable Cross|S
8/6|Transfiguration of Our Lord|G
8/15|Dormition of the Mother of God|G
8/29|Beheading of Saint John the Baptist|F`;
  let byzCache = null;
  const byzTable = () => byzCache || (byzCache = BYZ_SEED.split('\n').map(l => { const [md, name, lvl] = l.split('|'); const [m, d] = md.split('/').map(Number); return { m, d, name, lvl }; }));
  const pascha = (y, o) => o.byzPascha === 'julian' ? julianEaster(y) : westernEaster(y);

  function byzantine(d, o) {
    o = opts(o);
    if (o && o.byzChurch === 'melkite') {
      const M = typeof module === 'object' && module.exports ? require('./melkite.js') : globalThis.Melkite;
      return M.calendar(d, byzantine(d, {...o, byzChurch:'ukrainian'}));
    }
    o = opts(o);
    const y = d.getUTCFullYear(), P = pascha(y, o), Pn = pascha(y + 1, o), Pp = pascha(y - 1, o), wd = DN[dow(d)], sun = dow(d) === 0;
    const items = [];   // {title, score, color, season, rank}
    const push = (title, score, rank, color, season, extra) => items.push(Object.assign({ title, score, rank, color, season }, extra));
    const toneAnchor = d >= P ? P : Pp;
    const toneWeeks = Math.floor(diff(d, add(toneAnchor, 49)) / 7);
    let season = '', tone = sun ? ((toneWeeks - 2) % 8 + 8) % 8 + 1 : 0;
    const men = o.byzOldCal ? add(d, -julianOffset(y)) : d, mm = men.getUTCMonth() + 1, md = men.getUTCDate();

    // temporal cycle
    let anchor;
    if (d >= add(P, -77) && d < P) {
      const k = diff(P, d);
      season = k > 48 ? 'Triodion — preparation for the Great Fast' : k < 7 ? 'Great and Holy Week' : k <= 8 ? 'Lazarus Saturday and Palm Sunday' : 'Triodion — Great Fast';
      const sundays = { 77: 'Zacchaeus Sunday (32nd Sunday after Pentecost)', 70: 'Sunday of the Publican and the Pharisee', 63: 'Sunday of the Prodigal Son', 56: 'Meatfare Sunday — the Last Judgment', 49: 'Cheesefare Sunday — Forgiveness Sunday',
        42: '1st Sunday of Great Lent — Triumph of Orthodoxy', 35: '2nd Sunday of Great Lent — Saint Gregory Palamas', 28: '3rd Sunday of Great Lent — Veneration of the Holy Cross',
        21: '4th Sunday of Great Lent — Saint John Climacus', 14: '5th Sunday of Great Lent — Saint Mary of Egypt', 7: 'Palm Sunday — Entry of the Lord into Jerusalem' };
      if (sun) { if (k === 7) tone = 0; push(sundays[k], k === 7 ? 90 : 50, k === 7 ? 'Great Feast' : 'Sunday', k === 7 ? 'g' : 'v', season); }
      else if (k === 48) push('Clean Monday — beginning of the Great Fast', 60, 'Holy Day', 'v', season);
      else if (k === 8) push('Lazarus Saturday', 85, 'Feast', 'v', season);
      else if (k === 3) push('Great and Holy Thursday', 95, 'Holy Week', 'r', season);
      else if (k === 2) push('Great and Holy Friday', 95, 'Holy Week', 'k', season);
      else if (k === 1) push('Great and Holy Saturday', 95, 'Holy Week', 'w', season);
      else if (k > 3 && k < 7) push(`Great and Holy ${wd}`, 90, 'Holy Week', 'v', season);
      else if (k > 48) push(`${wd} of ${k > 70 ? 'Zacchaeus' : k > 62 ? 'the Publican and Pharisee' : k > 55 ? 'the Prodigal Son' : k > 49 ? 'Meatfare Week' : 'Cheesefare Week'}`, 5, 'Weekday', 'g', season);
      else { const wk = Math.floor((48 - k) / 7) + 1; push(`${wd} of the ${ORD(wk)} Week of Great Lent`, 20, 'Weekday', 'v', season); }
    } else if (d >= P && d <= add(P, 56)) {
      season = 'Pentecostarion'; const k = diff(d, P);
      if (k === 0) { tone = 1; push('Pascha — the Resurrection of Our Lord', 100, 'Great Feast', 'w', season); }
      else if (k < 7) push(`${wd} of Bright Week`, 98, 'Great Feast', 'w', season);
      else if (k === 7) { push('Thomas Sunday (Antipascha)', 60, 'Sunday', 'w', season); tone = 1; }
      else if (k === 14) { push('Sunday of the Holy Myrrh-bearing Women', 60, 'Sunday', 'w', season); tone = 2; }
      else if (k === 21) { push('Sunday of the Paralytic', 60, 'Sunday', 'w', season); tone = 3; }
      else if (k === 24) push('Mid-Pentecost', 40, 'Feast', 'w', season);
      else if (k === 28) { push('Sunday of the Samaritan Woman', 60, 'Sunday', 'w', season); tone = 4; }
      else if (k === 35) { push('Sunday of the Man Born Blind', 60, 'Sunday', 'w', season); tone = 5; }
      else if (k === 39) push('Ascension of Our Lord', 90, 'Great Feast', 'w', season);
      else if (k === 42) { push('Sunday of the Holy Fathers of the First Ecumenical Council', 60, 'Sunday', 'w', season); tone = 6; }
      else if (k === 49) { tone = 0; push('Pentecost — Descent of the Holy Spirit', 92, 'Great Feast', 'g', season); }
      else if (k === 50) push('Monday of the Holy Spirit', 70, 'Feast', 'g', season);
      else if (k === 56) { push('Sunday of All Saints', 60, 'Sunday', 'w', season); tone = 8; }
      else push(`${wd} of the ${ORD(Math.floor(k / 7) + 1)} Week of Pascha`, 5, 'Weekday', 'w', season);
    } else {
      anchor = d > P ? P : Pp; const pent = add(anchor, 49), k = diff(d, pent);
      season = 'After Pentecost';
      const n = Math.floor(k / 7);
      if (sun) {
        tone = n >= 2 ? ((n - 2) % 8) + 1 : 8;
        let special = '';
        if (mm === 12 && md >= 11 && md <= 17) special = 'Sunday of the Holy Forefathers';
        else if (mm === 12 && md >= 18 && md <= 24) special = 'Sunday before the Nativity — Holy Fathers';
        else if (mm === 12 && md >= 26) special = 'Sunday after the Nativity';
        else if (mm === 1 && md >= 1 && md <= 5) special = 'Sunday before Theophany';
        else if (mm === 1 && md >= 7 && md <= 13) special = 'Sunday after Theophany';
        else if (mm === 9 && md >= 8 && md <= 13) special = 'Sunday before the Exaltation of the Cross';
        else if (mm === 9 && md >= 15 && md <= 21) special = 'Sunday after the Exaltation of the Cross';
        else if (mm === 7 && md >= 13 && md <= 19) special = 'Sunday of the Fathers of the First Six Ecumenical Councils';
        else if (mm === 10 && (o.byzChurch === 'ruthenian' ? md >= 8 && md <= 14 : md >= 11 && md <= 17)) special = 'Sunday of the Fathers of the Seventh Ecumenical Council';
        if (special) push(special, 55, 'Sunday', 'g', season);
        push(`${ORD(n)} Sunday after Pentecost`, special ? 30 : 50, 'Sunday', 'g', season);
      } else push(`${wd} after the ${ORD(n)} Sunday after Pentecost`, 5, 'Weekday', 'g', season);
    }
    // fixed (Menaion) feasts
    for (const e of byzTable()) {
      const feastDay = e.m === 12 && e.d === 9 ? byzAnnaDay(o) : e.d;
      if (e.m === mm && feastDay === md)
        push(e.name, e.lvl === 'G' ? 80 : e.lvl === 'F' ? 40 : 20, e.lvl === 'G' ? 'Great Feast' : e.lvl === 'F' ? 'Feast' : 'Saint', e.lvl === 'G' ? 'gold' : 'w', season);
    }
    const kk = diff(d, P);
    if (dow(d) === 6 && [-57, -36, -29, -22, 48].includes(kk)) push('Saturday of the Dead (All Souls Saturday)', 35, 'Commemoration', 'v', season);
    if (mm === 12 && md === 24) push('Eve of the Nativity', 45, 'Vigil', 'v', season);
    if (mm === 1 && md === 5) push('Eve of Theophany', 45, 'Vigil', 'v', season);
    for (const [m, dd, name] of [[12, 24, 'Nativity'], [1, 5, 'Theophany']]) {
      let hours = D(men.getUTCFullYear(), m, dd);
      if (o.byzOldCal) hours = add(hours, julianOffset(hours.getUTCFullYear()));
      if (dow(hours) === 0) hours = add(hours, -2);
      else if (dow(hours) === 6) hours = add(hours, -1);
      if (same(d, hours)) push(`Royal Hours of the ${name}`, 44, 'Observance', 'v', season);
    }
    if (o.byzChurch === 'ruthenian' && y === 2026) {
      // Annual MCI calendar supersedes older Menaion dates for these local feasts.
      if (mm === 10 && md === 31) push('Holy Martyr Theodore Romzha, Bishop of Mukachevo', 40, 'Feast', 'r', season);
      if (mm === 12 && md === 12) push('The Theotokos of Guadalupe', 40, 'Feast', 'w', season);
    }
    items.sort((a, b) => b.score - a.score);
    const w = items[0], also = items.slice(1).filter(i => i.score >= 20).map(i => ({ title: i.title, note: i.rank }));

    // fasting
    let fast = '';
    const menFast = (a, b) => { const x = mm * 100 + md; return x >= a && x <= b; };
    const apostlesStart = add(pascha(y, o), 57);
    const apEnd = o.byzOldCal ? add(D(y, 6, 28), julianOffset(y)) : D(y, 6, 28);
    let fastSeason = '';
    if (d >= add(P, -48) && d < add(P, -8)) fastSeason = 'Great Fast';
    else if (d >= add(P, -6) && d < P) fastSeason = 'Great and Holy Week';
    else if (menFast(801, 814)) fastSeason = 'Dormition Fast';
    else if (menFast(1115, 1224)) fastSeason = 'Nativity Fast (Philip’s Fast)';
    else if (d >= apostlesStart && d <= apEnd) fastSeason = 'Apostles’ Fast';
    const freeW = diff(d, P);
    const fastFree = (freeW >= 0 && freeW <= 6) || (freeW >= 49 && freeW <= 55) || menFast(1225, 1231) || menFast(101, 104) || (diff(P, d) <= 70 && diff(P, d) >= 64);
    const greatFast = d >= add(P, -48) && d < P;
    const lordOrMary = byzTable().some(e => e.m === mm && e.d === md && (e.lvl === 'G' || (e.m === 1 && e.d === 1) || (e.m === 10 && e.d === 1)));
    if (same(d, add(P, -48)) || same(d, add(P, -2))) fast = 'Strict abstinence — no meat, eggs or dairy';
    else if (o.byzChurch === 'ukrainian' && ((mm === 12 && md === 24) || (mm === 1 && md === 5) || (mm === 9 && md === 14) || (mm === 8 && md === 29))) fast = 'Fast and abstinence from meat — U.S. Ukrainian practice';
    else if (!fastFree && !lordOrMary && (dow(d) === 5 || (o.byzChurch === 'ruthenian' && greatFast && dow(d) === 3))) fast = o.byzChurch === 'ruthenian' && !greatFast ? 'Friday — abstinence from meat or equivalent penance' : 'Abstinence from meat';
    const fastingNote = `${o.byzChurch === 'ruthenian' ? 'U.S. Ruthenian' : 'U.S. Ukrainian Greek Catholic'} practice. Seasonal fasting traditions are fuller than these general requirements; follow your eparchy’s current directions and personal exemptions.`;
    return { title: w.title, rank: w.rank, color: w.color, season, tone, also, fast, fastSeason, fastingNote, date: iso(d), pascha: iso(P) };
  }

  /* ---------- combined ---------- */
  function day(date, o) {
    const d = typeof date === 'string' ? D(+date.slice(0, 4), +date.slice(5, 7), +date.slice(8, 10)) : D(date.getFullYear ? date.getFullYear() : date.getUTCFullYear(), (date.getMonth ? date.getMonth() : date.getUTCMonth()) + 1, date.getDate ? date.getDate() : date.getUTCDate());
    o = opts(o);
    return { date: iso(d), weekday: DN[dow(d)], roman: roman(d, o), ef: extraordinary(d, o), byz: byzantine(d, o) };
  }

  return { day, roman, oorKey, extraordinary, byzantine, byzAnnaDay, westernEaster, julianEaster, advent, setData, DEFAULTS, D, add, iso, DN, MN, ORD };
});

