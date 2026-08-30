# Culinary Recommender

> **Public V1 content & intelligence expansion** — deterministic, mobile-first culinary recommendations, fridge-first search, partial-week planning, substitutions and groceries on the accepted V0.9.3 shell/core.

## Control panel

| Area | Status | Current stage | Next unlock |
|---|---|---|---|
| Foundation | ✅ COMPLETE | V0.1 / Gate 1 | — |
| Recipe corpus | ✅ V1 GATE A COMPLETE | V1.0 | further editorial expansion |
| Ingredient ontology | ✅ V1 GATE A COMPLETE | V1.0 | nutrition-density coverage |
| Substitutions | ✅ V1 GATE A COMPLETE | V1.0 | more context-specific editorial edges |
| Nutrition evidence | 🧪 FOUNDATION IMPLEMENTED | Gate B1 | static authoritative composition import |
| Cost intelligence | 🧪 IMPLEMENTED | Gate C | public validation / merge |
| Culinary quality | 🧪 IMPLEMENTED | Gate D | public validation / merge |
| Recommender / planner | ✅ ACCEPTED CORE | V0.9.3 baseline | richer public-safe policy later |
| UX/UI | ✅ ACCEPTED CORE | V0.9.3 baseline | additive refinement |
| Automated acceptance | ✅ COMPLETE | V0.9 / Gate 7 | V1 regression protection |
| Public deployment | ✅ COMPLETE | V0.9 / Gate 8 | continuous static Pages publish |
| Fridge search | ✅ ACCEPTED | V0.9.1 / Gate 9A | broader evidence coverage |
| Composable profile | ✅ ACCEPTED | V0.9.2 / Gate 9B | broader recipe variety |
| Preference safety | ✅ ACCEPTED | V0.9.3 | additive product growth |
| Culinary & Nutrition Brain | 🔒 NOT_AUTHORIZED | Deferred | explicit future authorization only |

**Accepted shell/core:** V0.9.3  
**Merged content baseline:** V1 Content Gate A at `1742bd40691cca614db2e12ccaa47499bea48a57`  
**Current candidate:** V1.0.1 evidence/cost/quality tranche  
**Public app:** https://dataraul.github.io/culinary-recommender-app/

Content Gate A materially expanded the project-authored recipe corpus, bilingual canonical ingredient ontology, hierarchical family exclusions and six-class controlled substitution graph. Its PR, post-merge deterministic/browser validation and GitHub Pages deployment all passed.

The next bounded layer keeps three concerns separate:

- **Nutrition evidence:** USDA FoodData Central Foundation Foods source/provenance and identity mapping are now represented without pretending numeric composition has already been imported.
- **Cost intelligence:** relative Spain/Canary portfolio estimates now account for ingredient class, one-off package burden, availability and cross-meal reuse without live supermarket prices.
- **Culinary quality:** full-corpus deterministic normalization covers technique, risk, execution load, equipment, convenience, storage, flavour, novelty and learning value.

## What it does
Choose exactly which lunch/dinner slots need help, then tune budget, nutrition priority, time, skill, variety, cuisine, protein emphasis and meal-prep preference. The app ranks recipes deterministically, optimizes the group for reuse/diversity, explains recommendations, supports one-dish swaps, remembers pantry/availability locally and builds one grocery list.

The V1 work expands what this accepted shell knows rather than turning recipes into unstructured blobs or introducing runtime inference. The public runtime remains backend-free, account-free and runtime-LLM-free.

### Composable profile instead of one persona
Priority packs are bounded soft ranking lenses. Choose up to three and scope each to **all meals, lunch, or dinner**. They never weaken hard dietary, allergen, explicit ingredient, availability, skill or time constraints. The explicit profile dimensions remain independently editable.

### Cuisine discovery
Cuisine remains independent and multi-select. Broad corpus-backed discovery includes Mediterranean, Italian, Spanish, Indian, Thai / Southeast Asian, East Asian, Middle Eastern and Latin American. Local / Canarian remains available for the target food environment without being privileged over global cuisine discovery.

### Fridge-first search
The **Search** tab starts from a main ingredient already available, optionally adds secondary ingredients, and supports temporary meal/time/effort/discovery context. Main ingredient is a hard pre-filter. Secondary ingredients improve ranking by default or can be explicitly required. Saved dietary mode, allergens, permanent ingredient exclusions and temporary unavailable ingredients remain hard constraints.

