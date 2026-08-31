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
| V0.9.1 / Gate 9A | ACCEPTED | fridge-first ingredient Search + temporary today-intent overrides |
| V0.9.2 / Gate 9B | ACCEPTED | up-to-three meal-scoped priority packs + independent cuisine choices |
| V0.9.3 | ACCEPTED BASELINE | permanent exclusions, mapped allergen hard filters, broad integrated browser acceptance |
| V1.0 / Content Gate A | COMPLETE | expanded project-authored recipes + hierarchical ingredient ontology + six-class substitution graph |
| V1.0.1 / Content Gate B foundation | COMPLETE | source/identity ledger + NutritionSource evidence coverage + fail-partial calculation framework |
| V1.0.2 / Nutrition B1 | COMPLETE | bounded USDA Foundation per-100g static composition for 14 canonical ingredients |
| V1.0.4 / Nutrition B2 | COMPLETE | USDA portion evidence + source-backed banana conversion + ambiguous tuna-can fail closed |
| V1.0.5 / Nutrition B3 | COMPLETE | 15 additional reviewed Foundation forms + combined 29-record USDA ledger |
| V1.0.6 / European evidence B4 | COMPLETE | bounded ANSES-Ciqual 2025 evidence + provenance-first USDA/Ciqual comparison |
| V1.0.7 / European primary-source policy | COMPLETE / USER-APPROVED | conditional Europe/Canary per-ingredient/per-nutrient source selection + semantic firewall + coherent USDA fallback |
| V1.0.1 / Content Gate C | COMPLETE | Spain/Canary ingredient classes + package/availability/reuse-aware cost heuristic |
| V1.0.1 / Content Gate D | COMPLETE | normalized culinary technique/risk/execution/convenience/learning intelligence |
| V1.0.3 / Content Gate E | COMPLETE | 15 coverage-driven authored recipes + corpus/search audit + pineapple future-exclusion proof |
| V1.x / Authoritative nutrition coverage | CONTINUOUS | expand reviewed food forms and quantity evidence under the approved source policy |
| V1.x / Corpus breadth | CONTINUOUS | target high-value Search/planner gaps rather than recipe-count growth |
| V1.x / EU regulatory truth lane | RESEARCH / SCAFFOLDING_ALLOWED | classification/regulatory evidence remains separate and audit-only until a future behavior contract |
| Brain P0 | NOT_AUTHORIZED | future Culinary & Nutrition Brain |
| App Brain-derived V1.x | DEFERRED | public-safe Brain-derived upgrades only after explicit Brain authorization |

## Completed V1 lineage

Content Gate A merged through PR #6 at `1742bd40691cca614db2e12ccaa47499bea48a57` after green deterministic/browser validation and green post-merge validation/Pages deployment.

Gates B foundation, C and D merged through PR #7 at `59ae06755d1c681aa5f56d4f20e8bdaf1d01bec2`; deterministic/static tests, the 15,552-profile matrix, comprehensive Chromium acceptance, post-merge validation and Pages deployment were green.

B1 merged through PR #8 at `5dc9c668df8ac96361657cd403b95bf05e859ac9`. Gate E merged through PR #9 at `3e0be5adcde9ec9567c0595ac4e8fc71dd237ee4`. B2 merged through PR #10 at `225cd4ade1bd7af374d465600118cff79dbd4c6c`. B3 merged through PR #11 at `016db58fb01ca0e7cbf8354faf9ca38469e6e0b1`. Each passed its PR validation plus post-merge validation and Pages deployment.

European Evidence B4 merged through PR #12 at `fd33037ce48a75b60ac5b8ca7d7526b7ffb15061`. It added 32 manually reviewed ANSES-Ciqual 2025 food/form mappings and a comparison layer that preserves food identity, nutrient definitions, method caveats, confidence and source provenance without averaging values.

The European-primary policy was explicitly approved by the user and implemented through PR #13, merged at `cfa3b9115821b59321c7ef19e779ff3a578aa6b6`. PR validation, the 15,552-profile matrix, Chromium acceptance, post-merge validation and Pages deployment passed.

## Current nutrition policy

For the Canary Islands / Spain / Europe context:

- source selection occurs per ingredient and per nutrient;
- reviewed European evidence may be primary when food-form fit is equally good or better and constituent evidence is sufficiently strong;
- Ciqual confidence `D` does not displace an available reviewed USDA value;
- a stronger USDA form remains primary;
- no cross-source averaging is permitted;
- exact source/method/semantic provenance is retained;
- USDA carbohydrate-by-difference and Ciqual available carbohydrate (`CHOAVL`) cannot be summed into one authoritative recipe carbohydrate total;
- if the European-selected mix is incomplete or semantically incompatible but a complete coherent reviewed USDA recipe calculation exists, that USDA calculation remains authoritative;
- otherwise incomplete evidence preserves the project-authored estimate.

This policy is now part of the accepted V1 nutrition architecture. Routine evidence expansion may continue under it without reopening the decision.

## European source backlog

ANSES-Ciqual is the current bundled European national source. Fineli/THL remains attractive under CC BY 4.0, but both its documented API and official package returned HTTP 403 to standard GitHub-hosted runners during the bounded audit; no bypass is attempted. Frida/DTU, NEVO/RIVM and BEDCA/AESAN remain governed by their exact reuse terms. EuroFIR remains outside the no-cost contract.

EFSA FoodEx2 and EU Commission regulatory datasets are a separate classification/regulatory evidence lane. They may be researched and represented as audit metadata, but regulatory limits/authorisations must not silently become composition values or recommendation rules without a future explicit behavior contract.

## Standing architecture

The accepted shell/core is not reopened by routine corpus, ontology or evidence growth. V1 content work remains additive behind stable `RecipeSource`, `NutritionSource`, `IngredientNormalizer`, `RecommendationPolicy`, planner, substitution and cost interfaces.

Future nutrition breadth must come from reviewed source/form identity plus explicit quantity/portion evidence. Generic spoon/piece averages remain prohibited merely to increase apparent coverage.

Cost remains relative, deterministic and explainable. Culinary quality remains normalized from project-authored structured metadata and instructions. Fridge Search, planner, allergens, dietary restrictions and permanent exclusions continue to use the same hard safety truth.

The Culinary & Nutrition Brain remains a separate future authorization boundary. The public app must not call private Knowledge Core at runtime.
