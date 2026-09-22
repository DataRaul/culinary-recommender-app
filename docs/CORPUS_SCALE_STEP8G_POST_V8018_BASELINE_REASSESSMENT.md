# Step 8G — post-v8018 legal corpus baseline reassessment

Date: 2026-09-23

Status: `LEGAL_CORPUS_BASELINE_NOT_YET_EARNED__CONTINUE_SOURCE_REVIEW`

## Current protected baseline

- active protected version: `v8018`
- protected recipes: **19,268**
- live terminal: `STEP_8G_ATRUTEL_V8018_PROTECTED_POPULATION_PASS`
- hydration layers: 18
- route storage: `V8015_BASE_PLUS_V8016_DELTA_PLUS_V8017_DELTA_PLUS_V8018_DELTA`
- parent route rows copied for v8018: 0
- maximum observed D1 subqueries in the certified owner run: 8
- exactly two D1 recipe-body shards
- public runtime remains 85 recipes
- broader public corpus/recommendation admission is **not authorized**
- no billing or topology widening

## Fresh post-v8018 discovery

Workflow run `35797274824` completed successfully against the exact v8018 / 19,268 protected baseline.

- collections scanned: 31
- source groups: 59
- measured candidates: 13
- rights-review eligible candidates: **11**
- artifact: `10723939351` / `step8g-ora-next-discovery-c31-g59-m13-e11`
- discovery boundary: no live D1 writes; discovery cannot clear source rights, earn measurement, authorize protected population, widen public runtime/recommendations, add a third shard or expand billing

The highest-ranked remaining discovery candidate is:

- *American Cookery*
- Amelia Simmons
- 1796
- exact source URL: https://www.gutenberg.org/ebooks/12815
- recipes: 122
- parseable ratio: 1.0
- unique-title ratio: ~93.44%
- novel-title ratio: ~89.47%
- novel normalized titles: 102
- current authority: `REQUIRED_SOURCE_SPECIFIC_DOCUMENTARY_REVIEW`

Other materially eligible cohorts remain, including Isabella Beeton, Eliza Leslie, F.L. Gillette, Florence Kreisler Greenbaum, Mary Randolph, Marion Harland, the Christian Woman's Exchange, Philip E. Muskett, Grace E. Denison, and *The Jewish Manual* attribution cohort.

## Baseline decision

`LEGAL_CORPUS_BASELINE_PASS` is **not earned at v8018**.

The decision is evidence-based rather than count-based. Fresh discovery still finds 11 source-level cohorts above the preregistered structural and marginal-value thresholds after the 19,268-recipe protected baseline. The Legal Corpus First loop therefore remains active.

This decision authorizes only the next **source-specific documentary rights/provenance review**, beginning with *American Cookery* (Amelia Simmons, 1796). It does not by itself authorize v8019 prewrite or protected population, public corpus activation, broader recommendation admission, third-shard work, Nutrition/Recipe Family mutation, YouTube retry, Knowledge Core writes, or billing expansion.

Machine-readable summary: `data/generated/step8g/post-v8018-discovery-summary.json`.
