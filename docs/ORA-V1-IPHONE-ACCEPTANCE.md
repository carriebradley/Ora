# Ora v1 — iPhone acceptance checklist
Updated: November 15, 2026

**When to use this:** After GitHub Actions' **Verify Ora** and GitHub Pages deployment checks are both green for the same commit. This is real-device testing that automated Chromium checks cannot replace. Private books stay on the device; do not upload them to GitHub to troubleshoot.

## Quick iPhone pass (approximately 10 minutes)

1. **Open the installed Ora app**, and open the GitHub Pages URL separately in Safari. Check that the Today's Liturgical Day card fits without horizontal scrolling; no stale update banner persists after reloading.
2. **Select each rite:** Roman, Byzantine (first Ukrainian, then Melkite in settings), and Traditional/Sarum. Confirm that the main day and saint card change, the selected rite persists after closing/reopening, and no duplicate saint biographies appear.
3. **Check key dates using the date selector:** Roman December 13, 2026 should be **Gaudete**; Roman March 7, 2027 should be **Laetare**. Their Sunday color is rose. Melkite November 15, 2026 should begin “Eighth Sunday after the Holy Cross” in normal title case, and November 21 should identify a major feast.
4. **Check prayer flow:** Open Morning Prayer, Evening Prayer, and Night Prayer in Roman and Byzantine modes. Change text size to Large and switch light/dark. Text must stay readable, controls must respond to taps, and Scripture references should not be silently replaced by unrelated texts.
5. **Check liturgy and readings:** Verify that the Byzantine liturgy card selects a church-appropriate book when the service is known; unknown or conflicting days should show a clear warning. In particular, Ukrainian December 24, 2026 should **not** automatically choose Basil while the Edmonton source conflict remains.
6. **Check private documents:** In Liturgy, load an **unencrypted** EPUB or PDF you own, open it, bookmark a location, close and reopen Ora, and confirm it resumes. Check that the original book remains available and is not replaced by another rite's book.
7. **Check offline:** While online, open the Today and prayer pages and the saved book once; then enable Airplane Mode and reopen the installed app. The cached app and previously downloaded texts should still load. Never delete and reinstall Ora to fix a stale page without exporting or confirming your saved documents first.
8. **Check accessibility:** With larger iOS text enabled and/or VoiceOver if you use it, check that headings, buttons, day choices and the bottom navigation are intelligible and tappable. Test at least one long calendar title and a private reading.

## How to report a problem
For each issue, record **date, rite/church, tab, expected versus actual behavior**, and if possible one screenshot. Do not share a copy of a copyrighted/private book unless necessary and explicitly approved.

**Pass criteria:** No wrong high-rank observances, blank primary screens, persistent layout overflow, lost saved books/bookmarks, or missing core offline behavior. Mark any issue that only affects a rare source as a documented limitation rather than silently replacing the source.

## Known, openly labelled limits
- The Office of Readings corpus and copyrighted official service-book texts are incomplete; absence of a complete book is not by itself a v1 failure.
- Edmonton's December 24, 2026 service choice remains an unresolved source conflict.
- Some Melkite daily service selections are calculated common practice rather than independently verified monthly appointments.
- Ora is publicly hosted; permission for official liturgical texts and ecclesiastical publication review remain separate matters.

Only mark Version 1 released when the final commit passes the automated checks **and** the user reports this iPhone acceptance pass.
