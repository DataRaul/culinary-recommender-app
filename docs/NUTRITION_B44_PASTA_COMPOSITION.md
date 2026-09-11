# Nutrition B44 — exact plain dried-pasta composition

## Decision

**ADMIT_BOUNDED_EXACT_COMPOSITION_EVIDENCE.**

B44 continues the residual-density lane after B43. Higher-count candidates remain held where the authored state is not exact enough: generic noodles do not identify a wheat/noodle form, sweetcorn does not identify fresh/frozen/canned state, beef mince lacks a fat-level qualifier, and corn-tortilla piece uses do not identify size. B44 therefore takes the next exact gram-denominated candidate rather than weakening those gates.

## Reviewed source

- authority: Norwegian Food Safety Authority (Mattilsynet)
- dataset: Norwegian Food Composition Table 2026
- food ID: `05.016`
- food: **Pasta, plain, uncooked**
- FoodEx2: **Dried pasta (A007L)**
- LanguaL ingredient: durum wheat
- process: not heat-treated; water removed / dehydrated or dried
- source page: https://www.matvaretabellen.no/en/pasta-plain-uncooked/
- licence: NLOD 2.0

Tracked composition per 100 g:

| Field | Value | Source evidence |
| --- | ---: | --- |
| energy | 347 kcal | published 1,471 kJ / 347 kcal |
| protein | 11.9 g | `204` |
| available carbohydrate | 69.8 g | `MI0181` |
| fat | 1.3 g | `204` |
| fibre | 4.0 g | `204` |

The carbohydrate value remains Matvaretabellen available carbohydrate and stays behind the existing carbohydrate-semantic firewall.

## Repository-native form check

Canonical `pasta` is a gluten-containing wheat-pasta identity with `spaghetti` and `penne` aliases. The authored corpus contains exactly one canonical `pasta` use:

- `italian_ricotta_spinach_pasta` — **170 g**.

The recipe declares the gram quantity before the instruction to **cook pasta**, so the ingredient state is uncooked. B44 does not authorize fresh pasta, whole-grain pasta, filled pasta, gluten-free pasta, cooked pasta, cooking yield, or household-unit conversion.

## Bounded effect

B43 left 65 authored missing-density blockers. B44 is expected to clear exactly the one canonical `pasta` blocker, taking that count to **64**. The recipe remains estimate-preserved because its independent black-pepper teaspoon quantity gate remains unresolved under B33.

Expected cumulative authored state after B44:

- authoritative recipes: **19 / 76**
- estimate-preserved recipes: **57 / 76**
- `missing_density`: **64**
- `unsupported_quantity_unit`: **6**
- `ambiguous_portion_unit`: **20**
- fibre field gaps: **7**
- mixed incompatible carbohydrate-semantic events: **16**

The cumulative audit, not this expectation, is authoritative for the measured post-tranche state.
