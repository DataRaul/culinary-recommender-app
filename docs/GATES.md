# Gate Registry

## Accepted shell/core

| Gate | State | Capability |
|---|---|---|
| Gate 1 | COMPLETE | foundation, governance, architecture |
| Gate 2 | COMPLETE | canonical recipe model, ingredient ontology, provenance, authored corpus |
| Gate 3 | COMPLETE | composable profile dimensions, hard constraints, deterministic scoring |
| Gate 4 | COMPLETE | exact-slot partial-week planning, diversity/reuse, isolated swap |
| Gate 5 | COMPLETE | groceries, pantry, temporary availability, permanent exclusions, substitutions, relative cost |
| Gate 6 | COMPLETE | mobile-first UX, accessibility baseline, local profile/export-import |
| Gate 7 | COMPLETE | deterministic/static/browser/matrix acceptance |
| Gate 8 | COMPLETE | GitHub Pages public deployment |
| Gate 9 | ACCEPTED | original human acceptance |
| Gate 9A | ACCEPTED | fridge-first ingredient Search + temporary today-intent overrides |
| Gate 9B | ACCEPTED | up-to-three meal-scoped priority packs + independent cuisine preferences |
| V0.9.3 | ACCEPTED BASELINE | permanent exclusions, mapped allergens, broad integrated acceptance |

The accepted shell/core is not reopened by routine corpus, ontology, evidence or Brain-calibration growth. Hard constraints remain fail-closed. Priority packs and cuisines remain bounded soft signals.

## V1 Content Gate A — COMPLETE

Merged through PR #6 to `main` at `1742bd40691cca614db2e12ccaa47499bea48a57` after green deterministic and Chromium validation; post-merge validation and Pages deployment passed.

Delivered a materially broader project-authored recipe corpus, bilingual/hierarchical ingredient ontology, generalized family exclusions and a six-class controlled substitution graph. No third-party recipe database, paid API, runtime LLM or private Knowledge Core runtime dependency was introduced.

## V1 Nutrition Foundation / B1 — COMPLETE

The evidence framework and first bounded USDA Foundation tranche completed through PRs #7 and #8. B1 merged at `5dc9c668df8ac96361657cd403b95bf05e859ac9` with green PR/post-merge validation and Pages deployment.

Standing rules:

- USDA FoodData Central Foundation Foods Version 15.0 / 2026-04-30;
- only manually reviewed bounded static records are committed;
- missing nutrient fields remain `null`, never zero;
- direct `g` / `kg` quantities qualify for deterministic calculation;
- unsupported quantities, unmapped foods or missing nutrients keep the calculation partial;
- recipe estimates are replaced only by complete authoritative calculations.

## V1 Nutrition Gate B2 — COMPLETE

Merged through PR #10 at `225cd4ade1bd7af374d465600118cff79dbd4c6c`; deterministic/static, 15,552-profile matrix, Chromium, post-merge and Pages validation passed.

USDA household-weight evidence remains separate from conversion policy. Banana `piece(s)` may use the reviewed 115 g peeled weight. Tuna `can(s)` remains ambiguous because source rows distinguish 107 g drained solids and 142 g total contents. Generic spoon/piece averages are prohibited.

## V1 Nutrition Gate B3 — COMPLETE

Merged through PR #11 at `016db58fb01ca0e7cbf8354faf9ca38469e6e0b1`; deterministic/static, matrix, Chromium, post-merge and Pages validation passed.

Fifteen additional USDA Foundation forms brought the bounded USDA composition ledger to 29 records. Broccoli, egg and onion household weights remain evidence-only where the app's canonical semantics are insufficient for automatic use.

## V1 European Evidence Gate B4 — COMPLETE

Merged through PR #12 at `fd33037ce48a75b60ac5b8ca7d7526b7ffb15061` with green pre/post-merge validation and Pages deployment.

B4 introduced ANSES-Ciqual 2025 as a bounded second official composition source:

- dataset DOI `10.57745/RDMHWY`;
- 3,484 foods / 74 constituents;
- Etalab Open Licence 2.0 with ANSES attribution;
- 32 manually reviewed app-relevant food/form mappings;
- exact identity, match notes, per-field confidence and source codes retained.

B4 also introduced a comparison/audit layer. It never averages sources and preserves semantic differences, especially USDA carbohydrate-by-difference (`1005`) versus Ciqual available carbohydrate (`CHOAVL`). B4's original introduction state remains frozen history.

## V1.0.7 European Primary Nutrition Policy — COMPLETE / USER-APPROVED

