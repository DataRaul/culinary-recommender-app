# Corpus Scale Step 8D — Live Protected Population Runbook

Status: **IMPLEMENTED / MACHINE PREFLIGHT PASS / PRODUCTION EVIDENCE PENDING**

Date: **2026-09-14**

Route: `/api/step8d/populate`

Same-origin runner: `/step8d-populate.html`

## Earned input

The live runner consumes only the already-frozen Step 8D artifacts:

- exact pinned UniTools 1.1.0 source, 501 records;
- protected packet schema `CORPUS_SCALE_STEP8D_PROTECTED_PACKET_V1`;
- manifest schema `CORPUS_SCALE_STEP8D_MANIFEST_V1`;
- corpus version `v8001`;
- population plan SHA-256 `18ea4d1bfaf424709de22a7badd680fb82c887fb70e54af5e190c33371dbad12`;
- 51 frozen write batches;
- shard 0: 257 rows;
- shard 1: 244 rows;
- maximum 10 rows per write batch.

No source or authority scope is expanded by the live runner.

## Live write state machine

Each frozen batch follows this fail-closed state machine:

1. Authenticate before any recipe-body shard access.
2. Validate the submitted batch against the frozen batch ID, shard, row count, entry descriptors and batch SHA-256.
3. Validate every body JSON SHA-256 and UTF-8 byte count against its frozen descriptor.
4. Validate the protected-packet authority firewall.
5. Read the exact receipt.
6. If the receipt is already `verified=1`, re-read the exact batch rows and return an idempotent skip only if they still match.
7. If a matching receipt is `verified=0`, treat it as a recoverable unknown-commit checkpoint: verify exact rows and promote the receipt only if they match.
8. If no receipt exists, execute at most 10 recipe inserts plus one receipt insert with `verified=0` in one D1 batch.
9. Re-read the exact batch rows by recipe ID.
10. Promote the receipt to `verified=1` only after exact row verification succeeds.

A ten-row fresh write uses at most 14 shard/control D1 subqueries plus the one auth lookup, remaining within the frozen `<=16` protected-request budget.

A receipt fingerprint/count conflict or a receipt/body mismatch fails closed. No repair path rewrites conflicting protected data automatically.

## Resumability

Population progress reads only receipt metadata from the two earned shards. It does not scan recipe bodies.

A population interruption therefore resumes as follows:

- `verified=1`: exact rows are rechecked on replay and the batch is skipped;
- `verified=0`: exact rows are checked and the receipt is promoted if the previous batch actually committed;
- missing receipt: batch is written normally;
- conflicting receipt or rows: stop fail-closed.

The same population action may therefore be safely retried after browser/network interruption without restarting the corpus or deleting prior protected rows.

## One-session production sequence

`/step8d-populate.html` performs the terminal human-verification batch in one continuous same-origin browser session:

1. require a current Culinary session;
2. verify the live contract and both existing D1 bindings;
3. prove Free-limit fail-closed before shard access;
4. fetch the immutable pinned UniTools GitHub blob directly;
5. verify the exact Git blob SHA in-browser;
6. build all 501 protected packets and compare every body hash/byte count to the frozen plan;
7. initialize the existing recipe/receipt schemas and the independent protected pointer;
8. read any existing receipt checkpoint;
9. when starting empty, write one batch and re-read progress to prove a persisted partial checkpoint;
10. resume all remaining missing/unverified batches;
11. prove receipt closure is exactly 51 verified batches / 501 rows;
12. replay the first batch and require `VERIFIED_IDEMPOTENT_SKIP`;
13. activate only the independent protected `v8001` pointer;
14. pointer-roll back to the Step 8B protected baseline without deleting rows;
15. read one frozen canary record from each shard;
16. collect final bounded evidence.

The authenticated runner intentionally returns the intermediate terminal candidate:

`STEP_8D_PROTECTED_POPULATION_PASS_PENDING_EXTERNAL_UNAUTH_PROBE`

The final terminal is not earned until the separate no-session production probe proves HTTP 401, `protectedDataReturned: false`, and zero recipe-shard queries.

## Machine preflight

The networked CI preflight fetches the same immutable source and verifies all 51 production payloads before deployment.

Current evidence:

- source Git blob SHA: exact PASS;
- browser CORS: `Access-Control-Allow-Origin: *` PASS;
- protected packets: 501 PASS;
- frozen body hashes: all PASS;
- frozen batch fingerprints accepted by live validator: all 51 PASS;
- max rows per batch: 10;
- largest protected batch body bytes: 57,803;
- largest complete write request: 65,383 bytes;
- route request cap: 262,144 bytes;
- D1 writes in preflight: 0.

## Protected pointer

Step 8D uses `corpus_protected_active_version` with scope `step8d-protected-recipe-corpus`.

This pointer is deliberately separate from normal public recommendation authority. Activating `v8001` is permitted only after all 51 receipts are exact and verified. The runner immediately exercises pointer-only rollback to `step8b-canary-v1`, retaining the protected `v8001` rows.

No destructive delete is part of Step 8D rollback.

## Explicit non-authorizations

This implementation does not authorize:

- normal public recommendation activation;
- Step 8E admission;
- Step 8F public behavior changes;
- source nutrition/diet/allergen/scaling promotion to application authority;
- a third recipe-body shard;
- Workers Paid, R2, Zero Trust/Access, payment methods, checkout or overage;
- Nutrition B, YT-CUL or Knowledge Core writes;
- full recipe-body corpus scans;
- destructive rollback deletion.

## Terminal evidence required

Step 8D may earn `STEP_8D_PROTECTED_POPULATION_PASS` only when all of the following are simultaneously evidenced in production:

- exact 501 / 51-batch receipt closure;
- persisted partial checkpoint + successful resume;
- idempotent replay;
- authenticated cross-shard protected read;
- each protected request remains within `<=16` D1 subqueries;
- zero full-corpus scans;
- unauthenticated denial before any recipe-shard query;
- pointer-only rollback;
- normal public recommendation runtime unchanged;
- no third shard;
- no billing expansion.
