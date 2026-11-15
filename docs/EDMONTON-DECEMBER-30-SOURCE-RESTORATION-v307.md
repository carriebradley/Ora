# Restoring December 30, 2026 — Ukrainian Catholic Edmonton calendar (Ora v307)

The original per-day URL for December 30 returned HTTP 404, and Ora marked the date as unavailable. Two **Catholic** sources now corroborate the date:

1. The Eparchy of Edmonton **December 2026 monthly view**, https://www.eeparchy.com/calendar?month=12&year=2026, expressly names the Holy Martyr Anysia and the Venerable Zoticus, presbyter and protector of orphans, with the post-feast of the Nativity.
2. The Ukrainian Greek Catholic Church **Patriarchal Liturgical Commission's 2026 calendar**, https://ugcc.ua/data/tserkovnyy-kalendar-ugkts-na-2026-rik-8059/, lists the same two commemorations on Wednesday December 30 and appoints James 1:1–18 and Mark 10:11–16.

We restored the dated entry with the Edmonton monthly URL as its source and a distinct `readingSource` for the Patriarchal references. Only the obvious website typo `abd` was normalized to `and` in Zoticus's title. The UI explicitly labels the monthly-versus-national source distinction. No service schedule or fasting obligation was inferred.

The new Ukrainian-only Saint of the Day card is Anysia of Thessalonica (less than 50 words). Biographical reference: https://www.oca.org/saints/lives/2026/12/30/103691-virgin-martyr-anysia-at-thessalonica. This source supplies biographical tradition, **not** Catholic calendar authority. The Melkite December 30 primary remains Melania. December 31 Ukrainian Melania and Melkite Nativity leave-taking remain unchanged.

Regression tests verify sources, readings, source labels, no fabricated fast or service schedule, and the different Ukrainian/Melkite saints.
