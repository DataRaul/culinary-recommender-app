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
| V1.0.10 / Nutrition B6 | COMPLETE | 14 reviewed Matvaretabellen portion mappings + explicit ambiguity/defer states |
| V1.0.1 / Content Gate C | COMPLETE | Spain/Canary ingredient classes + package/availability/reuse-aware cost heuristic |
| V1.0.1 / Content Gate D | COMPLETE | normalized culinary technique/risk/execution/convenience/learning intelligence |
| V1.0.3 / Content Gate E | COMPLETE | 15 coverage-driven authored recipes + corpus/search audit + pineapple future-exclusion proof |
| Brain P0 | AUTHORIZED / BRANCH-BUILT / KC MERGE PENDING | official-source foundation + bounded free operator corpus + World Recipe Atlas reasoning/verification; private KC `main` not yet updated |
| App Brain adapter V1 | COMPLETE / CALIBRATION-ONLY | PR #19 merged and green; static provenance-pinned public-safe policy contract; no ranking change |
| World Recipe Atlas V0 | ACTIVE / VERIFIED PILOT EXPANSION | 338 seed families / 20 macro-regions; 20 identity + structure + variant aware; 4 transformation aware; P4 linked 20/20; zero public export eligibility |
| V1.1 / Recipe Corpus Gate F | COMPLETE / USER-ACCEPTED | bounded Wikibooks RecipeSource + exact provenance + coverage/safety validation; user authorized assistant-run acceptance checks and continuation on 2026-09-01 |
| V1.1 / Recipe Corpus Gate F2 | BRANCH-LOCAL / NOT PUBLICLY ACTIVATED | scalable metadata-only discovery, immutable exact-revision review ledger, revision-aware review queue, compact generated index and runtime-separation tests |
| V1.1.1 / Nutrition B7 | COMPLETE | strict Ciqual recipe-unlock tranche: quinoa + prawns + category-level dry-pasta/orzo; authored missing-density blockers 141→133; still 0/76 authoritative |
| V1.1.2 / Nutrition B8 | CANDIDATE | exact SR Legacy small-onion quantity evidence earns first authoritative authored recipe; strict Foundation review defers partial/wrong-form rows |
| V1.x / Recipe-unlock evidence | CONTINUOUS | target residual composition/form, nutrient-field and exact quantity blockers by recipe-level unlock value; independent of external RecipeSource breadth |
| V1.x / Authoritative nutrition coverage | CONTINUOUS | expand reviewed evidence under the approved source policy without guessing |
| V1.x / Corpus breadth | F2 CONTROL PLANE ACTIVE / RUNTIME GATED | broaden through revision-aware review and measured coverage gaps rather than raw recipe-count growth; no automatic admission |
| V1.x / Corpus Scale / 100k Readiness | USER-ACCEPTED TARGET / STEP 1 READY | Cloudflare Pages + exact-email Access/OTP + Worker + R2/pre-built indexes; D1 benchmark-gated; portable provider-neutral corpus; no mass ingestion yet |
| V1.x / EU regulatory truth lane | RESEARCH / SCAFFOLDING_ALLOWED | classification/regulatory evidence remains separate and audit-only until a future behavior contract |
| V1.x / Brain-derived behavior | SEPARATELY GATED | only narrow reviewed static exports with deterministic tests and normal PR/browser acceptance |

## 2026-09-01 Brain / World Recipe Atlas reconciliation

The Brain and recipe-database directions are now architecturally aligned, but they are **not the same data store**:

- Knowledge Core owns reusable culinary/nutrition reasoning, World Recipe Atlas discovery/identity/variant verification policy, source-role/licensing reasoning and public-export eligibility;
- the public app owns actual runtime recipe records, `RecipeSource`, ingredient/quantity normalization, allergens/dietary/permanent exclusions, nutrition evidence, ranking/planner behavior and browser tests;
- Atlas breadth cannot bypass Gate F, and an `IDENTITY_VERIFIED` family is not automatically a public recipe;
- imported recipe content cannot become authoritative nutrition evidence merely by being imported.

The private Knowledge Core development branch `agent/culinary-nutrition-brain-p0` is currently **45 commits ahead of KC `main` and 3 behind** after `main` advanced independently. Its current branch head is `274c20cd18b39848126570c18a9e5e73c92ef49d`. This is a development/reference pin only until the private KC reconciliation/validator/PR/merge gate completes; no claim is made that the branch already includes the three newer `main` commits. The public app's already-reviewed calibration artifact intentionally remains pinned to the narrower earlier commit `e5dcb29a7c6b78f59c062faf4c963c74aac10743` and remains `CALIBRATION_ONLY_NO_RANKING_CHANGE`.

Current Atlas state on the KC branch:

