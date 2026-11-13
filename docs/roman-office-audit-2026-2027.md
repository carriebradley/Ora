# Roman Divine Office audit — First Edition, through June 2027

Scope: November 12, 2026 through June 30, 2027; Roman Lauds, Vespers, and Compline only. This is a *partial initial comparison*, not a claim that all daily offices have been independently verified.

## Sources and constraints

- DivineOffice.org daily First Edition material, including the user-provided November 12, 2026 Lauds, Vespers, and Compline.
- iBreviary user-provided November 12 texts as a second comparison.
- USCCB *2027 Liturgical Calendar for the Dioceses of the United States*, https://www.usccb.org/resources/2027cal.pdf
- Roman Office in `hours.js` and the Roman Compline renderer in `app.js`.
- The public repository must not incorporate copyrighted ICEL / iBreviary / DivineOffice.org translations or hymns without permission. The current Ora Roman offices are **devotional adaptations**, not complete official First Edition texts.

## Observed on November 12, 2026 (Saint Josaphat)

| Office | Verified selection | Outstanding |
|---|---|---|
| Lauds, Week IV Thursday | Psalm 143:1–11 (Vulgate 142), Isaiah 66:10–14a, Psalm 147:1–11 (Vulgate 146) | Proper antiphons, hymn, reading, responsory, Benedictus antiphon, intercessions, collect, conclusion |
| Vespers, Week IV Thursday | Psalm 144 in two parts (Vulgate 143), Revelation 11–12 | Proper antiphons, hymn, 1 Peter 4:13–14 reading, responsory, Magnificat antiphon, intercessions, collect, conclusion |
| Thursday Compline | Psalm 16 (Vulgate 15), Luke 2:29–32 Nunc Dimittis | Full reading 1 Thessalonians 5:23, responsory, Thursday concluding prayer, Marian antiphon, optional examination, official antiphons; display text remains incomplete |

Important: iBreviary and DivineOffice.org November 12 Vespers samples differ on the short responsory and Magnificat antiphon. Do not silently treat either witness as definitive. Verify printed First Edition rubrics and permissible alternatives.

## High-priority 2027 calendar checkpoints

Per the USCCB 2027 calendar:
- 2026-11-29: Advent I and Volume I begins.
- 2027-01-11: Ordinary Time and Volume III begin.
- 2027-02-10: Ash Wednesday; Lent and Volume II begin.
- 2027-03-25: Holy Thursday; Annunciation displaced.
- 2027-03-28: Easter Sunday.
- 2027-04-05: transferred Annunciation.
- 2027-05-06: Ascension on Thursday in Boston, Hartford, New York, Omaha, Philadelphia ecclesiastical provinces; elsewhere moved to Sunday May 9.
- 2027-05-16: Pentecost.
- 2027-05-17: Ordinary Time and Volume III resume.
- 2027-06-05: Immaculate Heart of Mary is optional when it conflicts with St Boniface.

## Audit method for subsequent dates

1. Resolve the day, rank, proper/Common, first-versus-second Vespers, and appointed Psalter week.
2. Compare the three psalm/canticle references, not the copyrighted wording.
3. Record the appointed short reading, responsory, Benedictus/Magnificat antiphon and proper collect by reference.
4. Check the full Compline pattern, including Sunday and solemnity exceptions.
5. Mark each element as confirmed, differs, missing, alternative-permitted, or not accessible.
6. Only publish permitted translations. Preserve private books locally.

## Verification status

The representative November 12 assignment has been inspected in Ora source. The broader day-by-day DivineOffice.org comparison for November 2026–June 2027 has **not** been completed; dated future content could not be retrieved reliably during this audit. No claim of a completed 231-day review should be inferred from this file.

## Continued review — November 12, 2026 (Work session)

Reviewed the latest 60 commits, including the preceding four-week psalter edits. Active Byzantine calendars remain **Ukrainian Catholic (Edmonton) and Melkite Catholic (Newton)**. Historical comparison fixtures do not select the app's calendar.

