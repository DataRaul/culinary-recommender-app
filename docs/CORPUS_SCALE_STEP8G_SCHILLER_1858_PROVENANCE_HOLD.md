# Step 8G — Schiller 1858 source-year provenance hold

Date: 2026-09-19

Status: `HOLD_SOURCE_PROVENANCE_FAIL_CLOSED__NO_MEASUREMENT__NO_PREWRITE`

## Candidate from fresh v8010 discovery

After the Wannée source was held fail-closed, fresh source-level discovery against active protected `v8010` / 11,752 ranked this source first:

- Collection: `german-kitchen`
- ORA source title: *Neuestes Süddeutsches Kochbuch*
- ORA source author: `Viktorine Schiller`
- ORA source year: `1858`
- ORA source URL: `https://www.gutenberg.org/ebooks/52879`
- ORA licence marker: `public-domain`
- Candidate rows: 885

Discovery itself does not clear rights or provenance.

## Independent provenance findings

Project Gutenberg eBook #52879 identifies Viktorine Schiller and *Neuestes Süddeutsches Kochbuch für alle Stände* and marks the eBook public domain in the United States.

The exact Gutenberg transcription's title page identifies:

- Stuttgart;
- E. Schweizerbart'sche Verlagshandlung;
- **1843**.

Wikisource's cookbook bibliography independently lists Viktorine Schiller's work in Stuttgart in **1843**.

No evidence in the exact reused Gutenberg source supports the ORA `source_year=1858` value. Because the project's provenance contract requires exact source identity rather than silent metadata correction, the mismatch is material even though the historical text is old and Gutenberg marks its U.S. eBook public domain.

## Disposition

Terminal:

`STEP_8G_HOLD_SCHILLER_1858_SOURCE_YEAR_MISMATCH_GUTENBERG_1843`

Decision:

`HOLD_SOURCE_PROVENANCE_FAIL_CLOSED`

The source is not rejected because of a demonstrated copyright-age problem; the exact provenance tuple is unresolved. Before any measurement, the ORA 1858 metadata must be reconciled to an independently supported edition/year model for the exact Gutenberg source.

Until then:

- no source-specific measurement;
- no prewrite;
- no protected D1 population;
- no public runtime/recommendation widening;
- no third shard;
- no D1 ceiling expansion;
- no billing expansion.

Canonical public-safe hold evidence: `data/generated/step8g/schiller-1858-provenance-hold.json`.
