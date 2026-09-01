# European Nutrition & Food-Standards Evidence

Audit/policy date: 2026-08-31.

## Governing principle

European evidence is not assumed to be inherently more accurate than U.S. evidence. The project uses a stricter rule:

**preserve each official source's food identity, geography, analytical/derivation method, nutrient definition, field confidence/provenance, version and licence; prefer the better reviewed match under explicit policy and expose disagreement instead of averaging it away.**

Composition evidence, quantity/portion evidence and regulatory/food-standard evidence are separate evidence classes.

## 1. ANSES-Ciqual 2025 — bounded composition evidence

Authority: French Agency for Food, Environmental and Occupational Health & Safety (ANSES).

Selected release:

- dataset: **Table de composition nutritionnelle des aliments Ciqual 2025**;
- publication date: 2025-11-19;
- dataset DOI: `10.57745/RDMHWY`;
- official catalogue: 3,484 foods / 74 constituents;
- licence: **Etalab Open Licence 2.0**;
- required ANSES attribution retained.

Official XML inputs used by the bounded extraction path:

- food catalogue: DOI `10.57745/OH8KXC`, MD5 `8e1171d63cee4b6010cfce25dd29243d`;
- constituent catalogue: DOI `10.57745/FWSPCX`, MD5 `d8f2f25fdacb887bc993a6eeaf80f203`;
- composition table: DOI `10.57745/O73GDX`, MD5 `2da725585946434df320d8041631998b`.

The full source database is not committed.

### Frozen B4 tranche

B4 retains exactly **32 manually reviewed app-relevant food/form identities** in `src/data/ciqual-nutrients-b4.js`. Its original introduction metadata is historical and is not rewritten.

### B5 tranche

Nutrition B5 / V1.0.9 added a separate **22-record** reviewed module in `src/data/ciqual-nutrients-b5.js`. Combined runtime Ciqual evidence is therefore B4=32, B5=22, total=54, while provenance preserves which tranche supplied each field.

The B5 set is coverage-driven and deliberately strict. Form mismatches remain deferred rather than promoted: cumin seed does not stand in for ground cumin; generic paprika does not establish smoked paprika; unspecified tofu does not establish firm tofu; cooked lentil candidates do not automatically represent dry lentil recipe quantities; and egg-containing Asian noodles are unsuitable for the app's generic wheat-noodle identity/allergen semantics.

The bounded modules preserve exact food code, English/French identity, scientific name where present, reviewed form-match notes, values per 100 g, constituent semantics, per-field confidence codes and composition source codes. Missing/below-limit fields remain `null`.

B5 merged through PR #17 at `5689b0e40c6c4d9d7040b0ee25b7cc41d898b751`; post-merge validation and Pages deployment passed.

## 2. Nutrient-definition firewall

| App field | USDA Foundation | Ciqual 2025 | Treatment |
|---|---|---|---|
| Energy | Atwater-specific preferred (`2048`) | Jones + fibre / EU 1169 energy | method explicit |
| Protein | `1003` | Jones-factor protein (`PROCNT`) | provenance retained |
| Carbohydrate | `1005`, carbohydrate by difference | `CHOAVL`, available carbohydrate | **different semantics; never summed together** |
| Fat | `1004` | `FAT` | selectable with form/method caveats |
| Fibre | `1079` | `FIB-` | method/source retained |

A database-level winner score is prohibited because it would erase these distinctions.

## 3. Approved European-primary composition policy — COMPLETE

The user explicitly approved a conditional European-primary policy for Canary Islands / Spain / Europe. PR #13 merged it at `cfa3b9115821b59321c7ef19e779ff3a578aa6b6`; deterministic/static validation, the 15,552-profile matrix, Chromium acceptance, post-merge validation and Pages deployment passed.

Source selection occurs **per ingredient and per tracked nutrient** across reviewed Ciqual B4+B5 and USDA Foundation evidence:

1. reviewed Ciqual may become primary when its food-form match is equally good or better and constituent confidence is `A`, `B` or `C`;
2. Ciqual `D` does not displace an available reviewed USDA value;
3. a stronger USDA food-form match remains primary;
4. when only one reviewed source publishes the field, that source may supply it with original confidence retained;
5. no values are averaged;
6. exact source, identifier, nutrient semantic, method, food-form confidence, field confidence, evidence tranche and selection reason remain available;
7. quantity and regulatory evidence do not enter this composition selector.

### Recipe-coherence contract

Per-field selection may not create a scientifically incoherent recipe total.

- USDA carbohydrate-by-difference and Ciqual `CHOAVL` are never added together into one carbohydrate total;
- if the Europe-selected mix is incomplete or semantically incompatible but the fully reviewed USDA lane can produce a complete coherent recipe calculation, that USDA calculation remains authoritative;
- otherwise the project-authored estimate stays primary and partial evidence remains audit metadata.

This policy does not alter recommendation ranking, dietary/allergen/permanent-exclusion safety, temporary availability semantics, medical boundaries or the accepted V0.9.3 shell/core.

## 4. Matvaretabellen 2026 — bounded European quantity evidence B6

Authority: **Norwegian Food Safety Authority (Mattilsynet)**.
Source table: **Norwegian Food Composition Table 2026**.
Release: January 2026.
Licence: **NLOD 2.0 / Norsk lisens for offentlige data**.
Required attribution is retained in `src/data/matvaretabellen-portions-b6.js`.
Runtime fetch: **none**.

