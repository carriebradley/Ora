# Historical Office reading importer — maintenance note

The Sulpitius Severus Letter III text is a fixed public-domain historical source, not a daily feed. The GitHub Action is intentionally manual-only. Daily scheduling repeatedly fetched an unchanged third-party webpage and the November 14, 2026 scheduled run failed during import; its precise failure reason is not established from the available job summary.

Before importing, the script now validates an already bundled reading and exits without network access or modification when complete. It refuses to overwrite an existing incomplete record. If absent, it still fetches New Advent, verifies paragraph count and references to Martin, and writes the historical work as a supplementary reading rather than mislabeling it the modern Office excerpt. To retry a missing import, run the workflow manually and review its validation output.
