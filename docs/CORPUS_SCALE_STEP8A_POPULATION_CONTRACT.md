# Corpus Scale Step 8A — Population Contract and Shard Design

Status: **IMPLEMENTATION BUILT / VALIDATION PENDING / REPOSITORY ONLY**

Date: **2026-09-10**

Entry authority:

`STEP_7E_PROTECTED_500_SOURCE_PILOT_CANARY_PASS`

Governing roadmap:

`docs/CORPUS_SCALE_STEP8_MEASURED_POPULATION_ROADMAP.md`

Machine contract:

`scripts/corpus-scale-step8a-core.mjs`

Validation:

`tests/corpus-scale-step8a.test.js`

## 1. Purpose

Step 8A freezes the population, shard-routing, resumability, rollback, evidence and authority contract **before any recipe-body D1 shard exists**.

It does not create another corpus representation. It composes already-proven project contracts:

- Step 3: immutable versioned portable corpus identity, manifest/integrity and detail/metadata separation;
- Step 6: stable ordinals, semantic incremental validation, changed-shard/index validation, bounded regression and full-validation fallback;
- Step 7A: measured 170k / 250k D1 topology, budgets and deterministic recipe-id shard router;
- Step 7D: authenticated/fail-closed protected runtime and live Workers Free measurement;
- Step 7E: production-shaped real-source packets and the proven 10-record / 11-statement bounded write shape.

The objective is to remove ambiguity about how later live population work must behave. It does not itself populate anything.

## 2. No speculative topology expansion

The Step 7A capacity proof modeled up to eight recipe-body databases. That is a **measured ceiling for the candidate architecture**, not a requirement to create all eight immediately.

Step 8A therefore freezes:

- maximum planned recipe-body shards: **8**;
- first live multi-shard canary: **2 shards**;
- one control/auth/index database remains part of the architecture;
- one database slot remains reserved;
- all-eight up-front provisioning: **false**.

Two shards are the smallest topology that can demonstrate actual deterministic cross-shard routing. One shard cannot test that property; more than two adds account/runtime complexity before the first live multi-shard observation.

## 3. Population manifest

`buildStep8APopulationPlan()` produces a provider-neutral population manifest containing only bounded descriptors and integrity data.

Required manifest properties include:

- contract version;
- immutable `vNNNN` corpus version;
- optional immutable parent corpus version;
- exact recipe count;
- exact admitted/protected source cohorts and source versions;
- deterministic recipe-body shard count and routing contract;
- per-shard row/body-byte descriptors and deterministic fingerprints;
- inherited Step 7A project budgets;
- bounded write contract;
- explicit non-authorizations.

The manifest does **not** contain recipe instructions or ingredient bodies. Full recipe bodies remain separate payloads under the existing portable-corpus model.

## 4. Source cohort requirements

Every population input must name an explicit source cohort with:

- stable cohort ID;
- source name;
- immutable source version/snapshot;
- current admission/protected-population state;
- evidence references;
- `protectedPopulationAllowed: true`;
- `publicRuntimeActivationAuthorized: false`.

A source cohort cannot gain public-runtime authority merely by appearing in a population plan.

Step 8A does not resolve future source-rights questions. Step 8C owns scalable source qualification after 8A passes.

## 5. Stable recipe identity and deterministic routing

Each population entry contains only the information needed to prove exact placement and integrity:

- stable canonical ordinal;
- recipe ID;
- exact body SHA-256;
- body byte count;
- source cohort ID;
- derived shard number.

Ordinals must be unique and contiguous from zero for a frozen population plan. Existing canonical ordinal stability remains governed by Step 6; an ordinary incremental version may not silently renumber existing recipes.

Shard placement reuses the Step 7A router:

`recipeDatabaseShardForId(recipeId, shardCount)`

No second Step-8-specific hash/router is introduced.

## 6. Bounded write contract

Before Step 8B live evidence exists, Step 8A does not enlarge the write unit beyond the production-shaped form already exercised in Step 7E.

Frozen pre-8B ceiling:

- maximum recipe rows per planned write batch: **10**;
- one metadata/receipt statement per batch;
- maximum planned statements: **11**;
- exact deterministic batch fingerprint required;
- exact post-write receipt required before a batch is considered complete.

This is deliberately conservative. Step 8B may earn a different measured live shape only if evidence warrants it.

## 7. Resumability and idempotency

`classifyStep8APopulationProgress()` treats population as a set of exact deterministic batches.

Possible states:

