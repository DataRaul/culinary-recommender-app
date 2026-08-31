# Data Sources & Licensing Audit

Audit date: 2026-08-31.

## Shipped project-authored corpus
The public runtime ships only project-authored structured recipes, ingredient mappings and substitution guidance. No third-party recipe text, photographs or recipe-database dump is bundled.

The repository intentionally has **no general licence yet**. Until a later explicit licensing decision, original repository content remains under default copyright. External source licences are recorded independently and are not implied to license this repository.

### Project-authored recipe corpus
- V0 source reference: `data/project-authored-v0`
- V1 source reference: `data/project-authored-v1`
- V1 search-coverage source reference: `data/project-authored-v1-search-coverage`
- recipes remain original project-authored structured content;
- no copied third-party recipe prose or external recipe dataset is used;
- recipe nutrition fields remain low-confidence `INFERRED_ESTIMATE` values unless a recipe obtains complete authoritative static coverage through the separate NutritionSource.

### Ingredient ontology and substitution graph
The canonical ingredient ontology, English/Spanish aliases, family relationships and controlled substitution guidance are project-authored application data. Substitutions are labelled `close_substitute`, `functional_substitute`, `flavour_direction`, `texture_substitute`, `dietary_substitute`, or `emergency_approximation`. Allergen and permanent-exclusion constraints override substitution suggestions.

## Nutrition composition evidence

### USDA FoodData Central Foundation Foods — PRIMARY STATIC CALCULATION LANE
USDA FoodData Central remains one authoritative source family for V1 nutrition evidence; it is not treated as universally representative of European food supply.

Verified source facts:
- FoodData Central data are public-use CC0 / U.S. public-domain data;
- selected Foundation Foods release: Version 15.0, published 2026-04-30;
- official static Foundation downloads are available, so the public application requires no runtime API key or network call;
- reusable extraction scripts retain only manually reviewed food identities and do not bundle the bulk USDA database.

Official references:
- https://fdc.nal.usda.gov/
- https://fdc.nal.usda.gov/download-datasets/
- https://fdc.nal.usda.gov/log/
- https://fdc.nal.usda.gov/Foundation_Foods_Documentation/

The bounded composition ledger contains 29 manually reviewed Foundation identities across `src/data/usda-foundation-nutrients-v1.js` and `src/data/usda-foundation-nutrients-b3.js`.

Tracked USDA fields are:
- energy: prefer `2048` (Atwater Specific Factors), with fallback architecture to `2047` / legacy `1008`;
- protein: `1003`;
- carbohydrate by difference: `1005`;
- fat: `1004`;
- fibre: `1079` where published.

Missing fields remain `null`; **null is never interpreted as zero**.

### USDA household-weight evidence
`src/data/usda-foundation-portions-v1.js` preserves source household-weight rows separately from automatic conversion policy.

Reviewed evidence includes:
- banana: one peeled banana = 115 g;
- tuna: one can = 107 g drained solids or 142 g total contents;
- broccoli: one chopped cup = 76 g;
- Grade-A large whole egg = 50.3 g;
- yellow onion edible portion = 143 g;
- red onion edible portion = 197 g.

Automatic conversion remains deliberately narrower:
- canonical banana `piece` / `pieces` may use 115 g;
- bare tuna `can` / `cans` fails as ambiguous;
- broccoli/egg/onion weights remain evidence-only because current recipe semantics do not encode enough chopped-form, egg-size/grade or onion variety/size detail.

No generic household-weight table, search-engine average, recipe-blog conversion or hidden spoon/piece assumption is used to increase apparent coverage.

### Recipe calculation boundary
A USDA-derived recipe calculation becomes primary only when every required ingredient has a reviewed static density, every required quantity has direct mass or an unambiguous reviewed conversion, and every tracked nutrient is present. Otherwise the project-authored estimate remains primary and partial static evidence remains audit metadata only.

Even a complete static ingredient calculation remains medium confidence because cooking/yield effects and food-form assumptions can matter.

## ANSES-Ciqual 2025 — BOUNDED SECONDARY / CORROBORATION LANE
B4 adds a second official composition source without changing the NutritionSource primary-selection policy.

Source facts:
- authority: ANSES, France;
- dataset: Table de composition nutritionnelle des aliments Ciqual 2025;
- publication date: 2025-11-19;
- dataset DOI: `10.57745/RDMHWY`;
- official catalogue: 3,484 foods / 74 constituents;
- licence: **Etalab Open Licence 2.0**;
- required attribution is retained in `CIQUAL_2025_SOURCE`.

