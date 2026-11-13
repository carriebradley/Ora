# Ora checks

The app still runs as a static website. These checks are development tools and do not publish anything.

With Node.js 24 or newer, from the repository folder:

```sh
node --test --test-isolation=none tests/*.test.cjs
```

The tests check the historical St. Martin's observance, fasting exceptions, Byzantine dates and tones, offline installation and upgrades, and all 63 original Church Fathers readings. The reading fingerprint file was generated from the untouched entries at commit `2b8e5af`; changing an old entry causes its preservation check to fail. Adding a new reading does not require changing those fingerprints.

`byzantine-readings.test.cjs` checks sourced corrections and church-specific behavior. `stamford-readings-2026.json` contains the Scripture citation pairs from 48 official 2026 Stamford propers, with source URLs and explicit notes about two heading/text discrepancies. It contains no copied prayer or Scripture text. See [the follow-up review](../docs/BYZANTINE-REVIEW-2026-11-11.md) for evidence and limits.

`byzantine-tones-2026.json` records 50 numeric Sunday tones from the Metropolitan Cantor Institute's published 2026 calendar. Palm Sunday and Pentecost have no ordinary tone in that source. The fixture checks facts, not the completeness of the calendar's propers.

For browser checks, install Playwright and axe-core in a separate development tools folder, then make that folder's `node_modules` available through `NODE_PATH`. Start a local server in the repository:

```sh
python3 -m http.server 8765
```

In another terminal, run:

```sh
node tests/browser-audit.cjs
```

Playwright uses `/usr/bin/chromium` when available, otherwise its installed browser. `ORA_CHROMIUM` selects another executable; `ORA_BASE_URL` selects a local server URL, including the trailing slash. `ORA_ARTIFACT_DIR` selects where screenshots and JSON reports are written (default: a temporary `ora-browser-audit` folder).

The touch audit checks swiping between the six navigation tabs, both end boundaries, vertical scrolling, controls, selection, pinch/cancellation, dialogs and persistence. The browser check covers six navigation tabs and the Sacred Liturgy deep link in all three traditions at a phone viewport, Edmonton/Melkite selection, private PDF/EPUB reading, selected keyboard and Settings interactions, the optional Polycarp reading during Lent, offline deep links and downloaded texts, plus the desktop calendar in light and dark mode. External image, Scripture and audio requests are deliberately blocked so the result does not depend on those services. It does not certify their live availability, Safari behavior, or screen-reader usability.


`calendar-accuracy.test.cjs` checks official 2026 Roman amendments, optional memorial precedence, transfers, Cheesefare aliturgical days, and church-specific service confidence. `liturgical-format.test.cjs` checks PDF headings/paragraphs, rubrics versus petitions, and safe Roman proper/fixed-prayer matching. Browser formatting tests use fictional source text and PDF-shaped rows; private uploaded books are never fixtures. The reader audit checks source response labels, default-hidden instructions, Eucharistic alternatives, appendix boundaries, and distinct Melkite/Ukrainian storage slots.

On main-branch pushes in the original repository, the browser audit also waits for the expected build on the published GitHub Pages site and checks Lauds, Vespers and Compline at 320/390 pixels in light/dark mode. Published screenshots and `published-results.json` are retained with the existing audit artifact. External media is blocked; this checks the deployed app's behavior and layout, not Safari or media availability. Local runs and pull requests do not depend on the live deployment.
