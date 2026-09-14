# Corpus Scale Step 8G — Protected Scale Before Public Activation

Status: **ACTIVE / MEASUREMENT-FIRST / STEP 8F PARKED**

Date: **2026-09-14**

## Purpose

Step 8G exists to determine whether the protected recipe corpus can scale usefully and safely before normal public recommendation runtime is broadened.

The sequence is deliberate:

1. identify a rights-clean candidate cohort;
2. measure marginal culinary coverage, ingredient coverage, duplication/family overlap and provenance quality before ingestion;
3. admit only cohorts that separately earn protected-population authority;
4. exercise bounded two-shard storage/retrieval, resumability, idempotency, rollback, zero-full-scan behavior and Free-plan headroom;
5. repeat while marginal value remains high and the earned capacity/topology boundaries remain safe;
6. only then reconsider Step 8F as an explicit end-to-end public-runtime decision.

Step 8F is therefore not a prerequisite for Step 8G and is not reopened because one recipe becomes recommendation eligible.

## Why public activation is deliberately later

The current public runtime already has a working 84-recipe baseline. The unresolved question is not whether one additional recipe can be displayed; it is whether substantially larger, heterogeneous protected cohorts remain useful, governable and operationally safe.

Activating early would provide little information about the main risk Step 8G is designed to expose: scale behavior.

## Important counterpoint

Step 8F should also not be postponed until an arbitrary maximum row count such as 170k. Some defects only appear in the real recommendation/runtime integration and cannot be fully proven by protected storage tests.

The correct Step 8F reopening condition is therefore **evidence-based, not count-only**. Reconsider Step 8F when Step 8G has demonstrated a representative multi-cohort corpus with:

- meaningful marginal culinary and ingredient coverage;
- acceptable duplicate/family overlap;
- stable provenance and source-rights handling;
- bounded D1 queries and zero full-corpus scans;
- safe resumability/idempotency/rollback;
- adequate Free-plan headroom;
- no unexpected topology or billing requirement;
- at least one recommendation-eligible subset worth exercising end-to-end.

The owner still makes the explicit Step 8F activation decision.

## Iteration 1 — ForkRecipe measurement

ForkRecipe is the first Step 8G measurement candidate because its pinned source was already audited under Step 7E:

- repository: `futurechef/forkrecipe-recipes`;
- pinned commit: `c32255266af39bd77444d39452f3df8088ac8fd9`;
- validated source universe: 915 recipes;
- source-level rights audit: previously PASS;
- structural audit: previously 915 admitted / 0 held / 0 rejected;
- prior live pilot: only 500 of the 915 records were used.

Iteration 1 re-runs the pinned rights/quality audit and measures the full 915-record source against the current baseline of:

- 84 public recipes;
- 501 protected UniTools recipes.

Measured dimensions include normalized title novelty, ingredient-name novelty, source-internal title duplication, cuisine/culture/category/tag breadth, ratio-system breadth and fork lineage.

A passing measurement earns only:

`STEP_8G_FORKRECIPE_MEASUREMENT_EARNED_COHORT_CANDIDATE`

It does **not** authorize live D1 writes. Protected ingestion remains a separate earned step.

## Hard boundaries

Step 8G measurement does not authorize:

- Step 8F or any normal public recommendation change;
- recommendation admission of the ForkRecipe cohort;
- a third D1 recipe shard;
- paid infrastructure, billing or automatic overage;
- source nutrition/diet/allergen/scaling claims as application authority;
- Nutrition-lane mutation;
- YT-CUL mutation;
- Knowledge Core writes.
