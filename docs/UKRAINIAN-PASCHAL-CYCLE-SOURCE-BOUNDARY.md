# Paschal-calendar source boundary and second-calendar release gate

Reviewed November 16, 2026.

## Verified 2026 scope

- Ukrainian/Edmonton: April 5, 2026 Pascha as used by St. Josaphat Cathedral. The 2026 eparchial Easter program also documents April 12 observance at St. George parish: https://eeparchy.com/Easter%20Program%20.pdf.
- The national UGCC Patriarchal Liturgical Commission's 2026 calendar places Pascha on April 12: https://ugcc.ua/data/tserkovnyy-kalendar-ugkts-na-2026-rik-8059/.
- Melkite/Newton: April 5, 2026 Pascha and its distinct diocesan service sources: https://melkite.org/liturgical-resources.

The presence of an official national April 12 calendar is **not** evidence that every Edmonton parish followed it. Both local practice and sources must be preserved.

## Ora release policy

The selectable Ukrainian and Melkite modes retain their Gregorian-reckoned 2026 Pascha. A new `paschalBasis(year,church)` provenance helper records the supported source boundary and the documented but unsupported alternative. The source explanation appears under **More → Byzantine Calendar → Paschal calendar coverage**, not in the text of the prayers.

For unsupported years, the app shows a calculated-calendar disclosure rather than applying a 2026 verified source to future years.

A separate Paschal choice is **not** enabled in this release. Simply toggling the low-level `byzPascha` field to Julian would be misleading: the existing Edmonton date-specific calendar overlay, read-date lookup, 2026 liturgy appointments, variable hymns and Office of Hours would no longer consistently follow that alternative. The app currently pins Gregorian Pascha and the Western-date Byzantine fallback readings together; regression tests protect this binding.

## Before implementing a separate April 12 cycle

1. Create a named 2026 Ukrainian calendar profile with its own cycle ID, source provenance and fixed-feast assumptions.
2. Make the calendar, Holy Week service selector, Byzantine office, Epistle/Gospel readings and date-specific propers all consume that profile; never let April 5 Edmonton source records leak into April 12.
3. Preserve the current April 5 profile as the default and make the April 12 option explicit and reversible in Settings.
4. Verify major dates (Great Lent, Holy Week, Pascha, Thomas Sunday, Pentecost, Apostles Fast) and negative cases on both profiles with browser and offline tests.
5. Label computed appointments as such until the matching date-specific local or national source is actually checked.

Do not synthesize missing hymns, reinterpret Edmonton-only confirmations as national appointments, or modify device-local liturgical books.
