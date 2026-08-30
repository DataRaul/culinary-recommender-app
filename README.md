# Culinary Recommender

> **Public V0 control surface** — deterministic, mobile-first culinary recommendations, fridge-first search, partial-week planning, substitutions and groceries.

## Control panel

| Area | Status | Current stage | Next unlock |
|---|---|---|---|
| Foundation | ✅ COMPLETE | V0.1 / Gate 1 | — |
| Recipe data | ✅ COMPLETE | V0.2 / Gate 2 | authoritative nutrition mapping expansion |
| Recommender | ✅ COMPLETE | V0.3 / Gate 3 | future policy evidence |
| Planning | ✅ COMPLETE | V0.4 / Gate 4 | broader corpus |
| Grocery / pantry / substitution / budget | ✅ COMPLETE | V0.4 / Gate 5 | price evidence later |
| UX/UI | ✅ COMPLETE | V0.5 / Gate 6 | additive refinement |
| Automated acceptance | ✅ COMPLETE | V0.9 / Gate 7 | regression protection |
| Public deployment | ✅ COMPLETE | V0.9 / Gate 8 | additive refinement |
| Base human review | ✅ ACCEPTED | V0.9 / Gate 9 | additive UX extensions |
| Fridge search | ✅ ACCEPTED | V0.9.1 / Gate 9A | corpus breadth |
| Composable profile | ✅ ACCEPTED | V0.9.2 / Gate 9B | corpus breadth |
| Preference safety + broad automation | ✅ ACCEPTED | V0.9.3 | additive product growth |
| Culinary & Nutrition Brain | 🔒 NOT_AUTHORIZED | Deferred | September KC refresh + explicit authorization |

**Current version:** V0.9.3 accepted shell/core baseline  
**Current status:** CORE_FUNCTIONALITY_ACCEPTED  
**Completed:** deterministic engine, project-authored corpus, ingredient ontology, exact-slot planner, grocery/pantry/substitution/cost, public deployment, fridge-first search, composable meal-scoped priority packs, permanent ingredient exclusions, user-facing allergen hard filters and broad automated browser acceptance  
**Next work:** additive recipe/corpus, ingredient, evidence and UX expansion without reopening the accepted core unless a later change materially alters these contracts  
**Major deferred:** nutrient-gap awareness, supplements, images, local price intelligence, fitness adapter, advanced culinary exploration, Culinary & Nutrition Brain  
**Public app URL:** https://dataraul.github.io/culinary-recommender-app/

## What it does
Choose exactly which lunch/dinner slots need help, then tune budget, nutrition priority, time, skill, variety, cuisine, protein emphasis and meal-prep preference. The app ranks recipes deterministically, optimizes the group for reuse/diversity, explains recommendations, supports one-dish swaps, remembers pantry/availability locally and builds one grocery list.

### Composable profile instead of one persona
The old mutually exclusive preset dropdown has been removed. Presets are now **priority packs**: choose up to three and scope each to **all meals, lunch, or dinner**. This allows combinations such as **Meal Prep for lunch + Culinary Explorer for dinner + Healthy Convenience for all meals** without forcing the user into one permanent persona.

Priority packs are bounded soft ranking signals. They never weaken hard dietary, allergen, explicit ingredient, availability, skill or time constraints. The explicit profile dimensions remain independently editable.

Three is the V0 cap because it is enough to express a primary mode plus two contextual priorities while keeping the interaction legible and preventing stacked soft bonuses from dominating the transparent base score.

### Cuisine discovery
Cuisine remains independent and multi-select. The chooser foregrounds broad corpus-backed discovery choices: **Mediterranean, Italian, Spanish, Indian, Thai / Southeast Asian, East Asian, Middle Eastern and Latin American**. **Local / Canarian** remains available because the target food environment includes the Canary Islands, but it sits at the end rather than being privileged over globally prominent choices. Leaving every cuisine unchecked means no cuisine preference.

### Fridge-first search
The **Search** tab provides a second entry path: start with a main ingredient already in the fridge, optionally add secondary ingredients, then temporarily choose meal context, time, effort/skill and discovery mood. The main ingredient is a hard pre-filter. Secondary ingredients improve ranking by default or can be made required. Saved dietary mode, allergens, permanent ingredient exclusions and temporary unavailable ingredients remain hard constraints even when soft profile preferences are neutralized.

Example: **salmon + rice** ranks a recipe using both ahead of other salmon recipes. An experienced cook can temporarily ask for beginner-simple/fast food, while a beginner with free time can keep the beginner skill ceiling but choose a more exploratory discovery mood. Lunch- or dinner-scoped priority packs participate only when the matching search meal context is selected.

### Temporary availability vs permanent dislikes
The Pantry surface deliberately separates two different intentions:

- **Can't get right now** — temporary availability state. The engine may use a supported safe substitution; if no supported replacement exists, the affected recipe fails closed for now.
- **Always exclude** — a durable hard preference. No substitution is attempted and any matching recipe is removed. Generic encoded ingredient families are supported: entering **coconut** blocks every coconut form represented by the ontology, including the current `coconut_milk` ingredient. A not-yet-corpus ingredient such as **pineapple** is retained as a future exclusion token so later corpus expansion does not silently forget the preference.

Permanent ingredient exclusions are stored as a deduplicated local list with **no product-level small-number cap**. The practical ceiling is browser local-storage capacity, far beyond normal culinary preference use. These preferences remain removable by the user.

### Declared allergens
Profile includes explicit mapped allergen hard filters for gluten, milk/dairy, egg, fish, crustaceans, soy, peanut, tree nuts and sesame. They constrain both recipes and substitutions. The app still states the important boundary: its small mapped corpus cannot guarantee cross-contamination safety, so severe allergies require label checking and appropriate professional guidance.

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

The automated suite covers direct deterministic domain behavior, the **15,552-combination** representative profile matrix, fridge search, scoped priority packs, hard exclusions and allergens, storage/export-import, and two Chromium browser layers: a targeted mobile smoke plus a broader mobile/desktop acceptance journey. The broader browser journey exercises profile composition, cuisines, exact slots, swapping, groceries, pantry state, temporary availability, substitutions, permanent exclusions, search, require-all ingredient matching, user-facing allergen controls, export/import, responsive overflow and offline service-worker recovery.

## Data and licensing
The shipped V0 recipe corpus is project-authored and no third-party recipe database is bundled. USDA FoodData Central is an approved future CC0 nutrition candidate; BEDCA is excluded from V0 bundling because its published reuse terms require care; Open Food Facts remains a future ODbL compatibility decision. See `docs/DATA_SOURCES.md`.

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
