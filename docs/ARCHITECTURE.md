# Architecture

## Runtime shape

Static PWA-compatible application deployed from GitHub Pages. Vanilla ES modules keep the core runtime inspectable and dependency-light.

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

The accepted V0.9.3 shell remains insulated from content/evidence expansion.

```text
project-authored recipe corpus ─────────→ RecipeSource
canonical ingredient ontology ─────────→ IngredientNormalizer / exclusions / Search
controlled substitution graph ─────────→ SubstitutionEngine
USDA Foundation bounded evidence ──────→ NutritionSource evidence/calculation
ANSES-Ciqual bounded evidence ─────────→ comparison + European source selection
European-primary policy ───────────────→ per-ingredient/per-nutrient selector
USDA coherent fallback ────────────────→ full recipe fallback when mixed semantics fail
EU regulatory/classification evidence ─→ separate future audit source, not composition
Spain/Canary cost heuristics ──────────→ CostEstimator
structured recipe metadata ────────────→ culinary-quality normalization
```

## NutritionSource architecture

Nutrition is split into four concerns rather than one opaque number:

1. **source identity/form evidence** — exact reviewed food match, source identifier, geography and version;
2. **numeric composition evidence** — per-100 g values with nutrient semantics/method provenance;
3. **quantity evidence** — direct mass or explicitly reviewed household-weight conversion;
4. **source-selection / recipe-coherence policy** — decides which reviewed field may be primary and whether those fields can form a coherent recipe total.

### Bounded USDA lane

The current USDA Foundation lane contains 29 manually reviewed identities from Version 15.0 / 2026-04-30. Missing fields remain `null`. Direct `g`/`kg` quantities qualify. Household-weight conversion is narrower than source availability: banana pieces are source-backed, a bare tuna can remains ambiguous, and other portion rows stay evidence-only when canonical recipe form/size is underspecified.

### Bounded European lane

ANSES-Ciqual 2025 contributes 32 manually reviewed food/form mappings. The module retains food identity, scientific name where available, per-field confidence and source codes. It does not import the complete Ciqual database.

`src/domain/nutrition-evidence-comparison.js` remains a non-selecting audit surface for cross-source provenance/disagreement.

`src/domain/nutrition-source-policy.js` implements the user-approved Canary/Spain/Europe policy. Selection occurs per ingredient and per nutrient. Reviewed Ciqual can be primary when form fit is equally good or better and field confidence is A/B/C; D-confidence fields do not displace an available reviewed USDA value; stronger USDA forms remain primary. Values are never averaged.

### Nutrient semantic firewall

A shared app field does not imply identical source semantics. The key current firewall is carbohydrate:

```text
USDA 1005 = carbohydrate by difference
Ciqual CHOAVL = available carbohydrate
```

These cannot be summed together in one authoritative recipe total. The static calculator tracks nutrient semantics by ingredient and fails that nutrient closed if a proposed recipe total would mix incompatible carbohydrate definitions.

### Coherent USDA fallback

Per-field European preference must not destroy a previously legitimate complete calculation. Therefore `publicNutritionSource` uses this order:

```text
complete coherent European-policy calculation
            ↓ else
complete coherent reviewed USDA Foundation calculation
            ↓ else
project-authored low-confidence estimate
```

The fallback is a scientific-coherence safeguard, not a general preference for USDA.

### Evidence output

Authoritative/partial calculation metadata retains source policy, per-nutrient source, source identifier, semantic, method, form confidence, field confidence where applicable, selection reason, quantity evidence, coverage and fallback state.

Even a complete static ingredient calculation remains medium confidence because cooking/yield effects and exact product/food form can still matter.

## EU regulatory truth boundary

EFSA FoodEx2 and European Commission regulatory datasets are intentionally outside `NutritionSource` composition selection. They may later enter a separate `RegulatoryEvidenceSource` or public-safe distilled artifact for classification/legal/safety audit.

Regulatory limits, authorisations and legal classifications must never be converted into measured composition values or recommendation behavior without an explicit future product/safety contract.

## CostEstimator boundary

The cost estimator remains relative. It combines authored recipe tiers with ingredient cost classes, one-off package burden, Canary availability assumptions and cross-meal reuse. It does not infer live prices or fabricate exact euros.

## Culinary-quality layer

The culinary-quality layer normalizes difficulty, failure risk, technique depth, active share, equipment burden, convenience/storage, flavour, spice, novelty, familiarity and learning value. Missing explicit technique tags may be deterministically inferred from project-authored instruction language; the inference source remains visible.

## Profile composition boundary

The saved profile separates:

1. **hard/explicit controls** — dietary mode, allergens, exclusions, unavailable ingredients, maximum time and skill ceiling where applicable;
2. **independent base preferences** — budget, nutrition priority, speed, variety, protein, meal prep and cuisines;
3. **optional contextual priority packs** — up to three bounded soft lenses, each scoped to all meals, lunch or dinner.

Priority packs never rewrite base profile fields or relax hard constraints. The former single `preset` field is retained only as migration input.

## Search reuse

Fridge-first Search uses the same `RecipeEvaluator` truth as planning. Ingredient matching is a retrieval layer; meal context is passed into the evaluator so lunch/dinner priority packs behave consistently. Neutral ingredients-first mode may clear soft preferences but never safety constraints.

## Future Brain firewall

The UI never depends directly on Knowledge Core or a private Brain. A future Culinary & Nutrition Brain may produce a narrow, versioned public export of scoring policies, ingredient relationships, substitution rules, difficulty criteria and safe nutrition rules only after explicit authorization. That export must implement the same stable public behavioral boundary.

Knowledge Core remains canonical for reusable reasoning; this repository remains canonical for public runtime, UI, public data, user state and application validation.

## Local-first persistence

`culinary-recommender.state.v1` stores a versioned state object in `localStorage`. Normalization repairs optional fields, migrates the former one-choice preset shape, export/import preserves portability, and unsupported schema versions fail closed.

## Workout-app lessons intentionally reused

- mobile-first persistent navigation without copying the workout visual theme;
- local-first state and portable JSON backup;
- hard maximum constraints rather than unsafe fallback;
- deterministic combination testing;
- explicit shortfall when candidates are exhausted;
- progressive disclosure for details;
- visible system state and recovery paths.
