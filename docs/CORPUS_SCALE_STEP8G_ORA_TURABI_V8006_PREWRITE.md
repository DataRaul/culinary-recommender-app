# Corpus Scale Step 8G — Turabi Efendi v8006 prewrite PASS

Date: 2026-09-16  
Status: **PASS / LIVE PROTECTED POPULATION IMPLEMENTATION EARNED / NO LIVE WRITE AUTHORITY**  
Terminal candidate: `STEP_8G_ORA_TURABI_EFENDI_V8006_PREWRITE_PASS_LIVE_PROTECTED_POPULATION_IMPLEMENTATION_EARNED`

## Scope

This gate converts the previously passed, bounded 442-record Turabi Efendi 1864 measurement into an exact no-write v8006 protected-population plan over the active v8005 protected corpus.

The source remains pinned to Open Recipe Archive commit `ae3bd2c009a8899dfe63b9166fa98ae3fa8041a8`, collection `ottoman-turkish`, source work *A Turkish Cookery Book* by Turabi Efendi (1864), public-domain. Historical labels remain provenance only and do not grant cultural-authenticity authority.

## Deterministic evidence

- Workflow run: `35066583080`
- Artifact: `10434820998`
- Artifact digest: `sha256:ead63fabbff3ed6d28be0b66488bbb0c4e6f077206faad4b56c6dd1ecf45b97c`
- Canonical evidence: `data/generated/step8g/ora-turabi-v8006-prewrite-evidence.json`
- Canonical validation: `data/generated/step8g/ora-turabi-v8006-prewrite-validation.json`

## Parent identity

The parent is frozen as live protected `v8005` / `2,464` recipes using all three matching sources of identity: the merged v8005 prewrite evidence, the authenticated v8005 live PASS, and `v8005-runtime-descriptor.mjs`.

- Parent fingerprint: `6a5c0a427b25e8b0592f48f7b293a6cd6f39fa06b12d141ce60bf284d92a036c`
- Parent layer manifest: `c283c4dc608848a5838331030760544a1b94b6c3d98155fbce8e4829deededba`
- Parent population plan: `6ad9d7aaa7ee219df2f5fdf2d2ebf48a572f1a1376f99bf8d4899128149e66ae`

## v8006 plan

- Child recipes: `442`
- Planned composed protected recipes: `2,906`
- Recipe-body shards: `2`
- Body batches: `45`
- Maximum rows per batch: `10`
- v8006 manifest: `3ac76c7f8f107eaf811167e8245582e30204715d7b45a83eade26ae418f765db`
- v8006 population plan: `b6dd9020fb6221a72c245feb2dd94d9b5ebe8bb758bd25ee508c9031fe5b59a0`
- Added layer bytes: `1,430,326`
- Planned layered physical body bytes: `16,345,185`
- Shard 0 planned total: `1,459` rows / `8,245,187` bytes
- Shard 1 planned total: `1,447` rows / `8,099,998` bytes

Both shard capacity and total project capacity gates pass.

## Request and D1 envelope

The prewrite independently re-proves the inherited free-limit request envelope instead of assuming headroom.

- Maximum body write request: `16,090` bytes
- Maximum route write request: `2,625` bytes
- Maximum allowed write request: `262,144` bytes
- Fresh body write: `15` D1 subqueries
- Fresh route write: **`16 / 16` D1 subqueries**
- 11-row route batches would require `17` and therefore fail closed
- Six-layer hydration canary: `4` D1 subqueries
- Bounded hydration worst case: `10` D1 subqueries
- Full-corpus scans: `0`
- Assumed D1 headroom: **none**

## Authority boundary

This PASS earns only repository implementation of the exact v8006 protected-population path. It performs and authorizes **no production D1 write** by itself.

It does not authorize public runtime expansion, recommendation admission, a third shard, D1-budget expansion, billing expansion, Nutrition/YT-CUL/Knowledge Core mutation, or cultural-authenticity authority. Step 8F remains exactly one activated external recipe, `unitools_tortilla_espanola`, and the public runtime remains 85 recipes.

A later live v8006 production population remains an owner-authenticated boundary after implementation is merged, deployed and verified.
