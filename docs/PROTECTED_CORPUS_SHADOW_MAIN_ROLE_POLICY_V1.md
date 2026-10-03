# V21 Shadow MAIN-to-Slot Policy V1

Date: 2026-10-03

## Purpose

The first-500 relevance gate proved that canonical protected-corpus meal roles and app runtime meal slots are different vocabularies. This gate tests one narrow product-slot hypothesis without turning it into source truth or live authority:

`MAIN -> lunch + dinner`

The translation exists only on `SHADOW_CANDIDATE_ONLY` recipes during explicit shadow evaluation.

## Why MAIN only

`BREAKFAST` and `SNACK` already have direct runtime equivalents.

`MAIN` describes a main-course role. Treating it as a candidate for both lunch and dinner is a product-slot hypothesis that can be evaluated offline.

`DESSERT`, `BEVERAGE`, and `SIDE` are not mapped in this gate because the current app planner chooses a recipe for a breakfast/lunch/dinner/snack slot; mapping those course roles to a daypart would add a stronger assumption.

## Frozen expectations

Within the exact 500-recipe cohort:

- 207 have canonical MAIN;
- 64 have direct BREAKFAST/SNACK semantics;
- the candidate policy creates 207 shadow lunch candidates and 207 shadow dinner candidates;
- 271 unique recipes become meal-targetable in shadow evaluation;
- 149 known DESSERT/BEVERAGE/SIDE roles stay held;
- 80 unknown roles stay held;
- 229 total remain meal-targeted holds.

Normal mode and restricted-profile shadow mode must still admit zero of these shadow candidates.

## Authority

This is an offline product-semantics experiment only. It does not change public runtime, live recommendation eligibility, source meal-role truth, dietary/allergen authority, candidate classification authority, or protected corpus storage.

## Next gate

On pass:

`V21_SHADOW_MEAL_SLOT_QUALITY_EVALUATION_V1`

That gate should evaluate the quality and diversity of the resulting breakfast/lunch/dinner/snack shadow pools before any live-policy adoption is considered.

## Measured result

The deterministic policy run passed:

- canonical MAIN candidates translated in shadow: **207**;
- direct BREAKFAST/SNACK candidates retained: **64**;
- unique meal-targetable shadow candidates: **271 / 500**;
- known DESSERT/BEVERAGE/SIDE holds: **149**;
- unknown-role holds: **80**;
- total meal-targeted holds: **229**;
- lunch shadow eligible: **207**;
- dinner shadow eligible: **207**;
- breakfast shadow eligible: **22**;
- snack shadow eligible: **42**;
- normal-mode eligibility for all four app meal types: **0**;
- vegetarian and egg-allergy shadow eligibility: **0**;
- five-slot lunch and dinner planner probes: **complete and deterministic**.

Terminal:

`V21_SHADOW_MAIN_ROLE_POLICY_PASS__MEAL_SLOT_QUALITY_READY`

Canonical evidence: `data/generated/protected-corpus-shadow-main-role-policy-v1.json`.
