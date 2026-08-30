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
- Nutrition remains rough `INFERRED_ESTIMATE`, low confidence until the separate Nutrition Evidence Upgrade

### Ingredient ontology and substitution graph
The canonical ingredient ontology, English/Spanish aliases, family relationships and controlled substitution guidance are project-authored application data. Substitutions are deliberately labelled by quality rather than represented as equivalences:

- `close_substitute`
- `functional_substitute`
- `flavour_direction`
- `texture_substitute`
- `dietary_substitute`
- `emergency_approximation`

Allergen and permanent-exclusion constraints override substitution suggestions.

## Nutrition candidates
### USDA FoodData Central — APPROVED CANDIDATE, NOT YET INGESTED
USDA FoodData Central remains the leading candidate for the V1 nutrition evidence upgrade. Runtime API access is not required: the preferred architecture is a bounded, static, provenance-preserving preprocessing step that retains authoritative source identifiers and uncertainty state.

Official reference: https://fdc.nal.usda.gov/api-guide/

No USDA nutrient values are bundled by Content Gate A. Current recipe nutrient values remain project-authored estimates rather than authoritative composition data.

### BEDCA / AESAN — NOT INGESTED
BEDCA remains excluded from bundling unless reuse/licensing constraints are re-checked and explicitly resolved for this public application.

Terms reference: https://www.bedca.net/bdpub/UsoBD.pdf

### Open Food Facts — COMPATIBILITY REVIEW REQUIRED
Open Food Facts remains unbundled. Its ODbL database terms require an explicit compatibility and derived-database architecture decision before any integration into the canonical public data layer.

Terms overview: https://support.openfoodfacts.org/help/es-es/12/api-data-reuse/94-are-there-conditions-to-use-the-api

## Recipe dataset candidates
Previously identified third-party recipe datasets remain **not ingested**. Public visibility alone is not sufficient provenance. Any future recipe source must pass source-chain, licence, attribution, transformation and canonical-schema review before inclusion.

Recipe count is subordinate to provenance, structure, culinary quality and editorial control.

## Current nutrition state
Project-authored recipe nutrient values are rough, low-confidence `INFERRED_ESTIMATE` values used for ranking and UI. They must not be presented as authoritative composition data. Replacing them progressively with normalized authoritative ingredient composition is a separate V1 evidence task and must preserve provenance and uncertainty rather than silently adding false precision.
