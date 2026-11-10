# Ora — daily prayer companion (PWA)

Static web app (no build step, no backend). Open `index.html` through any static host
(GitHub Pages, Netlify, `python3 -m http.server`) and "Add to Home Screen" on your phone.
Deep links for testing: `index.html?tab=pray&date=2026-11-08&kind=morning&rite=byz`.

## What's in it
- **Today** – three calendars (Roman modern · Byzantine · Sarum traditional), readings, saint quote, sacred art.
- **Pray** – morning/evening session per rite, with "Play session aloud" (browser text-to-speech), silence timers, links to the full hours.
- **Calendar** – month grid with all three calendars as toggleable layers; ƒ marks fasts; gold ring marks solemnities / principal / great feasts.
- **More** – hours of the day (highlights the current hour), settings, credits.

## Files
| file | role |
|---|---|
| `calendar.js` | Roman (OF) engine, Byzantine engine, Easter/Pascha computus. (A 1962 engine is still inside, unused by the UI.) |
| `sarum.js` | Sarum temporal cycle, Ember Days, Rogation, vigils, octaves, Lent / St Martin's fasts, fixed feasts. Works for any year. |
| `data.js` | Generated from your four calendars: UGCC 2026–27 events, Sarum descriptions, extra Roman fixed-date entries. |
| `content.js` | Art list, saint quotations (East + West), public-domain prayer texts, prayer flows, hours. Add entries freely. |
| `app.js`, `index.html`, `sw.js`, `manifest.webmanifest`, `icon.svg` | UI + offline/PWA |

## Settings that change the calendar
Ascension (Thu/Sun), Corpus Christi (Thu/Sun), Epiphany (Jan 6/Sunday), Byzantine Pascha (Gregorian/Julian; default Gregorian to match your UGCC file), Byzantine Old Calendar for fixed feasts, Sarum Lady-Day transfer.

## Content sources and licensing
- Readings **citations**: Catholic Readings API (MIT, USCCB-derived) – `cpbjr.github.io/catholic-readings-api`; documented as covering 2025–2026. Falls back to USCCB links. *Not testable from my sandbox – please check it loads on your device.*
- Readings **text/audio**: lectionary text (NABRE/ICEL) is copyrighted, so the app links to USCCB/Universalis. Phase 2: bundle Douay-Rheims (CC0, `janvier-s/original-douay-rheims`) for in-app text and read-aloud.
- Art images: fetched live from Wikipedia/Commons by search (cached); needs network the first time.
- Byzantine readings: links only (Stamford propers, MCI Apostol, Byzantine Catholic Daily Readings). A lectionary dataset slot is the main missing piece.

