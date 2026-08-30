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
Combined grocery list, pantry assumptions, current-pantry preference, cannot-obtain memory, labelled substitution types and relative €–€€€€ estimates.

## Gate 6 — COMPLETE
Mobile-first navigation, onboarding, plan, groceries, pantry, profile/export-import, shortfall/error communication, focus/contrast/touch/reduced-motion baseline.

## Gate 7 — COMPLETE
Local and public CI validation pass. Matrix covers 15,552 deterministic profile combinations. Public GitHub Actions runs validation and Chromium smoke testing on standard hosted runners.

## Gate 8 — COMPLETE
Public deployment verified at https://dataraul.github.io/culinary-recommender-app/. Hosting is deliberately simple: GitHub Pages publishes from `main` / repository root, with no dedicated Pages deployment workflow.

## Gate 9 — BASE ACCEPTED
The original 15-point human acceptance review passed.

## Gate 9A — IMPLEMENTED / HUMAN_PENDING
V0.9.1 adds deterministic fridge-first Search. Main ingredient is a hard pre-filter; optional secondary ingredients are ranking preferences unless explicitly required. Search can temporarily override time, skill ceiling and discovery mood without mutating the saved profile. Choosing an ingredients-first lens neutralizes soft profile preferences only; dietary mode, declared allergens, explicit exclusions and unavailable ingredients remain hard constraints.

## Gate 9B — HUMAN_GATE
V0.9.2 corrects the profile model before V1.0. The mutually exclusive preset dropdown is replaced with up to three composable **priority packs**, each scoped to all meals, lunch or dinner. Priority packs are bounded soft ranking signals and cannot relax hard constraints. Cuisine preferences remain independent multi-select signals; broad discovery options are foregrounded and Local / Canarian is retained without being privileged. The Search tab now has an optional lunch/dinner context so scoped packs can apply coherently.

V1.0 remains blocked until the combined Gate 9A/9B human review is accepted.

## Deferred
D1 nutrient-gap awareness, D2 supplement routine checker, D3 images, D4 local grocery prices, D5 fitness integration, D6 advanced culinary exploration and Brain P0 are DEFERRED/NOT_AUTHORIZED rather than failed.
