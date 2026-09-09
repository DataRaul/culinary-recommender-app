# Nutrition B29 — reviewed wheat-tortilla composition

## Scope

B29 adds one bounded static composition record for canonical `tortilla` from the official Norwegian Food Composition Table 2026. It is composition-only: no tortilla-piece weight, household conversion, edible-part conversion, runtime source fetch or neighboring-flatbread inference is introduced.

## Reviewed identity

- Canonical ingredient: `tortilla`
- Canonical ontology: `tortilla wrap`, with `flour tortilla` and `tortilla de trigo` aliases, gluten allergen and wheat family marker
- Official food: **Tortilla, wheat flour**
- Food ID: `05.381`
- FoodEx2: **Tortilla (A006V)**
- FoodEx2 ingredient facet: **Wheat flour (A003X)**
- LanguaL/source form: wheat; thin formed product; fully heat-treated; griddled; vegetable fat/oil added; food-industry prepared.
- Match confidence: **high**.

The separate canonical `corn_tortilla` identity is not covered by B29.

## Bundled per-100 g values

| Nutrient | Value | Source code |
| --- | ---: | --- |
| Energy | 260 kcal | published energy (1,097 kJ / 260 kcal) |
| Protein | 8.5 g | `220a` |
| Available carbohydrate | 44.8 g | `MI0181` |
| Fat | 4.8 g | `220a` |
| Dietary fibre | 2.0 g | `220a` |

`220a` is the Norwegian Food Safety Authority 2013–2014 nutrient analysis of Tex-mex products. Carbohydrate remains Matvaretabellen available carbohydrate and stays semantically distinct from USDA carbohydrate-by-difference.

## Measured authored impact contract

The target authored recipe uses:

- `med_greek_yogurt_chickpea_wrap` — 4 `pieces` of canonical `tortilla`

B29 supplies the missing composition but intentionally does not invent a piece weight. The runtime therefore refines the target from `missing_density` to `unsupported_quantity_unit`, keeping the recipe estimate-preserved pending exact reviewed tortilla-piece quantity evidence.

Expected cumulative authored audit after B29:

- authoritative recipes: **17 / 76**
- estimate-preserved recipes: **59 / 76**
- missing-density blockers: **78 → 77**
- unsupported quantity blockers: **8 → 9**
- ambiguous portion blockers: **20**
- mixed incompatible carbohydrate-semantic events: **16**

## Source and licence

Source: Norwegian Food Composition Table 2026, Norwegian Food Safety Authority (Mattilsynet), https://www.matvaretabellen.no/en/tortilla-wheat-flour/ . Reuse remains subject to NLOD 2.0 and the repository attribution in `THIRD_PARTY_NOTICES.md`.
