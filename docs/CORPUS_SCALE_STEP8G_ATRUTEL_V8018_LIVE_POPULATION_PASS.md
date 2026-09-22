# Step 8G — Atrutel v8018 protected population PASS

Date: 2026-09-23

## Terminal

`STEP_8G_ATRUTEL_V8018_PROTECTED_POPULATION_PASS`

The owner-authenticated restart-safe production run completed the exact 481-recipe Estella Atrutel layer over live v8017, proved eighteen-layer bounded hydration, rollback/fail-closed behavior and reactivation, and left protected `v8018` active at **19,268 recipes**.

## Proven protected state

- Active protected version: `v8018`
- Parent protected version: `v8017`
- Parent recipes: 18,787
- Atrutel child recipes: 481
- Composed protected recipes: **19,268**
- Recipe-body shards: 2
- Body batches: 49
- Route batches: 49
- Maximum observed D1 subqueries: **8**
- Optimized request target: 8
- Hard API D1 ceiling: 16
- Full-corpus scans: 0
- Parent route rows copied: 0
- Route storage: `V8015_BASE_PLUS_V8016_DELTA_PLUS_V8017_DELTA_PLUS_V8018_DELTA`
- Public runtime changed: false
- Recommendation admission changed: false
- Third shard used: false
- Billing expansion: false
- D1 budget headroom assumed: false

## Source cohort and provenance

- cohort: `ORA_ATRUTEL_1874_EASY_ECONOMICAL_JEWISH_COOKERY_B2807967X`
- work: *An Easy and Economical Book of Jewish Cookery*
- author: Estella Atrutel
- canonical author: Estella Benzaquen Atrutel
- exact digitized edition: 1874 first edition
- recipes admitted: 481
- author handling: `IDENTIFIED_AUTHOR`
- pinned Open Recipe Archive commit: `ae3bd2c009a8899dfe63b9166fa98ae3fa8041a8`

Historical provenance does not confer cultural-authenticity, religious-practice, nutrition, allergen, dietary, scaling or medical authority.

## Runtime proofs

The owner run proved exact child body and route closure, idempotent replay, eighteen-layer hydration through v8018, rollback to v8017, v8018-only hydration fail-closed after rollback, and successful reactivation leaving v8018 active.

## Roadmap disposition

This PASS satisfies the v8018 owner-authenticated production gate.

It does **not by itself** declare `LEGAL_CORPUS_BASELINE_PASS`. The required next machine action is a fresh no-write source-discovery/marginal-value rebase against **v8018 / 19,268**, followed by explicit baseline reassessment. No v8019 protected population is authorized merely by this PASS.

Canonical machine-readable evidence: `data/generated/step8g/atrutel-v8018-live-pass.json`.
