# Nutrition B27 — reviewed uncooked jasmine-rice composition

## Scope

B27 adds one bounded static composition record for canonical `jasmine_rice` from the official Norwegian Food Composition Table 2026. It is composition-only: no household portion, edible-part conversion, cooked-yield factor, runtime source fetch or neighboring-rice inference is introduced.

## Reviewed identity

- Canonical ingredient: `jasmine_rice`
- Official food: **Rice, Jasmin, uncooked**
- Food ID: `05.306`
- Scientific name: **Oryza sativa L.**
- FoodEx2: **Rice grain, polished (A003D)**
- LanguaL/source form: rice; seed with skin and germ removed; not heat-treated; water removed; dehydrated/dried.
- Match confidence: **high**.

All three authored `jasmine_rice` uses are 140 g direct-mass inputs and each recipe cooks the rice only after declaration. The cooked jasmine-rice source is not used and no dry-to-cooked conversion is inferred.

## Bundled per-100 g values

| Nutrient | Value | Source code |
| --- | ---: | --- |
| Energy | 355 kcal | published energy (1,507 kJ / 355 kcal) |
| Protein | 7.5 g | `209` |
| Available carbohydrate | 79.6 g | `MI0181` |
| Fat | 0.7 g | `209` |
| Dietary fibre | 0.0 g | `60a` |

The source classifies the fibre value as an estimated zero below the limit of quantification. It remains source-published evidence, not a hardcoded assumed zero.

Carbohydrate remains Matvaretabellen available carbohydrate and stays semantically distinct from USDA carbohydrate-by-difference. The existing fail-closed mixed-carbohydrate firewall is unchanged.

## Authored impact contract

The current authored corpus contains three direct-mass jasmine-rice uses:

- `se_asian_tofu_mango_rice_bowl` — 140 g
- `east_asian_miso_salmon_rice` — 140 g
- `se_asian_pineapple_tofu_jasmine_rice` — 140 g

B27 removes only the corresponding three `jasmine_rice` density blockers. The affected recipes remain estimate-preserved where independent blockers remain unresolved; for example, `se_asian_pineapple_tofu_jasmine_rice` still has `tofu_firm` unresolved.

Expected cumulative authored audit after B27:

- authoritative recipes: **17 / 76**
- estimate-preserved recipes: **59 / 76**
- missing-density blockers: **82 → 79**
- unsupported quantity blockers: **7**
- ambiguous portion blockers: **20**
- mixed incompatible carbohydrate-semantic events: **16**

## Runtime registration

B27 extends `src/domain/nutrition-source-policy-runtime.js`, which now treats post-B25 standalone composition tranches as a small disjoint registry over the frozen B25 baseline. Each runtime tranche must remain non-overlapping with the baseline and with every neighboring runtime tranche while preserving the existing per-nutrient European-primary semantics.

## Source and licence

Source: Norwegian Food Composition Table 2026, Norwegian Food Safety Authority (Mattilsynet), https://www.matvaretabellen.no/en/rice-jasmin-uncooked/ . Reuse remains subject to NLOD 2.0 and the repository attribution in `THIRD_PARTY_NOTICES.md`.
