# Nutrition / vitamin applicability audit V1

Date: 2026-09-23

Status: `IMPLEMENTATION_CANDIDATE__CI_EVIDENCE_PENDING`

## Purpose

Measure what the protected `v8018 / 19,268` corpus can **truthfully use** from the current nutrition system before recommendation-readiness work begins.

This is an applicability audit, not a nutrition-coverage expansion. It adds no nutrient values, imports no source recipe nutrition as authority, performs no D1 reads/writes, and changes no public or recommendation behavior.

## Audit layers

The audit separates four questions:

1. **Current public-engine calibration** — run the existing `publicNutritionSource` and coverage audit over the 76 authored recipes, 84-record golden corpus and 85-record public runtime.
2. **Protected ingredient identity readiness** — reconstruct all 19,268 protected recipes from exact pinned sources and measure only exact matches through the existing canonical ingredient alias index. No fuzzy or semantic matching is allowed.
3. **Protected quantity / macro applicability** — only UniTools currently exposes the structured quantity/unit/serving shape that can be tested directly against the existing nutrition engine without inventing a new quantity parser. ForkRecipe ratio-parts and CC0/ORA raw-text quantities remain explicit blockers.
4. **Vitamin/mineral applicability** — inspect the actual calculation-engine tracked schema separately from the five current macro/energy fields. No vitamin/mineral values are inferred from untracked source data.

## Interpretation

A PASS means the audit is complete and reproducible. It does **not** mean all recipes have authoritative nutrition.

Exact ingredient identity readiness is diagnostic only. It does not authorize recommendation admission, dietary claims or nutrition authority.

The approved Europe/Canary source-selection policy, carbohydrate semantic firewall, exact provenance, source-form review, quantity evidence separation and fail-closed behavior remain unchanged.

## Terminal outcomes

- `NUTRITION_VITAMIN_APPLICABILITY_AUDIT_PASS`
- `NUTRITION_VITAMIN_APPLICABILITY_AUDIT_FAIL`

On PASS, the owner-approved sequence advances to `RECOMMENDATION_READINESS_AUDIT`, carrying every nutrition and vitamin/mineral UNKNOWN state forward explicitly.
