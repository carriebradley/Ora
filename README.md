# Ora — daily prayer companion

A static JavaScript PWA for private devotional prayer, hosted publicly through GitHub Pages. There is no build step or backend.

Run locally with `python3 -m http.server 8765`, then open `http://localhost:8765/`.

## Main sections

- Today: the selected tradition's day, fasting observance, quote and sacred art.
- Pray: Roman and Byzantine morning, evening and night prayer; Traditional/Sarum hours. Roman hours are clearly labeled devotional adaptations, not the complete official modern Liturgy of the Hours. Text-to-speech sessions are currently disabled; linked Divine Office audio is separate.
- Readings: Roman daily readings, Byzantine references/text when available, and Traditional/Sarum Mass readings.
- Liturgy: separate Roman Mass and Divine Liturgy prayer readers. Scripture stays in Readings; publisher references are consolidated in More.
- Justice: Catholic social teaching and spiritual readings.
- More: Calendar, heritage material, settings and source credits.

## Calendar settings

Roman Ascension, Corpus Christi and Epiphany transfers and Sarum Lady-Day transfer are configurable. Byzantine views retain the **Ukrainian / Melkite selector**. Ukrainian uses **Edmonton** dated calendar facts and references, with New Westminster fixed commemorations and an explicitly labelled calculated cycle where Edmonton is missing or inconsistent. Canadian obligations are not imposed as U.S. requirements. Melkite retains Newton’s verified 2026 data. Ukrainian and Melkite service selection is labelled as the common calculated Byzantine cycle; local source conflicts remain explicit. Historical comparison engines are not selectable app calendars. Other years have no verified service schedule. The optional **Liturgical Text** reader opens private PDFs and unencrypted text EPUBs on the device, without uploading them. Each Ukrainian and Melkite service has a separate saved-book slot; existing documents and bookmarks are preserved. A saved Roman Missal EPUB displays daily propers, Gloria, Apostles’ Creed (Nicene fallback if necessary), and available general Eucharistic Prayers directly in the Mass view. Instructions are hidden; explicit source response labels retain their visual distinction. Ambiguous or unmatched days are reported, not guessed. The original book remains searchable from file management. See [the current audit](docs/ORA-AUDIT-2026-11-12.md) for completed checks, official sources, and remaining verification.

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

Run `node --test --test-isolation=none tests/*.test.cjs` with Node 24 or newer. See [browser audit instructions](tests/README.md). GitHub Actions runs the regression suite and Chromium mobile/desktop audit and retains screenshots. Safari and real screen-reader checks remain separate.
