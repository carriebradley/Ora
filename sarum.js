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
  const SRCTXT = { W: 'In the Sarum Missal', K: 'Standard kalendar', I: 'Irish addition — not in the Sarum Missal (unverified)' };
  const DAY = 864e5, diff = (a, b) => Math.round((a - b) / DAY), dow = d => d.getUTCDay(), same = (a, b) => a.getTime() === b.getTime();
  const sunBefore = d => add(d, -(dow(d) || 7)), sunOnOrBefore = d => add(d, -dow(d));
  let NOTES = {};
  function setData(data) { NOTES = (data && data.sarumNotes) || {}; }
  const note = k => NOTES[k] || '';

  // m/d|name|rank|color|octaveDays|src
  //   rank: P principal feast, D double, L lesser double, M saint with a Mass in the Missal (rank not given there)
  //   src (evidence): W = appears in Warren's 'Sarum Missal in English' Proper of Saints (verified, 2026 read)
  //                   K = standard medieval kalendar entry, not individually checked (Christmas-week days)
  //                   I = Irish/Gaelic addition kept from the user's own calendar — NOT in the Sarum Missal; unverified
  // Ranks P/D are carried over from the user's earlier calendar and are approximate; only Gregory (Inferior Double) and
  // the Annunciation (Lesser Double) were cross-checked against a modern Sarum ordo.
  const FIXED = `1/1|Circumcision of Our Lord (Octave Day of Christmas)|D|w|0|K
1/14|St. Felix, Bishop and Martyr|M|r|0|W
1/15|St. Maurus, Abbot and Confessor|M|w|0|W
1/16|St. Marcellus, Pope and Martyr|M|r|0|W
1/17|St. Sulpicius, Bishop and Confessor|M|w|0|W
1/18|St. Prisca, Virgin and Martyr|M|r|0|W
1/19|St. Wulstan, Bishop and Confessor|M|w|0|W
1/20|Sts. Fabian and Sebastian, Martyrs|M|r|0|W
1/21|St. Agnes, Virgin and Martyr|M|r|0|W
1/22|St. Vincent, Martyr|M|r|0|W
1/25|Conversion of St. Paul|D|w|0|W
1/27|St. Julian, Bishop|M|w|0|W
1/28|St. Agnes (second feast)|M|r|0|W
1/30|St. Bathild, Queen|M|w|0|W
2/1|Feast of St. Brigid of Kildare (Imbolc)|D|w|0|W
2/2|Purification of Mary / Candlemas|P|w|0|W
2/3|St. Blase, Bishop and Martyr|M|r|0|W
2/5|St. Agatha, Virgin and Martyr|M|r|0|W
2/6|Sts. Vedast and Amandus, Bishops|M|w|0|W
2/10|St. Scholastica, Virgin|M|w|0|W
2/14|St. Valentine, Bishop and Martyr|M|r|0|W
2/16|St. Juliana, Virgin and Martyr|M|r|0|W
2/22|Chair of St. Peter|D|w|0|W
2/24|St. Matthias, Apostle|D|r|0|W
3/1|St. David, Bishop and Confessor|M|w|0|W
3/2|St. Chad, Bishop and Confessor|M|w|0|W
3/7|Sts. Perpetua and Felicitas, Martyrs|M|r|0|W
3/12|St. Gregory the Great, Pope (Inferior Double)|L|w|0|W
3/17|Feast of St. Patrick|D|w|0|W
3/18|St. Edward, King and Martyr|M|r|0|W
3/20|St. Cuthbert, Bishop and Confessor|M|w|0|W
3/21|St. Benedict, Abbot|D|w|0|W
3/25|Lady Day (Annunciation)|P|w|0|W
4/3|St. Richard, Bishop|M|w|0|W
4/4|St. Ambrose, Bishop and Doctor|M|w|0|W
4/14|Sts. Tiburtius and Valerian, Martyrs|M|r|0|W
4/19|St. Alphege, Bishop and Martyr|M|r|0|W
4/23|Feast of St. George|D|r|0|W
4/25|St. Mark, Evangelist (Major Litany)|D|r|0|W
4/28|St. Vitalis, Martyr|M|r|0|W
5/1|Bealtaine / Feast of St. Philip & St. James|D|r|0|W
5/3|Invention of the Holy Cross|D|r|0|W
5/6|St. John before the Latin Gate|M|w|0|W
5/7|St. John of Beverley, Bishop and Confessor|M|w|0|W
5/10|Sts. Gordian and Epimachus, Martyrs|M|r|0|W
5/12|Sts. Nereus, Achilleus and Pancras, Martyrs|M|r|0|W
5/16|Feast of St. Brendan the Navigator|D|w|0|I
5/19|St. Dunstan, Archbishop and Confessor|M|w|0|W
5/25|St. Aldhelm, Bishop and Confessor|M|w|0|W
5/26|St. Augustine of Canterbury, Apostle of the English|M|w|0|W
5/28|St. Germanus, Bishop and Confessor|M|w|0|W
5/31|St. Petronilla, Virgin|M|w|0|W
6/1|St. Nicomede, Martyr|M|r|0|W
6/2|Sts. Marcellinus and Peter, Martyrs|M|r|0|W
6/3|Feast of St. Kevin of Glendalough|D|w|0|I
6/5|St. Boniface and Companions, Martyrs|M|r|0|W
6/8|Sts. Medard and Godard, Bishops|M|w|0|W
6/9|Feast of St. Colmcille (Columba)|D|w|0|I
6/9|Translation of St. Edmund, Archbishop|M|w|0|W
6/11|St. Barnabas, Apostle|D|r|0|W
6/12|Sts. Basilides, Cyrinus, Nabor and Nazarius, Martyrs|M|r|0|W
6/14|St. Basil, Bishop and Confessor|M|w|0|W
6/15|Sts. Vitus, Modestus and Crescentia, Martyrs|M|r|0|W
6/16|Translation of St. Richard|M|w|0|W
6/18|Sts. Mark and Marcellian, Martyrs|M|r|0|W
6/19|Sts. Gervase and Protase, Martyrs|M|r|0|W
6/20|Translation of St. Edward, King and Martyr|M|r|0|W
6/22|St. Alban, Martyr|M|r|0|W
6/24|Nativity of St. John the Baptist|P|w|0|W
6/26|Sts. John and Paul, Martyrs|M|r|0|W
6/29|Feast of Sts. Peter and Paul & Octave|P|r|7|W
6/30|Commemoration of St. Paul|M|r|0|W
7/2|Visitation of the Blessed Virgin Mary|D|w|0|W
7/4|Translation and Ordination of St. Martin|M|w|0|W
7/7|Translation of St. Thomas Becket & Octave|P|w|7|W
7/10|The Seven Brothers, Martyrs|M|r|0|W
7/11|Translation of St. Benedict, Abbot|M|w|0|W
7/15|Translation of St. Swithun|M|w|0|W
7/16|Translation of St. Osmund, Bishop and Confessor|M|w|0|W
7/17|St. Kenelm, King and Martyr|M|r|0|W
7/18|St. Arnulph, Bishop and Martyr|M|r|0|W
7/20|St. Margaret, Virgin and Martyr|M|r|0|W
7/21|St. Praxedes, Virgin|M|w|0|W
7/22|St. Mary Magdalene|D|w|0|W
7/23|St. Apollinaris, Martyr|M|r|0|W
7/25|St. James, Apostle|D|r|0|W
7/26|St. Anne, Mother of Mary|D|w|0|W
7/27|The Seven Sleepers|M|w|0|W
7/28|St. Samson, Bishop (with St. Pantaleon)|M|w|0|W
7/29|Sts. Felix, Simplicius, Faustinus and Beatrice, Martyrs|M|r|0|W
7/30|Sts. Abdon and Sennen, Martyrs|M|r|0|W
7/31|St. Germanus, Bishop and Confessor|M|w|0|W
8/1|Lammas / St. Peter in Chains (Lughnasadh)|D|w|0|W
8/2|St. Stephen, Pope and Martyr|M|r|0|W
8/3|Invention of St. Stephen, Protomartyr|M|r|0|W
8/5|St. Oswald, King and Martyr|M|r|0|W
8/6|Transfiguration of Our Lord|M|w|0|W
8/7|Feast of the Name of Jesus|M|w|0|W
8/8|St. Cyriac and Companions, Martyrs|M|r|0|W
8/10|St. Laurence, Deacon and Martyr|D|r|0|W
8/11|St. Tiburtius, Martyr|M|r|0|W
8/13|St. Hippolytus and Companions, Martyrs|M|r|0|W
8/15|Assumption of Mary & Octave|P|w|7|W
8/17|Octave Day of St. Laurence|M|r|0|W
8/24|St. Bartholomew, Apostle|D|r|0|W
8/27|St. Rufus, Martyr|M|r|0|W
8/28|St. Augustine of Hippo|D|w|0|W
8/29|Beheading of St. John the Baptist|D|r|0|W
8/29|St. Sabina, Virgin|M|w|0|W
8/30|Sts. Felix and Adauctus, Martyrs|M|r|0|W
8/31|St. Cuthburga, Virgin|M|w|0|W
9/1|St. Giles, Abbot|M|w|0|W
9/4|Translation of St. Cuthbert, Bishop|M|w|0|W
9/5|St. Bertin, Abbot|M|w|0|W
9/8|Nativity of the Virgin Mary & Octave|P|w|7|W
9/9|Feast of St. Ciarán of Clonmacnoise|D|w|0|I
9/14|Exaltation of the Holy Cross|D|r|0|W
9/16|St. Edith, Virgin|M|w|0|W
9/17|St. Lambert, Bishop and Martyr|M|r|0|W
9/21|St. Matthew, Apostle and Evangelist|D|r|0|W
9/22|St. Maurice and Companions, Martyrs|M|r|0|W
9/23|St. Thecla, Virgin|M|w|0|W
9/25|Feast of St. Finbarr of Cork|D|w|0|I
9/25|St. Firmin, Bishop and Martyr|M|r|0|W
9/26|Sts. Cyprian and Justina, Martyrs|M|r|0|W
9/27|Sts. Cosmas and Damian, Martyrs|M|r|0|W
9/29|Michaelmas (Feast of St. Michael)|P|w|0|W
9/30|St. Jerome, Priest and Doctor|M|w|0|W
10/1|Sts. Remigius, Germanus, Vedast and Bavo, Bishops|M|w|0|W
10/2|St. Leger, Bishop and Martyr|M|r|0|W
10/6|St. Faith, Virgin and Martyr|M|r|0|W
10/7|Sts. Mark, Marcellus and Apuleius, Martyrs|M|r|0|W
10/9|St. Denys and Companions, Martyrs|M|r|0|W
10/10|St. Gereon and Companions, Martyrs|M|r|0|W
10/11|St. Nicasius and Companions, Martyrs|M|r|0|W
10/13|Feast of St. Edward the Confessor|D|w|0|W
10/14|St. Calixtus, Pope and Martyr|M|r|0|W
10/15|St. Wulfran, Bishop and Confessor|M|w|0|W
10/16|St. Michael in Monte Tumba|M|w|0|W
10/17|St. Etheldreda, Virgin|M|w|0|W
10/18|St. Luke, Evangelist|D|r|0|W
10/19|St. Frideswide, Virgin|M|w|0|W
10/21|The Eleven Thousand Virgins|M|r|0|W
10/23|St. Romanus, Archbishop of Rouen|M|w|0|W
10/25|Sts. Crispin and Crispinian, Martyrs|M|r|0|W
10/28|Sts. Simon and Jude, Apostles|D|r|0|W
11/1|All Saints (All Hallows)|P|w|0|W
11/2|All Souls (soul-cakes)|P|v|0|W
11/3|Feast of St. Malachy of Armagh|D|w|0|I
11/3|St. Winifred, Virgin and Martyr|M|r|0|W
11/6|St. Leonard, Abbot|M|w|0|W
11/8|The Four Crowned Martyrs|M|r|0|W
11/9|St. Theodore, Martyr|M|r|0|W
11/11|Martinmas / Saint Martin's Lent|D|w|0|W
11/13|St. Brice, Bishop and Confessor|M|w|0|W
11/14|Feast of St. Laurence O'Toole|D|w|0|I
11/15|St. Machutus (Malo), Bishop and Confessor|M|w|0|W
11/16|St. Edmund, Archbishop|M|w|0|W
11/17|St. Hugh, Bishop and Confessor|M|w|0|W
11/18|Octave Day of St. Martin|M|w|0|W
11/20|St. Edmund, King and Martyr|M|r|0|W
11/22|St. Cecilia, Virgin and Martyr|D|r|0|W
11/23|St. Clement, Pope and Martyr|M|r|0|W
11/24|St. Chrysogonus, Martyr|M|r|0|W
11/25|St. Katherine of Alexandria|D|r|0|W
11/26|St. Linus, Pope and Martyr|M|r|0|W
11/30|St. Andrew, Apostle|D|r|0|W
12/4|St. Osmund, Bishop and Confessor|M|w|0|W
12/6|Feast of St. Nicholas (Boy Bishop Rule)|D|w|0|W
12/7|Octave Day of St. Andrew|M|r|0|W
12/8|Conception of the Blessed Virgin Mary|D|w|0|W
12/13|St. Lucy, Virgin and Martyr|D|r|0|W
12/21|St. Thomas, Apostle|D|r|0|W
12/26|St. Stephen, First Martyr (Stephenmas)|D|r|0|K
12/27|St. John, Apostle and Evangelist|D|w|0|K
12/28|Holy Innocents (Childermas)|D|r|0|K
12/29|Martyrdom of St. Thomas Becket|D|r|0|K`.split('\n').map(l => {
    const [md, name, rank, color, oct, src] = l.split('|'), [m, d] = md.split('/').map(Number);
    return { m, d, name, rank, color, oct: +oct, src };
  });
  // vigil fasts: eve of the feast (anticipated to Saturday when it falls on a Sunday). [m,d,keyForNotes,name]
  const VIGILS = [[2, 2, 'Purification'], [2, 24, 'St. Matthias'], [3, 25, 'Lady Day'], [6, 24, 'St. John the Baptist'], [6, 29, 'Sts. Peter and Paul'], [7, 25, 'St. James'],
    [8, 10, 'St. Laurence'], [8, 15, 'the Assumption', 'Vigil Fast of the Assumption'], [8, 24, 'St. Bartholomew'], [9, 21, 'St. Matthew'], [10, 28, 'Sts. Simon and Jude'], [11, 1, 'All Hallows', 'Vigil Fast of All Hallows'],
    [11, 30, 'St. Andrew'], [12, 21, 'St. Thomas'], [12, 25, 'Christmas', 'Vigil Fast of Christmas']];
  const RANK = { P: 'Principal Feast', D: 'Double Feast', L: 'Lesser Double', S: 'Feast', M: 'Saint of the Missal' };
  const SCORE = { P: 90, D: 60, L: 45, S: 30, M: 30 };


  // ---- Proper texts of Masses transcribed from the Sarum Missal --------------------------------
  // Source: F. E. Warren, 'The Sarum Missal in English' (1911), Part II, Proper of Saints (public domain).
  // Scripture is shown live from the Douay-Rheims (public domain). Warren cites English Bible numbering, so each
  // reference below was converted to Douay numbering and checked against the Douay text (Sirach 44-45, Psalms 88, 109).
  // Parts with only `sum` give a plain summary of the prayer: the exact wording of the Collect, Secret and Postcommunion
  // has NOT yet been transcribed, and nothing has been invented to fill the gap.
  const MASS = {
    '3/17': { title: 'Mass of St. Patrick, Bishop and Confessor', source: "Warren, Sarum Missal in English, Part II (Mar. 17)",
      note: "Verified: this Mass appears in Warren's English Sarum Missal. Warren's footnote adds: 'An almost entirely different Mass is provided for St. Patrick's Day in the printed Sarum Missals of 1494, 1497, 1498.' Those printed missals are closer to the period of c. 1500, and their Mass has not yet been read.",
      parts: [
        { k: 'Introit', pr: "Ecclus. xlv. 24 (Warren) = Sirach 45:30 (Douay); psalm verse 'My song shall be alway of the loving-kindness of the Lord' = Ps. 88:2 (Douay)", ref: 'sirach 45:30|psalms 88:2' },
        { k: 'Collect', sum: 'Prayer that, honouring the feast of the blessed confessor and bishop Patrick, we may increase in devotion and further our salvation. (Summary only — exact wording not yet transcribed.)' },
        { k: 'Epistle', pr: 'Ecclus. xliv. 16, 17, 19–23; xlv. 3, 7, 16 (Warren) = Sirach 44:16–17; 44:20–26; 45:2–3; 45:8–9; 45:20 (Douay)', ref: 'sirach 44:16-17|sirach 44:20-26|sirach 45:2-3|sirach 45:8-9|sirach 45:20' },
        { k: 'Gradual', pr: 'Ps. cx. 4 and 1 (Warren) = Ps. 109:4 and 1 (Douay)', ref: 'psalms 109:4|psalms 109:1' },
        { k: 'Tract', pr: "'Blessed is the man that feareth…' (Warren: as at the Common of a Confessor Bishop) = Ps. 111:1 (Douay), first verse only", ref: 'psalms 111:1' },
        { k: 'Gospel', pr: 'St. Matt. xxiv. 42–47', ref: 'matthew 24:42-47' },
        { k: 'Offertory', pr: 'Ps. lxxxix. 21, 22 (Warren) = Ps. 88:21–22 (Douay)', ref: 'psalms 88:21-22' },
        { k: 'Secret', sum: 'Prayer that the gifts offered in honour of Patrick may be profitable to salvation. (Summary only.)' },
        { k: 'Communion', pr: 'St. Luke xii. 42', ref: 'luke 12:42' },
        { k: 'Postcommunion', sum: "Prayer that, through Patrick's prayers, the sacrament may bring us the fruit of redemption. (Summary only.)" }
      ] },
    '2/1': { title: 'Mass of St. Bridget, Virgin', source: 'Warren, Sarum Missal in English, Part II (Feb. 1)',
      note: "Verified: this Mass appears in Warren's English Sarum Missal under 'St. Bridget, Virgin' on Feb. 1. The Missal does not say which Bridget; Feb. 1 is the day of Brigid of Kildare. The Office is 'The rich also among the people…' as for St. Agnes II.",
      parts: [
        { k: 'Collect', sum: "Prayer that the prayers of saint Bridget, thy virgin, which are pleasing to thee, may aid us. (Summary only.)" },
        { k: 'Epistle', pr: '2 Cor. x. 17, 18; xi. 1, 2', ref: '2 corinthians 10:17-18|2 corinthians 11:1-2' },
        { k: 'Gospel', pr: 'St. Matt. xiii. 44–52', ref: 'matthew 13:44-52' },
        { k: 'Communion', pr: 'St. Matt. xxv. 4, 6', ref: 'matthew 25:4|matthew 25:6' }
      ] }
  };

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
      if (same(e, d)) items.push({ title: f.name, score: SCORE[f.rank], rank: RANK[f.rank], color: f.color, season: t.season, noteKey: f.name, feast: true, src: f.src, mk: f.m + '/' + f.d, transferred: e.getUTCDate() !== f.d || e.getUTCMonth() + 1 !== f.m });
      if (f.oct) {
        const j = diff(d, e);
        if (j > 0 && j <= f.oct) items.push({ title: j === f.oct ? `Octave Day of ${f.name.replace(/ & Octave$/, '')}` : `Day within the Octave of ${f.name.replace(/ & Octave$/, '')}`, score: j === f.oct ? 62 : 38, rank: 'Octave Day', color: f.color, season: t.season, noteKey: f.name, src: f.src });
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
    const mass = w.mk && MASS[w.mk] || null;
    return { src: w.src || '', srcText: w.src ? SRCTXT[w.src] : '', mass, title: w.title, rank: w.rank, color: w.color, season: t.season, fast, notes: note(noteKey) || note(t.noteKey || ''), also, date: iso(d), ember: !!(items.find(i => i.ember)) };
  }

  return { sarum, temporal, setData, FIXED, VIGILS, MASS };
});
