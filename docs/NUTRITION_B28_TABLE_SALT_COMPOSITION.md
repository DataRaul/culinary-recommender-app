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

## Authored impact contract

The current authored corpus has one recipe whose last unresolved ingredient-density key is `salt`:

- `spanish_potato_onion_tortilla`

Its salt quantity is already handled by the existing quantity-evidence runtime; B28 adds composition only and grants no new teaspoon conversion. The measured post-B28 audit is expected to move the authored recipe from estimate-preserved to authoritative while reducing `missing_density` by one.

Expected cumulative authored audit after B28:

- authoritative recipes: **18 / 76**
- estimate-preserved recipes: **58 / 76**
- missing-density blockers: **79 → 78**
- unsupported quantity blockers: **7**
- ambiguous portion blockers: **20**
- mixed incompatible carbohydrate-semantic events: **16**

## Source and licence

Source: Norwegian Food Composition Table 2026, Norwegian Food Safety Authority (Mattilsynet), https://www.matvaretabellen.no/en/salt-table/ . Reuse remains subject to NLOD 2.0 and the repository attribution in `THIRD_PARTY_NOTICES.md`.
