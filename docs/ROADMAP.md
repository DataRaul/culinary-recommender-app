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
| V1.1 / Recipe Corpus Gate F2 | CONTROL PLANE MERGED / RUNTIME GATED | revision-aware breadth control plane + source-presence holds + bounded current category hints; 0 newly admitted recipes and no runtime activation |
| V1.1.1 / Nutrition B7 | COMPLETE | strict Ciqual recipe-unlock tranche: quinoa + prawns + category-level dry-pasta/orzo; authored missing-density blockers 141→133; still 0/76 authoritative |
| V1.1.2 / Nutrition B8 | COMPLETE | exact SR Legacy small-onion quantity evidence earns first authoritative authored recipe; 1/76 authoritative / 75/76 estimate-preserved |
| V1.x / Recipe-unlock evidence | CONTINUOUS | target residual composition/form, nutrient-field and exact quantity blockers by recipe-level unlock value; independent of external RecipeSource breadth |
| V1.x / Authoritative nutrition coverage | CONTINUOUS | expand reviewed evidence under the approved source policy without guessing |
| V1.x / Corpus breadth | F2 CONTROL PLANE MERGED / RUNTIME GATED | broaden through revision-aware review and measured coverage gaps rather than raw recipe-count growth; no automatic admission |
| V1.x / EU regulatory truth lane | RESEARCH / SCAFFOLDING_ALLOWED | classification/regulatory evidence remains separate and audit-only until a future behavior contract |
| V1.x / Brain-derived behavior | SEPARATELY GATED | only narrow reviewed static exports with deterministic tests and normal PR/browser acceptance |

## 2026-09-01 Brain / World Recipe Atlas reconciliation

The Brain and recipe-database directions are now architecturally aligned, but they are **not the same data store**:

- Knowledge Core owns reusable culinary/nutrition reasoning, World Recipe Atlas discovery/identity/variant verification policy, source-role/licensing reasoning and public-export eligibility;
- the public app owns actual runtime recipe records, `RecipeSource`, ingredient/quantity normalization, allergens/dietary/permanent exclusions, nutrition evidence, ranking/planner behavior and browser tests;
- Atlas breadth cannot bypass Gate F, and an `IDENTITY_VERIFIED` family is not automatically a public recipe;
- imported recipe content cannot become authoritative nutrition evidence merely by being imported.

The private Knowledge Core development branch `agent/culinary-nutrition-brain-p0` is currently **49 commits ahead of KC `main` and 3 behind** after `main` advanced independently. Its current branch head is `81d19c9e84c1f685fb555d0c584c7389fa370df7`; KC `main` is `043de7274ee85ce56ef1618f9b1bb31f7a99f6fc`, with merge base `0ab4c0d7a1882a494bc92ff0bdd6421764394eca`. This is a development/reference pin only until the private KC reconciliation/validator/PR/merge gate completes. The public app's already-reviewed calibration artifact intentionally remains pinned to the narrower earlier commit `e5dcb29a7c6b78f59c062faf4c963c74aac10743` and remains `CALIBRATION_ONLY_NO_RANKING_CHANGE`.

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
- dedicated Culinary Brain/Atlas and corpus-critic validation are wired into the Knowledge Core validation workflow.

The latest KC branch work is history-aware for Gate F2 but predates the public-app PR #27 category-hint merge. If KC ownership becomes available, the next legitimate adapter/critic maintenance must reconcile the final category-hint firewall without granting recipe-admission, nutrition or runtime authority.

The earlier Recipe Universe requirements commit `84abde1560a2dad7ce3318cbfb6bd827681a39fb` remains useful historical lineage, but it is no longer the current Atlas development head. Future roadmap references should distinguish the stable public calibration pin, the historical recipe-universe requirements pin and the current unmerged KC development head rather than using one SHA for all three purposes.

### Parallel next lanes

Three lanes may proceed independently under their own gates:

1. **KC Brain/Atlas integration lane** — read-only from this public-app lane while another chat owns the branch; when ownership is free, reconcile the current 49-ahead / 3-behind Knowledge Core branch against `main`, preserve Brain governance, and stop before any human PR/merge gate.
2. **Gate F2 corpus breadth lane** — continue from the merged metadata-only/revision-aware/source-presence/category-hint control plane through bounded review → admit/reject → ontology/hard-metadata work. Gate F itself is already complete; F2 does not reactivate or rewrite it and runtime activation remains gated.
3. **Recipe-unlock nutrition lane** — B8 is complete with the first authoritative authored recipe; continue targeting residual composition/form/nutrient-field/quantity blockers against the 76 authored-recipe baseline by measured unlock value.

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

Ambiguity remains fail-closed. Lime has conflicting 17 g / 65 g piece rows; avocado has 130 g small / 220 g large states. At the B6 stage, `onion|small`, `sesame_oil|tsp` and `red_onion|piece` remained deferred rather than inferred; B8 later resolved only the exact `onion|small` state.

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

