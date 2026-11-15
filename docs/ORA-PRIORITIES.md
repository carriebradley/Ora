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
