# Ora Version 1 — full Roman liturgical day fidelity gate (proposed)

Proposed: November 22, 2026. **The owner's product priority is established: the complete liturgical day, with Roman liturgy first. The precise V1 coverage and accepted licensed-text delivery method are still to be agreed.** This supersedes the old assumption that a visually complete but approximate devotional adaptation is sufficient for V1. It does not claim that Ora is an approved liturgical book.

## Governing product objective

Ora should be a **true spiritual companion to the living Church** in the rite selected by the user. For the Roman Rite, its core experience encompasses **both Mass and the complete daily Liturgy of the Hours**, not Morning Prayer alone. The same fidelity principle extends to the Ukrainian and Melkite Byzantine Divine Liturgies and offices, and to the Traditional/Sarum material, each judged by that tradition's own authoritative texts and calendar, without silent cross-rite substitutions.

The first priority is to verify the **Roman Mass and Roman Hours together**; fixes to their appointments, sequence, translations, responses and optional texts take priority over adding new features or historical readings. The Hours and Mass must agree on the day's selected calendar observance and any legitimately different choices for the respective liturgies.

**Translation policy:** Prefer the approved official U.S. English wording for the applicable edition, where authorized for Ora's distribution and caching. If a different translation is unavoidable, keep the **same appointed biblical passages and liturgical prayers**, identify the translation conspicuously, and do not make improvised or historical devotional wording appear to be the official text. Authenticity of a different translation does not make it the U.S. approved wording.

## Candidate V1 blocking criteria (subject to final owner acceptance)

1. **Specify reference editions and jurisdiction.** Use the currently applicable approved U.S. Roman Missal, Lectionary and *Liturgy of the Hours* First Edition for parity checks. Track valid edition transitions separately. Record the chosen calendar, U.S. transferred solemnities, rank, and lawful optional choices; never silently combine editions or communities.
2. **One coherent Roman liturgical day.** Mass, Office of Readings, Invitatory, Morning Prayer (Lauds), Daytime Prayer (midmorning, midday or midafternoon), Evening Prayer (Vespers), and Night Prayer (Compline) must follow their actual appointed observances, psalter weeks, seasons and feast precedence. Distinguish genuine First/Second Vespers, vigil and anticipated celebrations, and optional/multiple Mass forms.
3. **Mass — correct order and actual texts.** The app must present the day-specific readings, responsorial psalm, Gospel acclamation and Gospel, entrance and Communion antiphons or their legitimate liturgical options, Collect, Prayer over the Offerings and Prayer after Communion, and the relevant Ordinary of Mass. It must navigate accurately through Introductory Rites, Liturgy of the Word, Liturgy of the Eucharist (including preface and Eucharistic Prayer options), Communion Rite and Concluding Rites. Do not automatically assign an optional Eucharistic Prayer, preface, ritual Mass or vigil when the approved books permit choices; explain the choice. Texts spoken by the priest or deacon must retain their role labels. The app is for preparation, following along and reflection, not a substitute for the Eucharistic celebration.
4. **Hours — full daily coverage, authentic structure.** Morning Prayer must include the legitimate Invitatory condition, opening, appointed hymn/option, three elements of psalmody with antiphons, short reading, responsory, Benedictus and antiphon, intercessions, Lord's Prayer, concluding prayer and appropriate blessing/dismissal. Evening Prayer has its two psalms and New Testament canticle, proper antiphons, short reading, responsory, Magnificat, intercessions and conclusion. Office of Readings requires its appointed psalmody and biblical and second reading/responsories; Daytime Prayer and Compline must use their proper structures, selections and conclusions. Omit neither an appointed passage nor required repetition; do not show a paraphrase as a valid replacement.
5. **Distinguish fixed text, appointed proper and options.** Preserve the different roles of the Ordinary, Proper of Time, Proper of Saints, Commons, readings, optional memorials, hymn alternatives and rubrics. Present legitimate options accurately without suggesting that one unverified option is mandatory. State whether a section is official wording, a clearly identified alternate translation, an official-source link, private approved text, or genuinely unavailable.
6. **Source-backed parity evidence.** Compare Ora *element by element* with a permitted current approved edition or trustworthy publisher witness. Maintain dated, inspectable comparison fixtures for weekdays in each psalter week, Sundays/First Vespers, memorials, feasts, solemnities, Advent, Christmas, Lent, Holy Week, Easter/Pentecost, major transferred dates, and year boundaries. Assess the **Mass and every core Hour** for correct appointment, content, order, and text provenance, not merely presence. Tests must catch wrong saints, prayers, psalms, antiphons, omitted responses, and misleading alternatives.
7. **Never silently synthesize liturgy.** On a source conflict, ambiguous Missal heading, missing approved translation, or unavailable reading, disclose the precise limitation and link to a trustworthy official source or the user's private book. The app must not quietly insert generic prayers, unrelated texts or guessed Byzantine propers to make the screen look complete.
8. **Other rites remain first-class, but Roman work leads.** Ukrainian and Melkite calendars, Divine Liturgy appointments, variable hymns and responses must be audited against their own relevant eparchial and service sources. Traditional/Sarum follows its documented historical texts and calendar; it must never be confused with the modern Roman Mass. Keep the known Edmonton Christmas Eve conflict flagged, and show source gaps rather than inventing texts.
9. **Publication, persistence and accessibility.** Verify public website/PWA, offline text caching, and source permissions independently from ecclesiastical approval. Preserve private PDF/EPUB files and bookmarks. Test iPhone/Safari, offline operation, update safety, readable prayer typography, accessibility and accurate rite switching. Avoid 'approved by the Church' claims unless authorization actually exists.
10. **No premature freeze.** Version 1 requires agreed coverage and source-based parity evidence, functioning daily workflows, an owner iPhone acceptance pass, and green final Node, browser, WebKit and Pages checks on the *release commit*. A successful CI build by itself is not liturgical certification.

