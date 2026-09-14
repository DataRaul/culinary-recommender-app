# Corpus Scale Step 8G — ForkRecipe Layered Protected Population Prewrite

Status: **IMPLEMENTED / REPOSITORY PREFLIGHT PENDING / ZERO LIVE D1 WRITES**

Date: **2026-09-14**

## Earned entry authority

The preceding Step 8G measurement earned:

`STEP_8G_FORKRECIPE_MEASUREMENT_EARNED_COHORT_CANDIDATE`

for the exact pinned ForkRecipe source at commit `c32255266af39bd77444d39452f3df8088ac8fd9`.

That result established strong protected-storage/scale value but high recommendation-review cost: 915 source recipes, 835 titles novel to the current public + protected baseline, while only about 8.1% of source ingredient occurrences resolve through the existing canonical ingredient ontology. It did not authorize public runtime activation or live D1 writes.

## Why the next protected version is layered

The existing Step 8A contract already models immutable corpus versions with `parentCorpusVersion`. Step 8G uses that existing mechanism rather than copying the 501 UniTools rows into every later corpus version.

The planned protected lineage is:

```text
v8001 — UniTools protected parent
  501 rows
     |
     v
v8002 — ForkRecipe incremental protected layer
  915 new rows only
```

The active protected composition therefore contains **1,416 recipes** while physically writing only the **915 new ForkRecipe rows** in this iteration.

This avoids a scaling failure in which each immutable child snapshot duplicates all earlier recipe bodies. The parent remains immutable and rollback remains a version/composition pointer operation rather than destructive deletion.

## Exact-route composition

A protected control route index maps each exact recipe ID to:

- immutable corpus version;
- recipe-body shard number;
- source cohort;
- body hash and byte count.

Mixed parent/layer hydration is then:

1. authenticate;
2. exact route-index lookup for the bounded candidate IDs;
3. group returned routes by the two already-earned recipe-body shards;
4. issue at most one exact `(corpus_version, recipe_id)` batch query per shard.

This keeps ordinary hydration independent of the number of immutable corpus layers. No body-table full scan or linear parent-chain probing is required.

## Repository prewrite gate

The prewrite workflow re-checks the exact pinned ForkRecipe source and builds, without D1 writes:

- the immutable `v8002` layer population plan;
- exact 10-row-or-smaller write batches;
- the two-layer composition manifest;
- the exact route index;
- cumulative per-shard row/byte projections;
- immutable-snapshot duplication avoided;
- maximum recipe-body bytes and complete write-request bytes;
- write-path D1 subquery budget;
- a mixed `v8001` + `v8002` hydration probe.

The gate may pass only if:

- the existing two-shard topology remains sufficient;
- each planned write request remains inside the frozen request-size boundary;
- the write path remains `<=16` D1 subqueries including authentication;
- mixed-layer hydration remains `<=16` D1 subqueries;
- zero full-corpus scans are required;
- project per-database and total storage budgets remain safe;
- no parent row rewrite is required;
- no third shard or billing expansion is required.

A PASS earns implementation of the authenticated live protected-population path for this exact layer. It does not itself perform the live write.

## Step 8F remains parked

This iteration strengthens the case for scale-before-public activation. ForkRecipe is useful precisely because it stresses protected storage and retrieval while exposing substantial normalization/review work that should not be mistaken for recommendation readiness.

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
- destructive deletion of the `v8001` parent.
