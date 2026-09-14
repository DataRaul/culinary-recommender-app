# Corpus Scale Step 8G — ForkRecipe Layered Protected Population Prewrite

Status: **REPOSITORY PREFLIGHT PASS / LIVE PROTECTED POPULATION IMPLEMENTATION EARNED / ZERO LIVE D1 WRITES**

Date: **2026-09-14**

Terminal candidate:

`STEP_8G_FORKRECIPE_LAYER_PREWRITE_PASS_LIVE_PROTECTED_POPULATION_PENDING`

Validation run: **34869529773**

## Earned entry authority

The preceding Step 8G measurement earned:

`STEP_8G_FORKRECIPE_MEASUREMENT_EARNED_COHORT_CANDIDATE`

for the exact pinned ForkRecipe source at commit `c32255266af39bd77444d39452f3df8088ac8fd9`.

That result established strong protected-storage/scale value but high recommendation-review cost: 915 source recipes, 835 titles novel to the current public + protected baseline, while only about 8.1% of source ingredient occurrences resolve through the existing canonical ingredient ontology. It did not authorize public runtime activation or live D1 writes.

## Why the next protected version is layered

The existing Step 8A contract already models immutable corpus versions with `parentCorpusVersion`. Step 8G uses that existing mechanism rather than copying the 501 UniTools rows into every later corpus version.

The protected lineage is:

```text
v8001 — UniTools protected parent
  501 rows
     |
     v
v8002 — ForkRecipe incremental protected layer
  915 new rows only
```

The composed protected corpus will contain **1,416 recipes** while physically writing only the **915 new ForkRecipe rows** in this iteration.

This avoids a scaling failure in which each immutable child snapshot duplicates all earlier recipe bodies. The parent remains immutable and rollback remains a version/composition pointer operation rather than destructive deletion.

## Exact prewrite result

The repository-only run revalidated the pinned source and produced an exact PASS:

- parent `v8001`: **501 rows**, body bytes **2,618,295**;
- new `v8002` layer: **915 rows** in **93** batches;
- shard 0 new layer: **461 rows / 4,723,748 bytes**;
- shard 1 new layer: **454 rows / 4,676,249 bytes**;
- composed shard 0: **718 rows / 6,070,454 bytes**;
- composed shard 1: **698 rows / 5,947,838 bytes**;
- composed body bytes: **12,018,292**;
- largest recipe body: **16,644 bytes**;
- largest 10-row batch body: **128,488 bytes**;
- largest complete write request: **138,104 bytes** against the **262,144-byte** cap;
- planned write path: **15 / 16** D1 subqueries including authentication;
- mixed parent/layer hydration probe: **4 / 16** D1 subqueries;
- full-corpus scans: **0**;
- third shard: **not used**;
- billing expansion: **none**.

Layering avoids rewriting **501 parent rows / 2,618,295 parent body bytes**. At this transition, retaining an immutable parent plus a full copied child snapshot would require **14,636,587 body bytes**, versus **12,018,292** with the layered composition.

Frozen fingerprints from the PASS:

- `v8001` manifest: `0cb09afd9dd87ead733c3798c4832fdd96c8022867fb857a8730f74243562743`;
- `v8002` manifest: `6fb8e635add76734abfd11fe28bf082f311763a09764e3fb0ba13088f016dd0f`;
- `v8002` population plan: `8668b6733f006ad1f1bcb8606b04b37495c085ccaf7f9c91ce9be79aa72157ca`;
- exact route index: `d2638d443c62815426f28ab87b4c3e5c52cab36a6f608533ea75178167b5a30c`;
- composition: `90e14bda95e205c9d1c727b792969fc2833fc9e7f5a321f9f102cbc0aa37057d`.

## Exact-route composition

A protected control route index maps each exact recipe ID to:

- immutable corpus version;
- recipe-body shard number;
- source cohort;
- body hash and byte count.

Mixed parent/layer hydration is:

1. authenticate;
2. exact route-index lookup for the bounded candidate IDs;
3. group returned routes by the two already-earned recipe-body shards;
4. issue at most one exact `(corpus_version, recipe_id)` batch query per shard.

This keeps ordinary hydration independent of the number of immutable corpus layers. No body-table full scan or linear parent-chain probing is required.

## Authority earned by this PASS

This PASS earns implementation of the authenticated live protected-population path for the exact `v8002` layer on the existing two-shard topology.

It does **not** itself perform or authorize an unreviewed widening of scope. The live implementation must preserve the exact frozen source, hashes, batches, route/composition contract, `<=16` subquery budget, resumability, idempotency, fail-closed conflict behavior, unauthenticated denial and pointer-only rollback.

## Step 8F remains parked

This result strengthens the case for scale-before-public activation. ForkRecipe is useful precisely because it stresses protected storage and retrieval while exposing substantial normalization/review work that should not be mistaken for recommendation readiness.

Step 8F remains parked. It should be reconsidered only after Step 8G has produced a representative, stable multi-cohort protected corpus and an eligible subset worth exercising end-to-end. The owner still makes that explicit public-runtime decision.

## Hard boundaries

Not authorized by this gate:

- normal public recommendation/runtime changes;
- automatic ForkRecipe recommendation admission;
- source nutrition, dietary/allergen, scaling or media promotion to application authority;
- a third D1 recipe shard;
- Workers Paid, R2, Zero Trust/Access, billing or automatic overage;
- Nutrition-lane mutation;
- YT-CUL mutation;
- Knowledge Core writes;
- destructive deletion or rewrite of the `v8001` parent.
