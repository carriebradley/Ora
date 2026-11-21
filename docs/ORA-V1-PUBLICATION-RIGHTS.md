# Ora v1 — public distribution and liturgical text rights review
Reviewed: November 15, 2026
Status: **Open — no Ora-specific permission or review approval verified.**

## Why this is a release consideration
Ora is used by its owner for private devotion but is hosted on **public GitHub Pages** as an installable offline-capable progressive web app. It is therefore not equivalent to a private notebook or unpublished file. That factual hosting distinction matters more than whether Ora is sold.

### Evidence from primary policies
1. **USCCB, Publication Guidelines** — Approved June 15, 2025; enter into force **November 29, 2026**. Introduction nos. 8–12 address digital/noncommercial publications, permission and text authentication; nos. 55–63 cover devotional publications, Secretariat review, and limits on calling an unreviewed product approved.
   https://www.usccb.org/committees/divine-worship/policies/guidelines-for-the-publication-of-liturgical-books
   https://www.usccb.org/committees/divine-worship/policies/guidelines-for-the-publication-of-liturgical-books/devotional-and-other-non-liturgical-publications
2. **USCCB Appendix III** explicitly covers devotional publications in digital and print formats and permits selected options/feast alternatives under conditions. The use of private-devotional language does not by itself remove the publication-review question.
   https://www.usccb.org/committees/divine-worship/policies/guidelines-for-the-publication-of-liturgical-books/appendix-iii
3. **CCD / USCCB Bible Permissions — Web and other digital media** distinguishes displaying daily-reading RSS material **on a qualifying free website** from **digital apps distributed free or for sale**, which require a license/fee. The page currently says new **NABRE** digital permissions are not being granted pending an anticipated 2027 Catholic American Bible. The interaction of these terms with an installable PWA needs direct rights-holder clarification; no broad permission is inferred.
   https://www.usccb.org/offices/new-american-bible/permissions
4. **ICEL Publication Policies, p. 25** permit promulgated ICEL texts on a qualifying free noncommercial Internet site subject to exact rendering, acknowledgments and nonendorsement, but expressly limit the permission's scope. USCCB authentication and the PWA's offline content use are separate questions.
   https://www.icelweb.org/PubPolicy.PDF

## What the code does today (not a legal conclusion)
- `fetch_readings.py` imports the USCCB daily RSS feed and persists **up to 800 dates** into the publicly served `readings.json`. GitHub Actions repeatedly commits that JSON to the public repository and Pages. `app.js` loads it, shows the passage bodies and stores a local copy; `sw.js` caches it for offline use.
- Ora's Roman Office contains selected ICEL First Edition prayer portions under the documented conditional noncommercial website policy (see `roman-office-text-permissions.md`). No claim is made that its combination with calculated office structure is an approved edition.
- The private PDF/EPUB reader does not upload the user's books. That privacy fact does **not** automatically confer publication rights on text served from public Ora files.
- Previous user-facing wording asserting “Used with permission via the USCCB daily readings feed” was too strong for an installable PWA without a confirmed authorization. Ora v327 corrects that assertion, not the underlying licensing question.

## Preferred resolution sequence
1. **Obtain written guidance** from the USCCB Secretariat of Divine Worship on whether this public PWA is classified as a devotional publication or a participation aid and what review is required under the new guidelines. Reference the working public prototype and its separation of official, historical and private texts.
2. **Contact CCD Permissions** about the USCCB reading feed specifically: is replaying its excerpts from a date-indexed JSON corpus (up to 800 days), available as an installable/offline-capable PWA, covered by the free-site RSS display exception? If not, ask what permission is possible while NABRE app licenses are unavailable.
3. **Contact ICEL or the Secretariat** if needed about use of authorized First Edition Office texts in this PWA and any changed Nov 29 requirements. Do not equate a policy available to qualifying websites with a specific Ora license or authentication.
4. **If permission is unavailable**, ship a safer public release that displays **citations and official USCCB publisher links**, with an optional clearly labelled **public-domain Scripture translation** where an actual indexed reference has been checked. Do not regenerate purported exact Lectionary wording from public-domain books. Keep the private on-device reader.
5. Do not announce “official Catholic liturgical edition,” “approved by the USCCB,” or similar status unless the responsible body actually authorizes it. Record any response verbatim with its date and scope before changing this status.

