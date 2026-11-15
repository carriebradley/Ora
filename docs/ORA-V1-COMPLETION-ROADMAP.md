# Ora Version 1 completion roadmap
Updated: 15 November 2026

## Objective
Complete a dependable, attractive, clearly sourced private devotional prayer companion (a public GitHub Pages PWA), not a claim to publish complete or ecclesiastically approved editions of every official liturgical book.

## Release scope and definition of done
The Roman, Ukrainian Greek Catholic (Edmonton-first), Melkite Greek Catholic (Newton-first) and Traditional/Sarum selections must reliably:
- Show the correct liturgical day, observance precedence, fast, season, and calendar context without substituting a saint or weekday for a higher-ranking Sunday.
- Display a short, sourced primary saint biography when that saint is actually commemorated; avoid invented biographies or misplaced source alternatives.
- Present Today, Pray, Readings, Liturgy, Calendar, and settings coherently and consistently in light/dark mode at iPhone widths.
- Distinguish complete verified excerpts from historical alternatives, calculated calendar data, external sources, unverified or missing readings, and device-local books.
- Support the existing private book reader, bookmarks, and offline use without losing existing user data.
- Have a green GitHub Actions regression and browser audit on the release commit, plus human iPhone/Safari acceptance testing.
- Preserve the user's editorial preferences: title case rather than accidental ALL CAPS, Gaudete/Laetare on the correct third Advent/fourth Lent Sundays, primary saint only on Today and full list in Calendar, tradition-aware saint quotes/art, simple cards and source credits.

A complete official Roman Liturgy of the Hours, a complete Melkite/UGCC variable office, a full annual corpus of Fathers' readings, and complete imported copyrighted Mass/Divine Liturgy books are **outside the v1 release gate**. They remain optional future enhancements. This is a truthful scope decision, not a claim those texts already exist.

## Execution order

### P0 — Freeze, baseline, and triage
1. Keep the production main branch green. For substantive changes, work on a feature branch/PR where practical, merge only after tests pass, and retain a rollback commit SHA.
2. Audit current code and data against this release checklist; do not repeat implemented work.
3. Stop opportunistic one-reading-at-a-time additions unless they repair a release-blocking missing passage. Group future text imports by author/source and preserve exact editorial boundaries.

### P1 — Calendar and source correctness
1. Validate a representative date matrix across the 2026–2027 transitions, fasts, seasonal Sundays, Marian feasts, Great Lent, Pascha, Easter, first/second Vespers, Christmas Eve, transfer options, and December/January year boundaries.
2. Check Edmonton primary dated entries and New Westminster fallback against available official references, explicitly flagging the missing/quarantined dates; do not silently impose Canada-specific obligation rules on an American user.
3. Check Melkite Newton monthly typika against the dated selector before claiming daily service appointments are independently verified.
4. Keep the Edmonton December 24, 2026 no-liturgy/Basil conflict flagged until a revised eparchial source or direct authoritative confirmation resolves it.
5. Add regression tests for gaps found, not duplicated test suites for every completed feature.

### P2 — Core user workflows and quality
1. End-to-end tests for switching tradition/church, using Today > Pray > Readings > Liturgy > Calendar, deep links, font settings, contrast, touch behavior, correct titles, saint card and artwork behavior.
2. Reconcile remaining Roman proper-prayer witnesses/source IDs and remove silent unverified fallbacks. Current older audit identified 14 missing proper-prayer witnesses and 15 source IDs: re-count before acting.
3. Check private PDF/EPUB handling for save, restore, replacement protection, text selection, speaker labels, rubrics, reading size, and offline behavior.
4. Test cache upgrades: app build and service worker match, last valid downloaded texts retained, no empty cards from missing network resources, no loss of saved local books.
5. Finish mobile visual and accessibility audit (320 and 390px; light/dark; user font setting).

### P3 — Rights, labels, and content coverage
1. Keep Scripture, Office readings, full liturgical translations, and source editions distinguished; copyright status, publisher permission and ecclesiastical approval are separate questions.
2. Verify current conditions for public PWA publication and offline caching before bundling restricted official translations, especially with the approaching USCCB effective date of November 29, 2026. Never infer rights from private devotional intent alone.
3. Use linked publisher resources or the private on-device reader when rights/translation identity cannot be verified.
4. Maintain the Office of Readings inventory as an honest count of indexed, bundled and missing references. Do not block v1 on importing all remaining patristic texts.

### P4 — Release verification
1. Run the Node regression suite, browser/mobile audit and GitHub Pages published-build checks against the actual final commit.
2. Owner performs a short on-device Safari/PWA acceptance pass. Collect screenshots only for defects; test installed app, tab switching, selected rite, prayer text, font sizing, saved PDF/EPUB reopening, and airplane mode.
3. Fix release-blocking issues, repeat tests, then record a stable release SHA and concise limitation notes in README.
4. Do not declare v1 finished until checks succeed and owner reports device acceptance.

## What the owner needs to provide
- **Now:** One scope decision only: approve the v1 criteria above, allowing missing copyrighted or unverified texts to stay clearly linked/labeled rather than preventing release. Prior general implementation permissions remain in effect.
- **Later:** A short iPhone acceptance pass on a release candidate. Report visible defects or Safari-specific problems. No need to repeat design requests.
- **Only if needed:** Authoritative correction from Edmonton for the December 24 service conflict, or a specific rights-holder grant if importing a protected translation becomes essential. The assistant should research and prepare citations or a draft inquiry first, rather than asking the owner to search for documents.

## Status discipline
Every subsequent work session should report: (1) changes actually committed; (2) verification and deployment status separately; (3) remaining release blockers; and (4) the next highest-priority task. Avoid claiming background progress. Do not say a source is verified merely because a URL exists. Prefer fewer comprehensive releases to a stream of microscopic commits.
