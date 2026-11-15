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

## Rendering gate

The imported file ukrainian-propers.json is data only and is not yet injected
into the Divine Liturgy reader. Rendering will follow a source audit:
confirm each record contains only the appointed prayer parts, exclude Gospel
and Epistle prose, identify where insertion belongs in a user's saved year-round
service text, and avoid duplicate prayers or ordinary-weekday antiphons on
feast days. Keep source and editorial notes out of the spoken prayer flow.

The existing v336 reader remains unchanged while import data is validated.
