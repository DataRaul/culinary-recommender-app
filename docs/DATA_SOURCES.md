# Data Sources & Licensing Audit

Audit/policy date: 2026-08-31.

## RecipeSource lanes

The public runtime ships two explicitly separated recipe lanes: 76 project-authored structured recipes and a bounded eight-record English Wikibooks Gate F candidate. Ingredient mappings, culinary metadata and substitution guidance remain app-owned normalization/governance data. No third-party photographs, media or bulk recipe-database dump is bundled.

The repository intentionally has **no general licence yet**. Original project-authored repository content therefore remains under default copyright. External source licences are recorded independently and do not license the rest of the repository.

Project-authored recipe source labels include `data/project-authored-v0`, `data/project-authored-v1` and `data/project-authored-v1-search-coverage`.

Recipe nutrition remains low-confidence `INFERRED_ESTIMATE` unless the deterministic NutritionSource can produce a complete authoritative calculation under the approved evidence policy. Wikibooks source nutrition, where present, is not promoted into NutritionSource authority.

### English Wikibooks Cookbook — Gate F candidate

Rights audit: **PASS FOR BOUNDED TEXT-ONLY INGEST**. Chosen downstream licence: **CC BY-SA 4.0**. The project preserves page/revision provenance, canonical and exact-revision URLs, Wikibooks contributor attribution, licence URL, transformation notice and any additional page-specific attribution obligations. Pages with obligations that cannot be faithfully retained are rejected. See `docs/WIKIBOOKS_GATE_F_RIGHTS_AUDIT.md` and `THIRD_PARTY_NOTICES.md`.

A bounded MediaWiki discovery run measured **3,792** pages in English Wikibooks `Category:Recipes`. This is a discovery count, not a bundled-corpus claim. Gate F freezes only **eight manually reviewed exact revisions** in `scripts/wikibooks-gate-f-snapshot-v1.json`, verified by `scripts/verify-wikibooks-gate-f-snapshot.mjs`. No Wikibooks images or other media are used.

The normalized candidate universe is **84 recipes / 83 dish families**: 76 authored plus eight Wikibooks records, with one explicit cross-source Spanish-potato-omelet family. Two external records are `SEARCH_ONLY` and six are `REFERENCE_ONLY_INCOMPLETE_HARD_METADATA`; missing source-backed time/serving metadata remains unknown. Role coverage is intentionally incomplete: `contemporary_modern` and `genuinely_new_trending` are recorded as gaps.

External recipe content remains behind `RecipeSource`. `RecipeSource`, `NutritionSource` and regulatory evidence are separate truth lanes, and external recipes cannot bypass allergens, dietary constraints, permanent exclusions, quantity semantics or fail-closed recommendation/nutrition rules. The private Knowledge Core is not a runtime data source.

The canonical ingredient ontology, English/Spanish aliases, family relationships, exclusion semantics and controlled substitution graph are project-authored application data. Allergens and permanent exclusions always override substitutions.

## Composition evidence

### USDA FoodData Central Foundation Foods

Verified source facts:

- public-use CC0 / U.S. public-domain data;
- selected Foundation release: Version 15.0, 2026-04-30;
- official static downloads are available;
- runtime API access is not required;
- bounded extraction retains only manually reviewed source/form identities;
- the bulk USDA database is not bundled.

The bounded USDA composition ledger contains **29 manually reviewed Foundation identities** across `src/data/usda-foundation-nutrients-v1.js` and `src/data/usda-foundation-nutrients-b3.js`.

Tracked semantics include energy, protein, USDA `1005` carbohydrate by difference, total fat and fibre where published. Missing fields stay `null`; null is never interpreted as zero.

Official references:
- https://fdc.nal.usda.gov/
- https://fdc.nal.usda.gov/download-datasets/
- https://fdc.nal.usda.gov/log/
- https://fdc.nal.usda.gov/Foundation_Foods_Documentation/

### ANSES-Ciqual 2025

Authority: ANSES, France.  
Dataset: *Table de composition nutritionnelle des aliments Ciqual 2025*.  
Publication date: 2025-11-19.  
Dataset DOI: `10.57745/RDMHWY`.  
Catalogue: 3,484 foods / 74 constituents.  
Licence: **Etalab Open Licence 2.0** with required ANSES attribution.

Official XML inputs used by the bounded reproducible extraction path:

- food catalogue: DOI `10.57745/OH8KXC`, MD5 `8e1171d63cee4b6010cfce25dd29243d`;
- constituent catalogue: DOI `10.57745/FWSPCX`, MD5 `d8f2f25fdacb887bc993a6eeaf80f203`;
- composition table: DOI `10.57745/O73GDX`, MD5 `2da725585946434df320d8041631998b`.

