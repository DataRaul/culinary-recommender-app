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
- explicit `g`/`kg` quantities qualify directly for deterministic calculation;
- unsupported units, unmapped ingredients and missing nutrients make the calculation partial rather than guessed;
- the project-authored recipe estimate remains primary unless every required ingredient, tracked nutrient and quantity conversion is complete;
- complete coverage can produce a medium-confidence static calculation while retaining cooking/yield uncertainty.

## V1 Nutrition Gate B2 — COMPLETE
Merged through PR #10 to `main` at `225cd4ade1bd7af374d465600118cff79dbd4c6c`; the corrected candidate passed deterministic/static validation, the 15,552-profile matrix and Chromium acceptance, followed by green post-merge validation and GitHub Pages deployment.

The official 2026-04-30 Foundation `food_portion.csv` extract produced portion rows for only two of the original 14 bounded mapped foods:

- banana / FDC `1105314`: one **peeled Banana = 115 g**, 102 data points, minimum acquisition year 2019;
- tuna / FDC `334194`: one can has **107 g drained solids** and **142 g total can contents**, each with 48 data points.

Implementation rules:

- canonical banana `piece` / `pieces` converts at 115 g per unit because the source measure is explicitly one peeled Banana;
- raw portion evidence remains separate from automatic conversion policy;
- ordinary tuna `can` / `cans` is deliberately **ambiguous** and fails closed because USDA publishes two materially different can weights;
- no generic household-weight table, internet average, recipe-blog conversion, teaspoon density or guessed onion/egg/clove weight is introduced;
- direct `g`/`kg` behavior is unchanged;
- every applied portion conversion carries quantity provenance into the static calculation audit;
- partial calculations still cannot overwrite the project-authored recipe estimate.

## V1 Nutrition Gate B3 — COMPLETE
Merged through PR #11 to `main` at `016db58fb01ca0e7cbf8354faf9ca38469e6e0b1`; deterministic/static validation, the 15,552-profile matrix and Chromium acceptance passed, followed by green post-merge validation and GitHub Pages deployment.

Fifteen additional canonical foods/forms were manually reviewed from the same official USDA Foundation Foods Version 15.0 / 2026-04-30 release. Candidate search did not promote matches automatically.

Evidence rules preserved:

- 13 of the 15 selected B3 records contain all five tracked nutrients;
- cucumber lacks tracked fibre and remains partial;
- spring onion lacks tracked energy, carbohydrate and fat and remains partial;
- cultivar/form-specific matches remain explicitly qualified rather than silently generalized;
- ambiguous candidate families such as generic salmon, milk, yogurt, mango, apple and potato/sweet-potato varieties were not promoted merely to increase coverage;
- source household weights for chopped broccoli cup, large whole egg, yellow onion and red onion remain evidence-only because current recipe semantics do not encode enough form/size/variety detail for safe automatic conversion;
- automatic quantity conversion policy therefore remains unchanged from B2;
- the combined bounded USDA ledger contains 29 reviewed Foundation composition records.

## V1 European Evidence Gate B4 — COMPLETE
Merged through PR #12 to `main` at `fd33037ce48a75b60ac5b8ca7d7526b7ffb15061`; deterministic/static validation, the 15,552-profile matrix and Chromium acceptance passed before merge, followed by green post-merge validation and GitHub Pages deployment.

This additive gate introduces a second official composition source as **corroboration/audit evidence only**, without changing the public NutritionSource's source-selection policy.

Source:

- ANSES-Ciqual 2025, published 2025-11-19;
- dataset DOI `10.57745/RDMHWY`;
- 3,484-food official XML catalogue;
- Etalab Open Licence 2.0 with explicit ANSES attribution;
- 32 manually reviewed app-relevant food/form mappings are retained in a bounded static module rather than bundling the full Ciqual database.

Evidence semantics:

