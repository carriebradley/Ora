# Ukrainian cathedral parish booklet: antiphon source map

Reviewed 19 November 2026. This is a source and code review, not an
end-to-end test of Ora's reader.

## Scope

The [St. Josaphat Cathedral bilingual Divine Liturgy booklet](https://stjosaphat.ab.ca/wp-content/uploads/2020/05/PDF-Divine-Liturgy-Ukr-Eng.pdf)
has 31 PDF pages. It is distinct from both the 140-page Edmonton 2012
episcopal liturgy and the 33-page English Calgary parish booklet linked by
Ora. The Calgary PDF could not be retrieved in this session. Do not transfer
the page boundaries or edition identification below to either other book.
Page numbers here are one-based physical PDF pages, not the booklet's
printed English or Ukrainian page numbers.

## Source boundaries

| Passage | Physical PDF pages | Structure requiring preservation |
| --- | --- | --- |
| First Antiphon | 4–5 | The source calls for one of Sunday, weekday, Typica, or a festal proper. Sunday begins on p. 4; weekday and Typica begin on p. 5. The small litany follows the choices and continues onto p. 6. |
| Second Antiphon | 6–7 | The source again calls for one of Sunday, weekday, Typica, or a festal proper. The Sunday choice begins on p. 6; weekday and Typica on p. 7. The doxology and Only-Begotten Son follow the choices on p. 7 and are shared, not part of the last option. |
| Third Antiphon | 8–10 | The source calls for Sunday, weekday or Typica, with propers for feasts. The Sunday choice begins on p. 8 and continues on p. 9; weekday and the Beatitudes begin on p. 9. The Beatitudes continue onto p. 10. The Small Entrance follows on p. 10. The English rubric calls the third option Typica, while its heading is “The Beatitudes”. |
| Small Entrance response | 10 | Sunday and weekday forms are printed as alternatives inside the people's response. Treat this separately from the three antiphon groups. |

The source's printed continuation cues are not permission to discard the
remainder of an alternative or to place a shared prayer inside a collapsed
choice. They also do not determine the appointed form for every date.

## Current code and evidence limit

On main at `6570594816b6e8eb40dd5a1fc9c13b3f27444b77`,
`edmontonPrayerText` only applies the existing antiphon tagging to the
positively identified 140-page episcopal source. `standardPrayerText`
uses the generic PDF path and does not explicitly identify the three
cross-page choice groups above. `renderEdmontonPrayerText` constructs
choice disclosures from sections already marked as alternatives. This
static review establishes a likely presentation risk; it does not establish
the actual output of PDF.js extraction or the state of any private saved book.

The accessible web text extraction is not the PDF.js output used by Ora;
its extraction order and line breaks cannot be used as a fixture asserting
exact application behavior. No PDF was imported, no saved book inspected or
modified, and no prayer words were added or changed.

## Before an implementation

1. Obtain the actual relevant local PDF through an authorized source and run
   it through the same PDF.js extraction and reader pipeline used by Ora.
   Compare the rendered output against each source page and record the edition
   identity independently; inspect the linked Calgary edition separately.
2. If confirmed, identify every option with complete, edition-specific,
   unambiguous boundaries across pages. Preserve the common litany,
   doxology, Only-Begotten Son and Small Entrance outside the choices.
   Do not infer a feast-day appointment or invent a festal proper.
3. Include synthetic tests for continuation across pages, shared endings,
   duplicate/missing markers, truncated or edited books, already tagged
   content and unknown editions. Check actual browser rendering, offline
   behavior and unchanged saved originals. If identification is uncertain,
   leave the text unmodified and provide access to the original PDF.
