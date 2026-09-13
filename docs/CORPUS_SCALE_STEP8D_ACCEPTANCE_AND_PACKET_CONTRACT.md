# Corpus Scale Step 8D — Acceptance, Manifest and Protected Packet Contract

Status: **ACTIVE IMPLEMENTATION / PRE-WRITE CONTRACT FROZEN**

Date: **2026-09-14**

Machine contract: `config/corpus_scale_step8d_contract.json`

Implementation: `scripts/corpus-scale-step8d-core.mjs`

Tests: `tests/corpus-scale-step8d.test.js`

## Scope

Step 8D may store the exact pinned UniTools 1.1.0 cohort of 501 recipes on the already-earned two-shard protected topology. It does not grant recommendation eligibility, public-runtime activation, source nutrition/diet/allergen/scaling authority, a third shard, paid infrastructure, or Knowledge Core writes.

No live D1 population write is permitted until the complete pre-write acceptance set below is green.

## Frozen source identity

The only Step 8D input is:

- source cohort: `unitools-world-recipes-v1_1_0`
- repository: `farcrak/unitools-recipes`
- commit: `1d09e9548d957dd0375301146a86dddf5e269c1b`
- path: `unitools-recipes-v1.json`
- Git blob SHA: `a81e96415f09eac7fc0aec94a4da8d9f6d66d9ed`
- dataset version: `1.1.0`
- exact records: `501`
- licence: `CC-BY-SA-4.0`
- attribution: `UniTools — theunitools.com`

The pinned file is ingestion truth. Source metadata values are not rewritten to match README prose. In particular, `scaling: "damped"` is preserved when present even though older README prose documents a different enum set.

## Protected packet schema

Schema version:

`CORPUS_SCALE_STEP8D_PROTECTED_PACKET_V1`

Each source recipe becomes exactly one deterministic protected packet with these top-level objects:

- `identity`: stable ID `unitools:<exact pinned slug>`, pinned source ordinal and slug;
- `provenance`: exact source cohort, repository, commit, path, blob SHA, dataset version, source recipe URL, licence and attribution;
- `recipe`: stored recipe content needed for later protected review;
- `sourceMetadata`: source diet labels, source nutrition and per-ingredient scaling values;
- `authority`: explicit fail-closed authority flags.

Media is excluded. `photo`, `image`, `images`, `media` and `thumbnail` fields are forbidden anywhere in a protected packet.

### Authority firewall

Every packet must freeze:

- `storageState = PROTECTED_STORED_ONLY`
- `publicRecommendationEligible = false`
- `automaticAppAdmissionAuthorized = false`
- `nutritionAuthority = SOURCE_METADATA_ONLY_UNTRUSTED`
- `dietaryAllergenAuthority = SOURCE_METADATA_ONLY_UNTRUSTED`
- `scalingAuthority = SOURCE_METADATA_ONLY_UNTRUSTED`
- `knowledgeCoreWriteAuthorized = false`

Source metadata is preserved for later review only. Storage is not application authority.

## Manifest schema

Schema version:

`CORPUS_SCALE_STEP8D_MANIFEST_V1`

Corpus version:

`v8001`

The manifest is descriptor-only. It must not contain full recipe bodies.

For each of exactly 501 entries it records only:

- ordinal;
- stable recipe ID;
- body SHA-256;
- UTF-8 body bytes;
- source cohort ID;
- deterministic shard number.

The manifest reuses the Step 8A router and receipt model:

- router: `recipeDatabaseShardForId/FNV1A32_MOD_SHARD_COUNT`;
- exact shard count: `2`;
- both shards must be non-empty;
- maximum rows per write batch: `10`;
- idempotency: `batchId_plus_expectedSha256`;
- exact receipt verification required;
- rollback: `ACTIVE_VERSION_POINTER_SWITCH_ONLY`;
- destructive rollback deletion forbidden.

Full recipe bodies exist only in the population packets handed to bounded write batches; they are not embedded in the manifest.

## Pre-write acceptance criteria

All of the following must pass before live D1 writes become allowed:

1. exact pinned source identity matches the Step 8C source contract;
2. dataset and metadata both report exactly 501 recipes;
3. all 501 packets validate against the protected packet schema;
4. all stable IDs are unique and source-slug based;
5. identical pinned input produces byte-identical packet hashes;
6. identical pinned input produces the same manifest fingerprint and population-plan fingerprint;
7. routing uses exactly the two already-earned recipe-body shards;
8. both earned shards receive at least one record;
9. every planned write batch contains at most 10 rows;
10. media is absent from every protected packet;
11. nutrition, diet/allergen and scaling remain source metadata only;
12. no packet or contract authorizes public recommendation eligibility or Knowledge Core writes;
13. normal public recommendation runtime remains statically unchanged;
14. repository validation is green.

Passing this set earns only:

`STEP8D_PREWRITE_ACCEPTANCE_PASS`

It permits controlled Step 8D population. It is not the Step 8D terminal.

## Live-population acceptance criteria

Step 8D terminal PASS requires all pre-write criteria plus live evidence that:

1. receipt-based replay is idempotent;
2. an interrupted population resumes from verified receipts instead of restarting;
3. exact post-write protected state contains 501 records across exactly two shards;
4. protected cross-shard reads return exact expected hashes/bytes;
5. protected reads stay within `<=16` D1 subqueries;
6. full-corpus scans remain `0`;
7. unauthenticated access fails before any recipe-body shard query;
8. rollback is pointer-only and performs no destructive delete;
9. normal public recommendation runtime remains unchanged;
10. no third shard is used or created;
11. no paid/billing expansion is authorized or required.

Only then may Step 8D earn:

`STEP_8D_PROTECTED_POPULATION_PASS`

If any criterion fails, population must stop or remain resumable inside the existing receipt model. A failing criterion cannot be waived by documentation alone.

## Explicit non-authorizations

This contract does not authorize:

- Step 8E recommendation eligibility;
- Step 8F public activation;
- source claims becoming canonical Culinary App or Knowledge Core conclusions;
- Nutrition B mutation;
- YT-CUL mutation;
- Knowledge Core writes;
- a third recipe-body shard;
- Workers Paid, R2, Zero Trust/Access, payment method, checkout, overage or other paid infrastructure;
- destructive deletion rollback;
- full-corpus query scans.
