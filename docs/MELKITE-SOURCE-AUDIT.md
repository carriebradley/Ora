# Melkite source-text audit utility

## Prayer at the preparation table (Newton 2009, PDF p. 64)

The source embeds a short priest-and-deacon prayer in a long movement
direction following the Cherubic Hymn and says the clergy bow three times
while saying it. Ora's prayer-only reader previously hid the entire
direction, including the spoken prayer. For the positively recognized
edition, the complete unique direction is matched and the quoted words are
extracted from the user's own PDF and displayed three times. The surrounding
movement instructions and the original saved document remain unchanged.
Unknown, incomplete, edited or duplicated passages are left untouched.

Source: https://melkite.org/wp-content/uploads/2012/02/LITURGY2009.pdf

## Cherubic Hymn clergy repetition (Newton 2009, PDF p. 64)

The original source directs the priest and deacon to bow three times while
quietly repeating the Cherubic Hymn. It prints one priest stanza followed by
one deacon response. The recognized 2009 edition now displays that paired
exchange three times, without repeating the earlier congregation's hymn.
This is a display-only expansion: the saved PDF is not changed. It requires
the source's unique heading, complete direction, both consecutive speaker
lines and the following printed boundary. Unknown or altered editions and
ambiguous duplicates remain unchanged. The original was inspected with PDF
text extraction and the formatter was checked against its source lines;
this narrow finding does not certify the full Divine Liturgy.

Source: https://melkite.org/wp-content/uploads/2012/02/LITURGY2009.pdf

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


## Page-break speaker and chant verification

The continuous reader is now exercised with a fictional eight-page PDF
where a bare priest or deacon cue occurs at the end of one page and the
actual prayer begins on the next. The browser test also verifies that a new
heading, an explicit `ALL:` response, or a ceremonial rubric prevents
speaker attribution from leaking into unrelated text.

Greek and Arabic chant labels are protected from an earlier pending minister
cue. This is a narrow display-only correction: no saved PDF, source document,
or liturgical wording is modified.


## Keep source identity after inserting dated hymns

The known Newton 2009 Chrysostom PDF carries a `newton2009` marker on
the parsed section collection. This identifies the specific edition whose
annual Kontakia and Hirmoi reference tables the reader knows to suppress.
Composing the day's verified hymns previously built a new array without
retaining this marker, potentially exposing reference tables after hydration.

The compositor now preserves the marker during hymn insertion and fallback.
It never assigns the identity to an unrecognized book. New tests cover
successful placement, no-placement, mismatched-day and unknown-source cases.
The source PDF and prayer wording remain unchanged.

## Source line numbers with blank separators

Both `sourceLine` and `renderedLine` in comparison diagnostics refer to physical
line numbers in their respective input text files, including blank separators.
Previously, skipped blank lines shifted review pointers; the auditor now keeps
those original positions for changed-word spans, missing or reordered lines,
and unexpected or repeated displayed responses. Blank lines still do not count
as spoken prayers or trigger wording differences.

## Feast dismissal reference lists (Newton printed pp. 87-88)

In the 2009 Chrysostom source, the fixed-feast and movable-feast **Apolyses** lists appear after the actual concluding dismissal. These are a menu of alternative phrases, not prayers all appointed on an ordinary day. The two headings are treated as one source-only reference block. The reader resumes at the tracked **Distribution of the Antidoron** heading so that the genuine final blessing remains visible. Printed PDF pages 95-96 were visually checked; the original private source text remains unchanged. This suppression applies only when the stored PDF is positively identified as Newton's 2009 159-page edition. This does not imply that Ora has independently selected the correct feast-specific dismissal formula.

## Aitesis: verified six-petition response expansion

The Aitesis on Newton 2009 PDF page 79 (printed p. 71) has six requests and one printed `Grant this, O Lord` answer with an explicit after-each-petition instruction. PDF page 80 continues with the distinct `To You, O Lord` commendation response. Ora now repeats the first answer after each of the five subsequent petitions when and only when its private source is positively identified as Newton 2009 and the complete exact structure is recognized. Expansion happens in the display only; it does not edit or save altered source text. A missing, altered, or already-expanded petition sequence is left unchanged. The other four after-each-petition litanies include optional or nonuniform petition boundaries and remain for separate source verification.

## Preparation for Holy Communion (Newton PDF pp. 78–79)

