# Step 8G — post-v8016 legal corpus baseline reassessment

Date: 2026-09-22

Status: `LEGAL_CORPUS_BASELINE_NOT_YET_EARNED__CONTINUE_SOURCE_REVIEW`

## Current protected baseline

- active protected version: `v8016`
- protected recipes: **17,011**
- live terminal: `STEP_8G_KENNEY_HERBERT_V8016_PROTECTED_POPULATION_PASS`
- route storage: `PARENT_V8015_REFERENCE_PLUS_V8016_DELTA`
- parent route rows copied for v8016: 0
- maximum observed D1 subqueries in the owner run: 8
- two D1 recipe-body shards
- public runtime remains 85 recipes
- no recommendation, billing or topology widening

## Fresh post-v8016 discovery

Workflow run `35720690011` completed successfully against the exact v8016 / 17,011 baseline.

- collections scanned: 31
- source groups: 59
- measured candidates: 16
- rights-review eligible candidates: **14**
- discovery boundary: no live D1 writes; discovery cannot clear source rights, earn measurement, authorize protected population, change the public runtime, widen recommendations, add a third shard or expand billing.

The leading discovery candidate is:

- *The Boston Cooking-School Cook Book*
- Fannie Merritt Farmer
- ORA source year: 1896
- source URL: `https://www.gutenberg.org/ebooks/65061`
- recipes: 1,776
- parseable ratio: 1.0
- unique-title ratio: ~96.68%
- novel-title ratio: ~93.71%
- novel normalized titles: 1,609
- current authority: `REQUIRED_SOURCE_SPECIFIC_DOCUMENTARY_REVIEW`

## Baseline decision

`LEGAL_CORPUS_BASELINE_PASS` is **not earned at v8016**.

The reason is not raw-count ambition. Fresh measurement still shows substantial, high-novelty source-level marginal value after the 17,011-recipe baseline, with 14 cohorts remaining eligible for documentary rights review. Stopping now would therefore be inconsistent with the owner-approved Legal Corpus First rule to continue while useful rights-clean coverage remains worth reviewing.

This decision authorizes only the next **source-specific documentary rights/provenance review and bounded measurement**. It does not authorize v8017 prewrite, protected population, public corpus activation, recommendation admission, third-shard work or billing expansion.

## Fannie Farmer source-semantics issue to resolve

The discovery record carries ORA `source_year=1896`, but Project Gutenberg ebook #65061 identifies the digitized text as a **1910 revised edition** and marks the ebook public domain in the USA. The next rights review must therefore distinguish work-first-publication year from digitized-edition year and verify the exact reusable source/edition rather than silently treating the scan as the 1896 edition.

Next authority:

`SOURCE_SPECIFIC_DOCUMENTARY_RIGHTS_REVIEW_ONLY`

Machine-readable discovery summary: `data/generated/step8g/post-v8016-discovery-summary.json`.
