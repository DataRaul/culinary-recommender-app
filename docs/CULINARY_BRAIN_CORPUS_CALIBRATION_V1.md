# Culinary Brain Corpus Calibration V1

Date: **2026-09-24**

Status: **C1 BOUNDED PASS / C2 CANDIDATE-ONLY READY**

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
