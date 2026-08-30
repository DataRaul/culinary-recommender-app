# Roadmap

| Version / Gate | State | Capability |
|---|---|---|
| V0.1 / Gate 1 | COMPLETE | governance, architecture, skeleton, test strategy |
| V0.2 / Gate 2 | COMPLETE | canonical recipe model, ingredient ontology, provenance, project-authored corpus |
| V0.3 / Gate 3 | COMPLETE | independent profile dimensions, hard constraints, deterministic scoring/explanations |
| V0.4 / Gate 4 | COMPLETE | exact-slot partial-week planning, portfolio diversity/reuse, swap-one-dish |
| V0.4 / Gate 5 | COMPLETE | grocery aggregation, pantry memory, availability, substitutions, cost tiers |
| V0.5 / Gate 6 | COMPLETE | responsive mobile UX, onboarding/planning, groceries, pantry, profile, accessibility baseline |
| V0.9 / Gate 7 | COMPLETE | deterministic unit/static/browser/matrix acceptance |
| V0.9 / Gate 8 | COMPLETE | GitHub Pages public deployment |
| V0.9 / Gate 9 | ACCEPTED | original human acceptance review |
| V0.9.1 / Gate 9A | ACCEPTED | fridge-first ingredient search + temporary today-intent overrides |
| V0.9.2 / Gate 9B | ACCEPTED | up-to-three meal-scoped priority packs + cuisine-choice correction + scoped Search context |
| V0.9.3 | ACCEPTED BASELINE | permanent exclusions, mapped allergen hard filters, broad integrated browser acceptance |
| V1.0 / Content Gate A | COMPLETE | expanded project-authored recipes + hierarchical ingredient ontology + six-class substitution graph |
| V1.0 / Content Gate B1 | IMPLEMENTED / VALIDATION_PENDING | USDA Foundation source ledger + NutritionSource evidence coverage + fail-closed calculation framework |
| V1.0 / Content Gate B2 | NEXT | static authoritative nutrient-density import + unit/weight normalization + progressive per-serving replacement |
| V1.0 / Content Gate C | IMPLEMENTED / VALIDATION_PENDING | Spain/Canary ingredient classes + package/availability/reuse-aware portfolio cost heuristic |
| V1.0 / Content Gate D | IMPLEMENTED / VALIDATION_PENDING | normalized culinary technique/risk/execution/convenience/learning intelligence across full corpus |
| Brain P0 | NOT_AUTHORIZED | future Culinary & Nutrition Brain |
| App V1.x | DEFERRED | public-safe Brain-derived upgrades after explicit Brain authorization |

Content Gate A was merged through PR #6 at `1742bd40691cca614db2e12ccaa47499bea48a57` after green deterministic/browser validation and green post-merge validation/Pages deployment.

The accepted shell/core is not reopened by routine corpus and ontology growth. V1 content work remains additive behind the stable `RecipeSource`, `NutritionSource`, `IngredientNormalizer`, `RecommendationPolicy`, planner, substitution and cost interfaces.

The nutrition path is intentionally split. B1 establishes verified source identity, provenance and deterministic calculation contracts. B2 may replace low-confidence recipe estimates only when authoritative static densities and defensible unit/weight normalization are actually present. Identity matching alone must never be used to claim authoritative nutrient values.

Cost remains relative, deterministic and explainable. V1 improves portfolio estimates through ingredient classes, package burden, Canary availability and reuse without live supermarket pricing or false euro precision.

Culinary quality is normalized from project-authored structured metadata and instructions. Deterministic technique inference closes legacy metadata gaps while preserving inspectability and allowing later editorial refinement.

The profile remains composable rather than persona-bound. Cuisine remains independent and multi-select. Fridge search continues to reuse the same hard safety and recommendation truth.

The Culinary & Nutrition Brain remains a separate future authorization boundary. The public app must not call private Knowledge Core at runtime.
