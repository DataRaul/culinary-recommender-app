# Protected Corpus Runtime Usability V1

Date: **2026-09-24**

Status: **P1 IMPLEMENTATION CI PASS / LIVE OWNER CANARY PENDING**

Objective: turn the already-populated protected corpus **v8018 / 19,268 recipes** into a corpus the owner can actually use, while preserving the fail-closed recommendation, rights, nutrition, security and cost boundaries.

## Priority decision

The owner-priority sequence is now:

```text
D5 Fitness Integration safe adapter prototype — PASS
-> further D5 behavior work — DEFERRED
-> P1: make all 19,268 privately browsable/searchable — READY
-> Culinary Brain Corpus Calibration V1 + P2 metadata usability measurement
-> P3 progressively earned recommendation subsets
-> P4 real-v8018 recommendation/regression matrix
```

The Barbecue Technique Corpus remains a separate scheduled lane and is not modified by this programme.

## What is already enabled

The project has already solved most of the scale/storage problem:

- v8018 contains **19,268 protected recipes**;
- exact topology is **two D1 recipe-body shards**;
- authenticated protected reads, revocation and fail-closed unauthenticated behavior have been proven;
- cross-shard route/body hydration primitives exist;
- the architecture is explicitly bounded and avoids full-corpus scans;
- final owner runs observed at most **8 D1 subqueries/request** against a hard fail-safe of 16;
- **19,268 / 19,268** titles are known;
- **19,265 / 19,268** records are structurally parseable;
- a deterministic reversible normalization overlay exists for every protected identity;
- scale architecture has already passed **170k required / 250k stress** proof.

Therefore the question is no longer “can we store 20k recipes?” It is “which 20k-recipe product capabilities work, which fail, and what is the highest-leverage repair?”

## Current blockers

### 1. Full protected browse/search is not yet an earned product capability

Storage/auth/routing/hydration were proven during population. That is not the same as proving a user can browse, search, paginate and open recipes across the full v8018 corpus comfortably on the real app.

This is the **first runtime test target**.

### 2. Ingredient identity is the main recommendation bottleneck

Current protected evidence:

- ingredient occurrences: **144,245**;
- exact canonical ingredient matches: **36,760**;
- recipes with every ingredient identity exact-ready: **112 / 19,268**.

Browse/search does not need to wait for perfect ingredient identity. Recommendation hard filters do.

### 3. Dietary/allergen authority is not ready for automatic protected recommendation admission

The protected mapping currently has **0 reviewed dietary-authority recipes** under the strict current contract. Unknown must remain unknown; imported prose or source labels cannot silently become hard dietary/allergen truth.

### 4. Automatic protected recommendation readiness is currently zero

The recommendation-readiness audit correctly reports **0 / 19,268 automatically recommendation-ready**. The programme will not solve this by weakening the gate. It will create measured subsets and repair the highest-value blockers.

### 5. Nutrition is incomplete but is not a browse/search blocker

The current nutrition engine directly authorizes **0 protected recipes**. Nutrition remains an independent evidence lane. Recipes may still become safely browsable and, later, potentially recommendable with explicitly unknown nutrition where the existing recommendation contract permits it.

### 6. Canonical filter metadata is sparse

Many geography, tradition, technique, time, servings, category and meal-role fields remain UNKNOWN. P2 will measure filter usefulness over the real corpus and prioritize repairs by user value rather than attempting blanket enrichment.

### 7. Three structural exceptions are known

Three legacy CC0 records remain explicit structural exceptions. They are a useful failure-mode test: browse/detail surfaces must fail softly rather than corrupt the session or hide the problem.

## Gate sequence

### P0 — Evidence and contract audit — PASS

The real v8018 product baseline is frozen and matches the generated normalization, nutrition and recommendation evidence. Synthetic scale results remain regression/headroom evidence, not the primary product corpus.

The D5 safe adapter prototype also passed Validate public V0 #1080 (workflow run `36059408517`), including deterministic and browser acceptance. Further D5 behavior is explicitly deferred, so P1 is now the first incomplete gate.

### P1 — Private browse/search canary — IMPLEMENTATION CI PASS / LIVE OWNER CANARY PENDING

After the bounded D5 adapter prototype is closed, implement and test an owner-only protected browse/search surface over **all 19,268 records**.

Required behavior:

- authenticate before protected queries;
- paginate/bound every query;
- search/index IDs before body hydration;
- hydrate only bounded result/detail sets;
- work across both shards;
- preserve target <=8 D1 subqueries/request and hard fail-safe <=16;
- never perform a full-corpus request scan;
- expose source/provenance on detail;
- fail softly on the three structural exceptions;
- pass mobile/browser acceptance;
- do not change public runtime admission or recommendation authority.

### Brain calibration — parallel with P2

