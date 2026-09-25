# EU Regulatory Allergen Gap Audit V1

State: **PASS**  
Lane: **Lane 3 — audit only**  
Date: **2026-09-25**  
Source: **Regulation (EU) No 1169/2011, Annex II**  
Target: **zero behavior change**

## Result

The public ingredient ontology currently contains **136 canonical ingredients** and **9 distinct allergen tokens**:

`crustacean, egg, fish, gluten, milk, peanut, sesame, soy, tree_nut`.

At the headline Annex II category level, those tokens cover **9 of 14 categories (64.2857%)**.

Five headline categories do not have an app allergen token:

1. celery;
2. mustard;
3. sulphur dioxide and sulphites;
4. lupin;
5. molluscs.

This is an ontology/vocabulary coverage audit, not a safety certification.

## Material existing-ontology gap

`celery` already exists as a canonical ingredient in `src/data/ingredients.js`, but its allergen array is empty.

That makes celery the clearest future behavior candidate because the underlying ingredient identity already exists while the EU Annex II category is absent from the app allergen vocabulary.

No change is made here. Adding a celery allergen token would alter hard-filter behavior and therefore requires a separately gated behavior contract.

## Important semantic caveats

- `gluten` is the app's aggregate token for the Annex II cereals-containing-gluten category; individual cereal identity and exceptions are not modeled by this audit.
- `tree_nut` is an aggregate app token for the Annex II nuts category. The canonical ingredient ontology contains only a subset of the named nut species, so category-token presence is not the same as complete species coverage.
- sulphur dioxide / sulphites have a concentration threshold in Annex II; a simple boolean ingredient tag would be insufficient without quantity/concentration semantics.
- absence of mustard, lupin or mollusc canonical ingredients does not justify inventing mappings or tagging unrelated foods.

## Boundary

This audit performs:

- 0 D1 reads/writes;
- 0 protected recipe-body access;
- 0 ingredient-ontology mutation;
- 0 profile-vocabulary mutation;
- 0 recipe-allergen metadata mutation;
- 0 recommendation/ranking change;
- 0 Barbecue mutation.

## Successor

The next permitted action is **`EU_ALLERGEN_BEHAVIOR_P0_DESIGN_CONTRACT` — design only**.

Design may specify exact evidence authority, migration behavior, UI/profile compatibility, test matrix and fail-closed handling for the missing categories. It may not activate any new allergen behavior without the separate behavior gate.

## Validation closeout

Validate public V0 **#1109 / 36130093953** completed **SUCCESS**, including deterministic tests and Chromium browser acceptance. This closeout grants no runtime behavior authority.
