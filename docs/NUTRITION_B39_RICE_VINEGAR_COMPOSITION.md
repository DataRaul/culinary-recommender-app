# Nutrition B39 — exact MEXT rice-vinegar composition

## Decision

**ADMIT_EXACT_COMPOSITION_ONLY.**

B39 adds one tightly bounded provider extension for canonical `rice_vinegar`. It does not change the frozen historical nutrition policy and does not infer any household-unit conversion.

## Authoritative source

Japan's Ministry of Education, Culture, Sports, Science and Technology (MEXT), **Standard Tables of Food Composition in Japan (Eighth Revised Edition), Supplement 2023**, food number **17016**:

- Japanese identity: `米酢`
- English identity: `SEASONINGS AND SPICES/Vinegar/rice vinegar`
- energy: **46 kcal / 100 g**
- protein: **0.2 g / 100 g**
- available carbohydrate by difference: **7.4 g / 100 g**
- lipid: **0 g / 100 g**
- total dietary fibre: **(0) g / 100 g**

Source record: https://fooddb.mext.go.jp/details/details.pl?ITEM_NO=17_17016_7

MEXT's food-composition programme states that its food-composition data may be freely used and asks secondary users, including applications, to identify the source:
https://www.mext.go.jp/a_menu/syokuhinseibun/index.htm

## Carbohydrate semantic firewall

MEXT explicitly distinguishes `Carbohydrate, available, calculated by difference` from generic total carbohydrate-by-difference. Its 2023 carbohydrate documentation maps that concept to the FAO/INFOODS family `CHOAVLDF`, while noting its own implementation identifier `CHOAVLDF-`.

B39 therefore records the value as:

`AVAILABLE_CARBOHYDRATE_MEXT_CHOAVLDF`

This is treated as an available-carbohydrate semantic for the existing firewall. It may coexist with reviewed Ciqual/Matvaretabellen available-carbohydrate evidence, but remains **incompatible with USDA total carbohydrate-by-difference (`CARBOHYDRATE_BY_DIFFERENCE_USDA_1005`)** in a single authoritative recipe total.

## Runtime architecture

The post-B25 runtime registry remains additive over the frozen baseline. B39 adds a small provider-specific standalone registry alongside the existing Matvaretabellen standalone/completion registries. The existing Matvaretabellen counters and source semantics are preserved; B39 receives its own `mextSelectedCount` and `mextB39SelectedCount` accounting.

The no-overlap invariant now applies across both the existing standalone Matvaretabellen registry and provider-specific standalone registry, preventing B39 from silently replacing a previously reviewed canonical density.

## Identity and quantity boundaries

The source identity is an exact match for the repository's generic `rice_vinegar` identity. B39 does **not** broaden it to:

- generic `vinegar`;
- balsamic, grain or wine vinegar;
- seasoned/sweetened rice vinegar;
- black rice vinegar;
- rice wine;
- another fermented condiment.

The source is composition per 100 g. It provides no reviewed repository-compatible tablespoon mass. All three authored rice-vinegar uses remain `1 tbsp` and therefore move from `missing_density` to `unsupported_quantity_unit`; no spoon density is manufactured.

## Expected cumulative effect

After B38 the authored audit was 69 missing-density, 11 unsupported-quantity and 20 ambiguous-portion blockers. B39 is expected to move exactly three rice-vinegar uses across blocker classes without changing recipe authority:

- authored recipes: **76**
- authoritative recipes: **17**
- estimate-preserved recipes: **59**
- `missing_density`: **66**
- `unsupported_quantity_unit`: **14**
- `ambiguous_portion_unit`: **20**
- tracked nutrient gaps: **fibreG 7** only
- mixed incompatible carbohydrate semantics: **16**

The next rice-vinegar unlock requires independently reviewed household-unit evidence; B39 composition does not earn that authority.
