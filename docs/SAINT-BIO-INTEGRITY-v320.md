# Complete Saint of the Day data integrity check

New regression coverage evaluates the **actual** shared and rite-specific biography records in `app.js`, including reusable aliases. Earlier tests counted only single-quoted `bio` literals and could miss newer double-quoted Roman biographies.

Every biography in the four mode maps (Roman, Ukrainian, Melkite and Sarum), and both shared maps, must now satisfy:
- A valid month/day key and meaningful saint name.
- Original biographical text between 6 and 50 words.
- A brief historical/liturgical descriptor.
- A separate HTTPS biographical source.
- A working match-regex function for the *appointed* calendar title.

The test also protects the preexisting Western precedence filter, so a calendar item only in the optional or outranked `also` list does not become a primary Saint of the Day card by date alone. This is an integrity safeguard only; no feast dates, prayers, copyrighted readings, or application settings have been modified.
