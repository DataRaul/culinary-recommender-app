# Corpus Scale Step 8B — Minimum Multi-Shard Protected Canary Machine Prerequisites

Status: **IMPLEMENTATION BUILT / VALIDATION PENDING / NO LIVE SHARD CREATED**

Date: **2026-09-10**

Entry authority:

`STEP_8A_POPULATION_CONTRACT_PASS`

Machine contract:

`scripts/corpus-scale-step8b-core.mjs`

Validation:

`tests/corpus-scale-step8b.test.js`

## Purpose

Step 8B must prove the smallest real topology that can exercise cross-shard behavior without provisioning the full modeled eight-shard layout. Step 8A established that the minimum useful live topology is exactly two recipe-body shards. This machine-preparation step freezes the two database/binding identities, schema, bounded canary data shape, read budget, idempotency/recovery semantics, rollback requirement and terminal evidence contract before any Cloudflare account action occurs.

This is deliberately **not** a deployment step. No `functions/api/step8b/*` route is added here, no Pages binding is added, no D1 database is created and no recipe body is written to a new shard.

## Reuse instead of reinvention

The contract composes existing proven project machinery:

- Step 7A deterministic `recipeDatabaseShardForId()` routing and <=16 protected-request D1-subquery project budget;
- Step 7C/7D application-owned authentication, exact allowlist and revocation boundary;
- Step 7E bounded D1 batch + exact post-write verification pattern;
- Step 8A immutable corpus versions, exact batch receipts, resumability, conflict fail-closed behavior and pointer-switch rollback.

No second router, auth model, source-admission model or public runtime is introduced.

## Exact minimum shard identities

The first live canary, if the later human/account gate passes, uses exactly:

| shard | D1 database name | Pages binding |
|---:|---|---|
| 0 | `culinary-recipes-00` | `CULINARY_RECIPE_SHARD_00_DB` |
| 1 | `culinary-recipes-01` | `CULINARY_RECIPE_SHARD_01_DB` |

The remaining six modeled recipe-body shard slots are **not** provisioned by Step 8B. One overall D1 slot remains reserved under the Step 7A architecture.

## Canary data

The repository fixture uses only the already-reviewed 84-recipe runtime corpus as an oracle. It selects the first deterministic Step-8A batch routed to each of the two shards, with at most 10 recipe descriptors per shard.

This means the first live proof, once authorized, can demonstrate two-shard behavior using already-reviewed content rather than introducing a new source-rights decision.

The machine canary manifest stores only recipe IDs, ordinals, byte counts, source-cohort IDs and SHA-256 fingerprints. It does not place recipe instructions or ingredient bodies into a public/static artifact.

## Frozen D1 schema

Each recipe-body shard uses the same schema:

`corpus_recipe_bodies`

- immutable `corpus_version`;
- canonical `ordinal`;
- stable `recipe_id`;
- protected `body_json`;
- exact `body_bytes`;
- exact `body_sha256`;
- `source_cohort_id`;
- primary key `(corpus_version, ordinal)`;
- unique key `(corpus_version, recipe_id)`.

Exact population receipts use:

`corpus_population_receipts`

- `corpus_version`;
- `batch_id`;
- `expected_sha256`;
- `row_count`;
- verified flag;
- primary key `(corpus_version, batch_id)`.

This schema preserves version identity and supports exact replay classification without destructive overwrite.

## Bounded write shape

Before live Step-8B evidence earns anything larger, the canary keeps the already-proven Step-7E/8A ceiling:

- <=10 recipe rows per shard write batch;
- one exact receipt statement;
- <=11 planned statements per batch;
- exact post-write verification required;
- a verified batch is an idempotent skip;
- an exact verified-absent batch may be retried;
- indeterminate or conflicting state fails closed and may not be blindly retried.

## Cross-shard read proof

The minimum useful protected read fixture selects one known recipe from each shard.

Expected query shape:

1. one current account/allowlist state read in the existing control database;
2. one bounded exact recipe read from shard 0;
3. one bounded exact recipe read from shard 1.

That is three D1 subqueries for the direct cross-shard canary, below the project maximum of 16. The canary permits zero full-corpus scans.

Later recommendation-shaped retrieval may touch more bounded shards, but Step 8B does not pretend this direct canary proves all 170k query shapes. Those remain governed by Step 7A synthetic evidence and later Step 8D live measurements.

## Partial-failure recovery proof

The live canary must deliberately establish recovery semantics rather than infer them from a successful happy path.

A valid recovery sequence must distinguish:

- `VERIFIED`: exact batch exists with matching fingerprint/row count -> skip idempotently;
- `ABSENT_VERIFIED`: verification proves the batch did not commit -> safe to retry;
- unknown, mismatched or indeterminate state -> fail closed until a verification read resolves it.

The second shard may be resumed without rewriting an already-verified first shard.

## Rollback proof

Rollback remains the Step-8A rule:

`ACTIVE_VERSION_POINTER_SWITCH_ONLY`

The live canary must not use destructive recipe-row deletion as its rollback mechanism. The previous immutable version remains available and integrity-verified before an active-version pointer switch is accepted.

## Security and quota proof

Before Step 8B can pass live:

- unauthenticated requests must be denied before any recipe-shard read;
- authenticated allowed-user cross-shard reads must succeed;
- revocation/session rules remain the existing app-owned auth boundary;
- a simulated Free-limit condition must return fail-closed before protected shard reads;
- actual D1/Worker metadata must be captured without recipe bodies or user secrets;
- zero full-corpus scans must be observed;
- observed D1 subqueries must remain <=16 per protected canary request.

## Human/account gate

Machine preparation alone does **not** authorize either D1 database.

Only after this repository work is merged green may the owner perform the account-side Step-8B gate. For each of the two exact D1 databases, the provisioning screen/result must be classified as one of:

- `FREE_NO_BILLING_AUTHORIZATION_CONFIRMED` -> may continue;
- `BILLING_OR_OVERAGE_AUTHORIZATION_PRESENT` -> stop and reject the resource/path;
- `AMBIGUOUS` -> stop and inspect before acceptance.

Do not activate Workers Paid, R2 or Zero Trust/Access. Do not accept a `$0` checkout that authorizes later usage charges.

The human action should be deferred until all machine prerequisites are merged and Step 8C documentary work has been pushed as far as possible, so the owner is interrupted only when the account action is the actual remaining constraint.

## Live terminal evidence contract

`validateStep8BLiveEvidenceEnvelope()` accepts `STEP_8B_MINIMUM_MULTI_SHARD_CANARY_PASS` only when all of the following are established:

- human/account no-billing gate passed;
- exactly two recipe-body D1 shards exist and both bindings are configured;
- authenticated cross-shard read passed;
- unauthenticated denial occurred before shard access;
- Free-limit simulation failed closed before shard access;
- exact idempotent write replay passed;
- partial-failure recovery passed;
- immutable-version rollback passed;
- zero full-corpus scans;
- observed D1 subqueries remained within the <=16 project budget;
- no billing authorization, paid plan, R2 or Zero Trust/Access activation;
- no normal public recommendation-runtime change;
- no YT-CUL mutation;
- no Nutrition B mutation;
- no Knowledge Core write.

## What Step 8B PASS would earn

Step 8B PASS supplies only the **live topology/runtime input** required by Step 8D.

Step 8D remains blocked until Step 8C independently supplies a rights-clean source cohort. Step 8B does not admit new recipes, activate public recommendations, import source nutrition authority, authorize automatic dietary/allergen inference, activate paid infrastructure, or alter Knowledge Core/YouTube/Nutrition lanes.
