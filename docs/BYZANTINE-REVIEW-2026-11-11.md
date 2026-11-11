# Byzantine calendar and readings: source review

This follow-up checks Ora against the U.S. Ukrainian Catholic Eparchy of Stamford and the Ruthenian Metropolitan Cantor Institute (MCI). It corrects specific defects; it does not certify every entry or replace an annual eparchial ordo.

## Verified corrections

| Area | Correction |
| --- | --- |
| Third Paschal week, Wednesday | The backward `Acts 8:28-25` becomes `Acts 8:18-25`. |
| Samaritan Woman Sunday | The Epistle starts at Acts 11:19, and the Gospel is John 4:5-42, replacing a truncated backward range. |
| All Saints | The impossible Hebrews 11:323 citation becomes 11:33; the Gospel's punctuation is made unambiguous. |
| Twenty-fourth Sunday after Pentecost | Ephesians 2:14-22 replaces the overlong 2:4-22. |
| Fifth Lenten week, Monday | Isaiah 37:33-38:6 replaces the backward 37:33-36:6. |
| St. Nicholas Matins | John 10:9-16 replaces John 10:1-9, following MCI. |
| Theophany Royal Hours, Third Hour | Acts 19:1-8 replaces 19:1-18. |
| Nativity Royal Hours, Sixth Hour | Correct the Isaiah reference to 7:10-16a; 8:1-4, 8-10. |
| Exaltation Vespers | Extend the Exodus reference through 16:1a, following MCI. |
| January 1 | Add Circumcision/St. Basil readings. January 1 can be Sunday before Theophany; it is no longer mislabeled Sunday after Nativity. Include January 1 and 5 in the Saturday-before-Theophany window. |
| July Fathers commemoration | Correct its Gospel endpoint to John 17:13. Stamford's published Ukrainian Sunday propers retain the cycle pair; the Ruthenian profile offers the MCI Fathers pair. |
| October Fathers commemoration | Use October 8-14 for the Ruthenian profile and October 11-17 for the Ukrainian profile. The previous shared rule misplaced the Ruthenian observance in some years. |
| Verse boundaries | Preserve the documented differences between Stamford and MCI for the third, tenth and fourteenth Sundays after Pentecost and All Saints. |
| Royal Hours placement | The reading sets now move to Friday with the calendar event when an eve falls on a weekend. The anticipated Friday is not presented as an ordinary Divine Liturgy day. Weekend eves retain their Saturday/Sunday Divine Liturgy propers and separate Vespers material. |
| Annunciation in Holy Week | Retain the Holy Week reading set alongside Annunciation instead of deleting it. The UI explicitly directs users to the eparchial ordo for the combined order. |
| Lazarus Saturday and Palm Sunday | Give these days a distinct calendar description instead of calling them ordinary days within the forty-day Great Fast. |

The old uncertainty flags for the corrected Acts and Ephesians readings are removed. The Archangels' Luke 10:16-21 and the Baptist's Luke 1:1-25, 57-68, 76, 80 already matched MCI and are no longer flagged merely because the older unofficial source had a typo. Other unverified material remains marked or qualified.

## St. Anna: readings and local date

The missing Divine Liturgy citations are now Galatians 4:22-31 and Luke 8:16-21. These are documented in U.S. Catholic sources below. No copyrighted reading text is copied into Ora.

The sources also show why church labels alone do not settle every local date. MCI lists December 8; St. Stephen's published Ruthenian parish bulletin lists December 9; an older U.S. Ukrainian eparchial typikon lists December 8. Ora retains its existing defaults (Ukrainian: December 9, Ruthenian: December 8) and adds a parish-date choice in Settings. That choice changes both the calendar event and its readings together. It is not a claim that every U.S. Ukrainian parish observes December 9 or every Ruthenian parish observes December 8.

## Evidence and tests

The 48 available Stamford 2026 Divine Liturgy propers, from January 4 through November 22 including Ascension, were downloaded from the eparchy's own index and compared with Ora. Only citation facts and source links are committed in `tests/stamford-readings-2026.json`; the PDFs and their copyrighted texts are not bundled.

Two printed-heading discrepancies are recorded in that fixture rather than copied blindly: the first Lenten Sunday text omits Hebrews 11:27-31 despite a broader heading; the Ascension Gospel text starts at Luke 24:36 despite a heading starting at 35. The comparison follows the actual passages in those cases. The tests normalize punctuation and verse-part letters when comparing whole-verse citation headings; precise part-verse boundaries are not all independently verified.

Regression checks cover the 48 Stamford pairs, the MCI corrections, both church profiles, weekend eves, Old Calendar Royal Hours, Annunciation/Holy Week overlap, January 1, the different October windows, and St. Anna's parish setting. A scan also rejects backward ranges and impossible three-digit verse numbers across the existing table. It does not validate every citation against a complete verse-count database.

The 63 original Office of Readings texts and the added Polycarp text are untouched; their existing preservation checks remain in the suite.

## Sources

- [MCI lectionary](https://mci.archpitt.org/Lectionary.html): movable and fixed reading citations, Royal Hours, January 1 and the Ruthenian Fathers windows.
- [MCI 2023 calendar](https://mci.archpitt.org/LiturgicalCalendar2023.html): January 1 as Circumcision/St. Basil and Sunday before Theophany, and the anticipated Nativity Royal Hours.
- [MCI Menaion, December 8](https://mci.archpitt.org/menaion/12-08.html): the Ruthenian default date of the Maternity of Holy Anna.
- [Stamford propers index](https://www.stamforddio.org/liturgical-propers): official U.S. Ukrainian sources. Each 2026 source PDF is linked individually in the reference fixture.
- [Stamford, October 17, 2021](https://storage.googleapis.com/wzukusers/user-27115622/documents/89aef8f52edb47528febbb46f9040246/October%2017%202021%20-%20TWENTY-FIRST%20%20SUNDAY%20AFTER%20PENTECOST.pdf): Ukrainian Seventh Council commemoration beyond the MCI October 8-14 window.
- [Saint Josaphat Eparchy typikon, November-December 2018](https://stjosaphateparchy.com/wp-content/uploads/2018/11/Typikon_2018-November.pdf): Ukrainian St. Anna feast citations and a documented December 8 local observance. This historical publication does not establish every eparchy's current date.
- [St. Stephen Byzantine Catholic Church, November 28, 2021 bulletin](https://saintstephenbyzantine.church/wp-content/uploads/2021/11/Bulletin-for-2021-11-28-St.-Stephen.pdf): the same St. Anna citations and a documented December 9 local observance.

## Work still needed

The two empty cycle dates on January 3-4, 2028 remain unresolved. The annual adaptation cannot safely be inferred just by borrowing pre-Lenten weeks; no guessed readings have been inserted.

The weekday cycle around Nativity/Theophany, other complex feast combinations, detailed afterfeasts and leavetakings, church-specific commemorations, and Matins Gospel rotation still need a fuller comparison with annual ordos. MCI and Stamford sometimes differ, and the table itself does not encode every local decision. The retained Annunciation/Holy Week sets do not constitute a complete combined liturgical service.

This release makes sourced corrections and makes local variation clearer. The wider calendar and offline-download work in the original audit remains open.