The user explicitly approved the conditional European-primary policy on 2026-08-31. PR #13 merged it to `main` at `cfa3b9115821b59321c7ef19e779ff3a578aa6b6`; deterministic/static validation, the 15,552-profile matrix, Chromium acceptance, post-merge validation and Pages deployment passed.

The policy is conditional, not geographical dogma:

1. source selection occurs **per ingredient and per tracked nutrient**;
2. reviewed Ciqual evidence may become primary when food-form match is equally good or better and constituent confidence is `A`, `B` or `C`;
3. Ciqual `D` does not displace an available reviewed USDA value, although reviewed `D` may remain usable where no reviewed USDA value exists;
4. a stronger USDA food-form match remains primary;
5. no official values are averaged;
6. exact source, identifier, nutrient semantic, method, form confidence, field confidence, evidence tranche and selection reason remain available;
7. USDA carbohydrate-by-difference and Ciqual `CHOAVL` are never summed into one authoritative recipe carbohydrate total;
8. when the Europe-selected mix is incomplete or semantically incompatible but the reviewed USDA lane can form a coherent complete recipe calculation, that coherent USDA calculation is retained;
9. otherwise the project-authored estimate remains primary;
10. composition policy does not alter dietary/allergen/permanent-exclusion safety, recommendation ranking, medical boundaries or the accepted shell.

This human gate is resolved. Ordinary evidence expansion under these semantics does not reopen it.

## V1.0.8 Authoritative Nutrition Coverage Audit — COMPLETE

Merged through PR #16 at `cdb9a9d9e6d2e0bf0f251bb37098d07dd64e3e9e` after green validation/deployment.

The first whole-corpus deterministic audit established:

- recipes: **76**;
- authoritative recipes: **0 / 76**;
- missing-density blocker events: **356**;
- unsupported-quantity blocker events: **86**;
- mixed incompatible carbohydrate-semantic events: **12**.

The zero result is accepted evidence that the fail-closed contract is working. Future evidence gates are evaluated by recipe-level unlocks and blocker reduction, not raw database size.

## V1.0.9 Nutrition B5 — COMPLETE

PR #17 added **22 manually reviewed ANSES-Ciqual food/form records** while preserving the frozen 32-record B4 tranche. Runtime composition evidence therefore exposes B4 and B5 separately and a combined reviewed Ciqual count of **54**.

The source-selection contract remained unchanged. Deferred form mismatches such as cumin seed for ground cumin, generic paprika for smoked paprika, unspecified tofu for firm tofu and egg-containing noodles for generic wheat noodles stayed unpromoted.

The integrated B5 coverage result remained fail-closed:

- authoritative recipes: **0 / 76**;
- missing-density blockers: **141**, down from 356;
- unsupported-quantity blockers: **202**, because former density blockers advanced to their next truthful blocker;
- mixed incompatible carbohydrate-semantic events: **16**;
- newly authoritative recipes: **none**.

PR #17 merged at `5689b0e40c6c4d9d7040b0ee25b7cc41d898b751`. Post-merge validation run `33443904301` and Pages run `33443903344` passed.

## V1.0.10 Nutrition B6 — COMPLETE

B6 introduced a separate bounded **quantity / portion evidence** lane from the Norwegian Food Safety Authority's Norwegian Food Composition Table 2026.

Licence/reuse is resolved for this bounded attributed gate:

- licence: **NLOD 2.0 / Norsk lisens for offentlige data**;
- attribution retained in the source record;
- no runtime API fetch;
- no bulk source database committed;
- no Norwegian composition values introduced by B6.

Fourteen manually reviewed food/unit mappings are promoted: lemon piece, garlic clove, extra-virgin olive-oil tablespoon, generic raw tomato piece, generic bell-pepper piece, soy-sauce tablespoon, raw-onion piece, carrot piece, cucumber piece, raw-egg piece, spring-onion piece, curry-powder teaspoon, aubergine piece and mango piece.

Fail-closed cases remain explicit:

- lime piece → ambiguous 17 g vs 65 g source rows;
- avocado piece → ambiguous 130 g small vs 220 g large;
- `onion|small` → deferred;
- `sesame_oil|tsp` → deferred, no inferred spoon arithmetic;
- `red_onion|piece` → deferred.

The existing USDA banana conversion keeps precedence in its already-reviewed lane, and USDA tuna-can ambiguity remains unchanged.

Integration audit run `33445671486` passed all **83 deterministic tests** and the authoritative coverage report. Measured B6 state:

- authoritative recipes: **0 / 76**;
- missing-density blockers: **141**;
- unsupported-quantity blockers: **27**;
- explicit ambiguous-portion blockers: **20**;
- mixed incompatible carbohydrate-semantic events: **16**;
- newly authoritative recipes: **none**.

B6 therefore resolves or truthfully reclassifies **175 of 202** B5 unsupported-quantity events without manufacturing recipe completeness.

PR #18 merged at `dee06f276f0323b5d359b8dc311ae23aac3b2d75`. Post-merge validation run `33446325292` and Pages deployment run `33446324922` both passed, so the B6 gate is terminally **COMPLETE**.

## V1.1.1 Nutrition B7 — COMPLETE

B7 adds exactly three manually reviewed ANSES-Ciqual 2025 composition forms for direct recipe-unlock value: raw quinoa (`9340`), raw shrimp/prawn (`10021`) and dry regular pasta (`9810`) as an explicit category-level orzo/risoni match. The bounded Ciqual ledger becomes **57 = B4 32 + B5 22 + B7 3**. Barley, courgette, cottage cheese, salt, smoked paprika and tortilla remain deferred.

The user-approved European-primary policy is unchanged: no averaging, no Ciqual `D` displacement of available USDA, stronger food-form evidence wins, exact provenance remains, and USDA carbohydrate-by-difference is not mixed with Ciqual `CHOAVL` into an authoritative total. Candidate run `33455005170` passed **100 / 100** deterministic tests, profile matrix, coverage reports, exact Wikibooks verification and all browser layers. The authored baseline remains **0 / 76 authoritative**, while missing-density blockers fall **141 → 133**; unsupported quantity stays 27, ambiguous portions 20, and mixed carbohydrate semantics 16. Missing nutrient fields are now separately audited. B7 introduces no runtime API, private KC dependency, bulk source dump or new human policy gate.

## V1 Content Gate C — COMPLETE

Merged through PR #7 at `59ae06755d1c681aa5f56d4f20e8bdaf1d01bec2`. Spain/Canary cost intelligence combines authored recipe tiers, ingredient classes, availability assumptions, package burden and cross-meal reuse. It remains relative and does not claim live prices or false euro precision.

## V1 Content Gate D — COMPLETE

Merged through PR #7. Full-corpus deterministic culinary-quality normalization covers technique, failure risk, execution load, equipment, difficulty, convenience/storage, flavour, spice, familiarity, novelty, learning and exploration.

## V1 Content Gate E — COMPLETE

Merged through PR #9 at `3e0be5adcde9ec9567c0595ac4e8fc71dd237ee4`; PR/post-merge validation and Pages deployment passed.

Delivered 15 coverage-driven project-authored recipes, broader ingredient/Search coverage, canonical bilingual pineapple promotion and regression proof that previously stored future exclusions remain hard when new recipes later introduce that ingredient.

## Brain P0 — AUTHORIZED / KNOWLEDGE CORE FOUNDATION BUILT

The user explicitly authorized the dedicated Culinary & Nutrition Brain on 2026-08-31.

Knowledge Core canonical construction and the bounded free operator pass are represented by `DataRaul/knowledge-core` commit `e5dcb29a7c6b78f59c062faf4c963c74aac10743` in domain `culinary_nutrition`. The foundation preserves official nutrition/food-safety authority, population-vs-individual boundaries, evidence provenance, conditional culinary technique, functional substitutions, planning/affordability reasoning, high-level home food safety, and recommendation uncertainty.

The current Recipe Universe / World Recipe Atlas reasoning contract is on Knowledge Core branch `agent/culinary-nutrition-brain-p0`, commit `84abde1560a2dad7ce3318cbfb6bd827681a39fb`. It explicitly models staple/everyday, canonical/classic, regional/traditional, contemporary/modern, genuinely new/trending, constraint-first and technique-learning recipe roles, along with dish identity, meaningful variants, authenticity uncertainty, functional substitution tolerance, provenance and freshness semantics.

The public-app side is intentionally narrower. `src/data/brain-public-policy-v1.js` and `docs/BRAIN_ADAPTER_CONTRACT.md` record a static reviewed public-safe calibration contract pinned to the earlier Knowledge Core calibration commit. State: `CALIBRATION_ONLY_NO_RANKING_CHANGE`.

The public app **must not call private Knowledge Core at runtime**. Brain authorization does not automatically change recommendation ranking, eligibility, substitutions or nutrition calculations. Any such behavior change requires a separately reviewed public-safe export plus deterministic tests, normal PR validation, the profile matrix and browser acceptance.

