# Architecture

## Runtime shape
Static PWA-compatible application, deployable from GitHub Pages. Vanilla ES modules keep the core runtime inspectable and dependency-light.

```text
UI
 ↓
Stable application contracts
 RecipeSource | NutritionSource | IngredientNormalizer | RecipeEvaluator
 RecommendationPolicy | PortfolioPlanner | SubstitutionEngine | CostEstimator
 PantryStore | PreferenceStore
 ↓
Public deterministic implementations
 ↓
Versioned public recipe/ingredient/evidence data + local browser state
```

## V1 content and evidence layers
The accepted shell is intentionally insulated from data expansion.

```text
project-authored recipe corpus ───────→ RecipeSource
canonical ingredient ontology ───────→ IngredientNormalizer / exclusions / search
controlled substitution graph ───────→ SubstitutionEngine
USDA Foundation identity ledger ─────→ NutritionSource evidence coverage
future static nutrient densities ────→ NutritionSource calculation layer
Spain/Canary cost heuristics ────────→ CostEstimator
structured recipe metadata ──────────→ culinary-quality normalization
```

The nutrition identity ledger and numeric composition data are separate artifacts. `IDENTITY_VERIFIED_COMPOSITION_PENDING` means only that the canonical ingredient has a reviewed Foundation catalogue match. It does not authorize replacing recipe estimates. Static nutrient-density values must be present and unit conversion must be defensible before a calculated value is labelled authoritative-derived.

The cost estimator remains relative. It combines authored recipe tiers with ingredient cost classes, one-off package burden, Canary availability assumptions and cross-meal reuse. It does not infer live prices or fabricate exact euros.

The culinary-quality layer normalizes difficulty, failure risk, technique depth, active-share, equipment burden, convenience, storage, flavour, spice, novelty, familiarity and learning value. Missing explicit technique tags may be deterministically inferred from project-authored instruction language; the inference source remains visible and inspectable.

## Profile composition boundary
The saved profile separates three kinds of intent:

1. **hard/explicit controls** — dietary mode, allergens, exclusions, unavailable ingredients, maximum time and skill ceiling where applicable;
2. **independent base preferences** — budget, nutrition priority, speed, variety, protein, meal prep and cuisines;
3. **optional contextual priority packs** — up to three bounded soft lenses, each scoped to all meals, lunch or dinner.

Priority packs never rewrite the base profile fields. The recommendation evaluator receives meal context and adds only matching pack bonuses after hard eligibility checks. This keeps lunch/dinner intent composable while preserving deterministic behavior and a stable public profile schema.

The former single `preset` field is retained only as a migration input. Old saved profiles are normalized to the closest priority pack and then persisted with `preset: null` plus `priorityPacks`.

## Search reuse
Fridge-first Search uses the same `RecipeEvaluator` truth as planning. Ingredient matching is a retrieval layer; meal context is passed into the evaluator so lunch/dinner priority packs behave consistently. The neutral ingredients-first lens clears soft cuisine and priority-pack preferences but does not clear safety constraints.

## Future Brain firewall
The UI never depends directly on Knowledge Core or a private Brain. A future Culinary & Nutrition Brain may produce a narrow, versioned public export of scoring policies, ingredient relationships, substitution rules, difficulty criteria and safe nutrition rules. That export must implement the same stable behavioural boundary.

Knowledge Core remains canonical for reusable reasoning; this repository remains canonical for public runtime, UI, public data, user state and application validation.

## Local-first persistence
`culinary-recommender.state.v1` stores a versioned state object in `localStorage`. Normalization repairs optional fields, migrates the former one-choice preset shape, export/import preserves portability, and unsupported schema versions fail closed.

## Key workout-app lessons intentionally reused
- mobile-first persistent navigation without copying the workout visual theme;
- local-first state and portable JSON backup;
- hard maximum constraints rather than unsafe fallback;
- deterministic combination testing;
- explicit shortfall when candidates are exhausted;
- progressive disclosure for details;
- visible system state and recovery paths.
