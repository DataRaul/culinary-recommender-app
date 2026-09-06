# Nutrition B25 — reviewed uncooked barley composition

## Scope

B25 adds one bounded static composition record for canonical `barley` from the official Norwegian Food Composition Table 2026. It is a composition-only unlock tranche: no household portion, edible-part conversion, cooked-yield factor, source-runtime fetch or neighboring-grain inference is introduced.

## Reviewed identity

- Canonical ingredient: `barley`
- Official food: **Barley, uncooked**
- Food ID: `05.001`
- Scientific name: *Hordeum vulgare L.*
- FoodEx2: **Barley grain, pearled (A002K)**
- Repository form match: authored uses are direct gram quantities of barley before a subsequent cook/simmer step.
- Match confidence: **medium**, because canonical `barley` does not encode the source's narrower pearled FoodEx2 qualifier.

The distinct Matvaretabellen cooked record is not used. B25 therefore does not introduce cooked-barley composition or infer a dry-to-cooked yield conversion.

## Bundled per-100 g values

| Nutrient | Value | Source code |
| --- | ---: | --- |
| Energy | 327 kcal | published energy (1,384 kJ / 327 kcal) |
| Protein | 8.6 g | `305` |
| Available carbohydrate | 65.4 g | `MI0181` |
| Fat | 1.1 g | `305` |
| Dietary fibre | 11.0 g | `400e` |

Carbohydrate remains Matvaretabellen available carbohydrate and stays semantically distinct from USDA carbohydrate-by-difference. The existing fail-closed mixed-carbohydrate firewall is unchanged.

## Authored impact contract

The current authored corpus contains three direct-mass barley uses:

- `med_lentil_mushroom_barley` — 130 g
- `med_pumpkin_white_bean_barley_stew` — 120 g
- `med_salmon_barley_spinach` — 140 g

B25 is expected to remove exactly those three `missing_density` events. Independent blockers, nutrient-field gaps and carbohydrate-semantic issues remain fail-closed and are not waived by this tranche.

## Source and licence

Source: Norwegian Food Composition Table 2026, Norwegian Food Safety Authority (Mattilsynet), https://www.matvaretabellen.no/en/barley-uncooked/ . Reuse remains subject to NLOD 2.0 and the repository attribution in `THIRD_PARTY_NOTICES.md`.
