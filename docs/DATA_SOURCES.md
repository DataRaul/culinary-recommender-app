# Data Sources & Licensing Audit

Audit/policy date: 2026-08-31.

## Shipped project-authored corpus

The public runtime ships project-authored structured recipes, ingredient mappings and substitution guidance. No third-party recipe text, photographs or recipe-database dump is bundled.

The repository intentionally has **no general licence yet**. Original project-authored repository content therefore remains under default copyright. External source licences are recorded independently and do not license the rest of the repository.

### Project-authored recipe sources

- `data/project-authored-v0`
- `data/project-authored-v1`
- `data/project-authored-v1-search-coverage`

Recipe nutrition remains low-confidence `INFERRED_ESTIMATE` unless the separate deterministic NutritionSource can produce a complete authoritative calculation under the approved evidence policy.

### Ingredient ontology and substitution graph

The canonical ingredient ontology, English/Spanish aliases, family relationships and controlled substitution guidance are project-authored application data. Substitution types are `close_substitute`, `functional_substitute`, `flavour_direction`, `texture_substitute`, `dietary_substitute`, or `emergency_approximation`. Allergens and permanent exclusions always override substitutions.

## Nutrition composition evidence

The app now has two bounded official composition families plus a deterministic Canary/Spain/Europe source-selection policy. This is not a claim that one geography is universally more truthful.

### USDA FoodData Central Foundation Foods

Verified source facts:
- public-use CC0 / U.S. public-domain data;
- selected Foundation release: Version 15.0, 2026-04-30;
- official static downloads are available;
- runtime API access is not required;
- reusable extraction scripts keep only manually reviewed source/form identities;
- the bulk USDA database is not bundled.

Official references:
- https://fdc.nal.usda.gov/
- https://fdc.nal.usda.gov/download-datasets/
- https://fdc.nal.usda.gov/log/
- https://fdc.nal.usda.gov/Foundation_Foods_Documentation/

The bounded USDA composition ledger contains **29 manually reviewed Foundation identities** across `src/data/usda-foundation-nutrients-v1.js` and `src/data/usda-foundation-nutrients-b3.js`.

Tracked USDA semantics:
- energy: nutrient `2048` Atwater Specific Factors preferred, with documented fallback architecture;
- protein: `1003`;
- carbohydrate by difference: `1005`;
- total fat: `1004`;
- fibre: `1079` where published.

Missing fields stay `null`; null is never interpreted as zero.

### USDA household-weight evidence

`src/data/usda-foundation-portions-v1.js` preserves source portion rows separately from conversion policy.

Reviewed rows include:
- banana: one peeled banana = 115 g;
- tuna can: 107 g drained solids or 142 g total contents;
- broccoli: one chopped cup = 76 g;
- Grade-A large whole egg = 50.3 g;
- yellow onion edible portion = 143 g;
- red onion edible portion = 197 g.

Automatic conversion is deliberately narrower:
- canonical banana `piece(s)` may use 115 g;
- bare tuna `can(s)` is ambiguous and fails closed;
- broccoli/egg/onion household weights remain evidence-only because current recipe semantics do not encode enough form/size/variety detail.

Generic internet averages, recipe-blog conversions and hidden spoon/piece assumptions are prohibited as a way to inflate coverage.

## ANSES-Ciqual 2025

European Evidence B4 added a bounded ANSES-Ciqual 2025 source and completed through PR #12 at `fd33037ce48a75b60ac5b8ca7d7526b7ffb15061` with green PR/post-merge validation and Pages deployment.

Source facts:
- authority: ANSES, France;
- dataset: *Table de composition nutritionnelle des aliments Ciqual 2025*;
- publication date: 2025-11-19;
- dataset DOI: `10.57745/RDMHWY`;
- catalogue: 3,484 foods / 74 constituents;
- licence: **Etalab Open Licence 2.0**;
- required ANSES attribution retained.

Official XML inputs used by the reproducible extractor:
- food catalogue: DOI `10.57745/OH8KXC`;
- constituent catalogue: DOI `10.57745/FWSPCX`;
- composition table: DOI `10.57745/O73GDX`.

The full source database is not committed. `src/data/ciqual-nutrients-b4.js` contains only **32 manually reviewed app-relevant food/form records**, preserving food code, English/French identity, scientific name where available, form-review notes, per-field confidence (`A`–`D`) and composition source codes.

### Cross-source semantic firewall

The project does not flatten similarly named nutrients into an assumed common definition:
- USDA energy and Ciqual EU/Jones energy methods remain explicit;
- protein methods remain explicit;
- USDA `1005` carbohydrate by difference and Ciqual `31000` / `CHOAVL` available carbohydrate are distinct semantics;
- fat comparisons retain food-form/method caveats;
- fibre methods remain explicit.

