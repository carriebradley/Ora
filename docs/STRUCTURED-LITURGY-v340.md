# Ora v340 — continuous structured Divine Liturgy documents

Ora's private PDF/EPUB reader remains the immutable source of the ordinary
service. The new `liturgy-document.js` compositor adds a semantic layer over
recognized local St. John Chrysostom prayers. It accepts separate date-stamped
Ukrainian and Melkite records; it does not upload, rewrite, or replace saved
books or bookmarks.

## Dated sources

* Ukrainian: `ukrainian-propers.json` from the Eparchy of Edmonton's verified
  2026 dated pages, including troparia, kontakia, prokeimena, Alleluia verses
  and Communion hymns where published.
* Melkite: `melkite-propers-2026-11.json`, imported from the Eparchy of Newton's
  official `November-2026.docx` typicon. The importer uses the official
  source URL and does **not** place the source DOCX in the public app.
  Six dates currently have verified English words: November 1, 8, 15, 21,
  22 and 29. Some dates provide only title references; these are not invented
  as texts. This source does not supply a verified day-specific Communion
  hymn for every date, so none is inferred.
* Different churches' translations and hymn appointments are never merged.

## Document assembly

The reader assembles a continuous, typographically consistent text. Before
the prayer is displayed, it reads the saved ordinary book as previously.
When it can identify **unique, ordered** source headings, it inserts dated
troparia and kontakia after the Little Entrance, the prokeimenon before
the Epistle, Alleluia before the Gospel, and the Communion hymn before
Holy Communion. It checks for existing same-category content and does not
double it. It never changes the source's fixed prayers.

If headings are absent, repeated or conflicting, the source-book text stays
unchanged and unplaced daily hymns remain in the collapsed `Readings &
propers` section after the service. Successfully inserted hymns disappear
from that supplemental panel to avoid duplicates. No unverified placement
is concealed with editor notes in the prayer text.

Recognized year-round St. John Chrysostom books are eligible for semantic
placement. The 2018 Ukrainian Easter booklet, unrecognized scans, Basil,
Presanctified and conflicting/no-service days retain the safe existing
presentation. No appointment is extrapolated beyond verified 2026 dates.

The date-specific JSON files are cached by the service worker so that
previously fetched dates remain readable offline; the original PDFs always
remain in browser-local IndexedDB. The optional source/manager controls
remain collapsed. Tests cover grammar, deterministic placement, conflict
fallback, church separation and mobile text layout.

## Outstanding precision work

The PDF parser cannot reliably identify all liturgical section headings in
every edition. Full in-place integration for **every** date and service is
not yet verified, nor are the November Melkite weekday hymns complete.
Expand source/edition coverage rather than supplying guessed words.
