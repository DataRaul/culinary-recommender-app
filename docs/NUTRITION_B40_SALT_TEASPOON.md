# Nutrition B40 — reviewed table-salt teaspoon evidence

## Decision

**ADMIT_BOUNDED_DIRECT_PORTION_EVIDENCE.**

B40 follows B39 by resolving the remaining exact quantity blocker with a directly published household measure. It does not alter B28 composition authority or infer any unreviewed spoon conversion.

## Authoritative source

U.S. Department of Agriculture, Agricultural Research Service, **USDA National Nutrient Database for Standard Reference, Release 28**, Food Group 02 Spices and Herbs.

Reviewed food:

- NDB number: **02047**
- description: **Salt, table**
- common measure 1: **6.0 g = 1 tsp**
- additional source measures present but not admitted by this tranche: 18 g = 1 tbsp; 292 g = 1 cup

Official report:
https://www.ars.usda.gov/ARSUserFiles/80400535/Data/SR/SR28/reports/sr28fg02.pdf

Official SR11–SR28 archive and Release 28 citation/version information:
https://www.ars.usda.gov/northeast-area/beltsville-md-bhnrc/beltsville-human-nutrition-research-center/methods-and-application-of-food-composition-laboratory/mafcl-site-pages/sr11-sr28/

## Identity boundary

Canonical repository `salt` remains broader than the source's narrower **table salt** identity. B40 therefore preserves **medium** match confidence, consistent with the existing B28 table-salt composition decision.

B40 authorizes only:

- canonical ingredient: `salt`
- authored unit: `tsp`
- reviewed conversion: **6 g/tsp**

It does not authorize sea salt, mineral salt, herbal salt, smoked salt, named specialty salts, tablespoon/cup conversion, generic spoon arithmetic, or SR28 composition.

## Composition separation

B40 is quantity-only. The composition used for canonical `salt` remains B28 Matvaretabellen Food ID `12.022`, which publishes zero tracked macronutrient values and preserves its own narrower table-salt qualifier.

Composition evidence does not imply portion evidence; B40 portion evidence does not import SR28 nutrient values.

## Corpus effect

The authored corpus contains one direct `salt` use:

- `spanish_potato_onion_tortilla` — **0.5 tsp**

B40 resolves that quantity to **3 g**. B28 had already narrowed the recipe's remaining evidence requirement to the salt teaspoon quantity, so this tranche is expected to earn one additional authoritative recipe without relaxing any semantic firewall.

Expected cumulative authored state after B40:

- authored recipes: **76**
- authoritative recipes: **18**
- estimate-preserved recipes: **58**
- `missing_density`: **66**
- `unsupported_quantity_unit`: **13**
- `ambiguous_portion_unit`: **20**
- tracked nutrient gaps: **fibreG 7** only
- mixed incompatible carbohydrate semantics: **16**

The cumulative audit test remains the authority for the measured integrated state.
