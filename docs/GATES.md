# Gate Registry

## Gate 1 — COMPLETE
Foundation and governance. No Culinary Brain created and no private Knowledge Core content copied into runtime.

## Gate 2 — COMPLETE
Canonical schema, ingredient hierarchy/aliases, provenance, deterministic project-authored corpus and data-source audit.

## Gate 3 — COMPLETE
Composable profile dimensions; hard constraints run before ranking; component scores are inspectable; identical inputs produce identical ranking.

## Gate 4 — COMPLETE
Exact lunch/dinner slot selection, deterministic group optimization, diversity/reuse adjustment and isolated recipe swap.

## Gate 5 — COMPLETE
Combined grocery list, pantry assumptions, current-pantry preference, temporary cannot-obtain memory, durable ingredient exclusions, labelled substitution types and relative €–€€€€ estimates. Temporary unavailability and permanent dislike are deliberately separate semantics.

## Gate 6 — COMPLETE
Mobile-first navigation, onboarding, plan, groceries, pantry, profile/export-import, declared-allergen controls, shortfall/error communication, focus/contrast/touch/reduced-motion baseline.

## Gate 7 — COMPLETE
Local and public CI validation pass. Matrix covers 15,552 deterministic profile combinations. Public GitHub Actions runs static/domain validation plus targeted and comprehensive Chromium browser acceptance on standard hosted runners, including responsive and offline-PWA checks.

## Gate 8 — COMPLETE
Public deployment verified at https://dataraul.github.io/culinary-recommender-app/. Hosting is deliberately simple: GitHub Pages publishes from `main` / repository root, with no dedicated Pages deployment workflow.

## Gate 9 — ACCEPTED
The original 15-point human acceptance review passed.

## Gate 9A — ACCEPTED
V0.9.1 deterministic fridge-first Search is accepted as core functionality. Main ingredient is a hard pre-filter; optional secondary ingredients are ranking preferences unless explicitly required. Search can temporarily override time, skill ceiling and discovery mood without mutating the saved profile. Choosing an ingredients-first lens neutralizes soft profile preferences only; dietary mode, declared allergens, permanent exclusions and unavailable ingredients remain hard constraints.

## Gate 9B — ACCEPTED
V0.9.2 composable profile functionality is accepted as core functionality. The mutually exclusive preset dropdown is replaced with up to three composable **priority packs**, each scoped to all meals, lunch or dinner. Priority packs remain bounded soft ranking signals and cannot relax hard constraints. Cuisine preferences remain independent multi-select signals, with broad discovery foregrounded and Local / Canarian retained without special priority. Search has optional lunch/dinner context so scoped packs apply coherently.

## V0.9.3 preference safety + broad automation — ACCEPTED BASELINE
The integrated shell/core baseline is accepted:

- Pantry separates **Can't get right now** from **Always exclude**;
- permanent ingredient exclusions are hard and substitution-proof;
- permanent exclusion storage is a deduplicated local list with no product-level small-number cap;
- ontology-family exclusions are supported and future exclusion tokens persist;
- mapped allergen hard filters constrain substitutions as well as recipes;
- broad automated browser acceptance exercises integrated user journeys in addition to the 15,552-profile deterministic matrix.

Future recipe, ingredient, nutrition-evidence, price, image and UX additions are additive. They do not reopen this accepted shell/core gate unless a later change materially alters these contracts.

## V1 Content Gate A — COMPLETE
Merged through PR #6 to `main` at `1742bd40691cca614db2e12ccaa47499bea48a57` after green deterministic and comprehensive Chromium validation. Post-merge validation and GitHub Pages deployment also passed.

Delivered:
- materially broader project-authored structured recipe corpus;
- expanded canonical ingredient ontology with English/Spanish aliases;
- hierarchical family membership for generalized exclusions;
- six-class controlled substitution graph;
- full-corpus integrity coverage plus the existing 15,552-profile matrix;
- additive V1 runtime bootstrap and offline caching;
- no third-party recipe database, paid API, runtime LLM or private Knowledge Core runtime dependency.

## V1 Content Gate B — EVIDENCE FOUNDATION IMPLEMENTED / COMPOSITION IMPORT PENDING
The authoritative nutrition path is now structurally separated from the current estimates:

- USDA FoodData Central Foundation Foods is source/licence verified for static use;
- selected source release is Version 15.0 / 2026-04-30;
- an initial canonical-ingredient identity ledger records verified Foundation catalogue matches;
- identity records are explicitly `IDENTITY_VERIFIED_COMPOSITION_PENDING`;
- a concrete public `NutritionSource` reports evidence coverage without relabelling current estimates as authoritative;
- deterministic per-serving calculation machinery accepts only supported mass units and reports partial/unsupported coverage rather than guessing piece/tablespoon weights.

This is a legitimate bounded terminal state for the evidence foundation. Gate B is **not** claiming authoritative nutrient composition yet. The remaining B tranche is a static composition-density import plus unit/weight normalization coverage.

## V1 Content Gate C — IMPLEMENTED / VALIDATION_PENDING
Cost intelligence now combines:

- existing project-authored per-recipe cost tiers as the strongest prior;
- deterministic ingredient cost classes;
- Spain/Canary availability assumptions;
- one-off package burden;
- cross-meal ingredient reuse credit;
- explicit low confidence and no live-price/fake-euro claim.

The existing `estimatePortfolioCost` contract is preserved while returning additional explainable portfolio fields.

## V1 Content Gate D — IMPLEMENTED / VALIDATION_PENDING
A deterministic full-corpus culinary-quality layer now normalizes:

- explicit and instruction-inferred techniques;
- failure risk;
- active/passive execution load;
- equipment burden;
- difficulty / technique depth;
- meal-prep, batch, freezer, leftover and portability suitability;
- flavour, spice, familiarity, novelty and learning value;
- exploration and convenience scores.

Technique inference is deterministic over project-authored instructions and remains inspectable; it is not runtime generation.

## Brain P0 — NOT AUTHORIZED
The dedicated Culinary & Nutrition Brain remains a separate future human authorization boundary. This repository may prepare stable public interfaces and evidence artifacts but must not create or call the Brain early.

## Deferred
D1 nutrient-gap awareness, D2 supplement routine checker, D3 images, D4 live/local grocery prices, D5 fitness integration, D6 advanced culinary exploration and Brain P0 remain DEFERRED/NOT_AUTHORIZED rather than failed.
