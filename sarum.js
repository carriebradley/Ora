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
  const SRCTXT = { G: 'Dublin provincial constitutions (Gwynn 1944)', W: 'English Sarum Missal (supplement where no Irish source)', K: 'Standard kalendar', B: 'Irish Sarum kalendars (Buckley 2022)', I: 'Not found in the Irish Sarum kalendars surveyed — your addition, unverified' };
  const DAY = 864e5, diff = (a, b) => Math.round((a - b) / DAY), dow = d => d.getUTCDay(), same = (a, b) => a.getTime() === b.getTime();
  const sunBefore = d => add(d, -(dow(d) || 7)), sunOnOrBefore = d => add(d, -dow(d));
  let NOTES = {};
  function setData(data) { NOTES = (data && data.sarumNotes) || {}; }
  const note = k => NOTES[k] || '';

  // m/d|name|rank|color|octaveDays|src
  //   rank: P principal feast, D double, L lesser double, M saint with a Mass in the Missal (rank not given there)
  //   src (evidence):  B = in the Irish Sarum kalendars surveyed by Ann Buckley (2022); rank from the manuscripts (TCD 78, 1488–1500; TCD 88, after 1488)
  //                   (J major double, N nine lessons, T three lessons)
  //   src (evidence, continued): W = appears in Warren's 'Sarum Missal in English' Proper of Saints (verified, 2026 read)
  //                   K = standard medieval kalendar entry, not individually checked (Christmas-week days)
  //                   I = Irish/Gaelic addition kept from the user's own calendar — NOT in the Sarum Missal; unverified
  // Ranks P/D are carried over from the user's earlier calendar and are approximate; only Gregory (Inferior Double) and
  // the Annunciation (Lesser Double) were cross-checked against a modern Sarum ordo.
  const FIXED = `1/1|Circumcision of Our Lord (Octave Day of Christmas)|L|w|0|W
1/14|St. Felix, Bishop and Martyr|T|r|0|W
1/15|St. Maurus, Abbot and Confessor|T|w|0|W
1/16|St. Marcellus, Pope and Martyr|T|r|0|W
1/17|St. Sulpicius, Bishop and Confessor|T|w|0|W
1/18|St. Prisca, Virgin and Martyr|T|r|0|W
1/19|St. Wulstan, Bishop and Confessor|N|w|0|W
1/20|Sts. Fabian and Sebastian, Martyrs|N|r|0|W
1/21|St. Agnes, Virgin and Martyr|N|r|0|W
1/22|St. Vincent, Martyr|N|r|0|W
1/25|Conversion of St. Paul|N|w|0|W
1/27|St. Julian, Bishop|T|w|0|W
1/28|St. Agnes (second feast)|T|r|0|W
1/30|St. Bathild, Queen|T|w|0|W
1/31|St. Aidan (Maedoc) of Ferns|D|w|0|B
2/1|Feast of St. Brigid of Kildare (Imbolc)|D|w|0|B
2/2|Purification of Mary / Candlemas|J|w|0|W
2/3|St. Blase, Bishop and Martyr|T|r|0|W
2/5|St. Agatha, Virgin and Martyr|N|r|0|W
2/6|Sts. Vedast and Amandus, Bishops|N|w|0|W
2/10|St. Scholastica, Virgin|T|w|0|W
2/14|St. Valentine, Bishop and Martyr|T|r|0|W
2/16|St. Juliana, Virgin and Martyr|T|r|0|W
2/22|Chair of St. Peter|D|w|0|W
2/24|St. Matthias, Apostle|D|r|0|W
3/1|St. David, Bishop and Confessor|N|w|0|W
3/2|St. Chad, Bishop and Confessor|N|w|0|W
3/5|St. Ciarán (Kieran) of Saighir|N|w|0|B
3/7|Sts. Perpetua and Felicitas, Martyrs|T|r|0|W
3/12|St. Gregory the Great, Pope (Inferior Double)|D|w|0|W
3/15|St. Eugene of Ardstraw|N|w|0|B
3/16|St. Finnian of Swords|N|w|0|B
3/17|Feast of St. Patrick|J|w|0|B
3/18|St. Edward, King and Martyr|N|r|0|W
3/20|St. Cuthbert, Bishop and Confessor|N|w|0|W
3/21|St. Benedict, Abbot|N|w|0|W
3/25|Lady Day (Annunciation)|L|w|0|W
4/3|St. Richard, Bishop|N|w|0|W
4/4|St. Ambrose, Bishop and Doctor|D|w|0|W
4/14|Sts. Tiburtius and Valerian, Martyrs|T|r|0|W
4/18|St. Laserian of Leighlin|D|w|0|B
4/19|St. Alphege, Bishop and Martyr|T|r|0|W
4/23|Feast of St. George|D|r|0|W
4/25|St. Mark, Evangelist (Major Litany)|D|r|0|W
4/28|St. Vitalis, Martyr|T|r|0|W
4/30|Deposition of St. Erkenwald, Bishop of London|D|w|0|W
5/1|Bealtaine / Feast of St. Philip & St. James|D|r|0|W
5/3|Invention of the Holy Cross|L|r|0|W
5/6|St. John before the Latin Gate|T|w|0|W
5/7|St. John of Beverley, Bishop and Confessor|T|w|0|W
5/10|Sts. Gordian and Epimachus, Martyrs|T|r|0|W
5/12|Sts. Nereus, Achilleus and Pancras, Martyrs|T|r|0|W
5/16|Feast of St. Brendan the Navigator|T|w|0|B
5/19|St. Dunstan, Archbishop and Confessor|N|w|0|W
5/25|St. Aldhelm, Bishop and Confessor|N|w|0|W
5/26|St. Augustine of Canterbury, Apostle of the English|D|w|0|W
5/28|St. Germanus, Bishop and Confessor|T|w|0|W
5/31|St. Petronilla, Virgin|T|w|0|W
6/1|St. Nicomede, Martyr|T|r|0|W
6/2|Sts. Marcellinus and Peter, Martyrs|T|r|0|W
6/3|Feast of St. Kevin of Glendalough|N|w|0|B
6/5|St. Boniface and Companions, Martyrs|T|r|0|W
6/8|Sts. Medard and Godard, Bishops|T|w|0|W
6/9|Feast of St. Colmcille (Columba)|N|w|0|B
6/9|Translation of St. Edmund, Archbishop|N|w|0|W
6/10|Translation of Sts. Patrick, Columba and Brigit|N|w|0|B
6/11|St. Barnabas, Apostle|N|r|0|W
6/12|Sts. Basilides, Cyrinus, Nabor and Nazarius, Martyrs|T|r|0|W
6/14|St. Basil, Bishop and Confessor|T|w|0|W
6/15|Sts. Vitus, Modestus and Crescentia, Martyrs|T|r|0|W
6/16|Translation of St. Richard|N|w|0|W
6/17|St. Moling of Ferns|N|w|0|B
6/18|Sts. Mark and Marcellian, Martyrs|T|r|0|W
6/19|Sts. Gervase and Protase, Martyrs|T|r|0|W
6/20|Translation of St. Edward, King and Martyr|N|r|0|W
6/22|St. Alban, Martyr|N|r|0|W
6/23|St. Etheldreda, Virgin (Vigil of St. John the Baptist)|T|w|0|W
6/24|Nativity of St. John the Baptist|L|w|0|W
6/26|Sts. John and Paul, Martyrs|T|r|0|W
6/29|Feast of Sts. Peter and Paul & Octave|L|r|7|W
6/30|Commemoration of St. Paul|N|r|0|W
7/2|Visitation of the Blessed Virgin Mary|J|w|0|W
7/4|Translation and Ordination of St. Martin|N|w|0|W
7/7|Translation of St. Thomas Becket & Octave|L|w|7|W
7/10|The Seven Brothers, Martyrs|T|r|0|W
7/11|Translation of St. Benedict, Abbot|N|w|0|W
7/15|Translation of St. Swithun|N|w|0|W
7/16|Translation of St. Osmund, Bishop and Confessor|N|w|0|W
7/17|St. Kenelm, King and Martyr|T|r|0|W
7/18|St. Arnulph, Bishop and Martyr|T|r|0|W
7/20|St. Margaret, Virgin and Martyr|N|r|0|W
7/21|St. Praxedes, Virgin|T|w|0|W
7/22|St. Mary Magdalene|D|w|0|G
7/23|St. Apollinaris, Martyr|T|r|0|W
7/25|St. James, Apostle|L|r|0|W
7/26|St. Anne, Mother of Mary|D|w|0|G
7/27|The Seven Sleepers|T|w|0|W
7/28|St. Samson, Bishop (with St. Pantaleon)|T|w|0|W
7/29|Sts. Felix, Simplicius, Faustinus and Beatrice, Martyrs|T|r|0|W
7/30|Sts. Abdon and Sennen, Martyrs|T|r|0|W
7/31|St. Germanus, Bishop and Confessor|T|w|0|W
8/1|Lammas / St. Peter in Chains (Lughnasadh)|N|w|0|W
8/2|St. Stephen, Pope and Martyr|T|r|0|W
8/3|Invention of St. Stephen, Protomartyr|N|r|0|W
8/5|St. Oswald, King and Martyr|T|r|0|W
8/6|Transfiguration of Our Lord|L|w|0|W
8/7|Feast of the Name of Jesus|J|w|0|W
8/8|St. Cyriac and Companions, Martyrs|M|r|0|W
8/9|St. Romanus, Martyr (Vigil of St. Laurence)|M|r|0|W
8/10|St. Laurence, Deacon and Martyr|N|r|0|W
8/11|St. Tiburtius, Martyr|M|r|0|W
8/13|St. Hippolytus and Companions, Martyrs|N|r|0|W
8/15|Assumption of Mary & Octave|P|w|7|W
8/17|Octave Day of St. Laurence|M|r|0|W
8/18|St. Agapitus, Martyr|M|r|0|W
8/19|St. Magnus, Martyr|M|r|0|W
8/23|Sts. Timothy and Apollinaris, Martyrs|T|r|0|W
8/24|St. Bartholomew, Apostle|D|r|0|W
8/25|St. Michan of Dublin|N|w|0|B
8/27|St. Rufus, Martyr|T|r|0|W
8/28|St. Augustine of Hippo|D|w|0|W
8/29|Beheading of St. John the Baptist|N|r|0|W
8/29|St. Sabina, Virgin|M|w|0|W
8/30|Sts. Felix and Adauctus, Martyrs|T|r|0|W
8/31|St. Cuthburga, Virgin|T|w|0|W
9/1|St. Giles, Abbot|N|w|0|W
9/4|Translation of St. Cuthbert, Bishop|N|w|0|W
9/5|St. Bertin, Abbot|T|w|0|W
9/6|St. Mac Cuilinn of Lusk|T|w|0|B
9/8|Nativity of the Virgin Mary & Octave|J|w|7|W
9/9|Feast of St. Ciarán of Clonmacnoise|D|w|0|I
9/9|St. Gorgonius, Martyr|M|r|0|W
9/11|Sts. Protus and Hyacinth, Martyrs|M|r|0|W
9/14|Exaltation of the Holy Cross|L|r|0|W
9/16|St. Edith, Virgin|N|w|0|W
9/17|St. Lambert, Bishop and Martyr|T|r|0|W
9/21|St. Matthew, Apostle and Evangelist|D|r|0|W
9/22|St. Maurice and Companions, Martyrs|N|r|0|W
9/23|St. Thecla, Virgin|T|w|0|W
9/25|Feast of St. Finbarr of Cork|D|w|0|I
9/25|St. Firmin, Bishop and Martyr|T|r|0|W
9/26|Sts. Cyprian and Justina, Martyrs|T|r|0|W
9/27|Sts. Cosmas and Damian, Martyrs|T|r|0|W
9/29|Michaelmas (Feast of St. Michael)|D|w|0|W
9/30|St. Jerome, Priest and Doctor|D|w|0|W
10/1|Sts. Remigius, Germanus, Vedast and Bavo, Bishops|N|w|0|W
10/2|St. Thomas of Hereford, Bishop and Confessor (middle lessons of St. Leger)|N|w|0|W
10/6|St. Faith, Virgin and Martyr|T|r|0|W
10/7|Sts. Mark, Marcellus and Apuleius, Martyrs|T|r|0|W
10/9|St. Denys and Companions, Martyrs|N|r|0|W
10/10|St. Gereon and Companions, Martyrs|T|r|0|W
10/11|St. Nicasius and Companions, Martyrs|T|r|0|W
10/11|St. Canice of Kilkenny|D|w|0|B
10/13|Feast of St. Edward the Confessor|D|w|0|W
10/14|St. Calixtus, Pope and Martyr|D|r|0|W
10/15|St. Wulfran, Bishop and Confessor|N|w|0|W
10/16|St. Michael in Monte Tumba|N|w|0|W
10/17|Translation of St. Etheldreda, Virgin|N|w|0|W
10/18|St. Luke, Evangelist|D|r|0|W
10/19|St. Frideswide, Virgin|N|w|0|W
10/21|The Eleven Thousand Virgins|N|r|0|W
10/23|St. Romanus, Archbishop of Rouen|T|w|0|W
10/25|Sts. Crispin and Crispinian, Martyrs|N|r|0|W
10/28|Sts. Simon and Jude, Apostles|D|r|0|W
10/31|St. Quintin, Martyr|T|r|0|W
11/1|All Saints (All Hallows)|J|w|0|W
11/2|All Souls (soul-cakes)|D|v|0|W
11/3|Feast of St. Malachy of Armagh|N|w|0|B
11/3|St. Winifred, Virgin and Martyr|N|r|0|W
11/6|St. Leonard, Abbot|N|w|0|W
11/8|The Four Crowned Martyrs|T|r|0|W
11/9|St. Theodore, Martyr|T|r|0|W
11/11|Martinmas / Saint Martin's Lent|N|w|0|W
11/13|St. Brice, Bishop and Confessor|T|w|0|W
11/14|Feast of St. Laurence O'Toole|N|w|0|B
11/15|St. Machutus (Malo), Bishop and Confessor|N|w|0|W
11/16|St. Edmund, Archbishop|N|w|0|W
11/17|St. Hugh, Bishop and Confessor|N|w|0|W
11/18|Octave Day of St. Martin|T|w|0|W
11/20|St. Edmund, King and Martyr|N|r|0|W
11/22|St. Cecilia, Virgin and Martyr|N|r|0|W
11/23|St. Clement, Pope and Martyr|N|r|0|W
11/24|St. Chrysogonus, Martyr|T|r|0|W
11/25|St. Katherine of Alexandria|D|r|0|G
11/26|St. Linus, Pope and Martyr|T|r|0|W
11/29|Sts. Saturninus and Sisinnius, Martyrs|T|r|0|W
11/30|St. Andrew, Apostle|D|r|0|W
12/4|St. Osmund, Bishop and Confessor|N|w|0|W
12/6|Feast of St. Nicholas (Boy Bishop Rule)|N|w|0|W
12/7|Octave Day of St. Andrew|T|r|0|W
12/8|Conception of the Blessed Virgin Mary|L|w|0|W
12/12|St. Finnian of Clonard|N|w|0|B
12/13|St. Lucy, Virgin and Martyr|N|r|0|W
12/21|St. Thomas, Apostle|D|r|0|W
12/26|St. Stephen, First Martyr (Stephenmas)|L|r|0|W
12/27|St. John, Apostle and Evangelist|L|w|0|W
12/28|Holy Innocents (Childermas)|L|r|0|W
12/29|Martyrdom of St. Thomas Becket|L|r|0|W
12/31|St. Silvester, Pope and Confessor|N|w|0|W`.split('\n').map(l => {
    const [md, name, rank, color, oct, src] = l.split('|'), [m, d] = md.split('/').map(Number);
    return { m, d, name, rank, color, oct: +oct, src };
  });
  /* ---------- How it was kept: short notes on observance, each tagged by the kind of evidence ----------
     tag: I = documented for Ireland c. 1400–1540 · E = documented for the Sarum Use / late-medieval England (used as the supplement)
          F = later folklore (period of the evidence given) · U = uncertain
     src keys: see KSRC. */
  const KSRC = {
    W: 'Warren, The Sarum Missal in English (1911): 1526 kalendar, rubrics and index',
    B: 'Buckley, "Insular Saints in Irish Sarum Kalendars of the Office" (2022)',
    H: 'Harris, History and Antiquities of the City of Dublin (1766), ch. 7, citing the Dublin Chain Book',
    C: 'Catholic Encyclopedia (1911), "St. Patrick\'s Purgatory"',
    D: 'Duffy, The Stripping of the Altars (1992)',
    R: 'Hutton, The Rise and Fall of Merry England (1994) and The Stations of the Sun (1996)',
    K: 'Danaher, The Year in Ireland (1972): folklore collected mainly in the 19th–20th centuries',
    M: 'MacNeill, The Festival of Lughnasa (1962)',
    L: 'Fourth Lateran Council (1215), canon 21',
    O: 'Early Irish monastic texts (8th–9th c.), e.g. the Céli Dé rules',
    T: 'Fletcher, "Early Dublin Drama", in Drama, Performance, and Polity in Pre-Cromwellian Ireland (2000)',
    P: 'Wordsworth, Ceremonies and Processions of the Cathedral Church of Salisbury (1901), with extracts from the printed Sarum Processionals of 1502–1558',
    G: 'Gwynn, "Provincial and Diocesan Decrees of the Diocese of Dublin during the Anglo-Norman Period", Archivium Hibernicum 11 (1944): constitutions of Bicknor (c. 1320), John of St Paul (1352) and Minot (1367)'
  };
  const KEPT = {
    'note:Sundays after Trinity (Green Season)': [['E', 'Every Sunday began with the blessing of salt and water and a procession round the church, sprinkling holy water. After the octave of Trinity an antiphon of the Holy Cross ("Adoramus crucis signaculum" or "Salvator mundi") was sung, and the procession returned to the choir with an antiphon of Our Lady.', 'W P']],
    '1/31': [['I', 'Bicknor\'s provincial council (c. 1320) made the feast of Aidan (Maedóc) in the diocese of Ferns a double, kept with ruling of the choir throughout the province. The people of each diocese were to do no farm work on their patron\'s day and go to their parish church for the services.', 'G']],
    '4/18': [['I', 'Bicknor\'s provincial council (c. 1320) made the feast of Laserian in the diocese of Leighlin a double, kept with ruling of the choir throughout the province. The people of each diocese were to do no farm work on their patron\'s day and go to their parish church for the services.', 'G']],
    '7/22': [['I', 'In 1367 Archbishop Minot made St Mary Magdalene a double throughout the province of Dublin, with a duty to hear Mass in the parish church and abstain from all servile, farm and manual work.', 'G']],
    '11/25': [['I', 'St Katherine was made a double and a holy day in the province of Dublin in 1352. In 1367 work was again allowed when needed, because the extra holidays were being spent in taverns.', 'G']],
    '7/26': [['I', 'In 1352 St Anne was made a double and a holy day in the province of Dublin, together with the Translation of St Thomas and St Katherine. In 1367 Archbishop Minot kept them as doubles but allowed work outside church when needed, especially to help the poor at harvest. He complained that many people spent these new holidays "in taverns and drunkenness" instead of at church.', 'G']],
    'title:Easter Monday': [['I', 'Easter Monday was "Black Monday" in Dublin: the mayor and citizens rode out in a civic progress, a custom shared with Chester.', 'T']],
    // ----- fasts -----
    'fast:lent': [['E', 'A Lenten fast day: one meal only, eaten in the afternoon after the hour of None (by 1500 it was often taken nearer midday). No meat, and in Lent no eggs, milk, butter or cheese either (the "white meats") unless dispensed; fish was the Lenten food.', 'D R']],
    'fast:ember': [['E', 'Ember Days were fast days on the Wednesday, Friday and Saturday of the four seasons. Ordinations were held on Ember Saturday. The 1526 Sarum kalendar fixes the autumn fast "always on the Wednesday after the Exaltation of the Cross."', 'W']],
    'fast:rogation': [['E', 'Rogation days: the parish walked in procession behind the cross and banners singing the litany, asking blessing on the growing crops; the Missal says banners were carried on the Rogation Days. In English parishes this was also when the parish boundaries were walked ("beating the bounds"). Meat was not eaten.', 'W R']],
    'fast:vigil': [['E', 'A vigil fast: one meal and no meat, kept on the eve of a great feast. When the eve fell on a Sunday, the fast was kept on the Saturday instead.', 'D'], ['I', 'In 1367 Archbishop Minot of Dublin forbade dances, wrestling and "theatrical games" in churches and churchyards, "especially on vigils and feasts of saints", and banned markets in churchyards.', 'G']],
    'fast:friday': [['E', 'Every Friday was a day of abstinence from meat in memory of the Passion (Christmas Day was the usual exception). Saturday abstinence was also widely kept in honour of Our Lady.', 'D R'], ['F', 'Irish weekday names preserve an older habit of fasting on Wednesdays and Fridays (Céadaoin, "first fast"; Aoine, "fast"). Wednesday and Friday fasting is documented in early Irish monastic rules; how widely lay people kept the Wednesday fast c. 1500 is not known.', 'O']],
    'fast:martin': [['U', 'The "Lent of St Martin", a fast from Martinmas (11 November) to Christmas, is old: it is found in 6th-century Gaul, and early Irish monastic texts know a winter "Lent" before Christmas. Whether lay people in Ireland still kept it c. 1500 has not been confirmed. Sarum Advent itself had no general fast apart from the Ember Days and the Christmas vigil.', 'O']],
    // ----- seasons and movable days -----
    'note:Season of Advent': [['E', 'No Gloria in excelsis; the deacon and subdeacon wore folded chasubles instead of dalmatics. Weddings were not celebrated in Advent. From 16 December the great "O" antiphons were sung at Vespers; the 1526 kalendar marks the day "O Sapientia".', 'W'], ['I', 'In 1352 the Dublin province ordered the sentences of excommunication to be read out in every parish church three times a year: on the first Sunday of Advent, on Septuagesima Sunday and on the Sunday before Lammas. They were read at Mass, with candles lit and bells rung, and explained in the people\'s own language.', 'G']],
    'note:Christmastide & The 12 Days of Christmas': [['E', 'Three Masses on Christmas Day: at midnight, at dawn and in the day. The Twelve Days were a holiday from work, with feasting, carols and games until Twelfth Night.', 'W R'], ['I', 'In Dublin the craft guilds played a new play each day of Christmas 1528 before the Lord Deputy: the tailors played Adam and Eve, the shoemakers Crispin and Crispinian, the carpenters Joseph and Mary.', 'H'], ['I', 'In 1509 St Patrick\'s Cathedral, Dublin, paid Thomas Mayowe for "playing with seven lights" at Christmas and at the Purification.', 'T']],
    'note:Epiphany & Octave of Epiphany (Nollaig Beag)': [['E', 'Epiphany was a Principal Double, the end of the Twelve Days. Twelfth Night was the climax of the Christmas revels in England.', 'W R'], ['F', 'The Irish name Nollaig Bheag ("Little Christmas"), and Nollaig na mBan ("Women\'s Christmas") on this day, are recorded in later folklore.', 'K']],
    'note:Septuagesima Sunday (Pre-Lent Begins)': [['E', 'Alleluia is no longer sung from Septuagesima until Easter, and from Septuagesima the deacon and subdeacon wear chasubles. The season of marriages closed until after Easter.', 'W'], ['I', 'One of the three Sundays (with the first Sunday of Advent and the Sunday before Lammas) when the province of Dublin had the sentences of excommunication read out at Mass, with candles and bells, in the people\'s own language (1352).', 'G']],
    'note:Quinquagesima & Shrovetide Carnival': [['E', 'Shrovetide: people went to confession ("were shriven") before Lent and used up meat, eggs and fat. Shrove Tuesday was a day of feasting and sports in English towns.', 'R'], ['I', 'In Dublin, Shrove Tuesday ("Corperaunt") brought horse-riding and the civic ceremony of the "bearing of balls"; the 1466 city assembly guaranteed free passage to people coming in for it.', 'T']],
    'note:Ash Wednesday (Start of Lent / An Charghas)': [['E', 'Ashes were blessed and put on the heads of clergy and people. Public penitents were solemnly put out of the church, with a procession and banners, to be readmitted on Maundy Thursday.', 'W']],
    'note:Season of Lent (An Charghas)': [['E', 'From the Monday after the first Sunday of Lent all crosses and images in the church were covered, and a great Lenten veil hung before the high altar. Everyone was bound to confess and receive Communion at least once a year, at Easter, so Lent was the season of confession.', 'W L D']],
    'note:Spring Ember Days (Lenten Fast)': [['E', 'Ember Days in the first week of Lent: Wednesday, Friday and Saturday. Ordinations were held on the Saturday.', 'W']],
    'note:Passiontide': [['E', 'From Passion Sunday the Gloria Patri is left out of the psalm at the start of Mass; the church stays veiled for Lent.', 'W']],
    'title:Palm Sunday': [['E', 'Branches for the clergy, and flowers and leaves for the people, were blessed and carried in an outdoor procession; the Gospel was read at stations, and the veiled rood was uncovered before the people as the procession re-entered the church. The Passion was then sung at Mass.', 'W P D']],
    'title:Maundy Thursday': [['E', 'The bishop blessed the holy oils; penitents were reconciled; after Mass the altars were stripped and washed, and the "maundy" (the washing of feet) followed.', 'W']],
    'title:Good Friday': [['E', 'The clergy, barefoot, brought out the veiled cross; it was uncovered and the clergy and people "crept to the cross" on their knees to kiss it. The cross, with the reserved Host, was then laid in the Easter Sepulchre and watched until Easter morning.', 'W D'], ['I', 'In 1352 Archbishop John of St Paul ordered that no farm or other secular work be done anywhere in the province of Dublin on Good Friday, and that the day be kept with fasting and prayer. Some people had been working on it.', 'G']],
    'title:Holy Saturday': [['E', 'All lights were put out, the new fire was struck and blessed, and the Paschal candle was lit from it; the font was blessed for baptism. The fast lasted until the Vigil.', 'W']],
    'note:Easter Sunday & Octave of Easter (Paschaltide)': [['E', 'Before Mass on Easter morning the cross was taken out of the Easter Sepulchre and carried in procession to "Christus resurgens"; the veiled images were uncovered. Most of the parish made their one Communion of the year at Easter.', 'W D L'], ['I', 'Dublin had its own Easter play, the Visitatio Sepulchri (the three Marys at the tomb), in two manuscripts of c. 1400. It was played in the early hours of Easter morning at the Easter Sepulchre in the church of St John the Evangelist beside Christ Church. An Easter play of the Resurrection was still put on at Christ Church in 1542.', 'T']],
    'note:Rogationtide Processions': [['E', 'The three Rogation days before Ascension: processions with cross and banners round the parish and fields, singing the litany, to bless the crops. Meat was not eaten.', 'W R']],
    'note:Vigil Fast of the Ascension': [['E', 'Rogation Wednesday, also the vigil of the Ascension.', 'W']],
    'note:Ascension Day & Octave of the Ascension': [['E', 'A Principal Double. In the procession before Mass the banners went in a set order: the lion banner first, then the lesser banners, and the dragon banner last.', 'W P']],
    'note:Vigil Fast of Pentecost': [['E', 'A principal feria and fast; as at Easter the font was blessed and baptisms were held.', 'W']],
    'note:Pentecost (Whitsun) & Whitsun Octave': [['E', 'Whitsunday was a Principal Double; Monday to Wednesday of Whitsun week were Lesser Doubles and holidays. In England Whitsun was the great season for parish "ales", feasts that raised money for the church.', 'W R'], ['I', 'At Whitsun 1509 St Patrick\'s Cathedral, Dublin, paid players "with the great angel and the little one and a dragon", and fed them through the feast. This was evidently a Pentecost play.', 'T']],
    'note:Summer Ember Days (Whitsuntide Fast)': [['E', 'Ember Days in Whitsun week, with ordinations on the Saturday.', 'W']],
    'note:Trinity Sunday': [['E', 'A Greater Double. Sarum counted the summer Sundays "after Trinity", where the Roman books counted them after Pentecost.', 'W']],
    'note:Feast of Corpus Christi & Octave': [['E', 'Corpus Christi, the Thursday after Trinity, was enjoined on the province of Canterbury in 1332. Its great feature was the procession carrying the Host through the streets.', 'W D'], ['I', 'In Dublin each guild provided a pageant for the Corpus Christi procession, recorded in the city\'s Chain Book: the glovers Adam and Eve, the mariners and vintners Noah\'s ark, the smiths Pharaoh\'s host, the Corpus Christi guild the Passion, and so on. In 1541 the lords of the Irish parliament rode in the Corpus Christi procession and "the Nine Worthies was played."', 'H'], ['I', 'Dublin\'s Corpus Christi pageant lists of 1498 (in the Chain Book) name at least sixteen guild pageants, made "by an olde law". The procession probably ended at St George\'s Chapel outside the walls. In 1554–6 the Tailors still paid a man "for playnge pilote a corpus criste day". Kilkenny is the one Irish town where Corpus Christi plays were certainly acted (16th century).', 'T']],
    'note:Autumn Ember Days (Holy Cross Fast)': [['E', 'Autumn Ember Days, fixed by the 1526 kalendar on the Wednesday after Holy Cross Day, with Friday and Saturday.', 'W']],
    'note:Winter Ember Days (Advent Fast)': [['E', 'Winter Ember Days in the third week of Advent (after St Lucy), with ordinations on the Saturday.', 'W']],
    'note:Vigil Fast of Christmas': [['E', 'The Christmas vigil was a strict fast; the Christmas Masses began at midnight.', 'W']],
    // ----- fixed feasts -----
    '1/1': [['E', 'The Circumcision, a Lesser Double and the octave day of Christmas. New Year\'s gifts were exchanged on this day, but the legal year in England and the English parts of Ireland began on 25 March.', 'W R']],
    '2/1': [['I', 'Brigid is in every Irish Sarum kalendar Buckley surveyed; a double in the Dublin province under Archbishop Bicknor (c. 1320), nine lessons in TCD 78.', 'B'], ['F', 'Brigid\'s crosses, the brat Bríde (a cloth left out for her blessing) and the Brídeóg procession are recorded in folklore of the 19th and 20th centuries; their medieval history is not documented.', 'K'], ['I', 'Bicknor\'s provincial council (c. 1320) made the feast of Brigid in the diocese of Kildare a double, kept with ruling of the choir throughout the province. The people of each diocese were to do no farm work on their patron\'s day and go to their parish church for the services.', 'G']],
    '2/2': [['E', 'Candlemas: candles were blessed for clergy and people at a station before Mass, and everyone walked in procession carrying a lit candle, then offered the candle. A Greater Double.', 'W P D'], ['I', 'In 1509 St Patrick\'s Cathedral, Dublin, paid Thomas Mayowe for "playing with seven lights" at Christmas and at the Purification (Candlemas).', 'T']],
    '3/17': [['I', 'Patrick\'s feast became a major double under Bicknor\'s constitutions (c. 1320) and was red-letter in the Irish kalendars. His relics, with Brigid\'s and Columba\'s, were enshrined at Downpatrick (see 10 June).', 'B'], ['I', 'St Patrick\'s Purgatory on Lough Derg drew pilgrims from all over Europe. Pope Alexander VI ordered the cave closed in 1497, and the order was carried out on St Patrick\'s Day; the pilgrimage soon resumed on Station Island.', 'C'], ['U', 'The idea that the Lenten fast was lifted for St Patrick\'s Day is not documented for c. 1500.', ''], ['I', 'In 1466 the Dublin city assembly guaranteed safe passage to everyone coming into the city for the feasts of Corpus Christi, St George and St Patrick "for procession and pilgrimage".', 'T'], ['I', 'Archbishop Bicknor\'s provincial council (c. 1320) made Patrick\'s day a double throughout the province of Dublin and ordered a solemn commemoration of Patrick once a week outside Lent. In 1367 Archbishop Minot confirmed it as a full holy day, with no work.', 'G']],
    '3/25': [['E', 'Lady Day, a Lesser Double, and the first day of the legal year in England and English Ireland (until 1752); a quarter day for rents.', 'W']],
    '4/23': [['I', 'Dublin kept St George\'s Day with a civic pageant recorded in the Chain Book: the past mayor provided the emperor and empress, the current mayor a horse for St George, with a maiden leading the dragon.', 'H'], ['E', 'An Inferior Double in the 1526 Sarum kalendar.', 'W'], ['I', 'In 1466 St George\'s Day drew crowds into Dublin. In the 1498 pageant lists the city\'s St George pageant, with the dragon, went in procession out to St George\'s Chapel beyond the walls.', 'T']],
    '4/25': [['E', 'St Mark: the Greater Litany, a procession with banners and litany (the kalendar notes "Greater Litany").', 'W']],
    '5/1': [['F', 'May Day (Bealtaine) customs such as May bushes, protecting milk and butter, and fires are recorded mainly in later folklore; early Irish texts (c. 900) mention Bealtaine fires.', 'K']],
    '6/10': [['I', 'The translation of Patrick, Columba and Brigit commemorates the enshrining of their relics together at Downpatrick in 1186. It is kept in the Irish Sarum kalendars.', 'B']],
    '6/24': [['E', 'Midsummer: bonfires were lit on St John\'s Eve in late-medieval England, and preachers explained the custom.', 'R'], ['F', 'St John\'s Eve bonfires in Ireland are documented from the 17th century and richly in later folklore.', 'K'], ['I', 'The Dublin Tailors\' guild accounts (16th century) record spending on the Midsummer festivities as well as Corpus Christi.', 'T']],
    '7/7': [['E', 'The Translation of St Thomas Becket. The 1526 kalendar notes that the Feast of Relics was kept on the first Sunday after it.', 'W'], ['I', 'Made a double and a holy day in the province of Dublin in 1352. In 1367 work was again allowed when needed, because the extra holidays were being spent in taverns.', 'G']],
    '8/1': [['E', 'Lammas ("loaf-mass"): in England bread from the new harvest was offered.', 'R'], ['F', 'Lughnasa gatherings on hilltops and at wells around 1 August are documented in detail only from later sources, though they have roots in early Irish assemblies.', 'M']],
    '8/7': [['E', 'The Name of Jesus, a Greater Double: a late-medieval devotion, often paired with the weekly Jesus Mass on Fridays.', 'W D']],
    '8/15': [['E', 'The Assumption, a Principal Double, with a vigil fast.', 'W'], ['F', '"Pattern" days at holy wells around mid-August are documented mostly after the Reformation.', 'K']],
    '9/14': [['E', 'Holy Cross Day, a Lesser Double. The autumn Ember fast followed on the next Wednesday.', 'W']],
    '9/29': [['E', 'Michaelmas: an Inferior Double and one of the English quarter days, when rents fell due and terms began.', 'W R']],
    '11/1': [['E', 'All Saints, a Greater Double. On the evening, and through the night into All Souls, church bells were rung for the dead.', 'W D']],
    '11/2': [['E', 'All Souls: Masses and the Office of the Dead (Placebo and Dirige) for all the faithful departed. Families paid for prayers and the bells were rung.', 'W D'], ['F', 'Soul cakes, and the Irish customs of Samhain night, are recorded in later folklore.', 'K']],
    '11/11': [['E', 'Martinmas: a feast of nine lessons (triple invitatory). In England it was the season for slaughtering and salting beef for the winter.', 'W R'], ['F', 'The Irish custom of shedding the blood of an animal on St Martin\'s Eve is recorded in 19th–20th-century folklore.', 'K']],
    '12/6': [['E', 'In English cathedrals and collegiate churches a boy bishop was chosen from the choirboys around St Nicholas and presided at services on Holy Innocents (28 December).', 'R P']],
    '12/8': [['E', 'The Conception of Blessed Mary, a Lesser Double.', 'W'], ['I', 'In 1352 the Conception of Our Lady was made a double throughout the province of Dublin and a holy day: people were to go to Mass in their parish church and do no servile, farm or manual work, as on her Nativity. Minot confirmed it in 1367.', 'G']],
    '12/28': [['E', 'Holy Innocents (Childermas). At Salisbury, at Vespers on the eve (27 December), the choirboys went in procession in silk copes, with lighted candles, to the altar of the Innocents. The boy bishop, in pontificals, censed the altar and said the collect of the Innocents. Childermas was also thought an unlucky day to begin any work.', 'P R']],
    '12/29': [['I', 'Becket\'s cult was strong in English Ireland: the great Augustinian abbey of St Thomas the Martyr in Dublin was founded in his honour in 1177.', '']],
    '11/14': [['I', 'Laurence O\'Toole, archbishop of Dublin (d. 1180, canonised 1225), was patron of Dublin and is in TCD 78 and TCD 88 with nine lessons.', 'B'], ['I', 'Bicknor\'s council (c. 1320) ordered Laurence O\'Toole\'s day to be kept as a double throughout the province of Dublin, and the Eleven Thousand Virgins and the Translation of St Patrick with nine lessons.', 'G']],
    '10/11': [['I', 'Canice was patron of St Canice\'s Cathedral, Kilkenny, and made a double under Bicknor\'s constitutions.', 'B'], ['I', 'Bicknor\'s provincial council (c. 1320) made the feast of Canice in the diocese of Ossory a double, kept with ruling of the choir throughout the province. The people of each diocese were to do no farm work on their patron\'s day and go to their parish church for the services.', 'G']],
  };
  function keptFor(d, w, t, fast, mk) {
    const out = [], add = (k, lab) => { for (const e of (KEPT[k] || [])) out.push({ tag: e[0], text: e[1], src: e[2].split(' ').filter(Boolean).map(s => KSRC[s]), about: lab }); };
    if (mk) add(mk, w.title);
    for (const p of ['Palm Sunday', 'Maundy Thursday', 'Good Friday', 'Holy Saturday']) if (t.title.startsWith(p)) add('title:' + p, t.title);
    if (/^Monday within the Octave of Easter/.test(t.title)) add('title:Easter Monday', t.title);
    if (t.noteKey) add('note:' + t.noteKey, t.title);
    if (w.noteKey && w.noteKey !== t.noteKey) add('note:' + w.noteKey, w.title);
    const f = fast || '';
    if (/Ember/.test(f)) add('fast:ember', 'Ember Day'); else if (/Rogation/.test(f)) add('fast:rogation', 'Rogation Day');
    else if (/Vigil|vigil/.test(f) && !/Christmas/.test(w.title)) add('fast:vigil', 'Vigil');
    if (/Lenten fast|Strict fast/.test(f) && t.season !== 'Advent' && !/Martin/.test(f)) add('fast:lent', 'Lenten fast');
    if (/Friday/.test(f)) add('fast:friday', 'Friday');
    if (/Martin/.test(f)) add('fast:martin', "St Martin's Lent");
    const seen = new Set(); return out.filter(o => { const k = o.text; if (seen.has(k)) return false; seen.add(k); return true; });
  }
  // vigil fasts: eve of the feast (anticipated to Saturday when it falls on a Sunday). [m,d,keyForNotes,name]
  const VIGILS = [[2, 2, 'Purification'], [2, 24, 'St. Matthias'], [3, 25, 'Lady Day'], [6, 24, 'St. John the Baptist'], [6, 29, 'Sts. Peter and Paul'], [7, 25, 'St. James'],
    [8, 10, 'St. Laurence'], [8, 15, 'the Assumption', 'Vigil Fast of the Assumption'], [8, 24, 'St. Bartholomew'], [9, 21, 'St. Matthew'], [10, 28, 'Sts. Simon and Jude'], [11, 1, 'All Hallows', 'Vigil Fast of All Hallows'],
    [11, 30, 'St. Andrew'], [12, 21, 'St. Thomas'], [12, 25, 'Christmas', 'Vigil Fast of Christmas']];
  const RANK = { P: 'Principal Double', J: 'Greater Double', L: 'Lesser Double', D: 'Inferior Double', N: 'Nine lessons', T: 'Three lessons', S: 'Feast', M: 'Memory only' };
  const SCORE = { P: 90, J: 72, L: 62, D: 55, N: 40, T: 32, S: 30, M: 30 };
  // Where the rank comes from (W rows): the 1526 Sarum kalendar printed in Warren (1911), with Warren's classification of doubles.
  const RANK_UNC = new Set([]), RANK_EXTRA = {
    '10/21': 'Rank: in England a simple feast of three lessons, but Procter and Wordsworth (Breviarium, fasc. III, 1886) note it had nine lessons in the province of Dublin.',
    '4/23': 'Rank: an Inferior Double in the 1526 Sarum kalendar. Procter and Wordsworth note that under the provincial constitutions of Canterbury (1415) it was a Greater Double; that ruling applied to the English province.',
    '10/14': 'Rank: Warren lists St Calixtus among the Inferior Doubles from the 1526 kalendar, but Procter and Wordsworth\'s table (1886) has him as a simple feast. The sources disagree.',
    '2/24': 'Rank: an Inferior Double of nine lessons in Procter and Wordsworth\'s table of feasts (Breviarium, fasc. III, 1886).'
  }, RANK_PLUS = new Set(["2/22", "7/7", "8/6", "8/28", "11/2", "4/30"]);
  function rankNote(f) {
    if (f.src === 'B' || f.src === 'I') return '';
    if (f.src === 'G') return 'Rank: a double in the province of Dublin under its provincial constitutions (1352 for St Anne and St Katherine, 1367 for St Mary Magdalene; Gwynn 1944). In the English Sarum kalendar it was a feast of nine lessons.';
    if (RANK_PLUS.has(f.m + '/' + f.d)) return "Rank: Warren (1911) lists this as a double that was kept as such although the 1526 Sarum kalendar does not mark it.";
    if (RANK_UNC.has(f.m + '/' + f.d)) return "";
    return RANK_EXTRA[f.m + '/' + f.d] || 'Rank: the 1526 Sarum kalendar (Warren, 1911) and the table of feasts in Procter and Wordsworth, Breviarium ad usum Sarum, fasc. III (1886).';
  }


  // Evidence notes for the Irish entries: Ann Buckley, 'Insular Saints in Irish Sarum Kalendars of the Office' (2022).
  const SRCNOTE = {
    "3/17": "Patrick is in every Irish Sarum kalendar Buckley surveyed, always a double and usually red-letter. Under Archbishop Bicknor's constitutions (c. 1320) his feast became a major double. TCD 78 (1488–1500) and TCD 88 (after 1488) both give him nine lessons, in red.",
    "2/1": "Procter and Wordsworth's table of Sarum feasts (1886) gives Brigid three lessons in England but notes she was a double in the diocese of Kildare and in the province of Dublin. Brigit is in every Irish Sarum kalendar surveyed. TCD 78 (1488–1500) has her in red with nine lessons; the Dublin province made her a double under Bicknor's constitutions (c. 1320). She is also in English Sarum kalendars.",
    "5/16": "Brendan of Clonfert: three lessons in TCD 78 and TCD 88, nine lessons in TCD 77 (Armagh, c. 1450).",
    "6/3": "Kevin: nine lessons in TCD 88; in the Irish kalendars but not among the saints named in Dublin's episcopal constitutions.",
    "6/9": "Colmcille shares 9 June with the Translation of St Edmund of Abingdon and is often a later addition. Absent from TCD 78 (1488–1500) and NLI 19954.",
    "11/3": "Malachy appears only in TCD 77 (Armagh Cathedral, c. 1450), with nine lessons. The ordinary Sarum saint of 3 November is Winifred.",
    "11/14": "Laurence O'Toole: in TCD 78, TCD 88 (nine lessons) and named in Dublin's constitutions.",
    "9/9": "Ciarán of Clonmacnoise on 9 September was not found in the Irish Sarum kalendars Buckley surveyed. They have Ciarán of Saighir on 5 March instead.",
    "9/25": "Finbarr was not found in the Irish Sarum kalendars Buckley surveyed.",
    "1/31": "Aidan of Ferns: a double under Bicknor's constitutions (c. 1320); nine lessons in TCD 78 and TCD 88.",
    "3/5": "Ciarán (Kieran) of Saighir: red-letter, nine lessons in TCD 78 (1488–1500).",
    "3/15": "Eugene of Ardstraw: nine lessons in TCD 88, marked 'Dublinie' in a 16th-century hand.",
    "3/16": "Finnian of Swords: nine lessons, a 16th-century addition in TCD 78; in TCD 88.",
    "4/18": "Laserian of Leighlin: a double under Bicknor's constitutions (c. 1320); nine lessons in TCD 88.",
    "6/10": "Translation of Patrick, Columba and Brigit: in every manuscript surveyed except TCD 77 and NLW 21604A.",
    "6/17": "Moling of Ferns: nine lessons in TCD 78.",
    "8/25": "Michan of Dublin: nine lessons in TCD 78; named in Dublin's constitutions.",
    "9/6": "Mac Cuilinn of Lusk: in TCD 78 and TCD 88; named in Dublin's constitutions.",
    "10/11": "Canice of Kilkenny: red-letter, nine lessons in TCD 78 (written for St Canice's, Kilkenny, 1488–1500); a double under Bicknor's constitutions (Ossory).",
    "12/12": "Finnian of Clonard: nine lessons in TCD 78; a 16th-century addition in TCD 88."
  };

  // ---- Proper texts of Masses transcribed from the Sarum Missal --------------------------------
  // Source: F. E. Warren, 'The Sarum Missal in English' (1911), Part II, Proper of Saints (public domain).
  // Scripture is shown live from the Douay-Rheims (public domain). Warren cites English Bible numbering, so each
  // reference below was converted to Douay numbering and checked against the Douay text (Sirach 44-45, Psalms 88, 109).
  // `tx` = Warren's English text, copied word for word. Epistle and Gospel are printed in the Missal only as the first and last
  // words (`inc`); the full Scripture is shown from the Douay text (`ref`).
  const MASS = {
    "3/17": {
      "title": "Mass of St. Patrick, Bishop and Confessor",
      "source": "Warren, The Sarum Missal in English (1911), Part II (Mar. 17), p. 313–314",
      "note": "Source tier: English Sarum, used as the supplement because no Irish-specific text has been found yet. Wording below is Warren's English, copied from the 1911 book. His footnote: 'An almost entirely different Mass is provided for St. Patrick's Day in the printed Sarum Missals of 1494, 1497, 1498.' Those printed missals are closer to c. 1500 and have not yet been read.",
      "parts": [
        {
          "k": "Introit (Office)",
          "tx": "Therefore was there a covenant of peace made with him by the Lord that he should be the chief of the sanctuary and of his people, and that he and his posterity should have the dignity of the priesthood for ever.\nPs. My song shall be alway of the loving-kindness of the Lord."
        },
        {
          "k": "Collect",
          "tx": "Grant, we beseech thee, almighty God, that honouring the feast of thy blessed confessor and bishop Patrick, we may both increase our devotion and further our salvation. Through etc."
        },
        {
          "k": "Epistle",
          "pr": "Ecclus. xliv. 16, 17, 19–23; xlv. 3, 7, 16",
          "inc": "Behold a high priest … a sweet savour.",
          "ref": "sirach 44:16-17|sirach 44:20-26|sirach 45:2-3|sirach 45:8-9|sirach 45:20"
        },
        {
          "k": "Gradual",
          "tx": "The Lord sware and will not repent: thou art a priest for ever after the order of Melchisedech.\nV. The Lord said unto my Lord: Sit thou on my right hand."
        },
        {
          "k": "Tract",
          "tx": "Blessed is the man that feareth the Lord: he hath great delight in his commandments.\nV. His seed shall be mighty upon earth: the generation of the faithful shall be blessed.\nV. Riches and plenteousness shall be in his house: and his righteousness endureth for ever."
        },
        {
          "k": "Gospel",
          "pr": "St. Matt. xxiv. 42–47",
          "inc": "Watch, therefore, … all his goods.",
          "ref": "matthew 24:42-47"
        },
        {
          "k": "Offertory",
          "tx": "I have found David my servant: with my holy oil have I anointed him. My hand shall hold him fast: and my arm shall strengthen him."
        },
        {
          "k": "Secret",
          "tx": "Regard, we beseech thee, O Lord, the gifts of thy people offered in honour of thy blessed confessor and bishop Patrick; and may the testimony borne to thy truth be profitable to our salvation. Through etc."
        },
        {
          "k": "Communion",
          "tx": "Faithful and wise is that servant whom his lord hath made ruler over his household, to give them their portion of meat in due season."
        },
        {
          "k": "Postcommunion",
          "tx": "Mercifully raise, O Lord, those whom thou dost refresh by the sacrament, through the prayers of thy holy confessor and bishop Patrick; that both in these mysteries and in our lives we may receive the fruit of our redemption. Through etc."
        }
      ]
    },
    "2/1": {
      "title": "Mass of St. Bridget, Virgin",
      "source": "Warren, The Sarum Missal in English (1911), Part II (Feb. 1), p. 287–288",
      "note": "Source tier: English Sarum. Warren's text, copied from the 1911 book. The Missal does not say which Bridget; Feb. 1 is the day of Brigid of Kildare. The Office is 'The rich also among the people etc.', as in the Mass for St. Agnes (II).",
      "parts": [
        {
          "k": "Introit (Office)",
          "tx": "The rich also among the people etc., as in the Mass for St. Agnes (II)."
        },
        {
          "k": "Collect",
          "tx": "We beseech thee, O Lord, that the prayers of saint Bridget, thy virgin, which are pleasing to thee, may aid us, and may never cease to demand thy loving-kindness towards us. Through etc."
        },
        {
          "k": "Epistle",
          "pr": "2 Cor. x. 17, 18; xi. 1, 2",
          "inc": "He that glorieth … virgin to Christ.",
          "ref": "2 corinthians 10:17-18|2 corinthians 11:1-2"
        },
        {
          "k": "Gradual",
          "tx": "Full of grace are thy lips, because God hath blessed thee for ever.\nV. Because of the word of truth, of meekness, and righteousness; and thy right hand shall teach thee terrible things."
        },
        {
          "k": "Alleluya",
          "tx": "V. According to thy worship and renown. Good luck have thou with thine honour; ride on."
        },
        {
          "k": "Gospel",
          "pr": "St. Matt. xiii. 44–52",
          "inc": "The kingdom of heaven … new and old.",
          "ref": "matthew 13:44-52"
        },
        {
          "k": "Offertory",
          "tx": "The virgins that be her fellows shall bear her company, and shall be brought unto thee."
        },
        {
          "k": "Secret",
          "tx": "We beseech thee, O Lord, that being reconciled unto us by the sacrifice now offered unto thee, through the intercession of blessed Bridget thy virgin, thou wouldest mercifully grant us thy assistance in our time. Through etc."
        },
        {
          "k": "Communion",
          "tx": "The five wise virgins took oil in their vessels with their lamps. And at midnight there was a cry made, Behold the bridegroom cometh; go ye out to meet Christ the Lord."
        },
        {
          "k": "Postcommunion",
          "tx": "May the gifts which we have received, O Lord, result favourably to thy faithful people, through the prayers of blessed Bridget thy virgin; and may she who pleased thee implore thy assistance for us. Through etc."
        }
      ]
    }
  };
  const TRIN = {
    "tr1": {
      "title": "Mass of the First Sunday after Trinity",
      "source": "Warren, The Sarum Missal in English (1911), Part I (Sundays after Trinity), pp. 365–406",
      "note": "Source tier: English Sarum (Warren's translation of the Sarum Missal), used as the supplement because no Irish-specific text for the Sundays has been found. The wording is Warren's English from the 1911 book (scanning errors repaired). Warren prints only the first and last words of the Epistle and Gospel; the full reading is shown in the Douay-Rheims Bible, which is not the wording of the Sarum Latin lectionary.",
      "parts": [
        {
          "k": "Introit (Office)",
          "tx": "My trust is in thy mercy, O Lord, and my heart is joyful in thy salvation. I will sing of the Lord, because he hath dealt so lovingly with me.\nPs. How long wilt thou forget me, O Lord, for ever: how long wilt thou hide thy face from me?"
        },
        {
          "k": "Collect",
          "tx": "O God, the strength of them that put their trust in thee, mercifully accept our prayers ; and because the weakness of our mortal nature can do nothing without thee, grant us the help of thy grace, that in keeping of thy commandments we may please thee both in will and deed. Through etc."
        },
        {
          "k": "Epistle",
          "pr": "1 St. John iv. 8–21",
          "inc": "God is love . . . his brother also.",
          "ref": "1 john 4:8-21"
        },
        {
          "k": "Gradual",
          "tx": "I said, Lord, be merciful unto me : heal my soul, for I have sinned against thee. ℣. Blessed is he that considereth the poor and needy : the Lord shall deliver him in the time of trouble."
        },
        {
          "k": "Alleluya",
          "tx": "Alleluya. ℣. Ponder my words, O Lord : consider my meditation. No Sequence is said when the service is of the Sunday, until Advent."
        },
        {
          "k": "Gospel",
          "pr": "St. Luke xvi. 19–31",
          "inc": "There was a certain rich . . . rose from the dead.",
          "ref": "luke 16:19-31"
        },
        {
          "k": "Offertory",
          "tx": "O hearken unto the voice of my calling, my king and my God : for unto thee will I make my prayer, O Lord."
        },
        {
          "k": "Secret",
          "tx": "O God, who renewest us, who are created after thine own image, both by sacraments and by precepts, mercifully accept the prayers and gifts of thy suppliants, that what trust in their own merits cannot secure, these propitiatory offerings may obtain for them. Through etc."
        },
        {
          "k": "Communion",
          "tx": "I will speak of all thy marvellous works : I will rejoice and be glad in thee : yea, my songs will I make of thy name, O most highest."
        },
        {
          "k": "Postcommunion",
          "tx": "Grant, we beseech thee, O Lord, that we, who have been filled with so great bounties, may both receive the gift of salvation and never cease from praising thee. Through etc."
        }
      ]
    },
    "tr2": {
      "title": "Mass of the Second Sunday after Trinity",
      "source": "Warren, The Sarum Missal in English (1911), Part I (Sundays after Trinity), pp. 365–406",
      "note": "Source tier: English Sarum (Warren's translation of the Sarum Missal), used as the supplement because no Irish-specific text for the Sundays has been found. The wording is Warren's English from the 1911 book (scanning errors repaired). Warren prints only the first and last words of the Epistle and Gospel; the full reading is shown in the Douay-Rheims Bible, which is not the wording of the Sarum Latin lectionary.",
      "parts": [
        {
          "k": "Introit (Office)",
          "tx": "The Lord was my upholder. He brought me forth also into a place of liberty : he brought me forth, even because he had a favour unto me.\nPs. I will love thee, O Lord my strength ; the Lord is my stony rock, and my defence, and my Saviour."
        },
        {
          "k": "Collect",
          "tx": "O Lord, who never failest to help and govern them whom thou dost bring up in thy steadfast love, make us to have a perpetual fear and love of thy holy name. Through etc."
        },
        {
          "k": "Epistle",
          "pr": "1 St. John iii. 13–18",
          "inc": "Marvel not, my brethren . . . and in truth.",
          "ref": "1 john 3:13-18"
        },
        {
          "k": "Gradual",
          "tx": "When I was in trouble I called upon the Lord : and he heard me. ℣. Deliver my soul, O Lord, from lying lips, and from a deceitful tongue."
        },
        {
          "k": "Alleluya",
          "tx": "Alleluya. ℣. God is a righteous judge, strong and patient : and God is provoked every day."
        },
        {
          "k": "Gospel",
          "pr": "St. Luke xiv. 16–24",
          "inc": "A certain man . . . taste of my supper.",
          "ref": "luke 14:16-24"
        },
        {
          "k": "Offertory",
          "tx": "Turn thee, O Lord, and deliver my soul : O save me for thy mercy's sake."
        },
        {
          "k": "Secret",
          "tx": "May the oblation to be offered to thy name purify us, O Lord, and make us day by day to live a more heavenly life. Through etc."
        },
        {
          "k": "Communion",
          "tx": "I will sing of the Lord, because he hath dealt so lovingly with me : yea, I will praise the name of the Lord most highest."
        },
        {
          "k": "Postcommunion",
          "tx": "Having received these holy gifts, we beseech thee, O Lord, to grant that the more frequently we approach these mysteries, the more effectually we may work out our salvation. Through etc."
        }
      ]
    },
    "tr3": {
      "title": "Mass of the Third Sunday after Trinity",
      "source": "Warren, The Sarum Missal in English (1911), Part I (Sundays after Trinity), pp. 365–406",
      "note": "Source tier: English Sarum (Warren's translation of the Sarum Missal), used as the supplement because no Irish-specific text for the Sundays has been found. The wording is Warren's English from the 1911 book (scanning errors repaired). Warren prints only the first and last words of the Epistle and Gospel; the full reading is shown in the Douay-Rheims Bible, which is not the wording of the Sarum Latin lectionary.",
      "parts": [
        {
          "k": "Introit (Office)",
          "tx": "Turn thee unto me, and have mercy upon me, O Lord, for I am desolate, and in misery. Look upon my adversity and misery : and forgive me all my sin, O my God.\nPs. Unto thee, O Lord, will I lift up my soul ; my God, I have put my trust in thee : O let me not be confounded."
        },
        {
          "k": "Collect",
          "tx": "O Lord, we beseech thee, mercifully to hear our supplications ; and grant that we, to whom thou hast given an hearty desire to pray, may by thy aid be defended. Through etc."
        },
        {
          "k": "Epistle",
          "pr": "1 St. Peter v. 6–11",
          "inc": "Humble yourselves, therefore, . . . ever and ever.",
          "ref": "1 peter 5:6-11"
        },
        {
          "k": "Gradual",
          "tx": "O cast thy burden upon the Lord : and he shall nourish thee. ℣. When I cried unto the Lord, he heard my voice from the battle that was against me."
        },
        {
          "k": "Alleluya",
          "tx": "Alleluya. ℣. I will love thee, O Lord my strength : the Lord is my stony rock, and my defence, and my Saviour."
        },
        {
          "k": "Gospel",
          "pr": "St. Luke xv. 1–10",
          "inc": "Then drew near . . . that repenteth.",
          "ref": "luke 15:1-10"
        },
        {
          "k": "Offertory",
          "tx": "They that know thy name will put their trust in thee : for thou, Lord, hast never failed them that seek thee. O praise the Lord which dwelleth in Sion ; for he forgetteth not the complaint of the poor."
        },
        {
          "k": "Secret",
          "tx": "We beseech thee, O Lord, to sanctify the gifts now offered unto thee, that they may become the body and blood of thy Only-begotten One, for our healing. Who liveth etc."
        },
        {
          "k": "Communion",
          "tx": "I have called upon thee, O God, for thou shalt hear me : incline thine ear unto me, and hearken unto my words."
        },
        {
          "k": "Postcommunion",
          "tx": "Having received the holy gifts, we beseech thee, O Lord, that by their virtue thou wouldest purify us from all vices, and fill us abundantly with the gifts of thy grace. Through etc."
        }
      ]
    },
    "tr4": {
      "title": "Mass of the Fourth Sunday after Trinity",
      "source": "Warren, The Sarum Missal in English (1911), Part I (Sundays after Trinity), pp. 365–406",
      "note": "Source tier: English Sarum (Warren's translation of the Sarum Missal), used as the supplement because no Irish-specific text for the Sundays has been found. The wording is Warren's English from the 1911 book (scanning errors repaired). Warren prints only the first and last words of the Epistle and Gospel; the full reading is shown in the Douay-Rheims Bible, which is not the wording of the Sarum Latin lectionary.",
      "parts": [
        {
          "k": "Introit (Office)",
          "tx": "The Lord is my light and my salvation ; whom shall then I fear ? the Lord is the strength of my life ; of whom then shall I be afraid ? When mine enemies and my foes came upon me, they stumbled and fell.\nPs. Though an host of men were laid against me, yet shall not my heart be afraid."
        },
        {
          "k": "Collect",
          "tx": "O God, the protector of all that trust in thee, without whom nothing is strong, nothing is holy, multiply upon us thy mercy ; that, thou being our ruler and guide, we may so pass through things temporal, that we lose not the things eternal. Through etc."
        },
        {
          "k": "Epistle",
          "pr": "Rom. viii. 18–23",
          "inc": "For I reckon . . . of our body.",
          "ref": "romans 8:18-23"
        },
        {
          "k": "Gradual",
          "tx": "Be merciful to our sins, O Lord. Wherefore do the heathen say, Where is now their God ? ℣. Help us, O God of our salvation, and for the glory of thy name, O Lord, deliver us."
        },
        {
          "k": "Alleluya",
          "tx": "Alleluya. The king shall rejoice in thy strength, O Lord: exceeding glad shall he be of thy salvation."
        },
        {
          "k": "Gospel",
          "pr": "St. Luke vi. 36–42",
          "inc": "Be ye therefore merciful . . . brother's eye.",
          "ref": "luke 6:36-42"
        },
        {
          "k": "Offertory",
          "tx": "Lighten mine eyes that I sleep not in death, lest mine enemies say, I have prevailed against him."
        },
        {
          "k": "Secret",
          "tx": "Regard, we beseech thee, O Lord, the offerings of thy suppliant Church ; and grant that they may be ever consecrated and received for the salvation of thy faithful people. Through etc."
        },
        {
          "k": "Communion",
          "tx": "The Lord is my stony rock and my defence, my Saviour, my God, and my might."
        },
        {
          "k": "Postcommunion",
          "tx": "May thy holy gifts, O Lord, which we have received, quicken us ; and having cleansed us from our sins, prepare us for thine everlasting mercy. Through etc."
        }
      ]
    },
    "tr5": {
      "title": "Mass of the Fifth Sunday after Trinity",
      "source": "Warren, The Sarum Missal in English (1911), Part I (Sundays after Trinity), pp. 365–406",
      "note": "Source tier: English Sarum (Warren's translation of the Sarum Missal), used as the supplement because no Irish-specific text for the Sundays has been found. The wording is Warren's English from the 1911 book (scanning errors repaired). Warren prints only the first and last words of the Epistle and Gospel; the full reading is shown in the Douay-Rheims Bible, which is not the wording of the Sarum Latin lectionary.",
      "parts": [
        {
          "k": "Introit (Office)",
          "tx": "Hearken unto my voice, O Lord, when I cry unto thee. Thou hast been my succour, leave me not, neither forsake me, O God of my salvation.\nPs. The Lord is my light and my salvation : whom then shall I fear?"
        },
        {
          "k": "Collect",
          "tx": "Grant, we beseech thee, O Lord, that the course of this world may be so peaceably ordered by thy governance, that thy Church may joyfully serve thee in godly quietness. Through etc."
        },
        {
          "k": "Epistle",
          "pr": "1 St. Peter iii. 8–15",
          "inc": "Be ye all . . . in your hearts.",
          "ref": "1 peter 3:8-15"
        },
        {
          "k": "Gradual",
          "tx": "Behold, O God, our defender, and look upon thy servants. ℣. O Lord God of hosts, hear the prayers of thy servants."
        },
        {
          "k": "Alleluya",
          "tx": "Alleluya. ℣. In thee, O Lord have I put my trust ; let me never be put to confusion ; rid me and deliver me in thy righteousness; incline thine ear unto me: make haste to deliver me."
        },
        {
          "k": "Gospel",
          "pr": "St. Luke v. 1–11",
          "inc": "As the people pressed . . . followed him.",
          "ref": "luke 5:1-11"
        },
        {
          "k": "Offertory",
          "tx": "I will thank the Lord for giving me warning : I have set God always before me ; for he is on my right hand, therefore shall I not fall."
        },
        {
          "k": "Secret",
          "tx": "Let our humble prayers, we beseech thee, O Lord, ascend into thy merciful presence; and let thy divine power, which thou bestowest upon us abundantly for the purification of our minds, descend upon these oblations. Through etc."
        },
        {
          "k": "Communion",
          "tx": "One thing have I desired of the Lord, which I will require; even that I may dwell in the house of the Lord all the days of my life."
        },
        {
          "k": "Postcommunion",
          "tx": "We beseech thee, O Lord, that these holy mysteries may purify us, and protect us by their efficacy. Through etc."
        }
      ]
    },
    "tr6": {
      "title": "Mass of the Sixth Sunday after Trinity",
      "source": "Warren, The Sarum Missal in English (1911), Part I (Sundays after Trinity), pp. 365–406",
      "note": "Source tier: English Sarum (Warren's translation of the Sarum Missal), used as the supplement because no Irish-specific text for the Sundays has been found. The wording is Warren's English from the 1911 book (scanning errors repaired). Warren prints only the first and last words of the Epistle and Gospel; the full reading is shown in the Douay-Rheims Bible, which is not the wording of the Sarum Latin lectionary.",
      "parts": [
        {
          "k": "Introit (Office)",
          "tx": "The Lord is my strength and he is the wholesome defence of his Anointed. Save thy people, O Lord, and give thy blessing unto thine inheritance : feed them for ever.\nPs. Unto thee will I cry, O Lord my strength : think no scorn of me, lest if thou make as though thou hearest not, I become like them that go down into the pit."
        },
        {
          "k": "Collect",
          "tx": "O God, who hast prepared for them that love thee good things as yet unseen, pour into our hearts such love towards thee, that we loving thee in all things and above all things, may obtain thy promises, which exceed all that we can desire. Through etc."
        },
        {
          "k": "Epistle",
          "pr": "Rom. vi. 3–11",
          "inc": "Know ye not . . . Jesus Christ our Lord.",
          "ref": "romans 6:3-11"
        },
        {
          "k": "Gradual",
          "tx": "Turn thee, O Lord, at the last, and be gracious unto thy servants. ℣. Lord, thou hast been our refuge from one generation."
        },
        {
          "k": "Alleluya",
          "tx": "Alleluya. ℣. Deliver me from mine enemies, O God ; defend me from them that rise up against me."
        },
        {
          "k": "Gospel",
          "pr": "St. Matt. v. 20–24",
          "inc": "For I say unto you . . . offer thy gift.",
          "ref": "matthew 5:20-24"
        },
        {
          "k": "Offertory",
          "tx": "O hold thou up my goings in thy paths, that my footsteps slip not. Incline thine ear to me, and hearken unto my words. Shew thy marvellous loving-kindness, thou that art the saviour of them that put their trust in thee, O Lord."
        },
        {
          "k": "Secret",
          "tx": "Favourably hear our supplications, O Lord, and graciously receive the offerings of thy servants ; that what each hath offered to the honour of thy name, may be profitable to the salvation of all men. Through etc."
        },
        {
          "k": "Communion",
          "tx": "Therefore will I offer in his dwelling an oblation with great gladness : I will sing and speak praises unto the Lord."
        },
        {
          "k": "Postcommunion",
          "tx": "Grant, we beseech thee, O Lord, that we, who have been fed with this heavenly gift, may be cleansed from our secret sins, and delivered from the snares of our enemies. Through etc."
        }
      ]
    },
    "tr7": {
      "title": "Mass of the Seventh Sunday after Trinity",
      "source": "Warren, The Sarum Missal in English (1911), Part I (Sundays after Trinity), pp. 365–406",
      "note": "Source tier: English Sarum (Warren's translation of the Sarum Missal), used as the supplement because no Irish-specific text for the Sundays has been found. The wording is Warren's English from the 1911 book (scanning errors repaired). Warren prints only the first and last words of the Epistle and Gospel; the full reading is shown in the Douay-Rheims Bible, which is not the wording of the Sarum Latin lectionary.",
      "parts": [
        {
          "k": "Introit (Office)",
          "tx": "O clap your hands together, all ye people : O sing unto God with the voice of melody.\nPs. He shall subdue the people under us : and the nations under our feet."
        },
        {
          "k": "Collect",
          "tx": "God of all power, who art the author of all good things, graft in our hearts the love of thy name, increase in us true religion, nourish us with all goodness, and of thy great mercy keep us in the same. Through etc."
        },
        {
          "k": "Epistle",
          "pr": "Rom. vi. 19–23",
          "inc": "I speak after . . . Christ our Lord.",
          "ref": "romans 6:19-23"
        },
        {
          "k": "Gradual",
          "tx": "Come ye children, and hearken unto me: I will teach you the fear of the Lord. ℣. They had an eye unto him and were lightened : and their faces were not ashamed."
        },
        {
          "k": "Alleluya",
          "tx": "Alleluya. Thou, O God, art praised in Sion: and unto thee shall the vow be performed in Jerusalem."
        },
        {
          "k": "Gospel",
          "pr": "St. Mark viii. 1–9",
          "inc": "In those days . . . sent them away.",
          "ref": "mark 8:1-9"
        },
        {
          "k": "Offertory",
          "tx": "Like as in burnt offerings of rams and bullocks, and like as in ten thousands of fat lambs, so let our sacrifice be in thy sight this day, and grant that we may wholly go after thee ; for they shall not be confounded that put their trust in thee, O Lord."
        },
        {
          "k": "Secret",
          "tx": "Favourably hear our supplications, O Lord, and mercifully receive these offerings of thy people, and that the vow of none may be of no effect, and that the request of none may be sent empty away, grant that the things which we ask faithfully, we may obtain effectually. Through etc."
        },
        {
          "k": "Communion",
          "tx": "Bow down thine ear to me : make haste to deliver me."
        },
        {
          "k": "Postcommunion",
          "tx": "We beseech thee, O Lord, to grant that having been replenished with thy gifts, we may both be cleansed by their efficacy and strengthened by their aid. Through etc."
        }
      ]
    },
    "tr8": {
      "title": "Mass of the Eighth Sunday after Trinity",
      "source": "Warren, The Sarum Missal in English (1911), Part I (Sundays after Trinity), pp. 365–406",
      "note": "Source tier: English Sarum (Warren's translation of the Sarum Missal), used as the supplement because no Irish-specific text for the Sundays has been found. The wording is Warren's English from the 1911 book (scanning errors repaired). Warren prints only the first and last words of the Epistle and Gospel; the full reading is shown in the Douay-Rheims Bible, which is not the wording of the Sarum Latin lectionary.",
      "parts": [
        {
          "k": "Introit (Office)",
          "tx": "We wait for thy loving-kindness, O God, in the midst of thy temple. O God, according to thy name, so is thy praise unto the world's end : thy right hand is full of righteousness.\nPs. Great is the Lord, and highly to be praised : in the city of our God, even upon his holy hill."
        },
        {
          "k": "Collect",
          "tx": "O God, whose providence ordereth all things, we humbly beseech thee to put away from us all hurtful things, and to give us those things which be profitable for us. Through etc."
        },
        {
          "k": "Epistle",
          "pr": "Rom. viii. 12–17",
          "inc": "Therefore, brethren, we . . . joint-heirs with Christ.",
          "ref": "romans 8:12-17"
        },
        {
          "k": "Gradual",
          "tx": "And be thou my strong rock, and house of defence, that thou mayest save me. ℣. In thee, O Lord God, have I put my trust : let me never be put to confusion."
        },
        {
          "k": "Alleluya",
          "tx": "Alleluya. ℣. Hear my law, O my people."
        },
        {
          "k": "Gospel",
          "pr": "St. Matt. vii. 15–21",
          "inc": "Beware of false . . . which is in heaven.",
          "ref": "matthew 7:15-21"
        },
        {
          "k": "Offertory",
          "tx": "For thou shalt save the people that are in adversity : and shalt bring down the high looks of the proud. For who is God, beside thee, O Lord ?"
        },
        {
          "k": "Secret",
          "tx": "O God, who by one perfect sacrifice hast confirmed the various offerings under the law, accept this sacrifice offered unto thee by thy devout servants, and sanctify it by a like blessing to that wherewith thou didst sanctify the offering of righteous Abel, that what each hath offered in honour of thy majesty may be profitable for the salvation of all. Through etc."
        },
        {
          "k": "Communion",
          "tx": "O taste and see how gracious the Lord is : blessed is the man that trusteth in him."
        },
        {
          "k": "Postcommunion",
          "tx": "May thy wholesome working, O Lord, both mercifully set us free from our perverse ways, and lead us unto those things which be rightful. Through etc."
        }
      ]
    },
    "tr9": {
      "title": "Mass of the Ninth Sunday after Trinity",
      "source": "Warren, The Sarum Missal in English (1911), Part I (Sundays after Trinity), pp. 365–406",
      "note": "Source tier: English Sarum (Warren's translation of the Sarum Missal), used as the supplement because no Irish-specific text for the Sundays has been found. The wording is Warren's English from the 1911 book (scanning errors repaired). Warren prints only the first and last words of the Epistle and Gospel; the full reading is shown in the Douay-Rheims Bible, which is not the wording of the Sarum Latin lectionary.",
      "parts": [
        {
          "k": "Introit (Office)",
          "tx": "Behold, God is my helper : the Lord is with them that uphold my soul. He shall reward evil unto mine enemies : destroy thou them in thy truth, O God, my defender.\nPs. Save me, O God, for thy name's sake : and avenge me in thy strength."
        },
        {
          "k": "Collect",
          "tx": "Grant to us, Lord, we beseech thee, the spirit to think and do always such things as be rightful ; that we, who cannot exist without thee, may be enabled to live according to thy will. Through etc."
        },
        {
          "k": "Epistle",
          "pr": "1 Cor. x. 6–13",
          "inc": "Let us not lust . . . able to bear it.",
          "ref": "1 corinthians 10:6-13"
        },
        {
          "k": "Gradual",
          "tx": "O Lord, our Governor, how excellent is thy name in all the world. ℣. Thou that hast set thy glory above the heavens."
        },
        {
          "k": "Alleluya",
          "tx": "Alleluya. ℣. Sing we merrily unto God our strength : make a cheerful noise unto the God of Jacob. Take the psalm : the merry harp with the lute."
        },
        {
          "k": "Gospel",
          "pr": "St. Luke xvi. 1–9",
          "inc": "There was a certain rich . . . habitation.",
          "ref": "luke 16:1-9"
        },
        {
          "k": "Offertory",
          "tx": "The statutes of the Lord are right and rejoice the heart : sweeter also than honey and the honey-comb, and thy servant keepeth them."
        },
        {
          "k": "Secret",
          "tx": "Receive, we beseech thee, O Lord, the gifts which of thine own bounty we present unto thee, that these most holy mysteries may, by the powerful working of thy grace, make us holy in conversation in this present life, and bring us to the joys everlasting. Through etc."
        },
        {
          "k": "Communion",
          "tx": "Seek ye first the kingdom of God, and all things shall be added unto you, saith the Lord."
        },
        {
          "k": "Postcommunion",
          "tx": "We beseech thee, O Lord, that this heavenly mystery may renew us both in soul and body, that we may inwardly perceive the virtue of that which we outwardly perform. Through etc."
        }
      ]
    },
    "tr10": {
      "title": "Mass of the Tenth Sunday after Trinity",
      "source": "Warren, The Sarum Missal in English (1911), Part I (Sundays after Trinity), pp. 365–406",
      "note": "Source tier: English Sarum (Warren's translation of the Sarum Missal), used as the supplement because no Irish-specific text for the Sundays has been found. The wording is Warren's English from the 1911 book (scanning errors repaired). Warren prints only the first and last words of the Epistle and Gospel; the full reading is shown in the Douay-Rheims Bible, which is not the wording of the Sarum Latin lectionary.",
      "parts": [
        {
          "k": "Introit (Office)",
          "tx": "When I called upon the Lord, he heard my voice from the battle that was against me, and brought them down, even God that endureth for ever. O cast thy burden upon the Lord, and he shall nourish thee.\nPs. Hear my prayer, O God : and hide not thyself from my petition. Take heed unto me, and hear me."
        },
        {
          "k": "Collect",
          "tx": "Let thy merciful ears, O Lord, be open to the prayers of thy humble servants ; and that they may obtain their petitions make them to ask such things as shall please thee. Through etc."
        },
        {
          "k": "Epistle",
          "pr": "1 Cor. xii. 2–11",
          "inc": "Ye know that ye . . . as he will.",
          "ref": "1 corinthians 12:2-11"
        },
        {
          "k": "Gradual",
          "tx": "Keep me, O Lord, as the apple of an eye : hide me under the shadow of thy wings. ℣. Let my sentence come forth from thy presence : and let thine eyes look upon the thing that is equal."
        },
        {
          "k": "Alleluya",
          "tx": "Alleluya. ℣. O Lord God of my salvation, I have cried day and night before thee."
        },
        {
          "k": "Gospel",
          "pr": "St. Luke xix. 41–47",
          "inc": "And when he was come . . . in the temple.",
          "ref": "luke 19:41-47"
        },
        {
          "k": "Offertory",
          "tx": "Unto thee, O God, will I lift up my soul : my God, I have put my trust in thee : O let me not be confounded, neither let mine enemies triumph over me. For all they that hope in thee shall not be ashamed."
        },
        {
          "k": "Secret",
          "tx": "Grant us, O Lord, we beseech thee, frequently and worthily to approach these mysteries, because, as often as this commemorative sacrifice is celebrated, the work of our redemption is carried out. Through etc."
        },
        {
          "k": "Communion",
          "tx": "Thou shalt be pleased with the sacrifice of righteousness, with the burnt offerings and oblations upon thine altar, O Lord."
        },
        {
          "k": "Postcommunion",
          "tx": "May communion in thy sacrament, O Lord, both bestow upon us purity and contribute to our unity. Through etc."
        }
      ]
    },
    "tr11": {
      "title": "Mass of the Eleventh Sunday after Trinity",
      "source": "Warren, The Sarum Missal in English (1911), Part I (Sundays after Trinity), pp. 365–406",
      "note": "Source tier: English Sarum (Warren's translation of the Sarum Missal), used as the supplement because no Irish-specific text for the Sundays has been found. The wording is Warren's English from the 1911 book (scanning errors repaired). Warren prints only the first and last words of the Epistle and Gospel; the full reading is shown in the Douay-Rheims Bible, which is not the wording of the Sarum Latin lectionary.",
      "parts": [
        {
          "k": "Introit (Office)",
          "tx": "God in his holy habitation, God that maketh men to be of one mind in an house : he will give strength and power unto his people.\nPs. Let God arise, and let his enemies be scattered : let them also that hate him flee before him."
        },
        {
          "k": "Collect",
          "tx": "O God, who declarest thy almighty power most chiefly in shewing mercy and pity, mercifully grant unto us thy grace, that we, running the way of thy promises, may be made partakers of thy heavenly treasure. Through etc."
        },
        {
          "k": "Epistle",
          "pr": "1 Cor. xv. 1–10",
          "inc": "Moreover, brethren, . . . not in vain.",
          "ref": "1 corinthians 15:1-10"
        },
        {
          "k": "Gradual",
          "tx": "My heart hath trusted in God and I am helped : therefore my heart danceth for joy, and in my song will I praise him. ℣. Unto thee will I cry, O Lord : my God, think no scorn of me."
        },
        {
          "k": "Alleluya",
          "tx": "Alleluya. ℣. Lord, thou hast been our refuge : from one generation to another."
        },
        {
          "k": "Gospel",
          "pr": "St. Luke xviii. 9–14",
          "inc": "And he spake . . . shall be exalted.",
          "ref": "luke 18:9-14"
        },
        {
          "k": "Offertory",
          "tx": "I will magnify thee, O Lord, for thou hast set me up, and not made my foes to triumph over me. O Lord my God, I cried unto thee, and thou hast healed me."
        },
        {
          "k": "Secret",
          "tx": "May this consecrated oblation be presented before thee, O Lord, which thou hast in such wise appointed to be offered in honour of thy name, that it may at the same time be made to work our healing. Through etc."
        },
        {
          "k": "Communion",
          "tx": "Honour the Lord with thy substance, and with the first fruits of all thine increase : so shall thy barns be filled with plenty, and thy presses shall burst out with new wine."
        },
        {
          "k": "Postcommunion",
          "tx": "We beseech thee, O Lord our God, that thou wouldest mercifully never leave those destitute of thy aid whom thou ceasest not to restore by divine sacraments. Through etc."
        }
      ]
    },
    "tr12": {
      "title": "Mass of the Twelfth Sunday after Trinity",
      "source": "Warren, The Sarum Missal in English (1911), Part I (Sundays after Trinity), pp. 365–406",
      "note": "Source tier: English Sarum (Warren's translation of the Sarum Missal), used as the supplement because no Irish-specific text for the Sundays has been found. The wording is Warren's English from the 1911 book (scanning errors repaired). Warren prints only the first and last words of the Epistle and Gospel; the full reading is shown in the Douay-Rheims Bible, which is not the wording of the Sarum Latin lectionary.",
      "parts": [
        {
          "k": "Introit (Office)",
          "tx": "Haste thee, O God, to deliver me : make haste to help me, O God. Let them be ashamed and confounded that seek after my soul.\nPs. Let them be turned backward and put to confusion that wish me evil."
        },
        {
          "k": "Collect",
          "tx": "Almighty and everlasting God, who in the abundance of thy mercy art wont to give more than either we desire or deserve, pour down upon us thy mercy, forgiving us those things whereof our conscience is afraid, and giving us those things which we are not worthy to ask. Through etc."
        },
        {
          "k": "Epistle",
          "pr": "2 Cor. iii. 4–9",
          "inc": "Such trust have we . . . in glory.",
          "ref": "2 corinthians 3:4-9"
        },
        {
          "k": "Gradual",
          "tx": "I will alway give thanks unto the Lord : his praise shall ever be in my mouth. ℣. My soul shall make her boast in the Lord: the humble shall hear thereof and be glad."
        },
        {
          "k": "Alleluya",
          "tx": "Alleluya. ℣. O come, let us sing unto the Lord: let us heartily rejoice in the strength of our salvation. Another Verse. ℣. Let us come before his presence with thanksgiving: and shew ourselves glad in him with psalms."
        },
        {
          "k": "Gospel",
          "pr": "St. Mark vii. 31–37",
          "inc": "And again departing . . . dumb to speak.",
          "ref": "mark 7:31-37"
        },
        {
          "k": "Offertory",
          "tx": "Moses besought the Lord his God, and said, Lord, why doth thy wrath wax hot against thy people ? Spare the wrath of thy soul. Remember Abraham, Isaac, and Jacob, to whom thou swarest to give a land flowing with milk and honey. And the Lord repented of the evil which he said he would do unto his people."
        },
        {
          "k": "Secret",
          "tx": "Look down, we beseech thee, O Lord, mercifully on this our bounden service ; that the gift which we offer may be acceptable to thee, and may be a succour to our frailty. Through etc."
        },
        {
          "k": "Communion",
          "tx": "The earth is filled with the fruit of thy works, O Lord : that he may bring food out of the earth, and wine that maketh glad the heart of man, and oil to make him a cheerful countenance, and bread to strengthen man's heart."
        },
        {
          "k": "Postcommunion",
          "tx": "Grant, we beseech thee, O Lord, that in partaking of thy sacrament we may have a sense of support both in mind and body, and being saved in both we may glory in the fulness of the heavenly healing. Through etc."
        }
      ]
    },
    "tr13": {
      "title": "Mass of the Thirteenth Sunday after Trinity",
      "source": "Warren, The Sarum Missal in English (1911), Part I (Sundays after Trinity), pp. 365–406",
      "note": "Source tier: English Sarum (Warren's translation of the Sarum Missal), used as the supplement because no Irish-specific text for the Sundays has been found. The wording is Warren's English from the 1911 book (scanning errors repaired). Warren prints only the first and last words of the Epistle and Gospel; the full reading is shown in the Douay-Rheims Bible, which is not the wording of the Sarum Latin lectionary.",
      "parts": [
        {
          "k": "Introit (Office)",
          "tx": "Look upon the covenant, O Lord, and forget not the congregation of the poor for ever. Arise, O God, maintain thine own cause: forget not the voice of thine enemies.\nPs. O God, wherefore art thou absent from us so long ? Why is thy wrath so hot against the sheep of thy pasture ?"
        },
        {
          "k": "Collect",
          "tx": "Almighty and merciful God, of whose only gift it cometh that thy faithful people do unto thee true and laudable service, grant, we beseech thee, that we may without stumbling run the way of thy promises. Through etc."
        },
        {
          "k": "Epistle",
          "pr": "Gal. iii. 16–22",
          "inc": "Now to Abraham . . . them that believe.",
          "ref": "galatians 3:16-22"
        },
        {
          "k": "Gradual",
          "tx": "Look upon thy covenant, O Lord, and forget not the congregation of the poor for ever. ℣. Arise, O God, maintain thine own cause: and forget not the voice of thine enemies."
        },
        {
          "k": "Alleluya",
          "tx": "Alleluya. ℣. For the Lord is a great God : and a great King above all the earth."
        },
        {
          "k": "Gospel",
          "pr": "St. Luke x. 23–37",
          "inc": "Blessed are the eyes . . . do thou likewise.",
          "ref": "luke 10:23-37"
        },
        {
          "k": "Offertory",
          "tx": "My hope hath been in thee, O Lord : I have said, Thou art my God. My time is in thy hand."
        },
        {
          "k": "Secret",
          "tx": "Mercifully look down, O Lord, we beseech thee, on the offerings which we present on thy holy altar ; that by obtaining abundant pardon for us, they may redound to the honour of thy name. Through etc."
        },
        {
          "k": "Communion",
          "tx": "Thou didst send us from heaven bread, O Lord, able to content every man's delight, and agreeing to every taste."
        },
        {
          "k": "Postcommunion",
          "tx": "We beseech thee, O Lord, that participation in this holy mystery may quicken us ; and procure for us both pardon and protection. Through etc."
        }
      ]
    },
    "tr14": {
      "title": "Mass of the Fourteenth Sunday after Trinity",
      "source": "Warren, The Sarum Missal in English (1911), Part I (Sundays after Trinity), pp. 365–406",
      "note": "Source tier: English Sarum (Warren's translation of the Sarum Missal), used as the supplement because no Irish-specific text for the Sundays has been found. The wording is Warren's English from the 1911 book (scanning errors repaired). Warren prints only the first and last words of the Epistle and Gospel; the full reading is shown in the Douay-Rheims Bible, which is not the wording of the Sarum Latin lectionary.",
      "parts": [
        {
          "k": "Introit (Office)",
          "tx": "Behold, O God our defender, and look upon the face of thine anointed. For one day in thy courts : is better than a thousand.\nPs. O how amiable are thy dwellings, thou Lord of hosts. My soul hath a desire and longing to enter into the courts of the Lord."
        },
        {
          "k": "Collect",
          "tx": "Almighty and everlasting God, give unto us the increase of faith, hope, and charity; and that we may obtain that which thou dost promise, make us to love that which thou dost command. Through etc."
        },
        {
          "k": "Epistle",
          "pr": "Gal. v. 16–24",
          "inc": "Walk in the Spirit . . . affections and lusts.",
          "ref": "galatians 5:16-24"
        },
        {
          "k": "Gradual",
          "tx": "It is a good thing to give thanks unto the Lord : and to sing praises unto thy name, O most highest. ℣. To tell of thy loving kindness early in the morning, and of thy truth in the night season."
        },
        {
          "k": "Alleluya",
          "tx": "Alleluya. ℣. O give thanks unto the Lord, and call upon his name : tell the people what things he hath done."
        },
        {
          "k": "Gospel",
          "pr": "St. Luke xvii. 11–19",
          "inc": "And it came to pass . . . made thee whole.",
          "ref": "luke 17:11-19"
        },
        {
          "k": "Offertory",
          "tx": "The angel of the Lord tarrieth round about them that fear him, and delivereth them. O taste and see how gracious the Lord is."
        },
        {
          "k": "Secret",
          "tx": "Be favourable, O Lord, to thy people ; be favourable to their gifts ; that being appeased by this oblation, thou mayest bestow upon us pardon, and grant our requests. Through etc."
        },
        {
          "k": "Communion",
          "tx": "The bread that I will give is my flesh, which I will give for the life of the world."
        },
        {
          "k": "Postcommunion",
          "tx": "May thy sacraments, O God, continually purify and strengthen us, and lead us to the attainment of everlasting salvation. Through etc."
        }
      ]
    },
    "tr15": {
      "title": "Mass of the Fifteenth Sunday after Trinity",
      "source": "Warren, The Sarum Missal in English (1911), Part I (Sundays after Trinity), pp. 365–406",
      "note": "Source tier: English Sarum (Warren's translation of the Sarum Missal), used as the supplement because no Irish-specific text for the Sundays has been found. The wording is Warren's English from the 1911 book (scanning errors repaired). Warren prints only the first and last words of the Epistle and Gospel; the full reading is shown in the Douay-Rheims Bible, which is not the wording of the Sarum Latin lectionary.",
      "parts": [
        {
          "k": "Introit (Office)",
          "tx": "Bow down thine ear, O Lord, and hear me : my God, save thy servant that putteth his trust in thee. Be merciful unto me, O Lord, for I will call daily upon thee.\nPs. Comfort the soul of thy servant : for unto thee, O Lord, do I lift up my soul."
        },
        {
          "k": "Collect",
          "tx": "Keep, we beseech thee, O Lord, thy Church with thy perpetual mercy, and because the frailty of man without thee cannot but fall, keep us ever by thy help from all things hurtful, and lead us to all things profitable to our salvation. Through etc."
        },
        {
          "k": "Epistle",
          "pr": "Gal. v. 25, 26; vi. 1–10",
          "inc": "If we live . . . household of faith.",
          "ref": "galatians 5:25-26|galatians 6:1-10"
        },
        {
          "k": "Gradual",
          "tx": "It is better to trust in the Lord : than to put any confidence in man. ℣. It is better to trust in the Lord : than to put any confidence in princes."
        },
        {
          "k": "Alleluya",
          "tx": "Alleluya. ℣. O God, my heart is ready, my heart is ready : I will sing and give praise with the best member that I have."
        },
        {
          "k": "Gospel",
          "pr": "St. Matt. vi. 24–33",
          "inc": "No man can . . . added unto you.",
          "ref": "matthew 6:24-33"
        },
        {
          "k": "Offertory",
          "tx": "I waited patiently for the Lord : and he inclined unto me and heard my calling. And he hath put a new song in my mouth : even a thanksgiving unto our God."
        },
        {
          "k": "Secret",
          "tx": "Grant, O Lord, we beseech thee, that this saving offering may be to us both the cleansing away of our sins, and the reconciliation of us to thy loving kindness. Through etc."
        },
        {
          "k": "Communion",
          "tx": "He that eateth my flesh, and drinketh my blood, dwelleth in me, and I in him, saith the Lord."
        },
        {
          "k": "Postcommunion",
          "tx": "May thy sacraments, O God, ever purify and strengthen us, and lead us to the attainment of everlasting salvation. Through etc."
        }
      ]
    },
    "tr16": {
      "title": "Mass of the Sixteenth Sunday after Trinity",
      "source": "Warren, The Sarum Missal in English (1911), Part I (Sundays after Trinity), pp. 365–406",
      "note": "Source tier: English Sarum (Warren's translation of the Sarum Missal), used as the supplement because no Irish-specific text for the Sundays has been found. The wording is Warren's English from the 1911 book (scanning errors repaired). Warren prints only the first and last words of the Epistle and Gospel; the full reading is shown in the Douay-Rheims Bible, which is not the wording of the Sarum Latin lectionary.",
      "parts": [
        {
          "k": "Introit (Office)",
          "tx": "Be merciful unto me, O Lord : for I will call daily upon thee. For thou, Lord, art good and gracious, and of great mercy unto all them that call upon thee.\nPs. Bow down thine ear, O Lord, and hear me: for I am poor and in misery."
        },
        {
          "k": "Collect",
          "tx": "O Lord, we beseech thee, let thy continual pity cleanse and defend thy Church, and because it cannot continue in safety without thy succour, let it be governed evermore by thy favour. Through etc."
        },
        {
          "k": "Epistle",
          "pr": "Eph. iii. 13–21",
          "inc": "I desire that . . . without end. Amen.",
          "ref": "ephesians 3:13-21"
        },
        {
          "k": "Gradual",
          "tx": "The heathen shall fear thy name, O Lord : and all the kings of the earth thy majesty. ℣. When the Lord shall build up Sion : and when his glory shall appear."
        },
        {
          "k": "Alleluya",
          "tx": "Alleluya. ℣. Ye that fear the Lord, put your trust in the Lord : he is their helper and defender."
        },
        {
          "k": "Gospel",
          "pr": "St. Luke vii. 11–16",
          "inc": "And it came to pass . . . visited his people.",
          "ref": "luke 7:11-16"
        },
        {
          "k": "Offertory",
          "tx": "Make haste, O Lord, to help me. Let them be ashamed and confounded together, that seek after my soul to destroy it."
        },
        {
          "k": "Secret",
          "tx": "We beseech thee, O Lord, that thy sacrament may keep us in safety ; and ever defend us against the assaults of the devil. Through etc."
        },
        {
          "k": "Communion",
          "tx": "Lord, I will make mention of thy righteousness only. Thou, O God, hast taught me from my youth up until now : forsake me not, O God, in mine old age, when I am grey headed."
        },
        {
          "k": "Postcommunion",
          "tx": "We beseech thee, O Lord, that the working of this heavenly gift may take possession both of our souls and bodies ; that what it alloweth, and not that which our own mind deviseth, may continually prevent us. Through etc."
        }
      ]
    },
    "tr17": {
      "title": "Mass of the Seventeenth Sunday after Trinity",
      "source": "Warren, The Sarum Missal in English (1911), Part I (Sundays after Trinity), pp. 365–406",
      "note": "Source tier: English Sarum (Warren's translation of the Sarum Missal), used as the supplement because no Irish-specific text for the Sundays has been found. The wording is Warren's English from the 1911 book (scanning errors repaired). Warren prints only the first and last words of the Epistle and Gospel; the full reading is shown in the Douay-Rheims Bible, which is not the wording of the Sarum Latin lectionary.",
      "parts": [
        {
          "k": "Introit (Office)",
          "tx": "Righteous art thou, O Lord : and true is thy judgment. O deal with thy servant according unto thy loving mercy.\nPs. Blessed are those that are undefiled in the way : and walk in the law of the Lord."
        },
        {
          "k": "Collect",
          "tx": "Lord, we pray thee that thy grace may always prevent and follow us, and make us continually to be given to good works. Through etc."
        },
        {
          "k": "Epistle",
          "pr": "Eph. iv. 1–6",
          "inc": "I, therefore, the prisoner . . . in you all.",
          "ref": "ephesians 4:1-6"
        },
        {
          "k": "Gradual",
          "tx": "Blessed are the people whose God is the Lord Jehovah : and blessed are the folk that the Lord hath chosen to him to be his inheritance. ℣. By the word of the Lord were the heavens made : and all the hosts of them by the breath of his mouth."
        },
        {
          "k": "Alleluya",
          "tx": "Alleluya. ℣. The right hand of the Lord bringeth mighty things to pass: the right hand of the Lord hath the pre-eminence."
        },
        {
          "k": "Gospel",
          "pr": "St. Luke xiv. 1–11",
          "inc": "And it came to pass . . . be exalted.",
          "ref": "luke 14:1-11"
        },
        {
          "k": "Offertory",
          "tx": "I Daniel prayed unto my God, and said: Hear, O Lord, the prayers of thy servant : cause thy face to shine upon thy sanctuary ; and mercifully look down upon this thy people, which is called by thy name, O God."
        },
        {
          "k": "Secret",
          "tx": "Cleanse us, O Lord, we beseech thee, by the effectual working of this present sacrifice ; and by thy mercy make us meet to be partakers thereof. Through etc."
        },
        {
          "k": "Communion",
          "tx": "Promise unto the Lord your God, and keep it, all ye that are round about him : bring presents unto him that ought to be feared. He shall refrain the spirit of princes : and is wonderful among the kings of the earth."
        },
        {
          "k": "Postcommunion",
          "tx": "We beseech thee, O Lord, mercifully to purify our souls, that we may receive consequently help for our bodies both now and hereafter. Through etc."
        }
      ]
    },
    "tr18": {
      "title": "Mass of the Eighteenth Sunday after Trinity",
      "source": "Warren, The Sarum Missal in English (1911), Part I (Sundays after Trinity), pp. 365–406",
      "note": "Source tier: English Sarum (Warren's translation of the Sarum Missal), used as the supplement because no Irish-specific text for the Sundays has been found. The wording is Warren's English from the 1911 book (scanning errors repaired). Warren prints only the first and last words of the Epistle and Gospel; the full reading is shown in the Douay-Rheims Bible, which is not the wording of the Sarum Latin lectionary.",
      "parts": [
        {
          "k": "Introit (Office)",
          "tx": "Give peace, O Lord, to them that wait for thee, and let thy prophets be found faithful. Hear the prayers of thy servant, and of thy people Israel.\nPs. I was glad when they said unto me : We will go into the house of the Lord."
        },
        {
          "k": "Collect",
          "tx": "Lord, we beseech thee, grant thy people grace to withstand the temptations of the devil, and with pure minds to follow thee the only God. Through etc."
        },
        {
          "k": "Epistle",
          "pr": "1 Cor. i. 4–8",
          "inc": "I thank my God . . . our Lord Jesus Christ.",
          "ref": "1 corinthians 1:4-8"
        },
        {
          "k": "Gradual",
          "tx": "I was glad when they said unto me : We will go into the house of the Lord. ℣. Peace be within thy walls : and plenteousness within thy palaces."
        },
        {
          "k": "Alleluya",
          "tx": "Alleluya. ℣. I was glad when they said unto me : We will go into the house of the Lord. [Alleluya.] ℣. Our feet shall stand in thy gates: O Jerusalem. These last two Verses are said alternately throughout the week, but in such wise that Our feet shall stand etc. is said first, when the service is ferial. If there be no ferial day throughout the week vacant for this purpose, then in that year the last Verse shall be omitted altogether."
        },
        {
          "k": "Gospel",
          "pr": "St. Matt. xxii. 35–46",
          "inc": "Then one of them . . . any more questions.",
          "ref": "matthew 22:35-46"
        },
        {
          "k": "Offertory",
          "tx": "Moses consecrated an altar unto the Lord, offering burnt-offerings thereon, and sacrificing a peace offering : he made an evening sacrifice for a sweet odour to the Lord God in the sight of the children of Israel."
        },
        {
          "k": "Secret",
          "tx": "We humbly beseech thy majesty, O Lord, that these holy things which we present, may set us free both from past and from future transgressions. Through etc."
        },
        {
          "k": "Communion",
          "tx": "Bring presents, and come into his courts. O worship the Lord in the beauty of holiness."
        },
        {
          "k": "Postcommunion",
          "tx": "Almighty God, we beseech thee, that by thy sanctifying ordinances both our vices may be cured, and eternal healing may spring up for us. Through etc."
        }
      ]
    },
    "tr19": {
      "title": "Mass of the Nineteenth Sunday after Trinity",
      "source": "Warren, The Sarum Missal in English (1911), Part I (Sundays after Trinity), pp. 365–406",
      "note": "Source tier: English Sarum (Warren's translation of the Sarum Missal), used as the supplement because no Irish-specific text for the Sundays has been found. The wording is Warren's English from the 1911 book (scanning errors repaired). Warren prints only the first and last words of the Epistle and Gospel; the full reading is shown in the Douay-Rheims Bible, which is not the wording of the Sarum Latin lectionary.",
      "parts": [
        {
          "k": "Introit (Office)",
          "tx": "I am the salvation of the people, saith the Lord : in whatsoever distress they shall call upon me, I will hear them ; and I will be their Lord for ever.\nPs. Hear my law, O ye people: incline your ears unto the words of my mouth."
        },
        {
          "k": "Collect",
          "tx": "O Lord, forasmuch as without thee we are not able to please thee, we beseech thee that thy pity may work in us and direct our hearts. Through etc."
        },
        {
          "k": "Epistle",
          "pr": "Eph. iv. 23–28",
          "inc": "Be renewed . . . to him that needeth.",
          "ref": "ephesians 4:23-28"
        },
        {
          "k": "Gradual",
          "tx": "Let my prayer be set forth in thy sight as the incense, O Lord. ℣. Let the lifting up of my hands be an evening sacrifice."
        },
        {
          "k": "Alleluya",
          "tx": "Alleluya. ℣. They that put their trust in the Lord shall be even as the mount Sion : which may not be removed, but standeth fast for ever, in Jerusalem."
        },
        {
          "k": "Gospel",
          "pr": "St. Matt. ix. 1–8",
          "inc": "And he entered into . . . unto men.",
          "ref": "matthew 9:1-8"
        },
        {
          "k": "Offertory",
          "tx": "Though I walk in the midst of trouble, yet shalt thou refresh me, O Lord : thou shalt stretch forth thy hand upon the furiousness of mine enemies, and thy right hand shall save me."
        },
        {
          "k": "Secret",
          "tx": "O God, who by our communion in this sacred sacrifice makest us to be partakers of the one supreme divine nature, grant, we beseech thee, that as we know thy truth, so we may attain unto it by a worthy understanding and conversation. Through etc."
        },
        {
          "k": "Communion",
          "tx": "Thou hast charged : that we shall diligently keep thy commandments. O that my ways were made so direct : that I might keep thy statutes !"
        },
        {
          "k": "Postcommunion",
          "tx": "We give thee thanks, O Lord, who hast fed us with this holy gift, beseeching thee of thy mercy that thou wouldest make us worthy partakers of it. Through etc."
        }
      ]
    },
    "tr20": {
      "title": "Mass of the Twentieth Sunday after Trinity",
      "source": "Warren, The Sarum Missal in English (1911), Part I (Sundays after Trinity), pp. 365–406",
      "note": "Source tier: English Sarum (Warren's translation of the Sarum Missal), used as the supplement because no Irish-specific text for the Sundays has been found. The wording is Warren's English from the 1911 book (scanning errors repaired). Warren prints only the first and last words of the Epistle and Gospel; the full reading is shown in the Douay-Rheims Bible, which is not the wording of the Sarum Latin lectionary.",
      "parts": [
        {
          "k": "Introit (Office)",
          "tx": "In all things that thou hast brought upon us, O Lord, thou hast executed true judgment: we have trespassed, and not obeyed thy commandments, but give glory to thy name, and deal with us according to the multitude of thy mercy.\nPs. Great is the Lord and highly to be praised : in the city of our God, even upon his holy hill."
        },
        {
          "k": "Collect",
          "tx": "O almighty and merciful God, of thy bountiful goodness keep us, we beseech thee, from all things that may hurt us, that we, being ready both in body and soul, may cheerfully accomplish those things that thou wouldest have done. Through etc."
        },
        {
          "k": "Epistle",
          "pr": "Eph. v. 15–21",
          "inc": "See then that . . . fear of Christ.",
          "ref": "ephesians 5:15-21"
        },
        {
          "k": "Gradual",
          "tx": "The eyes of all wait upon thee, O Lord : and thou givest them their meat in due season. ℣. Thou openest thine hand : and fillest all things living with plenteousness."
        },
        {
          "k": "Alleluya",
          "tx": "Alleluya. ℣. Out of the deep have I called unto thee, O Lord : Lord, hear my voice."
        },
        {
          "k": "Gospel",
          "pr": "St. Matt. xxii. 1–14",
          "inc": "And Jesus answered . . . few are chosen.",
          "ref": "matthew 22:1-14"
        },
        {
          "k": "Offertory",
          "tx": "By the waters of Babylon we sat down and wept : when we remembered thee, O Sion."
        },
        {
          "k": "Secret",
          "tx": "Grant, we beseech thee, O Lord, that these gifts which we offer in the sight of thy majesty may be profitable for our salvation. Through etc."
        },
        {
          "k": "Communion",
          "tx": "O think upon thy servant, O Lord, as concerning thy word : wherein thou hast caused me to put my trust. The same is my comfort in my trouble."
        },
        {
          "k": "Postcommunion",
          "tx": "May thy healing virtue, O Lord, both mercifully free us from our frowardness, and make us ever hold fast to thy commandments. Through etc."
        }
      ]
    },
    "tr21": {
      "title": "Mass of the Twenty-first Sunday after Trinity",
      "source": "Warren, The Sarum Missal in English (1911), Part I (Sundays after Trinity), pp. 365–406",
      "note": "Source tier: English Sarum (Warren's translation of the Sarum Missal), used as the supplement because no Irish-specific text for the Sundays has been found. The wording is Warren's English from the 1911 book (scanning errors repaired). Warren prints only the first and last words of the Epistle and Gospel; the full reading is shown in the Douay-Rheims Bible, which is not the wording of the Sarum Latin lectionary.",
      "parts": [
        {
          "k": "Introit (Office)",
          "tx": "O Lord, the whole world is in thy power, and there is no man that can gainsay thee ; for thou hast made all things, heaven, and earth, and all the wondrous things under heaven. Thou art lord of all things.\nPs. Blessed are those that are undefiled in the way : and walk in the law of the Lord."
        },
        {
          "k": "Collect",
          "tx": "Grant, we beseech thee, merciful Lord, to thy faithful people pardon and peace ; that they may be cleansed from all their sins, and serve thee with a quiet mind. Through etc."
        },
        {
          "k": "Epistle",
          "pr": "Eph. vi. 10–17",
          "inc": "Finally, my brethren, be strong . . . word of God.",
          "ref": "ephesians 6:10-17"
        },
        {
          "k": "Gradual",
          "tx": "Lord, thou hast been our refuge : from one generation to another. ℣. Before the mountains were brought forth, or ever the earth and the world were made: thou art God from everlasting, and world without end."
        },
        {
          "k": "Alleluya",
          "tx": "Alleluya. ℣. Praise the Lord, O my soul ; while I live will I praise the Lord : yea, as long as I have any being, I will sing praises unto my God."
        },
        {
          "k": "Gospel",
          "pr": "St. John iv. 46–53",
          "inc": "There was a certain . . . his whole house.",
          "ref": "john 4:46-53"
        },
        {
          "k": "Offertory",
          "tx": "There was a man in the land whose name was Job, perfect and upright, and one that feared God : and Satan asked that he might tempt him; and power was given him by the Lord over his possessions, and over his flesh, and he destroyed all his substance, and his sons ; he smote his flesh also with a grievous boil."
        },
        {
          "k": "Secret",
          "tx": "Let these mysteries, O Lord, we beseech thee, provide for us a heavenly medicine, and cleanse away the vices of our hearts. Through etc."
        },
        {
          "k": "Communion",
          "tx": "My soul hath longed for thy salvation ; and I have a good hope because of thy word. When wilt thou be avenged of them that persecute me? They persecute me falsely: be thou my help, O Lord my God."
        },
        {
          "k": "Postcommunion",
          "tx": "Make us, we beseech thee, O Lord, always to obey thy commandments, that we may be rendered worthy of thy sacred gifts. Through etc."
        }
      ]
    },
    "tr22": {
      "title": "Mass of the Twenty-second Sunday after Trinity",
      "source": "Warren, The Sarum Missal in English (1911), Part I (Sundays after Trinity), pp. 365–406",
      "note": "Source tier: English Sarum (Warren's translation of the Sarum Missal), used as the supplement because no Irish-specific text for the Sundays has been found. The wording is Warren's English from the 1911 book (scanning errors repaired). Warren prints only the first and last words of the Epistle and Gospel; the full reading is shown in the Douay-Rheims Bible, which is not the wording of the Sarum Latin lectionary.",
      "parts": [
        {
          "k": "Introit (Office)",
          "tx": "If thou, Lord, wilt be extreme to mark what is done amiss : O Lord, who may abide it ? For there is mercy with thee, O God of Israel.\nPs. Out of the deep have I called unto thee, O Lord : Lord hear my voice."
        },
        {
          "k": "Collect",
          "tx": "Lord, we beseech thee to keep thy household [the Church] in continual godliness ; that through thy protection it may be free from all adversities, and devoutly given to serve thee in good works, to the glory of thy name. Through etc."
        },
        {
          "k": "Epistle",
          "pr": "Phil. i. 6–11",
          "inc": "We are confident . . . praise of God.",
          "ref": "philippians 1:6-11"
        },
        {
          "k": "Gradual",
          "tx": "Behold how good and joyful a thing it is : brethren, to dwell together in unity ! . ℣. It is like the precious ointment upon the head, that ran down unto the beard : even unto Aaron's beard."
        },
        {
          "k": "Alleluya",
          "tx": "Alleluya. ℣. He healeth those that are broken in heart : and giveth medicine to heal their sickness. Another verse. [Alleluya.] The Lord promised his blessing : and life for ever more. These last two Verses are said alternately throughout the week, when the service is ferial. If there be no ferial day throughout the week vacant for this purpose, then the second Verse shall be omitted altogether."
        },
        {
          "k": "Gospel",
          "pr": "St. Matt. xviii. 23–35",
          "inc": "The kingdom of heaven . . . their trespasses.",
          "ref": "matthew 18:23-35"
        },
        {
          "k": "Offertory",
          "tx": "Remember me, O Lord, who art above all power ; give me proper and eloquent speech in my mouth, that my words may be pleasing in the presence of princes."
        },
        {
          "k": "Secret",
          "tx": "Mercifully receive, O Lord, the sacrifice by which thou hast willed that both thou thyself shouldest be propitiated, and that salvation should be restored to us in the might of thy loving-kindness. Through etc."
        },
        {
          "k": "Communion",
          "tx": "I say unto you, there is joy in the presence of the angels of God over one sinner that repenteth."
        },
        {
          "k": "Postcommunion",
          "tx": "Having partaken of the food of immortality, we beseech thee, O Lord, that that which we have received with our mouths may bring forth in us the fruit of pure minds. Through etc."
        }
      ]
    },
    "tr23": {
      "title": "Mass of the Twenty-third Sunday after Trinity",
      "source": "Warren, The Sarum Missal in English (1911), Part I (Sundays after Trinity), pp. 365–406",
      "note": "Source tier: English Sarum (Warren's translation of the Sarum Missal), used as the supplement because no Irish-specific text for the Sundays has been found. The wording is Warren's English from the 1911 book (scanning errors repaired). Warren prints only the first and last words of the Epistle and Gospel; the full reading is shown in the Douay-Rheims Bible, which is not the wording of the Sarum Latin lectionary. Warren's rubric: when the season is prolonged, the Office 'I know the thoughts' is sung on three Sundays; the Sunday next before Advent always has its own Mass.",
      "parts": [
        {
          "k": "Introit (Office)",
          "tx": "I know the thoughts that I think toward you, saith the Lord, thoughts of peace and not of evil. Then shall ye call upon me, and I will hearken unto you, and I will turn away your captivity from all places.\nPs. Lord, thou hast become gracious unto thy land : thou hast turned away the captivity of Jacob."
        },
        {
          "k": "Collect",
          "tx": "O God, our refuge and strength, who art the author of all godliness, be ready to hear the devout prayers of thy Church ; and grant that those things which we ask faithfully we may obtain effectually. Through etc."
        },
        {
          "k": "Epistle",
          "pr": "Phil. iii. 17–21",
          "inc": "Brethren, be followers . . . unto himself.",
          "ref": "philippians 3:17-21"
        },
        {
          "k": "Gradual",
          "tx": "It is thou, O Lord, that savest us from our enemies : and puttest them to confusion that hate us. ℣. We make our boast of God all day long : and will praise thy name for ever."
        },
        {
          "k": "Alleluya",
          "tx": "Alleluya. ℣. He maketh peace in thy borders : and filleth thee with the flour of wheat."
        },
        {
          "k": "Gospel",
          "pr": "St. Matt. xxii. 15–21",
          "inc": "Then went the Pharisees . . . that are God's.",
          "ref": "matthew 22:15-21"
        },
        {
          "k": "Offertory",
          "tx": "Out of the deep have I called unto thee, O Lord : Lord, hear my voice."
        },
        {
          "k": "Secret",
          "tx": "We beseech thee, O Lord, to make us attentive unto thy sacred service ; and that we may serve thee without any stain of offence, do thou thyself make us such as thou commandest us to be. Through etc."
        },
        {
          "k": "Communion",
          "tx": "Verily, I say unto you, what things soever ye desire, when ye pray, believe that ye receive them, and ye shall have them."
        },
        {
          "k": "Postcommunion",
          "tx": "Having received, O Lord, the gifts of the holy mystery, we humbly beseech thee, that what thou hast commanded us to do in remembrance of thee, may be an effectual help to our weakness. Through etc."
        }
      ]
    },
    "tr24": {
      "title": "Mass of the Twenty-fourth Sunday after Trinity",
      "source": "Warren, The Sarum Missal in English (1911), Part I (Sundays after Trinity), pp. 365–406",
      "note": "Source tier: English Sarum (Warren's translation of the Sarum Missal), used as the supplement because no Irish-specific text for the Sundays has been found. The wording is Warren's English from the 1911 book (scanning errors repaired). Warren prints only the first and last words of the Epistle and Gospel; the full reading is shown in the Douay-Rheims Bible, which is not the wording of the Sarum Latin lectionary. Warren's rubric: when the season is prolonged, the Office 'I know the thoughts' is sung on three Sundays; the Sunday next before Advent always has its own Mass.",
      "parts": [
        {
          "k": "Introit (Office)",
          "tx": "I know the thoughts that I think toward you, saith the Lord, thoughts of peace and not of evil. Then shall ye call upon me, and I will hearken unto you, and I will turn away your captivity from all places.\nPs. Lord, thou art become gracious unto thy land ; thou hast turned away the captivity of Jacob."
        },
        {
          "k": "Collect",
          "tx": "O Lord, we beseech thee, absolve thy people from their offences ; that through thy bountiful goodness we may be delivered from the bonds of those sins which by our frailty we have committed. Through etc."
        },
        {
          "k": "Epistle",
          "pr": "Col. i. 9–11",
          "inc": "For this cause . . . with joyfulness.",
          "ref": "colossians 1:9-11"
        },
        {
          "k": "Gradual",
          "tx": "But it is thou, O Lord, that savest us from our enemies : and puttest them to confusion that hate us. ℣. We make our boast of God all day long : and will praise thy name for ever."
        },
        {
          "k": "Alleluya",
          "tx": "Alleluya. ℣. O Lord my God, in thee have I put my trust : save me from all them that persecute me, and deliver me."
        },
        {
          "k": "Gospel",
          "pr": "St. Matt. ix. 18–22",
          "inc": "While he spake . . . from that hour.",
          "ref": "matthew 9:18-22"
        },
        {
          "k": "Offertory",
          "tx": "Out of the deep have I called unto thee, O Lord : Lord, hear my voice."
        },
        {
          "k": "Secret",
          "tx": "We beseech thee, O Lord, that the offering of this present gift may cleanse us, and make us wholly worthy of the sacred things which we have received. Through etc."
        },
        {
          "k": "Communion",
          "tx": "Verily, I say unto you, what things soever ye desire, when ye pray, believe that ye receive them, and ye shall have them."
        },
        {
          "k": "Postcommunion",
          "tx": "Receiving thy heavenly gift, we beseech thee, O Lord, that thou wilt not suffer that which thou hast ordained for the healing of thy faithful people to turn to our condemnation. Through etc."
        }
      ]
    },
    "trAdv": {
      "title": "Mass of the Sunday next before Advent",
      "source": "Warren, The Sarum Missal in English (1911), Part I (Sundays after Trinity), pp. 365–406",
      "note": "Source tier: English Sarum (Warren's translation of the Sarum Missal), used as the supplement because no Irish-specific text for the Sundays has been found. The wording is Warren's English from the 1911 book (scanning errors repaired). Warren prints only the first and last words of the Epistle and Gospel; the full reading is shown in the Douay-Rheims Bible, which is not the wording of the Sarum Latin lectionary. Warren's rubric: when the season is prolonged, the Office 'I know the thoughts' is sung on three Sundays; the Sunday next before Advent always has its own Mass.",
      "parts": [
        {
          "k": "Introit (Office)",
          "tx": "I know the thoughts that I think toward you, saith the Lord, thoughts of peace, and not of evil. Then shall ye call upon me, and I will hearken unto you, and I will turn away your captivity from all places.\nPs. Lord, thou art become gracious unto thy land : thou hast turned away the captivity of Jacob."
        },
        {
          "k": "Collect",
          "tx": "Stir up, we beseech thee, O Lord, the wills of thy faithful people ; that they more plenteously bringing forth the fruit of good works, may of thy loving-kindness be more plenteously rewarded. Through etc."
        },
        {
          "k": "Lesson",
          "pr": "Jer. xxiii. 5–8",
          "inc": "Behold the days . . . their own land.",
          "ref": "jeremiah 23:5-8"
        },
        {
          "k": "Gradual",
          "tx": "It is thou that savest us from our enemies : and puttest them to confusion that hate us. ℣. We make our boast of God all day long : and will praise thy name for ever."
        },
        {
          "k": "Alleluya",
          "tx": "Alleluya. ℣. The heathen shall fear thy name, O Lord : and all the kings of the earth thy majesty. Throughout the week, when the service is ferial, the following Verse is said: Alleluya. ℣. When Israel came out of Egypt : and the house of Jacob from among the strange people. Or this Verse : Alleluya. ℣. I will give thanks unto thee with my whole heart : even before the gods will I sing praise unto thee."
        },
        {
          "k": "Gospel",
          "pr": "St. John vi. 5–14",
          "inc": "When Jesus then lifted . . . into the world.",
          "ref": "john 6:5-14"
        },
        {
          "k": "Offertory",
          "tx": "Out of the deep have I called unto thee, O Lord : Lord, hear my voice."
        },
        {
          "k": "Secret",
          "tx": "Favourably regard, O Lord, the sacrifice which is about to be offered unto thee, that it may both cleanse us from the corruptions of our present state and make us acceptable unto thy name. Through etc."
        },
        {
          "k": "Communion",
          "tx": "Verily, I say unto you, what things soever ye desire, when ye pray, believe that ye receive them, and ye shall have them."
        },
        {
          "k": "Postcommunion",
          "tx": "Grant, we beseech thee, almighty God, that our souls having been satisfied with the divine gift, may be filled with a longing desire to be kindled by the flame of thy Spirit, and to shine as bright lights in the presence of Christ thy Son at his coming. Through etc."
        }
      ]
    }
  };
  Object.assign(MASS, TRIN);
  const TRIN_WED = {"1": ["2 St. Peter i. 16–19", "We made known . . . in your hearts.", "2 peter 1:16-19", "St. Matt. v. 17–19", "Think not that . . . kingdom of heaven.", "matthew 5:17-19"], "2": ["Eph. iv. 17–24", "This I say, therefore, . . . true holiness.", "ephesians 4:17-24", "St. Matt. xxi. 23–27", "And when he was come . . . do these things.", "matthew 21:23-27"], "3": ["2 Tim. iv. 17, 18", "The Lord stood by me . . . Amen.", "2 timothy 4:17-18", "St. Matt. v. 25–30", "Agree with thine adversary . . . into hell.", "matthew 5:25-30"], "4": ["1 St. John ii. 3–6", "Hereby we do know . . . as he walked.", "1 john 2:3-6", "St. Matt. xvii. 10–18", "His disciples asked him . . . that very hour.", "matthew 17:9-17"], "5": ["1 Tim. ii. 1–7", "I exhort . . . in faith and verity.", "1 timothy 2:1-7", "St. Luke viii. 22–25", "Now it came to pass . . . obey him.", "luke 8:22-25"], "6": ["1 St. John ii. 21–25", "I have not written . . . eternal life.", "1 john 2:21-25", "St. Mark x. 17–21", "When he was gone . . . follow me.", "mark 10:17-21"], "7": ["Rom. viii. 1–6", "There is therefore now . . . life and peace.", "romans 8:1-6", "St. Matt. xii. 1–7", "At that time Jesus . . . the guiltless.", "matthew 12:1-7"], "8": ["Rom. v. 8–11", "God commendeth . . . Lord Jesus Christ.", "romans 5:8-11", "St. Mark ix. 38–48", "Master, we saw . . . is not quenched.", "mark 9:37-47"], "9": ["Rom. vi. 16–18", "Know ye not . . . of righteousness.", "romans 6:16-18", "St. Luke xvi. 10–15", "He that is faithful . . . sight of God.", "luke 16:10-15"], "10": ["1 Cor. xv. 39–46", "All flesh is not . . . which is spiritual.", "1 corinthians 15:39-46", "St. Luke xxi. 34–36", "Take heed to yourselves . . . Son of man.", "luke 21:34-36"], "11": ["1 Cor. vi. 15–20", "Know ye not . . . in your body.", "1 corinthians 6:15-20", "St. Luke xviii. 1–8", "And he spake . . . avenge them speedily.", "luke 18:1-8"], "12": ["2 Cor. iv. 5–11", "We preach not ourselves . . . mortal flesh.", "2 corinthians 4:5-11", "St. Matt. xi. 20–24", "Then began he to upbraid . . . than for thee.", "matthew 11:20-24"], "13": ["1 Thess. ii. 9–13", "Ye remember, brethren, . . . you that believe.", "1 thessalonians 2:9-13", "St. Matt. xii. 14–21", "Then the Pharisees . . . Gentiles trust.", "matthew 12:14-21"], "14": ["1 Tim. i. 8–14", "We know that the law . . . in Christ Jesus.", "1 timothy 1:8-14", "St. Luke xx. 1–8", "And it came to pass . . . do these things.", "luke 20:1-8"], "15": ["1 Tim. i. 8–14", "But we know . . . in Christ Jesus.", "1 timothy 1:8-14", "St. Luke xx. 1–8", "And it came to pass . . . I do these things.", "luke 20:1-8"], "16": ["Col. ii. 8–13", "Beware lest any man . . . all trespasses.", "colossians 2:8-13", "St. Mark viii. 22–26", "And he cometh . . . any in the town.", "mark 8:22-26"], "18": ["Rom. xv. 30–33", "Now I beseech you . . . with you all. Amen.", "romans 15:30-33", "St. Matt. xiii. 31–35", "The kingdom of heaven . . . of the world.", "matthew 13:31-35"], "19": ["2 Thess. ii. 15–17; iii. 1–5", "Therefore, brethren, stand . . . waiting for Christ.", "2 thessalonians 2:15-17|2 thessalonians 3:1-5", "St. Matt. xiii. 36–43", "His disciples came . . . let him hear.", "matthew 13:36-43"], "20": ["2 Tim. ii. 1–7", "Thou, therefore, my son, . . . in all things.", "2 timothy 2:1-7", "St. Luke xiv. 12–15", "When thou makest . . . kingdom of God.", "luke 14:12-15"], "21": ["1 Thess. i. 4–10", "Knowing, brethren beloved . . . even Jesus.", "1 thessalonians 1:4-10", "St. Luke vi. 6–11", "And it came to pass . . . do to Jesus.", "luke 6:6-11"], "22": ["Rom. iii. 19–26", "Now we know that . . . believeth in Jesus.", "romans 3:19-26", "St. Mark xi. 23–26", "Verily I say . . . forgive your trespasses.", "mark 11:23-26"], "23": ["Rom. v. 17–21", "For if by one . . . Jesus Christ our Lord.", "romans 5:17-21", "St. Matt. xvii. 24–27", "When they were come . . . for me and thee.", "matthew 17:23-26"], "24": ["1 Cor. x. 20–31", "I would not that . . . the glory of God.", "1 corinthians 10:20-31", "St. Matt. xxi. 28–32", "A certain man . . . might believe him.", "matthew 21:28-32"], "17": ["Rom. v. 17–21", "For if by one . . . Jesus Christ our Lord.", "romans 5:17-21", "St. Matt. xvii. 24–27", "When they were come . . . for me and thee.", "matthew 17:23-26"]};
  function ferialMass(mk, isWed) {   // Sarum: the Sunday Mass is repeated on the weekdays of its week; Wednesday has its own Epistle and Gospel
    const m = MASS[mk]; if (!m) return null;
    const n = mk.slice(2), wd = isWed && TRIN_WED[n];
    const parts = m.parts.map(p => {
      if (wd && p.k === 'Epistle') return { k: 'Epistle (Wednesday)', pr: wd[0], inc: wd[1], ref: wd[2] };
      if (wd && p.k === 'Gospel') return { k: 'Gospel (Wednesday)', pr: wd[3], inc: wd[4], ref: wd[5] };
      return p;
    });
    const note = 'Weekday: in the Sarum Missal the Mass of the preceding Sunday is said again on the weekdays of its week' + (wd ? ', with a proper Epistle and Gospel on Wednesday (Warren prints these after each Sunday).' : '.') + (n === '17' && wd ? ' Warren directs that this Wednesday uses the readings of the Wednesday after the 23rd Sunday.' : '') + ' ' + m.note;
    return Object.assign({}, m, { title: m.title + (wd ? ' — Wednesday' : ' — said on the weekday'), note, parts });
  }

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
      if (sun) return T(`${ORD(wk)} Sunday of Advent`, wk === 1 ? 95 : 75, 'Sunday', 'v', 'Advent', x);
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
      if (sun) return T(`${ORD(sn)} Sunday after Epiphany`, 50, 'Sunday', 'g', 'Epiphanytide', { noteKey: 'Time after Epiphany' });
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
      if (k === 7) return T('Low Sunday (Octave Day of Easter)', 62, 'Sunday', 'w', 'Eastertide', eas);
      if (k === 38) return T('Rogation Wednesday — Vigil of the Ascension', 55, 'Vigil', 'v', 'Eastertide', { fast: 'Vigil fast and abstinence', noteKey: 'Vigil Fast of the Ascension' });
      if (k >= 36 && k <= 38) return T(`Rogation ${wd}`, 50, 'Rogation Day', 'v', 'Eastertide', { fast: 'Rogation Day — litanies, procession, fast and abstinence', noteKey: 'Rogationtide Processions' });
      if (k === 39) return T('Ascension Day', 100, 'Principal Feast', 'w', 'Eastertide', { noteKey: 'Ascension Day & Octave of the Ascension' });
      if (k > 39 && k <= 46 && !sun) return T(`${wd} within the Octave of the Ascension`, 40, 'Octave Day', 'w', 'Eastertide', { noteKey: 'Ascension Day & Octave of the Ascension' });
      if (k === 42) return T('Sunday after the Ascension', 50, 'Sunday', 'w', 'Eastertide', { noteKey: 'Ascension Day & Octave of the Ascension' });
      if (k === 48) return T('Whitsun Eve — Vigil of Pentecost', 85, 'Vigil', 'v', 'Eastertide', { fast: 'Vigil fast; baptismal preparation', noteKey: 'Vigil Fast of Pentecost' });
      if (k === 49) return T('Pentecost (Whitsunday)', 100, 'Principal Feast', 'r', 'Whitsuntide', { noteKey: 'Pentecost (Whitsun) & Whitsun Octave' });
      if (k > 49 && k < 56) {
        if ([52, 54, 55].includes(k)) return T(`${wd} — Summer Ember Day (Whitsun Week)`, 80, 'Ember Day', 'r', 'Whitsuntide', Object.assign(em('Summer'), { noteKey: 'Summer Ember Days (Whitsuntide Fast)' }));
        return T(`${wd} within the Whitsun Octave`, 85, 'Octave Day', 'r', 'Whitsuntide', { noteKey: 'Pentecost (Whitsun) & Whitsun Octave' });
      }
      if (k === 56) return T('Trinity Sunday', 98, 'Principal Feast', 'w', 'Whitsuntide', { noteKey: 'Trinity Sunday' });
      if (sun) return T(`${ORD(k / 7)} Sunday after Easter`, k === 35 ? 52 : 50, 'Sunday', 'w', 'Eastertide', eas);
      return T(`${wd} of the ${ORD(Math.floor(k / 7) + 1)} Week of Easter`, 10, 'Weekday', 'w', 'Eastertide', eas);
    }
    // after Trinity
    const kt = diff(d, trin), post = { noteKey: 'Sundays after Trinity (Green Season)' };
    if (same(d, corp)) return T('Corpus Christi', 100, 'Principal Feast', 'w', 'After Trinity', { noteKey: 'Feast of Corpus Christi & Octave' });
    if (kt === 7) return T('1st Sunday after Trinity (within the Octave of Corpus Christi)', 50, 'Sunday', 'g', 'After Trinity', { mk: 'tr1', noteKey: 'Feast of Corpus Christi & Octave' });
    if (kt > 4 && kt <= 11) return T(`${wd} within the Octave of Corpus Christi`, 45, 'Octave Day', 'w', 'After Trinity', { noteKey: 'Feast of Corpus Christi & Octave' });
    const holyCrossEmber = emberWed(D(y, 9, 14)), eb = [0, 2, 3].map(n => add(holyCrossEmber, n)).find(z => same(z, d));
    if (eb) return T(`${wd} — Autumn Ember Day (Holy Cross)`, 45, 'Ember Day', 'g', 'After Trinity', Object.assign(em('Autumn'), { noteKey: 'Autumn Ember Days (Holy Cross Fast)' }));
    const nS = Math.floor(kt / 7);
    if (sun) {
      const mk = diff(adv, d) === 7 ? 'trAdv' : 'tr' + Math.min(nS, 24);
      return T(diff(adv, d) === 7 ? 'Sunday next before Advent' : `${ORD(nS)} Sunday after Trinity`, 50, 'Sunday', 'g', 'After Trinity', Object.assign({ mk }, post));
    }
    const ws = add(d, -dow(d)), fmk = diff(adv, ws) === 7 ? 'trAdv' : 'tr' + Math.min(nS, 24);
    return T(`${wd} after the ${ORD(nS)} Sunday after Trinity`, 10, 'Weekday', 'g', 'After Trinity', Object.assign({ fmk, wed: dow(d) === 3 }, post));
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
      if (same(e, d)) items.push({ title: f.name, score: SCORE[f.rank], rank: (f.src === 'B' || f.src === 'G') && f.rank === 'D' ? 'Double (Irish constitutions)' : RANK[f.rank], rankNote: rankNote(f), color: f.color, season: t.season, noteKey: f.name, feast: true, src: f.src, mk: f.m + '/' + f.d, transferred: e.getUTCDate() !== f.d || e.getUTCMonth() + 1 !== f.m });
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
    if (!fast && martin) fast = "St. Martin's Lent — an old pre-Christmas fast (whether kept c. 1500 is uncertain)";
    if (!fast && dow(d) === 5 && !(t.season === 'Eastertide' && diff(d, E) < 7) && !/^Nativity of Our Lord/.test(t.title)) fast = 'Friday — day of abstinence';
    const noteKey = w.noteKey || t.noteKey;
    let mass = w.mk && MASS[w.mk] || null; const srcNote = w.mk && SRCNOTE[w.mk] || '';
    if (!mass && t.fmk && (w === t || w.score <= 30)) { mass = ferialMass(t.fmk, t.wed); if (mass && w !== t) mass = Object.assign({}, mass, { note: `Today's ${w.title} is kept only as a memory, so the Mass is of the weekday. ` + mass.note }); }
    const kept = keptFor(d, w, t, fast, w.mk);
    return { kept, rankNote: w.rankNote || '', srcNote, src: w.src || '', srcText: w.src ? SRCTXT[w.src] : '', mass, title: w.title, rank: w.rank, color: w.color, season: t.season, fast, notes: note(noteKey) || note(t.noteKey || ''), also, date: iso(d), ember: !!(items.find(i => i.ember)) };
  }

  return { sarum, temporal, setData, FIXED, VIGILS, MASS };
});
