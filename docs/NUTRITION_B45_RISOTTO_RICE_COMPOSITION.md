# Nutrition B45 — exact Arborio risotto-rice composition

## Decision

**ADMIT_BOUNDED_EXACT_COMPOSITION_EVIDENCE.**

B45 follows B44 by selecting another residual candidate only after exact repository/source-state reconciliation. Canonical `risotto_rice` is explicitly aliased to Arborio rice, the sole authored use is gram-denominated before cooking, and Matvaretabellen publishes an exact uncooked Arborio/risotto-rice record.

## Reviewed source

- authority: Norwegian Food Safety Authority (Mattilsynet)
- dataset: Norwegian Food Composition Table 2026
- food ID: `05.384`
- food: **Rice, arborio, risotto rice, uncooked**
- scientific name: `Oryza sativa L.`
- FoodEx2: **Rice grain (A001D)**
- source page: https://www.matvaretabellen.no/en/rice-arborio-risotto-rice-uncooked/
- licence: NLOD 2.0

Tracked composition per 100 g:

| Field | Value | Source evidence |
| --- | ---: | --- |
| energy | 378 kcal | published 1,604 kJ / 378 kcal |
| protein | 6.4 g | `450c` |
| available carbohydrate | 85.1 g | `MI0181` |
| fat | 1.0 g | `450c` |
| fibre | 1.0 g | `450c` |

The carbohydrate value remains Matvaretabellen available carbohydrate and stays behind the existing semantic firewall.

## Repository-native form check

Canonical `risotto_rice` is named **risotto rice** and explicitly aliases **arborio rice**. The authored corpus contains exactly one use:

- `italian_mushroom_risotto` — **170 g** before incremental liquid cooking.

B45 does not authorize generic rice, jasmine/basmati/sushi rice, a cooked risotto-rice state, cooking yield, or household-unit conversion.

## Bounded effect

B44 left 64 authored missing-density blockers. B45 is expected to clear exactly the single `risotto_rice` blocker, reducing that count to **63**. `italian_mushroom_risotto` remains estimate-preserved because independent butter density and black-pepper teaspoon gates remain.

Expected cumulative authored state after B45:

- authoritative recipes: **19 / 76**
- estimate-preserved recipes: **57 / 76**
- `missing_density`: **63**
- `unsupported_quantity_unit`: **6**
- `ambiguous_portion_unit`: **20**
- fibre field gaps: **7**
- mixed incompatible carbohydrate-semantic events: **16**

The cumulative audit is authoritative for the measured post-tranche result.
