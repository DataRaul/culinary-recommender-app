# Human Acceptance Review — Gate 9 / 9A / 9B

## Gate 9 — ACCEPTED
The original public V0 review passed, covering onboarding, representative profiles, exact-slot planning, swapping, availability, substitutions, groceries, cost wording, pantry editing, mobile use, constrained profiles, confusing UI and obviously wrong recommendations.

## V0.9.3 — OBJECTIVE ACCEPTANCE AUTOMATED
The formerly manual objective checks from Gates 9A/9B are now covered by deterministic tests and Chromium acceptance flows in public CI. The latest candidate automatically verifies:

- **salmon + rice** ingredient ranking;
- **require all secondary ingredients** filtering;
- temporary Search time/skill/discovery overrides without mutating the saved profile;
- safety-conflicting Search failing closed rather than relaxing constraints;
- up to three composable priority packs with lunch/dinner/all-meals scope;
- rejection of a fourth priority pack;
- independent multi-select cuisine preferences including Indian and Thai / Southeast Asian, with Local / Canarian retained later in the chooser;
- exact lunch/dinner slot planning and one-dish swap invariants;
- groceries and pantry persistence;
- temporary **Can't get right now** availability state plus supported substitution handling;
- durable **Always exclude** hard preferences;
- family-wide **coconut** exclusion blocking the current coconut-milk recipe and substitution re-entry;
- future **pineapple** exclusion persistence despite no current V0 pineapple recipe;
- user-facing mapped allergen hard filters, including Fish blocking salmon Search;
- JSON export/import round trip;
- mobile and desktop horizontal-overflow checks;
- service-worker control and offline shell reload.

The automated suite also retains the 15,552-combination representative profile matrix and direct deterministic domain tests. Automated success establishes implementation invariants, not subjective food quality or universal device/browser compatibility.

## REMAINING HUMAN HARD STOP
Before declaring V1.0, only the irreducibly human product checks remain:

1. Open the deployed app on your actual device and confirm the interaction feels understandable and comfortable rather than merely technically functional.
2. Look at a few recommendations you would personally consider cooking and confirm they feel sensible/appetizing for the selected priorities.
3. Flag any wording, hierarchy or interaction that is confusing even though automation passes.
4. If the candidate feels ready, explicitly accept it.

You do **not** need to repeat the objective interaction checklist that CI now covers.

Failure report format: **screen / profile or action / expected / observed / screenshot if useful**.
