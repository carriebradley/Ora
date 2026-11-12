# Private Roman Missal text in the Mass view

A privately saved Roman Missal EPUB now displays prayer text directly in More → Sacred Liturgy → Mass, outside the collapsed file-management controls. The user selects their EPUB once per device. Book text, metadata and extracted prayers stay on the device; none are published with the app.

The reader preserves paragraphs, headings and internal book navigation as safe text and buttons. Scripture readings remain in the existing readings section. A unique normalized heading selects the day's prayers; matching handles ordinal spellings and named seasonal celebrations. Unmatched or ambiguous days explicitly require manual choice. This is section navigation, rather than a fully assembled Mass with every optional preface, Eucharistic Prayer, Common or vigil choice decided automatically. The book's own directions remain visible, and links to Commons and other sections remain usable.

Inline controls provide section search, a day's-prayers shortcut and an Introductory Rites shortcut. Book metadata and any detected special-edition notice are shown locally. Existing PDF viewing, optional full-screen EPUB reading, bookmarks, private storage, offline reopening and Byzantine source links remain available. Parsed EPUBs are cached in memory during reading to avoid unpacking the entire book on each section change.

The browser fixture contains fictional text and generic calendar headings. It contains no privately supplied book, excerpts, identifying metadata, or inspection results. Local regression suite: 34 passing tests. GitHub Actions records browser checks for inline text without a modal, date matching, internal links, search, unmatched dates, accessibility and offline reopening. App/service-worker release: ora-v212.
