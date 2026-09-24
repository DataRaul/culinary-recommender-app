# D3 Recipe Images — P0 Asset Pilot

Date: **2026-09-24**

Status: **ASSETS BUILT / FULL REPOSITORY VALIDATION PENDING / PUBLIC UI ACTIVATION FALSE**

Entry gate: `D3_RECIPE_IMAGES_P0_DESIGN_CONTRACT_PASS`

## Purpose

Materialize the exact six project-controlled media assets permitted by the P0 design contract, then prove that every file is small, static, accessible by metadata, same-origin, free of remote/active SVG content, and non-authoritative for culinary behavior.

## Exact cohort

The asset pilot covers exactly:

- `spanish_potato_onion_tortilla`
- `med_chicken_orzo_vegetables`
- `indian_chickpea_cauliflower_curry`
- `east_asian_miso_salmon_rice`
- `middle_eastern_mujaddara`
- `latin_chicken_black_bean_tacos`

Each is an existing project-authored recipe in the P0 design cohort.

## Asset implementation

Each recipe receives one project-authored 960 × 720 SVG illustration under:

`/assets/recipes/<recipe-id>.svg`

The SVGs are project-created graphical representations, not copied or transformed source-recipe media.

Every asset is governed by:

- asset class `PROJECT_AUTHORED`;
- reuse state `PROJECT_OWNED_INTERNAL_AND_PUBLIC_APP_USE`;
- project-origin provenance;
- file-content SHA-256 computed by the deterministic pilot builder;
- actual byte count computed from repository bytes;
- fixed dimensions and same-origin path;
- explicit descriptive alt text.

## SVG security gate

The pilot fails closed if any asset contains:

- `<script>`;
- `<foreignObject>`;
- event-handler attributes;
- external HTTP(S) or protocol-relative hrefs;
- embedded raster data URLs;
- `<image>` elements.

This keeps the first media lane as simple static project-owned vector files rather than a general SVG execution surface.

## Performance and accessibility

The P0 design budgets remain controlling:

- <= 180,000 bytes per card asset;
- <= 1,080,000 bytes for all six assets;
- 960 × 720 files within the 1280 × 960 maximum;
- 4:3 presentation contract;
- alt text required;
- missing-image fallback required once browser integration begins;
- image state must never block recipe use.

## Behavioral and rights firewalls

The asset pilot does not change:

- recipe identity;
- recommendation ranking;
- recommendation eligibility;
- hard dietary/allergen filters;
- nutrition authority;
- recipe-source provenance or rights;
- public recipe admission;
- protected v8018 corpus state.

It does not authorize any third-party/source/protected/Wikibooks/Commons/stock media.

## Files

- `config/recipe_images_p0_asset_pilot.json`
- `scripts/recipe-images-p0-asset-pilot.mjs`
- `tests/recipe-images-p0-asset-pilot.test.js`
- six SVGs under `assets/recipes/`

## Non-authorizations

No:

- protected D1 write;
- third shard;
- paid media/API service;
- Knowledge Core write;
- Barbecue workflow/state mutation;
- public UI image activation in this gate.

## Next gate after PASS

`D3_RECIPE_IMAGES_P0_BROWSER_INTEGRATION`

The browser-integration gate may reference only this validated registry/cohort, must preserve deterministic recipe behavior, and must prove alt/fallback/layout/performance behavior before the images become visible in the supported app surfaces.
