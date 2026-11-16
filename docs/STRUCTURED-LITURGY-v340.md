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

## v341 — loader fix and safe empty slots
The source loader is explicitly exported to both the application and its
private-book reader. A regression test checks the export and normalization of
uppercase prokeimenon/Alleluia headings and chant-break asterisks.
When the saved service book has one *empty* named variable-hymn slot and the
next established service heading immediately follows it, Ora can fill that
slot in place without repeating its heading. A slot containing any printed
prayer text is not overwritten; ambiguous headings remain unresolved.

## v342 — Ukrainian prayer punctuation / chant marks
The continuous document reader now normalizes prayer text at the display boundary: chant pause asterisks disappear, extra spaces before punctuation are removed, and spacing inside parentheses and typographic quotations is tightened. The saved PDF or EPUB and parsed liturgical source are left unchanged. Speaker names, source annotations, rubrics, headings, hyphenated words and substantive punctuation are preserved. This applies to Ukrainian and Melkite prayer text in the unified reader, including source-extracted material and date-specific propers. Fictional test fixtures cover English lines with hymn asterisks, commas, exclamation marks, parentheses, and unlabelled prayer lines; real private PDFs remain local to each device.

## v348 — twelve-month Newton typika (2026)
Newton’s January–December 2026 monthly Word files now supply 63 dated, English St. John Chrysostom hymn records in `melkite-propers-2026.json`. The original November 6 dates and wording remain unchanged in a month-only reference dataset. This is **not** every day’s liturgy or a year-round Basil/Presanctified translation. January 30 (source weekday disagreement) and December 24 (Vesperal St. Basil service conflict) are quarantined rather than guessed. Each imported record carries its exact ISO date and monthly document name; the structured compositor rejects records with a mismatched date, month, or church, and the view only offers these hymns during a Chrysostom appointment. The combined dataset is cached for offline use and the import scripts live in `tools/import_melkite_propers_year.py`; full-monthly source books are not bundled. Both PDF and EPUB whole-text readers receive eligible dated hymns at known unambiguous positions, leaving local book bytes unchanged. Cite and review Newton's original month for any publication or liturgical decision.


## Conservative order guard for dated Melkite hymns

If PDF extraction places a later major liturgical heading before an earlier
one, Ora no longer inserts dated hymns inside that ambiguous service layout.
The compositor checks recognizable fixed milestones from Little Entrance and
Trisagion through Epistle, Gospel, Anaphora, Communion, and Dismissal. If the
order regresses, it leaves all saved-book prayers unchanged and retains the
day's hymns in the optional Readings & propers panel.

A regression uses a fictional two-part liturgy and all 63 verified Melkite
2026 hymn dates to ensure the complete original line order survives, including
the Trisagion, a repeated litany response, Eucharistic words and Communion.
Malformed order cases are tested separately. This is a structural safeguard,
not verification of the user's device-local PDF or a new liturgical
translation.


## Exact printed Newton heading aliases

The Newton liturgy prints "The Trisagion Hymn" and "The Holy Gospel" in
places where the compositor originally expected the shorter headings
"Trisagion Hymn" and "Gospel". These two exact printed titles now share
structural matching anchors with the shorter names. The source text and
rendered headings themselves are preserved without modification.

The compositor intentionally does not equate the two genuine alternative
Trisagion **prayers** with the Trisagion **hymn**. An ambiguous duplicate
(canonical plus printed variant) cannot authorize insertion. It also checks
the printed Gospel title in the global service-order safeguard. Tests run
all 63 date-specific 2026 Newton hymn records against a fictional service
using the printed variants and test duplicate titles, prayer-heading false
positives, section headings and reversed service order. No device-local
PDF was accessed or rewritten.


## Protecting fixed prayers when composing dated hymns

The structured compositor refuses a dated hymn placement when the proposed
interval contains an explicitly titled fixed Trisagion prayer, Gospel
preparation prayer, litany, or Anaphora. It also protects a bare minister cue
(such as `PRIEST:` or "The deacon proclaims:") immediately before
an insertion boundary. In these ambiguous cases, the affected dated hymn is
left in Readings & propers while other unambiguous hymns remain eligible.

A regression checks both genuine Trisagion prayer alternatives over all 63
imported Newton 2026 dates, the priest's Prayer Before the Gospel, bare
minister cues, and an ordinary litany before the Little Entrance. No fixed
prayers, source-book wording, or saved device-local files are modified.


## Browser-level Melkite composition verification

The Playwright suite now mounts a fictional saved EPUB in the actual
continuous Melkite reader and uses the verified November 15, 2026 Newton
record. After asynchronous hymn placement it checks onscreen hymn order,
two separately rendered "Lord, have mercy" responses, the deacon's
petition, the priest's Anaphora prayer, and Communion. Copyright notes,
appendices, page controls, and mobile overflow remain excluded.

A second fixture includes a protected Chrysostom Trisagion prayer. Dated
troparia must then remain in Readings & propers, while independently
safe Prokeimenon and Alleluia are inserted without duplication. Screenshots
are saved for both scenarios. These fixtures do not access or alter the
user's device-local PDF and do not certify the complete printed liturgy.