## Nutrition B8 — COMPLETE / first authoritative authored recipe

B8 admits one exact USDA FoodData Central SR Legacy portion row: raw onion FDC `170000` / NDB `11282`, portion row `85862`, source modifier `small`, **70 g**. The source is quantity-only in B8; composition-source policy remains Foundation + Ciqual, Matvaretabellen remains B6 portion-only, and no generic-small or diameter inference is introduced.

The measured candidate phase established **1/76 authoritative authored recipes**: `indian_chicken_spinach_curry`. Final B8 validation run `33533992457` passed strict repository hygiene, **109 deterministic tests**, static validation, coverage/source verification and browser acceptance. PR #26 merged at `51658632c1684e9206d24ed331ded116b730e412`; normal PR validation run `33535410091`, post-merge validation run `33535630446` and Pages run `33535629306` all succeeded.

Terminal B8 state is **1/76 authoritative / 75/76 estimate-preserved**. Unsupported quantity is **7** after the B8 reduction from 27; missing density remains **133**, ambiguous portions **20**, mixed carbohydrate semantics **16**, and tracked-field gaps remain visible separately.

Exact Foundation 2026-04 review also confirms that dry lentils, 93/7 raw ground turkey and full-fat cottage cheese are partial because tracked fibre is unpublished; tahini/sesame-butter identity remains insufficiently strict for this tranche; iodized salt is incomplete for tracked composition; crushed canned tomato is not passata; prepared edamame is not mapped to an unspecified state; exact smoked paprika remains unresolved. B8 therefore prefers one earned recipe unlock to a larger but weaker evidence ledger.

## Culinary & Nutrition Brain P0 — authorized foundation and active Atlas development

The user explicitly authorized Brain P0 on 2026-08-31. Construction follows the Knowledge Core Brain Construction Protocol rather than app-local improvisation.

The reviewed public-app calibration pin remains `DataRaul/knowledge-core` commit `e5dcb29a7c6b78f59c062faf4c963c74aac10743`, domain `culinary_nutrition`. It contains the official-source foundation and bounded free operator layer that were reviewed for the public calibration contract.

The broader Brain/Atlas work is on the unmerged Knowledge Core branch `agent/culinary-nutrition-brain-p0`, current head `81d19c9e84c1f685fb555d0c584c7389fa370df7`. It contains the Brain/Atlas build plus later history-aware Gate F2 reconciliation. KC `main` is independently at `043de7274ee85ce56ef1618f9b1bb31f7a99f6fc`, leaving the branch **49 ahead / 3 behind** and requiring reconciliation before any merge gate. The latest branch commits predate the public-app PR #27 category-hint merge, so final category-hint semantics must be reconciled only when KC ownership is free.

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

### Current corpus and F2 state

The app-owned RecipeSource universe remains **84 recipes**: 76 curated project-authored records plus eight exact-revision Wikibooks records, normalized into **83 dish families**. The `spanish_potato_omelet` family explicitly preserves one authored and one external variant instead of silently replacing either.

Only **Baba Ganoush** and **Bruschetta (base)** are `SEARCH_ONLY`; six external records remain `REFERENCE_ONLY_INCOMPLETE_HARD_METADATA` because source-backed hard metadata is incomplete. Missing time/serving values remain unknown rather than guessed. The seven-role audit truthfully leaves `contemporary_modern` and `genuinely_new_trending` uncovered in this first tranche.

Gate F2's control plane is merged through PR #24 (`0745f8990b3eca0003fdecd083cdc52830f5a233`), PR #25 (`be143c545d6268413ec68bece7d29c4be18f84b0`) and PR #27 (`e3d87bdec2880aae2b9ae59a8cde106a9bafb0c8`). It provides metadata-only broad discovery, immutable reviewed exact-revision history, `TRACKED_PAGE_NEW_REVISION` / `TRACKED_PAGE_METADATA_CHANGED` / `NEW_SOURCE_PAGE` review-queue events, explicit source-universe completeness, source-presence anomaly holds, bounded current category hints, a reproducible compact generated index, and tests preventing generated-index runtime imports. F2 newly admitted recipes remain **0** and `runtimeActivationAuthorized` remains false.

Category hints are current metadata only, not revision-pinned evidence, and cannot authorize hard metadata, authenticity, regional/canonical claims, recommendation eligibility, trend/newness, nutrition, safety, dietary truth or runtime behavior.

External source nutrition is explicitly **not** imported as authoritative NutritionSource composition. RecipeSource, NutritionSource and regulatory evidence remain separate truth lanes; allergens, dietary constraints, permanent exclusions, quantity semantics and fail-closed recommendation policy remain intact. The private Knowledge Core remains offline at runtime. The authored 76-recipe nutrition denominator remains independent of the 84-record RecipeSource universe.

### Exit record

The technical candidate implemented and validated the following requirements before Gate F acceptance:

1. Wikibooks licensing/attribution/ShareAlike and source-revision audit was recorded and passed for the chosen public-app ingest path;
2. a bounded reproducible Wikibooks acquisition was normalized into an app-owned external `RecipeSource` implementation;
3. provenance survived ingestion, transformation, deduplication and public rendering where attribution is required;
4. deterministic tests proved external records can be searched/recommended without private KC runtime access;
5. dish-family/alias/variant handling and duplicate policy were tested;
6. the seven recipe-universe tags plus cross-cutting coverage dimensions were represented or truthfully marked unknown;
7. a corpus coverage report distinguished raw source pages, normalized records/families, duplicates/variants, unsupported records and coverage gaps;
8. imported recipes could not bypass allergen/dietary/permanent-exclusion hard constraints or nutrition evidence gates;
9. the Brain/KC recipe-universe contract remained pinned and any behavior-driving export followed the existing Brain adapter gate;
10. a human review confirmed the external corpus was useful in the public app before Gate F was marked complete.

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

With B8 complete, priority remains **recipe-unlock analysis** rather than raw source-row growth. This lane is not blocked by F2 and may continue against the authored corpus while external-corpus review proceeds separately:

1. identify recipes one or two blockers away from authoritative calculation;
2. target high-frequency remaining composition/form blockers only where source form can be reviewed strongly;
3. resolve residual exact quantity semantics where an authoritative source or truthful editorial gram rewrite exists;
4. preserve explicit ambiguity rather than collapsing size/form variants;
5. keep the carbohydrate semantic firewall unchanged;
6. continue reporting newly authoritative recipe IDs, not just added records.

Current unresolved high-value areas include exact smoked paprika composition/form, lentils/red lentils, ground cumin, firm tofu, generic noodles, turkey mince, lemon composition/form, basmati rice, tahini identity, residual red-onion quantities and sesame-oil teaspoon semantics. The deterministic priority report, not this list, controls actual ordering. Lime and avocado remain known ambiguous states.

## European source backlog

ANSES-Ciqual is the current bundled European composition source. Matvaretabellen is the current bounded European quantity source. Fineli/THL remains attractive under CC BY 4.0, but both its documented API and official package returned HTTP 403 to standard GitHub-hosted runners during the bounded audit; no bypass is attempted. Frida/DTU, NEVO/RIVM and BEDCA/AESAN remain governed by exact reuse terms. EuroFIR remains outside the no-cost contract.

EFSA FoodEx2 and EU Commission regulatory datasets remain a separate classification/regulatory evidence lane. They may be researched and represented as audit metadata but must not silently become composition values or recommendation rules without a future explicit behavior contract.

## Other roadmap flags — no status change yet

The Brain/Atlas reconciliation exposes several adjacent items, but none should be silently activated by this documentation update:

- **Knowledge Core merge/validation:** the branch is currently 49 commits ahead of and 3 behind `main`; reconcile only after ownership is free, without weakening Brain governance, before any human validator/PR/merge gate.
- **Knowledge Core Gate F2 adapter/critic maintenance:** the current branch is history-aware through the earlier F2 queue but predates final PR #27 category-hint semantics; reconcile that firewall only when KC ownership is free and without granting admission/runtime authority.
- **`docs/BRAIN_ADAPTER_CONTRACT.md`:** its ownership boundary remains correct, but a future revision should explicitly add the Atlas distinction: verified family metadata may inform an app-authoring brief, while source recipe content/public runtime ingestion belongs to Gate F/F2 and `RecipeSource`.
- **`docs/DEFERRED_CAPABILITIES.md`:** Brain P0 is still described only as `FOUNDATION BUILT`; it should eventually distinguish the active Atlas discovery/verification lane from still-deferred advanced culinary exploration.
- **Advanced culinary exploration / recipe images / fitness integration:** no automatic activation. Atlas breadth strengthens their future inputs, but Gate F/F2, text/data quality and the existing separate-gate rules still apply.
- **Trending/new recipes:** the Atlas and corpus critic establish that freshness-sensitive discovery needs a separate recency-evidence lane; Wikibooks corpus frequency, category presence or edit recency alone is not trend evidence.

## Standing architecture

The accepted shell/core is not reopened by routine corpus, ontology, evidence or Brain-calibration growth. V1 work remains additive behind stable `RecipeSource`, `NutritionSource`, `IngredientNormalizer`, `RecommendationPolicy`, planner, substitution and cost interfaces.

Future nutrition breadth must come from reviewed source/form identity plus explicit quantity evidence. Generic spoon/piece averages remain prohibited merely to increase apparent coverage.

Cost remains relative, deterministic and explainable. Culinary quality remains normalized from project-authored structured metadata and instructions. Fridge Search, planner, allergens, dietary restrictions and permanent exclusions continue to use the same hard safety truth.

The Culinary & Nutrition Brain is authorized and its broader Atlas development is active on an unmerged Knowledge Core branch, while Gate F2's public-app control plane is merged but remains runtime/admission gated. The public app must never call private Knowledge Core at runtime. Downstream behavior changes remain separately evidence- and test-gated.