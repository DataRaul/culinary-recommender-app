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
- a calibration-only Brain guard that fails if public runtime source code starts importing `brain-public-policy-v1.js` before a separately authorized behavior gate.

## Browser acceptance
Public CI installs pinned Playwright/Chromium and runs two browser layers against a local static server with no live third-party data.

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

The browser suite is intended to catch integration, persistence and interaction failures that pure domain tests cannot see. It does not claim to represent every physical device/browser combination or subjective recommendation quality.

The current Brain P0 app artifact is calibration-only and intentionally disconnected from runtime ranking, so the existing browser expectations must remain unchanged. A later Brain-derived behavior gate must add browser cases for every user-visible behavior it changes.

## CI cost policy
One standard Ubuntu job, no matrix, no larger runners. The repository is public, so validation uses GitHub's standard public-repository Actions allowance rather than private-repository minutes.
