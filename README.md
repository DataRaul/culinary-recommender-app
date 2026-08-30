# Culinary Recommender

> **Public V1 content expansion candidate** — deterministic, mobile-first culinary recommendations, fridge-first search, partial-week planning, substitutions and groceries on the accepted V0.9.3 shell/core.

## Control panel

| Area | Status | Current stage | Next unlock |
|---|---|---|---|
| Foundation | ✅ COMPLETE | V0.1 / Gate 1 | — |
| Recipe data | 🧪 V1 EXPANSION | Content Gate A | authoritative nutrition evidence |
| Ingredient ontology | 🧪 V1 EXPANSION | Content Gate A | evidence-backed nutrition/cost mappings |
| Recommender | ✅ ACCEPTED CORE | V0.9.3 baseline | richer policy data later |
| Planning | ✅ ACCEPTED CORE | V0.9.3 baseline | benefits automatically from broader corpus |
| Grocery / pantry / substitution / budget | 🧪 SUBSTITUTIONS EXPANDED | Content Gate A | stronger cost evidence later |
| UX/UI | ✅ ACCEPTED CORE | V0.9.3 baseline | additive refinement |
| Automated acceptance | ✅ COMPLETE | V0.9 / Gate 7 | V1 regression protection |
| Public deployment | ✅ COMPLETE | V0.9 / Gate 8 | publish V1 after green merge |
| Base human review | ✅ ACCEPTED | V0.9 / Gate 9 | no routine corpus re-gate |
| Fridge search | ✅ ACCEPTED | V0.9.1 / Gate 9A | broader ingredient coverage |
| Composable profile | ✅ ACCEPTED | V0.9.2 / Gate 9B | broader recipe variety |
| Preference safety + broad automation | ✅ ACCEPTED | V0.9.3 | additive product growth |
| Culinary & Nutrition Brain | 🔒 NOT_AUTHORIZED | Deferred | explicit future authorization only |

**Accepted baseline:** V0.9.3 shell/core  
**Candidate version:** V1.0.0 Content Gate A  
**Current status:** CONTENT_EXPANSION_VALIDATION_PENDING  
**Completed baseline:** deterministic engine, exact-slot planner, grocery/pantry, fridge-first search, composable meal-scoped priority packs, permanent ingredient exclusions, user-facing allergen hard filters, public deployment and broad automated browser acceptance  
**V1 Content Gate A:** materially broader project-authored recipe corpus, expanded bilingual canonical ingredient ontology, hierarchical family exclusions, six-class controlled substitution graph, full-corpus regression coverage and offline precaching  
**Next work after Gate A:** authoritative nutrition evidence, stronger deterministic cost intelligence, broader normalized culinary-quality metadata  
**Major deferred:** nutrient-gap awareness, supplements, images, live/local price intelligence, fitness adapter, advanced culinary exploration, Culinary & Nutrition Brain  
**Public app URL:** https://dataraul.github.io/culinary-recommender-app/

## What it does
Choose exactly which lunch/dinner slots need help, then tune budget, nutrition priority, time, skill, variety, cuisine, protein emphasis and meal-prep preference. The app ranks recipes deterministically, optimizes the group for reuse/diversity, explains recommendations, supports one-dish swaps, remembers pantry/availability locally and builds one grocery list.

V1 Content Gate A keeps that accepted shell intact and expands the data it can reason over. New recipes remain structured records rather than unstructured prose blobs; the public runtime remains backend-free, account-free and runtime-LLM-free.

### Composable profile instead of one persona
The old mutually exclusive preset dropdown has been removed. Presets are now **priority packs**: choose up to three and scope each to **all meals, lunch, or dinner**. This allows combinations such as **Meal Prep for lunch + Culinary Explorer for dinner + Healthy Convenience for all meals** without forcing the user into one permanent persona.

Priority packs are bounded soft ranking signals. They never weaken hard dietary, allergen, explicit ingredient, availability, skill or time constraints. The explicit profile dimensions remain independently editable.

Three is the accepted V0/V1 shell cap because it is enough to express a primary mode plus two contextual priorities while keeping the interaction legible and preventing stacked soft bonuses from dominating the transparent base score.

