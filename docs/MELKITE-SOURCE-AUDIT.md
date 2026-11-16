# Melkite source-text audit utility

Run `node tools/audit_melkite_text.cjs extracted.txt` on a locally extracted, plain-text copy of the relevant Melkite liturgy. It reports reference-table boundaries, unclosed tables, suspicious rubrics, and damaged glyphs as JSON. Exit code 1 means manual review is needed.

The tool does not download or modify source documents, upload private books, remove text, or certify a complete liturgy. It uses the same boundary classifier as Ora's reader. Source-page metadata is not retained by a plain-text input; keep page references in the extraction when possible. This is an aid to source review, not a substitute for comparing rendered pages and the original edition.

## Comparing passages

Run `node tools/audit_melkite_text.cjs source-prayers.txt displayed-prayers.txt` to add a conservative line-by-line comparison. Both files must contain the **same selected prayers**, one passage per line, in their expected order. Exclude source rubrics, yearly reference tables, and unappointed alternatives before comparing. Results distinguish missing lines, insufficient or extra repetitions, and out-of-order matches. This deliberately does not use fuzzy matching or automatically edit prayers. Differences in line wrapping or minister labels may cause false positives; review findings against the edition.

Completely unexpected displayed lines are reported as `unexpected-rendered` for manual review. They may be legitimate appointed propers, not necessarily defects. Do not remove them automatically.

If the entire selected passage has identical wording in the same order, differences in physical line wrapping alone are ignored. Partial differences still use conservative line-level diagnostics and may need manual review. This is not fuzzy text matching.

The comparator also recognizes selected equivalent minister labels (Celebrant/Priest, DCN/Deacon, People/Faithful/Congregation/All). It does not equate priest and deacon or silently change the words of a prayer.

## Pinpointing text differences

When selected source and displayed prayers differ, the comparison additionally returns a `firstDifference` object with source and rendered line numbers, word positions, short excerpts, and counts of differing words after matching the common beginning and ending. The check retains punctuation and word order, while ignoring case and the explicitly recognized equivalent minister labels. Physical line wrapping alone does not produce a mismatch.

The excerpt is diagnostic only. Several distinct differences may be represented by one larger span, so review the full text against its source. The utility never substitutes, deletes, or automatically corrects prayer text.

## Multiple independent differences

The two-file comparison also returns `differences`, a list of separate exact-word change spans labeled `changed`, `omitted`, or `added` for review. Each identifies its source and displayed line, word positions, counts, and short context excerpts. Equivalent role labels and physical line wrapping are treated consistently with the original comparator. The earlier `firstDifference` field and conservative line-level findings remain available.

Alignment uses exact words, not fuzzy matching. Repeated words may admit multiple possible alignments, and added passages may be appointed propers rather than defects. If a larger divergence exceeds the bounded analysis, `diffTruncated: true` is returned with one `unresolved` span, not a claim to have found every discrepancy. Never use these diagnostics to remove or silently rewrite source prayers.


## Newton dual reference headings and prayer alternatives

The Newton 2009 edition uses both an introductory celebrant/choir cue and a
printed "Table of Kontakia for the Year" title for **one** reference table.
The audit treats that pair as one section, not a nested-table error. The
subsequent separate Chrysostom and Basil Trisagion prayer headings mark two
genuine alternatives: the first closes the table and the second is retained
without raising a false unmatched-marker warning. The Hirmoi reference table
has its own start and end markers. Unexpected duplicate ends and genuinely
nested different table families still require review. A mismatched end cannot
prematurely open the remainder of a reference table as devotional text.

The regression fixtures use short source-verified heading and prayer anchors;
they do **not** represent a complete transcription or certify any private
device-local PDF. App prayer wording is never modified by these checks.


## Spoken words embedded in ceremonial cues

The saved-book reader recognizes explicit spoken words after a source cue such
as "The priest, turning to the people, says: Peace be to all." The stage
direction is not presented as devotional content, but the spoken words remain
visible with the printed minister attribution. Bare directions ending at a
colon remain hidden and attach their minister to the following prayer. A
physical action without a spoken text is still classified as a rubric.

Regression tests exercise both the formatter and the browser's PDF-shaped
reader fixture. No source book, private PDF, or liturgical prayer was changed.
