# Prayer and reader review — November 13, 2026

## Changes

Roman Lauds, Office of Readings, Vespers and Compline now begin with the same
Sign of the Cross text and `.step` / `.t` / `.tx` presentation as Byzantine and
Traditional prayer. The player, tradition/hour tabs, prayer headings, section
order and cream/burgundy appearance remain in place. Prayer body sizes use the
shared reading scale; the Office of Readings no longer forces a separate larger
paragraph size.

The Ukrainian and Melkite private-book readers preserve printed speaker labels,
including quiet priest prayers and joint clergy labels. When an instruction
explicitly names the next speaker, its following prayer receives that label.
Instructions remain hidden by default, with a visible toggle. Sunday and weekday
ordinary antiphons printed in parallel columns are grouped separately, with the
matching ordinary alternative expanded according to the selected civil date.
This is a display convenience, not an appointment of festal antiphons: consult
the daily propers. Generic book layouts still require an identifiable opening;
uncertain books retain the original-page reader.

PDF book text stays on the user's device. Repository fixtures are invented.
The actual Melkite 2009 draft's column coordinates were inspected privately;
that draft's contents are not bundled or promoted as a current approved edition.
Edmonton's recognized alternating-language booklet retains its existing English
page boundaries. A user's device-local copy cannot be inspected remotely.

## Byzantine hours: conclusion of the content check

The previous three prayer tabs did **not** reproduce complete official Orthros,
Vespers or Compline in either church. They omitted much of the psalmody, canon,
appointed hymns and daily/seasonal propers. They are now visibly described as
prayer companions, with the full order available in an expandable guide and
links appropriate to the selected Ukrainian or Melkite church.

Corrections include a reader's opening for private prayer, the Six Psalms of
Orthros, Psalm 103 for Vespers, and Psalms 50/69/142 for Small Compline. Psalms
are optional expandable public-domain Douay–Rheims texts in Septuagint numbering.
The Song of Simeon belongs in Vespers and was removed from the Compline companion.
The Prayer of Manasseh is described under Great Compline, not every Compline.
The full cycle includes Midnight Office and First/Third/Sixth/Ninth Hours; the
traditional times are guidance rather than a parish timetable. Vespers opens
the next liturgical day.

Heavenly King is omitted from Pascha until Pentecost. The Paschal troparion
replaces it until Ascension; from Ascension it is omitted without that
replacement. Bright Week visibly directs the reader to the Paschal order and omits the ordinary psalm selections.
The ordinary companion is not represented as the full Paschal or Lenten office.
Evening transitions are still date-based, not a sunset/time-zone service engine;
use the selected church's typikon for Pentecost vigil and other festal transitions.

Sources consulted:

- [Edmonton November 13 services](https://eeparchy.com/calendar/2026-11-13): all four Little Hours, printed priest/reader alternatives and daily troparia. Its weekday Psalm indications are retained at source; Ora does not assign every listed alternative as mandatory.
- [UGCC catechism](https://eeparchy.com/wp-content/uploads/2020/09/ugcc-catechism-english-20200924-2nd-ed-final-for-print.pdf), §§540–544: daily cycle and Matins structure.
- [Edmonton Acts prayer booklet](https://eeparchy.com/wp-content/uploads/2021/05/Acts-of-the-Apostles-eng-pdf-format.pdf): Pascha-to-Ascension opening.
- [Melkite parish daily cycle](https://virginmarynyc.org/prayer-life/): Vespers, Compline, Midnight, Orthros and Little Hours, with traditional times.
- [Newton Horologion description](https://store.melkite.org/product/horologion/): complete Divine Office, daily propers and Paschal Hour. The link is book information, not a downloadable full service.
- [Newton on Lenten services and Great Compline](https://melkite.org/faith/sunday-scriptures/consecrate-a-fast): distinct Lenten order, Christmas/Theophany eves and Prayer of Manasseh.
- [Melkite Pentecost catechesis](https://www.melkite.org.au/pentecost): Heavenly King at Pentecost.
- [Metropolitan Cantor Institute Compline comparison](https://metropolitancantorinstitute.org/liturgy/Compline.html): structural cross-check, including Small Compline's three psalms. This supplementary Ruthenian reference does not replace the selected Ukrainian/Melkite calendar or translation.

Edmonton's older 2012 clergy Horologion was available during initial research
but its former URL subsequently returned 404. The live app therefore links the
current calendar rather than that unavailable file. No whole modern Horologion
translation has been copied into the repository.

## Roman short readings

191 distinct appointed references now have checked public-domain Scripture.
The reproducible 462-office audit (November 12, 2026–June 30, 2027, US Sunday
transfers) finds an appointed short reading available in **445 offices**.
Whole-verse expansions are labelled rather than presented as exact half-verse
boundaries. Scripture wording remains Douay–Rheims–Challoner, not NAB or Grail.

The importer rejects missing verses and conflicting captures. Tobit, Zechariah,
Malachi, Micah and Hosea received explicit numbering alignment. The source's
`Hosea 5:15b-16:2` is a malformed reference to NAB 5:15b–6:2; its DR equivalent
is 6:1–3a, ending at “live in his sight.” Micah stops at the peace clause rather
than including the rest of the following verse. Judith 8:25–27 remains unresolved
because the Greek and Vulgate passage divisions differ. It is not substituted
by matching verse numbers alone. Individual records retain chapter source URLs.

## Remaining content limits

The audit still lists fourteen offices without a resolved proper prayer witness
and fifteen missing source IDs. Historical alternatives remain identified.
Hymns are labelled traditional: the 2023 Divine Office Hymnal has not been
substituted or licensed. The existing reviewed canticle boundaries and 64
public-domain Office of Readings second readings are preserved; these do not
amount to a complete official First Edition or a full annual patristic cycle.
Full Ukrainian and Melkite daily variable offices remain linked to church
sources. This release corrects the presentation and documented content issues;
it does not certify every service text as complete or ecclesiastically approved.

## Verification

106 local unit checks cover calendars, source selection, Scripture boundaries,
private-book paragraphs/columns/speakers, art rotation, Marian blue and offline
cache upgrades. Browser checks cover Roman opening text/order, both Byzantine
churches and all three companion tabs, Paschal boundaries, private-book columns,
hidden instructions, prayer font consistency, phone widths, light/dark themes,
accessibility, offline use and published-build freshness. The browser fixtures
contain no text extracted from a private user book. Safari and a user's local
saved books require device testing.
