# Corpus Scale Step 8 — Measured Population and Activation Roadmap

Status: **ROADMAP DEFINED / STEP 8A AUTHORIZED / NO LIVE SCALE GATE CROSSED**

Decision date: **2026-09-10**

Entry terminal:

`STEP_7E_PROTECTED_500_SOURCE_PILOT_CANARY_PASS`

This document defines the post-Step-7E continuation of the existing large-corpus programme. It does **not** create a Step 7F. The earlier Corpus Scale reference roadmap already reserved Step 8 for the measured large-corpus readiness/population gate; this document reconciles that intent against the later accepted 170k no-billing-authorization architecture, the completed Step 7A–7E evidence, and the current Culinary App / Knowledge Core boundaries.

The machine-readable companion is `config/corpus_scale_step8_roadmap.json` and is enforced by `tests/corpus-scale-step8-roadmap.test.js`.

## 1. Why Step 8 is warranted

Step 7E proved a production-shaped **protected 500-record real-source canary**, not large-corpus activation.

Proven through Step 7E:

- 170,000 required / 250,000 synthetic stress capacity shape passed the repository model under the no-billing architecture;
- one real D1 Free control database and the current same-origin authenticated Pages Functions path work without billing authorization;
- protected 84-record and protected 500-record canaries fail closed before protected reads when authentication or the simulated Free-limit path fails;
- ForkRecipe at the pinned source commit passed its bounded rights/data-quality pilot audit;
- 500 deterministic ForkRecipe source packets were stored and independently verified in the existing control database;
- the 500 records remained non-public, non-recommendation-eligible and non-authoritative for nutrition/dietary/allergen/absolute-quantity semantics.

Still unproven:

- real recipe-body D1 shard creation and cross-shard routing;
- live multi-shard reads/writes, partial-failure recovery and rollback;
- versioned large-corpus population/rebuild mechanics;
- rights-clean source availability at meaningful larger scale;
- recommendation eligibility for stored external records;
- public-runtime behavior with any newly admitted large-corpus subset.

Therefore a direct jump from Step 7E to eight D1 shards, mass population, or public activation would be unsupported.

## 2. Design principle

Step 8 separates four questions that must not be conflated:

1. **Can the system store and retrieve protected corpus data safely at larger scale?**
2. **Do we possess rights-clean source cohorts worth populating?**
3. **Which stored records are actually safe and complete enough to recommend?**
4. **Should any earned subset affect normal public/runtime recommendations?**

A PASS in one dimension grants no automatic authority in another.

## 3. Inherited architecture and budgets

Step 8 does not invent new capacity assumptions. It inherits the Step 7A architecture contract unless later measured evidence forces a redesign:

- required capacity: **170,000**;
- synthetic stress target: **250,000**;
- maximum planned recipe-body shards: **8**;
- control/auth/index databases: **1**;
- reserved database slots: **1**;
- no create-all-shards-up-front behavior;
- <=3.5 GiB modeled total D1 footprint at 170k;
- <=350 MiB per database at 170k;
- <=1 MiB compact index artifact row;
- <=256 hydrated candidates per protected request;
- <=16 D1 subqueries per protected request;
- zero full-corpus scans;
- no automatic paid upgrade path.

The Step 7D owner-visible CPU tail is retained as a headroom warning: the small canary had no exceeded-CPU-limit errors, but p99 CPU was above the nominal Workers Free 10 ms limit. Step 8 must continue measuring actual live CPU/error behavior rather than treating the synthetic CPU proxy as final proof.

## 4. Step 8A — Population Contract and Shard Design

Status: **AUTHORIZED NOW / REPOSITORY ONLY**

Purpose: freeze the population/runtime contract before any new D1 database exists.

Required definition:

- versioned corpus manifest with immutable source/version provenance;
- deterministic recipe-id -> shard routing;
- explicit schema/version compatibility;
- idempotent/resumable write batches;
- exact post-write integrity evidence;
- partial-failure classification;
- rollback/rebuild semantics;
- bounded query/read/write/CPU/storage evidence schema;
- no public static protected corpus/index artifacts;
- no automatic admission or public activation;
- exact terminal outcomes and authority earned by PASS.

Terminal outcomes:

- `STEP_8A_POPULATION_CONTRACT_PASS`
- `STEP_8A_REDESIGN_REQUIRED`

PASS earns only machine preparation for 8B and source-evidence work for 8C.

## 5. Step 8B — Minimum Multi-Shard Protected Canary

Status: **BLOCKED PENDING 8A PASS + HUMAN ACCOUNT ACTION**

The minimum useful live topology is **two recipe-body shards**. One shard cannot prove routing across shards; creating all eight before the first real multi-shard measurement would spend account/infrastructure complexity without additional information.

