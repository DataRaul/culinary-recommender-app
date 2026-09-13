# Corpus Scale Step 8B — Live Multi-Shard Canary PASS

Status: **COMPLETE PASS / TERMINAL EARNED**

Date: **2026-09-14**

Terminal:

`STEP_8B_MINIMUM_MULTI_SHARD_CANARY_PASS`

## Scope

This closeout records the final live evidence for the minimum two-shard protected canary. It does not authorize Step 8F public-runtime activation, additional recipe-body shards, paid infrastructure, Nutrition-lane mutation, YT-CUL mutation, or Knowledge Core writes.

## Frozen topology

Exactly two recipe-body D1 shards were used:

- `CULINARY_RECIPE_SHARD_00_DB` -> `culinary-recipes-00`
- `CULINARY_RECIPE_SHARD_01_DB` -> `culinary-recipes-01`

No third shard is authorized by this terminal.

## Authenticated production canary evidence

A fresh production run of `/step8b-canary.html` completed the entire bounded sequence:

- session: PASS
- status: PASS
- bindings: PASS
- Free-limit fail-closed: PASS
- initialize: PASS
- bounded partial interruption: PASS
- resume/recovery: PASS
- idempotent replay: PASS
- authenticated cross-shard read: PASS
- pointer activation boundary: PASS
- pointer-only rollback: PASS
- final evidence envelope: PASS

Observed summary:

```json
{
  "pass": true,
  "terminalCandidate": "STEP_8B_MINIMUM_MULTI_SHARD_CANARY_PASS_PENDING_EXTERNAL_UNAUTH_PROBE",
  "boundShardBindings": 2,
  "freeLimitFailClosedBeforeShardRead": true,
  "partialFailureRecoveryPass": true,
  "idempotentWritePass": true,
  "authenticatedCrossShardReadPass": true,
  "rollbackPass": true,
  "fullCorpusScans": 0,
  "maxObservedD1Subqueries": 10,
  "normalPublicRecommendationRuntimeChanged": false,
  "completed": [
    "session",
    "status",
    "bindings",
    "free-limit",
    "initialize",
    "partial",
    "resume",
    "replay",
    "read",
    "activate",
    "rollback",
    "evidence"
  ]
}
```

The observed D1 subquery maximum of **10** is within the frozen protected-request budget of **16**. No full-corpus scan occurred and normal public recommendation behavior remained unchanged.

## External unauthenticated production probe

A separate browser context with no session requested:

`/api/step8b/canary`

Observed production response:

```json
{
  "ok": false,
  "step": "8B",
  "error": "UNAUTHORIZED",
  "reason": "NO_SESSION",
  "protectedDataReturned": false,
  "shardQueries": 0
}
```

This proves the live production route denies unauthenticated access before either recipe-body shard is queried. The deterministic route test in `tests/step8b-live-canary.test.js` independently freezes the same zero-shard-access invariant.

## Free-limit evidence

The authenticated production endpoint returned HTTP 503 with `STEP8B_FREE_LIMIT_FAIL_CLOSED`, `protectedDataReturned: false`, and `metrics.shardQueries: 0`. The prior UI false negative was repaired by PR #139; the underlying runtime envelope was correct.

## Authority earned

Step 8B now earns only:

`8D_PROTECTED_POPULATION_ON_EARNED_SHARD_TOPOLOGY`

Step 8D may populate the already-qualified pinned UniTools 501-record source into the protected two-shard topology, subject to the inherited no-billing, bounded-query, source-authority and public-runtime firewalls.

This terminal does **not** authorize:

- public recommendation activation;
- source nutrition/diet/allergen/scaling promotion to canonical authority;
- a third recipe-body shard;
- Workers Paid, R2, Zero Trust/Access, checkout, payment method or overage authorization;
- destructive rollback deletes;
- full-corpus scans;
- writes to Knowledge Core, Nutrition B, or YT-CUL state.
