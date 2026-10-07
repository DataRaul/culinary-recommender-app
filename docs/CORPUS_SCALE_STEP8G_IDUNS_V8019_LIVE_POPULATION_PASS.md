# Step 8G — Iduns v8019 protected population PASS

Date: 2026-10-07

## Terminal

`STEP_8G_IDUNS_V8019_PROTECTED_POPULATION_PASS`

The owner-authenticated restart-safe production run completed the exact **2,818-recipe** Elisabeth Östman / *Iduns kokbok* 1911 layer over live v8018, proved nineteen-layer bounded hydration, rollback/fail-closed behavior and reactivation, and left protected `v8019` active at **22,086 recipes**.

## Proven protected state

- Active protected version: `v8019`
- Parent protected version: `v8018`
- Parent recipes: 19,268
- Iduns child recipes: 2,818
- Composed protected recipes: **22,086**
- Recipe-body shards: 2
- Body batches: 283
- Route batches: 283
- Maximum observed D1 subqueries: **8**
- Optimized request target: 8
- Hard API D1 ceiling: 16
- Full-corpus scans: 0
- Parent route rows copied: 0
- Route storage: `V8015_BASE_PLUS_V8016_DELTA_PLUS_V8017_DELTA_PLUS_V8018_DELTA_PLUS_V8019_DELTA`
- Public runtime changed: false
- Recommendation admission changed: false
- Third shard used: false
- Billing expansion: false
- D1 budget headroom assumed: false

## Source cohort and provenance

- cohort: `ORA_IDUNS_1911_FIRST_EDITION_ARKIVKOPIA_RUNEBERG`
- work: *Iduns kokbok*
- author: Elisabeth Östman
- exact digitized edition: 1911 first edition
- recipes admitted: 2,818
- author handling: `IDENTIFIED_AUTHOR`
- pinned Open Recipe Archive commit: `ae3bd2c009a8899dfe63b9166fa98ae3fa8041a8`

Historical provenance does not confer cultural-authenticity, nutrition, allergen, dietary, scaling or medical authority.

## Runtime proofs

The owner run proved exact child body and route closure, idempotent replay, nineteen-layer hydration through v8019, rollback to v8018, v8019-only hydration fail-closed after rollback, and successful reactivation leaving v8019 active.

## Product-search state

This PASS certifies **protected storage and route composition**, not normal owner Search availability for all 22,086 recipes.

The current protected Search runtime is still explicitly frozen to `v8018 / 19,268`: its route composition, search-table corpus version, expected count and detail hydration all remain v8018-specific. Therefore the 2,818 Iduns recipes are **not yet claimed searchable/openable through the normal owner Search surface**.

The acquisition-first product contract requires search/open availability before advancing to another acquisition cohort. The next gate is therefore:

`V8019_OWNER_SEARCH_INCREMENTAL_INDEX_DELTA_V1`

That gate must widen the existing private search/index/detail runtime to v8019 incrementally, without a full 22,086-row rebuild, preserve the two-shard/free-tier envelope, and prove the normal owner product can browse/search/open the new Iduns records.

Canonical machine-readable evidence: `data/generated/step8g/iduns-v8019-live-pass.json`.