- model-native seed: **338 dish-family candidates across 20 macro-regional buckets**;
- source-backed identity pilot: **20 / 338 `IDENTITY_VERIFIED`**, one pilot family per macro-region;
- identity-unverified remainder: **318 / 338**;
- structure-verified: **20 / 20 current promoted cohort**;
- variant-aware: **20 / 20 current promoted cohort**;
- transformation-aware: **4 / 20 current promoted cohort** — Paella Valenciana, couscous, ceviche and hāngi;
- P4 technique-prerequisite linked: **20 / 20 current promoted cohort**;
- app-authoring eligible: **0**;
- public-export eligible: **0**;
- audit-only public corpus critic: **ACTIVE / NO PUBLIC BEHAVIOR**;
- current English Wikibooks source-navigation baseline: **3,825 recipe pages and 158 cuisine pages**; these are source-page counts, not normalized dish-family counts;
- multilingual discovery/alias-resolution is part of the Brain design so English-source coverage is not mistaken for world-cuisine coverage;
- metadata-only acquisition helper: `scripts/culinary_world_recipe_atlas_acquisition.py` in Knowledge Core; it is designed to collect source metadata rather than bulk recipe prose/images/nutrition;
- dedicated Culinary Brain/Atlas and corpus-critic validation are wired into the Knowledge Core validation workflow, but no GitHub Actions have been spent on the active branch during this F2 continuation.

The earlier Recipe Universe requirements commit `84abde1560a2dad7ce3318cbfb6bd827681a39fb` remains useful historical lineage, but it is no longer the current Atlas development head. Future roadmap references should distinguish the stable public calibration pin, the historical recipe-universe requirements pin and the current unmerged KC development head rather than using one SHA for all three purposes.

### Parallel next lanes

Three lanes may proceed independently under their own gates:

1. **KC Brain/Atlas integration lane** — reconcile the current 45-ahead / 3-behind Knowledge Core branch against the independently advanced `main`, preserve Brain governance, and stop before the human PR/merge gate.
2. **Gate F2 corpus breadth lane** — continue the branch-local metadata-only discovery → revision-aware review queue → bounded review → admit/reject → ontology/hard-metadata → compact-index control plane. Gate F itself is already complete; F2 does not reactivate or rewrite it.
3. **Recipe-unlock nutrition lane** — B7 completed the first post-Gate-F composition tranche; continue targeting residual composition/form/nutrient-field/quantity blockers against the 76 curated-recipe baseline and separately admitted recipes by measured unlock value.

Brain-derived ranking/eligibility/substitution behavior remains a fourth, **separately gated** lane and is not authorized by any of the three above.

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

## Nutrition B6 — complete

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

B6 resolves or truthfully reclassifies **175 of 202** B5 unsupported-quantity events without weakening the evidence contract.

PR #18 merged at `dee06f276f0323b5d359b8dc311ae23aac3b2d75`; post-merge validation run `33446325292` and Pages run `33446324922` both passed. B6 is therefore **COMPLETE**.

## Nutrition B7 — complete

B7 optimizes for recipe-level blocker reduction rather than source row count. Three strict ANSES-Ciqual 2025 forms are admitted: raw quinoa (`9340`), raw shrimp/prawn (`10021`) and dry regular pasta (`9810`) as a category-level orzo/risoni match. The combined bounded Ciqual ledger is now **57**. Candidate run `33455005170` passed 100/100 deterministic tests, profile matrix, coverage reports, exact Wikibooks verification and the full Chromium suite. The frozen authored baseline remains **0/76 authoritative**, while missing-density blockers fall **141 → 133**; unsupported quantity remains 27, ambiguous portions 20, and mixed carbohydrate semantics 16. Missing tracked nutrient fields are separately visible.


## Nutrition B8 — first authoritative recipe candidate

B8 admits one exact USDA FoodData Central SR Legacy portion row: raw onion FDC `170000` / NDB `11282`, portion row `85862`, source modifier `small`, **70 g**. The source is quantity-only in B8; composition-source policy remains Foundation + Ciqual, Matvaretabellen remains B6 portion-only, and no generic-small or diameter inference is introduced.

Candidate run `33494074325` passed 104/104 deterministic tests and measured **1/76 authoritative authored recipes**: `indian_chicken_spinach_curry`. Unsupported quantity falls **27→7**; missing density remains **133**, ambiguous portions **20**, mixed carbohydrate semantics **16**, and tracked-field gaps remain visible separately.

Exact Foundation 2026-04 review also confirms that dry lentils, 93/7 raw ground turkey and full-fat cottage cheese are partial because tracked fibre is unpublished; tahini/sesame-butter identity remains insufficiently strict for this tranche; iodized salt is incomplete for tracked composition; crushed canned tomato is not passata; prepared edamame is not mapped to an unspecified state; exact smoked paprika remains unresolved. B8 therefore prefers one earned recipe unlock to a larger but weaker evidence ledger.

## Culinary & Nutrition Brain P0 — authorized foundation and active Atlas development

The user explicitly authorized Brain P0 on 2026-08-31. Construction follows the Knowledge Core Brain Construction Protocol rather than app-local improvisation.

The reviewed public-app calibration pin remains `DataRaul/knowledge-core` commit `e5dcb29a7c6b78f59c062faf4c963c74aac10743`, domain `culinary_nutrition`. It contains the official-source foundation and bounded free operator layer that were reviewed for the public calibration contract.

