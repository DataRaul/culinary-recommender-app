# Culinary Brain Corpus Calibration V1

Date: **2026-09-24**

Status: **C3 PASS / C4 READY**

## Objective

Use the existing Knowledge Core `culinary_nutrition` Brain to help classify, calibrate and critique the protected recipe corpus while keeping the Culinary app authoritative for runtime recipe data, hard constraints, recommendation behavior and tests.

This programme follows the validated Fitness Brain pattern:

```text
current recipe/source facts
-> hard deterministic evidence/safety gates
-> bounded model classification
-> Culinary Brain critique/calibration
-> field-level authority reconciliation
-> versioned public/private-safe derived metadata and priors
-> deterministic recommender
-> matrix/browser tests
-> failure analysis and bounded repair
```

The Brain is a development/calibration dependency, **not a live browser/runtime dependency**.

## Sequence

```text
D5 safe adapter prototype
-> defer D5 behavior
-> P1 full-v8018 private browse/search
-> Culinary Brain Corpus Calibration V1 + P2 metadata usability measurement
-> P3 progressively earned recommendation subsets
-> P4 real-v8018 recommendation/regression matrix
```

Browse/search does not wait for Brain completion. Brain calibration begins as soon as the real corpus surface and stable recipe identities are available.

## Authority model

This is not a two-AI majority vote.

Authority is field-specific:

1. exact source/provenance facts outrank inference;
2. allergens, dietary hard constraints, permanent exclusions and nutrition authority require the controlling evidence contracts;
3. deterministic app state and current user constraints remain app-owned;
4. bounded model/Brain judgment may propose or calibrate soft/semantic fields such as dish family, meal role, technique family, difficulty, convenience, similarity, culinary tradition confidence, adaptation fit and recommendation utility;
5. material disagreement or insufficient evidence resolves to `UNKNOWN`, `AMBIGUOUS` or `REVIEW`, not to whichever model produces the stronger score.

No Brain/model output may silently create nutrition authority, hard dietary/allergen safety, source rights, public admission or recommendation eligibility.

## Calibration ladder

### C0 — Golden curated calibration

Use the existing **85-recipe public runtime** as the first behavioral/golden set because its recommendation states, hard metadata and deterministic behavior are already tested.

Measure:
- agreement with existing authoritative labels;
- ranking direction;
- false positive hard-safety classifications;
- overconfident inference;
- abstention quality;
- explanation/reason fidelity.

### C1 — Stratified protected pilot

Use a bounded stratified sample from v8018, initially targeting **~500 recipes** across:
- source systems/layers;
- high/low ingredient-identity coverage;
- known/unknown metadata;
- dish/category diversity;
- modern vs historical source material where represented;
- structural exception boundaries.

The exact sample is frozen before evaluation. Tune only against named failure classes; do not overfit individual recipes.

### C1 closeout — 2026-09-27

The exact frozen 500 completed a two-part evaluation:

- **100-row calibration canary:** initial precision 0.875 against a frozen 0.90 threshold; two named taxonomy-boundary failure classes were repaired without changing the sample or threshold; calibrated rerun precision 1.0 (24/24 proposed authoritative cells correct), with zero high-confidence contradictions and zero hard-authority violations.
- **400-row unseen remainder:** exact audit found zero authoritative `dishCategory` / `mealRole` reference cells. No gold labels were manufactured. The negative-capability gate therefore required abstention/review and passed across all 800 evaluated cells with zero proposals and zero hard-authority violations.

Terminal: `CULINARY_BRAIN_C1_PASS_WITH_REFERENCE_COVERAGE_LIMIT__C2_CANDIDATE_ONLY_READY`.

This is not a claim of independent semantic accuracy across historical UNKNOWN rows. It proves calibrated precision where references exist and fail-closed behavior where they do not.

### C2 — Frozen full-v8018 candidate classification pass

After the bounded C1 terminal above, run the frozen classification/reconciliation pipeline across all **19,268** protected identities in **candidate-only / abstention-default** mode.

Persist:
- input corpus version;
- Brain/Knowledge Core pin;
- model/prompt/schema version where applicable;
- proposed field/value;
- authority class;
- confidence/evidence state;
- disagreement state;
- reconciliation result;
- reason code;
- no-authority fields explicitly held.

Raw protected source expression is not copied into public GitHub merely to support classification.

### C3 — Recommendation calibration

Only fields that survive the authority/reconciliation contract may become deterministic local recommendation priors.

Expected order:

```text
hard filters
-> evidence/authority class
-> user/profile/pantry constraints
-> culinary fit and utility priors
-> diversity/reuse/planning objectives
-> explicit uncertainty/abstention
```