- Ciqual energy values preserve both Jones-with-fibre and EU 1169/2011 methods where available;
- protein preserves Ciqual's Jones-factor definition and per-field confidence code;
- Ciqual carbohydrate `CHOAVL` is available carbohydrate and is **not** treated as equivalent to USDA nutrient `1005` carbohydrate-by-difference;
- fat may be compared with form/method caveats;
- fibre remains method-dependent;
- per-field Ciqual confidence codes (`A`–`D`) and source codes are preserved rather than collapsed into a single database score;
- missing values remain missing rather than imputed.

Comparison policy:

- no values are averaged across USDA and Ciqual;
- no geography is assumed inherently more truthful;
- exact food form, nutrient definition, method, geography, source version and licence stay visible;
- material disagreements remain visible;
- Ciqual-only evidence such as reviewed farmed raw salmon is represented as single-source evidence rather than fabricating a USDA mapping;
- the B4 comparison layer exposes `NO_STATIC_EVIDENCE`, `SINGLE_SOURCE_EVIDENCE`, `MULTI_SOURCE_REVIEWED_EVIDENCE` and `MULTI_SOURCE_FORM_CAVEAT` states;
- B4 does not change recipe ranking, hard constraints, displayed nutrition selection or project-authored fallback estimates.

European-source governance:

- Fineli/THL Finland remains a strong open CC BY 4.0 candidate, but its documented API and package returned HTTP 403 to standard GitHub-hosted runners during B4; no access-control bypass is attempted;
- Frida/DTU, NEVO/RIVM and BEDCA/AESAN remain candidates subject to exact reuse/licensing conditions;
- EuroFIR FoodEXplorer remains outside the current cost/access contract;
- EFSA FoodEx2 and EU regulatory datasets are a separate classification/regulatory truth lane, not composition-value replacements.

**Next major human gate:** whether reviewed European composition evidence may become primary for Europe/Canary contexts or remain corroboration-only. That policy change is not pre-authorized by B4.

## V1 Content Gate C — COMPLETE
Merged through PR #7 to `main` at `59ae06755d1c681aa5f56d4f20e8bdaf1d01bec2` after green deterministic, matrix and Chromium validation; post-merge validation and Pages deployment passed.

Cost intelligence combines authored per-recipe tiers, deterministic ingredient cost classes, Spain/Canary availability assumptions, one-off package burden and cross-meal reuse credit. It remains a relative low-confidence heuristic and never claims live supermarket prices or invented exact euro values.

## V1 Content Gate D — COMPLETE
Merged through PR #7 with Gate C. A deterministic full-corpus culinary-quality layer normalizes explicit/instruction-inferred techniques, failure risk, execution load, equipment burden, difficulty/technique depth, meal-prep/batch/freezer/leftover/portability suitability, flavour, spice, familiarity, novelty, learning and exploration. Technique inference is inspectable over project-authored instructions, not runtime generation.

## V1 Content Gate E — COMPLETE
Merged through PR #9 to `main` at `3e0be5adcde9ec9567c0595ac4e8fc71dd237ee4`; PR deterministic/static validation, the 15,552-profile matrix and Chromium acceptance passed, followed by green post-merge validation and GitHub Pages deployment.

Delivered:

- 15 project-authored structured recipes focused on real ingredient/Search coverage gaps;
- broader coverage for pineapple, pinto beans, barley, pumpkin, rice noodles, mango, mushrooms, peas, basmati, bulgur, turkey and hake;
- canonical bilingual `pineapple` ontology promotion;
- regression proof that an earlier stored `excludedIngredientIds: ["pineapple"]` remains a hard ranking/Search exclusion after real pineapple recipes arrive;
- deterministic corpus and ingredient-search coverage auditing;
- unchanged cuisine taxonomy, planner/Search contracts, safety hierarchy and project-authored provenance.

## Brain P0 — NOT AUTHORIZED
The dedicated Culinary & Nutrition Brain remains a separate future human authorization boundary. This repository may prepare stable public interfaces and evidence artifacts but must not create or call the Brain early.

## Deferred
D1 nutrient-gap awareness, D2 supplement routine checker, D3 images, D4 live/local grocery prices, D5 fitness integration, D6 advanced culinary exploration and Brain P0 remain DEFERRED/NOT_AUTHORIZED rather than failed.
