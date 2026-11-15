# Ora development priorities

Updated: November 15, 2026

The assistant is responsible for the active backlog and sets priority by (1)
potential loss/corruption, (2) liturgical accuracy, (3) interruption of prayer,
(4) completeness of core daily workflows, (5) aesthetic polish and breadth of
future sources. A new observation from the owner is evidence, not an automatic
override of all existing priorities; resolve reports on their merits without
requiring the owner to triage them.

## P0 — Immediate blockers
Broken startup, lost saved PDFs/EPUBs/bookmarks, broken navigation, false
service appointments, serious calendar or translation errors, accidental
public upload of private material, or a failing deployed reader. Stop lower
priority work until safe rollback or correction and green tests.

## P1 — Core prayer correctness and readability
Devotional reading shows prayers and responses, with restrained speaker cues
where necessary; ceremonial movement/posture instructions are excluded from
the in-app flow. The original device-local book remains unedited and viewable.
Strip chant pause asterisks and stray PDF spacing in display only. Maintain a
continuous, correctly ordered Divine Liturgy. Never inject uncertain daily
hymns, duplicate source prayers or silently substitute a church's translation.

## P2 — Source matching and day-specific completeness
Verify the Edmonton and Melkite appointments against their own dated calendars
and source documents; extend separately verified hymn coverage and semantic
placement. Do not fill missing English text by inference or import homilies,
Gospel bodies, or unverified seasonal variants as ordinary prayers. Record
conflicts rather than present an unreliable full service.

## P3 — Experience and visual polish
iPhone font sizes, accessible prayer headings, narrow phone overflow, light/
dark contrast, source-note minimization, simple cards, sensible caching,
offline preservation and straightforward UI. Fix high-frequency pain before
cosmetic tweaks to isolated non-core pages.

## P4 — Expansion
New historical readings, saints, art, optional text collections and broader
year/calendar coverage, after core quality and source certainty are stable.

## Verification discipline
Every substantive release needs targeted Node regressions, a GitHub browser
audit and Pages deployment check. Those are separate from on-device Safari
acceptance. Never label a deployment verified before its checks succeed.
Report changes actually committed and the single next priority. User feedback
can amend this order; the owner does not have to decide priority or approve
each implementation.

## Applied November 15
P1: Remove stage/posture directions and instruction toggle from continuous
Divine Liturgy; retain speakers, scripture references and actual prayer text.
The original saved PDF/EPUB still contains the complete edition when opened.

## Applied November 15 — v344
P1: Hide stray paired PDF folios (for example `10 11`) from the continuous Byzantine Divine Liturgy. Keep real psalm citations and spoken verse references untouched. In the devotional display, normalize standalone `god` to `God` without changing saved PDFs or the surrounding liturgical words. Source-derived daily hymn panels use the same capitalization convention. Regression fixtures reproduce the reported iPhone fragment.

## Applied November 15 — v345
P1: Saved Byzantine EPUB service books now read as one continuous document, matching PDFs. The prayer display skips explicit editorial front matter, ends before a labeled appendix, preserves recognized internal prayer headings and printed speaker roles, and excludes rubrics. Original books, per-book storage and bookmarks stay unchanged. Unit and mobile browser regression fixtures cover this behavior.

## November 15 — candidate v346
P1: The dated-liturgy composer detects existing printed Troparion, Kontakion and Kondakion lines even when the heading includes a saint, tone, or minister attribution, avoiding duplicate daily hymns. The day-specific Melkite prayer display also hides known import punctuation artifacts (`Tone 8))`, `You.!`) while preserving the source dataset. This change is only considered released after GitHub verification and Pages checks pass.

## November 15 — v347 release-safety audit
P1: Full-year automated Ukrainian/Melkite selector tests cover all 365 Gregorian 2026 dates. Every 2026 dated Ukrainian (72) and Melkite (6) hymn record is validated against its own calendar/typicon and exercised through the composed year-round prayer sequence without cross-church or cross-day substitution. Discovered that Newton's monthly source URL was not sufficient to establish an individual hymn date: Melkite records and the importer now carry an explicit ISO day, and `validRecord()` rejects a mismatched date. Source files remain separate; no private saved books are modified. Original April 1 Edmonton annotation conflicts with a generic 'Divine Liturgy' service label, so the established specific Presanctified appointment and caution remain unchanged rather than inventing a Eucharistic service.

## November 15 — v348 year-round Melkite hymns
P1: Import twelve Newton 2026 monthly DOCX typika to a single portable year-round dataset. Preserve 63 date-identified records in the private prayer reader; November six remain identical to the original import. Exclude January 30 (printed weekday mismatch) and December 24 (Chrysostom header conflicts with the Nativity Vesperal Basil service). Check proper source month and exact ISO date, place only for Chrysostom, never invent missing hymns, and keep original PDF/EPUB unchanged. Add monthly mobile and offline regression and make EPUB placement match PDF. Data not deemed a verified *complete* 2026 Melkite calendar; existing calculated/unverified service dates remain labelled as such. Deployment requires separate green Node, browser and Pages checks.
