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
| V1.0.1 / Content Gate B foundation | COMPLETE | USDA source/identity ledger + NutritionSource evidence coverage + fail-partial calculation framework |
| V1.0.2 / Content Gate B1 | IMPLEMENTED / VALIDATION_PENDING | bounded USDA Foundation per-100g static composition for 14 canonical ingredients + evidence-safe recipe calculation |
| V1.0.1 / Content Gate C | COMPLETE | Spain/Canary ingredient classes + package/availability/reuse-aware portfolio cost heuristic |
| V1.0.1 / Content Gate D | COMPLETE | normalized culinary technique/risk/execution/convenience/learning intelligence across full corpus |
| V1.x / Nutrition B2 | NEXT | expand defensible USDA mappings/forms and explicit gram-weight/unit normalization |
| V1.x / Corpus breadth | NEXT | coverage-driven authored recipes for high-value Search and planner gaps |
| Brain P0 | NOT_AUTHORIZED | future Culinary & Nutrition Brain |
| App Brain-derived V1.x | DEFERRED | public-safe Brain-derived upgrades after explicit Brain authorization |

Content Gate A was merged through PR #6 at `1742bd40691cca614db2e12ccaa47499bea48a57` after green deterministic/browser validation and green post-merge validation/Pages deployment.

Gates B foundation, C and D were merged through PR #7 at `59ae06755d1c681aa5f56d4f20e8bdaf1d01bec2`; deterministic/static tests, the 15,552-profile matrix, comprehensive Chromium acceptance, post-merge validation and Pages deployment were green.

The accepted shell/core is not reopened by routine corpus, ontology or evidence growth. V1 content work remains additive behind stable `RecipeSource`, `NutritionSource`, `IngredientNormalizer`, `RecommendationPolicy`, planner, substitution and cost interfaces.

Nutrition evidence is intentionally progressive. The first static composition tranche bundles only a small public-domain Foundation extract and keeps per-nutrient missingness explicit. Recipe-level authoritative replacement occurs only when all required ingredients, tracked nutrients and quantity units are supported. Partial evidence remains auditable but does not overwrite the current low-confidence project estimate.

The next nutrition step is breadth rather than loosened certainty: add clearly matched ingredient/form records and explicit gram weights/unit mappings where defensible. Do not use generic spoon/piece guesses to inflate coverage.

Cost remains relative, deterministic and explainable. Culinary quality remains normalized from project-authored structured metadata and instructions. Fridge search and planning continue to reuse the same hard safety truth.

The Culinary & Nutrition Brain remains a separate future authorization boundary. The public app must not call private Knowledge Core at runtime.