The broader Brain/Atlas work is on the unmerged Knowledge Core branch `agent/culinary-nutrition-brain-p0`, current head `274c20cd18b39848126570c18a9e5e73c92ef49d`. It adds World Recipe Atlas discovery/verification, multilingual discovery/alias-resolution reasoning, source-role/licensing governance, the 338-family seed, 20 identity/structure/variant-aware families, four transformation-aware families, P4 linkage for all 20 promoted families, a source-coverage baseline, metadata-only acquisition machinery, the audit-only public corpus critic and dedicated validators. KC `main` has also advanced independently, so branch reconciliation remains required before any merge gate.

The operator pass reached P0 saturation without adding a fourth generalist source merely for count. Operator material remains culinary technique/workflow evidence, not nutrition, medical or food-safety authority.

### Recipe-universe / World Recipe Atlas contract

The Brain treats recipe-universe coverage as overlapping culinary jobs rather than one popularity list: staple/everyday, canonical/classic, regional/traditional, contemporary/modern, genuinely new/trending, constraint-first and technique-learning. Coverage must also be measured across cuisine/geography, meal role, ingredient family, skill, time, budget, equipment and dietary constraints.

The Atlas preserves dish-family identity, source label lineage, aliases/transliterations, meaningful variants, authenticity uncertainty, substitution tolerance by culinary function, provenance and freshness semantics. Corpus frequency is not authenticity evidence and trend claims require recency evidence.

A family can move through distinct states such as discovery, identity verification, structure verification, variant awareness, transformation awareness, technique linkage, app-authoring eligibility and public-export eligibility. The current promoted cohort has advanced to 20 identity/structure/variant-aware families, four transformation-aware families and 20/20 P4 technique linkage; **none** has gained app-authoring or public-export eligibility, and no source recipe or Atlas family has been promoted directly into public app behavior.

### Long-form / content decision

Book and paper work remains residual-gap gated:

- Harold McGee / *On Food and Cooking* → recommended when deeper food chemistry changes a concrete decision;
- Samin Nosrat / *Salt, Fat, Acid, Heat* → selective candidate when flavor-balancing diagnosis remains under-specified;
- Michael Ruhlman / *Ratio* → selective candidate only when a generative ratio/family-construction gap remains after current technique + Atlas normalization;
- peer-reviewed cooking/yield/nutrient-retention research → priority when it can unblock authoritative recipe nutrition;
- cuisine-specific expert/primary sources → preferred for authenticity/adaptation and Atlas promotion (`CN12`);
- *The Food Lab* → deferred for now because the free Kenji lane already supplies substantial overlapping mechanism evidence.

No candidate book is marked as a used Knowledge Core source before material canonical use.

## App Brain adapter — COMPLETE / calibration-only

The app-side boundary is recorded in `docs/BRAIN_ADAPTER_CONTRACT.md` and `src/data/brain-public-policy-v1.js`, pinned to Knowledge Core commit `e5dcb29a7c6b78f59c062faf4c963c74aac10743`.

PR #19 merged the adapter contract to public `main` at `8d8148c818c55d4f6ab19da3548072877bc691b3`. Post-merge public validation run `33448060114` and Pages deployment run `33448056412` succeeded.

Current behavior state remains `CALIBRATION_ONLY_NO_RANKING_CHANGE`.

The public app does not fetch private Knowledge Core at runtime. Only narrow, versioned, source-safe static exports are eligible. Brain authorization or Atlas expansion does not silently authorize changes to ranking, eligibility, substitutions or nutrition outputs; each behavior change requires an explicit public artifact, deterministic negative/regression tests and normal PR/matrix/browser validation.

## V1.1 Recipe Corpus Gate F — COMPLETE / USER-ACCEPTED

This gate converts recipe breadth from a project-authored sample into an app-owned external corpus program without weakening the existing source, safety or nutrition contracts.

### Brain-side prerequisites already advanced

The Brain-side work supplies:

- a governed source-role and rights framework distinguishing open-content, discovery-only, non-commercial and production-rights-dependent recipe sources;
- a current Wikibooks navigation baseline rather than an assumed corpus size;
- a 338-family / 20-region discovery seed and explicit state machine;
- a 20-family identity/structure/variant-aware promoted cohort;
- four transformation-aware families and 20/20 P4 technique linkage without publication eligibility;
- multilingual discovery and fail-closed alias-resolution reasoning;
- metadata-only acquisition machinery designed to keep live source acquisition outside deterministic CI/runtime;
- an audit-only public corpus critic that may prioritize review but cannot grant admission or public behavior.

These advances reduce corpus-breadth uncertainty but do not bypass the public app's `RecipeSource`, rights, ontology, hard-metadata, nutrition or acceptance gates.

### Mandatory initial corpus

**Wikibooks Cookbook is the first external recipe acquisition source for the public app.** The exact rights/provenance audit is complete and passes for a bounded **text-only CC BY-SA 4.0** path with page/revision provenance, Wikibooks contributor attribution, ShareAlike and transformation notices. No Wikibooks images or other media are admitted.

