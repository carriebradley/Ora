# Read-only PDF extraction quality audit

To inspect PDF text extraction **without changing a source PDF, liturgical prayer, or saved device-local book**, run:

```bash
pdftotext -layout /path/to/source.pdf /tmp/source.txt
node tools/audit_pdf_extraction.cjs /tmp/source.txt > /tmp/source-audit.json
```

The report records the PDF page number, extracted line/column, Unicode code point or mixed-script token, and a brief context excerpt. PDF page numbers include any front matter and may differ from printed page numbers. A report is **not** an instruction to strip or rewrite anything: visually check each finding against the exact page before proposing a display-only correction.

The scanner reports:
- Mixed Latin/Cyrillic tokens, which may be damaged English extraction or entirely legitimate Ukrainian typography.
- Private-use Unicode glyphs such as PDF font-dependent crosses and ornamental bullets.
- Replacement or hollow-square glyphs that may signal lost text.

A repeatable scan of the two privately supplied source books found:
- **Melkite, 2009, 159 PDF pages:** 31 private-use glyph occurrences (27 U+F058 and four U+F076), no mixed-script tokens.
- **Ukrainian episcopal liturgy, 2012, 140 PDF pages:** 14 mixed-script tokens; most fall within Ukrainian text, while two verified English-word anomalies motivated the narrow v371 display correction. No private-use or replacement glyphs were reported.

The counts are properties of the examined `pdftotext -layout` extraction, **not claims that every flagged character is an app defect**. Never convert the whole Ukrainian source using an automatic mixed-script transliteration rule: that could damage genuine Ukrainian prayer text. No source PDF or source wording is stored in this repository by the audit. For prayer-to-reader comparison, see `docs/MELKITE-SOURCE-AUDIT.md` and `tools/audit_melkite_text.cjs`.
