# Nutrition B47 — reviewed tempeh composition

## Decision

**ADMIT_BOUNDED_COMPOSITION.**

B47 admits one exact canonical `tempeh` composition record from the official Norwegian Food Composition Table 2026.

- Food ID: `06.685`
- Food name: **Tempeh soy bean product**
- FoodEx2: **Fermented soyabean-based meat imitates (A16RC)**
- Published energy: **209 kcal / 100 g**
- Protein: **20.3 g / 100 g**
- Available carbohydrate: **5.5 g / 100 g**
- Fat: **10.8 g / 100 g**
- Dietary fibre: **4.0 g / 100 g**

The source food is explicitly tempeh and directly matches the generic canonical identity, so form-match confidence is **high**.

## Authored scope

The authored corpus contains exactly one canonical `tempeh` use:

- `indian_tempeh_coconut_curry` — **280 g**, with no narrower preparation/form qualifier.

The gram-denominated ingredient requires no household conversion. B47 clears only the tempeh composition blocker. The recipe remains estimate-preserved because independent `coconut_milk` evidence remains unresolved.

## Boundaries

B47 is composition-only. It does not authorize tofu, textured soy protein, smoked or cooked tempeh, another fermented-soy identity, a household portion or a cooked-yield conversion.

The available-carbohydrate field remains under the existing Matvaretabellen carbohydrate semantic and is not collapsed into USDA carbohydrate-by-difference.

## Expected cumulative audit

After B47:

- authored recipes: **76**
- authoritative recipes: **19 / 76**
- estimate-preserved recipes: **57 / 76**
- `missing_density`: **61**
- `unsupported_quantity_unit`: **6**
- `ambiguous_portion_unit`: **20**
- fibre field gaps: **7**
- mixed incompatible carbohydrate-semantic events: **16**

The cumulative audit and CI remain authoritative for the measured result.
