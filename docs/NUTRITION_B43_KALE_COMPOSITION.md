# Nutrition B43 — exact raw-kale composition

## Decision

**ADMIT_BOUNDED_EXACT_COMPOSITION_EVIDENCE.**

The B43 residual diagnostic ranked the remaining authored blockers and tested recipe-unlock leverage before choosing another evidence tranche. The two apparent single-blocker recipe unlocks remain held: `sardines` is authored as drained but without a packing medium, while `chicken_thigh` is authored as bite-size but without an explicit skin state. Neither ambiguity is resolved by assumption.

B43 therefore selects the next clean reviewed candidate instead of weakening those gates: canonical `kale` has one authored use and Matvaretabellen 2026 publishes an exact raw-kale record matching the repository's pre-cooking state.

## Reviewed source

- authority: Norwegian Food Safety Authority (Mattilsynet)
- dataset: Norwegian Food Composition Table 2026
- food ID: `06.035`
- food: **Kale, raw**
- scientific name: `Brassica oleracea L. convar. acephala (DC.) Alef. var. sabellica L.`
- FoodEx2: **Curly kales (A00GM)**
- process facet: raw, no heat treatment
- source page: https://www.matvaretabellen.no/en/kale-raw/
- licence: NLOD 2.0

Tracked composition per 100 g:

| Field | Value | Source evidence |
| --- | ---: | --- |
| energy | 36 kcal | published 150 kJ / 36 kcal |
| protein | 3.3 g | `400c` |
| available carbohydrate | 2.2 g | `MI0181` |
| fat | 0.7 g | `400c` |
| fibre | 4.0 g | `400c` |

The carbohydrate value remains Matvaretabellen available carbohydrate and therefore remains behind the existing carbohydrate-semantic firewall.

## Repository-native form check

The authored corpus contains exactly one canonical `kale` use:

- `med_white_bean_kale_stew` — **150 g**, preparation **chopped**.

Its instructions add the kale only after the tomato/bean base has simmered: the gram-denominated ingredient is therefore a raw input and is cooked afterward. B43 does not authorize frozen kale, steamed/cooked kale, the source's edible-part percentage, or any portion/yield conversion.

## Expected bounded effect

B42 cumulative authored state contained 66 missing-density blockers. B43 clears the single `kale` density blocker, so the measured expectation is **65**. It does not make `med_white_bean_kale_stew` authoritative because independent `smoked_paprika` and carbohydrate-semantic gates remain.

Expected cumulative authored state after B43:

- authoritative recipes: **19 / 76**
- estimate-preserved recipes: **57 / 76**
- `missing_density`: **65**
- `unsupported_quantity_unit`: **6**
- `ambiguous_portion_unit`: **20**
- fibre field gaps: **7**
- mixed incompatible carbohydrate-semantic events: **16**

These counts are validated by the cumulative audit rather than treated as source authority.
