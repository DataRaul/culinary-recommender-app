# Nutrition B26 — reviewed dry rice-noodle composition

## Scope

B26 adds one bounded static composition record for canonical `rice_noodles` from the official Norwegian Food Composition Table 2026. It is composition-only: no household portion, edible-part conversion, cooked-yield factor, runtime source fetch or neighboring-noodle inference is introduced.

## Reviewed identity

- Canonical ingredient: `rice_noodles`
- Official food: **Noodles, rice, uncooked**
- Food ID: `05.331`
- FoodEx2: **Noodle, rice (A008F)**
- LanguaL/source form: rice; water removed; dehydrated/dried; uncooked source identity.
- Match confidence: **high**.

All three authored `rice_noodles` uses are gram-denominated inputs before the recipe subsequently cooks or soaks the noodles. The separate cooked rice-noodle source is not used and no dry-to-cooked conversion is inferred.

## Bundled per-100 g values

| Nutrient | Value | Source code |
| --- | ---: | --- |
| Energy | 361 kcal | published energy (1,532 kJ / 361 kcal) |
| Protein | 6.0 g | `460h` |
| Available carbohydrate | 82.2 g | `MI0181` |
| Fat | 0.6 g | `460h` |
| Dietary fibre | 2.0 g | `460h` |

Carbohydrate remains Matvaretabellen available carbohydrate and stays semantically distinct from USDA carbohydrate-by-difference. The existing fail-closed mixed-carbohydrate firewall is unchanged.

## Authored impact contract

The current authored corpus contains three direct-mass rice-noodle uses:

- `se_asian_lime_chicken_rice_noodles` — 160 g
- `se_asian_mango_tofu_rice_noodle_salad` — 150 g
- `se_asian_peanut_chickpea_noodles` — 160 g

B26 removes only the corresponding `rice_noodles` density blockers. Independent blockers and nutrient-semantic issues remain fail-closed.

## Runtime registration

B26 is the first post-B25 standalone tranche registered through `src/domain/nutrition-source-policy-runtime.js`. That module is additive over the frozen B25 baseline: post-B25 records must be disjoint from the existing density universe and retain the same per-nutrient European-primary semantics. This keeps subsequent evidence-valid tranches small without rewriting the historical policy registry on every unlock.

## Source and licence

Source: Norwegian Food Composition Table 2026, Norwegian Food Safety Authority (Mattilsynet), https://www.matvaretabellen.no/en/noodles-rice-uncooked/ . Reuse remains subject to NLOD 2.0 and the repository attribution in `THIRD_PARTY_NOTICES.md`.
