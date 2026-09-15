# Corpus Scale Step 8G — CC0 v8003 live protected population PASS

Date: 2026-09-15

Terminal: `STEP_8G_CC0_V8003_PROTECTED_POPULATION_PASS`

The authenticated production owner run completed successfully after PR #158 merged and both the v8003-specific real-source parity workflow and the full repository/browser validation passed. The new CC0 Markdown layer `v8003` is physically populated and left active for protected Step 8G work only.

## Live production evidence

- Source cohort: `SGAUTHIER_RECIPES_CC0_B12E481D`
- Source repository: `sylGauthier/recipes`
- Pinned source commit: `b12e481d1c220a13e0847a34e148d5872a16928e`
- Source license: CC0-1.0
- New `v8003` child layer: 226 recipes
- Existing composed parent `v8002`: 1,416 recipes
- Composed protected corpus: 1,642 recipes
- Body batches written: 23
- New child route batches written: 23
- Existing parent routes reused after exact v8002 closure verification: 1,416
- Recipe-body shards: 2
- Idempotent body replay: PASS
- Idempotent route replay: PASS
- Three-layer `v8001 + v8002 + v8003` hydration: PASS
- Pointer rollback to `v8002`: PASS
- `v8003` hydration fail-closed after rollback: PASS
- Final protected active version: `v8003`
- Full-corpus scans: 0
- Maximum observed D1 subqueries: 16

## Boundaries preserved

- Public runtime changed: false
- Recommendation admission changed: false
- Third shard used: false
- Billing expansion: false
- Step 8F remains parked and unauthorized
- Nutrition lane remains independent
- YouTube Culinary state remains independent
- Knowledge Core remains read-only from this lane

## What this earns

This closes the v8003 Step 8G iteration and proves that the existing two-shard architecture can support an append-only three-layer protected corpus of 1,642 recipes with bounded reads, deterministic routing, resumable/idempotent population, rollback and fail-closed hydration.

It earns either another bounded Step 8G protected-scale iteration or, if the owner explicitly chooses, the already-prepared Step 8F one-record public-runtime activation canary. It does **not** itself authorize public runtime activation or broader recommendation admission.

Canonical machine evidence: `data/generated/step8g/cc0-v8003-live-pass.json`.
