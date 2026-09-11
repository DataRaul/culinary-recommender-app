# Nutrition B41 — reviewed sesame-oil teaspoon evidence

## Decision

**ADMIT_BOUNDED_DIRECT_PORTION_EVIDENCE.**

B41 resolves a long-standing B6 deferred quantity target with a directly published teaspoon measure. The original B6 Matvaretabellen source exposed tablespoon/decilitre values only, so B6 correctly refused to manufacture a teaspoon by arithmetic. B41 adds an independent source that publishes the required unit directly.

## Authoritative source

U.S. Department of Agriculture, Agricultural Research Service, **USDA National Nutrient Database for Standard Reference, Release 28**, Food Group 04 Fats and Oils.

Reviewed food:

- NDB number: **04058**
- description: **Oil, sesame, salad or cooking**
- Measure 1: **13.6 g = 1 tablespoon**
- Measure 2: **218 g = 1 cup**
- Measure 3: **4.5 g = 1 tsp**

Official report:
https://www.ars.usda.gov/SP2UserFiles/Place/80400525/Data/SR/SR28/reports/sr28fg04.pdf

Official SR11–SR28 archive/version page:
https://www.ars.usda.gov/northeast-area/beltsville-md-bhnrc/beltsville-human-nutrition-research-center/methods-and-application-of-food-composition-laboratory/mafcl-site-pages/sr11-sr28/

## Identity and unit boundary

Canonical `sesame_oil` is generic sesame oil. The USDA source is explicitly sesame oil qualified for salad or cooking. B41 preserves that narrower qualifier at **medium confidence** rather than claiming every toasted, specialty or otherwise differentiated sesame-oil formulation is identical.

B41 authorizes only:

- canonical ingredient: `sesame_oil`
- authored unit: `tsp`
- reviewed conversion: **4.5 g/tsp**

Although SR28 also publishes tablespoon and cup measures, B41 does not admit them because the authored corpus does not require them. It does not authorize another oil, sesame seeds, tahini, toasted-sesame-oil-specific identity, or generic volume arithmetic.

## Composition separation

B41 is quantity-only. Existing reviewed Ciqual sesame-oil composition remains independently selected under the European-primary policy. No SR28 nutrient composition is imported.

## Authored scope

Fresh reconciliation of the full authored corpus found exactly five canonical `sesame_oil` uses, each `1 tsp`:

- `east_asian_tofu_edamame_rice`
- `east_asian_salmon_cabbage_rice`
- `east_asian_miso_salmon_rice`
- `east_asian_egg_pea_fried_rice`
- `east_asian_chicken_broccoli_noodles`

B41 resolves each to **4.5 g**. Independent blockers remain independent; resolving sesame oil does not imply rice-vinegar quantity evidence or repair unrelated missing-density/form states.

The integrated runtime shows that `east_asian_egg_pea_fried_rice` becomes authoritative once the sesame-oil quantity blocker is removed because its European-primary calculation is then complete and carbohydrate-semantically compatible. B41 does not alter or relax carbohydrate semantics. The corpus-wide mixed-incompatible-carbohydrate event count remains unchanged at 16 and continues to represent other fail-closed recipe states.

The corrected cumulative expectation is 19 authoritative recipes, 57 estimate-preserved recipes, 66 missing-density blockers, 8 unsupported-quantity blockers, 20 ambiguous-portion blockers, seven fibre gaps and 16 mixed-carbohydrate-semantic events. The cumulative audit test remains the authority for the integrated state.
