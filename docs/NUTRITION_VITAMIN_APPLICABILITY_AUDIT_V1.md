# Nutrition / vitamin applicability audit V1

Date: 2026-09-23

Status: `NUTRITION_VITAMIN_APPLICABILITY_AUDIT_PASS__FROZEN`

## Result

The no-write applicability audit reconstructed the exact protected `v8018 / 19,268` source ancestry and passed every cohort-count check.

Canonical compact evidence: `data/generated/nutrition-vitamin-applicability-audit-v1.json`  
Workflow run: `35910295003`  
Artifact: `10772324502 / nutrition-vitamin-applicability-audit-v1`  
Artifact digest: `sha256:6c779a58871e0f3146cc5dd1cd0dcc4c23e089ce04f58518360fe9bdce5a6641`

## Current public nutrition engine

The live deterministic engine currently tracks only:

- energy kcal;
- protein;
- carbohydrate;
- fat;
- fibre.

Measured current state:

- authored recipes: **19 / 76 authoritative** (**25%**);
- golden corpus: **19 / 84 authoritative**;
- public runtime: **19 / 85 authoritative**;
- authored residual blockers: **54 missing-density**, **6 unsupported-quantity**, **20 ambiguous-portion** events;
- authored missing tracked fields: **7 fibre** events;
- authored incompatible carbohydrate-semantic events: **16**.

This supersedes older B8-era counts as the current-state audit while preserving those earlier numbers as historical tranche evidence.

## Protected v8018 applicability

Across all 19,268 protected recipes:

- recipes with ingredient structure: **19,265 / 19,268**;
- ingredient occurrences: **144,245**;
- exact matches through the existing canonical alias index: **36,760** (**25.4844%**);
- unresolved occurrences: **107,485**;
- recipes whose every ingredient identity exact-matches the current ontology: **112 / 19,268** (**0.5813%**).

These exact matches are diagnostic readiness only. No fuzzy matching, source-specific synonym invention or culinary-semantic inference is treated as authority.

By source shape:

- UniTools: structured quantity/unit/serving fields exist, but only **1 / 501** recipes exact-matches every ingredient identity; after the stricter current-engine requirement for positive quantities and units, **0 / 501** are directly calculation-ready;
- ForkRecipe: all 915 recipes use ratio-parts rather than an absolute mass + serving model, so they remain quantity-blocked for authoritative nutrition;
- CC0: 226 records use the current parser that strips source amount text from ingredient identity and does not produce canonical quantity objects;
- Open Recipe Archive: 17,626 records retain raw-text ingredient quantities that have not been admitted through a canonical quantity-normalization gate.

The audit therefore records **0 protected recipes directly authoritative under the current engine without additional normalization work**. This is not a claim that the recipes lack nutritional information; it is a statement about what the current app can calculate without inventing identity, amount, unit or serving semantics.

## Vitamin / mineral applicability

Current authoritative recipe calculation has **no vitamin/mineral fields**. The audit state is:

`SCHEMA_NOT_IMPLEMENTED`

Authoritative vitamin/mineral recipe count is therefore **0** by design. The audit does not infer vitamin/mineral values from the broader constituent catalogues behind reviewed source datasets.

A future vitamin/mineral feature would require its own tracked schema, constituent-semantic policy, bounded reviewed evidence and deterministic completeness rules.

## Boundaries preserved

The audit performed:

- D1 reads: **0**
- D1 writes: **0**
- protected bodies exported/rewritten: **0**
- new nutrition evidence: **0**
- nutrition runtime changes: **0**
- public runtime changes: **0**
- recommendation admission changes: **0**
- YouTube changes: **0**
- Knowledge Core writes: **0**
- billing expansion: **0**
- third shard: **0**

## Successor

The owner-approved sequence advances to:

`RECOMMENDATION_READINESS_AUDIT`

Recommendation readiness must carry the actual nutrition state forward rather than treating missing authority as zero or as hidden completeness. Existing authored estimates may remain estimates where the product contract allows them; protected-corpus nutrition UNKNOWN states cannot be silently upgraded.
