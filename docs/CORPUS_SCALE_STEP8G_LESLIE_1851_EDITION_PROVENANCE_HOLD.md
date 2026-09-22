# Step 8G — Eliza Leslie / Miss Leslie's Complete Cookery edition-provenance hold

Date: 2026-09-23

Status:

`HOLD_PROVENANCE_FAIL_CLOSED__LESLIE_ORA_1851__GUTENBERG_60025_EXACT_DIGITIZED_EDITION_1853_REVISED_WITH_ADDITIONS`

## ORA discovery tuple

- collection: `ye-old-american`
- source title: *Miss Leslie's Complete Cookery*
- ORA author: **Eliza Leslie**
- ORA source year: `1851`
- source URL: `https://www.gutenberg.org/ebooks/60025`
- pinned ORA commit: `ae3bd2c009a8899dfe63b9166fa98ae3fa8041a8`
- candidate recipes: **835**
- parseable ratio: **1.0**
- unique-title ratio: **0.9712574850299401**
- novel-title ratio: **0.8310727496917386**
- novel normalized titles: **674**

## Exact-source documentary findings

Project Gutenberg identifies ebook 60025 as Eliza Leslie's *Miss Leslie's Complete Cookery / Directions for Cookery, in Its Various Branches* and identifies Leslie as 1787–1858.

The exact digitized title page does **not** identify the represented edition as an 1851 edition. It states:

- **FORTY-NINTH EDITION**
- **THOROUGHLY REVISED, WITH ADDITIONS**
- Philadelphia, Henry Carey Baird
- **1853**

The same edition also carries two historical copyright notices: one from 1837 and one entered in **1851 by Henry Carey Baird**. The 1851 date is therefore present in the exact book, but as a copyright-entry date, not as the publication year shown on the edition title page.

Leslie's preface is dated Philadelphia, January 16, 1851 and states that she introduced improvements, corrected errors and added new receipts for a revised edition. Those facts do not erase the exact digitized edition's 1853 publication identity.

Project Gutenberg's transcription note further states that corrections and alterations from the original are recorded at the end of the electronic text. This reinforces the need to pin the exact represented edition rather than infer edition identity from a single internal date.

## Rights and provenance disposition

Eliza Leslie died in 1858, so her own historical author term is long expired under the Spain-facing transitional framework already used by this programme.

The blocker is **exact-edition provenance**, not Leslie's author term.

The ORA tuple says `source_year=1851`, while the exact source URL resolves to a **1853 forty-ninth edition, thoroughly revised with additions**. Because the cohort is being admitted as an exact source-level representation, the repository does not reinterpret the 1851 copyright/preface date as the digitized edition's publication year without a separately documented mapping.

Hold marker:

`HOLD_PROVENANCE_FAIL_CLOSED__ORA_SOURCE_YEAR_1851_CONFLICTS_WITH_EXACT_GUTENBERG_1853_FORTY_NINTH_REVISED_EDITION`

The exact source key is excluded from candidate ranking until a corrected source identity explicitly represents the 1853 edition, or documentary evidence establishes a defensible row-level mapping to a distinct 1851 edition.

No bounded marginal-value measurement is authorized while this hold remains. No v8019, production D1 write, public runtime/recommendation change, YT-CUL mutation, third shard, billing expansion, Nutrition/Recipe Family mutation, or Knowledge Core write is earned.

## Documentary references

- Project Gutenberg ebook 60025 metadata: https://www.gutenberg.org/ebooks/60025
- exact Gutenberg HTML transcription and 1853 title page: https://www.gutenberg.org/files/60025/60025-h/60025-h.htm
- Spain current Copyright Act transitional provision 4: https://www.boe.es/buscar/act.php?id=BOE-A-1996-8930
- Spain 1879 Copyright Act Article 6: https://www.boe.es/buscar/doc.php?id=BOE-A-1879-40001
