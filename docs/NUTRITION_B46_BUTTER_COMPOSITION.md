# Nutrition B46 — reviewed butter composition

## Decision

**ADMIT_BOUNDED_COMPOSITION.**

B46 admits one exact canonical `butter` composition record from the official Norwegian Food Composition Table 2026.

- Food ID: `08.005`
- Food name: **Butter**
- FoodEx2: **Butter (A039C)**
- Published energy: **744 kcal / 100 g**
- Protein: **1.0 g / 100 g**
- Available carbohydrate: **0.5 g / 100 g**
- Fat: **82.0 g / 100 g**
- Dietary fibre: **0.0 g / 100 g**

The identity is direct. Confidence remains **medium** because the source is a Norwegian prepared-product formulation with source-specific vitamin-D fortification and sodium/salt characteristics; B46 does not generalize those formulation details beyond the reviewed composition record.

## Authored scope

The authored corpus contains exactly one canonical `butter` use:

- `italian_mushroom_risotto` — **15 g**.

The gram-denominated ingredient requires no household conversion. B46 clears only the butter composition blocker. The recipe remains estimate-preserved because its independent generic `black_pepper|tsp` quantity gate remains held.

## Boundaries

B46 is composition-only. It does not authorize margarine, ghee/clarified butter, butter blends, cream or another dairy fat; it also authorizes no household portion, melting/cooking yield or neighboring ingredient identity.

The available-carbohydrate field remains under the existing Matvaretabellen carbohydrate semantic and is not collapsed into USDA carbohydrate-by-difference.

## Expected cumulative audit

After B46:

- authored recipes: **76**
- authoritative recipes: **19 / 76**
- estimate-preserved recipes: **57 / 76**
- `missing_density`: **62**
- `unsupported_quantity_unit`: **6**
- `ambiguous_portion_unit`: **20**
- fibre field gaps: **7**
- mixed incompatible carbohydrate-semantic events: **16**

The cumulative audit and CI remain authoritative for the measured result.
