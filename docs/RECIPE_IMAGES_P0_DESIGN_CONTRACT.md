# D3 Recipe Images — P0 Design Contract

Date: **2026-09-24**

Status: **CONTRACT BUILT / FULL REPOSITORY VALIDATION PENDING / NO IMAGE ASSET PUBLISHED**

Entry terminal: `FURTHER_PRODUCT_FEATURES_READINESS_PASS`

## Objective

Add a media layer only after the culinary app's text, data, recommendation and scale foundations are strong, without letting images become a new source of recipe truth, licensing ambiguity, layout instability or performance debt.

P0 is a **design contract**, not an image launch.

## Bounded pilot cohort

The first pilot is frozen to six existing **project-authored** public recipes:

1. `spanish_potato_onion_tortilla`
2. `med_chicken_orzo_vegetables`
3. `indian_chickpea_cauliflower_curry`
4. `east_asian_miso_salmon_rice`
5. `middle_eastern_mujaddara`
6. `latin_chicken_black_bean_tacos`

No external Wikibooks, UniTools, protected v8018 or other source recipe is in the P0 media cohort.

## Media authority boundary

P0 permits only asset classes whose reuse basis is directly controlled and recorded by the project:

- `PROJECT_AUTHORED`;
- `PROJECT_COMMISSIONED_OR_GENERATED_WITH_RECORDED_PROVENANCE`.

P0 explicitly forbids:

- third-party recipe-source images;
- protected-corpus source images;
- Wikibooks/Commons media;
- stock media;
- remote third-party image URLs.

Text/data rights never imply media rights.

A later media-rights gate may independently review a specific third-party asset, but that is outside P0.

## Asset record

Every pilot asset must record:

- stable asset ID;
- exact recipe ID;
- asset class;
- explicit reuse state;
- provenance including origin and rights basis;
- SHA-256 content fingerprint;
- same-origin asset path;
- format;
- pixel width/height;
- byte size;
- descriptive alt text.

P0 permits one primary card asset per pilot recipe.

## Accessibility and missing-image behavior

An image is enhancement only.

- alt text is mandatory and capped at 180 characters;
- recipe text, ingredient information, recommendation eligibility and actions must remain usable without an image;
- missing assets require a deterministic fallback;
- fallback may not suppress or demote a valid recipe;
- layout must reserve a stable 4:3 media region to prevent avoidable content shift.

## Performance budget

Per card asset:

- maximum **180,000 bytes**;
- maximum dimensions **1280 × 960**;
- formats: WebP, AVIF, PNG or SVG.

Whole six-recipe pilot:

- maximum **1,080,000 bytes**.

Non-critical assets should lazy-load and prefer asynchronous decode. P0 assets must be same-origin static files under:

`/assets/recipes/`

No runtime third-party image request is permitted.

## Behavioral firewalls

Image state is never authority for:

- ranking;
- recommendation eligibility;
- nutrition;
- dietary/allergen classification;
- recipe identity;
- recipe-source rights;
- public recipe admission;
- protected corpus mutation.

A recipe with no image is semantically identical to the same recipe with an image for all deterministic culinary logic.

## Repository implementation

P0 adds:

- `config/recipe_images_p0.json` — frozen design contract;
- `scripts/recipe-images-p0.mjs` — contract/asset/registry validation;
- `tests/recipe-images-p0.test.js` — deterministic media-rights, accessibility, same-origin and performance firewalls.

No binary/image asset is introduced by this gate.

## Hard non-authorizations

P0 does not authorize:

- image publication;
- public runtime behavior changes;
- third-party media ingestion;
- protected D1 writes;
- third recipe shard;
- paid image generation/stock/API services;
- Knowledge Core writes;
- Barbecue workflow/state mutation.

## Next gate

`D3_RECIPE_IMAGES_P0_ASSET_PILOT`

That gate must create or otherwise obtain the six assets under the P0 allowed asset classes, validate every record and file against this contract, and then separately prove browser accessibility/performance before any public activation.
