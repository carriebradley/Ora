# January 11, 2027 — Roman Office of Readings scope audit (v462)

**Audit status: partial appointment comparison, NOT a complete or officially authenticated Office.** Linked to [V1 issue #163](https://github.com/carriebradley/Ora/issues/163) and the [full-day worksheet](ROMAN-FULL-DAY-PARITY-WORKSHEET-2027-01-11.md).

## Date and reference

The national U.S. calendar selects **Monday of Ordinary Time, Week I** on 2027-01-11, with Psalter Week I. The [Monday Week I Office of Readings witness](https://divineoffice.org/ord-w01-mon-or/) identifies **First Edition Volume III, ordinary p. 651, psalter p. 702**. The external site sometimes displays a different *current-day* heading above its reusable Monday template; its inner Monday Week I body, not that header, is the cited source.

## Actual selection in Ora

- `LitCal.oorKey(2027-01-11)` resolves to `o1-1`.
- `oor.js` appoints **Sirach 1:1–18**; Ora renders its reference and requests the **Douay–Rheims** biblical passage. The witness appoints the same Scripture citation.
- The second reading is **Clement of Rome, Letter to the Corinthians 59:2–60:4; 61:3**. `oortext.json` contains the matching indexed passage in **Kirsopp Lake's 1912 translation**. This is a distinct historical translation, not authenticated wording from the U.S. First Edition.
- Ora offers an external full-office link and now explicitly announces **“Readings index only — not the complete Office of Readings.”**

## Missing or unverified parts

| Part in Monday Week I witness | Ora selection | Recorded status |
| --- | --- | --- |
| Opening, hymn, Psalm 6, Psalm 9A in two parts, antiphons and psalm prayers | Not part of `oorHTML` | **missing-content** |
| First reading, Sirach 1:1–18 | Appointed reference and Douay–Rheims text; **first responsory absent** | **missing-content** |
| Second reading, Clement 59:2–60:4; 61:3 | Correct historical source index; First Edition translation **not** certified; **second responsory, collect and acclamation absent** | **missing-content** |

The witness gives the first responsory under **Sirach 1:7, 10, 1, 9** and the second under **Psalm 77:14–16**. These citations are evidence for future source-backed implementation, not authorization to copy their complete texts. The Office's concluding prayer and acclamation must also be checked for the calendar date and permitted celebration options.

### What the tests prove

`tests/roman-oor-jan11-parity.test.cjs` runs the actual date resolver and renders the actual `oorHTML` with the current index; `tests/browser-audit.cjs` checks the real phone-width screen and visible scope notice. The structured worksheet has three source-to-Ora comparisons newly marked `missing-content`, **`oraCompared=true` and `textCompared=false`**. They do **not** constitute a pass for complete prayer content or a claim of approved English word-for-word parity.

Across the first-date worksheet, **21 of 27** rows now have bounded selections or renderer findings; **0 of 27** have certified text identity with the printed approved U.S. First Edition. The remaining six rows include Mass propers/options and the three daytime Hours. Obtain and compare the actual First Edition rubrics and permissioned text before closing issue #163.
