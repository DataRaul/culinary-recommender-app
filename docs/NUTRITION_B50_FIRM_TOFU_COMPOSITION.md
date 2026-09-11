# Nutrition Evidence B50 — exact firm-tofu composition

## Decision

**ADMIT_EXACT_AFCD_FIRM_TOFU_COMPOSITION.**

B50 adds one bounded static composition record for canonical `tofu_firm` from the Australian Food Composition Database (AFCD), Release 3, published by Food Standards Australia New Zealand (FSANZ).

The earlier tofu hold remains historically correct: previously reviewed candidate records were coagulant-specific and did not establish that a single composition record could safely stand for the repository's broader canonical firm-tofu identity. AFCD Release 3 resolves that mismatch directly. Public Food Key `F009176` is explicitly **Tofu (soy bean curd), firm, as purchased**, and its description covers commercially prepared firm tofu set with glucono-delta lactone and nigari (magnesium chloride) or calcium salts rather than binding the identity to one coagulant.

## Exact source identity

- Authority: Food Standards Australia New Zealand (FSANZ)
- Dataset: Australian Food Composition Database, Release 3
- Public Food Key: `F009176`
- Food: **Tofu (soy bean curd), firm, as purchased**
- Food group: Meat substitutes
- Derivation: Analysed
- AFCD food-group listing: https://www.foodstandards.gov.au/science-data/food-nutrient-databases/afcd/search/food-groups/15/67
- AFCD nutrient definitions: https://www.foodstandards.gov.au/science-data/food-nutrient-databases/afcd/search/nutrients
- FSANZ data licence: https://www.foodstandards.gov.au/science-data/monitoringnutrients/afcd/datauserlicenceagreement

The primary FSANZ pages establish the dataset, exact food identity, nutrient definitions and reuse terms. The current FSANZ food-detail interface is JavaScript-rendered; the reviewed numeric row was independently cross-checked against a Release 3 mirror that identifies the same public food key and attributes the row to AFCD Release 3 / FSANZ.

## Tracked composition per 100 g

| Project field | B50 value | AFCD basis |
| --- | ---: | --- |
| Energy | 129.3 kcal | AFCD publishes 543 kJ with dietary fibre. AFCD states 1 kcal is approximately 4.2 kJ; B50 therefore stores `543 / 4.2 = 129.2857...`, rounded to 129.3 kcal. |
| Protein | 12.8 g | Published AFCD protein |
| Available carbohydrate | 0 g | Published AFCD available carbohydrate without sugar alcohols |
| Fat | 8.3 g | Published AFCD total fat |
| Dietary fibre | 1.0 g | Published AFCD dietary fibre |

The energy unit conversion is deterministic and explicit provenance, not a food-form, recipe-state or yield inference. B50 preserves AFCD carbohydrate as `AVAILABLE_CARBOHYDRATE_AFCD_WITHOUT_SUGAR_ALCOHOLS`; it is treated as an available-carbohydrate semantic and therefore remains incompatible with USDA total carbohydrate-by-difference under the existing firewall.

## Repository match

Canonical ontology already names `tofu_firm` as **firm tofu**. There are exactly six authored uses, all direct gram quantities and all prepared as `cubed` before authored cooking steps:

- `east_asian_tofu_edamame_rice` — 300 g
- `east_asian_tofu_miso_broccoli_rice` — 300 g
- `se_asian_mango_tofu_rice_noodle_salad` — 280 g
- `se_asian_peanut_tofu_noodles` — 280 g
- `se_asian_pineapple_tofu_jasmine_rice` — 300 g
- `se_asian_tofu_mango_rice_bowl` — 300 g

This makes the source's **firm, as purchased** state compatible with the authored inputs. B50 does not authorize silken or soft tofu, smoked/flavoured tofu, cooked tofu, tofu skin, tempeh, another soy product, household-unit conversion, edible-yield conversion or cooked-yield conversion.

## Licensing boundary

AFCD food-composition publications are distributed under the FSANZ Data User Licence Agreement, based on Creative Commons Attribution-ShareAlike 3.0 Australia. The B50 AFCD-derived data record and its derived kcal conversion remain subject to those terms. The surrounding repository is a collection and is not relicensed merely by including this bounded work. Required attribution, licence URI, modification notice and the Australian-data limitation statement are recorded in `THIRD_PARTY_NOTICES.md`.

## Expected measured effect

Before B50 the authored cumulative audit is 76 recipes, 19 authoritative, 57 estimate-preserved, with 60 `missing_density`, 6 `unsupported_quantity_unit`, 20 `ambiguous_portion_unit`, 7 fibre gaps and 16 mixed-incompatible-carbohydrate-semantic events.

B50 is expected to clear exactly the six `tofu_firm` density blockers, yielding 54 `missing_density` blockers while leaving the other cumulative counts unchanged. Each affected tofu recipe still has independent evidence gaps, so no authority promotion is expected. CI/audit measurement is authoritative; these expectations must be corrected rather than gates weakened if the measured state differs.
