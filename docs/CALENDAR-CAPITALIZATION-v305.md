# Ora v305 — Calendar capitalization audit

The Calendar previously normalized only multi-item titles. Single-observance Western and Byzantine titles could still appear with source-provided all-capital letters. Both single-item branches now display their normalized entries, without modifying calendar data.

The shared chip formatter also normalizes all-capital liturgical rank, feast, and fasting-season labels, preserving recognized acronyms and Roman numerals. Examples: GREAT-MARTYR BARBARA → Great-Martyr Barbara; HOLY PROPHET NAHUM → Holy Prophet Nahum; ALL-NIGHT VIGIL FEAST → All-Night Vigil Feast; USCCB stays USCCB.

New regression tests cover the actual single-entry branches and common titles. No Scripture text, prayer text, or saved books are modified.
