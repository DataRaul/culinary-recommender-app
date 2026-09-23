# Step 8G — post-v8018 legal corpus baseline reassessment

Date: 2026-09-23

Status: `LEGAL_CORPUS_BASELINE_PASS`

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

## Post-v8018 source-review closeout

The first post-v8018 discovery found 11 source-level cohorts above the preregistered structure and marginal-value screen. Each was then handled source-by-source under the Legal Corpus First fail-closed contract.

Merged source-specific holds:

- PR #256 — *American Cookery* — transcriber/preparer provenance ambiguity
- PR #257 — *The Book of Household Management* — contributor/source-material provenance ambiguity
- PR #258 — *Miss Leslie's Complete Cookery* — exact-edition mismatch
- PR #259 — *The Whitehouse Cookbook* — omitted coauthor provenance
- PR #260 — *The International Jewish Cook Book* — Spain-facing term unresolved
- PR #261 — *The Virginia Housewife* — exact-edition mismatch
- PR #264 — *Common Sense in the Household* — revised-edition and unnamed-contributor provenance
- PR #265 — *The Creole Cookery Book* — editor/compiler versus multi-contributor provenance
- PR #266 — *The Art of Living in Australia* — recipe-author attribution mismatch
- PR #267 — *The Canadian Family Cook Book* — contributor/editor provenance mismatch
- PR #268 — *The Jewish Manual* — original anonymous credit and later attribution without documentary proof

No hold is a claim that culinary facts themselves are protected. Each is an exact-source admission decision for the intended reusable representation.

## Final no-write discovery

The final hold-adjusted discovery workflow run `35854872418` completed successfully against the unchanged v8018 / 19,268 protected baseline.

- terminal: `STEP_8G_ORA_NEXT_SOURCE_DISCOVERY_NO_MATERIAL_CANDIDATE`
- collections scanned: 31
- source groups: 59
- measured candidates: **2**
- rights-review eligible candidates: **0**
- artifact: `10746649788` / `step8g-ora-next-discovery-c31-g59-m2-e0`
- remaining measured sources: *Iduns kokbok* and *Hemmets kokbok*
- both remaining measured sources fail the preregistered marginal-value screen and therefore do not earn source-specific rights review
- no live D1 writes occurred

## Baseline decision

`LEGAL_CORPUS_BASELINE_PASS` is **earned at v8018 / 19,268**.

This terminal is evidence-based rather than count-based. Under the same pinned discovery universe and preregistered structure/marginal-value thresholds, the rights-review-eligible set has fallen from 11 to **0** after exact-source review. Raw recipe count was never the stop condition.

The terminal contract remains fail-closed:

- admitted protected corpus: v8018 / 19,268
- source/cohort admission basis: preserved by the existing Step 8G source-rights, prewrite and live-pass documents
- held/rejected source decisions: preserved in the source-specific hold documents and Git history
- provenance/attribution: required for every admitted cohort; unresolved cases remain held
- storage topology: exactly two protected recipe-body D1 shards
- certified operational maximum: 8 D1 subqueries/request; hard 16 remains a fail-safe, not spendable headroom
- authentication/private-data boundary: unchanged; protected bodies remain private, public runtime remains 85 recipes
- no billing expansion, third shard, public corpus widening, recommendation admission, Nutrition mutation, YT-CUL retry or Knowledge Core write is implied by this pass

## Next product-order lane

The controlling sequencing decision now advances to:

`CORPUS_NORMALIZATION_AND_CATEGORIZATION`

The first action should be a bounded **no-write normalization/categorization baseline audit** over v8018 / 19,268. It should inventory existing normalized dimensions, missing/ambiguous category coverage and taxonomy pressure before any corpus mutation. Nutrition/vitamin applicability, recommendation readiness, Recipe Family/adaptation and YouTube refinement remain later steps in the already-approved post-baseline order.

Machine-readable summary: `data/generated/step8g/post-v8018-discovery-summary.json`.
