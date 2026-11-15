# Ora v333 — Daily sources for the variable Divine Liturgy parts

The ordinary service for each church stays in its separately stored local year-round English book. The Liturgy view now has a concise, initially collapsed **Today's changing parts** section that follows the selected date and Ukrainian/Melkite church.

For verified 2026 calendar entries, the section shows liturgical Epistle and Gospel references, and links directly to the responsible church's source. The source links are the Ukrainian Catholic Eparchy of Edmonton's dated calendar pages and the Melkite Catholic Eparchy of Newton's official calendar/typikons. Melkite **Orthros Gospels** are deliberately excluded: they are not the Divine Liturgy Gospel.

The section describes variable hymns (antiphons, troparia, kontakia, prokeimena and Communion hymns) without copying or inventing texts. The actual appointed hymns are to be consulted in the linked dated typikons and propers; additional verified hymn text imports are a separate release-scoped task. Different churches' translations are never mixed. Unverified years and source-conflict dates remain identified.

Browser tests cover November 15 Ukrainian Ephesians 4:1–6 vs Melkite Ephesians 4:1–7, the same Gospel, exclusion of the Melkite Orthros Gospel, November 22's changed Melkite references, the links to each authority and narrow iPhone layout.

## v334 — reading-first presentation
The main Divine Liturgy view no longer displays PDF extraction disclaimers or seasonal source notices above the prayers. The reader begins with the actual text; the optional liturgical-instructions button follows the prayer. The short, collapsed daily readings-and-propers panel follows the text as supporting material, rather than interrupting its opening. The 2018 Easter-booklet identification remains inside **Manage saved Divine Liturgy book** to make replacement possible without compromising the prayer experience. Verified 2026 reading citations are still available, and source-conflict warnings remain when necessary. This is a presentation change, not a textual or calendar change.

## v335 — feast-safe ordinary antiphons
Ordinary Sunday/weekday antiphon alternatives in a privately saved service book continue to default to the calendar weekday on ordinary days. If the selected Byzantine rank is Great Feast, Feast, Holy Week, Holy Day or Vigil, both alternatives remain collapsed rather than pretending one is the appointed festal text. The dated propers source remains available after the prayers. The reader now receives the selected Byzantine day title (previously it received the Roman title). The browser test covers ordinary weekday selection and these feast safeguards.

## v336 — feast ranks beyond the first word
The closed-by-default rule also covers qualified feast ranks, including **Polyeleos Feast** and **All-Night Vigil Feast**, rather than relying on a rank beginning with “Feast.” Ordinary Sundays and weekdays continue to open their corresponding alternatives; tests cover these cases independently.

## v338 — real dated Ukrainian hymn text
The Edmonton daily-propers importer now builds a separate Ukrainian-only JSON dataset. The original 72-day intake covers October 18 through December 28, 2026. The selected calendar date can show its actual troparia and kontakia, prokeimenon, Alleluia verses and Communion hymn inside the existing **Readings & propers** expander, after the continuous private service book. This avoids interrupting the prayer opening or incorrectly interleaving text into an unrecognized PDF. Text nodes (never injected HTML) preserve the original words while removing chant-break asterisks for quiet reading. Date/source/church validation prevents an unrelated or Melkite entry from appearing in the Ukrainian view.

These are the day's verified *additional hymn texts*, not a claim that every variable prayer has been placed in its exact order within the saved liturgy. The external source remains one optional link at the end of the section. The Melkite side continues using its own source links until a separately validated Melkite proper-text importer exists. Browser assertions check actual hymn rendering and strict church separation; imported JSON has its own structural audit.
