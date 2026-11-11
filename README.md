# Ora — daily prayer companion

A static JavaScript PWA for private devotional prayer, hosted publicly through GitHub Pages. There is no build step or backend.

Run locally with `python3 -m http.server 8765`, then open `http://localhost:8765/`.

## Main sections

- Today: the selected tradition's day, fasting observance, quote and sacred art.
- Pray: Roman and Byzantine morning, evening and night prayer; Traditional/Sarum hours. Roman hours are clearly labeled devotional adaptations, not the complete official modern Liturgy of the Hours. Text-to-speech sessions are currently disabled; linked Divine Office audio is separate.
- Readings: Roman daily readings, Byzantine references/text when available, and Traditional/Sarum Mass readings.
- Liturgy: separate Mass and Divine Liturgy views, with the selected Byzantine liturgy tradition's readings and official source links.
- Justice: Catholic social teaching and spiritual readings.
- More: Calendar, heritage material, settings and source credits.

## Calendar settings

Roman Ascension, Corpus Christi and Epiphany transfers and Sarum Lady-Day transfer are configurable. The UI uses Gregorian Byzantine Pascha and fixed feasts. Melkite practice follows the supplied Diocese of Newton calendar for **2026 only**. Ukrainian and Ruthenian alternatives are retained. Other years explicitly fall back to Ukrainian data until an annual Melkite source is verified.

## Important files

| File | Purpose |
| --- | --- |
| `calendar.js` | Roman and Byzantine calendar engines |
| `melkite-2026.js`, `melkite.js` | Dated Newton calendar facts and integration |
| `tools/import_melkite_calendar.py` | Reproducible import from the supplied calendar PDF; requires PyMuPDF |
| `sarum.js`, `sarummass.js` | Traditional calendar and Mass texts |
| `hours.js`, `content.js` | Prayer texts, devotional adaptations and prayer flows |
| `oor.js`, `oortext.json` | Office of Readings index and 64 bundled public-domain second readings |
| `app.js`, `index.html` | UI |
| `sw.js` | Versioned offline app shell and persistent downloaded texts |
| `fetch_readings.py`, `fetch_divineoffice.py`, `fetch_angelus.py` | Scheduled content updates |

The active feed workflow is `.github/workflows/readings.yml`. The verification workflow is `.github/workflows/verify.yml`. External Scripture, art, audio and large text downloads need an initial successful connection; installing Ora does not download every external resource.

## Sources and reproduction

Newton calendar facts are attributed by date/page. Full copyrighted liturgical translations are linked to their publishers rather than imported without permission. Roman daily readings use the USCCB feed under its published website conditions. Public-domain Douay, patristic and historical Sarum sources and modern quotation links are credited within the app. See [release report](docs/ORA-RELEASE-2026-11-11.md) for exact source checks, limitations and remaining blockers.

## Verification

Run `node --test --test-isolation=none tests/*.test.cjs` with Node 22 or newer. See [browser audit instructions](tests/README.md). GitHub Actions runs the regression suite and Chromium mobile/desktop audit and retains screenshots. Safari and real screen-reader checks remain separate.