Once P1 gives the owner a stable real-v8018 browse/search surface, start `CULINARY_BRAIN_CORPUS_CALIBRATION_V1` in parallel with metadata usability measurement.

Use the existing Knowledge Core `culinary_nutrition` Brain under the same architectural pattern as the Fitness Brain: reusable Brain reasoning calibrates local deterministic priors; the browser does not call private Knowledge Core or an LLM at recommendation time.

Calibration ladder:

1. **C0:** existing 85-recipe public runtime as the curated/golden behavioral set;
2. **C1:** frozen stratified protected pilot of approximately 500 recipes;
3. **C2:** only after calibration gates pass, frozen classification/reconciliation over all 19,268 protected identities;
4. **C3:** reviewed reconciled soft fields may become versioned deterministic recommendation priors;
5. **C4:** real-v8018 matrix identifies classification, authority, ranking, abstention and UX failures for bounded repair.

Authority is field-specific, not a model vote. Source/provenance and hard safety/evidence contracts outrank Brain/model inference. Material disagreement resolves to explicit UNKNOWN/AMBIGUOUS/REVIEW.

Canonical contract: `docs/CULINARY_BRAIN_CORPUS_CALIBRATION_V1.md` and `config/culinary_brain_corpus_calibration_v1.json`.

### P2 — Metadata usability measurement

On the real 19,268 corpus, measure what users can actually filter or understand today: ingredient, source, category, meal role, geography, time, servings, difficulty and other dimensions.

Produce a ranked blocker table:

```text
dimension
-> current authoritative coverage
-> user-visible failure/limitation
-> number of recipes unlocked by repair
-> repair difficulty
-> evidence/source requirement
-> next bounded repair tranche
```

Do not infer missing metadata merely to improve percentages.

### P3 — Progressive recommendation admission

Do not wait for every recipe to become perfect. Create bounded cohorts that pass the existing hard constraints.

A protected record may become a recommendation candidate only after the required ingredient identity, dietary/allergen/permanent-exclusion semantics, provenance and deterministic compatibility are earned. Missing nutrition remains explicit and independent.

The expected product shape is progressive:

```text
19,268 browsable/searchable
-> smaller hard-safe recommendation subset
-> larger subset after targeted metadata repairs
-> repeated measurement and expansion
```

### P4 — Real-20k regression and product acceptance

The **real v8018 corpus becomes the primary product-scale test corpus**.

Continuously measure:

- search latency and result stability;
- pagination and filter behavior;
- cross-shard hydration;
- D1 subquery counts;
- transferred bytes / memory;
- malformed/unknown metadata handling;
- recommendation candidate generation and abstention;
- planner behavior over eligible subsets;
- mobile/browser UX.

Keep 100k, 170k and 250k synthetic proofs as regression/headroom tests.

## Stop/repair rule

Every run must classify failures into one of:

- runtime/retrieval;
- metadata/normalization;
- hard safety/eligibility;
- recommendation/planner compatibility;
- performance/cost;
- rights/provenance;
- browser/UX.

Then repair the highest-value technically resolvable blocker and rerun the affected bounded tests plus the real-v8018 regression set.

No raw coverage percentage can override source authority, dietary/allergen safety, provenance, security, D1 budget, or the zero-recurring-cost posture.


## P1 implementation note — 2026-09-24

The bounded owner-only implementation is now encoded in `config/protected_corpus_p1_private_browse_search_v1.json` and `docs/PROTECTED_CORPUS_P1_PRIVATE_BROWSE_SEARCH_V1.md`. It reuses both protected body shards, builds only a compact control-D1 browse/search index, requires authentication before protected queries, uses keyset pagination + FTS search, exposes provenance on detail, and keeps public/recommendation authority unchanged. P1 remains non-terminal until PR CI and the post-deploy authenticated owner live canary pass.

P1 machine preparation is now complete through PR #309 at `5222da210d40721886f6ab0fc093e14c727f296b`. Validate public V0 #1092 passed the terminal-verifier PR, production Pages deployment #360 passed, and post-merge Validate public V0 #1093 passed deterministic validation, Chromium/browser acceptance and production smoke. The remaining terminal gate is one authenticated owner live verification using the sanitized built-in verifier; no corpus/recommendation authority is widened by these machine passes.

## P1 live repair note — D1 parameter ceiling

The first authenticated owner index-build attempt stopped safely at **0 / 19,268**. The original P1 batch contract allowed 40 recipes, but the summary upsert binds 13 values per recipe, which produces 520 bound parameters in one D1 statement. Current D1 allows 100 bound parameters/query. The repair caps the batch at 7 recipes (91 summary parameters), preserves keyset/restart semantics and the <=8 D1/request target, and improves live failure-reason visibility. The owner should not retry until the repaired production deployment is green.
