# Ora Version 1 release baseline and verification findings
Date: 2026-11-15
Reference main commit before audit: `dab9e5b8bdca3ca3bd19220ea8be4a00802856cd`
Scope: Read-only source audit, regression gate and release-risk classification. This is **not** a claim of ecclesiastical approval or successful on-device QA.

## Verified repository findings
1. Latest verified application build before this report was `ora-v323`. GitHub Actions' verify and Pages deployment both completed successfully for its commit `99318240e5bd1cb53a63e051c7634caf78dde6d1`.
2. The recorded November 2026–June 2027 Roman Office structural audit covers 462 Lauds and Vespers appointments and eight Epiphany/Ascension/Corpus Christi transfer combinations. All report zero unresolved selections, missing named source IDs, and withheld psalmody/Gospel antiphon IDs. Sections counted as present are **not** necessarily independently verified verbatim or officially approved.
3. Calendar regression tests already check Gaudete (2026-12-13), Laetare (2027-03-07), Great Lent/Pascha dates, Sarum St Martin's Lent, Byzantine tones, transfer choices, feast precedence and the Edmonton 2026-12-24 conflict. Avoid repeating that work.
4. The 2026 Office of Readings index contains 562 unique references, of which 105 have internally bundled texts. Do not equate historical edition source links with complete bundled appointed second readings.
5. Pull requests #31 and #42 remain open but their relevant speaker-label and Gregory/Scholastica additions are already represented in `main`. Their earlier branches are obsolete; do **not** merge without a current comparison. They are housekeeping, not required release features.

## Remaining release risks

### P1: Source certainty
- Edmonton's 2026-12-24 source conflicts with the common calculated Basil appointment. The app correctly reports this as `source-conflict`, not an automatic service book; resolve only with an authoritative revised eparchial source.
- Edmonton has explicitly quarantined/missing dated pages. Keep source labels; no inferred dates should be presented as Edmonton-verified.
- Newton's dated 2026 Melkite entries exist, but individual monthly DOCX typikon service appointments require source matching before being called independently verified.
- Check the Roman Office *wording and appointment* on samples distinct from the structural 462/462 coverage. The 462/462 count must not be described as authenticated liturgical accuracy.

### P1: Public rights and ecclesiastical review
- Ora is a **public GitHub Pages site** even though its intended use is the owner's private devotion.
- The USCCB's updated `Guidelines for the Publication of Liturgical Books`, approved in June 2025, **take effect November 29, 2026**. They cover digital publications, distinguish devotional publications from participation aids, and discuss review/authentication and permissions.
- USCCB guideline §55 provides that the Secretariat determines whether a publication qualifies as devotional; §§56–60 discuss excerpts, options and review. Chapter introduction §§8–12 also discuss review/authentication and permissions.
- ICEL's *Publication Policies* offer a conditional noncommercial-website permission for promulgated texts, subject to exact reproduction, visible acknowledgments, no endorsement claim, and other limits. The relationship between that policy and the upcoming USCCB requirements, specifically for offline PWA caching, has **not** been resolved for Ora.
- Do not import further restricted translations merely because the app is noncommercial or used privately. Do not claim an Ora-specific grant, an imprimatur, or USCCB/ICEL approval.
- Primary references:
  - https://www.usccb.org/committees/divine-worship/policies/guidelines-for-the-publication-of-liturgical-books
  - https://www.usccb.org/committees/divine-worship/policies/guidelines-for-the-publication-of-liturgical-books/devotional-and-other-non-liturgical-publications
  - https://www.usccb.org/committees/divine-worship/policies/guidelines-for-the-publication-of-liturgical-books/appendix-iii
  - https://www.icelweb.org/PubPolicy.PDF

### P1: Device testing
- A GitHub Actions Chromium/axe audit does not certify Safari rendering, VoiceOver, installed-app behavior or the owner's private PDF/EPUBs. Before calling Version 1 complete, run an owner acceptance pass on the iPhone in Safari and as installed PWA.
- Acceptance scenarios: each tradition, Ukrainian/Melkite switch, Today saint/fast card, Daily Prayers and Liturgy navigation, 320/390px equivalent narrow layouts, large reading type, light/dark, private PDF/EPUB save/reopen/bookmarks, airplane-mode reopening, and update behavior.

## Current decision
**Freeze opportunistic reading imports.** Correct release-blocking source/workflow/display faults and user-visible data mismatches, run the shared gate, and seek the minimum necessary human/device checks. The release is not yet certified.

## CI gate
`tests/v1-readiness.test.cjs` checks actual regenerated Roman Office structural coverage, current roadmap warnings and the critical Edmonton conflict. The test does **not** certify copyrighted translations or replace a human iPhone pass.