### Cuisine discovery
Cuisine remains independent and multi-select. The chooser foregrounds broad corpus-backed discovery choices: **Mediterranean, Italian, Spanish, Indian, Thai / Southeast Asian, East Asian, Middle Eastern and Latin American**. **Local / Canarian** remains available because the target food environment includes the Canary Islands, but it sits at the end rather than being privileged over globally prominent choices. Leaving every cuisine unchecked means no cuisine preference.

### Fridge-first search
The **Search** tab provides a second entry path: start with a main ingredient already in the fridge, optionally add secondary ingredients, then temporarily choose meal context, time, effort/skill and discovery mood. The main ingredient is a hard pre-filter. Secondary ingredients improve ranking by default or can be made required. Saved dietary mode, allergens, permanent ingredient exclusions and temporary unavailable ingredients remain hard constraints even when soft profile preferences are neutralized.

Example: **salmon + rice** ranks a recipe using both ahead of other salmon recipes. An experienced cook can temporarily ask for beginner-simple/fast food, while a beginner with free time can keep the beginner skill ceiling but choose a more exploratory discovery mood. Lunch- or dinner-scoped priority packs participate only when the matching search meal context is selected.

### Temporary availability vs permanent dislikes
The Pantry surface deliberately separates two different intentions:

- **Can't get right now** — temporary availability state. The engine may use a supported safe substitution; if no supported replacement exists, the affected recipe fails closed for now.
- **Always exclude** — a durable hard preference. No substitution is attempted and any matching recipe is removed. Generic encoded ingredient families are supported: entering **coconut** blocks every coconut form represented by the ontology. V1 hierarchical families also support broader encoded groups such as rice and seafood. A not-yet-corpus ingredient such as **pineapple** is retained as a future exclusion token so later corpus expansion does not silently forget the preference.

Permanent ingredient exclusions are stored as a deduplicated local list with **no product-level small-number cap**. The practical ceiling is browser local-storage capacity, far beyond normal culinary preference use. These preferences remain removable by the user.

### Declared allergens
Profile includes explicit mapped allergen hard filters for gluten, milk/dairy, egg, fish, crustaceans, soy, peanut, tree nuts and sesame. They constrain both recipes and substitutions. The app still states the important boundary: its project-authored mapped corpus cannot guarantee manufacturing or cross-contamination safety, so severe allergies require label checking and appropriate professional guidance.

### Controlled substitutions
V1 expands substitutions while making their limitations more explicit. Replacement options are classified as `close_substitute`, `functional_substitute`, `flavour_direction`, `texture_substitute`, `dietary_substitute`, or `emergency_approximation`. These labels describe culinary function rather than claiming equivalence. Hard allergens, permanent exclusions and temporary unavailability always override them.

## Runtime principles
- no account or backend required;
- no runtime LLM or paid API;
- no private Knowledge Core runtime dependency;
- hard constraints run before ranking;
- identical inputs/data/version produce identical recommendations;
- impossible profiles and searches show a shortfall rather than silently weakening hard constraints;
- nutrition/cost uncertainty is explicit;
- local state is versioned and exportable/importable.

## Hosting and validation
The app is published as a static GitHub Pages site from `main` / repository root, matching the simpler pattern used by the related public apps. There is no dedicated Pages deployment workflow. Public validation remains in `.github/workflows/validate.yml` on standard GitHub-hosted runners.

```bash
npm run validate
npm run test:browser
```

The automated suite covers direct deterministic domain behavior, the **15,552-combination** representative profile matrix, fridge search, scoped priority packs, hard exclusions and allergens, storage/export-import, V1 corpus/ontology/substitution integrity, and two Chromium browser layers: a targeted mobile smoke plus a broader mobile/desktop acceptance journey. The broader browser journey exercises profile composition, cuisines, exact slots, swapping, groceries, pantry state, temporary availability, substitutions, permanent exclusions, search, require-all ingredient matching, user-facing allergen controls, export/import, responsive overflow and offline service-worker recovery.

## Data and licensing
The shipped recipe corpus is project-authored and no third-party recipe database is bundled. V1 Content Gate A remains inside that boundary. Current recipe nutrition values are explicitly low-confidence project estimates. USDA FoodData Central remains the leading candidate for a later static authoritative nutrition mapping; BEDCA remains unbundled pending reuse review; Open Food Facts remains a separate ODbL compatibility decision. See `docs/DATA_SOURCES.md`.

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
