# Nutrition B28 — reviewed table-salt composition

## Scope

B28 adds one bounded static composition record for canonical `salt` from the official Norwegian Food Composition Table 2026. It is composition-only: no household portion, edible-part conversion, cooked-yield factor, runtime source fetch or neighboring-seasoning inference is introduced.

## Reviewed identity

- Canonical ingredient: `salt`
- Official food: **Salt, table**
- Food ID: `12.022`
- FoodEx2: **Salt (A042P)**
- LanguaL/source form: sodium chloride; finely ground; not heat-treated; water removed; dehydrated/dried.
- Match confidence: **medium** because the canonical ingredient is generic culinary salt while the official source is the narrower table-salt identity.

The narrower source qualifier is preserved. B28 does not claim that this record describes mineral salt, herbal salt, iodized salt, sea salt or another seasoning identity.

## Bundled per-100 g values

| Nutrient | Value | Source code |
| --- | ---: | --- |
| Energy | 0 kcal | published energy (0 kJ / 0 kcal) |
| Protein | 0.0 g | `400c` |
| Available carbohydrate | 0.0 g | `MI0181` |
| Fat | 0.0 g | `50` |
| Dietary fibre | 0.0 g | `50` |

The source explicitly publishes the zero macronutrient composition. Fat and fibre use the source's logical-zero code rather than a project-authored assumption.

Carbohydrate remains Matvaretabellen available carbohydrate and stays semantically distinct from USDA carbohydrate-by-difference. The existing fail-closed mixed-carbohydrate firewall is unchanged.

## Measured authored impact

The current authored corpus has one recipe whose unresolved `salt` state is exposed by this tranche:

- `spanish_potato_onion_tortilla` — 0.5 tsp salt

Before B28 the calculator reports that ingredient as `missing_density`, because composition is checked before quantity support. B28 supplies the reviewed composition, after which the same use truthfully becomes `unsupported_quantity_unit`: the tranche does not invent a teaspoon weight. The recipe therefore remains estimate-preserved pending separate reviewed portion evidence.

Measured cumulative authored audit after B28:

- authoritative recipes: **17 / 76**
- estimate-preserved recipes: **59 / 76**
- missing-density blockers: **79 → 78**
- unsupported quantity blockers: **7 → 8**
- ambiguous portion blockers: **20**
- mixed incompatible carbohydrate-semantic events: **16**

This is a blocker-class refinement rather than a recipe unlock. It narrows the remaining evidence requirement to exact salt teaspoon quantity evidence without weakening any fail-closed control.

## Source and licence

Source: Norwegian Food Composition Table 2026, Norwegian Food Safety Authority (Mattilsynet), https://www.matvaretabellen.no/en/salt-table/ . Reuse remains subject to NLOD 2.0 and the repository attribution in `THIRD_PARTY_NOTICES.md`.
