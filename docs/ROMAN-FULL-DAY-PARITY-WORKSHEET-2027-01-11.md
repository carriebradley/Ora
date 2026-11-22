# Roman full-day parity worksheet: January 11, 2027

**Issue [#155](https://github.com/carriebradley/Ora/issues/155) — initial machine-readable worksheet, not a certification.** Started November 22, 2026.

This worksheet is the first step in verifying **both Roman Mass and the complete Roman Liturgy of the Hours** against the *real appointed texts* for one day. The reproducible row data is in [`roman-liturgical-day-parity-2027-01-11.json`](roman-liturgical-day-parity-2027-01-11.json). It is deliberately small enough to inspect, split defects into focused issues, and resume across ChatGPT sessions.

## Date and official appointment

**Monday, January 11, 2027** — First Week in Ordinary Time, **green**, **Lectionary #305**, **weekday Cycle I**, **Psalter Week I**. The official [USCCB 2027 calendar (January, printed p. 15)](https://www.usccb.org/resources/2027cal.pdf) lists **Hebrews 1:1–6** and **Mark 1:14–20** for Mass. The [U.S. Lectionary weekday index](https://www.catholic-resources.org/Lectionary/2002USL-Weekdays-OT-I.htm) further identifies Psalm 97 and acclamation Mark 1:15. The Hours belong in **First Edition Volume III** (Ordinary Time, Weeks 1–5). A local diocesan feast or optional observance must be checked before calling the national appointment the only possibility.

## Comparison method and status discipline

Each JSON row records `office`, `element`, `expected`, `sourceUrl`, `oraModule`, `sourceStatus`, `oraCompared`, `textCompared`, `comparison`, and `note`. There are **27 discrete rows** across the Mass, conditional Invitatory, Office of Readings, Morning Prayer, three Daytime Hours, Evening Prayer, and Night Prayer.

| Field | Meaning |
| --- | --- |
| `official-calendar` | The USCCB calendar names the day or an appointed Mass reading. It does **not** certify Ora's display. |
| `lectionary-index` | A secondary indexed reference identifies the biblical citation; printed approved translation remains to be checked. |
| `publisher-first-edition-witness` | A First Edition website section points to a likely psalter/Office appointment. **Must confirm against the approved printed book** where possible; a live webpage link is not automatic authentication. |
| `pending` | Appointment or legitimate option has not yet been sourced. |
| `not-compared` | The relevant Ora output has **not yet been inspected and compared**. This is not a pass or fail. |

Future statuses should be `match-approved`, `appointed-different-translation`, `legitimate-option`, `wrong-appointment`, `missing-content`, `out-of-order`, `source-conflict`, or `unverified`; the comparison record must link a public-safe evidence reference and the issue/PR for its correction.

**No copied prayer text:** source links and short Scripture citations are sufficient for this tracker. Do not publish licensed prayers or a user's private Missal EPUB content in GitHub issues, code fixtures or test logs.

## Source witnesses for this day (not official book certification)

- [Office of Readings: ordinary Monday, Week I](https://divineoffice.org/ord-w01-mon-or/) — first reading Sirach 1:1–18, second reading identified as a letter of St. Clement of Rome; compare the appointed excerpt and text before marking verified.
- [Morning Prayer: ordinary Monday, Week I](https://divineoffice.org/ord-w01-mon-mp/) — the witness identifies Psalm 5, 1 Chronicles 29:10–13, Psalm 29, and short reading 2 Thessalonians 3:10b–13.
- [Evening Prayer: ordinary Monday, Week I](https://divineoffice.org/ord-w01-mon-ep/) — the witness identifies Psalm 11, Psalm 15, Ephesians 1:3–10 and short reading Colossians 1:9b–11.
- [Monday Night Prayer](https://divineoffice.org/ord-mon-np-w1-w3/) — source comparison must account for the weekday/solemnity context and permitted optional prayers.
- [GILH](https://divineoffice.org/general-instructions/), especially nos. 76–79: outside choir, a person may choose the most appropriate of Midmorning, Midday or Midafternoon Prayer. These remain separate Hours; do not collapse them into Lauds.
- [Reference-edition decision, Issue #154](ROMAN-LITURGICAL-REFERENCE-BASELINE-2026-2027.md); rights and publisher-specific distribution remain [Issue #166](https://github.com/carriebradley/Ora/issues/166).

## Initial source-to-Ora selection comparison — November 22, 2026

Issue [#157](https://github.com/carriebradley/Ora/issues/157) identifies two bounded-scripture defects in Monday Week I: Ora's Douay–Rheims **Morning Prayer** excerpt for **2 Thessalonians 3:10b–13** included the unappointed opening of verse 10, and **Evening Prayer** for **Colossians 1:9b–11** included the unappointed opening of verse 9. Both had full-verse display labels. Version 431 corrects these two precise boundaries and labels; `tools/import_roman_short_readings.py` now guards against accidentally reintroducing the extra clauses.

For this dated weekday, the renderer's three-part Lauds appointments (**Psalm 5; 1 Chronicles 29:10–13; Psalm 29**) and Vespers (**Psalms 11 and 15; Ephesians 1:3–10**) and matching First Edition antiphons are checked against the source witnesses. The public-domain biblical wording remains **a different translation**, not the approved U.S. First Edition wording. No copyrighted text has been added.

The four corresponding JSON rows are now `oraCompared=true` and `comparison=appointed-different-translation`, **but `textCompared=false`**: these checks confirm specific selections and excerpt boundaries, not exhaustive approved-text equivalence. Every other full-day row still needs inspection. The Mass source text for January 11, 2027 is not in the current archived USCCB feed (which had dates only through November 22, 2026 when this comparison began). The user-facing fallback must be assessed separately in Issue #156.

## Actual comparison still required

1. Render Ora's **Roman** Mass and every available Hour for `2027-01-11`, using U.S. national settings with Epiphany Sunday and the First Edition. Record an export or screenshot of *structure and section citations* without publishing copyright-protected text.
2. For each JSON row, verify the date/edition/appointed reference first, then **every spoken response, sequence, permissioned wording, hymn option and rubric** against the source. Do not infer exact matches from the 462/462 structural coverage count.
3. Mark the first concrete discrepancy with exact code location and a small separate issue/PR; attach source page or text identifier and tests.
4. Only set `oraCompared=true` after real output was checked. Only set `textCompared=true` where the exact wording (or clearly identified legitimate translation) was actually compared. Any unverified case stays open.

**Acceptance for #155:** a complete first-date comparison record with actual Ora-output findings and evidence for each relevant section, not merely an initial template. This PR establishes the reusable schema and source appointments; it should not by itself close #155.
