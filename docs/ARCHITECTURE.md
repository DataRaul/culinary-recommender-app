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
V0 public deterministic implementations
 ↓
Versioned public recipe/ingredient data + local browser state
```

## Future Brain firewall
The UI never depends directly on Knowledge Core or a private Brain. A future Culinary & Nutrition Brain may produce a narrow, versioned public export of scoring policies, ingredient relationships, substitution rules, difficulty criteria and safe nutrition rules. That export must implement the same stable behavioural boundary.

Knowledge Core remains canonical for reusable reasoning; this repository remains canonical for public runtime, UI, public data, user state and application validation.

## Local-first persistence
`culinary-recommender.state.v1` stores a versioned state object in `localStorage`. Normalization repairs optional fields, export/import preserves portability, and unsupported schema versions fail closed.

## Key workout-app lessons intentionally reused
- mobile-first persistent navigation without copying the workout visual theme;
- local-first state and portable JSON backup;
- hard maximum constraints rather than unsafe fallback;
- deterministic combination testing;
- explicit shortfall when candidates are exhausted;
- progressive disclosure for details;
- visible system state and recovery paths.
