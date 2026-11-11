# Pittsburgh calendar and Liturgical Text — 11 November 2026

## Result

At the user's request, Ora v149 uses the Ruthenian Byzantine Catholic tradition of Pittsburgh throughout Today, Pray, Readings, Calendar, and Divine Liturgy. Stored Melkite choices migrate to Ruthenian, Gregorian Pascha, Gregorian fixed feasts, and the default December 8 Holy Anna observance. Roman Mass continues to use the current Roman calendar, independently of the selected prayer tradition. Ukrainian heritage remains separate.

The calendar and readings use the existing Ruthenian engines, not a renamed Melkite dataset. Source links now lead to Pittsburgh's Metropolitan Cantor Institute (MCI), its lectionary, annual calendar, monthly Menaion, and prayer books. Selected corrections are checked against MCI; this is not a complete transcription of an annual parish Typikon. The daily readings are citation-based, with public-domain ASV passages when available, not a new licensed Catholic lectionary translation. The older Newton dataset remains for source regressions and is not used by the live Byzantine views.

January 18, 2026 is identified as Zacchaeus Sunday. The MCI 2026 local commemorations of Theodore Romzha (October 31) and the Theotokos of Guadalupe (December 12) are included. MCI's annual calendar takes precedence here over older monthly booklets; for example its older November Menaion places Theodore on November 1.

## Service selection

The ten 2026 Basil dates are January 1 and 5; February 22; March 1, 8, 15 and 22; April 2 and 4; December 24. Chrysostom is the usual Eucharistic liturgy on other days. Great Fast Wednesdays/Fridays, the first three Holy Week days, and the designated Lenten feast days use Presanctified. February 24 and March 9 are explicitly linked to Presanctified in the MCI 2026 calendar. Thursday of the Great Canon is also handled. Holy Friday and other ordinary Lenten weekdays do not default to a Eucharistic liturgy. Parish pastoral directions may prescribe additional Presanctified services.

Unsupported years explicitly have no verified service selection. The ordinary calendar can still compute dates, but it must not imply a verified annual service timetable.

Primary sources:
- https://mci.archpitt.org/LiturgicalCalendar2026.html
- https://mci.archpitt.org/Lectionary.html
- https://mci.archpitt.org/liturgy/Divine_Liturgy_Basil.html
- https://mci.archpitt.org/liturgy/DivineLiturgyPresanctifiedGifts.html
- https://mci.archpitt.org/liturgy/Fasting.html

## Liturgical Text reader

The implemented reader saves separate PDFs for Roman Mass, Chrysostom, Basil and Presanctified in IndexedDB on the user's device. It supports page navigation, page bookmarks, a selectable text view, an original-PDF fallback and offline reopening after the shell is cached. PDF.js 5.6.205 (Apache-2.0) is bundled locally, including its matching worker and license. PDFs are validated before atomic replacement; unsupported encrypted/damaged files and files over 100 MB do not replace a saved book. Text uses textContent; PDF scripts and XFA are disabled. Nothing uploads the private PDF to GitHub or a third-party viewer. Browser storage may be evicted: retain the original document.

The formal labels are **Liturgical Text** and **Open Text**. Date changes choose the appropriate service's saved book, not a random PDF. Each book retains its own bookmarked page: daily propers are not automatically assembled or indexed from an arbitrary PDF.

Preferred Byzantine source: the official combined English people's book, *The Divine Liturgies of our Holy Fathers John Chrysostom and Basil the Great*, published by the Metropolitan Church and hosted at https://mci.archpitt.org/servicebooks/DivineLiturgies.pdf . It contains people's prayers, responses, hymns and propers, including the Basil anaphora section; it is not a complete clergy liturgicon. Save the original to Files and select it in each relevant service slot. No restricted text is added to the public repository.

MCI's own prayer books have explicit private/parish download and copying terms: https://mci.archpitt.org/Publications.html and https://mci.archpitt.org/blog/using-this-website/ . The official Divine Liturgies book has a separate copyright notice requiring written permission to copy from the book; the broad MCI policy is not treated as a blanket republication license for it. Source access and local reading are kept distinct from public reproduction. ByzCath's independent Ruthenian draft study editions were also located under personal-use terms, but the app's preferred sources are now the official Pittsburgh books.

The official Presanctified people's book is listed by MCI as not available electronically. Ora explicitly reports this gap and lets the user select a permitted local copy. It does not substitute an Orthodox translation as though it were the Pittsburgh edition.

Roman source: the official England/Wales Order of Mass leaflet, https://www.liturgyoffice.org.uk/Missal/Text/MCFL.pdf . This supplies fixed prayers and responses, not the complete Missal or all daily propers. Regional rubrics may differ from U.S. practice.

## Limits and verification

Remaining gaps: a suitable complete current Roman Missal/daily propers source, an electronic official Pittsburgh Presanctified book, full annual parish service combinations, calendars beyond 2026 for service selection, native indexed integration of changing prayer texts, and testing on an actual iPhone/Safari. Existing in-app Byzantine daily prayer sequences remain devotional compilations; changing their calendar does not make them the complete official Pittsburgh offices. Full office books are linked separately.

The first reader commit passed 28 Node regressions, PDF saving/rendering/bookmarks/deletion/offline tests, 21 tab/tradition views and automated accessibility checks with no reported JavaScript errors or violations: https://github.com/carriebradley/Ora/actions/runs/43115469458 . This predates the subsequent Ruthenian switch; that switch requires a fresh workflow before publication. Local Chromium cannot launch here because process_singleton_posix.cc fails to create a socket (Operation not permitted), so browser validation runs in GitHub Actions. No local browser success is claimed.

Final validation of the Ruthenian switch: commit `a04b9f3a5c1470557bde67b3994f7e43ecfd90fc` passed **30 Node regressions**, all **21 tab/tradition views**, PDF validation/rendering/bookmarks/slots/deletion/offline/no-upload tests, stale-Melkite settings migration, and December 8 consistency across Today, Pray, Readings, Calendar and Liturgy. The browser reported no JavaScript errors and no automated accessibility violations. [Successful workflow](https://github.com/carriebradley/Ora/actions/runs/43116372419). This final report update changes documentation only.
