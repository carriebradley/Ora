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