The full source database is not committed.

The frozen historical B4 module contains **32 manually reviewed food/form identities**. Nutrition B5 / V1.0.9 added a separate **22-record** tranche without rewriting B4, giving **54** reviewed Ciqual composition records at runtime. Exact food code, English/French identity, scientific name where present, form-review notes, values, per-field confidence codes and source codes are retained. Runtime provenance records `evidenceTranche: "B4"` or `"B5"`.

B5 deliberately leaves weak form matches unbundled, including cumin seed for ground cumin, generic paprika for smoked paprika, unspecified tofu for firm tofu, cooked lentil forms where recipes may mean dry and egg-containing noodles for a generic wheat-noodle identity.

## Quantity / portion evidence

Quantity evidence is a separate evidence class from nutrient composition. A portion source supplies a mass conversion; it does not thereby become the composition source for that ingredient.

### USDA Foundation household-weight evidence

`src/data/usda-foundation-portions-v1.js` preserves reviewed source portion rows separately from conversion policy.

Reviewed rows include:

- banana: one peeled banana = 115 g;
- tuna can: 107 g drained solids or 142 g total contents;
- broccoli: one chopped cup = 76 g;
- Grade-A large whole egg = 50.3 g;
- yellow onion edible portion = 143 g;
- red onion edible portion = 197 g.

Automatic conversion is intentionally narrower:

- canonical banana `piece(s)` may use 115 g;
- bare tuna `can(s)` is ambiguous and fails closed;
- the other USDA rows remain evidence-only where the app's canonical recipe semantics do not establish the required size/form/variety.

### Matvaretabellen / Norwegian Food Safety Authority — B6

Nutrition B6 / V1.0.10 adds a bounded official portion-evidence source from the **Norwegian Food Composition Table 2026**.

Source contract recorded in `src/data/matvaretabellen-portions-b6.js`:

- authority: Norwegian Food Safety Authority (`Mattilsynet`);
- source table: Norwegian Food Composition Table 2026;
- release: January 2026;
- source API used for bounded discovery: `https://www.matvaretabellen.no/api/en/foods.json`;
- licence: **NLOD 2.0 / Norsk lisens for offentlige data**;
- attribution retained: `Norwegian Food Composition Table 2026. The Norwegian Food Safety Authority. www.matvaretabellen.no`;
- public runtime fetch: **none**;
- evidence tranche: `B6`;
- scope: portion/mass evidence only.

The project commits only reviewed source rows required by the app, not the full database.

B6 promotes 14 canonical food/unit mappings:

- lemon piece(s) = 80 g;
- garlic clove(s) = 3 g;
- extra-virgin olive oil tablespoon = 10 g;
- generic raw tomato piece(s) = 95 g;
- generic raw bell pepper piece(s) = 145 g, supported by exact agreement across green/red/yellow-orange source rows;
- soy sauce tablespoon = 13 g;
- raw onion piece(s) = 160 g;
- carrot piece(s) = 80 g;
- cucumber piece(s) = 325 g;
- raw egg piece(s) = 55 g;
- spring onion piece(s) = 19 g;
- curry powder teaspoon = 3 g;
- aubergine piece(s) = 285 g;
- mango piece(s) = 335 g.

B6 also preserves explicit ambiguity/defer states:

- lime piece: conflicting 17 g and 65 g source rows → ambiguous;
- avocado piece: 130 g small vs 220 g large → ambiguous;
- `onion|small`: no source-backed small-size mapping approved;
- `sesame_oil|tsp`: source does not publish the required teaspoon mapping; tablespoon-to-teaspoon arithmetic is not inferred;
- `red_onion|piece`: no exact acceptable reviewed row promoted.

Generic web averages, recipe-blog conversions, midpoint choices and hidden household arithmetic are prohibited as a way to inflate coverage.

## Approved Canary/Spain/Europe source-selection policy

The user approved conditional European-primary composition evidence on 2026-08-31. PR #13 merged the policy at `cfa3b9115821b59321c7ef19e779ff3a578aa6b6` with green deterministic/static, matrix, browser, post-merge and Pages validation.

`src/domain/nutrition-source-policy.js` applies composition selection **per ingredient and per tracked nutrient** across reviewed USDA and Ciqual evidence:

