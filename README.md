# Culinary Recommender

> **Public V1 content & intelligence expansion** — deterministic, mobile-first culinary recommendations, fridge-first Search, partial-week planning, substitutions and groceries on the accepted V0.9.3 shell/core.

## Control panel

| Area | Status | Current stage | Next ordinary work |
|---|---|---|---|
| Foundation | ✅ COMPLETE | V0.1 / Gate 1 | — |
| Recipe corpus | ✅ COVERAGE EXPANSION COMPLETE | V1.0.3 / Gate E | coverage-driven iteration |
| Ingredient ontology | ✅ V1 GATE A COMPLETE | hierarchical + bilingual | broader evidence/form coverage |
| Substitutions | ✅ V1 GATE A COMPLETE | six-class controlled graph | contextual editorial edges |
| Nutrition evidence | ✅ MULTI-SOURCE POLICY ACTIVE | V1.0.7 | authoritative coverage expansion |
| European evidence | ✅ CONDITIONAL PRIMARY POLICY | Ciqual B4 + V1.0.7 | more reviewed European forms |
| Cost intelligence | ✅ COMPLETE | Gate C | empirical prices only if separately authorized |
| Culinary quality | ✅ COMPLETE | Gate D | editorial refinement |
| Recommender / planner | ✅ ACCEPTED CORE | V0.9.3 | richer public-safe policy later |
| UX/UI | ✅ ACCEPTED CORE | V0.9.3 | additive refinement |
| Automated acceptance | ✅ COMPLETE | deterministic + 15,552-profile matrix + Chromium | continuing regression protection |
| Public deployment | ✅ COMPLETE | GitHub Pages | continuous static publish |
| Fridge Search | ✅ ACCEPTED | Gate 9A | broader ingredient/evidence coverage |
| Composable profile | ✅ ACCEPTED | Gate 9B | broader recipe variety |
| Preference safety | ✅ ACCEPTED | V0.9.3 | additive product growth |
| Culinary & Nutrition Brain | 🔒 NOT_AUTHORIZED | Deferred | explicit future authorization only |

**Accepted shell/core:** V0.9.3  
**Current functional V1.0.7 merge:** `cfa3b9115821b59321c7ef19e779ff3a578aa6b6`  
**Public app:** https://dataraul.github.io/culinary-recommender-app/

The V1 lineage now includes project-authored corpus/ontology/substitution expansion, Spain/Canary cost intelligence, full-corpus culinary-quality normalization, bounded USDA Foundation evidence, evidence-backed quantity normalization, bounded ANSES-Ciqual 2025 European evidence, and the user-approved conditional European-primary source policy. Every merged implementation gate passed deterministic/static validation, the representative 15,552-profile matrix where applicable, comprehensive Chromium acceptance, post-merge validation and GitHub Pages deployment.

## What it does

Choose exact lunch/dinner slots, tune budget, nutrition priority, time, skill, variety, cuisine, protein emphasis and meal-prep preference, and receive deterministic recommendations with ingredient reuse, controlled substitutions and a combined grocery list. The accepted shell remains backend-free, account-free and runtime-LLM-free.

### Hard constraints stay hard

Dietary mode, allergens, permanent exclusions, unsupported temporary availability, maximum time and skill ceilings fail closed where applicable. Priority packs and cuisines are soft ranking signals and cannot override them.

### Fridge-first Search

Search begins with a hard-required main ingredient and optional secondary ingredients. Today-specific time, effort and discovery intent can change without rewriting the saved profile. Neutral ingredient-first mode can suppress soft preferences but never safety constraints.

### Availability, exclusions and allergens are different states

- **Can't get right now** may use an explicitly supported safe substitute; otherwise the recipe fails closed.
- **Always exclude** is durable and substitution-proof, including ontology-family exclusions and future-only tokens that later become real ingredients.
- **Allergens** are separate hard safety filters for recipes and substitutions.

### Controlled substitutions

Replacement edges are labelled `close_substitute`, `functional_substitute`, `flavour_direction`, `texture_substitute`, `dietary_substitute`, or `emergency_approximation`. They describe culinary function rather than false equivalence.

## Coverage-driven recipe intelligence

V1 corpus growth is selected for Search/planner usefulness rather than raw recipe count. `src/domain/corpus-coverage.js` audits cuisine, dietary, difficulty, cost, time, protein, meal-prep and canonical-ingredient usage deterministically.

The durable future-exclusion lifecycle is also tested: `pineapple` existed first as a saved future exclusion token, was later promoted into the bilingual canonical ontology, and real pineapple recipes remain hard-blocked for users who had already excluded it.

## Nutrition evidence architecture

The public app has a bounded, deterministic, multi-source evidence architecture. It does **not** assume that Europe or the United States is inherently more truthful. It chooses evidence according to reviewed food-form fit, field quality and semantic compatibility while preserving exact provenance.

