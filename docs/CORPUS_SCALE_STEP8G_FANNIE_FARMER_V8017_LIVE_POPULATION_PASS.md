# Step 8G — Fannie Farmer v8017 protected population PASS

Date: 2026-09-22

## Terminal

`STEP_8G_FANNIE_FARMER_V8017_PROTECTED_POPULATION_PASS`

The owner-authenticated restart-safe production run completed the exact 1,776-recipe Fannie Farmer layer over live v8016, proved seventeen-layer bounded hydration, rollback/fail-closed behavior and reactivation, and left protected `v8017` active at **18,787 recipes**.

## Proven protected state

- Active protected version: `v8017`
- Parent protected version: `v8016`
- Parent recipes: 17,011
- Fannie Farmer child recipes: 1,776
- Composed protected recipes: **18,787**
- Recipe-body shards: 2
- Body batches: 178
- Route batches: 178
- Maximum observed D1 subqueries: **8**
- Optimized request target: 8
- Hard API D1 ceiling: 16
- Full-corpus scans: 0
- Parent route rows copied: 0
- Route storage: `V8015_BASE_PLUS_V8016_DELTA_PLUS_V8017_DELTA`
- Public runtime changed: false
- Recommendation admission changed: false
- Third shard used: false
- Billing expansion: false

## Cost-gate correction

The first owner run populated and reactivated v8017 and successfully collected exact terminal evidence, but the runner then rejected the run because activation observed 9 D1 subqueries against the preregistered optimized target of 8.

PR #246 fixed the real one-query inefficiency by combining the separate v8015-base and v8016-delta route-count reads. The optimized threshold was **not** relaxed. Dedicated v8017 CI and Public V0 passed. The owner then reran the same restart-safe flow and certified `maxObservedD1Subqueries: 8`.

## Source cohort and provenance

- cohort: `ORA_FANNIE_FARMER_BOSTON_COOKING_SCHOOL_GUTENBERG_65061`
- work: *The Boston Cooking-School Cook Book*
- author: Fannie Merritt Farmer
- ORA work-first-publication year: 1896
- exact digitized edition: 1910 revised edition with 125 new recipes
- recipes admitted: 1,776
- author handling: `IDENTIFIED_AUTHOR`
- pinned Open Recipe Archive commit: `ae3bd2c009a8899dfe63b9166fa98ae3fa8041a8`

Historical provenance does not confer cultural-authenticity, nutrition, allergen, dietary, scaling or medical authority.

## Runtime proofs

The owner run proved exact child body and route closure, idempotent replay, seventeen-layer hydration across v8001 through v8017, rollback to v8016, v8017-only hydration fail-closed after rollback, and successful reactivation leaving v8017 active.

## Roadmap disposition

This PASS satisfies the v8017 owner-authenticated production gate.

It does **not by itself** declare `LEGAL_CORPUS_BASELINE_PASS`. The required next action is a fresh no-write source-discovery/marginal-value rebase against **v8017 / 18,787**, followed by an explicit baseline reassessment. No v8018 protected population is authorized merely by this PASS.

Canonical machine-readable evidence: `data/generated/step8g/fannie-farmer-v8017-live-pass.json`.
