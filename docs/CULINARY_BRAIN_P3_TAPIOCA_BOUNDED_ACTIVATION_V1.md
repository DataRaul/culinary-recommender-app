# Culinary Brain P3 — bounded pão de queijo activation V1

Date: 2026-09-28  
Protected corpus: v8018 / 19,268 recipes  
Activated runtime record: `unitools_pao_de_queijo`

## Decision

The owner explicitly authorized the bounded P3 activation after the preactivation gate passed. The authorization applies to exactly one candidate: pinned UniTools `pao-de-queijo`.

## Runtime effect

- public runtime: **85 → 86** recipes;
- public open-external records: **9 → 10**;
- the activated record is recommendation-eligible only for the reviewed **breakfast** and **snack** meal roles;
- lunch and dinner remain fail-closed;
- `tapioca_starch` is promoted as one exact canonical ingredient identity with no generic `tapioca` alias;
- egg and milk remain declared hard allergens;
- dietary scope remains `unrestricted`; source vegetarian and gluten-free claims are not promoted;
- source nutrition remains unimported and all per-serving nutrition fields remain unknown.

## Provenance

Source is pinned to `farcrak/unitools-recipes` commit `1d09e9548d957dd0375301146a86dddf5e269c1b`, blob `a81e96415f09eac7fc0aec94a4da8d9f6d66d9ed`, under CC BY-SA 4.0 with UniTools attribution.

## Boundaries preserved

This activation does not authorize automatic admission of any other protected recipe, broader ingredient-alias inference, protected D1 reads/writes, protected-body rewrites, a third shard, paid model/API use, Knowledge Core writes, or Barbecue mutation.

## Acceptance

The activation gate requires exact source-pin regeneration, deterministic Node regression, hard-filter checks, RecipeSource V2 parity, public attribution checks, ingredient Search visibility, planner behavior, mobile Chromium acceptance, full public validation and deployment checks.

Terminal: `CULINARY_BRAIN_P3_TAPIOCA_BOUNDED_ACTIVATION_PASS__P4_READY`

Next gate: `PROTECTED_CORPUS_RUNTIME_USABILITY_P4_REAL_20K_REGRESSION_AND_PRODUCT_ACCEPTANCE`
