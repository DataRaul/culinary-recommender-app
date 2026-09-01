# Culinary Recommender

> **Public V1 content & intelligence expansion** — deterministic, mobile-first culinary recommendations, fridge-first Search, partial-week planning, substitutions and groceries on the accepted V0.9.3 shell/core.

## Control panel

| Area | Status | Current stage | Next ordinary work |
|---|---|---|---|
| Foundation | ✅ COMPLETE | V0.1 / Gate 1 | — |
| Recipe corpus | 🟡 VALIDATED CANDIDATE / HUMAN ACCEPTANCE REQUIRED | V1.1 / Gate F | human public-corpus acceptance |
| Ingredient ontology | ✅ V1 GATE A COMPLETE | hierarchical + bilingual | broader evidence/form coverage |
| Substitutions | ✅ V1 GATE A COMPLETE | six-class controlled graph | contextual editorial edges |
| Nutrition evidence | ✅ MULTI-SOURCE POLICY ACTIVE | V1.0.10 B6 COMPLETE | targeted composition + residual quantity gaps |
| European evidence | ✅ CONDITIONAL PRIMARY POLICY | Ciqual B4+B5 + Matvaretabellen B6 | recipe-level unlocks |
| Cost intelligence | ✅ COMPLETE | Gate C | empirical prices only if separately authorized |
| Culinary quality | ✅ COMPLETE | Gate D | editorial refinement |
| Recommender / planner | ✅ ACCEPTED CORE | V0.9.3 | richer public-safe policy later |
| UX/UI | ✅ ACCEPTED CORE | V0.9.3 | additive refinement |
| Automated acceptance | ✅ COMPLETE | deterministic + 15,552-profile matrix + Chromium | continuing regression protection |
| Public deployment | ✅ COMPLETE | GitHub Pages | continuous static publish |
| Fridge Search | ✅ ACCEPTED | Gate 9A | broader ingredient/evidence coverage |
| Composable profile | ✅ ACCEPTED | Gate 9B | broader recipe variety |
| Preference safety | ✅ ACCEPTED | V0.9.3 | additive product growth |
| Culinary & Nutrition Brain | ✅ P0 AUTHORIZED / FOUNDATION BUILT | Knowledge Core `culinary_nutrition` + static adapter contract | deterministic calibration; behavior changes separately gated |

**Accepted shell/core:** V0.9.3  
**Authoritative coverage baseline:** V1.0.8 / PR #16 / `cdb9a9d9e6d2e0bf0f251bb37098d07dd64e3e9e`  
**Nutrition B5:** V1.0.9 / PR #17 / merged at `5689b0e40c6c4d9d7040b0ee25b7cc41d898b751`  
**Nutrition B6:** V1.0.10 / PR #18 / merged at `dee06f276f0323b5d359b8dc311ae23aac3b2d75`  
**Culinary & Nutrition Brain P0 calibration pin:** Knowledge Core `e5dcb29a7c6b78f59c062faf4c963c74aac10743`  
**Public app:** https://dataraul.github.io/culinary-recommender-app/  
**Recipe Corpus Gate F candidate:** 84 recipes = 76 curated + 8 exact-revision Wikibooks records / 83 dish families / 2 external Search-only + 6 reference-only

The V1 lineage includes project-authored corpus/ontology/substitution expansion, Spain/Canary cost intelligence, full-corpus culinary-quality normalization, bounded USDA Foundation evidence, bounded ANSES-Ciqual 2025 European composition evidence, the user-approved conditional European-primary source policy, deterministic whole-corpus authoritative-nutrition coverage measurement, the bounded Norwegian official portion-evidence lane, and now an explicitly authorized offline Culinary & Nutrition Brain calibration contract.

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

## Recipe Corpus Gate F candidate

Gate F adds a bounded **text-only English Wikibooks Cookbook** RecipeSource under **CC BY-SA 4.0** after an exact rights/attribution/ShareAlike audit. Broad discovery measured **3,792** pages in `Category:Recipes`; only **eight manually reviewed exact revisions** are bundled. No Wikibooks images or bulk source dump are committed.

The public recipe universe is now **84 recipes**: 76 project-authored plus eight open external records, normalized to **83 dish families**. The explicit cross-source `spanish_potato_omelet` family retains both the authored and Wikibooks variants. **Baba Ganoush** and **Bruschetta base** are `SEARCH_ONLY`; the other six records remain `REFERENCE_ONLY_INCOMPLETE_HARD_METADATA` because source-backed time/serving or other hard metadata are incomplete. Unknown values stay unknown rather than being guessed.

External records preserve page ID/title, exact revision ID/timestamp, canonical and revision URLs, Wikibooks contributor attribution, CC BY-SA 4.0, transformation notice and review state. Source recipe nutrition is deliberately **not** imported as authoritative composition; RecipeSource, NutritionSource and regulatory evidence remain separate. Allergens, dietary rules, permanent exclusions, quantity semantics and fail-closed nutrition/recommendation policy continue to apply.