## Findings in your calendars (checked against the computus and the GRC)
**Roman file** – Sundays missing / outranked days listed: St Luke (Oct 18 '26), St Lucy (Dec 13 '26, Gaudete), Baptism of the Lord (Jan 10 '27 is labelled "Sunday in OT"), Jan 3 '27 is 2nd Sunday after Christmas not OT, St Anthony/F. de Sales/J. Bosco (Sundays in OT), Cyril & Methodius (1st Sunday of Lent, Feb 14), Perpetua (4th Sunday of Lent), Stanislaus, St Mark, Athanasius (Sundays of Easter), A. of Padua, Benedict, Alphonsus, Dominic, Queenship, Passion of JB, St James, Ignatius of Antioch (OT Sundays), Guadalupe (Dec 12 '27, 3rd Sunday of Advent). Ash Wednesday and Holy Thursday are missing; **Annunciation (Mar 25 '27) falls in Holy Week and moves to Mon Apr 5**. Holy Family is a Feast, not a Solemnity. Also Immaculate Heart (Jun 5 '27) coincides with St Boniface.
**Sarum 2027 file** – Holy Week and Easter+Octave are one week late (Easter 2027 is Mar 28; the file's own Septuagesima, Ash Wednesday, Ascension and Pentecost dates already assume Mar 28). Corrected on import. Ember ranges stop on Friday (Saturday omitted). Vigil of All Hallows (Oct 31 '27) is a Sunday – the app anticipates it to Saturday.
**UGCC file** – consistent with the engine (116 of 138 entries match by name; the rest are Soul Saturdays, eves, local saints, or naming).


## Roman readings from the USCCB feed (added)

`tools/fetch_readings.py` downloads the official feed (https://bible.usccb.org/readings.rss), splits it into
Reading 1 / Psalm / Reading 2 / Alleluia / Gospel, and merges it into `readings.json` (the feed holds only ~10 days,
so the file accumulates). The app reads `readings.json` first, then falls back to citations-only, then links.

- Hosted on GitHub Pages: `.github/workflows/readings.yml` refreshes it daily.
- Self-hosted: `15 9 * * * cd /path/to/ora && python3 tools/fetch_readings.py`.
- Run it once before first use (it needs normal internet; the build sandbox could not reach USCCB, so it was tested on a synthetic sample only).
- Terms: USCCB allows the daily readings on a website that does not require users to give anything of value, with the
  Lectionary copyright notice shown (the app does). Don't distribute through an app store or charge for it without a USCCB license.
  Reading the text aloud with your device's voice is a gray area under their terms — for personal use it is low risk; ask USCCB if you ever share widely.
- "USCCB audio" opens their own recording; the URL pattern is a best guess and falls back to their podcast index if it 404s.

## Byzantine readings / ECPubs

No open, dated Epistle/Gospel dataset was found. Links are provided to the Stamford propers, MCI Apostol, the Byzantine Catholic
Daily Readings Substack and ECPubs (free app + $7.50 Byzantine Daily Office). ECPubs states no reuse terms, so it is link-only.

## Byzantine readings
`byzlect.js` computes the Epistle and Gospel citations from the Byzantine lectionary table on byzcath.org (2013, unofficial, Slavic usage). Only citations are stored, linked to RSV-CE on Bible Gateway. A few entries are flagged "check this one" where the source table had typos. Verify against your parish book or ECPubs.

## Traditional Lauds and Vespers
`hours.js` holds the weekly psalter, hymns and collects from the Divinum Officium project (MIT licence, https://github.com/DivinumOfficium/divinum-officium), pre-1955 Roman breviary in English (Douay psalter). Shown on the Pray tab for the Sarum / traditional rite. Saints' days and Christmas-season propers are not included.

## Sarum Matins
`matins.json` (loaded the first time Matins is opened, then kept offline) holds the Matins lessons, homilies, responsories, antiphons, invitatories and hymns of the Roman Breviary before 1911 in English, from Divinum Officium (MIT licence). `hours.js` (`sarumMatins`) arranges them in the Sarum order: Sarum Sunday psalm scheme, Sarum antiphons, versicles and invitatory for the Sundays of Advent (Ora's own English of the Latin), the Sarum Gospel of the day for the homily on the Sundays of Advent and after Trinity, Sarum rules for blessings, lesson endings and the Te Deum. Each section of the office says whether its text is Sarum or Roman. For Patrick, Brigid, Colmcille, Finnian of Clonard, Brendan, Ciarán of Clonmacnoise and the Translation of Patrick, Columba and Brigit, the Matins lessons come from the Irish Lives in the Book of Lismore, in Whitley Stokes's translation (1890, public domain), OCR'd from the archive.org scan with obvious misprints corrected. Moling's come from Stokes's The Birth and Life of St. Moling (1907). Cuthbert and Fursey take theirs from Bede's Ecclesiastical History (Sellar's translation, 1907) and Malachy from St Bernard's Life (Lawlor's translation, 1920), both from the Project Gutenberg texts. Finbarr, Ciarán of Saighir, Kevin and Aidan (Maedoc) of Ferns take theirs from Charles Plummer, Lives of Irish Saints, vol. 2 (1922, public domain), the same way. `hours.js` now also holds the whole Douay psalter, so no psalm is loaded from the internet.
