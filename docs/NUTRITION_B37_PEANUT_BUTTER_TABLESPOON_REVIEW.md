# Nutrition B37 — peanut-butter tablespoon review

## Decision

**ADMIT_BOUNDED_PORTION_CONSENSUS.**

B37 is a portion-only follow-up to B36. B36 admitted bounded European-primary composition for canonical `peanut_butter` but deliberately did not infer a tablespoon mass. B37 independently reviews an official USDA SR28 household-measure source and admits only the tablespoon conversion supported by repeated source rows.

## Authoritative source

U.S. Department of Agriculture, Agricultural Research Service, **USDA National Nutrient Database for Standard Reference, Release 28**, Food Group 16 report:

`https://www.ars.usda.gov/ARSUserFiles/80400535/Data/SR/SR28/reports/sr28fg16.pdf`

The reviewed SR28 rows are:

| NDB | Description | Published household measure |
| --- | --- | --- |
| `16097` | Peanut butter, chunk style, with salt | 32 g = 2 tbsp |
| `16397` | Peanut butter, chunk style, without salt | 32 g = 2 tbsp |
| `16098` | Peanut butter, smooth style, with salt | 32 g = 2 tbsp |
| `16398` | Peanut butter, smooth style, without salt | 32 g = 2 tbsp |

All four reviewed variants therefore support the same **16 g per tablespoon** conversion across the explicit texture and salt-state dimensions represented by SR28.

This differs from B33 black pepper, where reviewed form variants published conflicting teaspoon masses and therefore remained held fail-closed.

## Runtime boundary

B37 is deliberately separate from B36 composition evidence:

- B36 remains the selected European-primary composition source for `peanut_butter`.
- B37 contributes household-portion evidence only.
- SR28 nutrient composition is not imported or mixed into the European-primary nutrient selector.
- only canonical `peanut_butter` + authored unit `tbsp` is admitted;
- no teaspoon, cup, piece or other unit is inferred, even though SR28 also reports a cup measure;
- no conversion is granted to peanuts, tahini, other nut/seed butters, peanut sauce or another neighboring identity;
- no runtime fetch is introduced.

The source consensus is stored explicitly rather than averaging differing values: each reviewed variant independently publishes 32 g for 2 tbsp.

## Expected corpus effect

The authored corpus contains two canonical `peanut_butter` uses and both are exactly `2 tbsp`. After B36 those uses were fail-closed as `unsupported_quantity_unit`; B37 should resolve each to 32 g and remove those two blockers.

Expected authored cumulative state after B37:

- authoritative recipes: **17**
- estimate-preserved recipes: **59**
- `ambiguous_portion_unit`: **20**
- `missing_density`: **69**
- `unsupported_quantity_unit`: **14**
- tracked nutrient gaps: **fibreG 7** only
- mixed incompatible carbohydrate semantics: **16**

Neither peanut-butter recipe is expected to become authoritative solely from B37 because other fail-closed recipe evidence remains unresolved. The cumulative audit is the authority for the exact global counts.