This mirrors the Fitness Brain pattern: Brain reasoning is distilled into local testable priors rather than queried live for each recommendation.

### C4 — Real-corpus failure loop

Run the real v8018 corpus through the recommendation matrix and classify every material defect as one of:

- source/provenance;
- identity/normalization;
- hard dietary/allergen authority;
- nutrition/evidence;
- Brain classification/calibration;
- reconciliation/authority;
- ranking/planner;
- abstention;
- runtime/performance;
- browser/UX.

Repair the smallest causal layer and rerun the bounded affected tests plus the real-v8018 regression suite.

## Success model

The target is progressive rather than all-or-nothing:

```text
19,268 safely browsable/searchable
-> 19,268 measured/classified with explicit unknowns
-> bounded hard-safe recommendation subset
-> larger recommendation subset after targeted repairs
-> continuously tested real-19k recommender
```

Processing or classifying a recipe does **not** imply recommendation readiness. A C2 candidate classification is not authoritative metadata and cannot clear a P3 hard gate by itself.

## Hard boundaries

Not authorized by this roadmap object:

- live browser calls to private Knowledge Core or an LLM;
- Brain/model majority vote over source authority;
- inferred allergens/dietary safety without earned evidence;
- inferred nutrition authority;
- automatic public recipe admission;
- protected-body rewrite;
- new source ingestion;
- paid model/API/infrastructure commitment;
- third D1 shard;
- Barbecue workflow mutation.

Any runtime behavior change still requires deterministic tests, normal PR validation and browser acceptance.


### 2026-09-27 — Culinary Brain C2 full-v8018 candidate classification

C2 is **COMPLETE / PASS** at `CULINARY_BRAIN_C2_FULL_V8018_CANDIDATE_CLASSIFICATION_PASS`. Exact pinned-source reconstruction classified all **19,268** v8018 identities with deterministic candidate-only / abstention-default semantics for the two C1-calibrated fields.

For dish category, **1,079** cells already had reviewed canonical references and were never overridden; **6,777** rows entered REVIEW and **11,412** abstained. Of the review rows, **6,172** carried one selected LOW/MEDIUM candidate while **605** conflicting lexical-signal rows remained REVIEW with no selected value. For meal role, **524** canonical references were preserved; **2,126** rows entered REVIEW and **16,618** abstained, with **2,066** selected review candidates and **60** conflicting rows left without a selected value.

The deterministic full-classification digest is `15ffb997d0715d72d248ca53ea03f4a95254123a9429e3a2ec4d085e144eaf3d`. Compact evidence is `data/generated/culinary-brain-c2-candidate-classification-summary-v1.json`; full 19,268-row output remains a CI artifact rather than a runtime dependency.

C2 recorded **0 known-reference override attempts, 0 HIGH-confidence cells, 0 hard-authority violations, 0 protected D1 reads/writes, 0 protected-body reads/exports, and no public/recommendation/nutrition/dietary/source-rights/KC/paid/third-shard/Barbecue change**. C2 candidates are review aids only. The Brain advances to **C3 deterministic recommendation-prior calibration**; protected P3 remains blocked on C3 plus existing hard metadata/authority requirements.


### 2026-09-27 — Culinary Brain C3 deterministic recommendation-prior calibration

C3 is **COMPLETE / PASS** at `CULINARY_BRAIN_C3_PRIOR_CALIBRATION_PASS__NO_NEW_RUNTIME_PRIOR_PROMOTION__C4_READY`. The exact current **85-recipe public runtime** was exercised across a fixed **12-case** profile/context calibration matrix. Repeated evaluation produced **0 deterministic mismatches**, **0 hard-constraint violations**, and a matrix digest of `764ccca3c654a866138d6214afda97578c8eb401b3eb579e01a7e3d1c8672855`. Unknown nutrition remained explicitly non-numeric in **6** eligible matrix appearances.

C3 deliberately promoted **0** C2 fields into runtime priors. Dish-category proposals remain review-only and are not a current user-facing scorer signal. Meal-role proposals also remain review-only, while current meal-type semantics are a hard eligibility scope that must not be duplicated or weakened by inferred soft priors. The current deterministic scorer therefore remains **unchanged**.

Evidence: `data/generated/culinary-brain-c3-prior-calibration-summary-v1.json`. C3 performed **0 protected D1 reads/writes, 0 protected-body reads/exports, 0 C2 candidate promotions**, and made no public/recommendation/nutrition/dietary/source-rights/KC/paid/third-shard/Barbecue change.

The Brain advances to **C4 real-v8018 failure/repair loop**. Protected P3 remains blocked on C4 plus the existing hard ingredient/dietary/allergen/provenance requirements.
