# Roman Calendar Integrity Audit — v306

The modern Roman sanctoral source duplicated the Saint Anthony of Padua Memorial on June 13, resulting in duplicate candidate entries. Keep only the complete Memorial title.

The 1962 sanctoral seed incorrectly contained two modern Optional Memorial records using a class code its 1962 parser cannot recognize:
- April 21: remove the duplicate Anselm entry while retaining the original Class III observance.
- June 9: remove the misplaced Ephrem entry.
- June 18: restore Saint Ephrem the Syrian, Class III, according to the 1962 calendar.

New automated tests reject future invalid class codes, verify the observed dates, and prevent the duplicated modern June 13 title. October 9 has several distinct, permitted modern optional memorials and remains unchanged.

Source checks:
- https://bible.usccb.org/bible/readings/0613-memorial-anthony-padua.cfm
- https://missale.online/festkalender/en/1962.pdf
- https://ordo.fsspx.org/en/day/2026-04-21?source=nullius&texts=readings