The Brain/Atlas source-navigation snapshot on its separate development lineage recorded 3,825 English recipe pages plus 158 cuisine pages. The bounded Gate F exact-discovery snapshot measured **3,792 pages in English Wikibooks `Category:Recipes`**. Gate F2 separately records a 2026-09-01 rendered category navigation count of **3,825** as `DYNAMIC_CATEGORY_NAVIGATION_COUNT_ONLY`; it does not replace the 3,792 exact-discovery measurement or identify which source-page events produced the net difference. These are discovery/navigation measurements, not normalized dish-family counts or claims of balanced world coverage. Gate F bundles only **eight manually reviewed exact revisions**.

### Ownership and runtime contract

- ingestion belongs to the public app behind the existing `RecipeSource` boundary;
- the private Brain/KC is never a runtime recipe database;
- the existing 76 project-authored recipes remain curated validation/gap-fill assets rather than the complete recipe universe;
- external records retain source identity, source/revision URL or equivalent locator, licence/reuse state, attribution requirements and transformation provenance;
- normalization clusters aliases, duplicates and meaningful variants toward dish families rather than rewarding raw row count;
- imported recipe content does **not** become authoritative nutrition evidence; `RecipeSource`, `NutritionSource` and regulatory evidence remain separate truth lanes.

### Required coverage semantics

The corpus and its audit must expose enough normalized metadata for the Brain/app to reason about:

1. staple / everyday;
2. canonical / classic;
3. regional / traditional;
4. contemporary / modern;
5. genuinely new / trending;
6. constraint-first;
7. technique-learning recipes.

The audit must also report gaps across geography/cuisine, meal role, ingredient family, skill, time, budget, equipment and dietary constraints. A large recipe count cannot satisfy the gate while these dimensions remain opaque.

Freshness-sensitive/trending coverage is expected to need later sources because Wikibooks is a floor, not a complete universe. Additional corpora may be admitted only for a named coverage or evidence gain under the same provenance/rights rules.

### Current candidate state

The app-owned RecipeSource universe remains **84 recipes**: 76 curated project-authored records plus eight exact-revision Wikibooks records, normalized into **83 dish families**. The `spanish_potato_omelet` family explicitly preserves one authored and one external variant instead of silently replacing either.

Only **Baba Ganoush** and **Bruschetta (base)** are `SEARCH_ONLY`; six external records remain `REFERENCE_ONLY_INCOMPLETE_HARD_METADATA` because source-backed hard metadata is incomplete. Missing time/serving values remain unknown rather than guessed. The seven-role audit truthfully leaves `contemporary_modern` and `genuinely_new_trending` uncovered in this first tranche.

Gate F2 is branch-local at `v1-recipe-corpus-gate-f2-breadth-foundation`. Its current control plane adds metadata-only broad discovery, an immutable reviewed exact-revision ledger, `TRACKED_PAGE_NEW_REVISION` / `TRACKED_PAGE_METADATA_CHANGED` / `NEW_SOURCE_PAGE` review-queue events, explicit source-universe completeness, a reproducible compact generated index, and tests preventing generated-index runtime imports. F2 newly admitted recipes remain **0** and `runtimeActivationAuthorized` remains false.

External source nutrition is explicitly **not** imported as authoritative NutritionSource composition. RecipeSource, NutritionSource and regulatory evidence remain separate truth lanes; allergens, dietary constraints, permanent exclusions, quantity semantics and fail-closed recommendation policy remain intact. The private Knowledge Core remains offline at runtime. The authored 76-recipe B6 nutrition baseline remains frozen independently.

### Exit criteria

The technical candidate implements and validates the following requirements; Gate F remains incomplete until the final human acceptance item passes:

1. Wikibooks licensing/attribution/ShareAlike and source-revision audit is recorded and passes for the chosen public-app ingest path;
2. a bounded reproducible Wikibooks acquisition is normalized into an app-owned external `RecipeSource` implementation;
3. provenance survives ingestion, transformation, deduplication and public rendering where attribution is required;
4. deterministic tests prove external records can be searched/recommended without private KC runtime access;
5. dish-family/alias/variant handling and duplicate policy are tested;
6. the seven recipe-universe tags plus cross-cutting coverage dimensions are represented or truthfully marked unknown;
7. a corpus coverage report distinguishes raw source pages, normalized records/families, duplicates/variants, unsupported records and coverage gaps;
8. imported recipes cannot bypass allergen/dietary/permanent-exclusion hard constraints or nutrition evidence gates;
9. the Brain/KC recipe-universe contract remains pinned and any behavior-driving export follows the existing Brain adapter gate;
10. a human review confirms the external corpus is useful in the public app before Gate F is marked complete.

All technical Gate F criteria passed. On 2026-09-01, after being presented with the explicit Gate F acceptance request, the user instructed the assistant to run the checks itself and continue. The assistant-run deterministic, Chromium, provenance, planner-non-leakage, post-merge and Pages checks were green, so that instruction records the required human acceptance decision. Gate F is therefore **COMPLETE / USER-ACCEPTED**. Future corpus breadth remains governed by measured coverage gaps and the same rights/provenance/safety rules rather than raw recipe-count growth.

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

## Next recipe-unlock evidence work — parallel lane

With B6 complete, priority shifts from broad quantity discovery to **recipe-unlock analysis**. This lane is not blocked by Gate F and may continue against the existing curated corpus while external-corpus work proceeds separately:

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

## Other roadmap flags — no status change yet

