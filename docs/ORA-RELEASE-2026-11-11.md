# Ora release review — 11 November 2026

## Changes in this release

- Simplified Justice to a compact “Faith in action” heading and short subtitle. The old banner used the global flex-header layout, which forced its text into crowded columns. The new section has its own styles.
- Imported the factual date cells for all 365 days of the supplied Diocese of Newton 2026 calendar. Every date has its source page, observance, saints, Scripture references and printed tone when present. Calendar images and monthly reflections are not republished.
- Added a reproducible coordinate-based importer with a source SHA-256. It checks each date against its weekday column, preserves wrapped citations and composite Gospels, and separates tones from Scripture references. All twelve monthly grids were visually reviewed; tests retain image-checked anchors from every month. This is transcription validation, not independent liturgical certification of the printed calendar.
- Added Melkite to the Byzantine calendar settings and a one-time migration to it for this Ora installation. Ukrainian and Ruthenian alternatives remain selectable. The independent Liturgy tradition now controls its own readings and title rather than inheriting another tradition's selection.
- Kept 2026 data strictly year-bound. Other years explicitly show the Ukrainian fallback, without claiming Melkite verification.
- Retained both the full and shorter Apostles’ and Nativity fast dates from the calendar. Dagger symbols are not interpreted as fasting obligations. The limited Newton Lenten requirements use the diocese's published guidance; personal exemptions and annual parish directions still apply.
- Repaired Roman Night Prayer, which previously called a renderer supporting only Lauds and Vespers. It now offers a clearly identified devotional adaptation with bundled Douay Psalm 90 (91), the Canticle of Simeon and concluding prayers. Night deep links also work. Byzantine Night Prayer remains available.
- Added direct access to the diocese-hosted Divine Liturgy PDF and monthly hymns/propers. No unlicensed full translation was copied into the public app.
- Bumped the app cache and bundled both Melkite scripts for offline calendar/reference use. Existing downloaded texts and the original 63 completed Fathers readings remain protected by regression tests.
- Added GitHub verification of calendar/offline tests and a mobile/desktop browser audit including Liturgy, Night Prayer, the simplified Justice heading and enlarged reading text.

## Source review

The source PDF is `2026-Diocese-of-Newton-Calendar.pdf`, SHA-256 `81720c80c889c72e70d4ef0160e1a7756d9011f7e0a7d9d9e03cef22776a30af`.
The source-ordered citation comparison against the old Ukrainian table is retained in [melkite-reading-differences-2026.json](melkite-reading-differences-2026.json). It reports differences, including wording/abbreviation and extra readings, rather than treating every difference as an error.

Official source links:

- [Newton calendar and monthly propers](https://melkite.org/liturgical-resources).
- [Newton Lenten fasting guidance](https://melkite.org/faith/faith-worship/holy-week-traditions).
- [Diocese-hosted 2009 Liturgy and decree](https://melkite.org/faith/faith-worship/new-english-translation-of-the-divine-liturgy).
- [USCCB reproduction requirements](https://www.usccb.org/committees/divine-worship/policies/copyright-permissions-requirements).

The supplied `LITURGY2009.pdf` identifies itself as a final draft with experimental approval through October 2010. The diocese still links it, but no general grant to republish the full translation in a separate public app was found in the PDF or source page. It is linked from Ora, with its edition disclosed. Modern Roman Missal propers likewise remain link-only pending applicable permission; the USCCB daily-readings RSS exception is not a general Missal license.

## Remaining blockers and limits

- Complete in-app modern Roman Missal and Melkite Divine Liturgy translations: reproduction permission and confirmation of the currently prescribed Melkite edition are outstanding. No email or other message has been sent on the user's behalf.
- Melkite 2027 and later dates: need the corresponding annual official source. The app discloses the fallback.
- Complete Melkite service propers and precedence: this dated calendar is not a full typikon. Existing computed seasonal/color cues remain; ranks are labeled “Diocesan calendar.” The printed Holy Week references are preserved, including unusual entries, and are not represented as every reading of every service. Full combinations need the annual typikon/parish book.
- Full Ukrainian heritage biographies: the small existing verified collection remains separate from the Melkite daily calendar. Dates without sourced biographies are left empty.
- Roman Morning/Evening Prayer remain devotional adaptations rather than the complete official modern Office. The older psalter-week transfer-setting discrepancy and Sarum manuscript/Matins/first-Vespers gaps listed in the prior audit are still open source/rubrical work; this release does not claim they are solved.
- Safari/iPhone installed-PWA updates, VoiceOver, live external Scripture/art/audio and complete first-use offline downloads need device/service testing. Chromium cannot launch in this workspace because OS socket creation is prohibited; GitHub Actions is used for browser validation.

## Verification status

All 25 Node calendar, reading-preservation and offline tests pass locally. Browser verification and publication status are recorded with the release commit/Actions run. A passed automated browser audit does not establish complete liturgical or assistive-technology correctness.

## Additional official resources supplied during this release

Added the [official daily Gospel](https://melkite.org/daily-readings) and direct links to the twelve 2026 monthly Word documents listed by the diocese. The correct month follows the selected date; the live Gospel link is explicitly labeled “today” so it cannot be mistaken for historical readings. The retrieved daily page contains the unresolved `[sc_daily_readings]` shortcode rather than dated reading content. Automatic text ingestion is therefore blocked by the source response; Ora keeps the verified dated references and official link instead of inventing a feed or a date parameter.

The final browser review also identified and corrected low contrast in selected navigation icons on Traditional feast days.

## Follow-up: one Melkite calendar and one reading heading

The user's subsequent instruction supersedes the earlier profile/fallback policy above. All Byzantine app views now use the Melkite calendar, including installations that had saved Ukrainian or Ruthenian selections. Removed the competing calendar selectors and automatic substitution of another church's readings for unsupported years. The other calendar engines remain internally available for regression checks, and Ukrainian heritage remains separate.

Removed the redundant set title from single-set readings and the extra day title inside Divine Liturgy. Combined celebrations can retain distinct set titles when necessary. Scripture sections use Gospel/Epistle labels where identifiable. The browser regression specifically checks November 11 with old saved settings: only one source heading, no conflicting Pentecost weekday titles, and the Melkite Luke 12:48–59 reference. Cache version: ora-v144.