### Sources read for this pass

- [USCCB 2027 calendar](https://www.usccb.org/resources/2027cal.pdf), printed pp. 11–31: published Psalter-week anchors, January 2 Week I, January 4 Week II, Ash Wednesday Week IV, the resumption at Week VII of Ordinary Time, and June observances.
- [GILH](https://www.liturgyoffice.org.uk/Resources/Rites/GILH.pdf), §§85–92, 133–137, 204–239: ordinary structure, seasonal rules, feasts, solemnities, memorials and Marian antiphons.
- [Universal Norms](https://www.liturgyoffice.org.uk/Calendar/Info/GNLY.pdf), §61: evening concurrence, with the current celebration winning equal rank.
- [DivineOffice Holy Saturday Morning Prayer](https://divineoffice.org/lent-hw-sat-mp/): the **body** identifies Psalm 64, Isaiah 38:10–14,17–20, Psalm 150. The site's outer dated heading can disagree with the reusable prayer body; the outer heading was not used as a date witness.
- [DivineOffice Tuesday Night Prayer](https://divineoffice.org/lent-tue-np-w2-w4/): Psalm 143:1–11; [Easter Night Prayer II](https://divineoffice.org/easter-sun-np2/): Psalm 91 and Revelation 22:4–5.
- [Four-week reference table](https://catholic-resources.org/LoH/Psalter-Hours.html), used as a cross-check for ordinary verse divisions; it is a secondary index, not proof of every proper Office.
- Public-domain Douay–Rheims witnesses: [Daniel 3](https://www.drbo.org/chapter/32003.htm), [Deuteronomy 6](https://www.drbo.org/chapter/05006.htm), [Revelation 22](https://www.drbo.org/chapter/73022.htm).
- [iBreviary Night Prayer](https://www.ibreviary.com/m/breviario.php?s=compieta) was inspected for structure only. Its current page includes hymns marked ©2023 ICEL; those were **not** imported or treated as First Edition wording.

### Corrections implemented

| Area | Finding and correction | Verification limit |
|---|---|---|
| Christmas psalter | Weeks were advancing on Fridays from Christmas 2026. January 2 now stays Week I; January 4–9 stays Week II. | Christmas proper prayers still need review. |
| Sunday Lauds | Daniel 3:52–57 (`c220`) was referenced but missing entirely. Bundled the public-domain canticle. | Approved antiphons remain unavailable. |
| Verse limits | Source chant lines sometimes embed the next verse inside a row. Split embedded boundaries before filtering; Psalm 143:1–11 now excludes the beginning of verse 12. | Source versification still needs a complete Bible-to-chant-row audit. |
| Friday Week IV Vespers | Psalm 145's two parts repeated both halves of verse 13. Corrected to 1–13a and 13b–21. | Other half-verse details remain to be reviewed. |
| Holy Saturday Lauds | Replaced Saturday Week II with the sourced proper references. | Reading, responsory and collect remain adaptations. |
| Evening concurrence | Lauds/Vespers/Compline now accept saved transfer settings; Vespers and Compline share one precedence decision. April 4 retains Sunday II instead of anticipating transferred Annunciation. Easter-octave Saturday retains the selected Sunday II Compline pattern. | Full feast/solemnity Vespers psalmody is not supplied by this change. |
| Seasonal hymns | Ash Wednesday now receives the Lenten historical hymn; ordinary weekdays after Pentecost stop retaining Easter hymns. Palm Sunday Vespers II uses 1 Peter. | Hymns are historical alternatives, not the official First Edition selection. |
| Compline | Wednesday uses Psalm 31:2–6 rather than the entire psalm; Tuesday uses Psalm 143:1–11. Completed Saturday Deuteronomy 6:4–7 and Sunday Revelation 22:4–5. Added missing doxologies, opening Alleluia outside Lent/Triduum, Salve Regina / Easter Regina Caeli, and collapsed the optional conscience instruction. | Weekday concluding prayers, approved antiphons, Easter responsory variants and Triduum arrangements remain outstanding. |
| Updates | Repaired old-cache matching and synchronized app/worker versions. | Migration preserves downloaded texts and unrelated caches. |

`roman-office.js` now separates date/precedence planning from prayer text. Plans declare the First Edition reference, devotional text status, Douay–Rheims Scripture, and no authorized structured provider. It does not load a Second Edition source or grant reproduction rights.

### Regression coverage and remaining work

The seasonal tests contain 32 independently recorded USCCB Psalter-week anchors plus transfer/precedence cases. All 231 target dates render Lauds, Vespers and a Compline plan without missing bundled psalms/canticles or undefined values. **This is structural regression coverage, not independent verification of 693 complete Offices.** Browser checks additionally cover corrected Daniel text, night psalm limits, complete readings, Easter Marian prayer, hidden instructions, 320/390-pixel layouts and both color modes.

Still required: day-by-day antiphons and proper/Common assignments; complete short readings and responsories for Lauds/Vespers; feast/solemnity Evening Prayer psalmody; proper-psalm memorials (including Agnes); Christmas/Epiphany propers; the full Triduum and Easter octave; weekday Compline collects. Historical pre-1955 chapters, collects and hymns continue as labelled alternatives. The future dated DivineOffice comparison remains incomplete. No protected prayer translation or private book was added.

The follow-up defaults the service helper to Ukrainian, matching Ora's active selector, and requires the historical Pittsburgh fixture to opt in explicitly. The Roman reading view also removes chant pause marks from text inside divisions, and Compline repeats its scriptural refrain around each psalm. The first expanded browser run exposed a case-sensitive test mismatch with existing uppercase heading styling; the assertion now permits that styling. The app's design was preserved.

### Additional proper psalmody verified

- [Saint Agnes Lauds](https://divineoffice.org/0121-mp/), body/ribbon placement: Sunday Week I psalms despite the memorial rank. January 21 now receives that exception; ordinary memorials such as Josaphat retain the weekday.
- Easter-octave Evening Prayer: [Monday](https://divineoffice.org/easter-w01-mon-ep/), [Wednesday](https://divineoffice.org/easter-w01-wed-ep/), and the [closing Sunday's first](https://divineoffice.org/easter-w02-sun-ep1/) and [second Vespers](https://divineoffice.org/easter-w02-sun-ep2/) retain Psalms 110:1–5,7 and 114, with Revelation 19. Added the proper reference override through April 4, 2027, instead of ordinary weekday psalmody.
- [Second Sunday of Easter Lauds](https://divineoffice.org/easter-w02-sun-mp/) explicitly uses Sunday Week I, not the ordinary Week II morning set. This now closes the eight-day Easter sequence correctly.

These checks complete the **psalm-reference selection** for Agnes Lauds and the Easter octave in this pass. Their appointed antiphons, short readings, responsories and collects remain separately outstanding; no publisher prayer wording was copied. The browser suite also now recognizes Ora's existing Compline heading and reads heading styles atomically while asynchronous feeds render.

## Christmas and Epiphany continuation — November 13, 2026

The next pass replaces weekly-psalter fallbacks with verified **psalm/canticle reference sets** for the following Evening Prayers. First and Second Vespers use separate sets. Resolution uses the calendar's observance and the evening-precedence result, so January 3/6 Epiphany settings carry the proper Office with the celebration.

| Observance / phase | Modern psalm references | Canticle | First Edition source witness |
|---|---|---|---|
| Christmas I | 113; 147:12–20 | Philippians 2:6–11 | [Christmas I](https://divineoffice.org/1225-ep1/) |
| Christmas II | 110:1–5,7; 130 | Colossians 1:12–20 | [Christmas II](https://divineoffice.org/1225-ep2/) |
| Holy Family I | 113; 147:12–20 | Ephesians 1:3–10 | [Holy Family I](https://divineoffice.org/holy-family-ep1/) |
| Holy Family II | 122; 127 | Ephesians 1:3–10 | [Holy Family II](https://divineoffice.org/holy-family-ep2/) |
| Mary, Mother of God I | 113; 147:12–20 | Ephesians 1:3–10 | [January 1 I](https://divineoffice.org/0101-ep1/) |
| Mary, Mother of God II | 122; 127 | Ephesians 1:3–10 | [January 1 II](https://divineoffice.org/xmas-0101-ep2/) |
| Epiphany I | 135:1–12; 135:13–21 | 1 Timothy 3:16 | [Epiphany I](https://divineoffice.org/xmas-epiphany-ep1/) |
| Epiphany II | 110:1–5,7; 112 | Revelation 15:3–4 | [Epiphany II](https://divineoffice.org/xmas-epiphany-ep2/) |
| Baptism I / II | As Epiphany I / II respectively | As Epiphany I / II | [Baptism I](https://divineoffice.org/xmas-baptism-of-the-lord-ep1/), [Baptism II](https://divineoffice.org/xmas-baptism-of-the-lord-ep2/) explicitly direct these sets |
| Immaculate Conception II | 122; 127 | Ephesians 1:3–10 | [December 8 II](https://divineoffice.org/1208-ep2/) |

The Christmas-octave evening assignments use Christmas II where prescribed: [Stephen](https://divineoffice.org/1226-ep2/), [Holy Innocents](https://divineoffice.org/1228-ep2/), [December 29](https://divineoffice.org/1229-ep2/), and [December 30](https://divineoffice.org/xmas-sixth-day-in-the-octave-ep/). Higher-ranking evening observances take priority: December 26, 2026 instead opens Holy Family I; December 31 opens Mary, Mother of God I. These are explicitly tested.

DivineOffice's reusable prayer bodies and volume/page directions were inspected. Its changing outer date heading was not treated as a witness for the named celebration. No copyrighted translations, antiphons, hymn arrangements or recordings were imported. The previously inaccessible Immaculate Conception I witness was not silently filled by analogy; that phase remains outstanding.

Modern Roman Lauds/Vespers headings now display **modern psalm numbers** while keeping the source's Vulgate identifiers internally. This includes the combined/split Vulgate Psalms 113, 114/115 and 146/147. Traditional/Sarum rendering and its source numbering are preserved. This fixes a misleading heading such as “Psalm 112” when the appointed modern reference is Psalm 113.

The new regression file covers 14 dated evening assignments, both Epiphany transfer choices, and rendered psalm numbering. Browser checks cover Christmas, Holy Family and Epiphany phases at a narrow phone width; the published smoke check also opens Christmas Eve and Epiphany First Vespers. The full Office's appointed antiphons, short readings, responsories, intercessions and collects remain separate work. A verified psalm-reference set is not certification of the complete Office.

### Verified Christmas-season Vespers short readings

The next batch replaces the historical weekday chapter on these specifically verified Vespers. Each passage is bundled in **public-domain Douay–Rheims–Challoner wording**, not copied from the publisher's modern translation, and remains available offline.

| Observance | First Vespers | Second Vespers |
|---|---|---|
| Christmas | Galatians 4:4–5 | 1 John 1:1–3 |
| Holy Family | 2 Corinthians 8:9 | Philippians 2:6–7 |
| Mary, Mother of God | Galatians 4:4–5 | Galatians 4:4–5 |
| Epiphany | 2 Timothy 1:9–10 | Titus 3:4–5 |
| Baptism of the Lord | Acts 10:37–38 | Acts 10:37–38 |
| Immaculate Conception | Still outstanding in this pass | Romans 5:20–21 |

Appointment witnesses are the corresponding DivineOffice prayer bodies linked in the preceding table. Public-domain wording was checked against [Galatians 4](https://www.drbo.org/chapter/55004.htm), [1 John 1](https://www.drbo.org/chapter/69001.htm), [2 Corinthians 8](https://www.drbo.org/chapter/54008.htm), [Philippians 2](https://www.drbo.org/chapter/57002.htm), [2 Timothy 1](https://www.drbo.org/chapter/62001.htm), [Titus 3](https://www.drbo.org/chapter/63003.htm), [Acts 10](https://www.drbo.org/chapter/51010.htm), and [Romans 5](https://www.drbo.org/chapter/52005.htm). Commentary and verse annotations from those pages were excluded.

The resolver distinguishes first/second Vespers and the observed feast; it does not infer an octave day's short reading merely because it shares Christmas psalmody. Eleven dated Vespers checks verify the appointed reference, final verse, public-domain provenance and replacement of the historical chapter. The browser audit opens Christmas Eve for the first time **offline** and verifies its bundled reading; published checks include Christmas I and II reading references. Other daily short readings, approved responsories, intercessions and proper collects remain outstanding.

The immediate November 12 checkpoint also now receives its missing Vespers reading: **1 Peter 4:13–14** for Saint Josaphat, verified against the [dated 2026 DivineOffice prayer body](https://divineoffice.org/1112-ep2/) and bundled from the [public-domain 1 Peter 4 witness](https://www.drbo.org/chapter/67004.htm). This brings the reading tests to twelve dated Vespers. The previously noted disagreement between witnesses on other November 12 parts is not resolved by this reading correction.

### Presentation, Joseph, Annunciation, Ascension and Pentecost

Further prayer-body comparisons replace the ordinary Vespers psalter fallback with the following reference sets:

| Celebration / phase | Modern psalms | Canticle | Witness |
|---|---|---|---|
| Presentation, evening of February 2 | 110:1–5,7; 130 | Colossians 1:12–20 | [Presentation](https://divineoffice.org/0202-ep2/) |
| Joseph I | 113; 146 | Ephesians 1:3–10 | [Joseph I](https://divineoffice.org/lent-0319-ep1/) |
| Joseph II | 15; 112 | Revelation 15:3–4 | [Joseph II](https://divineoffice.org/0319-ep2-joseph/) |
| Annunciation I | 113; 147:12–20 | Philippians 2:6–11 | [Annunciation I](https://divineoffice.org/sol-annunciation-ep1/) |
| Annunciation II | 110:1–5,7; 130 | Colossians 1:12–20 | [Annunciation II](https://divineoffice.org/0325-ep2-annunciation/) |
| Ascension I | 113; 117 | Revelation 11–12 | [Ascension I](https://divineoffice.org/ascension-thursday-ep1/) |
| Ascension II | 110:1–5,7; 47 | Revelation 11–12 | [Ascension II](https://divineoffice.org/evening-prayer-2-ascension-thursday/) |
| Pentecost I | 113; 147:1–11 | Revelation 15:3–4 | [Pentecost I](https://divineoffice.org/easter-pentecost-ep1/) |
| Pentecost II | 110:1–5,7; 114 | Revelation 19 | [Pentecost II](https://divineoffice.org/easter-pentecost-ep2/) |

Annunciation I is available when precedence permits it, but **April 4, 2027 remains the Second Sunday of Easter**; Annunciation II is selected April 5. Weekday Presentation has no First Vespers on February 1. Both Thursday and Sunday Ascension settings receive the same proper sets on their respective dates. The Joseph sets remain distinct from Marian Commons.

The Revelation canticles continue through Ora's existing public-domain whole-verse Scripture mechanism. The source's finer canticle excerpts (including Revelation 12:10b–12a and selected lines of Revelation 19) still require a separate public-domain clause/half-verse transcription audit. Matching the named canticle here does **not** certify the exact liturgical excerpt or its approved wording. These new psalmody assignments do not claim to complete the proper readings, antiphons, responsories or collects.

The ordinary Vespers matrix previously treated February 2, 2027 as an ordinary Tuesday. It now chooses genuine Ordinary Time weekdays/memorials for each independently recorded week/day reference pair; separate seasonal and feast tests check the calendar and replacement rules. Narrow-phone browser checks include the new feast sets, and published checks include transferred Annunciation and Sunday Ascension.

### Revelation canticle excerpt correction

The previously recorded whole-verse limitation is now corrected for the **Revelation 11–12** and **Revelation 19** canticles. Their public-domain clause excerpts are bundled rather than hydrated as entire Bible passages.

- Revelation 11–12 now starts directly with thanksgiving, ends the reward passage before the destruction clause, starts Revelation 12 at the proclamation rather than its narrative introduction, and ends at 12:12a before the woe. The First Edition prayer-body selection was checked in the [Ascension witness](https://divineoffice.org/evening-prayer-2-ascension-thursday/); source wording is selected from the [Douay–Rheims chapter 11](https://www.drbo.org/chapter/73011.htm) and [chapter 12](https://www.drbo.org/chapter/73012.htm). The reference to God coming was omitted from the older Vulgate wording at 11:17 to follow the selected liturgical clause structure.
- Revelation 19 now contains four praise stanzas, with an Alleluia refrain, using the selected salvation/judgment, servants, reign/rejoicing and marriage clauses. Narrative introductions, the harlot passage, smoke and heavenly-creature narrative are excluded. The First Edition selection was compared with the [Pentecost II witness](https://divineoffice.org/easter-pentecost-ep2/); wording is public-domain [Douay–Rheims chapter 19](https://www.drbo.org/chapter/73019.htm).

These remain public-domain **devotional renderings of the biblical canticles**, not approved ICEL translations. Punctuation/capitalization is adapted at excerpt boundaries. Other biblical canticles still require their own clause/verse audit. Unit checks verify selected endings and exclusions; the browser suite first opens Ascension and Pentecost Vespers offline to verify both bundled texts, and published checks verify their displayed text.


## November 13: published ICEL / ICET permissions applied

The earlier copyright restriction is superseded for eligible ICEL-owned text by
ICEL’s published noncommercial website permission. See
[the text inventory and permissions](roman-office-text-permissions.md).
The ordinary, four-week psalter prayer sections and weekly Compline cycle now
use sourced First Edition wording where appointed. Grail and NAB bodies,
modern hymns, and recordings are separate and have not been imported by this
change. No Second Edition texts have been introduced.

All four weeks (56 Lauds/Vespers witnesses) were extracted with provenance.
Sunday proper canticle antiphons and collects are excluded from the repeating
four-week selection. Compline now distinguishes the Sunday concluding prayer
from the house-visitation prayer for solemnities outside Sundays. The remainder
of the seasonal, proper and Common audit is still incomplete.

## Seasonal and proper integration — November 13 continuation (v264)

The eligible-text bundle now contains **380 source records** (314 more than the
previous release). Seasonal and proper antiphons, optional psalm-prayers,
responsories, Gospel-canticle antiphons, intercessions and concluding prayers
now resolve through the calendar, including transferred feasts and First Vespers.
The importer recognizes unnumbered first antiphons, split psalms, alternate
canticle headings, Easter-octave response verses, and the Triduum's replacement
for the responsory. Four previously incomplete capture records were recovered.

Memorial psalmody follows the current weekday, preserving the checked Agnes
exception. Reusable Sunday pages cannot supply a cycle-specific Gospel antiphon
unless their cycle is independently verified. Other checked prayer sections are
still used. Fixed Christmas, Epiphany, Ascension and Pentecost antiphons remain.

The captured prayer bodies also establish these additional Vespers psalm sets
(modern numbers; Scripture bodies remain Douay–Rheims):

| Celebration | First Vespers | Second Vespers |
|---|---|---|
| Trinity | 113; 147:12–20; Ephesians 1 | 110:1–5,7; 114; Revelation 19 |
| Corpus Christi | 111; 147:12–20; Revelation 11–12 | 110:1–5,7; 116:10–19; Revelation 19 |
| Sacred Heart | 113; 146; Revelation 4–5 | 110:1–5,7; 111; Philippians 2 |
| Christ the King | 113; 117; Revelation 4–5 | 110:1–5,7; 145; Revelation 19 |

Witness URLs are recorded per phase in `roman-office-texts-data.js`, e.g.
[Trinity I](https://divineoffice.org/ord-trinity-sunday-ep1/),
[Corpus Christi II](https://divineoffice.org/ord-corpus-christi-ep2/),
[Sacred Heart I](https://divineoffice.org/ord-sacred-heart-ep1/), and
[Christ the King II](https://divineoffice.org/ord-w34-sun-ep2/).
[Good Friday](https://divineoffice.org/lent-hw-fri-ep/) and
[Holy Saturday](https://divineoffice.org/lent-hw-sat-ep/) use 116:10–19;
143:1–11; Philippians 2.
[Andrew](https://divineoffice.org/1130-ep2/) uses 116:10–19; 126; Ephesians 1.
[John the Baptist II](https://divineoffice.org/0624-ep2/) uses 15; 112; Revelation 15.

The reproducible section audit covers **462 Lauds/Vespers offices** from
November 12, 2026 through June 30, 2027 with US Sunday transfer settings:
425 have sourced antiphons and intercessions, 424 a sourced responsory or
replacement verse, 420 a concluding prayer, and 330 a usable Gospel antiphon.
See `tools/audit_roman_office_texts.cjs` and its committed JSON output.
These counts measure availability, **not complete liturgical certification**.
All imported proper antiphon sets that are used agree with the planned psalm
and canticle references. The guard rejects a mismatched set instead of applying
its antiphons to different psalms.

Remaining: 27 named source IDs are unavailable; Christmas-season weekdays
without a mapped source are listed separately among 37 unresolved offices;
the correct-cycle Sunday antiphons remain explicitly listed. Short Scripture
readings, hymn choices, exact canticle excerpts beyond those already checked,
and the complete Office of Readings still require work. This release does not
claim full First Edition equivalence. Edmonton Ukrainian, Melkite and Sarum
selection and private uploaded books are preserved.

Validation: 87 unit checks pass locally, including dated seasonal, precedence,
memorial, cycle and mismatched-psalmody cases. Local Chromium cannot start because
this environment denies its process-singleton socket; the GitHub browser suite
must pass before this batch reaches the published main branch.


## First Edition Sunday Gospel antiphons — v265 correction

The preceding v264 cycle restriction was incorrect for the current US English
First Edition. The [USCCB March 2015 newsletter, p. 9](https://www.usccb.org/resources/newsletter-2015-03.pdf)
explicitly distinguishes its single antiphon at each hour from the three A/B/C
alternatives in the revised Latin edition and forthcoming English Second Edition.
Ora now uses the captured proper antiphon at Morning Prayer, First Evening
Prayer and Second Evening Prayer in all three lectionary years. The three hours
retain their own distinct antiphons. No text is inferred from a different Sunday
or recycled from its repeating psalter week.

The 462-office section audit now finds **420 sourced Gospel antiphons**, up from
330: **90 additional offices** receive their sourced antiphon. All other section
counts and the unresolved-source list are unchanged. The machine-readable audit
now calls its generic rejection field `withheldGospelAntiphonIds`, avoiding the
incorrect suggestion that First Edition sources require A/B/C verification.

Regression checks include all three hours for the 33rd Sunday in 2026, 2027 and
2028 (cycles C, A and B), representative seasonal Sundays, and continued rejection
of a mismatched psalm-antiphon set. Browser checks cover the three November 14–15
hours on the local and published app. The existing structural checks continue to
cover the Ukrainian Edmonton, Melkite and Traditional calendars.


## Recovered propers and Christmas weekdays — v266

Recovered **18 source records**, bringing the bundle to 398. Corrected nine
source-ID mappings and the Easter-only Matthias mappings. This resolves 13 of
the preceding 27 named source-ID gaps, and adds 11 previously unmapped Christmas
offices. Friday after Epiphany Morning Prayer is now explicitly listed as an
unavailable source. These are availability improvements, not completion of the
full independent comparison or the appointed Scripture/hymn audit.

| Appointment | Prayer-body witnesses and correction |
|---|---|
| December 7, Ambrose Lauds | [1207-mp](https://divineoffice.org/1207-mp/); preserve the current weekday psalmody as a memorial |
| December 17 Vespers | [1217-adv-w03-thu-ep2](https://divineoffice.org/1217-adv-w03-thu-ep2/); correct the unexpected source suffix and restore O Wisdom |
| December 23 Vespers | [1223-w04-wed-ep](https://divineoffice.org/1223-w04-wed-ep/); recover the actual source ID and O Emmanuel |
| December 29–31 | [December 29 Lauds](https://divineoffice.org/1229-mp/), [Vespers](https://divineoffice.org/1229-ep2/), [December 30 Lauds](https://divineoffice.org/xmas-sixth-day-in-the-octave-mp/), [Vespers](https://divineoffice.org/xmas-sixth-day-in-the-octave-ep/), [December 31 Lauds](https://divineoffice.org/1231-mp/); December 31 evening still anticipates Mary, Mother of God |
| After Epiphany | [Wednesday Lauds](https://divineoffice.org/xmas-after-epiphany-wed-mp/), [Vespers](https://divineoffice.org/xmas-after-epiphany-wed-ep2/), [Thursday Lauds](https://divineoffice.org/xmas-after-epiphany-thu-mp/), [Vespers](https://divineoffice.org/xmas-after-epiphany-thu-ep/), [Friday Vespers](https://divineoffice.org/xmas-after-epiphany-fri-ep2/), [Saturday Lauds](https://divineoffice.org/xmas-after-epiphany-sat-mp/); select only after the observed Epiphany, leaving Baptism I intact |
| Joseph and Philip/James Lauds | [Joseph](https://divineoffice.org/lent-0319-mp/), [Philip and James](https://divineoffice.org/0503-philip-and-james-mp/); map existing records to their calendar observances |
| Ascension Lauds | [Morning Prayer](https://divineoffice.org/morning-prayer-ascension-thursday/); map both Thursday and Sunday observances |
| Matthias | [Lauds](https://divineoffice.org/easter-0514-mp/), [Vespers](https://divineoffice.org/easter-0514-ep2/); apply these witnesses only during Easter Time; Vespers uses Psalms 116, 126 and Ephesians 1 |
| Charles Lwanga Lauds | [June 3](https://divineoffice.org/0603-mp/); source the memorial prayers while retaining the current weekday psalmody |
| John the Baptist I | [First Vespers](https://divineoffice.org/0624-ep1-nativity-of-john-baptist/); Psalms 113, 146 and Ephesians 1 |
| Peter and Paul | [Lauds](https://divineoffice.org/0629-mp-peter-and-paul/), [I](https://divineoffice.org/0629-ep1-peter-and-paul/), [II](https://divineoffice.org/0629-ep2-peter-and-paul/); First Vespers uses Psalms 117, 147 and Ephesians 1; Second Vespers uses Psalms 116, 126 and Ephesians 1 |
| Easter VII I | [First Vespers](https://divineoffice.org/easter-w07-sun-ep1/); available where Ascension remains on Thursday; US Sunday Ascension keeps its own proper |

The 462-office US-transfer audit now finds 448 sourced antiphon/intercession
sets, 447 responsories or replacement verses, and **444 Gospel antiphons and
concluding prayers** (previously 420 each). No used proper psalm-antiphon set is
withheld for mismatching the planned references. Fourteen offices still have no
resolved prayer source; fifteen requested source IDs are listed as unavailable
(the extra one falls back to an ordinary weekday set). Source counts do not
certify the appointed Scripture translations, hymn choices, or complete Offices.

Validation adds dated regressions for the recovered mappings, Christmas-octave
and Epiphany-transfer context, First/Second Vespers, memorial weekday psalmody,
and apostle feast psalmody. All 90 unit tests pass locally. Mobile and published
browser checks include O Wisdom, O Emmanuel, Christmas December 30, Wednesday
after Epiphany, Matthias Vespers, and Peter/Paul First Vespers.
