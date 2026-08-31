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

Official XML inputs used by the reproducible extraction path:
- food catalogue (`alim`): DOI `10.57745/OH8KXC`, MD5 `8e1171d63cee4b6010cfce25dd29243d`;
- constituent catalogue (`const`): DOI `10.57745/FWSPCX`, MD5 `d8f2f25fdacb887bc993a6eeaf80f203`;
- composition (`compo`): DOI `10.57745/O73GDX`, MD5 `2da725585946434df320d8041631998b`.

The full source database is not committed.

### Frozen B4 tranche

B4 retains exactly **32 manually reviewed app-relevant food/form identities** in `src/data/ciqual-nutrients-b4.js`. Its original introduction metadata remains historical and is not rewritten.

### B5 tranche

Nutrition B5 / V1.0.9 adds a separate **22-record** reviewed module in `src/data/ciqual-nutrients-b5.js`. Combined runtime evidence is therefore B4=32, B5=22, total=54, while provenance preserves which tranche supplied each Ciqual field.

The B5 set is coverage-driven and deliberately strict. Selected records include lemon, extra-virgin olive oil, lime, generic raw tomato, generic raw bell pepper, parsley, cabbage, spinach, canned/drained chickpeas, soy sauce, fresh ginger, wholegrain raw rice, sesame oil, frozen raw peas, parmesan, coriander, curry powder, basil, dry wholewheat pasta, couscous, cherry tomato and European hake.

Form mismatches remain deferred rather than promoted: cumin seed does not stand in for ground cumin; generic paprika does not establish smoked paprika; unspecified tofu does not establish firm tofu; cooked lentil candidates do not automatically represent dry lentil recipe quantities; and egg-containing Asian noodles are unsuitable for the app's generic wheat-noodle identity/allergen semantics.

### Ciqual fields retained

The bounded modules preserve:
- Ciqual food code;
- English/French identity;
- scientific name where present;
- reviewed form-match confidence and notes;
- values per 100 g;
- constituent definition / INFOODS code;
- per-field confidence code (`A`–`D` where supplied);
- composition source codes;
- evidence tranche (`B4` or `B5`) at runtime selection.

Missing/below-limit fields remain `null` rather than being silently converted to zero.

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

## 3. Comparison layer

B4 merged through PR #12 at `fd33037ce48a75b60ac5b8ca7d7526b7ffb15061`. Deterministic/static validation, the 15,552-profile matrix, Chromium acceptance, post-merge validation and Pages deployment passed.

`nutritionEvidenceComparisonForIngredient()` and `nutritionEvidenceComparisonCoverage()` remain audit utilities. B5 extends their bounded Ciqual coverage while keeping selection separate. They expose:
- source availability;
- exact source food identity;
- form/cultivar caveats;
- per-source values;
- per-field confidence/provenance;
- method/comparability labels;
- B4/B5 evidence counts;
- relative difference only where semantically meaningful.

They do not average sources or hide disagreements.

## 4. Approved European-primary policy — COMPLETE

The user explicitly approved a conditional European-primary policy for Canary Islands / Spain / Europe. It was implemented through PR #13 and merged at `cfa3b9115821b59321c7ef19e779ff3a578aa6b6`; PR and post-merge validation plus Pages deployment passed.

### Selection contract

Source selection occurs **per ingredient and per tracked nutrient** across reviewed Ciqual B4+B5 evidence and USDA Foundation evidence:

1. reviewed Ciqual evidence may become primary when its food-form match is equally good or better and the constituent confidence is `A`, `B` or `C`;
2. Ciqual confidence `D` does not displace an available reviewed USDA value;
3. when USDA has the stronger reviewed food-form match, USDA remains primary;
4. when only one reviewed source publishes the field, that source may supply it, with exact provenance retained — including B5-only `D` values such as European hake where no reviewed USDA field exists;
5. values are never averaged across sources;
6. every selected field retains source, source identifier, nutrient semantic, method, food-form confidence, Ciqual field confidence where applicable, evidence tranche and selection reason;
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

Routine evidence coverage expansion may proceed under this policy without another source-selection gate. A future material change to these semantics requires a new bounded human decision.

## 5. B5 recipe-level coverage result

The PR #16 / V1.0.8 baseline established 0/76 complete authoritative recipes, 356 missing-density blocker events, 86 unsupported-quantity events and 12 mixed incompatible carbohydrate-semantic events.

The integrated B5 candidate was measured in deterministic Actions run `33443162092`:
- complete authoritative recipes: **0 / 76**;
- missing-density blocker events: **141**;
- unsupported-quantity-unit blocker events: **202**;
- mixed incompatible carbohydrate-semantic events: **16**;
- newly authoritative recipe IDs: **none**.

This does not mean B5 failed. The large density reduction moves many recipe points to their next truthful blocker, usually an unsupported household quantity. More recipes also reach multi-source semantic evaluation, exposing additional incompatible-carbohydrate cases that continue to fail closed. The architecture refuses to turn either class into guessed completeness.

This evidence makes authoritative portion/quantity normalization the leading next nutrition workstream.

## 6. Fineli / THL Finland — strong open candidate, access blocked from CI

Authority: Finnish Institute for Health and Welfare (THL).

Fineli documents **CC BY 4.0** reuse and machine-readable composition/portion data. During the bounded B4 audit, both the documented API and official downloadable package returned **HTTP 403** from standard GitHub-hosted runners.

The project does not attempt to bypass that restriction. No Fineli data is bundled. If legitimate access becomes available later, Fineli should be integrated as another provenance-preserving source under the same source-selection contract.

## 7. Matvaretabellen / Norwegian Food Safety Authority — leading portion-evidence candidate

The Norwegian Food Composition Table is current through January 2026, contains more than 2,100 foods, exposes machine-readable food/source data, and documents portion sizes for foods commonly represented by piece/slice. This maps directly to the quantity blockers revealed by B5.

No Matvaretabellen data is bundled in B5. Before any static public subset is committed, the project must verify the exact current redistribution licence and attribution terms from authoritative metadata, then retain source identity, portion description, grams, version and provenance. Public API availability alone is not treated as permission.

## 8. Frida / DTU Denmark

Frida is a high-quality national composition source from DTU with useful source/reference metadata and harmonisation/classification concepts including FoodEx2/LanguaL.

No Frida subset is bundled until exact current redistribution/attribution terms are confirmed and preserved.

## 9. NEVO / RIVM Netherlands

NEVO is the Dutch national composition database and has strong per-value provenance. Its current reuse conditions are more restrictive than Ciqual's open-data licence.

No NEVO data is bundled without a separate compatibility decision.

## 10. BEDCA / AESAN Spain

BEDCA is especially relevant geographically for Canary Islands → Spain → Mediterranean Europe, but public availability does not establish unrestricted redistribution rights.

BEDCA remains unbundled pending exact reuse/licensing resolution. Geographic relevance never overrides licence provenance.

## 11. EuroFIR FoodEXplorer

EuroFIR is useful for cross-national harmonisation/comparison but can require membership/paid access and underlying national licence compliance. It remains outside the current no-cost public-data contract.

## 12. EFSA and EU regulatory truth lane

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

## 13. Standing evidence rules

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