## Ready-to-adapt inquiry questions (owner to send, not sent)
**Subject:** Publication classification and reading-feed rights for a noncommercial Catholic prayer PWA

I maintain Ora, a free, publicly hosted progressive web app intended for private Catholic prayer. It displays portions of Roman Office prayer texts attributed to ICEL's First Edition and currently imports the USCCB daily-readings RSS text into dated JSON for the app (up to 800 dates, with offline caching). It also displays Eastern Catholic calendar facts and links to sources; it does not publish user-uploaded books.

Could you clarify whether the 2025 Guidelines (effective Nov 29, 2026) regard an offline-capable public PWA as a devotional publication, what Secretariat review/authentication is required, and whether ICEL's noncommercial website policy applies here? Separately, does the USCCB RSS website exception cover maintaining and serving the dated readings corpus, or would a CCD digital-app license be required? If that use cannot be licensed now, would displaying only daily citations and links to the USCCB website be the appropriate approach?

I understand that these are separate rights and ecclesiastical questions and have not assumed approval. Please advise on the next steps and submission materials.

**No inquiry has been sent.** Do not list this question as resolved until an authoritative response is received.

## Not a legal opinion
This is a factual implementation and policy comparison, not a legal determination. It preserves existing app function while documenting a material public-release gate. An independent qualified review and rights-holder direction may be necessary.

## Prepared source-reference distribution fallback (November 21, 2026)

The current checked public `readings.json` contains **23 dated RSS records**, **100 reading sections** and approximately **13,574 words** of reproduced passage bodies (snapshot November 21, 2026). The scheduled importer can grow the archive up to 800 dates. This is a publication-rights risk inventory, **not evidence of an existing license**.

A tested, **opt-in** citation-only distribution path is now available:

- To preview without modifying the public dataset: `python3 publication_readings.py --input readings.json --output /tmp/ora-readings-references.json`. The script refuses in-place modification.
- To intentionally make the scheduled refresh write only citation metadata to its selected `--out` file: set `ORA_READINGS_PUBLICATION_MODE=references-only` on the importing process. The default remains `full` for now; do not change production behavior by accident.
- The reduced file retains the date, source link, Scripture citations, external audio IDs, and independent Justice readings; it removes **all** USCCB passage body text and other non-whitelisted per-day fields. The app renders citations and a link to the original USCCB page without blank passages or invalid read-aloud controls.
- Before switching the public release, update the deployed dataset **and** scheduled GitHub Actions environment, test the published URL and offline behavior, and assess existing published Git history and older cached copies. A reference-only future dataset cannot retroactively erase public repository history or private client caches.

The 2025 USCCB guidelines (effective November 29, 2026) and CCD permissions text were rechecked against their official pages on November 21, 2026. They expressly distinguish web RSS display from a downloadable digital application. **No Ora-specific permission or ecclesiastical authentication was confirmed.** This fallback prepares a lower-risk alternative; it does not resolve ICEL or other publication rights. See the official USCCB website for the current terms.

**Scheduled workflow switch:** The GitHub Actions repository variable `ORA_READINGS_PUBLICATION_MODE` can be set to `references-only` after a release decision. The `update-readings` workflow then calls the references-only converter **even if the RSS download fails**, before committing the public archive. The variable is **not currently enabled**; a controlled first conversion/commit and published-site verification are still necessary. Never regard this source-only switch as retroactive removal from Git history or as a substitute for an ICEL/CCD permissions review.
