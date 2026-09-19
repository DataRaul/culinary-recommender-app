# Step 8G — Wannée 1910 source provenance/rights hold

Date: 2026-09-19

Status: `HOLD_SOURCE_PROVENANCE_AND_RIGHTS_FAIL_CLOSED__NO_MEASUREMENT__NO_PREWRITE`

## Candidate from fresh v8010 discovery

Fresh source-level discovery against active protected `v8010` / 11,752 ranked this source first:

- Collection: `hollandse-keuken`
- ORA source title: *Kookboek van de Amsterdamse Huishoudschool*
- ORA source author: `C.J. Wannée`
- ORA source year: `1910`
- ORA source URL: `https://archive.org/details/bwb_Y0-BXP-037`
- ORA licence marker: `public-domain`
- Candidate rows: 1,067

Discovery itself does not clear rights.

## Independent provenance findings

The historical work and the exact digitized source are not the same edition layer.

The Koninklijke Bibliotheek identifies Cornelia Johanna Wannée (1880–1932) and states that the first edition of her cookbook appeared in 1910.

The exact Internet Archive item used by ORA is not a 1910 first-edition scan. Its full text identifies:

- C.J. Wannée as original compiler;
- R. Lotgering-Hillebrand as reviser/editor;
- **14th edition**;
- materially expanded/revised later content.

WorldCat independently catalogs the 14th edition as **1958** and credits R. Lotgering-Hillebrand as editor. The Dutch National Archives identifies Riek Lotgering-Hillebrand as **1892–1984**.

Therefore the ORA `source_year=1910` describes the historical work's first-publication year, while the exact `source_url` points to a later revised edition with an additional identified contributor.

## Rights disposition

EU Directive 2006/116/EC uses the ordinary literary-work term of author life plus 70 years.

Wannée's original 1910 authorial layer is old enough to be public domain by term, but the exact 1958 digitized edition contains later editorial/revision material attributed to Lotgering-Hillebrand, who died in 1984. The project cannot treat that complete digitized source as blanket public-domain material.

The ORA `public-domain` marker is therefore insufficient for this exact source tuple.

Terminal:

`STEP_8G_HOLD_WANNEE_1910_DIGITIZED_EDITION_RIGHTS_MISMATCH`

Decision:

`HOLD_SOURCE_PROVENANCE_AND_RIGHTS_FAIL_CLOSED`

## What would resolve the hold

A later review may proceed only if it identifies a source-grounded edition whose reused text is independently shown to be public domain or otherwise licensed, with exact edition provenance separated from the 1958 Lotgering-Hillebrand revision layer.

Until then:

- no source-specific measurement;
- no prewrite;
- no protected D1 population;
- no public runtime/recommendation widening;
- no third shard;
- no D1 ceiling expansion;
- no billing expansion.

Canonical public-safe hold evidence: `data/generated/step8g/wannee-1910-provenance-rights-hold.json`.