B6 uses Matvaretabellen only as a **portion/mass evidence source**. It does not import Norwegian nutrient composition and therefore does not change the existing USDA/Ciqual composition-selection hierarchy.

### Strict reviewed conversions

B6 promotes only 14 canonical food/unit mappings whose source food and unit semantics were manually reviewed:

- lemon piece(s) = 80 g;
- garlic clove(s) = 3 g;
- extra-virgin olive oil tablespoon = 10 g;
- generic raw tomato piece(s) = 95 g;
- generic raw bell pepper piece(s) = 145 g, based on exact agreement across green/red/yellow-orange raw source rows;
- soy sauce tablespoon = 13 g;
- raw onion piece(s) = 160 g;
- carrot piece(s) = 80 g;
- cucumber piece(s) = 325 g;
- raw egg piece(s) = 55 g;
- spring onion piece(s) = 19 g;
- curry powder teaspoon = 3 g;
- aubergine piece(s) = 285 g;
- mango piece(s) = 335 g.

The existing USDA banana conversion remains preferred in its already-reviewed lane; B6 does not replace it.

### Ambiguity remains evidence

B6 deliberately retains unresolved cases rather than selecting a convenient value:

- lime: the same source food exposes conflicting 17 g and 65 g piece rows → explicit ambiguity;
- avocado: 130 g small and 220 g large → explicit ambiguity for a bare piece;
- `onion|small`: unqualified source piece does not establish a small onion;
- `sesame_oil|tsp`: tablespoon/decilitre source data do not justify implicit teaspoon arithmetic;
- `red_onion|piece`: no exact acceptable reviewed row is promoted.

Generic averages, midpoint selection and hidden spoon arithmetic are prohibited.

## 5. Recipe-level coverage progression

### PR #16 / V1.0.8 baseline

- complete authoritative recipes: **0 / 76**;
- missing-density events: **356**;
- unsupported-quantity events: **86**;
- mixed incompatible carbohydrate-semantic events: **12**.

### B5 / V1.0.9

- complete authoritative recipes: **0 / 76**;
- missing-density events: **141**;
- unsupported-quantity events: **202**;
- mixed incompatible carbohydrate-semantic events: **16**.

B5 exposed quantity as the next dominant blocker after composition breadth improved.

### B6 / V1.0.10 candidate

Deterministic Actions run `33445671486` passed all 83 tests and measured:

- complete authoritative recipes: **0 / 76**;
- missing-density events: **141**;
- unsupported-quantity events: **27**;
- explicit ambiguous-portion events: **20**;
- mixed incompatible carbohydrate-semantic events: **16**;
- newly authoritative recipes: **none**.

B6 therefore resolves or reclassifies **175 of 202** formerly unsupported quantity events without creating false recipe completeness. Remaining recipe-level work is now driven mainly by missing composition forms, explicit residual quantity semantics and the existing carbohydrate firewall.

## 6. Other European sources

### Fineli / THL Finland

Strong official source with documented **CC BY 4.0** reuse. During the bounded audit both its documented API and official package returned HTTP 403 from standard GitHub-hosted runners. No bypass is attempted and no Fineli data is bundled.

### Frida / DTU Denmark

High-quality national composition/provenance source with useful harmonisation metadata. No subset is bundled until exact current redistribution and attribution terms are confirmed.

### NEVO / RIVM Netherlands

Strong official provenance, including per-value source/reference information. No data is bundled without a compatible reuse decision.

### BEDCA / AESAN Spain

Especially relevant geographically for Canary Islands / Spain, but public availability does not establish unrestricted redistribution. No data is bundled without explicit compatible reuse terms.

### EuroFIR FoodEXplorer

Useful for cross-national harmonisation/comparison but may require membership/paid access and underlying national licence compliance. It remains outside the current no-cost contract.

## 7. EFSA and EU regulatory truth lane

EFSA/EU sources answer different questions from composition and portion tables.

Potential future sources include EFSA FoodEx2, the EU Register of nutrition and health claims, pesticide MRLs, food-additive authorisations, allergen rules, novel-food authorisations, reference-intake/labelling rules and contaminants.

These belong in a separate `RegulatoryEvidenceSource` or public-safe distilled artifact. Research/scaffolding is allowed, but regulatory data must not silently alter recommendation behavior or be converted into composition measurements without a future explicit product/safety contract.

## 8. Standing European evidence rules

The project must continue to:

- preserve source-specific food identity and form;
- preserve exact portion-unit semantics;
- preserve analytical/derived/reference status where available;
- preserve geography and release/version;
- preserve licence and required attribution;
- avoid averaging conflicting sources merely to create one number;
- treat ambiguity/disagreement as evidence rather than an inconvenience;
- keep nutrient definitions explicit;
- keep composition, quantity and regulatory evidence separate;
- prefer reviewed form/quality evidence under the approved policy rather than assuming geography alone determines truth.

## Nutrition B8 — source-policy boundary preserved

B8 does not broaden the approved Foundation + Ciqual composition policy. Its only admitted runtime evidence is an exact USDA SR Legacy **portion** row for raw `onion|small` = 70 g (FDC `170000`, NDB `11282`, portion row `85862`). Matvaretabellen remains quantity-only under B6 and SR Legacy remains quantity-only under B8. A future Norwegian or SR-Legacy composition lane would require separate reviewed policy rather than being inferred from portion-source approval.

The resulting authored audit is 1/76 authoritative, with unsupported quantity reduced from 27 to 7 while missing density remains 133, ambiguous portions 20 and mixed carbohydrate semantics 16.