The recognized 2009 source prints a `Lord, have mercy` answer after the opening petition, with instructions to repeat it after each petition. Two additional mandatory petitions precede a visually shaded **Optional** group on PDF page 79. The reader adds two responses **only** when the heading, original instruction, both mandatory petitions, optional boundary and next Aitesis heading can be recognized without ambiguity. The optional petitions are preserved in the original source and are not automatically assigned extra responses. This is a narrow, display-only change; no saved PDF or source text is rewritten. Full handling of optional petitions remains an outstanding liturgical selection task. A source with missing labels, missing petitions or preexisting expanded answers is shown unchanged.

## Litany of the Gifts (Newton PDF p. 67)

The printed Litany of the Gifts gives one response to the Deacon's opening petition, followed by an unambiguous mandatory petition concerning the offered gifts. A visually shaded **Optional** section comes next, before the **Prayer of Offering** (PDF p. 68). The reader repeats `Lord, have mercy` once after the mandatory petition, but only when the recognized Newton PDF contains all exact anchors and the optional boundary. It does not append answers to optional petitions or modify the original source. If the section has been edited, is missing the optional boundary, or already contains extra responses, the rendered passage is left unchanged.


## Ektene triple responses and optional substitutions (Newton PDF pp. 58–59)

The printed Newton 2009 Ektene explicitly calls for three Lord-have-mercy
answers after every petition. Its three introductory petitions (the opening
invitation and two requests) and concluding petition must be retained.
Four intermediate default petitions may instead be replaced with other
appropriate intentions; those alternatives are substitutions, not additions.

For the unmodified printed standard sequence only, the recognized Newton
reader now displays eight threefold answers. It leaves the source book, all
petition wording, and optional intent directions intact in source storage.
If any petition changes, a response is already present, or the distinctive
heading/directive is missing, the expansion fails closed. The editorial
substitution directions are hidden in the prayer view. Other translations
and Ukrainian books are unaffected. Custom alternative-petition selection
remains a future enhancement.


## Opening Litany of Peace responses (Newton PDF p. 32)

The identified Newton 2009 opening Litany of Peace directs the printed
"Lord, have mercy" answer after each petition. For the unchanged default
sequence, Ora adds ten missing responses after the ten following petitions.
The distinct commendation response "To You, O Lord" remains singular.
The source-specific display expansion checks the heading, original printed
repetition directive, all ten prayer anchors and distinct closing response.
Missing, substituted, already-expanded, or unrecognized source structures
remain unchanged, and the underlying PDF is never edited.


## Optional petition display boundaries (Newton PDF pp. 67 and 79)

The original PDF explicitly labels the last three Litany-of-Gifts petitions
and the last two Communion-preparation petitions "Optional:". These are
alternatives, not automatically appointed prayers. In the recognized source
edition, the reader groups the exact verified sequences in collapsed,
accessible Optional petitions disclosures, while retaining all unambiguously
required prayers in the continuous default reading flow. If the optional
label, complete sequence, or next fixed prayer heading is missing, it leaves
that litany unchanged. Source PDFs and saved prayer text remain intact.


## Embedded chant-selection note after All response (Newton PDF p. 68)

The original 2009 source places an editorial sentence about the alternative
"I will love You, Lord" chant immediately after the people's spoken
Trinitarian response. On the continuous reader this otherwise looks like
words that should be spoken. Ora removes that *exact verified trailing note*
from the display of the All response. It keeps the actual response and
the independently printed chant prayer unchanged; other explanatory text
patterns remain untouched. The saved private PDF is never modified.


## Font-substituted composite hyphens in prayers (Newton PDF pp. 30–96)

A read-only review of the original 2009 PDF using text-position extraction
identified **176** occurrences in the liturgical service-page range of
three visually overlapping hyphen code points: ASCII hyphen, soft hyphen,
U+2010 and U+2011. These are one **printed** compound hyphen, not three
spoken or printed punctuation marks. Examples include all-holy,
Only-Begotten and Life-Giving. Ora now reduces exactly this extraction
artifact to a single plain hyphen for the *displayed* prayers, preserving
normal compound hyphens and unrelated Unicode dashes. The source-only
Litany-of-Peace petition anchor also recognizes its verified all-holy
combination, avoiding a false rejection of the ten-response expansion.
The original source PDFs and private saved text remain untouched.


## Optional dismissal response (Newton PDF p. 93, printed p. 85)

The original 2009 Newton text marks the people's three-part Apolysis
response **Optional:** before the separate appointed Sunday/feast
dismissal. Its "Lord, have mercy" response is printed once with
"(Three times)". Ora groups the optional material in a collapsed,
accessible disclosure, expanding that response into three spoken
repetitions only if the complete source pattern matches. Missing or
altered boundaries remain untouched. The original PDF is unchanged.

The v387 change carries forward source-confirmed work initially
prepared in PR #93, without overwriting the intervening v384–v386
releases or reusing their application/service-worker version numbers.