The seven-role audit currently covers canonical/classic and regional/traditional across all eight records, with partial staple/everyday, constraint-first and technique-learning coverage. `contemporary_modern` and `genuinely_new_trending` remain explicit gaps. Gate F is not COMPLETE until human acceptance of the deployed public corpus.

## Nutrition evidence architecture

The public app has a bounded, deterministic, multi-source evidence architecture. It does **not** assume that Europe or the United States is inherently more truthful. Evidence is selected according to reviewed food-form fit, field quality and semantic compatibility while preserving exact provenance.

### USDA FoodData Central Foundation Foods

The bounded USDA lane uses FoodData Central Foundation Foods Version 15.0 / 2026-04-30. The combined B1+B3 composition ledger contains **29 manually reviewed canonical food/form records**.

Tracked USDA fields include energy, protein, carbohydrate by difference, total fat and fibre where published. Missing fields stay `null`, never zero.

### ANSES-Ciqual 2025

The frozen B4 tranche contains **32** manually reviewed ANSES-Ciqual 2025 food/form records. Nutrition B5 added a separate strict tranche of **22**, giving a combined bounded Ciqual composition ledger of **54** while preserving `evidenceTranche` provenance.

Dataset facts remain: DOI `10.57745/RDMHWY`, 3,484 foods / 74 constituents, Etalab Open Licence 2.0, exact ANSES attribution, English/French identity and per-field confidence/source codes.

B5 deliberately rejects weak form matches including cumin seed for ground cumin, generic paprika for smoked paprika, unspecified tofu for firm tofu, cooked lentil forms for dry recipe quantities and egg-containing noodles for generic wheat noodles.

### Evidence-backed quantity normalization

Direct `g` / `kg` quantities remain first-class. Household units are accepted only when a reviewed official source row matches the canonical food and the recipe unit semantics.

Existing USDA behavior remains unchanged: canonical banana `piece(s)` may use the reviewed **115 g peeled banana** weight; a bare tuna `can(s)` fails closed because USDA publishes both 107 g drained-solids and 142 g total-content states.

Nutrition B6 adds a separate bounded Matvaretabellen / Norwegian Food Safety Authority portion lane. The source is the **Norwegian Food Composition Table 2026**, used statically under **NLOD 2.0** with required attribution; no runtime fetch occurs.

B6 promotes only 14 manually reviewed mappings: lemon 80 g/piece, garlic 3 g/clove, extra-virgin olive oil 10 g/tbsp, generic raw tomato 95 g/piece, generic bell pepper 145 g/piece, soy sauce 13 g/tbsp, raw onion 160 g/piece, carrot 80 g/piece, cucumber 325 g/piece, raw egg 55 g/piece, spring onion 19 g/piece, curry powder 3 g/tsp, aubergine 285 g/piece and mango 335 g/piece.

B6 also records non-conversions explicitly. Lime remains ambiguous because the same source food exposes conflicting 17 g and 65 g piece rows. Avocado remains ambiguous between 130 g small and 220 g large. `onion|small`, `sesame_oil|tsp` and `red_onion|piece` remain unsupported. No generic spoon arithmetic, cross-food average or convenient midpoint is introduced.

## Approved European-primary policy

For the Canary Islands / Spain / Europe context, source selection remains deterministic **per ingredient and per nutrient**:

1. reviewed Ciqual evidence may become primary when its food-form match is equally good or better and constituent confidence is `A`, `B` or `C`;
2. a Ciqual `D` field does not displace an available reviewed USDA value;
3. a stronger USDA food-form match remains primary;
4. a reviewed source may supply a nutrient when the other source has no reviewed value;
5. official values are never averaged;
6. exact source, identifier, nutrient semantic, method, form confidence, field confidence, evidence tranche and selection reason remain available in provenance;
7. USDA carbohydrate-by-difference and Ciqual `CHOAVL` are never summed into one authoritative recipe carbohydrate total;
8. if the European-selected mix cannot form a coherent complete recipe calculation but the reviewed USDA lane can, the coherent USDA calculation is retained;
9. otherwise partial/incompatible evidence leaves the project-authored estimate primary.

Quantity-source selection is separate from composition-source selection. A European portion row does not make Norwegian composition primary, and regulatory evidence remains a third separate evidence class.

## Authoritative recipe coverage

PR #16 established the initial 76-recipe baseline at **0 / 76 authoritative**, with 356 missing-density blockers, 86 unsupported-quantity blockers and 12 mixed carbohydrate-semantic incompatibilities.

B5 remained truthfully **0 / 76 authoritative** while reducing missing-density blockers to **141**. Its 202 unsupported-quantity events exposed the next dominant blocker class rather than being guessed away.

B6 was merged through PR #18 after deterministic validation and remains **0 / 76 authoritative**. Its integrated blocker profile is:

- missing-density blocker events: **141**;
- unsupported-quantity-unit blocker events: **27**;
- explicitly ambiguous-portion blocker events: **20**;
- mixed incompatible carbohydrate-semantic events: **16**;
- newly authoritative recipes: **none**.

Thus reviewed portion evidence resolves or reclassifies **175** of B5's 202 formerly unsupported quantity events without manufacturing a complete recipe. The next recipe-level gains require targeted remaining composition forms, residual exact quantity semantics and continued carbohydrate-semantic coherence.

PR #18 merged at `dee06f276f0323b5d359b8dc311ae23aac3b2d75`; post-merge validation run `33446325292` and Pages run `33446324922` both passed.

## Culinary & Nutrition Brain P0

Brain P0 was explicitly authorized on 2026-08-31 and constructed in `DataRaul/knowledge-core` under the Knowledge Core governance protocol. The current reviewed calibration pin is `e5dcb29a7c6b78f59c062faf4c963c74aac10743`.

The Brain combines official WHO/FAO, AESAN, EFSA and NNR evidence with a bounded free operator corpus from J. Kenji López-Alt, Helen Rennie and the Jacques Pépin Foundation. Operator evidence is restricted to culinary technique/workflow; it does not become nutrition, food-safety or medical authority.

The public app consumes no private Knowledge Core data at runtime. `src/data/brain-public-policy-v1.js` is a static, reviewed, provenance-pinned **calibration-only** artifact. It does not currently alter ranking, eligibility, substitutions or nutrition behavior. Any later behavior change requires a separately reviewed public-safe export, deterministic tests, normal PR validation and browser acceptance.

The free operator pass is saturated for P0 fundamentals. Long-form acquisition is therefore gap-triggered: Harold McGee for deeper food chemistry if a concrete decision requires it; Samin Nosrat selectively if flavor-balancing diagnosis remains under-specified; peer-reviewed cooking/yield/nutrient-retention research when it can unblock authoritative recipe nutrition; and cuisine-specific expert/primary sources for authenticity/adaptation. *The Food Lab* is not an immediate ingestion priority because the current free Kenji corpus already covers substantial overlapping mechanism evidence.

See `docs/BRAIN_ADAPTER_CONTRACT.md`.

## European source status

Fineli/THL Finland remains a strong open CC BY 4.0 candidate, but its documented API and official package returned HTTP 403 to standard GitHub-hosted runners during the bounded audit, so the project does not bypass that restriction or bundle Fineli data. Frida/DTU, NEVO/RIVM and BEDCA/AESAN remain governed by their exact reuse terms. EuroFIR remains outside the no-cost contract.

Matvaretabellen licensing has been verified for the bounded attributed B6 portion subset under NLOD 2.0. B6 uses portion evidence only; it does not silently introduce Norwegian composition or change the European-primary composition policy.

EFSA FoodEx2 and EU Commission regulatory datasets form a separate classification/regulatory truth lane. Legal limits and authorisations are not converted into nutrient-composition measurements or recommendation rules without a future explicit behavior contract.

## Cost and culinary quality

Cost remains a deterministic relative €–€€€€ heuristic combining authored recipe tiers with ingredient classes, Spain/Canary availability assumptions, one-off package burden and cross-meal reuse. It does not claim live supermarket prices or invented exact euro values.

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
npm run report:nutrition-coverage
npm run report:recipe-universe
npm run verify:wikibooks-gate-f
```

## Data and licensing

The original 76 curated recipes and application ontology/substitution guidance are project-authored. The Gate F candidate additionally bundles eight transformed, exact-revision English Wikibooks recipe records under CC BY-SA 4.0 with attribution and ShareAlike controls documented in `docs/WIKIBOOKS_GATE_F_RIGHTS_AUDIT.md` and `THIRD_PARTY_NOTICES.md`. USDA FoodData Central composition/portion metadata use the documented CC0/public-domain lane. The bounded Ciqual modules retain Etalab Open Licence 2.0 attribution. The bounded Matvaretabellen B6 portion module retains NLOD 2.0 source identity and attribution. Brain-derived public artifacts must contain only normalized source-safe reasoning and provenance metadata permitted by the adapter contract; copyrighted source prose/transcripts are not exported.

This repository currently has **no general licence**. Public visibility is not permission to reuse project-authored repository content.

## Documentation

- `docs/PRODUCT_CONTRACT.md`
- `docs/ARCHITECTURE.md`
- `docs/ROADMAP.md`
- `docs/GATES.md`
- `docs/BRAIN_ADAPTER_CONTRACT.md`
- `docs/DESIGN_SYSTEM.md`
- `docs/DATA_SOURCES.md`
- `docs/EUROPEAN_EVIDENCE.md`
- `docs/NUTRITION_COVERAGE_AUDIT.md`
- `docs/RECOMMENDATION_MODEL.md`
- `docs/TESTING.md`
- `docs/HUMAN_REVIEW.md`
- `docs/DEFERRED_CAPABILITIES.md`
