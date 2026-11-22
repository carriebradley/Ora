# Roman liturgical reference editions and U.S. calendar baseline (Issue #154)

Reviewed **November 22, 2026**. This is the source baseline for comparing Ora with the Church-appointed **Roman Mass and all Hours**. The purpose is **fidelity**, not a claim that Ora currently reproduces an officially authenticated book. Work on the complete-day worksheet continues in #155. The source-of-truth handoff is #153.

## 1. Reference editions for this comparison

| Material | Reference | Authority and limits |
| --- | --- | --- |
| Mass ordinary and propers | *Roman Missal, Third Edition*, English for the dioceses of the United States, introduced in **2011**; with published U.S. adaptations and subsequent emendations | [USCCB Roman Missal](https://www.usccb.org/prayer-and-worship/the-mass/general-instruction-of-the-roman-missal/roman-missal) and [online GIRM](https://www.usccb.org/prayer-and-worship/the-mass/general-instruction-of-the-roman-missal). A personal EPUB is only a trustworthy wording witness after its title/edition and integrity are checked; the matcher's finding a heading does **not** prove approval or correctness. |
| Mass readings | U.S. *Lectionary for Mass*, revised **1998/2002**, with **2017 Supplement** and updates | [USCCB Committee on Divine Worship liturgical-books inventory, April 2022, printed p. 15](https://www.usccb.org/resources/newsletter-2022-04.pdf). The dated USCCB calendar also records each Lectionary number/citation. An ordinary Bible translation is **not** automatically the approved wording of the proclamation. |
| Hours in November 2026 | U.S. English *Liturgy of the Hours*, **First Edition (1975/1976)**, with the current Proper of Saints and duly updated calendar | [USCCB inventory, printed p. 16](https://www.usccb.org/resources/newsletter-2022-04.pdf), [USCCB Hours guide](https://www.usccb.org/prayer-and-worship/liturgy-of-the-hours). Compare the actual appointed psalms, antiphons, readings, canticles, responses, intercessions and collects against the specific First Edition witness. |
| Hours transition | U.S. *Liturgy of the Hours, Second Edition* was confirmed in **2025**. It first becomes **permissible February 10, 2027** and **mandatory December 3, 2028**. Publication is phased by volume. | [Archdiocese of Cincinnati liturgical implementation guidance](https://resources.catholicaoc.org/divine-worship-and-sacraments/news/liturgyhours); [USCCB Second Edition](https://www.usccb.org/prayer-and-worship/liturgy-of-the-hours/liturgy-of-the-hours-second-edition). Do not silently combine the editions, their psalm translations, or available proper texts. Use the First Edition as the **initial Ora audit baseline**, recording a later edition choice separately. |
| Calendar/appointments | [USCCB 2026](https://www.usccb.org/resources/2026cal.pdf) and [2027](https://www.usccb.org/resources/2027cal.pdf) *Liturgical Calendars for the Dioceses of the United States* | [USCCB current calendar and amendments](https://www.usccb.org/committees/divine-worship/liturgical-calendar). These official calendars provide observance, rank, color, Lectionary citation/number and psalter cycle; local/provincial calendars are required when they legitimately differ. |
| Mass option rules | *General Instruction of the Roman Missal* (GIRM), particularly nos. 352–367, and the rubrics of the approved Missal | [USCCB GIRM Chapter VII](https://www.usccb.org/prayer-and-worship/the-mass/general-instruction-of-the-roman-missal/girm-chapter-7). Its several permitted Masses, readings, Prefaces, and Eucharistic Prayers must be labeled as choices, not guessed from a date alone. |

**Translation standard.** Give priority to the authorized U.S. English liturgical wording for the chosen edition. If a different translation is needed, retain the **appointed passage and prayer**, indicate the substitution conspicuously at the relevant section, and do not describe it as the text printed in the U.S. liturgical book. Ora's Douay–Rheims psalms and some historical hymns are **not text-identical** to the First Edition U.S. Office; see [Roman Office provenance](roman-office-text-permissions.md). ICEL copyright permission, authorization of a particular edition, and ecclesiastical authentication of Ora are **separate questions** (see [publication review](ORA-V1-PUBLICATION-RIGHTS.md), Issue #166).

## 2. U.S. jurisdiction, transfers and calendar nuances

1. **Epiphany** is ordinarily celebrated on the Sunday January 2–8 in the United States. Confirm the appointed Baptism of the Lord and following ordinary week under this placement; do not assume a January 6 national observance.
2. **Ascension depends on the ecclesiastical province.** In **2027**, Thursday **May 6** is Ascension in the provinces of **Boston, Hartford, New York, Omaha, and Philadelphia**; in all other U.S. provinces the solemnity is transferred to **Sunday May 9**. The USCCB [2027 calendar, printed p. 7, note 6b](https://www.usccb.org/resources/2027cal.pdf) explicitly distinguishes these. The province of Newark transferred in 2022 (see [USCCB April 2022 Newsletter, printed p. 14](https://www.usccb.org/resources/newsletter-2022-04.pdf)). **Ora currently defaults to Sunday in `app.js`; this is not automatically the correct local setting.** Preserve user-chosen settings and do not silently force a province from an estimated location. Cross-module behavior belongs in #164.
3. **Corpus Christi** appears on the Sunday after Trinity in the U.S. proper calendar. Don't mix the universal Thursday appointment with U.S. Sunday selection.
4. **Annunciation 2027** falls on Holy Thursday, March 25, and is transferred to **Monday April 5**, per the USCCB [2027 calendar, printed p. 7, note 6a](https://www.usccb.org/resources/2027cal.pdf). Test the transferred calendar day, not only March 25.
5. **The Mass Lectionary's Sunday Year B** begins November 29, 2026, while **weekday Cycle I** applies January 11–February 9 and May 17–November 27, 2027; these are distinct from the *four-week* Office psalter. See [2027 calendar, printed p. 5](https://www.usccb.org/resources/2027cal.pdf).
6. **A local solemnity, patronal celebration, cathedral dedication, or religious/community calendar** may differ from the national proper; record the actual jurisdiction and the source before treating a particular selection as obligatory. No single national preset can cover every local situation.
7. A **holy-day obligation may be abrogated without suppressing the solemnity**. For example, the 2027 USCCB calendar says All Saints remains a solemnity on Monday, November 1, even though the Mass obligation is abrogated. Don't confuse obligation text with liturgical rank. [USCCB 2027 calendar, printed p. 7](https://www.usccb.org/resources/2027cal.pdf); [complementary norm](https://www.usccb.org/beliefs-and-teachings/what-we-believe/canon-law/complementary-norms/canon-1246).

## 3. Legitimate choices must not look like the only appointed text

- **Memorials and weekdays:** the GIRM provides different choices depending on rank and season. Weekday readings are generally maintained at memorials except when a proper reading is assigned; the 2027 USCCB calendar explicitly says to retain weekday selections in the usual case. It is wrong to choose every possible saint's Mass automatically.
- **Mass proper vs. Ordinary:** date/rank may select an appropriate Proper, but many **Prefaces**, **Eucharistic Prayers**, penitential forms, antiphon/chant forms, Masses for Various Needs, and certain vigil/day readings require their actual rubrical context. The app should display the alternatives or ask the user, not represent an arbitrary selection as *the* appointed Mass.
- **Hours:** the Invitatory is conditional on which Hour comes first; First/Second Vespers, feasts with proper texts, solemnities, Commons, and approved hymn alternatives require the correct weekday, season and rubric. No generic devotional prayer should silently stand in for an appointed liturgical text.
- **Local private books:** an owner-imported Roman Missal EPUB is not a public text license; its visible wording and bookmarks stay device-local. Its edition must be checked before treating a found section as an authoritative witness.
- **Source mismatches:** use statuses `verified-exact`, `appointed-alternate-translation`, `verified-legitimate-option`, `missing-source`, `source-conflict`, and `unverified`. An unverified or conflicting text must be explicitly identified, not styled as official.

## 4. Dated reference fixtures for subsequent tests

| Date | Jurisdiction/options | Official expected appointment |
| --- | --- | --- |
| 2027-01-11 | U.S. Epiphany Sunday | Monday following Baptism of the Lord; first weekday of Ordinary Time; weekday Lectionary Cycle I. Initial full-day parity worksheet (#155). |
| 2027-04-05 | U.S. transfer rules | Annunciation of the Lord transferred from 2027-03-25. |
| 2027-05-06 | U.S. province observing Thursday Ascension | Ascension of the Lord. |
| 2027-05-06 | U.S. province transferring Ascension to Sunday | Easter weekday; **not** Ascension on Thursday. |
| 2027-05-09 | U.S. province transferring Ascension to Sunday | Ascension of the Lord. |

**Test scope:** these fixtures verify **calendar appointments**, not Mass or Office prayer wording. PRs on #156–#165 must separately compare the actual texts, options, and order. The first side-by-side day is **January 11, 2027**, chosen because it is an ordinary weekday at the restart of Ordinary Time.

## 5. Release decisions still open

- Which ecclesiastical province and any diocesan/house calendars should the owner's *default* Roman configuration follow? The existing app offers a transfer setting, but this decision is not established merely by an estimated physical location. Keep the setting user-controlled until resolved; see #164.
- The permitted delivery method for official English **Mass, Lectionary and Hours texts** in this publicly served, offline-capable PWA is unresolved. See #166; don't assert that a personal devotion license settles publication rights.
- Whether the app will present the Second Edition as a **separate explicitly selected mode** once it becomes eligible in 2027; do not change the current edition automatically.

**Next:** #155 should complete an inspectable January 11, 2027 matrix for every Roman Hour and the Mass, including statuses for unavailable official wording. Once each section is source-verified, #156–#158 should implement small, independently testable corrections.
