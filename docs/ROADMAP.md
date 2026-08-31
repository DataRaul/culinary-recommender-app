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
| V1.0.8 / Authoritative coverage audit | COMPLETE | corpus-level fail-closed measurement; 0/76 authoritative baseline |
| V1.0.9 / Nutrition B5 | COMPLETE | 22 reviewed Ciqual records; 54 combined; density blockers reduced to 141 |
| V1.0.10 / Nutrition B6 | VALIDATED MERGE CANDIDATE | 14 reviewed Matvaretabellen portion mappings + explicit ambiguity/defer states |
| V1.0.1 / Content Gate C | COMPLETE | Spain/Canary ingredient classes + package/availability/reuse-aware cost heuristic |
| V1.0.1 / Content Gate D | COMPLETE | normalized culinary technique/risk/execution/convenience/learning intelligence |
| V1.0.3 / Content Gate E | COMPLETE | 15 coverage-driven authored recipes + corpus/search audit + pineapple future-exclusion proof |
| V1.x / Recipe-unlock evidence | NEXT | target remaining composition/form and exact quantity blockers by recipe-level unlock value |
| V1.x / Authoritative nutrition coverage | CONTINUOUS | expand reviewed evidence under the approved source policy without guessing |
| V1.x / Corpus breadth | CONTINUOUS | target high-value Search/planner gaps rather than recipe-count growth |
| V1.x / EU regulatory truth lane | RESEARCH / SCAFFOLDING_ALLOWED | classification/regulatory evidence remains separate and audit-only until a future behavior contract |
| Brain P0 | NOT_AUTHORIZED | future Culinary & Nutrition Brain |
| App Brain-derived V1.x | DEFERRED | public-safe Brain-derived upgrades only after explicit Brain authorization |

## Completed V1 lineage

Content Gate A merged through PR #6 at `1742bd40691cca614db2e12ccaa47499bea48a57` after green deterministic/browser validation and post-merge validation/Pages deployment.

Gates B foundation, C and D merged through PR #7 at `59ae06755d1c681aa5f56d4f20e8bdaf1d01bec2`. B1 merged through PR #8 at `5dc9c668df8ac96361657cd403b95bf05e859ac9`. Gate E merged through PR #9 at `3e0be5adcde9ec9567c0595ac4e8fc71dd237ee4`. B2 merged through PR #10 at `225cd4ade1bd7af374d465600118cff79dbd4c6c`. B3 merged through PR #11 at `016db58fb01ca0e7cbf8354faf9ca38469e6e0b1`. Each completed its required validation/deployment gates.

European Evidence B4 merged through PR #12 at `fd33037ce48a75b60ac5b8ca7d7526b7ffb15061`, adding 32 manually reviewed ANSES-Ciqual 2025 food/form mappings and a comparison layer that preserves identity, nutrient definitions, method caveats, confidence and source provenance without averaging.

The European-primary policy was explicitly approved by the user and implemented through PR #13, merged at `cfa3b9115821b59321c7ef19e779ff3a578aa6b6`. PR validation, matrix, Chromium acceptance, post-merge validation and Pages deployment passed.

The V1.0.8 authoritative nutrition coverage audit merged through PR #16 at `cdb9a9d9e6d2e0bf0f251bb37098d07dd64e3e9e`. It established the first whole-corpus baseline: **0/76** complete authoritative recipes, 356 missing-density blockers, 86 unsupported-quantity blockers and 12 mixed carbohydrate-semantic incompatibilities.

## Nutrition B5 — complete

PR #17 added a strict B5 tranche of 22 reviewed ANSES-Ciqual food/form records without rewriting B4 history. Runtime composition evidence exposes B4=32, B5=22, total=54 and preserves `evidenceTranche` per selected nutrient.

The deterministic B5 report remained fail-closed at **0 / 76** authoritative recipes while reducing missing-density blockers to **141**. Unsupported-quantity blockers became **202** because newly available composition revealed the next blocker class rather than fabricating household conversions. Mixed incompatible carbohydrate-semantic events became **16** and remained rejected.

PR #17 merged at `5689b0e40c6c4d9d7040b0ee25b7cc41d898b751`; post-merge validation run `33443904301` and Pages run `33443903344` passed.

## Nutrition B6 — validated candidate

B6 responds directly to B5's newly exposed quantity bottleneck. It adds a bounded portion-evidence lane from the Norwegian Food Safety Authority's Norwegian Food Composition Table 2026, under verified **NLOD 2.0** reuse with attribution.

The gate is deliberately quantity-only. It does not import Norwegian nutrient composition or alter the USDA/Ciqual European-primary composition policy.