The Brain/Atlas reconciliation exposes several adjacent items, but none should be silently activated by this documentation update:

- **Knowledge Core merge/validation:** the branch is currently 45 commits ahead of and 3 behind `main`; the three newer `main` commits must be reconciled without weakening Brain governance before the human validator/PR/merge gate.
- **`docs/GATES.md`:** still references older Brain/Atlas lineage and should be reconciled to the 338 / 20 identity+structure+variant / 4 transformation / P4 20/20 state and Gate F2 branch-local control plane.
- **`README.md`:** the Brain section should distinguish the stable public calibration pin from the current unmerged Brain development head and the audit-only corpus critic.
- **`docs/BRAIN_ADAPTER_CONTRACT.md`:** its ownership boundary remains correct, but a future revision should explicitly add the Atlas distinction: verified family metadata may inform an app-authoring brief, while source recipe content/public runtime ingestion belongs to Gate F/F2 and `RecipeSource`.
- **`docs/DEFERRED_CAPABILITIES.md`:** Brain P0 is still described only as `FOUNDATION BUILT`; it should eventually distinguish the active Atlas discovery/verification lane from still-deferred advanced culinary exploration.
- **Advanced culinary exploration / recipe images / fitness integration:** no automatic activation. Atlas breadth strengthens their future inputs, but Gate F/F2, text/data quality and the existing separate-gate rules still apply.
- **Trending/new recipes:** the Atlas and corpus critic establish that freshness-sensitive discovery needs a separate recency-evidence lane; Wikibooks corpus frequency or edit recency alone is not trend evidence.

## Standing architecture

The accepted shell/core is not reopened by routine corpus, ontology, evidence or Brain-calibration growth. V1 work remains additive behind stable `RecipeSource`, `NutritionSource`, `IngredientNormalizer`, `RecommendationPolicy`, planner, substitution and cost interfaces.

Future nutrition breadth must come from reviewed source/form identity plus explicit quantity evidence. Generic spoon/piece averages remain prohibited merely to increase apparent coverage.

Cost remains relative, deterministic and explainable. Culinary quality remains normalized from project-authored structured metadata and instructions. Fridge Search, planner, allergens, dietary restrictions and permanent exclusions continue to use the same hard safety truth.

The Culinary & Nutrition Brain is authorized and its broader Atlas development is active on an unmerged Knowledge Core branch, while Gate F2 remains a branch-local public-app control plane with no automatic admission or runtime activation. The public app must never call private Knowledge Core at runtime. Downstream behavior changes remain separately evidence- and test-gated.

## V1.x Corpus Scale / 100k Readiness — USER-ACCEPTED TARGET / STEP 1 READY / NO MASS INGESTION

This program defines the scale architecture required before any very large real recipe corpus is admitted. It does **not** authorize mass ingestion, replace the current nutrition/evidence lane, or make raw recipe count a success criterion.

The source/licensing research and reuse map remain canonical in `docs/CORPUS_SCALE_100K_REFERENCE_AND_SOURCE_ROADMAP.md`.

The **accepted runtime/storage/access reconciliation** is canonical in `docs/CORPUS_SCALE_CLOUDFLARE_ACCEPTED_ARCHITECTURE.md`. That document supersedes the earlier Firebase-first runtime sketch. Firebase remains a fallback/comparator only unless a later measured gate changes the decision.

The user explicitly accepted this Cloudflare target architecture and invitation-only access policy on 2026-09-04. This is an **architecture-selection acceptance**, not a claim that the implementation has already passed scale benchmarks. Step 1 is therefore ready; production provisioning is not.

### Eight-step scale program

