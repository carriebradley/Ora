> Historical implementation notes. Current configuration and known limits are recorded in [the November 12 audit](ORA-AUDIT-2026-11-12.md). The live app offers distinct Edmonton Ukrainian and Newton Melkite calendars; Pittsburgh remains a separate reference.

# Liturgical Text and service selection — 11 November 2026

Ora v148 adds a local PDF reader. Each browser can save separate files for Roman Mass, Chrysostom, Basil and Presanctified. PDFs are validated with the vendored Apache-2.0 PDF.js 5.6.205 before an atomic IndexedDB replacement. No upload endpoint, external viewer or document fetch is used. Page bookmarks persist separately per service. The installed shell caches the reader and worker for offline reading. PDF scripting, XFA and evaluation are disabled. Text extraction is displayed with textContent; PDF links and actions are not executed.

The interface uses the formal title **Liturgical Text** and **Open Text**. It explains that calendar readings update daily while a saved PDF retains its own pages. It does not claim to assemble changing Missal propers from a static document. The file chooser is device-local; no texts are automatically added to someone’s phone. Browser storage is not a backup and can be evicted. Password-protected or damaged PDFs are unsupported. Files are limited to 100 MB. Original PDFs can also be opened in the browser from a temporary local blob URL.

## Calendar selection

Scope is the image-checked Newton **2026** calendar already bundled with Ora, with Gregorian Pascha on April 5. The service rules are derived from the sources below, not from a published parish timetable. Unsupported years explicitly report the missing calendar; they never reuse 2026.

Basil: January 1 and 5; February 22; March 1, 8, 15 and 22; April 2 and 4; December 24. This is the ten-service rule; 2026 needs no weekend transfer of either vigil. The first five Lenten Sundays and Holy Week dates agree with the Newton calendar. Chrysostom is the usual service otherwise, except the following:

- Great Fast weekdays: usual Presanctified Wednesdays/Fridays and Thursday of the Great Canon (March 19); other weekdays have no Eucharistic Divine Liturgy, while parish directions may prescribe Presanctified on additional days.
- Annunciation, March 25: Chrysostom, possibly joined to Vespers.
- Holy Monday–Wednesday: Presanctified. Holy Friday: no Eucharistic Divine Liturgy.
- Parish-specific celebrations (including occasional St. James) and service times are not inferred. Monthly propers and parish directions remain authoritative for local variations.

Primary sources:
- St. Ann Melkite Catholic Church, service explanation (the ten Basil occasions): https://stannmelkitechurch.org/pray/divine-liturgy-and-melkite-calendar/ . Its old 2022 dated list is **not** used for 2026 dates.
- Diocese of Newton, Presanctified practice and Annunciation exception: https://melkite.org/faith/sunday-scriptures/liturgy-of-the-presanctified-gifts
- Antiochian Patriarchate, Thursday of repentance and Holy Week: https://www.antiochpatriarchate.org/en/page/the-liturgy-of-the-presanctified-gifts/1019/
- Newton annual calendar and monthly directions: https://melkite.org/liturgical-resources

## Located texts and edition limits

1. **Roman Mass**: Catholic Bishops’ Conference of England and Wales, 2011 Order of Mass leaflet, https://www.liturgyoffice.org.uk/Missal/Text/MCFL.pdf . Four pages of official fixed texts; ICEL 2010 text copyright and CBCEW layout 2011. Available to read/download; not public domain. This is neither the complete Missal nor a current source for all Eucharistic Prayers or daily propers. The original is linked for private reading/import; no text is republished by this change. Regional directions can differ from US practice.
2. **Chrysostom and Basil — preferred personal study sources**: ByzCath.org English Ruthenian study liturgicons, https://www.byzcath.org/forums/ubbthreads.php/ubb/download/Number/1617/filename/Study-Liturgicon-Chrysostom.pdf and https://www.byzcath.org/forums/ubbthreads.php/ubb/download/Number/1618/filename/Study-Liturgicon-Basil.pdf . The source page https://www.byzcath.org/index.php/resources/worship-prayer-old/liturgical-texts explicitly offers them for private study and use. These are draft translations from an independent resource, not an official Church publication or a current Melkite edition. Personal-use terms are not treated as permission for public republication. The files remain publisher-hosted and are selected locally by the reader. This satisfies the broadened search for English Byzantine Catholic texts for personal use, with this authority/edition limit clearly stated.
3. **Chrysostom**: Newton-hosted https://melkite.org/wp-content/uploads/2012/02/LITURGY2009.pdf . Source is the 2009 draft supplied by the user; continuing approval was not established. It is labelled accordingly and is not copied into the public repository.
4. **Chrysostom, Basil, Presanctified**: Isabel F. Hapgood, *Service Book of the Holy Orthodox-Catholic Apostolic (Greco-Russian) Church*, 1906. Primary scan: https://archive.org/download/cu31924029363128/cu31924029363128.pdf . Edition metadata and US public-domain status: https://commons.wikimedia.org/wiki/File:Service_book_of_the_Holy_Orthodox-Catholic_apostolic_(Greco-Russian)_church;_(IA_cu31924029363128).pdf . This historical Orthodox translation contains all three services; it is **not** presented as an approved contemporary Melkite edition. Native, proofread transcription and a verified PDF service-page index are not included in this release.

These source links remove the need to search for documents. A user can save a source to Files and select it once in Ora. The app cannot prepopulate another device’s private IndexedDB. No claim is made that a private website automatically clears reproduction rights; reading a locally held document is distinct from publishing it. See the earlier permissions audit for official publication policies.

## Verification

Node tests cover all ten Basil dates, Lenten exceptions, Holy Week, Annunciation and unsupported years, alongside existing calendar and offline regressions. Browser tests exercise local PDF validation, page/text rendering, persistence, per-service selection, bookmarks, deletion and offline reopening; they also audit the existing mobile/desktop views and accessibility. Publishing requires the browser workflow to pass on the exact code commit.
