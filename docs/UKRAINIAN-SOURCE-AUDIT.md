# Ukrainian Divine Liturgy — source audit

## Episcopal Typica and Beatitudes alternatives (Edmonton 2012)

On November 19, 2026, the original 140-page episcopal PDF was processed
with Ora's PDF.js extraction and compared with its English PDF pp. 39,
41, 45 and 47. The Sunday and weekday selections refer forward to a
shared hymn or entrance; Typica on p. 41 and the Beatitudes on p. 47 are
additional antiphon choices. Previously, those two alternatives remained
in the continuous prayer stream even when another form was open.

For this positively identified edition only, Ora groups each complete
source-matched alternative into a closed disclosure. The shared Hymn to
Christ and the subsequent entrance directions remain outside the choices;
no alternative is appointed automatically. Incomplete or ambiguous
source boundaries leave the original extraction unchanged. This correction
does not modify the saved PDF and does not establish the behavior of the
separate Calgary or cathedral parish booklets.

## Ordinary parish booklet: antiphon alternatives require review

Reviewed November 19, 2026. Ora links to the 33-page English
[Assumption parish booklet](https://abvmcalgary.com/site/wp-content/uploads/2025/04/PDF-Divine-Liturgy-Eng.pdf).
Its First and Second Antiphons present Sunday, weekday and Typica forms as
alternatives; the First Antiphon choices span more than one PDF page. An
[Edmonton cathedral bilingual edition](https://stjosaphat.ab.ca/wp-content/uploads/2020/05/PDF-Divine-Liturgy-Ukr-Eng.pdf)
also describes the forms as alternatives. These are parish-booklet sources,
not the 140-page episcopal edition described below.

The current edition-specific separation code recognizes the episcopal source,
while generic PDF handling does not explicitly identify these vertical,
cross-page parish alternatives. This is a likely presentation defect: the
reader could show alternatives consecutively. A live source-render comparison
has not yet been completed, so its exact effect on a device is unconfirmed.
Do not automatically choose a form or alter prayer words on this evidence
alone. Next, inspect the actual PDF with the reader's extraction pipeline,
verify the boundaries of all printed alternatives and common prayers, and
test unknown, incomplete and previously saved books before changing behavior.

## Verified edition

Eparchy of Edmonton, *Episcopal Divine Liturgy* (2012), 140-page
bilingual PDF. Core English service pages are odd-numbered PDF pp. 33–113.
This is an episcopal ceremony rather than the generic year-round parish
booklet. Original private sources remain on the user's device.

## First fixed-text corrections

- **Insistent Litany** (PDF pp. 63 and 65): the first two printed
  responses are singular; four subsequent responses each specify
  "(3)". The recognized edition displays those four in full.
- **Dismissal** (PDF p. 111): a longer people's doxology contains one
  further "(3)" response followed by a wrapped "Mas-ter". Ora expands
  the three spoken responses and restores the one known joined word.
- **Special petitions may be added here** is a source direction, not
  a spoken petition. It is not displayed within the prayer.
- **Insistent Litany** and **Polychronion** are treated as headings.

An explicit complete five-response/heading match and 140-page edition
imprint prevent these changes from applying to unknown or partially edited
Ukrainian PDFs. The original PDF is not rewritten; tests use synthetic
prayers, not redistributed copyrighted full service texts.

## Remaining version-one checks

Audit the remaining fixed English text and compare the episcopal
ceremony with the ordinary Ukrainian parish booklet. Check all dated
substitutions, reading prompts, and the device-local iPhone display.


## Three further source-marked repetitions (Edmonton PDF pp. 79, 99, 109)

A page-by-page review of the original English episcopal liturgy identifies
three additional, distinct "(3)" instructions outside the Insistent Litany
and dismissal:

- **Confession of Love (p. 79):** repeat the bishop's brief "I will love
  You" prayer three times, not the preceding people's Trinitarian response.
- **One is Holy (p. 99):** repeat only the short "God, be merciful to me,
  a sinner" prayer three times, not the bishop's longer prayer.
- **Following the Ambo Prayer (p. 109):** repeat "Blessed be the name of
  the Lord" three times while saying the preceding "Amen" only once.

The exact three source phrases must all be present in the correct order
in the positively identified 140-page Edmonton 2012 book. An incomplete,
duplicated, altered or already expanded passage is left unchanged.
The source PDF and locally stored text are not rewritten. The Cherubic
Hymn's separate "(3)" rubric on p. 71 has different chant semantics and
is not expanded automatically pending its own source review.


## Printing line-wrap artifacts (Edmonton 2012 English pp. 33–113)

An audit of the original PDF using layout-preserving text extraction found
**97** English words divided at printed line ends, comprising **75**
different split patterns. One is the genuine compound "loving-kindness"
and must retain its hyphen. The other **74** distinct word-break patterns
can be unambiguously rejoined, including "sal-vation", "govern-ment",
"Al-leluia", "Mys-teries", and "pro-todeacon". Ora re-joins only these
74 exact source-confirmed fragments in the display of the recognized
Edmonton 2012 book, while keeping ordinary hyphenated expressions such as
"Only-begotten", "life-giving", and "well-being" unchanged. This does not
rewrite the private original, change unknown editions, or alter other
traditions' automatic PDF handling.


## Verified English section headings (Edmonton 2012 English pp. 33-113)

The original episcopal service has 22 printed prayer/service subsection
headings beyond Ora's previous heading vocabulary, including *The
Beatitudes*, *Confession of Faith*, *Surrender to God*, *Communion of the
Faithful*, *Ambo Prayer*, and *Final Blessing*. The source's *The Entrance
of Christ the High Priest* is split across two PDF lines; treating it as
a heading prevents its words being absorbed into the prayer underneath.
These titles are recognized for display-only segmentation and do not
change prayer wording, the dated propers, or device-local source books.

The *Baptismal Hymn* is a seasonal substitution (not automatically
appointed year-round); recognizing its heading is a prerequisite to
separately grouping and selecting that alternate hymn in later work.


## Baptismal alternative (Edmonton 2012, PDF p. 57)

The source explicitly appoints the Baptismal Hymn **instead of**
the Trisagion for Nativity, Theophany, Lazarus Saturday, Holy Saturday,
Easter Week, and Pentecost. In the positively recognized private book,
a complete exact sequence is grouped into a collapsed disclosure labelled
"Baptismal Hymn (only on appointed feasts)". Dates are not guessed and
the original prayer text is never edited. Unknown or altered editions
remain unchanged.

The source identity of the Edmonton PDF is now preserved when the
introductory pages are skipped and when dated propers are composed, so
source-only display rules remain properly gated.


## Twofold initial hymn responses (Edmonton 2012 PDF p. 57)

The opening congregational line of the standard Trisagion and the
corresponding Baptismal Hymn alternative each print "(2)" after one
stanza. The original source gives the concluding doxology separately.
Ora expands exactly those two source-matched initial stanzas into
twice-spoken prayer words, preserving each later doxology and never
changing or automatically appointing the optional Baptismal Hymn.
Unrecognized source structures remain unchanged.


## Unspoken appointed-proper directions (Edmonton 2012 pp. 39, 45, 53, 57, 59)

The service repeatedly prints "See propers" in hymn slots and describes
the selection of the daily Prokimenon and the chant of the Alleluia.
The Baptismal Hymn paragraph similarly lists when it replaces the
Trisagion. These are **rubrics**, not the congregational words to pray.
The continuous reader now removes those narrowly recognized printed
directions from its prayer display while keeping headings, spoken
Alleluia verses/responses, the Baptismal Hymn, and original private
source files unchanged. Appointed daily propers remain governed by
their separate verified calendar records.


## Cherubic Hymn clergy repetition (Edmonton 2012, English PDF p. 71)

The Edmonton episcopal source distinguishes three passages: the people's
opening Cherubic Hymn, the clergy's full repeated hymn, and the people's
continuation after the Great Entrance. The clergy stanza carries a printed
bow cue and an explicit \`(3)\`. The recognized, device-local edition now
expands **only the complete clergy stanza** into three spoken iterations in
the continuous prayer reader. It removes the printed bow cue from that
display and keeps the people's opening/continuation singular. The match
requires the unique Cherubic Hymn and Great Entrance boundaries, the
opening congregational stanza, exact clergy source markers, and the
following preparation-table direction. Unknown, edited, or duplicate
source passages fail closed. The original PDF remains untouched.
