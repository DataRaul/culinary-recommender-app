# Data Sources & Licensing Audit

Audit date: 2026-08-30.

## Shipped V0 corpus
V0 ships only project-authored structured recipes and ingredient mappings. No third-party recipe text, photographs or database dump is bundled. This keeps the first public runtime legally narrow while the data architecture is validated.

The repository intentionally has **no general licence yet**. Until a later explicit licensing decision, original repository content remains under default copyright. External source licences are recorded independently and are not implied to license this repository.

## Nutrition candidates
### USDA FoodData Central — APPROVED CANDIDATE, NOT YET INGESTED
USDA states FoodData Central data are public domain and published under CC0 1.0. Its API requires a data.gov API key, so V0 tests/runtime do not call it. A later controlled offline import is compatible with the architecture and can preserve FDC IDs/provenance.

Official reference: https://fdc.nal.usda.gov/api-guide/

### BEDCA / AESAN — EXCLUDED FROM V0 BUNDLING
BEDCA's published conditions permit public access but state that non-personal/educational/non-commercial electronic reuse is subject to express authorization, and data may not be altered in meaning. Because this public consumer application should not inherit an ambiguous/non-commercial-only data dependency, BEDCA is not bundled in V0.

Terms reference: https://www.bedca.net/bdpub/UsoBD.pdf

### Open Food Facts — COMPATIBILITY REVIEW REQUIRED
The database is ODbL and requires attribution/share-alike for derivative databases. That can be useful for branded-product intelligence later, but combining it into the app's own canonical database raises database-licensing architecture questions. V0 therefore does not bundle it.

Terms overview: https://support.openfoodfacts.org/help/es-es/12/api-data-reuse/94-are-there-conditions-to-use-the-api

## Recipe dataset candidates
- ForkRecipe: CC BY-SA 4.0; structured and promising, but share-alike/provenance implications should be designed before ingestion.
- Epicurious-derived 5k dataset examples online: CC BY-SA 3.0 is asserted by downstream repositories; source-chain verification is needed before use.
- Open Recipe Archive: project states original repository data are CC0, but it is young/small and still needs source-level review.

No candidate is ingested merely because it is publicly visible. Recipe count is subordinate to provenance, structure and editorial quality.

## V0 nutrition state
Project-authored recipe nutrient values are rough, low-confidence `INFERRED_ESTIMATE` values used to exercise ranking and UI. They must not be presented as authoritative composition data. Replacing these with normalized authoritative ingredient composition is a V1 data task, not a silent rewrite.
