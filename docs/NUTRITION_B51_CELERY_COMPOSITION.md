# Nutrition B51 — Exact raw celery-stalk composition

## Decision

B51 admits one bounded standalone composition record for canonical `celery` from the Norwegian Food Composition Table 2026.

- Official food ID: `06.280`
- Food name: **Celery stalk or stem, raw**
- Scientific name: *Apium graveolens var. dulce (Mill.) Pers.*
- FoodEx2: `Celeries (A00RY)`
- Match confidence: **high**
- Runtime fetch: **none**

The sole authored use is `med_pumpkin_white_bean_barley_stew`: `1 piece` canonical celery, `diced`, before the recipe instructs the cook to soften onion and celery. The source's raw stalk/stem identity therefore matches the composition state, but B51 does **not** resolve the authored piece quantity.

## Reviewed composition

Per 100 g edible food:

| Nutrient | Value | Source evidence |
| --- | ---: | --- |
| Energy | 14 kcal | Published 57 kJ / 14 kcal |
| Protein | 1.0 g | source `237` |
| Available carbohydrate | 1.3 g | source `MI0181` |
| Fat | 0.0 g | source `237` |
| Dietary fibre | 2.0 g | source `237` |

Source `237` is Norwegian Food Safety Authority nutrient analysis 2025 vegetables. Available carbohydrate keeps the existing Matvaretabellen semantic `AVAILABLE_CARBOHYDRATE_MATVARETABELLEN_CHO`; it is not treated as USDA carbohydrate by difference.

## Quantity and yield firewall

The source publishes an edible-part figure of **76%**. B51 preserves that number only as source metadata. It is not a grams-per-piece measure and therefore cannot convert the authored `1 piece` quantity into grams.

B51 authorizes no:

- piece or stalk mass,
- household-unit conversion,
- edible-yield conversion,
- cooked-yield conversion,
- celeriac/celery-root value,
- celery-seed or celery-leaf value,
- cooked or frozen celery composition.

After B51, the authored celery blocker moves from `missing_density` to `unsupported_quantity_unit`; the independent thyme density blocker in the same recipe remains unresolved. Recipe authority therefore remains fail-closed.

## Measured cumulative expectation

B51 should preserve the 76-recipe authored corpus at 19 authoritative / 57 estimate recipes while changing only the blocker classification created by this exact composition evidence:

- `missing_density`: 54 → **53**
- `unsupported_quantity_unit`: 6 → **7**
- `ambiguous_portion_unit`: **20** unchanged
- fibre gaps: **7** unchanged
- mixed incompatible carbohydrate-semantic events: **16** unchanged

These values are frozen only by the evolving cumulative nutrition audit; B51's own tests remain tranche-local.

## Source and licence

- Source: Norwegian Food Composition Table 2026
- Authority: Norwegian Food Safety Authority (Mattilsynet)
- Source page: https://www.matvaretabellen.no/en/celery-stalk-or-stem-raw/
- Licence: Norwegian Licence for Open Government Data (NLOD) 2.0
- Required attribution: Norwegian Food Composition Table 2026. The Norwegian Food Safety Authority. www.matvaretabellen.no
