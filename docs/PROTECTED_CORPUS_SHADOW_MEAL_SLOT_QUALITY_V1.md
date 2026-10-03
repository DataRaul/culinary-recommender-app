# V21 Shadow Meal-Slot Quality Evaluation V1

Date: 2026-10-03

## Purpose

This gate evaluates the quality of the exact 500-recipe evidence-rich shadow cohort after the design-only `MAIN -> lunch + dinner` policy passed.

It tests the four app meal slots separately: breakfast, lunch, dinner, and snack. It does not authorize live recommendation exposure.

## Quality model

For each meal type the gate measures:

- exact eligible candidate count under explicit shadow mode;
- normal-mode leakage, which must remain zero;
- semantic role violations, which must remain zero;
- deterministic production-engine ranking;
- deterministic evidence-weighted comparison ranking;
- top-20 evidence completeness;
- the fraction of the production scorer's positive weight backed by finite evidence;
- canonical dish-category distribution as a diagnostic;
- seven-slot planner completion, determinism, uniqueness, and ingredient overlap.

A separate 14-slot lunch/dinner weekly planner probe measures the combined MAIN-policy pool.

## Live-readiness threshold

The gate deliberately separates **evaluation completion** from **live quality earned**.

For live quality to be earned, every meal type's evidence-weighted top 20 must have at least **50%** of the production scorer's positive weight backed by finite evidence, and planner diversity must keep maximum pairwise ingredient Jaccard at or below **0.85**.

The 50% threshold is a minimum evidence-coverage floor: a production recommendation should not be driven mostly by re-normalizing a minority of available soft signals while most weighted dimensions are unknown.

If the evaluation is deterministic and safe but this floor is missed, the gate closes PASS with live exposure still blocked and routes to a bounded shadow signal-coverage adapter.

## Boundaries

No D1 reads/writes, protected-body rewrite, public-runtime widening, recommendation admission, live meal-role translation, candidate classification promotion, dietary/allergen promotion, Knowledge Core write, paid model/API, third shard, or Barbecue mutation is authorized.

## Measured result

The evaluation completed successfully, but live recommendation quality is **not yet earned**.

- eligible shadow pools: breakfast **22**, lunch **207**, dinner **207**, snack **42**;
- normal-mode eligibility: **0** across all four slots;
- semantic role violations: **0**;
- vegetarian and egg-allergy shadow eligibility: **0**;
- evidence-weighted ordering did not reduce top-20 evidence quality;
- average available positive scorer-weight coverage: **36.1345%** for every slot, below the **50%** live-readiness floor;
- seven-slot planners for all four meal types are complete, deterministic, and unique;
- 14-slot lunch/dinner weekly planner is complete, deterministic, and uses **14 unique recipes**;
- maximum pairwise ingredient overlap remains low: **0.272727** breakfast, **0.20** lunch/dinner, **0.166667** snack.

The blocking issue is therefore not candidate volume, safety isolation, determinism, or planner diversity. It is **scoring evidence coverage**: too much of the production scorer's weighted feature set is still unknown on protected shadow recipes.

Terminal:

`V21_SHADOW_MEAL_SLOT_QUALITY_EVALUATION_PASS__LIVE_QUALITY_NOT_EARNED__SIGNAL_ADAPTER_NEXT`

Next gate:

`V21_SHADOW_SIGNAL_COVERAGE_ADAPTER_V1`

No live exposure or admission is authorized by this result.

Canonical evidence: `data/generated/protected-corpus-shadow-meal-slot-quality-v1.json`.