Required proof:

- exactly two recipe-body D1 shards created for the canary;
- deterministic routing distributes canary records across both;
- authenticated bounded retrieval across one and multiple shards;
- no full scans;
- bounded D1 subqueries/rows read;
- idempotent writes;
- resumable behavior after a deliberately bounded partial interruption;
- integrity verification after resume;
- rollback/rebuild path;
- unauthorized and revoked sessions fail before protected reads;
- Free-limit path fails closed;
- live Worker/D1 metrics recorded;
- no public recommendation eligibility or public runtime change.

Terminal outcomes:

- `STEP_8B_MINIMUM_MULTI_SHARD_CANARY_PASS`
- `STEP_8B_RUNTIME_OR_COST_REDESIGN_REQUIRED`

No recipe-body shard should be created until the human/account step is actually reached after all machine prerequisites are complete.

## 6. Step 8C — Scalable Source Qualification

Status: **BLOCKED PENDING 8A PASS / MAY RUN IN PARALLEL WITH 8B**

Purpose: identify source cohorts worth scaling without using raw record count as a target.

Current source state remains:

- existing curated corpus + Wikibooks: established;
- Open Recipe Archive Spanish: `HOLD_RIGHTS_AMBIGUOUS`, zero admitted;
- Open Recipe Archive complete corpus: candidate, but not ready while transformation/content-rights provenance remains unresolved;
- ForkRecipe: Step 7E protected pilot PASS only; zero public recommendation admission;
- UniTools: candidate not yet audited;
- RecipeDB: conditional source-cohort salvage lane only.

Step 8C may autonomously gather and classify documentary source/rights evidence. It must preserve `ADMIT / HOLD / REJECT` semantics and must not contact rights holders merely because a source is interesting. Human/legal escalation is only warranted when a materially valuable ambiguity cannot be resolved from documentary evidence.

Terminal outcomes:

- `STEP_8C_RIGHTS_CLEAN_SOURCE_COHORT_AVAILABLE`
- `STEP_8C_NO_SCALABLE_RIGHTS_CLEAN_COHORT_YET`
- `STEP_8C_HUMAN_RIGHTS_DECISION_REQUIRED`

## 7. Step 8D — Protected Corpus Population Ladder

Status: **BLOCKED PENDING 8B PASS + 8C RIGHTS-CLEAN INPUT**

Purpose: populate rights-clean cohorts only on the topology actually earned by 8B.

Measurements are required at each material size transition that is actually reached. Existing synthetic ladder points remain useful checkpoints (`1k -> 10k -> 50k -> 100k -> 170k`, with 250k synthetic stress), but the programme must not fabricate records or weaken rights review merely to hit a checkpoint.

For every material expansion record:

- admitted source/version cohort and exact count;
- total/per-shard storage;
- D1 rows read/written and subqueries for representative protected retrievals;
- Worker CPU/error evidence;
- bounded candidate hydration and zero-full-scan proof;
- build/resume/rollback behavior;
- incremental validation cost;
- duplicate/family/variant observations;
- explicit recommendation/public-runtime authority still false unless separately earned.

Terminal outcomes:

- `STEP_8D_PROTECTED_POPULATION_PASS`
- `STEP_8D_SCALE_OR_COST_REDESIGN_REQUIRED`
- `STEP_8D_SOURCE_INPUT_EXHAUSTED`

PASS may feed 8E and the continued protected scale loop in 8G.

## 8. Step 8E — Recommendation Eligibility Gate

Status: **BLOCKED PENDING AN 8D ELIGIBLE COHORT**

Storage is not recommendation admission.

A bounded subset may move through the existing app control plane only when it can satisfy the app-owned semantics required for recommendation behavior, including:

- canonical ingredient identity;
- exact/defensible quantity semantics where required;
- duplicate/family/variant handling without deleting meaningful variants or provenance;
- hard dietary/allergen/permanent-exclusion metadata under existing fail-closed rules;
- provenance and attribution obligations;
- deterministic ranking/planner compatibility.

Nutrition remains independent. Imported source nutrition never becomes `NutritionSource` authority by implication, and Step 8E must not compete with or overwrite the active Nutrition B-lane.

Terminal outcomes:

- `STEP_8E_RECOMMENDATION_ELIGIBLE_SUBSET_PASS`
- `STEP_8E_STORED_ONLY_NO_ELIGIBLE_SUBSET`

## 9. Step 8F — Public Runtime Activation Decision

Status: **BLOCKED PENDING 8E + EXPLICIT HUMAN PUBLIC-RUNTIME GATE**

Before any newly earned external subset affects normal recommendations:

