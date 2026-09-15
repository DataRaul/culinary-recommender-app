# Corpus Scale Step 8G — Abbott 1864 v8004 prewrite

Status: **PASS — LIVE PROTECTED POPULATION IMPLEMENTATION EARNED**  
Date: 2026-09-15  
Terminal candidate: `STEP_8G_ORA_ABBOTT_V8004_PREWRITE_PASS_LIVE_PROTECTED_POPULATION_IMPLEMENTATION_EARNED`

## Scope

The bounded Edward Abbott 1864 cohort that passed the Step 8G marginal-value and rights gate is planned as immutable protected layer `v8004`, parented by live protected `v8003`.

- parent protected corpus: 1,642 recipes (`v8003`);
- new protected layer: 713 recipes;
- planned composed protected corpus: **2,355 recipes**;
- recipe-body shards: **2**, unchanged;
- public runtime: unchanged;
- historical 84-recipe golden benchmark: unchanged.

## Capacity and cost proof

The exact pinned source packets and deterministic two-shard population plan pass the existing Step 8G budgets:

- added protected body bytes: 1,897,836;
- planned total protected body bytes: 14,562,931;
- shard 0 after population: 1,180 rows / 7,337,531 bytes;
- shard 1 after population: 1,175 rows / 7,225,400 bytes;
- maximum rows per write batch: 10;
- maximum body packet: 5,871 bytes;
- maximum batch body bytes: 30,389;
- maximum planned write request: 34,650 / 262,144 bytes;
- maximum planned protected D1 subqueries: 15 / 16;
- full-corpus scans required: 0.

No third shard or paid/billing expansion is required.

## Authority boundary

This prewrite performs **zero D1 writes**. Its PASS earns implementation of the v8004 live protected-population path only. It does not authorize public recommendation admission, public activation, source ingredient strings as ontology/dietary/allergen/nutrition authority, billing expansion, Nutrition-lane mutation, YouTube Culinary mutation, or Knowledge Core writes.

The next Step 8G action is to implement and validate the exact v8004 live runtime/population path against this frozen plan, preserving v8003 rollback and hydration fail-closed behavior.

## Canonical evidence

- `data/generated/step8g/ora-abbott-1864-measurement.json`
- `data/generated/step8g/ora-abbott-v8004-prewrite-evidence.json`
- workflow run `34962056580`
- artifact `10393616763`
- artifact digest `sha256:152a48b870f71dc380f896e2dc2b82262eeb58bff9564818a1deee18dbc8d433`
