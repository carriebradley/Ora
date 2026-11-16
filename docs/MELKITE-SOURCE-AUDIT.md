# Melkite source-text audit utility

Run `node tools/audit_melkite_text.cjs extracted.txt` on a locally extracted, plain-text copy of the relevant Melkite liturgy. It reports reference-table boundaries, unclosed tables, suspicious rubrics, and damaged glyphs as JSON. Exit code 1 means manual review is needed.

The tool does not download or modify source documents, upload private books, remove text, or certify a complete liturgy. It uses the same boundary classifier as Ora's reader. Source-page metadata is not retained by a plain-text input; keep page references in the extraction when possible. This is an aid to source review, not a substitute for comparing rendered pages and the original edition.

## Comparing passages

Run `node tools/audit_melkite_text.cjs source-prayers.txt displayed-prayers.txt` to add a conservative line-by-line comparison. Both files must contain the **same selected prayers**, one passage per line, in their expected order. Exclude source rubrics, yearly reference tables, and unappointed alternatives before comparing. Results distinguish missing lines, insufficient or extra repetitions, and out-of-order matches. This deliberately does not use fuzzy matching or automatically edit prayers. Differences in line wrapping or minister labels may cause false positives; review findings against the edition.

Completely unexpected displayed lines are reported as `unexpected-rendered` for manual review. They may be legitimate appointed propers, not necessarily defects. Do not remove them automatically.

If the entire selected passage has identical wording in the same order, differences in physical line wrapping alone are ignored. Partial differences still use conservative line-level diagnostics and may need manual review. This is not fuzzy text matching.
