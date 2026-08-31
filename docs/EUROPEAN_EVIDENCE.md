# European Nutrition & Food-Standards Evidence — B4

Audit date: 2026-08-31.

## Governing principle

European evidence is not assumed to be inherently more accurate than U.S. evidence. B4 uses a stricter claim:

**preserve each official source's food identity, geography, analytical/derivation method, nutrient definition, confidence/provenance metadata, version and licence; expose disagreements rather than averaging them away.**

Composition evidence and regulatory/food-standard evidence are different evidence classes and remain separate.

## 1. ANSES-Ciqual 2025 — bundled bounded secondary evidence

Authority: French Agency for Food, Environmental and Occupational Health & Safety (ANSES).

Selected release:

- dataset: **Table de composition nutritionnelle des aliments Ciqual 2025**;
- publication date: 2025-11-19;
- dataset DOI: `10.57745/RDMHWY`;
- official food catalogue: 3,484 foods;
- 74 constituents in the published 2025 table;
- licence: **Etalab Open Licence 2.0**;
- required attribution retained in the static source record.

Official XML inputs used by the reproducible B4 extractor:

- food catalogue (`alim`): DOI `10.57745/OH8KXC`;
- constituent catalogue (`const`): DOI `10.57745/FWSPCX`;
- food composition (`compo`): DOI `10.57745/O73GDX`.

The full dataset is not committed. B4 commits only a bounded reviewed static module for 32 app-relevant food/form identities plus reusable extraction/review scripts.

### Ciqual fields retained

B4 preserves:

- Ciqual food code;
- English and French name;
- scientific name where present;
- reviewed form-match confidence/notes;
- values per 100 g;
- constituent definition / INFOODS code;
- per-field confidence code (`A`–`D` where supplied);
- source codes from the composition record.

### Nutrient-definition boundary

Cross-source comparison is deliberately not symmetric:

| App comparison field | USDA Foundation | Ciqual 2025 | B4 treatment |
|---|---|---|---|
| Energy | Atwater-specific preferred (`2048`) | Jones + fibre (`333`), plus EU 1169/2011 (`328`) | method-different; compare cautiously, never merge |
| Protein | nutrient `1003` | protein using Jones factor (`25000`, `PROCNT`) | method-dependent |
| Carbohydrate | `1005`, carbohydrate by difference | `31000`, available carbohydrate (`CHOAVL`) | **not directly comparable**; no percentage agreement/disagreement |
| Fat | `1004` | `40000`, `FAT` | comparable only with food-form/method caveats |
| Fibre | `1079` | `34100`, `FIB-` | method-dependent |

A database-level winner score would erase these distinctions and is therefore prohibited in B4.

### Reviewed B4 coverage

The bounded Ciqual module currently covers 32 canonical app targets after identity/form review. It includes multi-source comparison candidates such as chicken breast, beans, avocado, banana, tuna, nuts/seeds, broccoli, egg, onions, garlic, mushroom, carrot, pineapple, cucumber, rice, cauliflower, aubergine and tomato forms, plus Ciqual-only or previously-unpromoted European evidence such as farmed raw salmon, semi-skimmed milk, plain Greek-style yogurt, apple, mango, potato and sweet potato.

Ciqual rows are secondary evidence only. They do not alter recipe nutrition selection, recommendation ranking or hard constraints.

## 2. Fineli / THL Finland — strong open candidate, acquisition blocked from CI

Authority: Finnish Institute for Health and Welfare (THL).

Fineli provides machine-readable food-composition data and documents **CC BY 4.0** reuse. It remains a strong candidate for a future additional national lane.

During B4, both the documented API and the official downloadable package returned **HTTP 403** from standard GitHub-hosted runners. The project does not attempt to bypass that access restriction. No Fineli data is bundled.

If future legitimate access becomes available, Fineli should be added as another provenance-preserving source rather than used to overwrite Ciqual/USDA silently.

## 3. Frida / DTU Denmark

Frida is a high-quality national composition source from the Technical University of Denmark (DTU). It exposes unusually useful source/reference metadata and uses harmonisation/classification concepts including FoodEx2/LanguaL.

B4 does not ingest Frida. Exact current redistribution/API terms must be reviewed and retained before a public static derivative is created.

## 4. NEVO / RIVM Netherlands

NEVO is the Dutch national food-composition database maintained by RIVM. It is a strong provenance source, but its current conditions are more restrictive than Ciqual's open-data licence.

No NEVO data is bundled without a separate compatibility decision.

## 5. BEDCA / AESAN Spain

BEDCA is particularly relevant geographically for a Canary Islands → Spain → Mediterranean Europe product. Its public availability does not by itself establish unrestricted redistribution rights for a public static application.

BEDCA remains **not ingested** pending explicit reuse/licensing resolution. Geographic relevance does not override licensing provenance.

## 6. EuroFIR FoodEXplorer

EuroFIR provides valuable cross-national harmonisation/comparison and access to multiple national food-composition datasets, but access can depend on membership/paid services and underlying national licences.

It therefore remains outside the current no-cost/public-data contract.

## 7. EFSA and EU regulatory truth lane

EFSA/EU sources answer different questions from nutrient-composition tables and should not be collapsed into one nutrition source.

### EFSA FoodEx2

FoodEx2 is the EU's hierarchical food description/classification system. It is useful for normalising food identities across national datasets and for future cross-source mapping.

EFSA has also described harmonised European food-composition work mapping data from numerous national databases to FoodEx2, covering tens of thousands of food commodities. That is architecturally valuable for cross-Europe comparison, but it is not treated here as an automatically reusable replacement composition dataset.

### Other EU regulatory sources

Future regulatory evidence can include, where relevant and legally reusable:

- authorised nutrition/health claims;
- allergen rules;
- food additive authorisations/conditions;
- pesticide maximum-residue limits;
- novel-food authorisations;
- nutrient/reference-intake rules;
- contaminant or food-safety limits.

These should become a separate `RegulatoryEvidenceSource`/public-safe distilled artifact rather than being mixed into `NutritionSource` values.

## 8. B4 comparison contract

`nutritionEvidenceComparisonForIngredient()` and `nutritionEvidenceComparisonCoverage()` are evidence/audit utilities only.

They may report:

- source availability;
- exact source food identity;
- form/cultivar caveats;
- per-source values;
- per-field confidence/provenance;
- method/comparability labels;
- relative difference only where semantically meaningful.

They must not:

- average official sources;
- silently select whichever value is preferred;
- infer that a larger/smaller number is more truthful;
- compare Ciqual `CHOAVL` directly with USDA carbohydrate-by-difference;
- turn regulatory limits into composition measurements;
- change recommendations or displayed recipe nutrition without a separately approved source-selection policy.

## 9. Next human gate

After B4 validates and deploys, the next major decision is product policy:

**Should reviewed European evidence be allowed to become the primary composition source for Europe/Canary contexts when food-form and evidence quality are suitable, or should it remain corroboration/audit only?**

That decision affects displayed nutrition provenance and potentially later recommendation policy, so it is intentionally human-gated rather than inferred from geography.
