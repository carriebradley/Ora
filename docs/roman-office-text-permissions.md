# First Edition Roman Office text inventory and permissions

Checked November 13, 2026. Ora is a free, noncommercial website. ICEL wording is
used under its published website permission, not treated as categorically
unavailable merely because it is copyrighted. Ora does not claim ICEL endorsement.

## Published permission

- [ICEL Publication Policies, printed page 25](https://www.icelweb.org/PubPolicy.PDF),
  amended 2008, 2010, 2013: approved and promulgated ICEL texts may appear on a
  noncommercial website without individual written or oral permission, subject to
  free access, exact text, appropriate acknowledgments on the first and last pages
  or frames displaying it, no implied endorsement, and ICEL's reserved rights.
- [ELLC reproduction guidelines](https://www.englishtexts.org/permissions) expressly
  extend their no-prior-permission reproduction policy to the older ICET texts.
  The older First Edition canticles are used, not the later ELLC revisions.
- [USCCB publication guidelines](https://www.usccb.org/committees/divine-worship/policies/guidelines-for-the-publication-of-liturgical-books),
  effective November 29, 2026, separately describe ecclesiastical authentication
  and publication approval. Using ICEL's copyright permission does not mean Ora
  has received ecclesiastical approval or a license for the Second Edition.

Each rendered Lauds, Vespers and Compline page/frame carries the ICEL and ICET
acknowledgments, including on first and last pages of the single-page interface.
Expanded source explanations stay in More → Sources & References.

These text rights remain with ICEL / ICET. Public availability of Ora's source
code does not grant an unrestricted or open-source license for these texts.
The app's ordinary shell cache serves the same free website; this implementation
does not claim a separate grant for publishing books, selling apps, distributing
standalone text databases, recordings or sublicensing texts to other publishers.

## Comparison of the existing Roman Office

| Section | Before | Replacement |
|---|---|---|
| Opening and doxology | Historical English and inconsistent modern wording | Exact current First Edition ordinary |
| Psalms and biblical canticles | Douay–Rheims | Retained: Grail / NAB are distinct rights |
| Four-week psalm antiphons | Opening-verse devotional refrains; missing canticle antiphons | Three sourced ICEL antiphons per Lauds / Vespers office; repeated after each psalm or canticle |
| Psalm-prayers | Absent | Sourced optional ICEL prayers in closed disclosure elements |
| Short reading | Historical chapters and selected appointed Douay passages | Scripture remains separately sourced; no NAB body imported |
| Short responsory | Historical weekly texts | Sourced ICEL responsories where the matching office is verified |
| Benedictus and Magnificat | Douay wording; no appointed antiphons | First Edition ICET wording; sourced ICEL antiphons where verified |
| Intercessions | Original generic petitions | Matching sourced ICEL petitions where verified |
| Lord's Prayer | Traditional punctuation and appended Amen | First Edition ordinary arrangement |
| Concluding prayers | Historical Sunday collects / generic Compline prayer | Matching sourced ICEL weekday and proper prayers where verified |
| Dismissal / night blessing | Approximate wording | First Edition ordinary |
| Compline | Generic antiphon, historical responsory, generic prayer | Seven weekday antiphon sets and prayers; special solemnity prayer; ICET Nunc Dimittis |
| Hymns / Marian antiphons | Historical public-domain texts | Retained, separately credited; no assumption that a modern hymn or recording belongs to ICEL |
| Office of Readings | Reading index and public-domain reading bodies | No existing ICEL prayer sections to replace; it remains an incomplete reader |

## Source integrity and liturgical selection

`roman-office-texts-data.js` records each prayer's exact source URL and edition.
`tools/import_roman_office_icel.py` extracts only eligible prayer sections from
private research captures, rejects missing boundaries or conflicting prayer
lines, and excludes Scripture bodies, hymns, recordings and website commentary.
The source's dynamic outer date/title is not the appointment witness: its inner
prayer heading and ribbon directions identify the actual office.

The four-week inventory contains 56 Lauds / Vespers witnesses: 44 weekday
offices and 12 Sunday offices (First Vespers, Lauds, Second Vespers). Sunday
proper Gospel antiphons and collects are **not** repeated every four weeks.
Solemnities and feasts do not inherit ordinary weekday antiphons. Seasonal
proper texts take precedence; an unverified section retains its identified
historical/devotional alternative rather than presenting a different day's
approved prayer as the appointed one.

Compline witnesses:

- [Monday](https://divineoffice.org/ord-mon-np-w1-w3/)
- [Tuesday](https://divineoffice.org/ord-tue-np-w1-w3/)
- [Wednesday](https://divineoffice.org/ord-wed-np-w1-w3/)
- [Thursday](https://divineoffice.org/ord-thu-np-w1-w3/)
- [Friday](https://divineoffice.org/ord-fri-np-w1-w3/)
- [After Sunday First Vespers](https://divineoffice.org/sun-np1/)
- [After Sunday Second Vespers](https://divineoffice.org/ord-sun-np2-w1-w3/)
- [Solemnity First Vespers](https://divineoffice.org/ord-solemnities-not-on-sunday-np1/)
- [Solemnity Second Vespers](https://divineoffice.org/ord-sol-np2/)
- [Easter Night Prayer](https://divineoffice.org/easter-sun-np2/)

The continued import now contains 380 source records, including the seasonal
and proper Lauds/Vespers sections. The source's concluding prayer sometimes
uses the current Roman Missal collect; these source-witness prayers are not a
claim to reproduce an unmodified 1974 printing or the forthcoming Second Edition.
The current US English First Edition has one proper Gospel antiphon at each
hour, used in all three lectionary years. The A/B/C alternatives belong to the
revised edition, as explained by the [USCCB March 2015 newsletter, p. 9](https://www.usccb.org/resources/newsletter-2015-03.pdf).
Sourced Sunday antiphons are therefore retained at Morning Prayer and First
and Second Evening Prayer; they are never recycled from another psalter week.

Outstanding appointment work is tracked in the dated Roman Office audit and
`roman-office-section-coverage-2026-2027.json` (section availability only).
This inventory is not a claim that all November 2026–June 2027 propers or
Common choices have been independently verified.
