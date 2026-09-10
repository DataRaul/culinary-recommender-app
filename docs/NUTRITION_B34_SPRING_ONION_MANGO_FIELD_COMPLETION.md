# Nutrition B34 — spring-onion and mango tracked-field completion

## Decision

**ADMIT_BOUNDED_EXACT_FIELD_COMPLETIONS.**

B34 closes the remaining currently-used tracked energy/carbohydrate/fat gaps without replacing already-populated reviewed source fields.

## Spring onion

Existing primary record: USDA Foundation `spring_onion`, FDC `2727585`, `Green onion, (scallion), bulb and greens, root removed, raw`. The frozen extract supplies protein and fibre but leaves energy, carbohydrate and fat unpublished.

Exact completion source: Norwegian Food Composition Table 2026, Food ID `06.113`, **Scallion, spring onion, raw**, scientific identity **Allium cepa L.**, FoodEx2 **Spring onions (A00HH)**, raw/no heat treatment.

B34 completion fields only:

- energy: **23 kcal/100 g** (98 kJ)
- available carbohydrate: **2.3 g/100 g**, source `MI0181`
- fat: **0.2 g/100 g**, source `460g`

The same Food ID `06.113` is already independently reviewed in B6 for the `19 g` spring-onion piece conversion. Reusing that exact source identity does not merge the composition and portion authority roles; each remains separately explicit.

## Mango

Existing primary record: Ciqual B4 `13025`, **Mango, flesh without skin, pitted, raw**, scientific identity **Mangifera indica L.** It supplies every tracked field except fat.

Exact completion source: Norwegian Food Composition Table 2026, Food ID `06.542`, **Mango, raw**, scientific identity **Mangifera indica L.**, FoodEx2 **Mangoes (A01LF)**. LanguaL explicitly records peel and pit/seed removed and the food is raw/no heat treatment.

B34 completion field only:

- fat: **0.3 g/100 g**, source `610`

The separate B6 mango piece conversion remains independently governed and is not inferred from this composition evidence.

## Runtime boundary

The post-B25 completion registry admits a B34 field only when the frozen reviewed primary selector returns no value for that exact ingredient/nutrient. B34 therefore cannot displace USDA protein/fibre for spring onion or Ciqual energy/protein/available-carbohydrate/fibre for mango.

Available-carbohydrate semantics remain explicit. The B34 spring-onion carbohydrate field is Matvaretabellen available carbohydrate and continues to participate in the existing incompatibility firewall against USDA carbohydrate-by-difference.

No runtime fetch, new household-unit conversion, edible-yield conversion, cooked-yield conversion, neighboring identity, public corpus authority, billing authority, or Knowledge Core write is introduced.

## Expected corpus effect

The authored corpus has five spring-onion uses with an already-reviewed B6 piece mass and two mango uses with an already-reviewed B6 piece mass. B34 should remove the current five energy gaps, five carbohydrate gaps and seven fat gaps. Remaining tracked-field gaps should be fibre-only; independent density, quantity and carbohydrate-semantic blockers remain fail-closed.
