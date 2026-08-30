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
- priority-pack uniqueness, three-pack cap and meal-scope activation;
- migration from the former one-choice preset field;
- bounded priority-pack scoring without hard-constraint relaxation;
- fridge-search main-ingredient hard filtering;
- secondary-ingredient ranking and require-all behavior;
- temporary meal/time/skill/discovery overrides without saved-profile mutation;
- neutral ingredient-first search clearing soft cuisine/priority-pack preferences while preserving allergen constraints.

## Browser smoke
Public CI installs pinned Playwright/Chromium and verifies a 390×844 mobile flow: load → select three priority packs with lunch/dinner scopes → reject a fourth pack → verify Indian / Thai-Southeast Asian / Local-Canarian cuisine choices → vegetarian/high-protein plan → groceries → pantry → Search tab with dinner context → ingredient-first results. Tests run against a local static server and do not call third-party APIs.

## CI cost policy
One standard Ubuntu job, no matrix, no larger runners. The repository is public, so validation is intended to use GitHub's standard public-repository Actions allowance rather than private-repository minutes.
