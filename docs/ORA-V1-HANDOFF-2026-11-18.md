# Ora V1 handoff baseline — November 18, 2026

Status: **in progress; not certified for V1 publication**.

This read-only orientation records the observed state of the connected public repository. It does not authenticate source-text wording, grant copyright permissions, or replace testing on a physical iPhone.

## Exact baseline

- Repository: `carriebradley/Ora`; default branch `main`; baseline commit `a64f5d238a6399d6eb8cb97db5d7c076552b126e` — "Wait for active Ora worker before PWA update reload (v407)".
- GitHub Actions `Verify Ora` for that SHA: [successful push run #44402221970](https://github.com/carriebradley/Ora/actions/runs/44402221970). Job steps include script syntax, PWA version discipline, Node regression tests, Melkite importer tests, and mobile/desktop Chromium audit. A successful workflow reports that these checks passed, **not** that source texts were fully verified.
- [Pages build and deployment run #44402223950](https://github.com/carriebradley/Ora/actions/runs/44402223950): successful for that same SHA.
- `main` was reported **unprotected**, with no enforced required status checks. Use feature branches and PRs; do not push fixes straight to `main`.
- Ten open PRs were observed: #31, #42, #50, #64, #68, #70, #75, #93, #94 and #105. These may include obsolete implementations now represented on `main`; check their head/base comparisons and present code before closing or merging. #94 targets a historical feature branch, not `main`. Do **not** bulk merge.
- Existing core flow: Roman, Ukrainian/Edmonton, Melkite/Newton, and Traditional/Sarum; user-imported private PDF/EPUB copies stay on the device.

## Confirmed release blockers and required evidence

| Priority | Gate | Required evidence / current boundary |
| --- | --- | --- |
| P0 | Source and calendar fidelity | Finish remaining Edmonton and Newton fixed-text comparison against exact original editions. Verify speaker labels, response multiplicity, optional petitions, page-break continuations and dated hymns without editing original private books. Existing checks are substantial, but synthetic fixtures are not full original-PDF certification. |
| P0 | Unresolved December 24 Ukrainian service | Edmonton 2026-12-24 remains `source-conflict`: never automatically select Basil until corrected authoritative Edmonton evidence is obtained. Do not transfer this uncertainty to Melkite. |
| P0 | Public distribution rights | `docs/ORA-V1-PUBLICATION-RIGHTS.md` records no specific approval for publicly served USCCB readings archive, ICEL website policy as applied to offline PWA, or ecclesiastical publication review. Obtain direct answers or use a citation/link-only fallback after testing, before V1 rights certification. |
| P1 | Real-device persistence, offline, Safari and accessibility | Owner to run `docs/ORA-V1-IPHONE-ACCEPTANCE.md` **after** final same-SHA Verify Ora and Pages success; verify PDF/EPUB bookmarks, iOS offline and update behavior, large text and VoiceOver. Never clear Safari storage or reinstall Ora casually. |
| P1 | Newton typikon | Verify individual monthly service appointments against actual Newton dated source, rather than promoting calculated general cycle to verified church-specific appointment. |
| P1 | PR backlog | Reconcile ten open PRs to current `main` and avoid merging historical versions or dropping intervening fixes. |
| P2 | Release scope | Complete official office/lectionary/service text corpora and all historical patristic additions remain outside V1; display missing/uncertain texts honestly. |

## Concrete next safe checks

1. Make a small, read-only source comparison inventory by **specific PDF edition + page + prayer sequence + speaker + repeated/optional response + rendered result**, using existing audit scripts. Mark unknowns; do not automatically repair liturgical words.
2. Reconcile open PRs one by one against `main` (particularly #105, #93–94, #75 and #31). A stale or diverged PR is not evidence that its functionality is absent. Do not merge without code comparison and fresh CI.
3. Preserve the current dated Ukrainian/Melkite separate calendars and full-year selector regressions. Focus on independent source checks where evidence is missing.
4. Before a release candidate, run `node --test --test-isolation=none tests/*.test.cjs`, Python importer tests, the Playwright/axe audit in GitHub Actions, and confirm the deployment run against the **same final SHA**.
5. Prepare a publisher-facing rights inquiry and/or a separately reviewed safer fallback that does not bundle restricted scripture text; neither path should silently remove current features or user data.

## Owner participation, only where necessary

- **Physical iPhone:** run the existing acceptance checklist and report issues by date/tradition/tab/expected versus actual. The original imported books should stay on the iPhone, not be uploaded to GitHub.
- **Publication:** send/approve rights-holder inquiries; only an authoritative response can establish what the public PWA may publish. The November 29, 2026 policy effective date is approaching.
- **Edmonton conflict:** an authoritative corrected source or direct eparchial confirmation is necessary to remove the December 24 warning; guessing is not acceptable.

## Safeguard

This handoff is intentionally documentation-only. It does not change JavaScript, liturgical sources, scheduled calendars, IndexedDB, local user books, the service worker, or PWA version. Merge only if review confirms accuracy.
