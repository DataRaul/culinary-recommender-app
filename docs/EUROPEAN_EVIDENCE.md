# European Nutrition & Food-Standards Evidence

Audit/policy date: 2026-08-31.

## Governing principle

European evidence is not assumed to be inherently more accurate than U.S. evidence. The project uses a stricter rule:

**preserve each official source's food identity, geography, analytical/derivation method, nutrient definition, field confidence/provenance, version and licence; prefer the better reviewed match under explicit policy and expose disagreement instead of averaging it away.**

Composition evidence and regulatory/food-standard evidence remain different evidence classes.

## 1. ANSES-Ciqual 2025 — bundled bounded European evidence

Authority: French Agency for Food, Environmental and Occupational Health & Safety (ANSES).

Selected release:
- dataset: **Table de composition nutritionnelle des aliments Ciqual 2025**;
- publication date: 2025-11-19;
- dataset DOI: `10.57745/RDMHWY`;
- official catalogue: 3,484 foods / 74 constituents;
- licence: **Etalab Open Licence 2.0**;
- required ANSES attribution retained in the static source record.

Official XML inputs used by the reproducible B4 extractor:
- food catalogue (`alim`): DOI `10.57745/OH8KXC`;
- constituent catalogue (`const`): DOI `10.57745/FWSPCX`;
- composition (`compo`): DOI `10.57745/O73GDX`.

The full source database is not committed. B4 retains only a bounded reviewed static module for 32 app-relevant food/form identities plus reusable extraction/review scripts.

### Ciqual fields retained

The bounded module preserves:
- Ciqual food code;
- English/French identity;
- scientific name where present;
- reviewed form-match confidence and notes;
- values per 100 g;
- constituent definition / INFOODS code;
- per-field confidence code (`A`–`D` where supplied);
- composition source codes.

## 2. Nutrient-definition firewall

Cross-source comparison and source selection are deliberately not symmetric:

| App field | USDA Foundation | Ciqual 2025 | Policy treatment |
|---|---|---|---|
| Energy | Atwater-specific preferred (`2048`) | Jones + fibre (`333`) and EU 1169/2011 (`328`) | keep method explicit; EU 1169 energy may be selected for European context |
| Protein | nutrient `1003` | Jones-factor protein (`25000`, `PROCNT`) | method-dependent, field provenance retained |
| Carbohydrate | `1005`, carbohydrate by difference | `31000`, available carbohydrate (`CHOAVL`) | **different semantics; never summed together in one authoritative recipe total** |
| Fat | `1004` | `40000`, `FAT` | selectable with food-form/method caveats |
| Fibre | `1079` | `34100`, `FIB-` | method-dependent, source retained |

A database-level winner score is prohibited because it would erase these distinctions.

## 3. B4 comparison layer — COMPLETE

B4 merged through PR #12 at `fd33037ce48a75b60ac5b8ca7d7526b7ffb15061`. Deterministic/static validation, the 15,552-profile matrix, Chromium acceptance, post-merge validation and Pages deployment passed.

`nutritionEvidenceComparisonForIngredient()` and `nutritionEvidenceComparisonCoverage()` remain audit utilities. They expose:
- source availability;
- exact source food identity;
- form/cultivar caveats;
- per-source values;
- per-field confidence/provenance;
- method/comparability labels;
- relative difference only where semantically meaningful.

They do not average sources or hide disagreements.

## 4. Approved European-primary policy — COMPLETE

The user explicitly approved a conditional European-primary policy for Canary Islands / Spain / Europe. It was implemented through PR #13 and merged at `cfa3b9115821b59321c7ef19e779ff3a578aa6b6`; PR and post-merge validation plus Pages deployment passed.

### Selection contract

Source selection occurs **per ingredient and per tracked nutrient**:

1. reviewed Ciqual evidence may become primary when its food-form match is equally good or better and the constituent confidence is `A`, `B` or `C`;
2. Ciqual confidence `D` does not displace an available reviewed USDA value;
3. when USDA has the stronger reviewed food-form match, USDA remains primary;
4. when only one reviewed source publishes the field, that source may supply it, with exact provenance retained;
5. values are never averaged across sources;
6. every selected field retains source, source identifier, nutrient semantic, method, food-form confidence, Ciqual field confidence where applicable and selection reason;
7. regulatory/legal evidence cannot enter this composition selector.

