# Melkite Diocese of Newton calendar migration — 2026

Primary source: *2026 Diocesan Calendar*, Melkite Catholic Diocese of Newton (user-supplied PDF, 16 pages). The calendar explicitly covers the United States.

## Migration policy

- Make Melkite practice the default Byzantine calendar **only after** the daily 2026 entries are transcribed and checked against the page images.
- Preserve the existing Ukrainian/Ruthenian calendar and lectionary as a reversible fallback. Do not relabel Ukrainian readings as Melkite.
- Each verified date should include observance, rank/season, Epistle and Gospel references (and additional readings when shown), tone where provided, and fasting notes only where supported.
- Keep Ukrainian saints and short biographies in More → Calendar as a separate heritage feature.
- Do not infer mandatory U.S. fasting obligations solely from the calendar's seasonal labels or dagger symbols; verify the legend and diocesan guidance.
- Do not assume the 2026 dated calendar applies unchanged in later years. Fixed feasts may recur; movable feasts and readings require year-specific calculation and validation.
- Retain existing Roman and Traditional/Sarum data unchanged.

## Initial source checks (2026)

| Source page | Check |
|---|---|
| 4 (February) | Great Fast begins February 16; Cheese-fare Sunday February 15. |
| 6 (April) | Pascha April 5; Great and Holy Week and Bright Week are listed. |
| 7 (May) | Ascension May 14; Pentecost May 24; All Saints May 31. |
| 8 (June) | Apostles' Fast begins June 1; a shorter Apostles' Fast is also marked later in June (check exact diocesan usage). |
| 10 (August) | Theotokos' Fast begins August 1; Dormition August 15. |
| 13 (November) | Nativity Fast begins November 15. |

## Verification gates before changing the default

1. Transcribe and validate all 365 civil dates and day-of-week positions from the page images.
2. Compare the extracted lectionary against existing Ora readings, recording differences instead of overwriting blindly.
3. Verify movable feasts, Sundays after the Cross, and special Holy Week services.
4. Review fasting notes with the source legend and diocesan discipline.
5. Add date-specific source attribution and tests for a sample of each month.
6. Only then switch the default to Melkite and verify Today, Readings, Liturgy, and Calendar on mobile.

Status: migration audit and source mapping started; production calendar remains unchanged until validation.


## Implementation follow-up

The 365-date import and integration are now implemented; see [release report](ORA-RELEASE-2026-11-11.md) for the current result and explicit limits. The source has date/page attribution and a reproducible coordinate importer. All twelve monthly grids were reviewed, monthly anchors are tested, and wrapped/composite citations are retained. Color/season cues retain the existing engine; the displayed rank does not invent a source rank. This is not a full annual typikon. No annual data is reused for another year.