- run V1/V2 golden parity where applicable;
- run hard-filter and safety regression;
- run deterministic ranking/planner regression;
- run profile/browser acceptance;
- verify attribution/licensing display obligations;
- freeze exact approved subset/version;
- require explicit human public-runtime authorization.

Terminal outcomes:

- `STEP_8F_PUBLIC_RUNTIME_ACTIVATION_APPROVED`
- `STEP_8F_PUBLIC_RUNTIME_HOLD`
- `STEP_8F_BEHAVIOR_REGRESSION_REDESIGN_REQUIRED`

An approval applies only to the exact reviewed subset/version.

## 10. Step 8G — Continued Protected Scale Expansion Loop

Status: **BLOCKED PENDING 8D PASS**

Important consultant/project-coach correction: **8G does not depend on 8F.**

Protected large-corpus learning should not be blocked merely because the owner has not chosen to activate new public recommendation behavior. After 8D passes, additional rights-clean cohorts may continue through the protected population loop under the same cost/security/source gates.

Continue only while marginal coverage/quality value justifies ingestion and review complexity. Stop when:

- source rights or provenance become insufficient;
- marginal culinary/geographic/variant coverage is low;
- storage/read/write/CPU behavior approaches unsafe Free-plan headroom;
- additional shards would cross the measured architecture or reserved-slot boundary;
- a new paid/billing authorization would be required;
- another genuine human/security/legal gate is reached.

Terminal outcomes per iteration:

- `STEP_8G_CONTINUE_WITH_NEXT_EARNED_COHORT`
- `STEP_8G_STOP_MARGINAL_VALUE_LOW`
- `STEP_8G_CAPACITY_OR_COST_GATE_REACHED`
- `STEP_8G_170K_REQUIRED_CAPACITY_POPULATION_REACHED`

Reaching 170k is a capacity/population state, not automatic public recommendation authority.

## 11. Dependency graph

```text
STEP 7E PASS
    |
    v
   8A
  /  \
 v    v
8B    8C
 \    /
  v  v
   8D --------> 8G protected scale loop
    |
    v
   8E
    |
    v
   8F explicit public-runtime decision
```

8B and 8C may proceed in parallel only after 8A passes. 8D requires both. 8G requires 8D, not 8F.

## 12. Authority matrix

| Gate | Autonomous repository/evidence work | Human/security/cost gate | Public behavior authority |
|---|---|---|---|
| 8A | Yes | No | None |
| 8B | Machine preparation yes | **Yes before D1 shard creation/live account action** | None |
| 8C | Yes for documentary evidence | Only unresolved material rights/legal ambiguity | None |
| 8D | Yes within earned topology/source/cost limits | Stop on new cost/security/account boundary | None |
| 8E | Yes for bounded app admission review | Existing app gates remain controlling | None |
| 8F | Tests/preparation yes | **Explicit human public-runtime decision** | Exact approved subset only |
| 8G | Yes within already earned protected scale boundaries | Stop on cost/rights/security/account boundary | None |

## 13. Boundaries unchanged

Step 8 does not authorize:

- Workers Paid;
- R2;
- Zero Trust / Access;
- any checkout or setup authorizing overage/payment charges;
- creating all eight future recipe-body shards up front;
- public ForkRecipe or other external-source recommendation activation by default;
- source nutrition authority;
- source-prose dietary/allergen inference;
- source-ratio promotion to absolute quantities;
- source media activation;
- runtime fetches from ForkRecipe or another source merely because the source is admitted;
- Knowledge Core writes from this App lane;
- private Knowledge Core browser/runtime dependency;
- modification of YT-CUL-5D / YT-CUL-6 state;
- modification or duplication of the active Nutrition B-lane.

## 14. Consultant review

**APPROVE.** The sequence buys information in the correct order: contract first, minimum real multi-shard proof second, scalable rights-clean source discovery in parallel, then measured protected population. It avoids paying complexity up front by creating eight shards before two-shard routing is proven and avoids making raw corpus count a success metric.

The consultant correction is to keep public activation off the critical path for protected scale learning; that is why 8G depends on 8D rather than 8F.

## 15. Project Coach review

**APPROVE.** Every gate has explicit entry dependencies, terminal outcomes and bounded earned authority. A PASS cannot silently authorize the next infrastructure/security/public-runtime action. Machine work is front-loaded; human action is deferred to the first actual account/security/legal/public boundary.

The machine-readable contract and test suite exist specifically to prevent later roadmap drift from reintroducing Step 7F, paid infrastructure, create-all-shards behavior, public activation coupling or cross-lane authority leakage.

## 16. Immediate next action

Execute **Step 8A repository-only work** against this contract. No D1 recipe-body shard creation is part of Step 8A.