1. **Scale contract + synthetic benchmark — NEXT / READY.** Freeze the current reviewed corpus as the golden behavioral baseline. Define record-size, latency, memory, candidate-cardinality, transferred-byte, query/read, build-time and validation budgets, then generate deterministic synthetic catalogues at roughly 1k → 10k → 50k → 100k records. Model the accepted R2-style immutable-object + pre-built-index architecture locally/provider-neutrally first. No real large-corpus ingestion and no Cloudflare account provisioning are required in this step.
2. **`RecipeSource` V2 compatibility layer.** Build a second implementation behind the stable `RecipeSource` contract. Against the golden corpus, V1 and V2 must preserve hard constraints, eligibility, explanations, deterministic ranking/planner results and recipe identity semantics before V2 can become the default.
3. **Portable remote metadata/detail separation.** Replace the small-corpus assumption that every complete recipe is bundled into one in-memory JavaScript array. Define versioned provider-neutral catalogue/index artefacts separately from full recipe detail records, provenance and source-state records. The shape must map naturally to R2 but remain reproducible outside Cloudflare. The browser must never need to download the entire large corpus to start or to make an ordinary recommendation.
4. **Pre-built indexed candidate retrieval + progressive scale proof.** Build deterministic retrieval/index structures for fridge ingredients, exclusions/allergens, dietary constraints, cuisine/geography, meal role, time, difficulty/skill, equipment, recipe-universe role and recommendation eligibility. The large universe is reduced to a bounded candidate set before full records are fetched and the existing deterministic evaluator/scorer runs. Re-run the 1k/10k/50k/100k synthetic ladder and measure actual candidate-set cardinality, bytes, latency and memory. **D1 is absent by default and may be prototyped only if these measurements show that R2 + pre-built indexes cannot meet required query/retrieval gates without unreasonable complexity or cost.**
5. **Generalized ingestion/control plane.** Only after the scale shape is proven, generalize Gate F2 from a Wikibooks-specific lane into source adapters feeding one canonical pipeline: source registry → rights/reuse state → immutable provenance → parse/normalize → duplicate/family candidate detection → ingredient/quantity mapping → hard metadata → nutrition state kept separate → admit/hold/reject → portable runtime artefact/index. The pipeline must be idempotent, resumable and batchable.
6. **Incremental large-corpus validation.** Replace any assumption that CI must evaluate every profile against every one of 100k recipes on every change. Validate schemas/shards and changed records deterministically; retain property tests, golden-corpus parity, bounded sampled regression sets, source/provenance invariants and separately runnable full scale benchmarks. A large corpus must remain auditable without turning normal CI into billions of evaluations.
7. **Production-shaped real-source pilot.** Provision the accepted Cloudflare stack only after Steps 1–6 earn it: GitHub source → Cloudflare Pages private production entry point → Cloudflare Access exact-email allowlist + email OTP → protected Worker → R2 corpus/index objects → `RecipeSource` V2 → existing deterministic evaluator. Start with source B, approximately 928 Open Recipe Archive Spanish records, only after its source-book/public-domain audit passes. D1 remains optional/benchmark-gated. At private-production activation, the legacy public GitHub Pages surface must not expose protected corpus functionality.
8. **Measured large-corpus readiness/population gate.** Scale B → C → D → verified E cohorts only after rights, quality, coverage, performance, free-tier/cost, retrieval quality, recommendation behavior and incremental validation all pass. The target is broad useful coverage, not achievement of an arbitrary row count. Any paid infrastructure, weakening of rights/provenance, automatic recommendation admission or private-Knowledge-Core runtime dependency requires a separate explicit gate.

Steps 1–6 are infrastructure work and may use only synthetic data plus the existing reviewed corpus. Step 7 is the first point at which a new large real source is allowed into the production-shaped runtime pipeline. Source-rights audits may occur earlier, but no candidate is admitted merely because it is large or technically convenient.

### User-accepted production architecture

```text
GitHub repository
  - code / review / version history
  - project source of truth
        ↓ deploy
Cloudflare Pages
  - lightweight static Culinary app
  - private production entry point
        ↓
Cloudflare Access
  - EXACT EMAIL ALLOWLIST ONLY
  - one-time email code / OTP
  - no public registration
  - no "any email may sign in"
        ↓
Cloudflare Worker
  - small authenticated retrieval gateway
  - validates protected identity/request boundary
        ↓
Cloudflare R2
  ├─ versioned recipe-detail objects
  ├─ source / licence / attribution / transformation provenance
  ├─ pre-built deterministic retrieval-index shards
  └─ manifests / corpus versions / admission state
        ↓
RecipeSource V2 retrieves bounded candidate IDs/details
        ↓
existing deterministic local hard filters + evaluator + scorer + planner
        ↓
recommendations / fridge-first discovery / recipe search

OPTIONAL, ONLY IF BENCHMARK EARNED:
Cloudflare D1 = compact relational/query index, not default recipe warehouse
```

### Hard invitation-only access constraint

The production application is **not open signup**.

- only exact email addresses explicitly placed on the owner's allowlist may authenticate;
- an otherwise valid email address is insufficient when it is not allowlisted;
- do not use `Everyone`, wildcard public-email-domain rules or any equivalent policy that turns identity proof into membership;
- email OTP/passwordless Access is the preferred initial login; the app does not maintain app passwords;
- any later Google/GitHub/passkey identity provider must still intersect the exact owner-controlled allowlist;
- protected Worker/API routes must validate/trust the Cloudflare Access boundary rather than relying on hidden UI;
- removing an email from the allowlist must revoke future access cleanly;
- the GitHub repository being public does **not** grant production application access;
- when the private Cloudflare production surface is activated, legacy public GitHub Pages must be disabled/retired or limited to a non-sensitive shell/landing surface so protected corpus functionality is not publicly reachable.

This hard access rule may not be weakened merely to simplify deployment.

### R2-first / D1-optional rule

The corpus is fundamentally read-mostly. The preferred model is controlled offline ingestion/versioning followed by many reads, not continual per-recipe database writes.

R2 is therefore the default recipe/provenance/index object store. Pre-built deterministic index shards should be tried first for ingredient, cuisine, dietary, time, meal-role and other hard retrieval dimensions.

Cloudflare D1 is simply an **optional SQL librarian/catalogue**. Do not add it initially. It is permitted only when measured Step-4 evidence shows that deterministic R2 index intersections cannot satisfy required query shapes, latency or transfer budgets cleanly. If introduced, keep full recipe bodies/provenance in R2 unless a later benchmark demonstrates a better portable split.

### Provider-portability rule

No infrastructure provider is the canonical recipe source of truth.