Official XML inputs used by the reproducible extractor:
- food catalogue: DOI `10.57745/OH8KXC`;
- constituent catalogue: DOI `10.57745/FWSPCX`;
- composition table: DOI `10.57745/O73GDX`.

The full Ciqual database is **not** committed. `src/data/ciqual-nutrients-b4.js` contains only 32 manually reviewed app-relevant food/form records. It retains food code, English/French identity, scientific name where available, reviewed match notes, per-field confidence code and composition source codes.

### Cross-source semantic firewall
The B4 comparison layer never assumes identically named nutrients are method-identical:

- USDA energy prefers Atwater-specific energy; Ciqual retains Jones-with-fibre and EU 1169/2011 energy values;
- USDA protein and Ciqual Jones-factor protein are method-dependent;
- USDA `1005` carbohydrate by difference and Ciqual `31000` / `CHOAVL` available carbohydrate are **not directly comparable**;
- fat is compared only with form/method caveats;
- fibre remains method-dependent.

`src/domain/nutrition-evidence-comparison.js` therefore exposes source values, food-form caveats, confidence/provenance and carefully labelled relative differences where meaningful. It does **not** average sources or choose a winner.

B4 is corroboration-only: Ciqual values do not change `publicNutritionSource`, displayed recipe values, recommendation ranking, constraints or project-authored fallbacks.

See `docs/EUROPEAN_EVIDENCE.md` for the full European-source and regulatory audit.

## Other European composition candidates

### Fineli / THL Finland — OPEN, CURRENT CI ACCESS BLOCKED
Fineli documents CC BY 4.0 reuse and machine-readable API/download access. During B4, both the documented API and official package returned HTTP 403 to standard GitHub-hosted runners. The project does not attempt to bypass this restriction and bundles no Fineli data.

### Frida / DTU Denmark
High-quality national composition/provenance data with FoodEx2/LanguaL metadata. Exact current reuse/attribution terms must be preserved before a public derivative is bundled.

### NEVO / RIVM Netherlands
Strong national provenance, including source/reference information, but current reuse conditions are more restrictive than Ciqual's licence. No data is bundled without a compatibility decision.

### BEDCA / AESAN Spain
Geographically valuable for Spain/Canary food forms, but public availability does not establish unrestricted redistribution. BEDCA remains unbundled pending explicit reuse/licensing resolution.

### EuroFIR FoodEXplorer
Useful cross-national harmonisation, but membership/pay-per-view access and underlying national licence constraints place it outside the current no-cost public-data contract.

## EU regulatory / food-standards truth lane — SEPARATE FROM COMPOSITION
EFSA and European Commission sources answer legal/classification/safety questions rather than providing interchangeable nutrient measurements.

Relevant future sources include:
- EFSA FoodEx2 classification/data standardisation;
- EU Register of nutrition and health claims;
- EU Pesticides Database / maximum-residue limits;
- food-additive authorisations;
- allergen rules;
- novel-food authorisations;
- nutrient/reference-intake rules;
- contaminants and other food-safety controls.

These should enter a separate `RegulatoryEvidenceSource` or public-safe distilled artifact. Regulatory limits must never be converted into composition measurements or silently alter recommendation behavior without an explicit safety/product contract.

## Cross-source evidence rule
The evidence review does **not** support a blanket claim that Europe or the United States is categorically more truthful. The project instead requires:
1. exact source food identity and form;
2. nutrient definition/method preservation;
3. analytical/derived/reference provenance where available;
4. geography and source-version preservation;
5. licence/attribution preservation;
6. no averaging of conflicting sources merely to create one number;
7. visible disagreement/uncertainty;
8. separate composition and regulatory evidence classes.

The next human-gated policy question is whether reviewed European composition evidence may become primary for Europe/Canary contexts when form and evidence quality support it, or remains corroboration-only.

## Open Food Facts — COMPATIBILITY REVIEW REQUIRED
Open Food Facts remains unbundled. Its ODbL terms require an explicit compatibility and derived-database architecture decision before integration.

## Recipe dataset candidates
Third-party recipe datasets remain **not ingested**. Public visibility alone is not sufficient provenance. Recipe count remains subordinate to provenance, structure, culinary quality and editorial control.

## Cost evidence state
Cost is a relative deterministic heuristic rather than live market data. V1 uses project-authored Spain/Canary ingredient classes, package-sensitivity flags, availability assumptions and portfolio reuse effects. These are intentionally low-confidence planning heuristics and do not claim current supermarket prices or exact euros per serving.

## Current nutrition state
The app now contains a bounded USDA calculation lane and a bounded Ciqual corroboration lane. Coverage remains partial. The existence of official ingredient records must never be presented as if the whole corpus has authoritative recipe nutrition.
