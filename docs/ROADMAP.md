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
| V1.0 / Content Gate A | IMPLEMENTED / VALIDATION_PENDING | project-authored recipe corpus expansion + hierarchical ingredient ontology + controlled six-class substitution graph |
| V1.0 / Content Gate B | NEXT | nutrition evidence framework and authoritative ingredient composition upgrade |
| V1.0 / Content Gate C | NEXT | stronger deterministic Spain/Canary cost heuristics and reuse/package-aware portfolio estimates |
| V1.0 / Content Gate D | PARTIAL / NEXT | richer culinary technique, risk, convenience and learning metadata across the broader corpus |
| Brain P0 | NOT_AUTHORIZED | future Culinary & Nutrition Brain |
| App V1.x | DEFERRED | public-safe Brain-derived upgrades after explicit Brain authorization |

The accepted shell/core is not reopened by routine corpus and ontology growth. V1 content work is additive behind the stable `RecipeSource`, `IngredientNormalizer`, `RecommendationPolicy`, planner, substitution and cost interfaces.

The V1 recipe expansion remains project-authored and structured. Recipe count is subordinate to provenance, metadata completeness, safety compatibility, culinary usefulness and deterministic regression coverage.

The profile is intentionally not a permanent persona. Priority packs are bounded soft lenses that can differ by lunch/dinner, while explicit dimensions and safety constraints remain independent.

Cuisine discovery is multi-select and independent of priority packs. Broad corpus-backed choices are surfaced first; Local / Canarian remains available because of the target food environment but is not privileged.

Fridge search remains a deterministic retrieval/ranking layer over the same recipe corpus and safety boundaries, not a separate generative recipe engine.

Nutrition Evidence Upgrade may use public-domain authoritative static data after source/provenance verification. No runtime API, paid data service or false precision is required for V1.

The Culinary & Nutrition Brain remains a separate future authorization boundary. The public app must not call private Knowledge Core at runtime.