### Recipe-coherence contract

Per-field selection is not allowed to create a scientifically incoherent recipe total.

In particular:
- USDA carbohydrate-by-difference and Ciqual `CHOAVL` are never added together into one carbohydrate total;
- if the European-selected ingredient mix is incomplete or semantically incompatible but the fully reviewed USDA lane can produce a coherent complete recipe calculation, that coherent USDA calculation remains authoritative;
- if neither path is complete, the project-authored estimate remains primary and partial evidence remains audit metadata.

This fallback preserves previously legitimate authoritative calculations without weakening the Europe-first evidence preference where it can be applied coherently.

### What the policy does not change

It does not alter:
- recipe ranking;
- dietary-mode hard filters;
- declared allergens;
- permanent ingredient exclusions;
- temporary availability fail-closed semantics;
- medical/nutrition safety boundaries;
- the accepted V0.9.3 shell/core.

Routine evidence coverage expansion may now proceed under this policy without another source-selection gate. A future material change to these semantics would require a new bounded human decision.

## 5. Fineli / THL Finland — strong open candidate, access blocked from CI

Authority: Finnish Institute for Health and Welfare (THL).

Fineli documents **CC BY 4.0** reuse and machine-readable composition/portion data. During the bounded B4 audit, both the documented API and official downloadable package returned **HTTP 403** from standard GitHub-hosted runners.

The project does not attempt to bypass that restriction. No Fineli data is bundled. If legitimate access becomes available later, Fineli should be integrated as another provenance-preserving source under the same source-selection contract.

## 6. Frida / DTU Denmark

Frida is a high-quality national composition source from DTU with useful source/reference metadata and harmonisation/classification concepts including FoodEx2/LanguaL.

No Frida subset is bundled until exact current redistribution/attribution terms are confirmed and preserved.

## 7. NEVO / RIVM Netherlands

NEVO is the Dutch national composition database and has strong per-value provenance. Its current reuse conditions are more restrictive than Ciqual's open-data licence.

No NEVO data is bundled without a separate compatibility decision.

## 8. BEDCA / AESAN Spain

BEDCA is especially relevant geographically for Canary Islands → Spain → Mediterranean Europe, but public availability does not establish unrestricted redistribution rights.

BEDCA remains unbundled pending exact reuse/licensing resolution. Geographic relevance never overrides licence provenance.

## 9. EuroFIR FoodEXplorer

EuroFIR is useful for cross-national harmonisation/comparison but can require membership/paid access and underlying national licence compliance. It remains outside the current no-cost public-data contract.

## 10. EFSA and EU regulatory truth lane

EFSA/EU sources answer different questions from nutrient-composition tables and remain a separate evidence architecture.

### EFSA FoodEx2

FoodEx2 is a hierarchical food description/classification system useful for normalising identities across national datasets and for future cross-source mapping. It is not itself an interchangeable nutrient-composition table.

### Other EU regulatory sources

Potential future audit data include:
- authorised nutrition/health claims;
- allergen rules;
- food additive authorisations/conditions;
- pesticide maximum-residue limits;
- novel-food authorisations;
- nutrient/reference-intake rules;
- contaminant and other food-safety limits.

These should enter a separate `RegulatoryEvidenceSource` or public-safe distilled artifact. Research/scaffolding is allowed, but regulatory data must not silently alter recommendation behavior or be converted into composition measurements without a future explicit product/safety contract.

## 11. Standing evidence rules

The project must continue to:
- preserve source-specific food identity and food form;
- preserve analytical/derived/reference status where available;
- preserve geography and release/version;
- preserve licence and required attribution;
- avoid averaging conflicting sources merely to create one number;
- treat disagreement as uncertainty/evidence rather than an inconvenience;
- keep nutrient definitions explicit;
- keep regulatory/legal evidence separate from composition evidence;
- prefer reviewed form/quality evidence under the approved European-primary policy rather than assuming geography alone determines truth.
