# Data Sources & Licensing Audit

Audit date: 2026-08-31.

## Shipped project-authored corpus
The public runtime ships only project-authored structured recipes, ingredient mappings and substitution guidance. No third-party recipe text, photographs or recipe-database dump is bundled.

V0.9.3 established the accepted shell/core baseline. V1 Content Gate A expands the authored corpus, ingredient ontology and substitution graph without changing this provenance boundary.

The repository intentionally has **no general licence yet**. Until a later explicit licensing decision, original repository content remains under default copyright. External source licences are recorded independently and are not implied to license this repository.

### Project-authored V0 recipe corpus
- Source marker: `Culinary Recommender project-authored V0 corpus`
- Source reference: `data/project-authored-v0`
- Recipe provenance state: original project-authored content
- Nutrition state: rough `INFERRED_ESTIMATE`, low confidence

### Project-authored V1 recipe expansion
- Source marker: `Culinary Recommender project-authored V1 corpus`
- Source reference: `data/project-authored-v1`
- Ingestion version: `1.0.0`
- No copied third-party recipe prose or external recipe dataset is used
- Nutrition remains rough `INFERRED_ESTIMATE`, low confidence until authoritative composition is actually imported

### Ingredient ontology and substitution graph
The canonical ingredient ontology, English/Spanish aliases, family relationships and controlled substitution guidance are project-authored application data. Substitutions are deliberately labelled by quality rather than represented as equivalences:

- `close_substitute`
- `functional_substitute`
- `flavour_direction`
- `texture_substitute`
- `dietary_substitute`
- `emergency_approximation`

Allergen and permanent-exclusion constraints override substitution suggestions.

## Nutrition evidence
### USDA FoodData Central Foundation Foods — SOURCE VERIFIED / IDENTITY MAPPING STARTED / COMPOSITION NOT YET BUNDLED
USDA FoodData Central is the selected authoritative source family for the bounded V1 nutrition evidence path.

Verified source facts:

- FoodData Central data are published for public use under CC0 / U.S. public-domain terms;
- Foundation Foods provides analytically derived nutrient/component data and sample metadata for commodity and minimally processed foods;
- the current static Foundation release selected for the evidence ledger is FoodData Central Version 15.0, published 2026-04-30;
- static Foundation downloads are available, so the public application does **not** require a runtime API key or network call.

Official references:
- https://fdc.nal.usda.gov/
- https://fdc.nal.usda.gov/download-datasets/
- https://fdc.nal.usda.gov/log/
- https://fdc.nal.usda.gov/api-guide/

`src/data/nutrition-evidence.js` records the source release and an initial set of verified canonical-ingredient identity matches using the Foundation search catalogue's NDB Number identifiers. These records are deliberately labelled `IDENTITY_VERIFIED_COMPOSITION_PENDING`.

**Important boundary:** a verified ingredient identity is not a nutrient-density import. No USDA nutrient values are currently used to replace the authored per-serving estimates. `src/domain/nutrition.js` exposes evidence coverage separately and contains deterministic mass-based calculation machinery for a future static density table. Unsupported units fail closed rather than being silently converted with guessed weights.

This preserves a clean upgrade path:

`verified USDA identity → static authoritative density extract → unit/weight normalization → per-serving calculation → explicit coverage/confidence → optional recommendation/UI use`

until the density extract exists, current recipe nutrient values remain low-confidence project-authored estimates.

### BEDCA / AESAN — NOT INGESTED
BEDCA remains excluded from bundling unless reuse/licensing constraints are re-checked and explicitly resolved for this public application.

Terms reference: https://www.bedca.net/bdpub/UsoBD.pdf

### Open Food Facts — COMPATIBILITY REVIEW REQUIRED
Open Food Facts remains unbundled. Its ODbL database terms require an explicit compatibility and derived-database architecture decision before any integration into the canonical public data layer.

Terms overview: https://support.openfoodfacts.org/help/es-es/12/api-data-reuse/94-are-there-conditions-to-use-the-api

## Recipe dataset candidates
Previously identified third-party recipe datasets remain **not ingested**. Public visibility alone is not sufficient provenance. Any future recipe source must pass source-chain, licence, attribution, transformation and canonical-schema review before inclusion.

Recipe count is subordinate to provenance, structure, culinary quality and editorial control.

## Cost evidence state
Cost remains a relative deterministic heuristic rather than live market data. V1 adds project-authored Spain/Canary ingredient cost classes, package-sensitivity flags, availability assumptions and portfolio reuse effects. These are intentionally low-confidence planning heuristics; they do not claim current supermarket prices or exact euros per serving.

## Current nutrition state
Project-authored recipe nutrient values are rough, low-confidence `INFERRED_ESTIMATE` values used for ranking and UI. They must not be presented as authoritative composition data. The USDA identity ledger improves provenance readiness, not numeric precision. Authoritative values may replace estimates only after the static composition records and unit-normalization coverage are actually committed and validated.
