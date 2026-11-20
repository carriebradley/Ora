# Edmonton cathedral parish booklet: antiphon source review

Reviewed November 19, 2026. Source: [St. Josaphat Ukrainian Catholic Cathedral, Divine Liturgy of St. John Chrysostom](https://stjosaphat.ab.ca/wp-content/uploads/2020/05/PDF-Divine-Liturgy-Ukr-Eng.pdf), a 31-page bilingual PDF. Page references below count PDF pages from one, not the individual printed page numbers within the two-language spreads. This source is distinct from the 140-page Edmonton 2012 episcopal edition and the separate Calgary English booklet.

## Verified printed structure

Visual inspection and the PDF's extracted text show:

- The first antiphon begins on PDF p. 4. The Sunday text starts there and continues on p. 5; the weekday and Typica alternatives follow on p. 5. The small litany after the alternatives is shared, and must not be hidden with one choice.
- The second antiphon begins on PDF p. 6. Its Sunday, weekday and Typica forms are alternatives. The common doxology and Hymn to Christ / Only-Begotten Son follow the choices on p. 7 and must remain available regardless of choice.
- The third antiphon begins on PDF p. 8. Sunday, weekday and Beatitudes are alternatives; the Sunday form continues on p. 9, and the Beatitudes continue from p. 9 onto p. 10. The small entrance follows the Beatitudes on p. 10 and is shared.
- The booklet also points to special festal propers. These are not proof that a particular alternative is appointed for any date; do not infer a selection.

The bilingual layout places Ukrainian and English side by side, while extraction order can interleave pages and languages. Printed continuation instructions and the visual column boundary are evidence for careful extraction, not spoken prayer. Verify actual Ora PDF.js rows before treating the page boundaries above as application line boundaries.

## Current app boundary and next check

The current edition-specific antiphon handling explicitly identifies the 140-page episcopal edition. The generic reader has no equivalent source-specific matcher for this cathedral parish booklet. This is a potential presentation defect, not a claim that the actual device output has already been verified.

Before implementation, inspect the real 31-page source through Ora's PDF.js pipeline and compare the on-device reader with the original. Verify unique edition identity and complete alternative and common-section boundaries across page breaks; preserve both the source PDF and shared prayers. Unknown, altered, incomplete or ambiguous books should remain unchanged. Cover all three antiphons, the shared Hymn to Christ and entrance, plus negative cases and offline/mobile behavior. Do not apply a cathedral-specific rule to the Calgary or episcopal edition without separate evidence.

The Calgary PDF returned HTTP 403 to the source-fetching service during this review. No new claim about its exact extraction or third-antiphon layout was established.
