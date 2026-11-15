# Ukrainian daily proper prayers — source ingestion

The Ukrainian Catholic Eparchy of Edmonton publishes the actual English text
of the appointed hymns on dated calendar pages, not just Epistle and Gospel
references. November 15, 2026 has troparia/kontakia, prokeimenon, Alleluia
verses and a Communion hymn at https://eeparchy.com/calendar/2026-11-15.

## Source and separation

The importer at tools/import_edmonton_propers.py reads only the first
liturgical-day-service-body from the Edmonton dated page. It retains four
groups: troparia/kontakia, prokeimenon, Alleluia, and Communion hymn. It skips
Epistle and Gospel bodies, Hours, Vespers, and all other page text. It fetches
only dates already verified in the edmonton-2026.js data. The original
date-specific page is recorded for each imported group.

The import is intentionally separate from the Melkite calendar, monthly Newton
typikon, and privately saved Melkite service book. No cross-church fallback is
permitted. Source translation, calendar scope and text provenance remain distinct.

The weekly scheduled workflow checks a rolling window of 28 days in the past
and 45 days ahead. Earlier successfully imported dates persist. Fetch or parse
failures preserve the previously verified record rather than inventing text;
all-source failures stop the workflow. Historical coverage grows from the
initial import and subsequent weeks, not from guessed calendar cycles.

## Reader integration and outstanding limits

As of v339, Ora loads ukrainian-propers.json from its static site and renders
verified dated hymn groups in the **Readings & propers** panel of the Ukrainian
Divine Liturgy. The panel is collapsed by default and follows the continuous
prayer book, preserving the opening prayer flow. Text is created with safe DOM
text nodes; chant-break asterisks are omitted for quiet reading. The exact
calendar date and the Ukrainian church designation are checked before any
hymn group is shown. Aliturgical dates and conflicting service appointments
do not receive an automatically selected hymn group.

This supplementary dated section does not assert that the hymns have been
inserted at each precise liturgical location within an unknown privately saved
PDF. Direct in-sequence substitution needs edition-specific verification.
The Melkite service retains its distinct official monthly source and is not
populated from Edmonton hymns.

The initial 2026 source intake verified 72 dates, October 18 through
December 28, 2026. The weekly updater retains successful records, checks a
rolling 28-day back / 45-day forward window and does not manufacture texts
for unsupported calendar years. Private saved PDF/EPUB files are not uploaded.
