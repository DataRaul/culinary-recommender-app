# Testing

## Local deterministic suite
`npm run validate` runs static syntax/structure checks and Node tests with no network dependency.

Coverage includes:
- ingredient normalization and form distinction;
- deterministic ranking and tie-breaking;
- hard dietary/allergen/time/skill filters;
- permanent exact and ingredient-family exclusions;
- availability and substitution safety;
- target five-meal vegetarian/high-protein scenario;
- portfolio diversity and swap-one-dish invariants;
- grocery aggregation/pantry separation;
- persistence/version import-export;
- 15,552-combination profile matrix;
- priority-pack uniqueness, three-pack cap and meal-scope activation;
- migration from the former one-choice preset field;
- bounded priority-pack scoring without hard-constraint relaxation;
- fridge-search main-ingredient hard filtering;
- secondary-ingredient ranking and require-all behavior;
- temporary meal/time/skill/discovery overrides without saved-profile mutation;
- neutral ingredient-first search clearing soft cuisine/priority-pack preferences while preserving allergen and permanent-exclusion constraints;
- Brain public-policy provenance pinning, source-safe/non-clinical hard boundaries and explicit prohibition of private Knowledge Core runtime dependency;
- a calibration-only Brain guard that fails if public runtime source code starts importing `brain-public-policy-v1.js` before a separately authorized behavior gate;
- Gate F external RecipeSource licensing/provenance pins, canonical ingredient resolution, dish-family normalization and nutrition-source separation;
- Gate F fail-closed recommendation governance: reference-only records never enter recommendation, Search-only records are limited to Search, and allergens/permanent exclusions remain hard;
- frozen authored nutrition coverage remaining scoped to the 76 authored recipes while generic corpus audits may inspect the 84-recipe universe;
- truthful recipe-universe coverage reporting, including missing contemporary/modern and genuinely-new/trending roles rather than invented classifications;
- B7 exact three-record Ciqual provenance and explicit deferred-target assertions;
- B7 regression proof for no averaging, no carbohydrate-semantic relaxation and no Ciqual-D-over-USDA displacement;
- missing tracked nutrient fields audited separately from skipped density/quantity blockers.

## Gate F deterministic evidence checks

The Gate F candidate runs all of the following before PR cleanup:

```bash
npm run validate
npm run test:matrix
npm run report:recipe-universe
npm run verify:wikibooks-gate-f
npm run test:browser
```

`verify:wikibooks-gate-f` is the only networked candidate check: it verifies the eight frozen MediaWiki revision IDs against the official Wikibooks API. Runtime application behavior remains static and has no Wikibooks API dependency.

The deterministic recipe-universe audit is expected to report 84 total recipes: 76 authored plus eight exact-revision Wikibooks records, 83 dish families, one explicit cross-source family, two Search-only external recipes and six reference-only external records. Unknown source-backed hard metadata stays unknown.

## Nutrition B7 checks

Candidate run `33455005170` passed 100/100 Node tests, the 15,552-profile matrix, nutrition and recipe-universe reports, exact Wikibooks verification and all browser layers. The authored audit must remain **0/76 authoritative** and measures missing-density **141→133**, unsupported quantity **27**, ambiguous portions **20**, and mixed carbohydrate semantics **16**. Any apparent gain that needs guessed food forms, quantity conversions, missing nutrient values or carbohydrate equivalence fails closed.

## Browser acceptance
Public CI installs pinned Playwright/Chromium and runs three browser layers against a local static server. Application runtime behavior uses no live third-party data.

### Targeted smoke
390×844 mobile flow covering load → planning → groceries → pantry → Search.

### Comprehensive acceptance
The broader flow exercises:
- 390×844 mobile layout with no horizontal overflow;
- three meal-scoped priority packs and rejection of a fourth;
- independent Indian + Thai/Southeast Asian cuisine multi-select and Local/Canarian availability;
- exact two-slot lunch/dinner planning;
- one-dish swap without plan-size mutation;
- grocery aggregation;
- current-pantry persistence;
- temporary `Can't get right now` state;
- substitution output;
- permanent `Always exclude` state;
- family-wide coconut exclusion blocking the current coconut-milk recipe;
- future pineapple exclusion persistence even though pineapple is not yet in the V0 corpus;
- fridge Search honoring permanent exclusions;
- salmon + rice secondary-ingredient ranking and require-all behavior;
- user-facing fish allergen selection blocking salmon Search;
- JSON export/import round trip;
- 1280×900 desktop layout with no horizontal overflow;
- service-worker control and offline shell reload.

### Gate F external-corpus acceptance
The Gate F browser layer proves that:
- the runtime status truthfully reports `84 recipes · 76 curated + 8 open external · deterministic`;
- an aubergine Search surfaces Wikibooks Baba Ganoush;
- the result is visibly labelled as an open external recipe;
- nutrition is shown as `evidence pending`, not as an invented or source-imported authoritative value;
- exact revision `4629606`, CC BY-SA 4.0, Wikibooks contributor attribution and the transformation notice are visible;
- the source page and exact-revision URLs are present;
- the source-nutrition firewall is visible;
- Search-only Baba Ganoush and Bruschetta do not leak into weekly planning.

The browser suite is intended to catch integration, persistence and interaction failures that pure domain tests cannot see. It does not claim to represent every physical device/browser combination or subjective recommendation quality.

The current Brain P0 app artifact is calibration-only and intentionally disconnected from runtime ranking, so existing authored-recipe expectations must remain unchanged except for the explicitly gated external Search lane. A later Brain-derived behavior gate must add browser cases for every user-visible behavior it changes.

## CI cost policy
One standard Ubuntu job per validation workflow, no matrix, no larger runners. The repository is public, so validation uses GitHub's standard public-repository Actions allowance rather than private-repository minutes.

## Nutrition B8 candidate checks

B8 adds deterministic proof that the SR Legacy final-release raw-onion row is pinned exactly to FDC `170000`, NDB `11282`, portion row `85862`, modifier `small`, 70 g; only canonical `onion|small` may use it. Generic onion piece stays on the B6 Matvaretabellen 160 g mapping, red onion and other size classes remain unsupported by this evidence, and SR Legacy is not a composition source in B8.

The B8 review-decision tests also prove that partial/form-qualified Foundation candidates remain unpromoted, crushed canned tomato does not become passata, prepared edamame is not forced onto an unspecified form, generic paprika does not become smoked paprika, and missing nutrient fields remain unknown rather than assumed zero.