### USDA FoodData Central Foundation Foods

The bounded USDA lane uses FoodData Central Foundation Foods Version 15.0 / 2026-04-30. The combined B1+B3 ledger contains **29 manually reviewed canonical food/form records**.

Tracked USDA fields include:
- energy: Atwater-specific nutrient `2048` preferred;
- protein: `1003`;
- carbohydrate by difference: `1005`;
- total fat: `1004`;
- fibre: `1079` where published.

Missing fields stay `null`, never zero.

### Evidence-backed quantity normalization

Canonical banana `piece(s)` may use USDA's reviewed 115 g peeled-banana weight. A bare tuna `can(s)` fails closed because USDA publishes both 107 g drained-solids and 142 g total-content states. Broccoli/egg/onion portion rows remain evidence-only where current recipe semantics are not specific enough to apply them safely.

No generic internet spoon/piece averages are used merely to increase coverage.

### ANSES-Ciqual 2025 European evidence

B4 adds a bounded **ANSES-Ciqual 2025** module:
- dataset DOI `10.57745/RDMHWY`;
- 3,484-food official catalogue / 74 constituents;
- Etalab Open Licence 2.0 and required ANSES attribution;
- 32 manually reviewed app-relevant food/form records, not the full database;
- English/French identity, scientific name where available, form-review notes, per-field confidence and source codes retained.

USDA and Ciqual nutrient definitions are not flattened. In particular, USDA `1005` is carbohydrate by difference whereas Ciqual `CHOAVL` is available carbohydrate.

## Approved European-primary policy

For the Canary Islands / Spain / Europe context, V1.0.7 applies a deterministic source policy **per ingredient and per nutrient**:

1. reviewed Ciqual evidence may become primary when its food-form match is equally good or better and the constituent confidence is `A`, `B` or `C`;
2. a Ciqual `D` field does not displace an available reviewed USDA value;
3. a stronger USDA food-form match remains primary;
4. a reviewed source may supply a nutrient when the other source has no reviewed value;
5. official values are never averaged;
6. source, identifier, nutrient semantic, method, form confidence, field confidence and selection reason remain available in provenance;
7. USDA carbohydrate-by-difference and Ciqual `CHOAVL` are never summed into a single authoritative recipe carbohydrate total;
8. if the European-selected mix cannot form a coherent complete recipe calculation but the reviewed USDA lane can, the coherent USDA calculation is retained;
9. otherwise partial/incompatible evidence leaves the project-authored estimate primary.

This policy changes nutrition evidence selection only. It does not relax recommendation hard constraints, allergy/dietary safety, permanent exclusions or medical boundaries.

Fineli/THL Finland remains a strong open CC BY 4.0 candidate, but its documented API and official package returned HTTP 403 to standard GitHub-hosted runners during the bounded audit, so the project does not bypass that restriction or bundle Fineli data. Frida/DTU, NEVO/RIVM and BEDCA/AESAN remain governed by their exact reuse terms. EuroFIR remains outside the no-cost contract.

EFSA FoodEx2 and EU Commission regulatory datasets form a separate classification/regulatory truth lane. Legal limits and authorisations are not converted into nutrient-composition measurements or recommendation rules without a future explicit behavior contract.

## Cost intelligence

The deterministic relative €–€€€€ estimator combines authored recipe tiers with ingredient classes, Spain/Canary availability assumptions, one-off package burden and cross-meal reuse. It does not claim live supermarket prices or invented exact euro values.

## Culinary quality intelligence

Every recipe can be normalized across technique depth, failure risk, active execution share, equipment burden, difficulty, meal-prep/batch/freezer/leftovers/portability, flavour, spice, familiarity, novelty, learning and exploration. Technique inference is deterministic over project-authored instructions and remains inspectable.

## Runtime principles

- no account or backend;
- no runtime LLM or paid API;
- no private Knowledge Core runtime dependency;
- deterministic stable tie-breaking;
- impossible profiles show shortfalls rather than relaxed constraints;
- nutrition/cost uncertainty remains visible;
- local state is versioned and portable.

## Hosting and validation

The app is a static GitHub Pages site published from `main` / repository root. Public validation uses standard GitHub-hosted runners and covers domain/static behavior, the **15,552-combination** representative profile matrix, Chromium browser acceptance, responsive/offline PWA behavior and V1 evidence layers.

```bash
npm run validate
npm run test:browser
```

## Data and licensing

Recipes and application ontology/substitution guidance are project-authored. USDA FoodData Central composition/portion metadata use the documented CC0/public-domain lane. The bounded Ciqual module retains Etalab Open Licence 2.0 attribution. Other European sources are evaluated independently under their exact access/reuse conditions.

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
