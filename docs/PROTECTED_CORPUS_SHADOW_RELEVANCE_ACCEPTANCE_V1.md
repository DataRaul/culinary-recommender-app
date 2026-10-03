# V21 First-500 Shadow Relevance Acceptance V1

Date: 2026-10-03

## Purpose

This gate checks whether the frozen 500-recipe evidence-rich shadow cohort is semantically usable for recommendation quality work before any progressive live exposure.

It does **not** admit recipes. It distinguishes source/canonical meal roles from the app's runtime slot vocabulary.

## Runtime role finding

The app's current runtime recommendation slots use `breakfast`, `lunch`, `dinner`, and `snack`.

The protected normalization layer uses canonical roles including `BREAKFAST`, `SNACK`, `MAIN`, `DESSERT`, `BEVERAGE`, and `SIDE`. Lower-casing `MAIN`, `DESSERT`, `BEVERAGE`, or `SIDE` does not make them valid runtime slot types.

Therefore this gate permits only exact semantic pass-throughs:

- `BREAKFAST -> breakfast`
- `SNACK -> snack`

All other known canonical roles require a separate translation policy. Unknown roles remain held.

## Frozen cohort expectations

The cohort is the exact 500 selected by the prior engine-quality gate, digest:

`33a63f8971d0aa6e58f7f7f6e64a7b560f7d195d0624c8f679677d2999bcf7c7`

Expected role disposition:

- 64 direct runtime-role candidates: 22 breakfast + 42 snack;
- 356 candidates with known canonical roles that do not directly equal a runtime slot;
- 80 candidates with unknown meal role;
- 436 total held from meal-targeted shadow use pending role semantics.

The gate also checks that candidate-only C2 dish labels remain non-authoritative. In particular, lexical `pie` rules produce three obvious `DESSERT` candidates on recipes whose authoritative meal role is `MAIN`; those signals must be detected and held rather than promoted.

## Metadata context

Within the frozen 500, the predeclared audit expects:

- 500 with total-time authority;
- 500 with source difficulty evidence, but **0** runtime difficulty authority from this gate;
- 422 with servings authority;
- 216 with canonical dish-category authority;
- 12 with candidate-only C2 dish-category suggestions.

Broad unrestricted ranking remains diagnostic only. This gate does not treat category balance, missing nutrition, candidate-only dish labels, or source-native difficulty scales as production recommendation authority.

## Boundaries

No D1 read/write, protected-body rewrite, public-runtime widening, recommendation admission, runtime meal-role translation, candidate-classification promotion, dietary/allergen promotion, Knowledge Core write, paid model/API, third shard, or Barbecue mutation is authorized.

## Next gate

On pass:

`V21_MEAL_ROLE_TO_RUNTIME_SLOT_TRANSLATION_POLICY_V1`

That gate should decide, with explicit semantics, whether and how canonical roles such as `MAIN`, `SIDE`, `DESSERT`, and `BEVERAGE` can participate in the app's breakfast/lunch/dinner/snack slot model.
