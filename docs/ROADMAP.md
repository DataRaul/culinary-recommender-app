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
| V1.0.2 / Content Gate B1 | COMPLETE | bounded USDA Foundation per-100g static composition for 14 canonical ingredients + evidence-safe recipe calculation |
| V1.0.4 / Nutrition B2 | COMPLETE | USDA Foundation portion evidence + evidence-backed banana piece conversion + ambiguous tuna-can fail-closed handling |
| V1.0.5 / Nutrition B3 | IMPLEMENTED / VALIDATION_PENDING | 15 additional manually reviewed Foundation forms + combined 29-record bounded ledger + evidence-only B3 household weights |
| V1.x / European evidence B4 | RESEARCHING | official European/national composition sources + EU regulatory truth lane; no automatic source mixing |
| V1.0.1 / Content Gate C | COMPLETE | Spain/Canary ingredient classes + package/availability/reuse-aware portfolio cost heuristic |
| V1.0.1 / Content Gate D | COMPLETE | normalized culinary technique/risk/execution/convenience/learning intelligence across full corpus |
| V1.0.3 / Content Gate E | COMPLETE | 15 coverage-driven authored recipes + deterministic corpus/search coverage audit + pineapple future-exclusion proof |
| V1.x / Corpus breadth | CONTINUOUS | use coverage audit to target high-value Search/planner gaps rather than recipe-count growth |
| Brain P0 | NOT_AUTHORIZED | future Culinary & Nutrition Brain |
| App Brain-derived V1.x | DEFERRED | public-safe Brain-derived upgrades after explicit Brain authorization |

Content Gate A was merged through PR #6 at `1742bd40691cca614db2e12ccaa47499bea48a57` after green deterministic/browser validation and green post-merge validation/Pages deployment.

Gates B foundation, C and D were merged through PR #7 at `59ae06755d1c681aa5f56d4f20e8bdaf1d01bec2`; deterministic/static tests, the 15,552-profile matrix, comprehensive Chromium acceptance, post-merge validation and Pages deployment were green.

Gate B1 was merged through PR #8 at `5dc9c668df8ac96361657cd403b95bf05e859ac9`; public validation, matrix/browser acceptance, post-merge validation and Pages deployment all passed. The authoritative lane is real but deliberately partial: complete USDA-derived recipe values replace estimates only under full ingredient/nutrient/quantity coverage.

Gate E was merged through PR #9 at `3e0be5adcde9ec9567c0595ac4e8fc71dd237ee4`; PR validation, post-merge validation and Pages deployment all passed. Corpus growth is now coverage-driven, and the durable future-exclusion lifecycle has been proven against real pineapple recipes.

Nutrition B2 was merged through PR #10 at `225cd4ade1bd7af374d465600118cff79dbd4c6c`; PR and post-merge deterministic/browser validation and Pages deployment passed. The official Foundation `food_portion.csv` table supports a 115 g peeled-banana portion while exposing two conflicting tuna can weights (107 g drained solids; 142 g total contents). The app accepts canonical banana `piece(s)` through source-backed conversion and deliberately rejects an unqualified tuna `can` as ambiguous.

Nutrition B3 is discovery-first rather than keyword-first. Fifteen additional Foundation records were manually selected only after reviewing food form and canonical semantics. Thirteen have all five tracked nutrients; cucumber and spring onion remain explicitly partial. The combined bounded Foundation ledger contains 29 records. Source household weights found for broccoli, eggs and onions remain evidence-only because the canonical recipe model does not yet encode enough form/size/variety detail for automatic conversion.

European evidence B4 is being researched as a complementary truth lane rather than a claim that one geography is inherently more accurate. Current candidates include official national composition sources with explicit provenance/licensing and EU-level regulatory datasets. Composition, classification, legal limits and health-claim authorisation are separate evidence types and must not be collapsed into one score.

The accepted shell/core is not reopened by routine corpus, ontology or evidence growth. V1 content work remains additive behind stable `RecipeSource`, `NutritionSource`, `IngredientNormalizer`, `RecommendationPolicy`, planner, substitution and cost interfaces.

Future nutrition breadth must come from reviewed source/form identity plus explicit portion evidence. Do not use generic spoon/piece averages merely to increase coverage. Cross-source European/US comparison must preserve each source's exact food form, nutrient definition, value derivation and licence.

Cost remains relative, deterministic and explainable. Culinary quality remains normalized from project-authored structured metadata and instructions. Fridge search and planning continue to reuse the same hard safety truth.

The Culinary & Nutrition Brain remains a separate future authorization boundary. The public app must not call private Knowledge Core at runtime.
