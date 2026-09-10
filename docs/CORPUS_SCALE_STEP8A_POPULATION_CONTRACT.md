# Corpus Scale Step 8A — Population Contract and Shard Design

Status: **COMPLETE / PASS / MERGED GREEN / REPOSITORY ONLY**

Date: **2026-09-10**

Terminal: `STEP_8A_POPULATION_CONTRACT_PASS`

Merge: PR **#113**, main `68e5f159000a8b7c1677155f49ef9cde7a0801b9`.

Validation evidence:

- first PR validation `34499533385`: repository/static/deterministic PASS + browser PASS;
- evidence-record rerun `34499738756`: repository/static/deterministic PASS + browser PASS;
- post-merge main validation `34499905915`: repository/static/deterministic PASS + browser PASS + production runtime smoke PASS;
- Pages deployment `34499905387`: PASS.

Governing roadmap: `docs/CORPUS_SCALE_STEP8_MEASURED_POPULATION_ROADMAP.md`.

Machine contract: `scripts/corpus-scale-step8a-core.mjs`.

Tests: `tests/corpus-scale-step8a.test.js`.

Detailed validation record: `docs/CORPUS_SCALE_STEP8A_VALIDATION.md`.

## What Step 8A proved

Step 8A freezes the population, shard-routing, resumability, rollback, evidence and authority contract **before any recipe-body D1 shard exists**. It does not create a second corpus representation: it composes the existing Step 3 immutable portable-corpus model, Step 6 incremental-validation/stable-ordinal contract, Step 7A measured D1 topology/budgets/router, and the production-shaped Step 7E bounded write evidence.

The implementation proves in repository tests that:

- the future recipe-body topology remains capped by the measured Step 7A maximum of eight shards and one reserved database slot;
- the first live multi-shard canary is exactly **two** recipe-body shards, the minimum topology capable of proving cross-shard routing;
- deterministic routing reuses `recipeDatabaseShardForId(recipeId, shardCount)` rather than introducing a Step-8-specific router;
- the existing reviewed corpus deterministically exercises both two-shard canary targets;
- population manifests are deterministic and contain bounded descriptors/integrity data rather than full ingredient/instruction bodies;
- source cohorts require explicit immutable source version, evidence and protected-population authority while public-runtime authority remains false;
- pre-8B planned write batches remain at the already-proven Step 7E ceiling of <=10 recipe rows plus one metadata/receipt statement (<=11 planned statements);
- verified batches are idempotent skips on resume; partial exact state is resumable; conflicting or mismatched receipts fail closed;
- rollback is an integrity-checked active-version pointer switch to the immutable parent, never destructive deletion;
- all Step 7A storage/request/provider budgets are imported from the existing measured code rather than copied into a drifting second model.

## Inherited boundaries

The Step 7A/Step 8 budgets remain controlling, including 170,000 required capacity, 250,000 synthetic stress, <=3.5 GiB modeled total D1 footprint at 170k, <=350 MiB per database, <=1 MiB compact index artifact row, <=256 hydrated candidates, <=16 D1 subqueries per protected request, maximum 10 database slots with one reserved, and zero full-corpus scans.

The Step 7D live CPU tail remains a later live-scale measurement requirement. Step 8A does not turn a synthetic CPU proxy into production-scale proof.

## Terminal evidence envelope

The merged work satisfied the required no-authority-leak envelope:

```json
{
  "repositoryOnly": true,
  "createdRecipeBodyShards": 0,
  "publicRuntimeChanged": false,
  "billingAuthorizationObserved": false,
  "paidPlanActivated": false,
  "r2Activated": false,
  "zeroTrustAccessActivated": false,
  "youtubeStateModified": false,
  "nutritionBLaneModified": false,
  "knowledgeCoreWritePerformed": false
}
```

No corpus population was performed. No recipe-body D1 shard was created.

## Authority earned by PASS

Step 8A PASS earns only:

1. **Step 8B machine prerequisite preparation**. The later human/account boundary remains mandatory before creating even the first recipe-body D1 shard; and
2. **Step 8C scalable source-qualification evidence work**. Documentary evidence may proceed autonomously, but protected population/public activation is not implied.

Step 8D remains blocked until both 8B and 8C produce their required PASS inputs.

Step 8A does not authorize public recommendation admission, public runtime activation, Workers Paid, R2, Zero Trust/Access, any billing/overage authorization, source nutrition/dietary/allergen/absolute-quantity authority, Knowledge Core writes, YT-CUL changes, or interference with the Nutrition B-lane.
