# Ora Version 1 — Roman liturgical fidelity gate (proposed)

Proposed: November 22, 2026. **Owner priorities captured; exact extent of V1 coverage awaits explicit agreement.** This document amends the previous assumption that the Roman Office need only be a reliable devotional adaptation. It does **not** assert that the present build is an official approved breviary.

## Product objective

The user should be able to open **Morning Prayer (Lauds)** on a given date and pray the Church-appointed Roman Office for that day, as she would in the corresponding approved U.S. breviary, subject only to clearly disclosed legitimate options and translation differences. The same principle extends to Evening Prayer (Vespers), Night Prayer (Compline), and eventually the other Roman hours. Accuracy takes priority over adding new content. Byzantine services should likewise follow their own authorized liturgical books and dated church-specific appointments, without cross-church substitutions.

**Preferred translation:** the official U.S. English translation for the chosen edition, where authorized for Ora's distribution mode. A different translation is a fallback **only if the actual appointed passages and prayers remain the same** and the alternative is clearly identified; being a historical Catholic translation does not, by itself, establish textual equivalence to an approved current liturgical edition.

## Candidate V1 blocking criteria (to agree with owner)

1. **An explicit reference edition.** Choose the relevant approved U.S. Roman *Liturgy of the Hours, First Edition* as the immediate comparison baseline, with dates and any permitted options documented. Track the confirmed Second Edition's staged implementation separately; do not silently mix First and Second Edition texts.
2. **Correct daily appointment and precedence.** Dates and the user's configured U.S. transfer rules must select the correct liturgical day, four-week psalter, Common/Proper, memorial/feast/solemnity, seasonal substitutions, and First/Second Vespers. Unverified substitutions must not appear as established liturgical appointments.
3. **Morning Prayer genuinely follows the approved order.** Account for the optional Invitatory when this is the first Hour; opening dialogue; appointed hymn/legitimate hymn choice; three-part psalmody (psalm, Old Testament canticle, psalm) with matching antiphons; short reading; responsory; Benedictus with its proper antiphon; appointed intercessions; Lord's Prayer; proper concluding prayer; and the applicable dismissal/blessing. Optional psalm-prayers and rubrics must not be passed off as obligatory spoken responses.
4. **Evening and Night Prayer match their appointed hours.** Evening Prayer must use its two psalms and New Testament canticle, corresponding antiphons, reading, responsory, Magnificat and antiphon, intercessions, Lord's Prayer, proper collect, and appropriate conclusion. Night Prayer must use the correct weekday/solemnity options, examination where appropriate, responsory, Nunc Dimittis, and conclusion.
5. **Text identity is distinguishable.** For each rendered section identify whether the words are the approved First Edition, an approved legitimate option, a different Scripture or hymn translation, a link to an official source, or unavailable. Never use generic or newly authored prayers as silent fillers inside an office presented as the Church's prayer.
6. **Source-backed parity evidence.** Maintain a dated, inspectable comparison matrix against a permitted official printed or published source for representative weekdays across all four psalter weeks, Sundays and both Vespers, memorials, feasts, solemnities, Advent, Christmas, Lent, Holy Week, Easter, Pentecost, and major transfer/year boundaries. Compare both *selection* and *section text*, not just presence. Include tests against these adjudicated fixtures and a whole-date-range check for unresolved selection/coverage.
7. **Clear failure behavior.** If Ora cannot establish an appointed text for a day or lacks rights to distribute it, explicitly say so and offer an authorized official source or a private device-local approved book. Never present a convenient alternative as if it were the official office.
8. **Safe publication.** The public GitHub Pages/PWA distribution, local caching, and private imported-book workflow must be checked against relevant text permissions and ecclesiastical review; no 'approved by the Church' claim without authorization. Preserve original user books, bookmarks, and offline data.
9. **Real-device acceptance.** On an iPhone, independently cross-check selected Morning Prayer dates side by side with a trusted official edition. Verify accurate reading order and usability offline, with large type, VoiceOver, and after app updates.
10. **Release discipline.** No V1 stability freeze or V1 designation until the content coverage chosen with the owner is demonstrated and the final GitHub CI, mobile/WebKit and Pages checks pass for the release commit.

## Currently evidenced, not yet certified

- The November 2026–June 2027 report counts **462 of 462** sampled Roman Lauds/Vespers offices with tracked structural sections present across eight transfer configurations. That is a **structural availability test**, not a verbatim/appointment audit or evidence of official publication approval.
- Ora currently uses historically sourced ICEL/ICET First Edition ordinary prayers and many antiphons, responsories, petitions, Gospel antiphons and collects; some biblical psalmody/canticles are **Douay–Rheims**, not the printed current U.S. translation; some hymns are historical alternatives. Its present README explicitly calls the Roman hours devotional adaptations.
- Existing on-device reader technology can retain a user-owned approved PDF/EPUB, which may be a lower-risk way to provide exact private text without Ora bundling that edition publicly. It is **not yet verified** that direct daily Office composition from that approved book is complete or accurate.
- The USCCB describes the official Second Edition's new Abbey Psalms and Canticles and revised texts. Diocesan implementation notices state first optional use begins February 10, 2027 and mandatory use December 3, 2028; confirm jurisdiction/date at the time of release.
- The 2025 USCCB publication guidelines enter into force November 29, 2026. Rights to reproduce translations, approval of a publication, and legitimacy of a liturgical text are separate questions.

## Suggested work order

1. Prioritize **Roman Lauds**: produce an element-by-element side-by-side comparison for a dated weekday, Sunday, memorial, and solemnity with their sources; itemize mismatch classes (selection, translation, missing part, placement, options).
2. Repair the most consequential Roman Office selection/wording discrepancies without swapping in invented prayer text; develop reference fixtures and repeat for all four psalter weeks and the seasonal matrix.
3. Complete Vespers and Compline parity; prioritize the Roman Mass reader's fidelity to the user-owned Missal where applicable. Then perform the church-specific Ukrainian/Melkite Divine Liturgy comparisons.
4. Decide explicitly whether V1 means exact authorized in-app texts for all core Roman hours, or an exact daily source-linked/on-device prayer workflow for portions that cannot be licensed for public bundling. The user strongly prefers the former.
5. Only after scope is accepted and parity is demonstrated, revisit the V1 freeze and complete on-device acceptance.

## Sources and ongoing records

- USCCB official guide to the Liturgy of the Hours: https://www.usccb.org/prayer-and-worship/liturgy-of-the-hours
- USCCB Liturgy of the Hours, Second Edition: https://www.usccb.org/prayer-and-worship/liturgy-of-the-hours/liturgy-of-the-hours-second-edition
- USCCB 2025 publication guidance: https://www.usccb.org/committees/divine-worship/policies/guidelines-for-the-publication-of-liturgical-books
- Ora recorded text inventory: [roman-office-text-permissions.md](roman-office-text-permissions.md)
- Ora dated audit: [roman-office-audit-2026-2027.md](roman-office-audit-2026-2027.md)
- Ora section-coverage report: [roman-office-section-coverage-2026-2027.json](roman-office-section-coverage-2026-2027.json)

This is a proposed **acceptance framework**, not a declaration that full approved wording may currently be distributed in the public PWA.