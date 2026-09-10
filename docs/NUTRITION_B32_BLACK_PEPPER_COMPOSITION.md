# Nutrition B32 — exact black-pepper composition

## Scope

B32 adds one bounded static composition record from the official Norwegian Food Composition Table 2026 for canonical `black_pepper`.

The tranche is composition-only. It does not authorize teaspoon mass, another household-unit conversion, edible yield, cooked yield or runtime source fetching.

## Reviewed identity

- Canonical ingredient: `black_pepper`
- Official food: **Pepper, black**
- Matvaretabellen Food ID: `12.111`
- Scientific name: **Piper nigrum L.**
- FoodEx2: **Black pepper (A019C)**
- Source form: black-pepper fruit used as spice, naturally dried and not heat treated
- Match confidence: **high**

The repository previously listed `white pepper` as an alias of canonical `black_pepper`. That alias is removed in B32 because white pepper is a distinct processed product and exact black-pepper composition evidence must not silently bleed into it. `normalizeIngredient("white pepper")` therefore fails closed after B32.

B32 does not authorize white pepper, green or pink peppercorns, chilli, paprika or another pepper/spice identity.

## Composition

Published values per 100 g:

| Nutrient | Value | Evidence |
| --- | ---: | --- |
| Energy | 277 kcal | published energy, 1159 kJ / 277 kcal |
| Protein | 10.4 g | source code `460e` |
| Available carbohydrate | 38.7 g | source code `MI0181` |
| Fat | 3.3 g | source code `460e` |
| Dietary fibre | 25.0 g | source code `460e` |

The carbohydrate value retains Matvaretabellen available-carbohydrate semantics. The existing firewall against summing this with USDA carbohydrate-by-difference remains unchanged.

## Authored impact contract

The authored corpus contains two black-pepper uses and both are `0.5 tsp` inputs. Before B32 they are blocked as missing composition. Once exact composition is admitted, the two events advance truthfully to the separate quantity blocker because B32 supplies no teaspoon mass.

Expected cumulative authored audit after B32:

- authoritative recipes: **17 / 76**
- estimate-preserved recipes: **59 / 76**
- `missing_density`: **76 → 74**
- `unsupported_quantity_unit`: **9 → 11**
- `ambiguous_portion_unit`: **20**
- missing carbohydrate fields: **5**
- missing energy fields: **5**
- missing fat fields: **7**
- missing fibre fields: **7**
- mixed incompatible carbohydrate-semantic events: **16**

The reclassification is intentional evidence progress, not regression: composition becomes known while teaspoon mass remains explicitly unresolved.

A future teaspoon-evidence tranche, if an exact authoritative source is admitted, must remain a separate portion role rather than being inferred from this composition row.

## Source and licence

Source: Norwegian Food Composition Table 2026, Norwegian Food Safety Authority (Mattilsynet), https://www.matvaretabellen.no/en/pepper-black/ . Reuse remains subject to NLOD 2.0 and the repository attribution in `THIRD_PARTY_NOTICES.md`.
