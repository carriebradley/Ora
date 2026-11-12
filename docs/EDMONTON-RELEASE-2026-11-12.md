# Edmonton calendar and private text reader

The Ukrainian option now uses Edmonton's dated calendar facts and Scripture references throughout Ora. The Ukrainian/Melkite choices in More and Settings remain available, and Melkite continues to use Newton's verified 2026 dataset. This release preserves the current navigation, typography and More layout, including Sacred Liturgy inside More.

## Sources and coverage

- Primary: <https://eeparchy.com/calendar> and dated pages, for example <https://eeparchy.com/calendar/2026-11-12>.
- Fixed Menaion: <https://nweparchy.ca/menaion/>, consistent with the user's uploaded New Westminster PDF anchors.
- 183 dated Edmonton entries and 366 fixed Menaion dates are bundled. The dated entries cover July–December with gaps. Of those entries, 181 provide usable reading references; December 24 and 29 require consulting the source.
- 62 published entries are withheld: repeated Sunday/weekday conflicts in May/June, Jeremiah one day early on April 30, and two missing source pages (July 1 and December 30). January–March have no dated entries in the source index reviewed. Other missing dates remain explicit.
- Missing/conflicting dates show New Westminster fixed saints alongside a labelled calculated Ukrainian seasonal cycle and reading cycle. This is not represented as verified Edmonton daily coverage. Future-year fixed Menaion data do not imply future-year verification.
- November 12 (Josaphat), November 15 (Tone 8; Ephesians 4:1–6 / Luke 10:25–37), December 8 (Patapius), and December 9 (Conception of Saint Anna) are regression anchors. Multiple readings on November 8 are retained.
- Source facts, rubrics and Scripture citations are bundled; complete copyrighted prayer translations are not republished. Scripture prose already supported by Ora uses the public-domain ASV.

Edmonton describes Canadian practice. Its holy-day obligations are labelled as Canadian rather than imposed on a U.S. user. Parish/eparchial directions remain necessary for binding obligations and exemptions. Common Byzantine service rules are labelled calculated for Ukrainian/Melkite. This is not a verified Edmonton parish service timetable. The standard cycle calculates 17 Presanctified appointments in 2026; local celebrations can differ. Edmonton’s April 1 page distinguishes no Eucharistic Divine Liturgy from its Presanctified text, consistent with the eparchy’s published Holy Wednesday schedule. The Ukrainian catechism hosted by Edmonton confirms the ten annual Basil services and customary Wednesday/Friday Presanctified practice (<https://eeparchy.com/wp-content/uploads/2020/09/ugcc-catechism-english-20200924-2nd-ed-final-for-print.pdf>, paragraphs 393–394).

## Text inside Ora

The official-source reader now works within More's Sacred Liturgy section as well as the deep link. Edmonton dated pages are the primary Ukrainian source. HTML remains publisher hosted in a frame. PDF text extraction requires the publisher's CORS permission; if extraction fails the original document is offered. Publisher frame restrictions can require **Open original**.

Private PDFs and unencrypted text EPUBs can be chosen from the device. They remain in IndexedDB, support bookmarks and offline reopening, and are not uploaded. EPUBs display plain paragraphs and headings with section search and selection. Original markup, scripts, remote images, styling, audio and video are not executed or fetched. Archives have entry, expansion and count limits and CRC validation. Unsupported encryption, XML entities and damaged files are rejected before replacing a saved book. Existing PDF records remain compatible.

The Roman Order of Mass link contains fixed prayers, not a complete daily Missal. The provider's U.S. Roman eMissal EPUB is linked as a candidate personal source; its actual downloadable edition has not been imported or verified. Automatic date-to-Missal prayer selection remains unfinished. A synthetic compressed EPUB verifies the reader; that does not certify a specific commercial book. A date selects the service-book slot, then opens the user's bookmark.

## Verification

Local regression suite: 33 passing tests, covering source anchors, fallbacks, annual calendar validity, church separation, existing Office readings, service selection and cache upgrades. JavaScript syntax and Python importer compilation pass. The full GitHub Chromium audit checks mobile/desktop layouts, accessibility, current navigation, cross-tab dates, PDF/EPUB behavior, private storage, invalid replacements and offline reopening. Its final result is recorded in GitHub Actions for the release commit.

The release fixes a malformed old-cache cleanup expression and synchronizes the app and service-worker version as **ora-v208**. Real-device Safari, assistive-technology testing and live publisher frame/CORS availability remain separate checks.