### Temporary availability vs permanent dislikes
- **Can't get right now** — temporary availability state; a supported safe substitute may be used, otherwise the affected recipe fails closed.
- **Always exclude** — durable hard preference; no substitution can defeat it. Encoded families such as coconut, rice or seafood generalize through the ontology. Future-only exclusions remain stored so later corpus expansion does not silently forget them.

Permanent exclusions have no artificial small-number product cap; practical storage limits are browser-local rather than culinary.

### Declared allergens
Mapped allergen hard filters include gluten, milk/dairy, egg, fish, crustaceans, soy, peanut, tree nuts and sesame. They constrain recipes and substitutions. The project-authored corpus cannot guarantee manufacturing/cross-contamination safety, so severe allergies still require appropriate label checking and professional guidance.

### Controlled substitutions
Replacement options are explicitly classified as:

- `close_substitute`
- `functional_substitute`
- `flavour_direction`
- `texture_substitute`
- `dietary_substitute`
- `emergency_approximation`

These labels describe culinary function, not equivalence. Hard allergens, permanent exclusions and temporary unavailability always override them.

## Nutrition evidence architecture
Current displayed recipe nutrient values remain low-confidence project-authored estimates.

The V1 evidence layer selects **USDA FoodData Central Foundation Foods** as the authoritative static source family and records:

- the verified source/release/licence state;
- canonical ingredient identity matches;
- explicit evidence coverage;
- a strict distinction between source identity and actual imported composition;
- deterministic mass-based per-serving calculation machinery that skips unsupported units instead of guessing piece/tablespoon weights.

The identity ledger is therefore provenance infrastructure, not a false precision upgrade. Authoritative-derived values can replace estimates only after the static composition-density records are actually committed and validated.

## Cost intelligence
Cost remains relative rather than live. The V1 estimator preserves the €–€€€€ interface but refines portfolio cost using:

- project-authored recipe cost tiers as the strongest prior;
- ingredient cost classes;
- Spain/Canary availability assumptions;
- one-off package burden;
- cross-meal ingredient reuse credit.

It deliberately does not display invented exact euros per serving.

## Culinary quality intelligence
A deterministic normalized quality profile can be produced for every recipe, including explicit or instruction-inferred techniques, failure risk, active-share, equipment burden, difficulty/technique depth, meal-prep/batch/freezer/leftover/portability, flavour, spice, familiarity, novelty, learning value, exploration and execution load. Inferred technique provenance remains visible and inspectable.

## Runtime principles
- no account or backend required;
- no runtime LLM or paid API;
- no private Knowledge Core runtime dependency;
- hard constraints run before ranking;
- identical inputs/data/version produce identical recommendations;
- impossible profiles and searches show a shortfall instead of silently weakening hard constraints;
- nutrition/cost uncertainty is explicit;
- local state is versioned and exportable/importable.

## Hosting and validation
The app is a static GitHub Pages site published from `main` / repository root. Public validation remains in `.github/workflows/validate.yml` on standard GitHub-hosted runners.

```bash
npm run validate
npm run test:browser
```

The suite covers deterministic domain behavior, the **15,552-combination** profile matrix, fridge search, scoped priority packs, hard exclusions/allergens, storage/export-import, corpus/ontology/substitution integrity, nutrition-evidence boundaries, cost heuristics, culinary-quality normalization and Chromium browser acceptance including responsive/offline-PWA behavior.

## Data and licensing
The shipped recipe corpus is project-authored and no third-party recipe database is bundled. USDA FoodData Central is used only through the explicitly documented public-domain evidence path; no nutrient composition values are claimed as imported until they actually exist in the repository. BEDCA remains unbundled pending reuse review. Open Food Facts remains a separate ODbL compatibility decision. See `docs/DATA_SOURCES.md`.

This repository currently has **no general licence**. Public visibility is not permission to reuse repository content.

## Documentation
- `docs/PRODUCT_CONTRACT.md`
- `docs/ARCHITECTURE.md`
- `docs/ROADMAP.md`
- `docs/GATES.md`
- `docs/DESIGN_SYSTEM.md`
- `docs/DATA_SOURCES.md`
- `docs/RECOMMENDATION_MODEL.md`
- `docs/TESTING.md`
- `docs/HUMAN_REVIEW.md`
- `docs/DEFERRED_CAPABILITIES.md`
