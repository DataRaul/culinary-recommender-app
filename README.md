# Culinary Recommender

> **Public V1 content & intelligence expansion** — deterministic, mobile-first culinary recommendations, fridge-first search, partial-week planning, substitutions and groceries on the accepted V0.9.3 shell/core.

## Control panel

| Area | Status | Current stage | Next unlock |
|---|---|---|---|
| Foundation | ✅ COMPLETE | V0.1 / Gate 1 | — |
| Recipe corpus | ✅ COVERAGE EXPANSION COMPLETE | V1.0.3 / Gate E | coverage-driven iteration |
| Ingredient ontology | ✅ V1 GATE A COMPLETE | V1.0 + pineapple promotion | broader evidence/form coverage |
| Substitutions | ✅ V1 GATE A COMPLETE | V1.0 | more contextual editorial edges |
| Nutrition evidence | ✅ USDA B3 COMPLETE | V1.0.5 | multi-source corroboration |
| European evidence | 🧪 BOUNDED CORROBORATION CANDIDATE | V1.0.6 / B4 | human source-selection policy gate |
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
**Current merged main before this candidate:** `016db58fb01ca0e7cbf8354faf9ca38469e6e0b1`  
**Candidate version:** V1.0.6 European Evidence Corroboration B4  
**Public app:** https://dataraul.github.io/culinary-recommender-app/

Content Gate A expanded the project-authored corpus, bilingual/hierarchical ingredient ontology and six-class substitution graph. PR #7 completed Spain/Canary cost intelligence and culinary-quality normalization. PR #8 completed the first bounded USDA Foundation static composition lane. PR #9 completed coverage-driven Search/corpus expansion. PR #10 completed evidence-backed USDA quantity normalization. PR #11 expanded the reviewed Foundation composition ledger to 29 foods. Each merged gate passed deterministic, matrix/browser and post-merge Pages validation.

## What it does
Choose exact lunch/dinner slots, tune budget, nutrition priority, time, skill, variety, cuisine, protein emphasis and meal-prep preference, and receive deterministic recommendations with ingredient reuse, substitutions and a combined grocery list. The accepted shell remains backend-free, account-free and runtime-LLM-free.

### Hard constraints stay hard
Dietary mode, allergens, permanent exclusions, unsupported temporary availability, maximum time and skill ceilings fail closed where applicable. Priority packs and cuisines are soft ranking signals and cannot override them.

### Fridge-first search
Search begins with a hard-required main ingredient and optional secondary ingredients. Today-specific time, effort and discovery intent can change without rewriting the saved profile. Neutral ingredient-first mode can suppress soft preferences but never safety constraints.

### Coverage-driven corpus growth
V1.0.3 added 15 project-authored recipes selected for ingredient/Search usefulness rather than raw count. `src/domain/corpus-coverage.js` provides a deterministic audit of cuisine, dietary, difficulty, cost, time, protein, meal-prep and canonical-ingredient usage.

### Future exclusions survive ontology growth
`pineapple` previously existed only as a durable future-exclusion token. V1.0.3 promoted it into the canonical English/Spanish ontology and added real pineapple recipes while preserving the same hard exclusion ID.

### Availability, exclusions and allergens are different states
- **Can't get right now** may use an explicitly supported safe substitute; otherwise the recipe fails closed.
- **Always exclude** is durable and substitution-proof, including ontology-family exclusions and future-only tokens that later become real ingredients.
- **Allergens** are separate hard safety filters for both recipes and substitutions.

### Controlled substitutions
Replacement edges are labelled `close_substitute`, `functional_substitute`, `flavour_direction`, `texture_substitute`, `dietary_substitute`, or `emergency_approximation`. They describe culinary function, not equivalence.

## Nutrition evidence architecture
The app has a real but intentionally bounded authoritative evidence lane. USDA FoodData Central Foundation Foods Version 15.0 / 2026-04-30 is one source family, not a claim that U.S. composition is universally representative of European foods.

