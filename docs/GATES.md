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

The accepted shell/core is not reopened by routine corpus, ontology or evidence growth. Hard constraints remain fail-closed. Priority packs and cuisines remain bounded soft signals.

## V1 Content Gate A — COMPLETE

Merged through PR #6 to `main` at `1742bd40691cca614db2e12ccaa47499bea48a57` after green deterministic and Chromium validation; post-merge validation and Pages deployment passed.

Delivered a materially broader project-authored recipe corpus, bilingual/hierarchical ingredient ontology, generalized family exclusions and a six-class controlled substitution graph. No third-party recipe database, paid API, runtime LLM or private Knowledge Core runtime dependency was introduced.

## V1 Nutrition Foundation / B1 — COMPLETE

The evidence framework and first bounded USDA Foundation tranche were completed through PRs #7 and #8. B1 merged at `5dc9c668df8ac96361657cd403b95bf05e859ac9`; PR and post-merge deterministic/browser validation and Pages deployment passed.

Rules remain:
- USDA FoodData Central Foundation Foods Version 15.0 / 2026-04-30;
- only manually reviewed bounded static records are committed, never the bulk USDA database;
- missing nutrient fields remain `null`, never zero;
- direct `g`/`kg` quantities qualify for deterministic calculation;
- unsupported quantities, unmapped foods or missing nutrients make the calculation partial rather than guessed;
- recipe estimates are replaced only by a complete authoritative calculation.

## V1 Nutrition Gate B2 — COMPLETE

Merged through PR #10 at `225cd4ade1bd7af374d465600118cff79dbd4c6c`; deterministic/static validation, the 15,552-profile matrix, Chromium acceptance, post-merge validation and Pages deployment passed.

USDA household-weight evidence remains separate from conversion policy:
- banana: one peeled banana = 115 g; canonical `piece(s)` may use this conversion;
- tuna: one can = 107 g drained solids or 142 g total contents; bare `can(s)` remains ambiguous and fails closed;
- generic spoon/piece averages are prohibited.

## V1 Nutrition Gate B3 — COMPLETE

Merged through PR #11 at `016db58fb01ca0e7cbf8354faf9ca38469e6e0b1`; deterministic/static validation, matrix, Chromium, post-merge validation and Pages deployment passed.

Fifteen additional USDA Foundation forms were manually reviewed, bringing the bounded USDA ledger to 29 records. Thirteen B3 records have all five tracked nutrients; cucumber and spring onion remain explicitly partial. Broccoli, egg and onion household weights remain evidence-only because current canonical recipe semantics are not specific enough to apply them automatically.

## V1 European Evidence Gate B4 — COMPLETE

Merged through PR #12 at `fd33037ce48a75b60ac5b8ca7d7526b7ffb15061`. Pre-merge deterministic/static validation, the 15,552-profile matrix and Chromium acceptance passed, followed by green post-merge validation and GitHub Pages deployment.

B4 introduced ANSES-Ciqual 2025 as a bounded second official composition source:
- dataset DOI `10.57745/RDMHWY`;
- 3,484-food official catalogue / 74 constituents;
- Etalab Open Licence 2.0 with required ANSES attribution;
- 32 manually reviewed app-relevant food/form mappings only;
- English/French identity, scientific name, match notes, per-field confidence (`A`–`D`) and source codes retained.

B4 also introduced a comparison/audit layer. It never averages sources and preserves semantic differences, especially USDA carbohydrate-by-difference (`1005`) versus Ciqual available carbohydrate (`CHOAVL`). B4 itself did not change product source selection.

European-source governance recorded during B4:
- Fineli/THL Finland remains a strong CC BY 4.0 candidate, but its documented API and official package returned HTTP 403 to standard GitHub-hosted runners; no bypass is attempted and no Fineli data is bundled;
- Frida/DTU, NEVO/RIVM and BEDCA/AESAN remain governed by their exact reuse terms;
- EuroFIR remains outside the current no-cost contract;
- EFSA FoodEx2 and EU regulatory datasets remain a separate classification/regulatory truth lane rather than nutrient-composition replacements.

## V1.0.7 European Primary Nutrition Policy — COMPLETE / USER-APPROVED

The user explicitly approved the conditional European-primary policy on 2026-08-31. It was implemented through PR #13 and merged to `main` at `cfa3b9115821b59321c7ef19e779ff3a578aa6b6`. The corrected candidate passed deterministic/static validation, the 15,552-profile matrix and Chromium acceptance. Post-merge validation and Pages deployment also passed.

The policy is deliberately conditional, not geographical dogma:

1. source selection occurs **per ingredient and per tracked nutrient**;
2. reviewed Ciqual evidence may become primary for Canary/Spain/Europe when its food-form match is equally good or better and its constituent confidence is `A`, `B` or `C`;
3. Ciqual `D` confidence does not displace an available reviewed USDA value, although a reviewed `D` field may still be used when it is the only reviewed source;
4. a stronger USDA food-form match remains primary;
5. no values are averaged across official sources;
6. exact source, identifier, nutrient semantic, method, form confidence, Ciqual field confidence and selection reason remain available in provenance;
7. USDA carbohydrate-by-difference and Ciqual `CHOAVL` are never summed into one authoritative recipe carbohydrate total;
8. when the European-selected mix cannot form a coherent complete recipe total but the previously reviewed USDA lane can, the coherent full USDA calculation is retained rather than downgrading to a low-confidence authored estimate;
9. if neither policy-selected nor coherent USDA coverage is complete, the project-authored estimate remains primary;
10. nutrition source policy does not alter dietary/allergen/permanent-exclusion safety, recommendation ranking, medical boundaries or the accepted shell.

This human gate is now resolved. Future changes that materially alter these source-selection semantics require a new bounded policy decision; ordinary evidence coverage expansion under these rules does not.

## V1 Content Gate C — COMPLETE

Merged through PR #7 at `59ae06755d1c681aa5f56d4f20e8bdaf1d01bec2`. Spain/Canary cost intelligence combines authored recipe tiers, ingredient classes, availability assumptions, package burden and cross-meal reuse. It remains relative and does not claim live prices or fake euro precision.

## V1 Content Gate D — COMPLETE

Merged through PR #7. Full-corpus deterministic culinary-quality normalization covers technique, failure risk, execution load, equipment, difficulty, convenience/storage, flavour, spice, familiarity, novelty, learning and exploration.

## V1 Content Gate E — COMPLETE

Merged through PR #9 at `3e0be5adcde9ec9567c0595ac4e8fc71dd237ee4`; PR and post-merge validation plus Pages deployment passed.

Delivered 15 coverage-driven project-authored recipes, broader ingredient/Search coverage, canonical bilingual pineapple promotion, deterministic corpus/search auditing, and regression proof that previously stored future exclusions remain hard when new recipes later introduce that ingredient.

## Brain P0 — NOT AUTHORIZED

The dedicated Culinary & Nutrition Brain remains a separate future human authorization boundary. The public app must not call private Knowledge Core at runtime. Public-safe policy/data artifacts may be prepared behind the accepted stable interfaces, but the Brain itself must not be created or activated without explicit authorization.

## Deferred

Nutrient-gap awareness, supplement-routine checking, recipe images, live/local grocery prices, fitness integration, advanced culinary exploration and Brain P0 remain DEFERRED/NOT_AUTHORIZED rather than failed.