`src/domain/nutrition-evidence-comparison.js` remains a provenance/disagreement audit layer and never averages official sources.

## Approved Canary/Spain/Europe source-selection policy

The user approved conditional European-primary evidence on 2026-08-31. PR #13 implemented the policy and merged at `cfa3b9115821b59321c7ef19e779ff3a578aa6b6`; deterministic/static validation, the 15,552-profile matrix, Chromium acceptance, post-merge validation and Pages deployment passed.

`src/domain/nutrition-source-policy.js` applies source selection **per ingredient and per tracked nutrient**:

1. reviewed Ciqual may become primary where the food-form match is equally good or better and constituent confidence is `A`, `B` or `C`;
2. Ciqual confidence `D` does not displace an available reviewed USDA value;
3. a stronger USDA food-form match stays primary;
4. a reviewed field may come from the only available source when the other source has no reviewed value;
5. no cross-source averaging;
6. exact source, identifier, semantic, method, form confidence, Ciqual field confidence and selection reason are retained;
7. composition selection is independent of regulatory/legal evidence.

### Recipe-coherence boundary

The calculator may not manufacture a recipe total from incompatible nutrient semantics.

Specifically:
- USDA carbohydrate-by-difference and Ciqual `CHOAVL` are never summed into one authoritative carbohydrate result;
- if the Europe-selected field mix cannot produce a complete coherent recipe calculation but the reviewed USDA lane can, the coherent USDA calculation remains authoritative;
- otherwise incomplete evidence preserves the project-authored estimate and remains audit metadata only.

Even a complete static calculation remains medium confidence because cooking/yield and exact food form can still matter.

## Other European composition candidates

### Fineli / THL Finland — open licence, current CI access blocked

Fineli documents **CC BY 4.0** reuse and machine-readable data. During B4 both the documented API and official downloadable package returned HTTP 403 from standard GitHub-hosted runners. No bypass is attempted and no Fineli data is bundled.

If legitimate access later becomes available, Fineli may be integrated as another source under the existing provenance/source-selection contract.

### Frida / DTU Denmark

High-quality national composition/provenance data with FoodEx2/LanguaL metadata. Exact current redistribution and attribution terms must be confirmed before any public derived subset is bundled.

### NEVO / RIVM Netherlands

Strong official provenance, including per-value source/reference information, but current reuse conditions are more restrictive than Ciqual's open-data licence. No data is bundled without a compatibility decision.

### BEDCA / AESAN Spain

Highly relevant to Spanish/Canary food forms, but public access does not imply unrestricted redistribution. BEDCA remains unbundled until exact reuse/licensing terms permit a defensible public derivative.

### EuroFIR FoodEXplorer

Useful for cross-national harmonisation, but membership/pay-per-view access and underlying national licences place it outside the current no-cost contract.

## EU regulatory / food-standards truth lane — separate from composition

EFSA and European Commission resources answer legal/classification/safety questions rather than interchangeable nutrient-measurement questions.

Relevant future audit sources include:
- EFSA FoodEx2 classification/data standardisation;
- EU Register of nutrition and health claims;
- EU Pesticides Database / maximum-residue limits;
- food-additive authorisations;
- allergen rules;
- novel-food authorisations;
- nutrient/reference-intake rules;
- contaminants and other food-safety controls.

These may be researched and represented through a separate `RegulatoryEvidenceSource` or public-safe distilled artifact. They must not be converted into composition values or silently change recommendation behavior without a future explicit product/safety contract.

## Standing cross-source evidence rules

The project requires:
1. exact source food identity and form;
2. nutrient definition/method preservation;
3. analytical/derived/reference provenance where available;
4. geography and source-version preservation;
5. licence/attribution preservation;
6. no averaging merely to create consensus;
7. visible disagreement/uncertainty;
8. separate composition and regulatory evidence classes;
9. deterministic source selection under the approved Europe/Canary policy rather than a blanket geography winner.

## Open Food Facts — compatibility review required

Open Food Facts remains unbundled. Its ODbL terms require an explicit compatibility/derived-database architecture decision before integration.

## Recipe dataset candidates

Third-party recipe datasets remain **not ingested**. Public availability alone is insufficient provenance. Recipe count remains subordinate to source legitimacy, structure, culinary quality and editorial control.

## Cost evidence state

Cost remains a relative deterministic heuristic using project-authored Spain/Canary ingredient classes, package-sensitivity flags, availability assumptions and portfolio reuse. It does not claim current supermarket prices or exact euros per serving.

## Current nutrition state

The app has a bounded 29-record USDA Foundation lane, a bounded 32-record Ciqual lane and an approved deterministic Europe/Canary source-selection policy. Authoritative recipe coverage is still intentionally partial: official ingredient records do not imply that the whole corpus has authoritative recipe nutrition.
