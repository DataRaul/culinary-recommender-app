# Nutrition B36 — reviewed peanut-butter composition

## Decision

**ADMIT_BOUNDED_NARROWER_FORM_COMPOSITION.**

B36 continues the missing-density lane after B35. Higher-count unresolved candidates remain blocked by food-form identity: `tofu_firm` lacks explicit firm evidence, generic `lentils` mixes preparation states, `turkey_mince` lacks an exact admissible raw-ground record, and `edamame` remains frozen/state-specific. The reviewed peanut-butter source is narrower than the canonical identity but is explicitly Peanut butter / FoodEx2 Peanut butter, so its narrower qualifiers are preserved at medium confidence rather than generalized away.

## Reviewed source

Norwegian Food Composition Table 2026, Food ID `06.559`, **Peanut butter**, scientific identity **Arachis hypogaea L.**, FoodEx2 **Peanut butter (A01BN)**.

LanguaL further describes the source as skin-removed peanut seed product, semisolid with smooth consistency, fully heat-treated, with fat/oil added. Those qualifiers remain part of the B36 evidence identity.

B36 composition per 100 g:

- energy: **621 kcal** (2570 kJ)
- protein: **22.8 g**, source `450c`
- available carbohydrate: **13.1 g**, source `MI0181`
- fat: **51.8 g**, source `450c`
- dietary fibre: **5.0 g**, source `450c`

## Runtime boundary

B36 is a standalone post-B25 composition tranche in `nutrition-source-policy-runtime.js`; `peanut_butter` must remain disjoint from the frozen baseline and earlier standalone runtime tranches.

The source's smooth/oil-added qualifiers are not erased. B36 is therefore medium-confidence canonical composition evidence, not a claim that crunchy, no-added-oil, powdered peanut products, peanuts, peanut sauce or other nut butters share the same composition.

Available carbohydrate remains Matvaretabellen available carbohydrate and retains the existing semantic firewall against USDA carbohydrate-by-difference.

No tablespoon mass, teaspoon mass, household-unit arithmetic, edible-yield conversion, cooked-yield conversion, runtime fetch authority, public corpus authority, billing authority, or Knowledge Core write is introduced.

## Expected corpus effect

Two authored recipes use canonical `peanut_butter`, each as `2 tbsp`. B36 should move exactly two blocker events from `missing_density` to `unsupported_quantity_unit` while leaving both recipes estimate-preserved.

Expected authored cumulative state after B36:

- authoritative recipes: **17**
- estimate-preserved recipes: **59**
- `ambiguous_portion_unit`: **20**
- `missing_density`: **69**
- `unsupported_quantity_unit`: **16**
- tracked nutrient gaps: **fibreG 7** only
- mixed incompatible carbohydrate semantics: **16**
