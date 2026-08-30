# Culinary Recommender

> **Public V1 content & intelligence expansion** — deterministic, mobile-first culinary recommendations, fridge-first search, partial-week planning, substitutions and groceries on the accepted V0.9.3 shell/core.

## Control panel

| Area | Status | Current stage | Next unlock |
|---|---|---|---|
| Foundation | ✅ COMPLETE | V0.1 / Gate 1 | — |
| Recipe corpus | ✅ V1 GATE A COMPLETE | V1.0 | coverage-driven authored expansion |
| Ingredient ontology | ✅ V1 GATE A COMPLETE | V1.0 | broader evidence/form coverage |
| Substitutions | ✅ V1 GATE A COMPLETE | V1.0 | more contextual editorial edges |
| Nutrition evidence | 🧪 BOUNDED STATIC CANDIDATE | V1.0.2 / Gate B1 | broader USDA + explicit unit weights |
| Cost intelligence | ✅ COMPLETE | Gate C / PR #7 | later empirical price evidence if authorized |
| Culinary quality | ✅ COMPLETE | Gate D / PR #7 | editorial refinement |
| Recommender / planner | ✅ ACCEPTED CORE | V0.9.3 baseline | richer public-safe policy later |
| UX/UI | ✅ ACCEPTED CORE | V0.9.3 baseline | additive refinement |
| Automated acceptance | ✅ COMPLETE | Gate 7 | continuing regression protection |
| Public deployment | ✅ COMPLETE | Gate 8 | continuous static Pages publish |
| Fridge search | ✅ ACCEPTED | Gate 9A | broader ingredient/evidence coverage |
| Composable profile | ✅ ACCEPTED | Gate 9B | broader recipe variety |
| Preference safety | ✅ ACCEPTED | V0.9.3 | additive product growth |
| Culinary & Nutrition Brain | 🔒 NOT_AUTHORIZED | Deferred | explicit future authorization only |

**Accepted shell/core:** V0.9.3  
**Current merged main before this candidate:** `59ae06755d1c681aa5f56d4f20e8bdaf1d01bec2`  
**Candidate version:** V1.0.2 bounded USDA static composition  
**Public app:** https://dataraul.github.io/culinary-recommender-app/

Content Gate A expanded the project-authored recipe corpus, bilingual/hierarchical ingredient ontology and six-class substitution graph. PR #7 then completed explainable Spain/Canary cost intelligence and full-corpus culinary-quality normalization, with deterministic/matrix/browser validation and Pages deployment green.

## What it does
Choose exact lunch/dinner slots, tune budget, nutrition priority, time, skill, variety, cuisine, protein emphasis and meal-prep preference, and receive deterministic recommendations with ingredient reuse, substitutions and a combined grocery list. The accepted shell remains backend-free, account-free and runtime-LLM-free.

### Hard constraints stay hard
Dietary mode, allergens, permanent exclusions, unsupported temporary availability, maximum time and skill ceilings fail closed where applicable. Priority packs and cuisines are soft ranking signals and cannot override them.

### Fridge-first search
Search begins with a hard-required main ingredient and optional secondary ingredients. Today-specific time, effort and discovery intent can change without rewriting the saved profile. Neutral ingredient-first mode can suppress soft preferences but never safety constraints.

### Availability, exclusions and allergens are different states
- **Can't get right now** may use an explicitly supported safe substitute; otherwise the recipe fails closed.
- **Always exclude** is durable and substitution-proof, including ontology-family exclusions and future-only tokens.
- **Allergens** are separate hard safety filters for both recipes and substitutions.

### Controlled substitutions
Replacement edges are labelled `close_substitute`, `functional_substitute`, `flavour_direction`, `texture_substitute`, `dietary_substitute`, or `emergency_approximation`. They describe culinary function, not equivalence.

## Nutrition evidence architecture
The app now has a real but intentionally **bounded** authoritative evidence lane based on **USDA FoodData Central Foundation Foods Version 15.0 (2026-04-30)**.

A reproducible extractor downloaded the official static Foundation CSV archive and selected only 14 already-reviewed canonical ingredient matches. The USDA bulk database is not bundled. `src/data/usda-foundation-nutrients-v1.js` preserves NDB number, FDC ID, source description, publication date, tracked nutrient IDs and per-100g composition.

Tracked nutrient rules:
- energy prefers Foundation nutrient `2048` (Atwater Specific Factors), with documented fallback capability rather than ambiguous energy mixing;
- protein `1003`, carbohydrate `1005`, fat `1004`, fibre `1079`;
- a nutrient absent from the selected Foundation record is `null`, never zero.

Recipe calculation is deliberately strict. Today authoritative calculation accepts explicit `g`/`kg` quantities only. Unmapped ingredients, spoon/piece units or missing nutrients produce a **partial** calculation. Partial USDA evidence is exposed for audit but does **not** replace the existing project-authored recipe estimate.

Only when every required ingredient, unit and tracked nutrient is covered can the NutritionSource return the static USDA-derived recipe calculation as primary. Even then confidence is medium rather than falsely exact because cooking/yield and form assumptions remain relevant.

## Cost intelligence
The deterministic relative €–€€€€ estimator combines authored recipe cost tiers with ingredient classes, Spain/Canary availability, one-off package burden and cross-meal reuse. It does not claim live supermarket prices or invented exact euro values.

## Culinary quality intelligence
Every recipe can be normalized across technique depth, explicit/instruction-inferred techniques, failure risk, active execution share, equipment burden, difficulty, meal-prep/batch/freezer/leftovers/portability, flavour, spice, familiarity, novelty, learning and exploration. Technique inference is deterministic over project-authored instructions and remains inspectable.

## Runtime principles
- no account or backend;
- no runtime LLM or paid API;
- no private Knowledge Core runtime dependency;
- deterministic stable tie-breaking;
- impossible profiles show shortfalls rather than relaxed constraints;
- nutrition/cost uncertainty remains visible;
- local state is versioned and portable.

## Hosting and validation
The app is a static GitHub Pages site published from `main` / repository root. Public validation uses standard GitHub-hosted runners and covers domain/static behavior, the **15,552-combination** profile matrix, browser acceptance, responsive/offline PWA behavior and the V1 data/evidence layers.

```bash
npm run validate
npm run test:browser
```

## Data and licensing
Recipes and application ontology/substitution guidance are project-authored. USDA FoodData Central composition is used through the documented CC0/public-domain static evidence lane. BEDCA remains unbundled pending reuse review; Open Food Facts remains a separate ODbL compatibility decision. See `docs/DATA_SOURCES.md`.

This repository currently has **no general licence**. Public visibility is not permission to reuse project-authored repository content.

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
