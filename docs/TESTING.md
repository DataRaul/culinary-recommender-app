# Testing

## Local deterministic suite
`npm run validate` runs static syntax/structure checks and Node tests with no network dependency.

Coverage includes:
- ingredient normalization and form distinction;
- deterministic ranking and tie-breaking;
- hard dietary/allergen/time/skill filters;
- availability and substitution safety;
- target five-meal vegetarian/high-protein scenario;
- portfolio diversity and swap-one-dish invariants;
- grocery aggregation/pantry separation;
- persistence/version import-export;
- 15,552-combination profile matrix;
- fridge-search main-ingredient hard filtering;
- secondary-ingredient ranking and require-all behavior;
- temporary time/skill/discovery overrides without saved-profile mutation;
- preservation of allergen hard constraints in ingredients-first mode.

## Browser smoke
Public CI installs pinned Playwright/Chromium and verifies a 390×844 mobile flow: load → vegetarian/high-protein plan → plan screen → groceries → pantry → Search tab → ingredient-first results. Tests run against a local static server and do not call third-party APIs.

## CI cost policy
One standard Ubuntu job, no matrix, no larger runners. The repository is public, so validation is intended to use GitHub's standard public-repository Actions allowance rather than private-repository minutes.
