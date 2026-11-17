# UGCC national new-style calendar 2026 — staged independent engine

Reviewed November 16, 2026. This is code and regression coverage, **not a user-selectable profile yet**.

## Primary sources and critical distinction

The UGCC Patriarchal Liturgical Commission's official **new-style 2026** calendar is at https://ugcc.ua/data/tserkovnyy-kalendar-ugkts-na-2026-rik-8059/. It combines new-style (Gregorian civil) fixed-feast dates with the old Julian reckoning of Pascha: **April 12**. Its February 23 Great Fast start, April 5 Palm Sunday, April 9 Great Thursday, April 11 Great Saturday and April 12 Pascha are explicit in the source.

St. George Parish in Edmonton separately states on the eparchy website that its services use the **Julian calendar**: https://eeparchy.com/parishes/st-george-parish. Its April 12 Pascha therefore does not mean it shares the UGCC national new-style fixed-feast dates. In 2026, for example, its old-style Christmas is January 7, while the national new-style Christmas is December 25.

Neither alternative can safely reuse Edmonton's April 5-cycle date-specific readings, saint calendar, hymns or service orders.

## New isolated engine

`ukrainian-calendar-profiles.js` exposes:
- `ugcc-national-new-style-2026` (staged): uses `LitCal.byzantine` with `byzPascha:julian`, `byzOldCal:false`, and `byzSource:computed`; independently calculates the movable Orthodox-Paschal reading cycle through `ByzLect.read` with `julianEaster`.
- `st-george-julian-2026` (reference-only): metadata explicitly records Julian fixed feasts and Pascha, but refuses to calculate a complete parish calendar without its own dated sources.

On the national profile, Holy Week Divine Liturgy appointments are only source-verified where the national 2026 text explicitly names them. The national April 10 Royal Hours do not justify inventing a Eucharistic Liturgy. Pascha's Epistle/Gospel citations do not by themselves verify which local ordinary service book is used. All other appointments are `unassigned`, rather than substituted from Edmonton.

Selected exact Epistle/Gospel citations for April 5, 11 and 12, and the April 9 Epistle, are stored in a separate verified-source field. `calculatedReadings` is always clearly provisional and never represented as a verified national daily appointment. No date-specific variable hymns are added.

## Remaining integration gates

1. Confirm every major feast and fixed-feast observance in the national profile, especially date clashes, transfers, and fasting rubrics (calculated source data alone is not an official ordo).
2. Expand exact daily national Epistle/Gospel and Holy Week appointments from the official calendar; avoid mixing them with Edmonton.
3. Route the Byzantine Office, prayer-opening date, calendar cards, liturgy selector, and source-verified dated propers through the same profile ID.
4. Keep existing Edmonton April 5 as the default, with an explicit opt-in and reversible settings only after passing paired profile regression and offline browser tests.
5. A separate *full-Julian* St. George mode requires additional parish documentation; it is not equivalent to the national new-style profile.

The UI now distinguishes St. George's Julian-calendar practice from the national UGCC new-style calendar in More. No saved liturgical book, hymn text, or daily prayer content is changed.
