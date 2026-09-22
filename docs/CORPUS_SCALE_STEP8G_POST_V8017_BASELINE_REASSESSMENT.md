# Step 8G — post-v8017 legal corpus baseline reassessment

Date: 2026-09-22

Status: `LEGAL_CORPUS_BASELINE_NOT_YET_EARNED__CONTINUE_SOURCE_REVIEW`

## Current protected baseline

- active protected version: `v8017`
- protected recipes: **18,787**
- live terminal: `STEP_8G_FANNIE_FARMER_V8017_PROTECTED_POPULATION_PASS`
- route storage: `V8015_BASE_PLUS_V8016_DELTA_PLUS_V8017_DELTA`
- parent route rows copied for v8017: 0
- maximum observed D1 subqueries in the certified owner run: 8
- two D1 recipe-body shards
- public runtime remains 85 recipes
- no recommendation, billing or topology widening

## Fresh post-v8017 discovery

Workflow run `35769713453` completed successfully against the exact v8017 / 18,787 baseline.

- collections scanned: 31
- source groups: 59
- measured candidates: 15
- rights-review eligible candidates: **13**
- discovery boundary: no live D1 writes; discovery cannot clear source rights, earn measurement, authorize protected population, change the public runtime, widen recommendations, add a third shard or expand billing.

The leading discovery candidate is:

- *Cocina Ecléctica*
- Juana Manuela Gorriti
- 1890
- exact source URL: `https://archive.org/details/cocina-eclectica-juana-manuela-gorriti`
- recipes: 251
- parseable ratio: 1.0
- unique-title ratio: ~96.81%
- novel-title ratio: ~93.00%
- novel normalized titles: 226
- current authority: `REQUIRED_SOURCE_SPECIFIC_DOCUMENTARY_REVIEW`

## Baseline decision

`LEGAL_CORPUS_BASELINE_PASS` is **not earned at v8017**.

The reason is not a target recipe count. Fresh measurement still shows substantial source-level marginal value after the 18,787-recipe baseline, with 13 cohorts remaining structurally eligible for source-specific documentary review. The Legal Corpus First loop therefore remains active.

This decision authorizes only the next **source-specific documentary rights/provenance review**. It does not authorize v8018 prewrite or protected population, public corpus activation, recommendation admission, third-shard work or billing expansion.

## Leading-source rights issue

The 1890 *Cocina Ecléctica* source is a community/compiled cookbook. Documentary evidence identifies Gorriti as the compiler/authorial figure but also identifies a large set of separately contributed recipes from numerous women across Hispano-America. Because the project is Spain-facing and the contribution-level author terms have not been established cohort-wide, the exact source cannot be treated as rights-clean merely because Gorriti's own term has expired.

The source therefore moves to a fail-closed contributor-rights hold and must be excluded from ranking until the contribution layer is resolved.

Next authority after encoding that hold:

`SOURCE_SPECIFIC_DOCUMENTARY_RIGHTS_REVIEW_ONLY`

Machine-readable discovery summary: `data/generated/step8g/post-v8017-discovery-summary.json`.