Canonical corpus artefacts must remain reproducible as versioned portable data such as JSONL/JSON, manifests, source/rights ledgers and deterministic index-build inputs/outputs. Cloudflare is a delivery/storage adapter behind app-owned interfaces.

If pricing, limits, terms or product availability change, the architecture must allow migration of R2 to another object store, Access to another invitation-only provider, Worker to another small API/serverless layer, and D1 (if ever used) to SQLite/Postgres/another SQL store without rewriting culinary identity, provenance or recommendation logic.

### Reuse-before-reinvent architecture references

Use `docs/CORPUS_SCALE_100K_REFERENCE_AND_SOURCE_ROADMAP.md` for the full source/reuse map. The Cloudflare reconciliation adds these preferred implementation references:

- `cloudflare/workers-sdk` — official Workers/Wrangler/local binding patterns for Pages, R2 and D1 development;
- `cloudflare/templates` — official small Worker/Pages project patterns; use selectively without unnecessary framework migration;
- `cloudflare/cloudflare-docs` — canonical Access policy, exact-email authorization, OTP, Worker protection and service-limit semantics; revalidate current syntax/quotas at provisioning time;
- `cloudflare/pages-plugins` and official Cloudflare Access examples — reference patterns for the `Cf-Access-Jwt-Assertion` authorization boundary; prefer current supported docs/patterns over historical code where they differ;
- `AdamBouhmad/open-recipe-archive` — provenance-first collection/JSONL/index layout;
- `smeet666/mcp-wikibooks-cookbook` — Wikimedia parser/pacing patterns;
- `nerkyzas157/gamito` — design-only retrieve-first/hard-filter/deterministic-planner pattern while code licence remains absent;
- `mealie-recipes/mealie` — mature feature/data-model comparator, not a baseline dependency;
- earlier Firebase quickstarts/recipe-PWA references — retained as fallback/comparison evidence, not the accepted first implementation path.

### Cost target and human gates

The design target for the current usage model — the owner plus a small number of explicitly invited friends — is **€0 recurring infrastructure cost** using applicable Cloudflare free tiers.

Exact Pages, Access, Workers, R2 and D1 quotas/limits must be revalidated at implementation/provisioning time and proven by measurements rather than assumed permanent.

A paid Cloudflare plan, paid search service, paid API, conventional hosted backend or other recurring infrastructure charge is **not pre-authorized**. If the measured free architecture is insufficient, stop at a human cost/architecture gate with alternatives and measured reasons.

Expected later human/setup actions are intentionally small: create/authorize the Cloudflare project/domain configuration when the production-shaped Step-7 pilot is reached; configure the owner's exact allowed-email list; and approve any genuinely ambiguous source-rights or paid-infrastructure decision. **No further architecture-choice confirmation is required before Step 1.**

### Large recipe-source selection contract

The likely production corpus is now a **rights-gated source portfolio**, not one mandatory giant database. Candidate admission remains governed by `docs/CORPUS_SCALE_100K_REFERENCE_AND_SOURCE_ROADMAP.md`.

The previously discussed large scraped candidate, commonly presented as the **Recipe Box** dataset at roughly **125k recipes** and remembered in conversation as approximately 128k, is **FAILED_CURRENT_ADMISSION / DO NOT USE AS THE PRODUCTION CORPUS**. The available description states that the records were scraped from recipe websites; an MIT licence on scraper/software code does not by itself establish dataset-wide rights to rehost, redistribute, transform and publicly display the underlying third-party recipe text. This is a rights/provenance failure for the current production contract, not a claim that the dataset is technically unusable for private research.

A replacement corpus/source cohort may pass only if the research can evidence, at minimum:

1. **Content-level reuse rights.** Explicit rights for the recipe data/content itself, not merely the crawler or repository code, compatible with storing, normalizing, indexing, caching/rehosting, transforming and displaying the fields we actually use.
2. **Attribution/ShareAlike/usage compatibility.** Attribution, notices, ShareAlike, non-commercial or other conditions must be implementable in the intended app. Images/media are excluded unless independently licensed for the exact reuse path.
3. **Lawful acquisition.** Prefer an official bulk export, open dataset, documented API or other reproducible lawful snapshot. No login/paywall circumvention, anti-bot bypass, prohibited scraping or dependence on unstable scraping tricks.
4. **Useful structured recipe content.** At minimum a stable recipe ID/title, ingredient lines with quantities/units where available, and preparation instructions. Provenance/source locator must survive normalization. Yield/servings, time, cuisine/geography, meal role and tags are valuable but may be absent if truthfully unknown.
5. **Scale and coverage.** Tens of thousands to 100k+ records are attractive, but count is secondary to useful coverage across the recipe-universe jobs and cross-cutting dimensions already defined by the Brain/Atlas contract. Systematic regional/cuisine gaps must remain measurable rather than hidden by raw volume.
6. **Quality and deduplication feasibility.** Records must be parseable enough to normalize; exact duplicates, near-duplicates and meaningful variants must be distinguishable without destructive family collapse. Source frequency is not authenticity evidence.
7. **Architecture compatibility.** The corpus must be representable in the portable metadata/index/detail model and support bounded retrieval rather than forcing the entire dataset into the JavaScript bundle. The normalized representation plus necessary indexes must fit the verified R2/Cloudflare zero-cost target or have an equally lawful portable zero-cost strategy.
8. **Zero-cost operating fit.** No mandatory paid API, paid licence, per-request fee or recurring hosting dependency for the intended owner + invited-friends use case. Any otherwise superior paid source is reported separately and requires explicit approval.
9. **Independent nutrition boundary.** Source recipe nutrition values, when present, do not become authoritative `NutritionSource` evidence merely because the recipe corpus is admitted. Ingredient/form/quantity/nutrient evidence remains governed by the existing nutrition contract.
10. **Stable provenance and updateability.** Record/source version or retrieval provenance must be reproducible enough to audit what was admitted. Later source updates must create reviewable changes rather than silently rewriting previously admitted truth.