Fourteen exact source-backed mappings are promoted after strict manual review: lemon piece, garlic clove, extra-virgin olive-oil tablespoon, generic raw tomato piece, generic raw bell-pepper piece, soy-sauce tablespoon, raw-onion piece, carrot piece, cucumber piece, raw-egg piece, spring-onion piece, curry-powder teaspoon, aubergine piece and mango piece.

Ambiguity remains fail-closed. Lime has conflicting 17 g / 65 g piece rows; avocado has 130 g small / 220 g large states. `onion|small`, `sesame_oil|tsp` and `red_onion|piece` remain deferred rather than inferred.

Integration Actions run `33445671486` passed all **83 deterministic tests** and measured:

- authoritative recipes: **0 / 76**;
- missing-density blockers: **141**;
- unsupported-quantity blockers: **27**;
- explicit ambiguous-portion blockers: **20**;
- mixed incompatible carbohydrate-semantic events: **16**;
- newly authoritative recipes: **none**.

B6 resolves or truthfully reclassifies **175 of 202** B5 unsupported-quantity events without weakening the evidence contract. Normal PR/browser validation and post-merge deployment verification remain before B6 can move from candidate to COMPLETE.

## Current nutrition policy

For the Canary Islands / Spain / Europe context:

- composition source selection occurs per ingredient and per nutrient;
- reviewed European evidence may be primary when food-form fit is equally good or better and constituent evidence is sufficiently strong;
- Ciqual confidence `D` does not displace an available reviewed USDA value;
- a stronger USDA form remains primary;
- no cross-source averaging is permitted;
- exact source/method/semantic provenance is retained;
- USDA carbohydrate-by-difference and Ciqual available carbohydrate (`CHOAVL`) cannot be summed into one authoritative recipe carbohydrate total;
- if the European-selected mix is incomplete or semantically incompatible but a complete coherent reviewed USDA recipe calculation exists, that USDA calculation remains authoritative;
- otherwise incomplete evidence preserves the project-authored estimate;
- quantity evidence is selected separately and requires exact reviewed food/unit semantics;
- regulatory evidence remains a third separate truth lane.

Routine evidence expansion may continue under this accepted architecture without reopening the policy decision.

## Next recipe-unlock evidence work

After a legitimate B6 merge, priority shifts from broad quantity discovery to **recipe-unlock analysis**:

1. identify recipes one or two blockers away from authoritative calculation;
2. target high-frequency remaining composition/form blockers only where source form can be reviewed strongly;
3. resolve residual exact quantity semantics where an authoritative source or truthful editorial gram rewrite exists;
4. preserve explicit ambiguity rather than collapsing size/form variants;
5. keep the carbohydrate semantic firewall unchanged;
6. continue reporting newly authoritative recipe IDs, not just added records.

Current high-frequency remaining density gaps include ground cumin, smoked paprika, firm tofu, lentils, generic noodles, red lentils and turkey mince, alongside smaller grain/sauce/protein/herb gaps. Residual quantity issues include small onions, sesame-oil teaspoons and red-onion pieces, while lime and avocado are known ambiguous states.

## European source backlog

ANSES-Ciqual is the current bundled European composition source. Matvaretabellen is the current bounded European quantity source. Fineli/THL remains attractive under CC BY 4.0, but both its documented API and official package returned HTTP 403 to standard GitHub-hosted runners during the bounded audit; no bypass is attempted. Frida/DTU, NEVO/RIVM and BEDCA/AESAN remain governed by exact reuse terms. EuroFIR remains outside the no-cost contract.

EFSA FoodEx2 and EU Commission regulatory datasets remain a separate classification/regulatory evidence lane. They may be researched and represented as audit metadata but must not silently become composition values or recommendation rules without a future explicit behavior contract.

## Standing architecture

The accepted shell/core is not reopened by routine corpus, ontology or evidence growth. V1 work remains additive behind stable `RecipeSource`, `NutritionSource`, `IngredientNormalizer`, `RecommendationPolicy`, planner, substitution and cost interfaces.

Future nutrition breadth must come from reviewed source/form identity plus explicit quantity evidence. Generic spoon/piece averages remain prohibited merely to increase apparent coverage.

Cost remains relative, deterministic and explainable. Culinary quality remains normalized from project-authored structured metadata and instructions. Fridge Search, planner, allergens, dietary restrictions and permanent exclusions continue to use the same hard safety truth.

The Culinary & Nutrition Brain remains a separate future authorization boundary. The public app must not call private Knowledge Core at runtime.
