# Corpus Scale Step 8 — Measured Population and Activation Roadmap

Status: **STEP 8A PASS / STEP 8B PASS / STEP 8C PASS / STEP 8D PASS / STEP 8E PASS / STEP 8F HUMAN DECISION READY / STEP 8G READY**

Decision date: **2026-09-10**  
Current-state reconciliation: **2026-09-14**

Entry terminal:

`STEP_7E_PROTECTED_500_SOURCE_PILOT_CANARY_PASS`

This document defines the post-Step-7E continuation of the existing large-corpus programme. It does **not** create a Step 7F. The machine-readable companion is `config/corpus_scale_step8_roadmap.json` and is enforced by the Step 8 test suite.

## 1. Current gate state

- **8A — COMPLETE PASS:** population contract and deterministic shard design frozen.
- **8B — COMPLETE PASS:** `STEP_8B_MINIMUM_MULTI_SHARD_CANARY_PASS` earned on the exact two-shard protected topology.
- **8C — COMPLETE PASS:** pinned UniTools 501-record cohort qualified as rights-clean protected-population input only.
- **8D — COMPLETE PASS:** 501 pinned UniTools recipes populated across the exact two-shard protected topology.
- **8E — COMPLETE PASS:** exact one-record recommendation-eligible subset earned; 500 UniTools records remain stored-only.
- **8F — READY / HUMAN GATE:** all non-activating machine decision-input checks pass; explicit public-runtime authorization is now required.
- **8G — READY:** protected scale continuation is independently unlocked by 8D PASS and does not depend on 8F.

The Step 8B production closeout is frozen in `docs/CORPUS_SCALE_STEP8B_LIVE_CANARY_PASS.md`.

## 2. Design principle

Step 8 separates four questions that must not be conflated:

1. Can the system store and retrieve protected corpus data safely at larger scale?
2. Do we possess rights-clean source cohorts worth populating?
3. Which stored records are actually safe and complete enough to recommend?
4. Should any earned subset affect normal public/runtime recommendations?

A PASS in one dimension grants no automatic authority in another.

## 3. Inherited architecture and budgets

Step 8 inherits the Step 7A architecture contract unless later measured evidence forces a redesign:

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

The Step 7D owner-visible CPU tail remains a headroom warning. Step 8 must continue measuring live CPU/error behavior rather than treating the synthetic CPU proxy as final proof.

## 4. Step 8A — Population Contract and Shard Design

Status: **COMPLETE PASS**

Terminal:

`STEP_8A_POPULATION_CONTRACT_PASS`

Step 8A froze:

- versioned corpus manifest with immutable source/version provenance;
- deterministic recipe-id -> shard routing;
- explicit schema/version compatibility;
- idempotent/resumable write batches;
- exact post-write integrity evidence;
- partial-failure classification;
- rollback/rebuild semantics;
- bounded query/read/write/CPU/storage evidence schema;
- no public static protected corpus/index artifacts;
- no automatic admission or public activation.

## 5. Step 8B — Minimum Multi-Shard Protected Canary

Status: **COMPLETE PASS / LIVE PRODUCTION**

Terminal:

`STEP_8B_MINIMUM_MULTI_SHARD_CANARY_PASS`

The exact earned live topology remains:

- `CULINARY_RECIPE_SHARD_00_DB` -> `culinary-recipes-00`
- `CULINARY_RECIPE_SHARD_01_DB` -> `culinary-recipes-01`

Production evidence proved:

- both exact D1 bindings visible to the Pages Function runtime;
- authenticated bounded retrieval across both shards;
- no full-corpus scans;
- maximum observed protected-request D1 subqueries **10 <= 16**;
- idempotent writes;
- bounded partial-failure recovery and resume;
- rollback by pointer without destructive delete;
- Free-limit failure returns HTTP 503 before recipe-shard access;
- external unauthenticated access returns HTTP 401 with `protectedDataReturned: false` and `shardQueries: 0`;
- normal public recommendation runtime unchanged.

The UI false-negative caused by JavaScript treating numeric zero as falsy was repaired in PR #139; that bug did not invalidate the underlying fail-closed runtime result.

Step 8B authorizes **no third recipe-body shard** and no public recommendation activation.

## 6. Step 8C — Scalable Source Qualification

Status: **COMPLETE PASS**

Terminal:

`STEP_8C_RIGHTS_CLEAN_SOURCE_COHORT_AVAILABLE`

Qualified Step 8D input:

- source: **UniTools World Recipes Dataset**;
- version: **1.1.0**;
- immutable commit: `1d09e9548d957dd0375301146a86dddf5e269c1b`;
- pinned data blob: `a81e96415f09eac7fc0aec94a4da8d9f6d66d9ed`;
- records: **501**;
- countries: **127**;
- licence: **CC-BY-SA-4.0**;
- authority: **PROTECTED_POPULATION_INPUT_ONLY**.

Open Recipe Archive remains held where rights are ambiguous. RecipeDB remains a salvage-only lane. ForkRecipe remains a protected-pilot source with zero automatic public recommendation admission.

## 7. Step 8D — Protected Corpus Population Ladder

Status: **COMPLETE PASS / LIVE PRODUCTION**

Terminal: `STEP_8D_PROTECTED_POPULATION_PASS`

