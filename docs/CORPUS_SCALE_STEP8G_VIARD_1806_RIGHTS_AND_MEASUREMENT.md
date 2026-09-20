# Step 8G — André Viard / Le Cuisinier impérial 1806 rights and bounded measurement

Date: 2026-09-20

Status: `PASS_RIGHTS__V8012_MEASUREMENT_EARNED_COHORT_CANDIDATE`

Pinned source repository: `AdamBouhmad/open-recipe-archive`

Pinned commit: `ae3bd2c009a8899dfe63b9166fa98ae3fa8041a8`

Exact ORA cohort:

- collection: `cuisine-francaise`
- source work: *Le Cuisinier impérial*
- ORA author: `A. Viard`
- canonical bibliographic author: **André Viard**
- ORA source year: `1806`
- source-year semantics: **source tuple aligned with the documented 1806 first edition**
- exact ORA source URL: `https://archive.org/details/lecuisinierimpe00viargoog`
- exact ORA candidate records from fresh v8012 discovery: **807**
- ORA licence marker: `public-domain`

## Source identity and rights basis

Rights marker:

`PASS_RIGHTS_VERIFIED_BOUNDED_VIARD_1806_FIRST_EDITION_ALIGNMENT`

This classification is independently supported and does not rely on ORA metadata alone.

1. Bibliothèque nationale de France catalogs *Le cuisinier impérial, ou L'art de faire la cuisine et la pâtisserie pour toutes les fortunes* by A. Viard, Paris, Barba, **1806**, 459 pages. Its linked author authority identifies the author as **Viard, André (17..–1834)**:
   `https://catalogue.bnf.fr/ark:/12148/cb31570441h`

2. Google Books independently identifies an 1806 Barba edition by A. Viard, 459 pages:
   `https://books.google.fr/books?id=sI4EAAAAYAAJ`

3. WorldCat likewise identifies the 1806 Barba edition and André Viard as creator:
   `https://search.worldcat.org/title/763819873`

4. The ordinary EU literary-work term is author life plus 70 years under Directive 2006/116/EC Article 1. Viard's documented death in 1834 is far outside that term:
   `https://eur-lex.europa.eu/eli/dir/2006/116/oj/eng`

The source-specific historical authorial layer is therefore treated as public domain for this bounded cohort. This classification does not rely on private deployment as a rights basis.

## Provenance semantics

Marker:

`CLASSIFIED_SOURCE_YEAR_AS_BNF_ALIGNED_1806_FIRST_EDITION`

The ORA tuple's title, author form and year align with the BnF-documented first edition. The exact ORA source URL remains part of the required source tuple. The project does not infer cultural authenticity or modern French culinary authority from this historical provenance.

## Repository-layer reuse

The pinned ORA `LICENSE.md` must independently pass the existing Unlicense/public-domain-dedication check before measurement can earn downstream authority.

## Attribution/disclosure classification

Marker:

`CLASSIFIED_READY_FOR_PRIVATE_CORPUS__VIARD_1806_EXACT_SOURCE_ATTRIBUTION`

If later user-visible, retain at minimum the historical work title, ORA author form A. Viard, canonical author André Viard, year 1806, exact archive source URL, ORA provenance/pinned revision, and the project reuse classification. This does not authorize broader public corpus activation.

## Measurement contract

The bounded measurement must run against exact active protected `v8012` / **14,846** plus the unchanged public runtime. It must fail closed unless exact count/source identity, repository reuse, rights documentation, attribution, source-year semantics, structural quality and marginal novelty all pass.

Fresh no-write discovery found 807 rows and a novel-title ratio of approximately 0.98595. Discovery itself does not clear rights or authorize ingestion.

## Boundaries

This document does **not** authorize protected D1 population, a v8013 prewrite, public runtime/recommendation widening, a third shard, D1-budget expansion, paid infrastructure, Nutrition/YT-CUL/Recipe Family/Knowledge Core mutation, or cultural-authenticity/nutrition/allergen/dietary/scaling/medical authority.

Only a green deterministic measurement may earn `SOURCE_SPECIFIC_PREWRITE_CAPACITY_MEASUREMENT_ONLY`.


## Bounded measurement result

Workflow run `35505833962` completed successfully.

Terminal:

`STEP_8G_ORA_VIARD_1806_MEASUREMENT_EARNED_COHORT_CANDIDATE`

Measured against active protected `v8012` / **14,846**:

- exact candidate rows: **807**
- parseable rows: **807 / 807**
- distinct normalized titles: **783**
- unique-title ratio: **0.9702602230483272**
- exact baseline-title overlaps: **11**
- novel normalized titles: **772**
- novel-title ratio: **0.9859514687100894**
- distinct ingredient phrases: **2,235**
- novel ingredient phrases: **1,516**
- ontology-resolved occurrence ratio: **0.24015101772816808**

All rights, repository-reuse, attribution, edition-semantics, exact-count, source-identity, structural-quality and culinary-coverage gates passed.

The measurement earns only:

`SOURCE_SPECIFIC_PREWRITE_CAPACITY_MEASUREMENT_ONLY`

It does not authorize protected population.

Canonical public-safe measurement evidence:
`data/generated/step8g/viard-1806-v8012-measurement.json`.
