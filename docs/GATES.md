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

## Gate 9 — BASE ACCEPTED
The original 15-point human acceptance review passed.

## Gate 9A — IMPLEMENTED / HUMAN_PENDING
V0.9.1 adds deterministic fridge-first Search. Main ingredient is a hard pre-filter; optional secondary ingredients are ranking preferences unless explicitly required. Search can temporarily override time, skill ceiling and discovery mood without mutating the saved profile. Choosing an ingredients-first lens neutralizes soft profile preferences only; dietary mode, declared allergens, permanent exclusions and unavailable ingredients remain hard constraints.

## Gate 9B — HUMAN_GATE
The current V0.9.3 candidate consolidates the pre-V1.0 UX corrections:

- mutually exclusive preset dropdown replaced with up to three composable **priority packs**, each scoped to all meals, lunch or dinner;
- priority packs remain bounded soft ranking signals and cannot relax hard constraints;
- cuisine preferences remain independent multi-select signals, with broad discovery foregrounded and Local / Canarian retained without special priority;
- Search has optional lunch/dinner context so scoped packs apply coherently;
- Pantry separates **Can't get right now** from **Always exclude**;
- permanent ingredient exclusions are hard, substitution-proof and can be ontology-family-wide, e.g. `coconut` blocks current `coconut_milk` and future encoded coconut forms;
- future exclusion tokens such as `pineapple` persist even when the current small corpus has no matching recipe;
- mapped allergen hard filters are now user-configurable from Profile and constrain substitutions as well as recipes;
- broad automated browser acceptance now exercises the integrated user journeys in addition to the 15,552-profile deterministic matrix.

V1.0 remains blocked only by the combined human product/taste boundary; the Culinary & Nutrition Brain remains separately NOT_AUTHORIZED.

## Deferred
D1 nutrient-gap awareness, D2 supplement routine checker, D3 images, D4 local grocery prices, D5 fitness integration, D6 advanced culinary exploration and Brain P0 are DEFERRED/NOT_AUTHORIZED rather than failed.