1. reviewed Ciqual may become primary where food-form match is equally good or better and constituent confidence is `A`, `B` or `C`;
2. Ciqual `D` does not displace an available reviewed USDA value;
3. a stronger USDA food-form match stays primary;
4. a reviewed field may come from the only available source, with original confidence retained;
5. no cross-source averaging;
6. exact source, identifier, semantic, method, form confidence, Ciqual confidence, evidence tranche and selection reason are retained;
7. composition selection is independent of quantity and regulatory evidence.

### Cross-source semantic firewall

The project does not flatten similarly named nutrients into an assumed common definition. Most importantly, USDA `1005` carbohydrate by difference and Ciqual `31000` / `CHOAVL` available carbohydrate are distinct semantics and are never summed together into one authoritative recipe carbohydrate total.

If Europe-selected fields cannot produce a coherent complete recipe but a fully reviewed coherent USDA lane can, USDA remains the authoritative recipe fallback. If neither path is complete, the project-authored estimate remains primary.

## Authoritative recipe-coverage state

### PR #16 / V1.0.8 baseline

- authoritative recipes: **0 / 76**;
- missing-density blockers: **356**;
- unsupported-quantity blockers: **86**;
- mixed incompatible carbohydrate-semantic events: **12**.

### B5 / V1.0.9

- authoritative recipes: **0 / 76**;
- missing-density blockers: **141**;
- unsupported-quantity blockers: **202**;
- mixed incompatible carbohydrate-semantic events: **16**.

B5 merged through PR #17 at `5689b0e40c6c4d9d7040b0ee25b7cc41d898b751` with green post-merge validation and Pages deployment.

### B6 / V1.0.10 candidate

Deterministic Actions run `33445671486` measured:

- authoritative recipes: **0 / 76**;
- missing-density blockers: **141**;
- unsupported-quantity blockers: **27**;
- explicit ambiguous-portion blockers: **20**;
- mixed incompatible carbohydrate-semantic events: **16**;
- newly authoritative recipes: **none**.

The quantity evidence therefore resolves or truthfully reclassifies 175 of B5's 202 unsupported-quantity events without guessing. Composition and semantic gaps still prevent a complete authoritative recipe.

## Other European source state

### Fineli / THL Finland

Strong official source with documented **CC BY 4.0** reuse. During the bounded European audit both the documented API and official downloadable package returned HTTP 403 from standard GitHub-hosted runners. The project does not bypass that restriction and bundles no Fineli data.

### Frida / DTU Denmark

High-quality national composition/provenance source. No data is bundled until current redistribution and attribution terms are confirmed and preserved exactly.

### NEVO / RIVM Netherlands

Strong official provenance, including per-value source/reference information. No subset is bundled without a compatible reuse decision.

### BEDCA / AESAN Spain

Highly relevant geographically for Spain/Canary use, but public availability does not establish unrestricted redistribution. No data is bundled without explicit compatible reuse terms.

### EuroFIR FoodEXplorer

Useful cross-national harmonisation, but membership/pay-per-view and underlying national licences place it outside the current no-cost contract.

## EU regulatory / food-standards truth lane

EFSA and European Commission sources answer legal, classification and safety questions rather than interchangeable nutrient-composition questions.

Relevant future sources include EFSA FoodEx2, the EU Register of nutrition and health claims, pesticide MRLs, additive authorisations, allergen rules, novel foods, reference-intake/labelling rules and contaminants.

These may enter a separate `RegulatoryEvidenceSource` or public-safe distilled artifact. They must not be converted into composition values or silently change recommendation behavior without a future explicit product/safety contract.

## Standing evidence rules

The project requires:

1. exact source food identity and form;
2. exact quantity-unit semantics for automatic mass conversion;
3. nutrient definition/method preservation;
4. analytical/derived/reference provenance where available;
5. geography and source-version preservation;
6. licence/attribution preservation;
7. no averaging merely to create consensus;
8. visible ambiguity/disagreement/uncertainty;
9. separate composition, quantity and regulatory evidence classes;
10. deterministic source selection under the approved Europe/Canary policy rather than a blanket geography winner.

## Open Food Facts and other third-party recipe sources

Open Food Facts remains unbundled because its ODbL terms require an explicit compatibility/derived-database architecture decision. Beyond the bounded Wikibooks Gate F lane, other third-party recipe datasets remain unbundled until a source-specific rights/provenance review passes; public availability alone is insufficient provenance.

## Cost evidence state

Cost remains a relative deterministic project-authored heuristic using Spain/Canary ingredient classes, package-sensitivity flags, availability assumptions and portfolio reuse. It does not claim live supermarket prices or exact euros per serving.