Ongoing source audits should rank/admit cohorts by rights confidence, field completeness, useful unique-record scale after duplication, world/constraint coverage, ingestion difficulty, R2/Cloudflare fit, provenance quality and operational stability, with explicit `PASS / CONDITIONAL / FAIL` states.

### Source-admission order — A through E

The implementation references and researched source order remain frozen in `docs/CORPUS_SCALE_100K_REFERENCE_AND_SOURCE_ROADMAP.md`. Architecture reconciliation does not weaken them.

- **A — existing curated corpus + Wikibooks:** `PASS / ALREADY ESTABLISHED`;
- **B — Open Recipe Archive Spanish collection (~928):** `PASS-CANDIDATE / PREFERRED FIRST STEP-7 PILOT`, subject to source-book/public-domain verification;
- **C — Open Recipe Archive complete corpus (54,843):** `PASS-CANDIDATE / PRIMARY LARGE-CORPUS BASE`, admitted collection/source-book/record incrementally rather than in one bulk action;
- **D — ForkRecipe (916) + UniTools (501/127 countries):** `PASS-CANDIDATE / CLEAN OPEN SUPPLEMENTS`, with exact CC BY-SA 4.0 attribution/ShareAlike snapshots pinned at ingest;
- **E — RecipeDB (118,171):** `CONDITIONAL / SOURCE-COHORT SALVAGE GATE`, never all-or-nothing.

For **E**, the database-level CC BY-NC-SA 3.0 statement does not by itself clear underlying recipe prose. The required order remains: extract available provenance → partition by original source/domain → inspect original content-level rights/terms → classify each source cohort or record as `ADMIT_RIGHTS_VERIFIED`, `HOLD_RIGHTS_AMBIGUOUS`, `REJECT_RIGHTS_INCOMPATIBLE`, or `REJECT_PROVENANCE_MISSING` → ingest only verified records. Contacting RecipeDB/original rights holders is a last-resort clarification step after documentary evidence is exhausted, not the first step.

There is **no minimum E retention target**. If 40k of 118k clear the gate, use 40k; if 5k clear it, use 5k; if none clear it, use none. Rights, provenance, quality and coverage dominate raw count.

Large research-only/reuse-unclear corpora remain excluded from production: Recipe Box ~125k (`FAILED_CURRENT_ADMISSION`), RecipeNLG 2.23M (`FAIL_PRODUCTION / research-educational terms`), and Recipe1M+ >1M (`FAIL_PRODUCTION / research-institution access`).

### Next executable action / handover boundary

**NEXT ACTION: STEP 1 — CORPUS SCALE CONTRACT + SYNTHETIC BENCHMARK HARNESS.**

The next implementation chat should start here without reopening the already accepted architecture choice:

1. fresh-reconcile app `main`, open PRs, active branches and concurrent work;
2. read this section plus `docs/CORPUS_SCALE_CLOUDFLARE_ACCEPTED_ARCHITECTURE.md` and `docs/CORPUS_SCALE_100K_REFERENCE_AND_SOURCE_ROADMAP.md` as the governing scale contract;
3. preserve the reviewed current recipe corpus as the golden behavioral oracle;
4. implement only Step-1 synthetic benchmark/scale-contract infrastructure first;
5. generate deterministic synthetic 1k/10k/50k/100k catalogues without real external recipe ingestion;
6. model provider-neutral R2-style immutable recipe objects + pre-built retrieval indexes and measure record/index sizes, candidate cardinalities, bytes, memory, local retrieval/filter/ranking latency, build time and validation cost;
7. define explicit acceptance thresholds before choosing Step-2/3 implementation details;
8. do not add D1 unless later Step-4 benchmark evidence earns it;
9. make no production Cloudflare provisioning, no mass real-source ingestion, no paid infrastructure, no public ranking behavior change and no private Knowledge Core runtime dependency in Step 1;
10. preserve nutrition B24 as an independent resumable lane; at the 2026-09-04 reconciliation, `agent/nutrition-b24-priority-reconciliation` contained one workflow-only commit and had diverged behind current `main`, while `agent/nutrition-b24-feta-composition` had no unique commits relative to the then-current main lineage;
11. before every meaningful write or merge, fresh-reconcile GitHub again because branch state may have changed since this snapshot.

The user has accepted the Cloudflare target architecture and the exact-email invitation-only policy. The next chat may proceed autonomously with Step 1 after fresh reconciliation.