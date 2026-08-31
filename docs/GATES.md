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
V0.9.2 composable profile functionality is accepted as core functionality. Up to three priority packs remain bounded soft ranking signals and cannot relax hard constraints. Cuisine preferences remain independent multi-select signals.

## V0.9.3 preference safety + broad automation — ACCEPTED BASELINE
The integrated shell/core baseline is accepted. Permanent exclusions, temporary availability, allergens and pantry state remain semantically distinct; family exclusions and future exclusion tokens persist; broad browser acceptance protects the integrated flows. Routine content/evidence growth does not reopen this gate.

## V1 Content Gate A — COMPLETE
Merged through PR #6 to `main` at `1742bd40691cca614db2e12ccaa47499bea48a57` after green deterministic and comprehensive Chromium validation. Post-merge validation and GitHub Pages deployment passed.

Delivered materially broader project-authored recipes, bilingual/hierarchical ingredient ontology, generalized exclusions and a six-class controlled substitution graph without third-party recipe ingestion, paid APIs, runtime LLM or private Knowledge Core runtime dependency.

## V1 Content Gate B1 — COMPLETE
Merged through PR #8 to `main` at `5dc9c668df8ac96361657cd403b95bf05e859ac9`; PR validation, the 15,552-profile matrix, Chromium acceptance, post-merge validation and Pages deployment all passed.

The first authoritative nutrition tranche remains deliberately bounded:

- USDA FoodData Central Foundation Foods Version 15.0 / 2026-04-30 is the source release;
- a reproducible extractor downloaded the official static CSV archive and resolved 14 canonical ingredients to Foundation FDC IDs;
- only the bounded per-100g composition records are committed, not the USDA bulk database;
- energy prefers nutrient `2048` (Atwater Specific Factors), with documented fallback architecture;
- protein (`1003`), carbohydrate (`1005`), fat (`1004`) and fibre (`1079`) remain individually provenance-aware;
- missing tracked nutrients remain `null`, never zero;
- only explicit `g`/`kg` quantities currently qualify for authoritative deterministic calculation;
- unsupported units, unmapped ingredients and missing nutrients make the calculation partial rather than guessed;
- the project-authored recipe estimate remains primary unless every required ingredient, tracked nutrient and unit is complete;
- complete mass-only coverage can produce a medium-confidence static calculation while retaining cooking/yield uncertainty.

The next nutrition tranche may expand defensible ingredient/form mappings and unit/weight normalization but must preserve fail-partial behavior.

## V1 Content Gate C — COMPLETE
Merged through PR #7 to `main` at `59ae06755d1c681aa5f56d4f20e8bdaf1d01bec2` after green deterministic, matrix and Chromium validation; post-merge validation and Pages deployment passed.

Cost intelligence combines authored per-recipe tiers, deterministic ingredient cost classes, Spain/Canary availability assumptions, one-off package burden and cross-meal reuse credit. It remains a relative low-confidence heuristic and never claims live supermarket prices or invented exact euro values.

## V1 Content Gate D — COMPLETE
Merged through PR #7 with Gate C. A deterministic full-corpus culinary-quality layer normalizes explicit/instruction-inferred techniques, failure risk, execution load, equipment burden, difficulty/technique depth, meal-prep/batch/freezer/leftover/portability suitability, flavour, spice, familiarity, novelty, learning and exploration. Technique inference is inspectable over project-authored instructions, not runtime generation.

## V1 Content Gate E — SEARCH COVERAGE EXPANSION IMPLEMENTED / VALIDATION_PENDING
This bounded additive gate targets ingredient/search usefulness rather than arbitrary recipe count:

- adds 15 project-authored structured recipes focused on underused but already-supported ingredients such as pinto beans, barley, pumpkin, rice noodles, mango, mushrooms, peas, basmati, bulgur, turkey and hake;
- promotes `pineapple` from a future-only exclusion token into the canonical bilingual ingredient ontology;
- adds two real pineapple recipes in different cuisine contexts;
- explicitly proves a previously stored `excludedIngredientIds: ["pineapple"]` preference remains a hard filter after those recipes arrive;
- adds deterministic corpus coverage and ingredient-search coverage auditing;
- preserves cuisine taxonomy, hard constraints, planner/search contracts and project-authored provenance;
- does not introduce third-party recipes, runtime inference, paid data or Brain dependency.

Gate E becomes COMPLETE only after public deterministic/matrix/browser validation, clean merge, post-merge validation and Pages deployment.

## Brain P0 — NOT AUTHORIZED
The dedicated Culinary & Nutrition Brain remains a separate future human authorization boundary. This repository may prepare stable public interfaces and evidence artifacts but must not create or call the Brain early.

## Deferred
D1 nutrient-gap awareness, D2 supplement routine checker, D3 images, D4 live/local grocery prices, D5 fitness integration, D6 advanced culinary exploration and Brain P0 remain DEFERRED/NOT_AUTHORIZED rather than failed.
