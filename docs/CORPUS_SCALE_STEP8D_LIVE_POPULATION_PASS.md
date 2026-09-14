# Corpus Scale Step 8D — Live Protected Population PASS

Date: 2026-09-14

Terminal: `STEP_8D_PROTECTED_POPULATION_PASS`

## Result

The authenticated production Step 8D runner completed the exact pinned UniTools 501-record protected population across the two already-earned D1 recipe-body shards.

Observed terminal evidence:

- `pass: true`;
- exact recipes: **501**;
- verified batches: **51**;
- shards: **2**;
- resumable interruption: **PASS**;
- idempotent replay: **PASS**;
- exact post-write 501 closure: **PASS**;
- authenticated cross-shard read: **PASS**;
- pointer-only rollback: **PASS**;
- full-corpus scans: **0**;
- maximum observed D1 subqueries: **15**, within the frozen protected-request limit of **16**;
- normal public recommendation runtime changed: **false**;
- third shard used: **false**;
- billing expansion: **false**.

The runner also reported the frozen population-plan SHA-256 `18ea4d1bfaf424709de22a7badd680fb82c887fb70e54af5e190c33371dbad12` and pinned-source blob check PASS.

## External denial evidence

The runner incorporated the already-earned external unauthenticated probe (`34834330389`). Independent post-readiness production probing also passed with HTTP 401 before shard access, `protectedDataReturned: false` and `shardQueries: 0`.

## Authority earned

Step 8D is terminal PASS. This earns only:

- Step 8E recommendation-eligibility review on the stored protected cohort;
- Step 8G continued protected scale learning.

It does **not** authorize normal public recommendation activation. Step 8F remains an explicit human gate. It also does not authorize a third shard, billing expansion, Nutrition mutation, YT-CUL mutation, Knowledge Core writes, or promotion of source nutrition/diet/allergen/scaling metadata to canonical authority.

Canonical structured evidence: `data/generated/corpus-scale-step8d-live-pass.json`.
