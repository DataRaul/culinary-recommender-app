# Nutrition B31 — reviewed ricotta composition

## Scope

B31 adds one bounded static composition record for canonical `ricotta` from the official Norwegian Food Composition Table 2026. It is composition-only: no household portion, edible-part conversion, cooked-yield factor, runtime source fetch or neighboring-cheese inference is introduced.

## Reviewed identity

- Canonical ingredient: `ricotta`
- Official food: **Cheese, Ricotta**
- Food ID: `01.266`
- FoodEx2: **Ricotta (A02QL)**
- LanguaL/source form: uncured semisolid cheese; cow; whey; lactic-acid fermented; preserved by chilling; no packing medium.
- Match confidence: **medium** because the source row preserves a narrower cow-whey qualifier while the project canonical ingredient is generic ricotta.

The explicit Ricotta / FoodEx2 identity is strong enough for a bounded generic-ricotta mapping while the narrower source qualifier remains visible in provenance. B31 does not claim that sheep-, goat- or mixed-milk ricotta has identical composition, and it does not authorize cottage cheese, mascarpone, mozzarella, paneer, cream cheese or another fresh-cheese identity.

## Bundled per-100 g values

| Nutrient | Value | Source code |
| --- | ---: | --- |
| Energy | 125 kcal | published energy (519 kJ / 125 kcal) |
| Protein | 7.5 g | `460h` |
| Available carbohydrate | 0.8 g | `MI0181` |
| Fat | 10.2 g | `460h` |
| Dietary fibre | 0.0 g | `460h` |

Carbohydrate remains Matvaretabellen available carbohydrate and stays semantically distinct from USDA carbohydrate-by-difference. The existing fail-closed mixed-carbohydrate firewall is unchanged.

## Authored impact contract

The current authored corpus has one direct-mass ricotta use:

- `italian_ricotta_spinach_pasta` — 180 g ricotta

B31 removes that ingredient's `missing_density` blocker but does not make the recipe authoritative because its independent `black_pepper` blocker remains.

Expected cumulative authored audit after B31:

- authoritative recipes: **17 / 76**
- estimate-preserved recipes: **59 / 76**
- missing-density blockers: **77 → 76**
- unsupported quantity blockers: **9**
- ambiguous portion blockers: **20**
- missing tracked fields: carbohydrate **5**, energy **5**, fat **7**, fibre **7**
- mixed incompatible carbohydrate-semantic events: **16**

## Source and licence

Source: Norwegian Food Composition Table 2026, Norwegian Food Safety Authority (Mattilsynet), https://www.matvaretabellen.no/en/cheese-ricotta/ . Reuse remains subject to NLOD 2.0 and the repository attribution in `THIRD_PARTY_NOTICES.md`.