The original B1 extract contains 14 reviewed Foundation identities. B3 added 15 manually reviewed forms, bringing the bounded combined composition ledger to **29 canonical ingredients**. Candidate keyword matches are never promoted automatically.

Tracked USDA nutrient rules:
- energy prefers Foundation nutrient `2048` (Atwater Specific Factors), with documented fallback capability;
- protein `1003`, carbohydrate-by-difference `1005`, fat `1004`, fibre `1079`;
- a nutrient absent from the selected Foundation record is `null`, never zero.

### Evidence-backed quantity normalization
Canonical banana `piece` / `pieces` may use the USDA source-backed 115 g peeled-banana conversion. A bare tuna `can` / `cans` is rejected as ambiguous because USDA publishes both 107 g drained-solids and 142 g total-content states. Other source household weights remain evidence-only when recipe form/size semantics are underspecified.

Authoritative recipe calculation accepts direct `g`/`kg` plus reviewed unambiguous portion conversions. Unmapped ingredients, unsupported/ambiguous units or missing nutrients produce a **partial** calculation. Partial evidence remains auditable but does not replace the project-authored recipe estimate.

## European evidence lane
B4 adds a bounded **ANSES-Ciqual 2025** secondary evidence module and a provenance-first USDA/Ciqual comparison layer.

Ciqual source facts retained in runtime evidence:
- 2025 release, 3,484-food official catalogue;
- dataset DOI `10.57745/RDMHWY`;
- Etalab Open Licence 2.0 and required ANSES attribution;
- 32 manually reviewed app-relevant food/form records only, not the complete source database;
- English/French food identity, scientific name, per-field confidence code and source-code provenance.

Cross-source semantics remain explicit. USDA carbohydrate `1005` is carbohydrate by difference while Ciqual `31000` / `CHOAVL` is available carbohydrate, so B4 **does not calculate a carbohydrate agreement percentage**. Energy methods differ; protein and fibre remain method-dependent; fat is compared only with form/method caveats. Values are never averaged.

The comparison layer distinguishes no evidence, one-source evidence, reviewed multi-source evidence and multi-source form caveats. It can expose material disagreement without selecting a winner. For example, reviewed Ciqual farmed raw salmon can exist as European evidence even though the bounded USDA lane currently has no salmon record.

**B4 is corroboration-only.** It does not alter `publicNutritionSource`, displayed recipe nutrition, recommendation ranking, constraints or project-authored fallback estimates. Allowing European evidence to become primary is a separate human policy gate.

Fineli/THL Finland remains a strong open candidate, but its documented API and download package returned HTTP 403 to standard GitHub-hosted runners during B4; the project does not bypass that restriction. Frida/DTU, NEVO/RIVM and BEDCA/AESAN remain governed by their exact reuse conditions. EuroFIR remains outside the no-cost contract.

At EU level, EFSA FoodEx2 plus European regulatory datasets form a separate classification/regulatory truth lane. Regulatory/legal evidence is not mixed into measured food composition values. See `docs/EUROPEAN_EVIDENCE.md`.

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
Recipes and application ontology/substitution guidance are project-authored. USDA FoodData Central composition/portion metadata use the documented CC0/public-domain lane. The bounded Ciqual B4 module retains its Etalab Open Licence 2.0 attribution and remains secondary evidence. Other European sources are evaluated independently under their exact access/reuse conditions. See `docs/DATA_SOURCES.md` and `docs/EUROPEAN_EVIDENCE.md`.

This repository currently has **no general licence**. Public visibility is not permission to reuse project-authored repository content.

## Documentation
- `docs/PRODUCT_CONTRACT.md`
- `docs/ARCHITECTURE.md`
- `docs/ROADMAP.md`
- `docs/GATES.md`
- `docs/DESIGN_SYSTEM.md`
- `docs/DATA_SOURCES.md`
- `docs/EUROPEAN_EVIDENCE.md`
- `docs/RECOMMENDATION_MODEL.md`
- `docs/TESTING.md`
- `docs/HUMAN_REVIEW.md`
- `docs/DEFERRED_CAPABILITIES.md`