- `READY` — no verified batch receipts exist yet;
- `RESUMABLE_PARTIAL` — some exact batches are verified, remaining exact batches are pending;
- `COMPLETE_VERIFIED` — every planned batch has an exact verified receipt;
- `CONFLICT_FAIL_CLOSED` — a receipt is unknown, unverified, conflicting, has a fingerprint mismatch or has a row-count mismatch.

A verified exact batch becomes an **idempotent skip**. It is not rewritten merely because a later invocation resumes the population process.

Any conflicting evidence stops further writes instead of attempting repair by overwrite.

## 8. Rollback contract

Rollback is version selection, not destructive deletion.

`buildStep8ARollbackDirective()` permits only:

`ACTIVE_VERSION_POINTER_SWITCH_ONLY`

from a child corpus version to its exact immutable parent version after the target manifest integrity is verified.

Rollback explicitly forbids:

- destructive recipe-body deletion as the rollback mechanism;
- public-runtime authority change;
- billing authorization.

A future garbage-collection/deletion policy, if ever needed, is a separate lifecycle decision and is not hidden inside rollback.

## 9. Inherited scale budgets

Step 8A imports the Step 7A values directly from code rather than copying an independently editable set of assumptions.

Current inherited boundaries include:

- required capacity: **170,000**;
- synthetic stress: **250,000**;
- maximum modeled recipe-body shards: **8**;
- <=3.5 GiB modeled total D1 footprint at 170k;
- <=350 MiB per database at 170k;
- <=1 MiB compact index artifact row;
- <=256 hydrated candidates;
- <=16 D1 subqueries per protected request;
- 10 database slots maximum with one reserved;
- <=2 MiB provider row/BLOB ceiling;
- zero full-corpus scans remains controlling through the governing architecture.

The Step 7D live CPU tail remains a later live-scale measurement requirement. Step 8A cannot convert a synthetic CPU proxy into a production claim.

## 10. Step 8A terminal evidence envelope

A valid Step 8A terminal PASS must explicitly record:

- repository-only work: true;
- recipe-body D1 shards created: **0**;
- public runtime changed: false;
- billing authorization observed: false;
- paid plan activated: false;
- R2 activated: false;
- Zero Trust/Access activated: false;
- YT-CUL state modified: false;
- Nutrition B-lane modified: false;
- Knowledge Core write performed: false.

`validateStep8AEvidenceEnvelope()` rejects authority leakage in any of those dimensions.

## 11. Test contract

`tests/corpus-scale-step8a.test.js` must prove at minimum:

1. the Step 8A shard ceiling/reserved slot are inherited from Step 7A;
2. the initial live topology is exactly two shards;
3. the existing reviewed corpus deterministically exercises both canary shards;
4. population plans are deterministic independent of descriptor input order;
5. manifests contain no recipe instruction/ingredient bodies;
6. pre-8B batches remain <=10 rows and <=11 planned statements;
7. partial exact receipts are resumable and completed batches become idempotent skips;
8. conflicting receipts fail closed;
9. complete exact receipts reach `COMPLETE_VERIFIED` without a second write pass;
10. rollback is an immutable parent-version pointer switch, not destructive deletion;
11. live shard/public/paid/YT/Nutrition/KC mutations invalidate Step 8A terminal evidence;
12. one-shard, >8-shard, oversized pre-canary batch, missing source-version and source-public-authority inputs fail closed;
13. source nutrition, dietary/allergen, ratio and automatic-admission/public-runtime authority remain false.

Normal repository static/deterministic and browser validation remains required before merge.

## 12. PASS condition

Step 8A reaches:

`STEP_8A_POPULATION_CONTRACT_PASS`

only when:

- the machine contract and tests above pass;
- normal repository validation passes;
- browser acceptance passes;
- no live infrastructure/state mutation occurred;
- the implementation remains compatible with the existing Step 3/6/7A contracts rather than replacing them.

Failure or material incompatibility returns:

`STEP_8A_REDESIGN_REQUIRED`

## 13. Authority earned by PASS

Step 8A PASS earns only:

1. **Step 8B machine prerequisite preparation**, with a later human/account gate before creating even the first recipe-body D1 shard; and
2. **Step 8C source-qualification evidence work**, with no protected population/public activation implied.

It does not earn Step 8D, public recommendation admission, public runtime activation, paid infrastructure, source nutrition/dietary/allergen/quantity authority, Knowledge Core writes, YT-CUL changes or Nutrition B-lane changes.