The free operator pass is saturated for P0 fundamentals. Additional books/content are residual-gap gated rather than automatic: Harold McGee for deeper chemistry when needed; Samin Nosrat selectively for flavor-balancing gaps; peer-reviewed cooking/yield/nutrient-retention research when authoritative nutrition needs it; and cuisine-specific sources for authenticity/adaptation. *The Food Lab* is currently deferred because of high overlap with the free Kenji lane.

## V1.1 Recipe Corpus Gate F — COMPLETE / USER-ACCEPTED

Purpose: establish a real app-owned external recipe universe while keeping the Brain as reasoning/verification authority rather than a private runtime database.

### Mandatory source floor

**Wikibooks Cookbook is the first external app acquisition source.** The bounded rights/provenance audit is complete and records exact revision provenance, Wikibooks contributor attribution, ShareAlike obligations and a text-only CC BY-SA 4.0 transformation path. No Wikibooks images/media are admitted. The broad discovery count is 3,792 recipe pages, but only eight reviewed exact revisions are bundled.

### Corpus contract

The app must ingest external recipes behind `RecipeSource`; Knowledge Core remains private and offline. The existing 76 project-authored recipes become curated validation and coverage-gap assets, not the entire universe.

Every admitted external record must preserve source/provenance and a truthful reuse state. Normalization must cluster aliases, duplicates and meaningful variants toward dish families instead of optimizing raw recipe count.

The corpus model/audit must support the seven overlapping recipe roles defined by the Brain:

1. staple / everyday;
2. canonical / classic;
3. regional / traditional;
4. contemporary / modern;
5. genuinely new / trending;
6. constraint-first;
7. technique-learning.

Coverage must also be audited across cuisine/geography, meal role, ingredient family, skill, time, budget, equipment and dietary constraints. `unknown` is valid where evidence is absent; fabricated classification is not.

Wikibooks is a minimum corpus, not a completeness claim. Later sources may be added for named regional, modern/trending, authenticity or other coverage gaps under separate source/right review.

### Nutrition/safety firewall

External recipe content never becomes authoritative composition evidence by import. `RecipeSource`, `NutritionSource` and regulatory evidence remain separate truth lanes. External recipes must pass the same ingredient normalization, allergen/dietary/permanent-exclusion logic, quantity semantics and fail-closed nutrition rules as authored recipes.

### Candidate state and exit criterion

The technical Gate F candidate now measures **84 recipes / 83 dish families**, with eight exact-revision Wikibooks records, one explicit cross-source family, two external `SEARCH_ONLY` recipes and six `REFERENCE_ONLY_INCOMPLETE_HARD_METADATA` records. `contemporary_modern` and `genuinely_new_trending` remain explicit role gaps. The authored 76-recipe B6 nutrition baseline remains frozen independently.

Technical validation covers the following criteria, all of which passed before the user acceptance decision:

- Wikibooks rights/attribution/ShareAlike/source-revision audit passes for the selected ingest path;
- a bounded reproducible Wikibooks acquisition is implemented as an app-owned external `RecipeSource`;
- provenance survives normalization, deduplication and rendering where required;
- deterministic tests prove search/recommendation over external records without private KC runtime access;
- alias/dish-family/variant and duplicate handling are tested;
- the seven recipe roles and cross-cutting coverage dimensions are represented or explicitly unknown;
- a deterministic coverage report separates raw pages, normalized records/families, duplicate/variant treatment, rejected/unsupported records and material gaps;
- external records cannot bypass hard safety constraints or nutrition evidence gates;
- the Brain recipe-universe contract remains pinned and behavior-driving exports remain separately gated;
- final human acceptance: on 2026-09-01 the user, after receiving the explicit Gate F review request, instructed the assistant to run the checks itself and continue; the assistant-run acceptance checks were green, satisfying the human decision gate.

All technical criteria passed. The user's 2026-09-01 instruction to run the acceptance checks and continue records the required human decision after those checks passed. Gate F is **COMPLETE / USER-ACCEPTED**, and ordinary Nutrition B7/B8 work may resume under the existing fail-closed evidence contract.

## Deferred / future lanes

Nutrient-gap awareness, supplement-routine checking, recipe images, live/local grocery prices, fitness integration and advanced culinary exploration remain DEFERRED rather than failed. Brain P0 itself is no longer deferred; downstream behavior changes remain separately gated.

After B7, the next ordinary nutrition work remains coverage-driven: target residual composition/form blockers, missing tracked nutrient fields and exact quantity semantics with the highest recipe-level unlock value, while preserving the carbohydrate semantic firewall and all source/licensing provenance.