The pinned UniTools cohort completed as 501 recipes / 51 verified batches / two shards, with zero full scans and maximum observed D1 subqueries 15 <= 16.

Purpose: populate rights-clean cohorts only on the topology actually earned by 8B.

The immediate first population is the pinned UniTools **501-record** cohort. It is a protected-population measurement, not a recommendation-admission event.

For every material expansion, record:

- admitted source/version cohort and exact count;
- deterministic per-shard distribution;
- total/per-shard storage;
- D1 rows read/written and subqueries for representative protected retrievals;
- Worker CPU/error evidence where the live platform exposes it;
- bounded candidate hydration and zero-full-scan proof;
- build/resume/replay/rollback behavior;
- incremental validation cost;
- duplicate/family/variant observations;
- explicit recommendation/public-runtime authority still false unless separately earned.

Existing synthetic ladder points remain useful checkpoints (`1k -> 10k -> 50k -> 100k -> 170k`, with 250k synthetic stress), but records must not be fabricated merely to hit a checkpoint.

Terminal outcomes:

- `STEP_8D_PROTECTED_POPULATION_PASS`
- `STEP_8D_SCALE_OR_COST_REDESIGN_REQUIRED`
- `STEP_8D_SOURCE_INPUT_EXHAUSTED`

PASS may feed 8E and 8G.

## 8. Step 8E — Recommendation Eligibility Gate

Status: **COMPLETE PASS / EXACT ONE-RECORD ELIGIBLE SUBSET**

Storage is not recommendation admission.

Terminal: `STEP_8E_RECOMMENDATION_ELIGIBLE_SUBSET_PASS`. The 501-record readiness census earned exactly one candidate, `unitools_tortilla_espanola` (`tortilla-espanola`), in dish family `spanish_potato_omelet`; the other 500 records remain stored-only. Frozen evidence is `data/generated/step8e/admission-evidence.json` and the exact subset is `data/generated/step8e/eligible-subset.json`.

A bounded subset may move through existing app semantics only when it satisfies the required canonical ingredient identity, defensible quantity semantics, duplicate/family/variant treatment, hard dietary/allergen/permanent-exclusion metadata, provenance/attribution obligations and deterministic ranking/planner compatibility.

Nutrition remains independent. Imported source nutrition never becomes `NutritionSource` authority by implication, and Step 8E must not compete with or overwrite the active Nutrition B-lane.

Terminal outcomes:

- `STEP_8E_RECOMMENDATION_ELIGIBLE_SUBSET_PASS`
- `STEP_8E_STORED_ONLY_NO_ELIGIBLE_SUBSET`

## 9. Step 8F — Public Runtime Activation Decision

Status: **READY / EXPLICIT HUMAN PUBLIC-RUNTIME GATE**

All non-activating machine checks are complete for the exact one-record Step 8E subset. Current public runtime remains 84 recipes and unchanged. `runtimeActivationAuthorized` is false.

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

Status: **READY AFTER STEP 8D PASS**

8G does **not** depend on 8F. Protected large-corpus learning should not be blocked merely because the owner has not activated new public recommendation behavior.

Continue only while marginal coverage/quality value justifies ingestion and review complexity. Stop when source rights/provenance are insufficient, marginal coverage is low, Free-plan headroom becomes unsafe, additional shards cross the measured architecture/reserved-slot boundary, a paid/billing authorization would be required, or another genuine human/security/legal gate is reached.

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
   8A PASS
  /       \
 v         v
8B PASS   8C PASS
 \         /
  \       /
   v     v
    8D PASS ------> 8G protected scale loop
      |
      v
     8E PASS
      |
      v
     8F explicit human public-runtime decision
```

## 12. Authority matrix

| Gate | Autonomous repository/evidence work | Human/security/cost gate | Public behavior authority |
|---|---|---|---|
| 8A | Complete | No | None |
| 8B | Complete | Completed exact no-billing account/binding actions | None |
| 8C | Complete | No unresolved material rights gate for pinned cohort | None |
| 8D | **Yes now**, within earned topology/source/cost limits | Stop on new cost/security/account boundary | None |
| 8E | Yes for bounded app admission review | Existing app gates remain controlling | None |
| 8F | Tests/preparation yes | **Explicit human public-runtime decision** | Exact approved subset only |
| 8G | Yes after 8D PASS within protected-scale boundaries | Stop on cost/rights/security/account boundary | None |

## 13. Boundaries unchanged

Step 8 does not authorize:

- Workers Paid;
- R2;
- Zero Trust / Access;
- checkout, payment method or overage authorization;
- creating all eight future recipe-body shards up front;
- public external-source recommendation activation by default;
- source nutrition authority;
- source-prose dietary/allergen inference;
- source-ratio promotion to absolute quantities;
- source media activation;
- private-source runtime fetches merely because a source is admitted;
- Knowledge Core writes from this App lane;
- private Knowledge Core browser/runtime dependency;
- YT-CUL state mutation;
- Nutrition B-lane modification or duplication.

## 14. Current next action

Proceed with **Step 8D protected population of the exact pinned UniTools 501-record cohort** on the already-earned two-shard topology.

Machine work should first define and test the Step 8D source transformation, deterministic population manifest, bounded batch/resume/idempotency behavior, evidence envelope and protected live surface. No public recommendation behavior may change. No additional shard or paid infrastructure is authorized.
