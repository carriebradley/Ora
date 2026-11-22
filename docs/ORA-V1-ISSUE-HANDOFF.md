# Ora V1 — persistent handoff through GitHub Issues

**Canonical context:** [Ora V1 issues](https://github.com/carriebradley/Ora/issues?q=is%3Aissue+is%3Aopen+label%3Aora-v1). The main tracking issue is titled **[Ora V1] Full liturgical-day fidelity — tracker and chat handoff**.

## Scope and established decisions
- Roman **Mass and the complete Roman Liturgy of the Hours** are the top priority. Morning Prayer is important but never the whole scope.
- Verbatim approved U.S. English sources are preferred. If a different translation is necessary, label it and retain the appointed prayer or reading; do not invent replacements.
- Verify Byzantine Ukrainian and Melkite services from their own eparchial/specific texts, and preserve historically sourced Traditional/Sarum material.
- Keep the simple Today cards, original layout choices, purple fasting indicators, offline and private PDF/EPUB preservation.
- A green build or 462/462 structural sections does **not** certify fidelity. We need element-by-element source comparisons.
- Public PWA copyright/licensing and ecclesiastical approval are separate decisions. No V1 freeze before an agreed fidelity threshold, release checks and on-device acceptance.

## Restart every development chat
1. Fetch [main](https://github.com/carriebradley/Ora), the current deployment/verification result, and the **master V1 tracker issue**.
2. Read the highest-priority open issue, its recent comments, acceptance criteria, linked PR and the proposed scope PR #152.
3. Complete a **single small issue** or one verifiable step. Add tests and record findings, source editions, commits, CI and **the next action** as an issue comment.
4. Do not reconstruct project state solely from chat transcripts or a stale PR. Do not close issues before acceptance is demonstrated.
5. In any new session, the prompt **"Continue Ora development from the GitHub V1 tracker"** should be sufficient to restore priorities.

## Idempotent issue creation
`docs/ORA-V1-ISSUE-BACKLOG.json` holds the first small-task batch. On a matching push to main or a manual workflow dispatch, `.github/workflows/seed-ora-v1-issues.yml` creates only missing issues based on embedded stable markers. It never overwrites the task body or comments of existing issues; the master tracker issue updates only its checklist index. As new work is discovered, add narrowly scoped entries to the JSON **or** create manual issues with clear acceptance criteria and link them from the tracker. Never store private book content in GitHub Issues.

The user owns the release scope. This tracking system is a context aid, not authorization to substitute different liturgical texts.
