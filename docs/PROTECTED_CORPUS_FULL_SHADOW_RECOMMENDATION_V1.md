# Protected Corpus Full-Corpus Shadow Recommendation V1

Date: 2026-10-03  
Corpus: `v8018` / **19,268 recipes**

## Purpose

This is the first implementation tranche after the V21 search-first architecture pivot.

The corpus is already owner-searchable. This lane evaluates the **complete 19,268-recipe protected corpus offline/in shadow** without changing the live recommendation runtime.

The design separates three states:

1. **SEARCHABLE** — the recipe remains available to the owner.
2. **SHADOW EVALUABLE** — the recipe has enough non-live evidence to participate in offline recommendation-quality work.
3. **RECOMMENDATION VALIDATED** — separately earned authority for live recommendation.

A recipe failing shadow evaluation does **not** disappear from owner search.

## Key policy change from the old C4 gate

The prior C4 architecture treated absent reviewed dietary/allergen authority as a universal recommendation blocker.

V21 makes the restriction profile explicit:

- for **unrestricted / no-allergen / no-exclusion** shadow evaluation, missing dietary authority alone does not prevent offline evaluation;
- for vegetarian/vegan profiles, reviewed dietary authority is still required;
- for allergen profiles, reviewed allergen authority is still required;
- for ingredient exclusions, unresolved ingredient identity remains fail-closed;
- candidate-only C2 fields may be used as **shadow soft signals only** and never as hard safety authority.

This does not weaken live hard-filter semantics.

## Full-corpus inputs

The workflow reconstructs the same exact pinned-source state already used by the accepted C2/C4 evidence chain:

- UniTools: `1d09e9548d957dd0375301146a86dddf5e269c1b`
- ForkRecipe: `c32255266af39bd77444d39452f3df8088ac8fd9`
- CC0 recipes: `b12e481d1c220a13e0847a34e148d5872a16928e`
- Open Recipe Archive: `ae3bd2c009a8899dfe63b9166fa98ae3fa8041a8`

It reconstructs:

- the 19,268-row normalization mapping;
- per-recipe ingredient-identity diagnostics;
- the 19,268-row C2 candidate classification;
- the current 86-recipe live runtime baseline.

No protected D1 read/write is needed.

## Shadow profiles

The baseline measures four cases:

- unrestricted broad;
- unrestricted breakfast;
- vegetarian broad;
- egg-allergy broad.

Restricted cases are expected to fail closed where required authority is absent. The unrestricted cases are the first place where the new architecture can measure useful candidate coverage rather than automatically rejecting the entire corpus.

## Offline score

The V1 shadow score is deliberately **not a live recommendation score**.

It is a triage/evaluation score based only on evidence availability:

- canonical dish category;
- canonical meal role;
- canonical total time;
- canonical difficulty;
- canonical country;
- canonical servings;
- exact ingredient-identity completeness;
- lower-weight C2 candidate-only dish/meal signals.

Its purpose is to find where recommendation-quality testing can start and which shared data gap blocks the largest number of recipes.

## Failure clustering

Every full-corpus run reports counts for:

- missing meal-role signal;
- missing dish-category signal;
- missing total-time authority;
- missing difficulty authority;
- missing servings authority;
- unresolved ingredient identities;
- absent reviewed dietary authority;
- structural exceptions.

This replaces the old recipe-by-recipe frontier with a corpus-level binding-constraint loop.

## Sampling

A deterministic **500-recipe** sample is frozen on each run:

- at least one recipe from every source cohort;
- remaining slots selected by SHA-256 ordering;
- sample digest recorded for reproducibility.

This sample becomes the review/quality surface for the next phase.

## Boundaries

This tranche performs:

- **0 protected D1 reads**;
- **0 protected D1 writes**;
- **0 protected body rewrites**;
- **0 public runtime changes**;
- **0 recommendation admissions**;
- **0 Knowledge Core writes**;
- **0 paid model/API use**;
- **0 third-shard changes**;
- **0 Barbecue mutation**.

The owner-searchable 19,268 corpus remains unchanged.

## Pass condition

The baseline passes only when:

- exact 19,268-row reconstruction succeeds;
- all recipe keys are unique;
- the three known structural exceptions remain explicit;
- deterministic sample size is exactly 500;
- unrestricted shadow produces a non-zero evaluable population;
- restricted profiles produce zero hard-safety leakage;
- the current live baseline remains exactly 86 recipes;
- no mutation boundary is crossed.

## Next gate

On pass:

`FULL_CORPUS_SHADOW_RECOMMENDATION_V1_ENGINE_ADAPTER_AND_QUALITY_EVALUATION`

That next gate will convert suitable shadow rows into a temporary recommendation-engine-compatible representation, measure recommendation quality and planner behavior, and identify the first meaningful cohort for progressive promotion. It will still not widen live recommendation without a separate acceptance gate.