## Currently evidenced, not yet certified

- Ora's Roman Office audit covers **462/462 structural Morning/Evening Prayer appointments** between November 2026 and June 2027 across eight transfer combinations. This confirms only tracked **section presence**, not every day's actual prescribed words or options.
- The Roman Office currently combines identified ICEL/ICET First Edition prayers with public-domain **Douay–Rheims** psalmody/canticles and some historical hymns. The translations are not the same throughout as the current approved U.S. books.
- The Roman Missal feature currently **navigates sections of a device-local EPUB**. Its recorded design is explicitly *not yet a fully assembled or independently certified daily Mass*: alternatives, prefaces, Eucharistic Prayers, Commons and vigils may require human selection. Scripture is separately displayed in Readings.
- Office of Readings coverage is incomplete, and Daytime Prayer and other hours still need independent side-by-side audit. Do not infer certification from the existence of a UI tab.
- Local PDF/EPUB reading and bookmarking are present, but their correctness with a specific user's approved book and daily liturgical text selection requires real-device testing.
- Public distribution permissions for official Roman translations and the daily USCCB Lectionary text corpus remain unresolved. A private imported approved book may enable exact personal reading without bundling the licensed words publicly. The distribution pathway must not dictate the wrong appointed content.

## Recommended execution sequence

1. **Produce a Roman liturgical-day parity report**, beginning with a representative ordinary weekday and Sunday: compare the appointed **Mass plus all Hours**, distinguishing errors of selection, order, text, translation, rubrics and legitimate options.
2. Repair Mass and Office failures that would cause the user to pray or read **the wrong appointed text**. Give Morning and Evening Prayer frequent attention, but do not defer the Mass or silently label partial coverage complete.
3. Expand repeatable parity tests across the four-week psalter, feast precedence, seasonal transitions, Sunday vigil/First Vespers, special Masses and the other Hours. Test a complete liturgical day as a coherent unit.
4. Choose an authorized way to provide official wording: qualifying website use, publisher/license arrangements, official publisher links, or private device-local books. Prefer actual approved English words; an alternate translation requires visible provenance.
5. In parallel, preserve Ukrainian/Melkite/Traditional functionality, then complete their source-specific audits. Defer unrelated content expansion until Roman fidelity is reliable.
6. Decide the detailed **V1 coverage threshold** with the owner before implementing a stability freeze. Retest on-device and publish only after the agreed criteria pass.

## Source references

- [USCCB — Liturgy of the Hours](https://www.usccb.org/prayer-and-worship/liturgy-of-the-hours)
- [USCCB — Order of Mass](https://www.usccb.org/prayer-and-worship/the-mass/order-of-mass)
- [USCCB — General Instruction of the Roman Missal](https://www.usccb.org/prayer-and-worship/the-mass/general-instruction-of-the-roman-missal/girm-chapter-2)
- [Ora Roman Office source and permissions inventory](roman-office-text-permissions.md)
- [Ora dated Roman Office audit](roman-office-audit-2026-2027.md)
- [Ora current Roman structural coverage report](roman-office-section-coverage-2026-2027.json)
- [Ora private Roman Missal implementation and limitations](PRIVATE-MISSAL-2026-11-12.md)
- [Ora public text publication-rights review](ORA-V1-PUBLICATION-RIGHTS.md)

**Status:** proposed acceptance criteria, not a claim of complete liturgical parity, authenticated official publication or clearance to distribute all requested text in the public PWA.
