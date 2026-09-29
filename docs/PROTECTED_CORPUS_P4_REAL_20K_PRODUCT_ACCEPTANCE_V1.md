# Protected Corpus P4 — Real-20k Regression and Product Acceptance V1

Date: **2026-09-29**

P4 makes the exact protected corpus **v8018 / 19,268 recipes** the primary product-scale regression corpus while preserving the existing fail-closed recommendation, rights, security, D1-cost and Barbecue boundaries.

## Entry state

P4 may start only after:

- P1 owner live browse/search canary: `PROTECTED_CORPUS_P1_LIVE_OWNER_CANARY_PASS`;
- P2 live alignment: `PROTECTED_CORPUS_P2_LIVE_ALIGNMENT_PASS`;
- C4 exact-source 19,268-record failure matrix: `CULINARY_BRAIN_C4_FAILURE_MATRIX_PASS__112_IDENTITY_READY_REPAIR_COHORT_FROZEN`;
- bounded P3 activation: `CULINARY_BRAIN_P3_TAPIOCA_BOUNDED_ACTIVATION_PASS__P4_READY`;
- current public runtime: **86 recipes**, including exactly one newly activated protected-origin candidate.

## Machine baseline

The P4 PR gate must reconstruct the exact pinned v8018 source universe, rebuild the normalization/nutrition/C2/C4 chain, and prove that the committed C4 19,268-record summary remains reproducible.

It then combines that exact-source reconstruction with the already-earned P1/P2 live evidence and current P3 runtime regression. The machine gate covers:

- exact 19,268 protected identities;
- 19,268 search-index rows and 19,268 FTS rows from terminal live evidence;
- exactly three structural partials;
- cross-shard detail hydration already proven on both shards;
- D1 query-budget evidence at or below eight observed subqueries/request and zero full-corpus scans;
- explicit unresolved metadata and fail-closed abstention;
- one bounded P3 recommendation/planner candidate with no broader automatic admission;
- source/provenance preservation;
- retained 170k required / 250k stress synthetic headroom as regression-only evidence;
- normal PR browser regression over the current application.

Successful machine acceptance emits:

`PROTECTED_CORPUS_P4_MACHINE_BASELINE_PASS__OWNER_LIVE_ACCEPTANCE_REQUIRED`

This is deliberately **not** the final P4 product terminal.

## Owner live product acceptance

The remaining terminal gate is a read-only authenticated owner product probe. It must measure the live product surface without protected D1 writes or corpus mutation:

1. search latency and result stability;
2. pagination and filter behavior;
3. cross-shard hydration;
4. D1 subquery counts;
5. transferred bytes and memory;
6. malformed/unknown metadata handling;
7. recommendation candidate generation and abstention;
8. planner behavior over the eligible subset;
9. mobile/browser UX.

The live probe must preserve all current authority firewalls. It may not admit another protected recipe, infer dietary/allergen authority, rewrite protected bodies, add a third shard, use paid infrastructure, write Knowledge Core, or mutate the Barbecue lane.

## Failure classification

Every P4 failure is assigned to exactly one primary class:

- runtime/retrieval;
- metadata/normalization;
- hard safety/eligibility;
- recommendation/planner compatibility;
- performance/cost;
- rights/provenance;
- browser/UX.

Repair is bounded to the smallest causal layer, followed by rerunning the affected test and the real-v8018 P4 regression gate.
