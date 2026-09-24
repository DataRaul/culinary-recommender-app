# D3 Recipe Images — P0 Browser Integration

Date: **2026-09-24**

Status: **BUILT / FULL REPOSITORY + BROWSER VALIDATION PENDING**

Entry terminal: `D3_RECIPE_IMAGES_P0_ASSET_PILOT_PASS`

## Objective

Activate only the exact six already-validated project-authored P0 image assets in supported public recipe cards while proving that media remains optional presentation and cannot change culinary behavior.

## Exact activation scope

The browser registry is frozen to the asset-pilot cohort:

- `spanish_potato_onion_tortilla`
- `med_chicken_orzo_vegetables`
- `indian_chickpea_cauliflower_curry`
- `east_asian_miso_salmon_rice`
- `middle_eastern_mujaddara`
- `latin_chicken_black_bean_tacos`

The integrated surfaces are:

- meal-plan recipe cards;
- ingredient-search result cards.

Recipes outside this exact registry render exactly as before, with no empty media reservation.

## Runtime behavior

`src/recipe-images-p0-runtime.js` owns the small public-safe media registry and presentation helper.

For a pilot recipe the card receives:

- a same-origin static SVG path;
- validated registry alt text;
- explicit 960 × 720 intrinsic dimensions;
- `loading="lazy"`;
- `decoding="async"`;
- a reserved 4:3 container;
- a deterministic fallback layer.

The image begins hidden behind the fallback. A successful load switches the container to `data-image-state="loaded"`. A failed or unavailable image switches it to `data-image-state="error"`, leaving the complete recipe card, ingredients, method and actions usable.

## Offline behavior

The service worker cache version is advanced and precaches:

- the P0 media runtime module;
- exactly the six validated P0 SVG files.

Protected API routes and protected/generated corpus paths retain their existing network-only rules.

## Behavioral firewall

This integration changes presentation only.

It does not change:

- public recipe count (**85**);
- recommendation eligibility;
- ranking/scoring;
- search semantics;
- planner semantics;
- nutrition;
- dietary/allergen/permanent-exclusion hard filters;
- recipe identity;
- source attribution or rights;
- protected v8018 corpus;
- protected D1 state.

A recipe with a failed image remains the same recipe with the same deterministic behavior.

## Media rights boundary

UI activation applies only to the six project-authored P0 SVGs.

Still forbidden:

- third-party recipe-source media;
- protected-corpus source media;
- Wikibooks/Commons media;
- stock media;
- remote media URLs;
- implicit media rights inherited from recipe-text rights.

## Acceptance

Repository tests verify exact registry parity with the validated asset pilot, same-origin paths, lazy/async attributes, 4:3 layout, service-worker caching and all authority firewalls.

Dedicated Playwright acceptance proves:

1. a P0 image loads on a mobile ingredient-search result;
2. alt text and intrinsic dimensions are present;
3. the displayed media box stays approximately 4:3;
4. mobile horizontal overflow is not introduced;
5. an intentionally failed SVG request displays the deterministic fallback;
6. the recipe title, reason and Ingredients & method remain usable after image failure.

## Non-authorizations

No:

- new recipe admission;
- external media admission;
- protected D1 write;
- third recipe shard;
- paid media/API service;
- Knowledge Core write;
- Barbecue workflow/state mutation.

## PASS terminal

`D3_RECIPE_IMAGES_P0_BROWSER_INTEGRATION_PASS`

After PASS, close D3 P0 with the exact six-asset browser pilot as the earned baseline. Broader image coverage is a separate expansion gate rather than automatic.
