# Data Sources & Licensing Audit

Audit date: 2026-08-31.

## Shipped project-authored corpus
The public runtime ships only project-authored structured recipes, ingredient mappings and substitution guidance. No third-party recipe text, photographs or recipe-database dump is bundled.

The repository intentionally has **no general licence yet**. Until a later explicit licensing decision, original repository content remains under default copyright. External source licences are recorded independently and are not implied to license this repository.

### Project-authored recipe corpus
- V0 source reference: `data/project-authored-v0`
- V1 source reference: `data/project-authored-v1`
- recipes remain original project-authored structured content;
- no copied third-party recipe prose or external recipe dataset is used;
- recipe nutrition fields remain low-confidence `INFERRED_ESTIMATE` values unless a recipe obtains complete authoritative static coverage through the separate NutritionSource.

### Ingredient ontology and substitution graph
The canonical ingredient ontology, English/Spanish aliases, family relationships and controlled substitution guidance are project-authored application data. Substitutions are labelled `close_substitute`, `functional_substitute`, `flavour_direction`, `texture_substitute`, `dietary_substitute`, or `emergency_approximation`. Allergen and permanent-exclusion constraints override substitution suggestions.

## Nutrition evidence
### USDA FoodData Central Foundation Foods — BOUNDED STATIC COMPOSITION CANDIDATE
USDA FoodData Central is the selected authoritative source family for V1 nutrition evidence.

Verified source facts:
- FoodData Central data are public-use CC0 / U.S. public-domain data;
- Foundation Foods provides analytically derived nutrient/component data and underlying metadata;
- selected release: FoodData Central Version 15.0, published 2026-04-30;
- official static Foundation downloads are available, so the public application requires no runtime API key or network call.

Official references:
- https://fdc.nal.usda.gov/
- https://fdc.nal.usda.gov/download-datasets/
- https://fdc.nal.usda.gov/log/
- https://fdc.nal.usda.gov/Foundation_Foods_Documentation/

### Bounded extraction method
A temporary standard-public-run workflow downloaded the official archive:

`FoodData_Central_foundation_food_csv_2026-04-30.zip`

The reusable script `scripts/extract-usda-foundation.mjs` joined `foundation_food.csv`, `food.csv` and `food_nutrient.csv` and selected only the already-reviewed canonical ingredient identities. The bulk USDA archive is **not** committed.

`src/data/usda-foundation-nutrients-v1.js` contains the resulting bounded per-100g records for 14 canonical ingredients:

- chicken breast;
- black, cannellini/white, pinto and kidney beans;
- green beans;
- Hass avocado;
- ripe banana;
- canned light tuna in water;
- raw cashews, almonds and walnuts;
- raw pumpkin and sunflower seeds.

Each record preserves NDB number, FDC ID, Foundation description, publication date, per-100g values and nutrient identifiers.

### Tracked nutrient semantics
Tracked fields are:
- protein — nutrient `1003`;
- total fat — `1004`;
- carbohydrate by difference — `1005`;
- fibre — `1079` where published;
- energy — prefer `2048` (Metabolizable Energy, Atwater Specific Factors), with architecture-level fallback to `2047` (Atwater General Factors) and legacy `1008` only when needed.

Foundation records do not always publish every tracked field. Missing fields are stored as `null`; **null is never interpreted as zero**.

### Recipe calculation boundary
`src/domain/nutrition.js` accepts only explicit mass quantities (`g`/`kg`) for authoritative static calculation today. Unsupported piece, spoon, cup or other units are not assigned hidden generic weights.

For each tracked nutrient the calculator reports whether every required recipe ingredient is covered. A recipe-level USDA calculation becomes primary only when:
1. every required ingredient has a matched static density;
2. every required ingredient quantity is a supported mass unit;
3. every tracked nutrient is present across all required ingredients.

Otherwise the project-authored estimate remains primary and the partial static calculation is exposed only as evidence/coverage metadata. This avoids false precision while allowing authoritative coverage to grow incrementally.

Even a complete static ingredient calculation is labelled medium confidence because recipe cooking/yield effects and food-form assumptions can still matter.

### BEDCA / AESAN — NOT INGESTED
BEDCA remains excluded unless reuse/licensing constraints are re-checked and explicitly resolved for this public application.

### Open Food Facts — COMPATIBILITY REVIEW REQUIRED
Open Food Facts remains unbundled. Its ODbL terms require an explicit compatibility and derived-database architecture decision before integration.

## Recipe dataset candidates
Previously identified third-party recipe datasets remain **not ingested**. Public visibility alone is not sufficient provenance. Recipe count remains subordinate to provenance, structure, culinary quality and editorial control.

## Cost evidence state
Cost is a relative deterministic heuristic rather than live market data. V1 uses project-authored Spain/Canary ingredient classes, package-sensitivity flags, availability assumptions and portfolio reuse effects. These are intentionally low-confidence planning heuristics and do not claim current supermarket prices or exact euros per serving.

## Current nutrition state
The app now has a real authoritative static evidence lane, but coverage is intentionally partial. Most recipe cards may still display the existing low-confidence project estimate until their entire required ingredient/quantity set is covered. The existence of some USDA ingredient records must never be presented as if the whole corpus has authoritative recipe nutrition.
