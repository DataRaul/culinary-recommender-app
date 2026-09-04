# Corpus Scale / 100k Readiness — Step 3 Portable Object Layout

Status: **IMPLEMENTATION BUILT / FULL REPOSITORY VALIDATION PENDING**

Step 1 proved that the accepted bounded-index architecture can satisfy the frozen 1k→100k synthetic performance gates. Step 2 added a provider-neutral `RecipeSource` V2 compatibility layer and proved V1/V2 behavioral parity while leaving V1 as the public default.

Step 3 now defines the canonical portable artefact shape that later storage adapters may publish to Cloudflare R2 or another object store. This is a build-time/data-layout milestone only: it does not provision Cloudflare, switch the public runtime to V2, ingest a new real corpus, introduce D1, or authorize paid infrastructure.

## Core invariants

1. **Provider-neutral canonical artefacts.** Canonical output is ordinary UTF-8 JSON under a versioned object root. No Cloudflare/R2/Worker/D1 identifier is embedded in corpus truth.
2. **Immutable version roots.** A corpus version is emitted under `corpus/vNNNN/`. Later population work creates a new version rather than silently mutating an admitted historical version.
3. **Full detail is separate from lightweight metadata.** Recipe instructions, quantities and full provenance stay in detail objects. Metadata shards contain only retrieval/display summary fields plus integrity references to detail objects.
4. **Pre-built deterministic indexes.** The exact retrieval dimensions already exercised by Step 1 are emitted as deterministic index objects whose values are ordered recipe ordinals.
5. **Bounded manifest.** The top-level manifest lists metadata shards and index objects but does not contain every full recipe body.
6. **Integrity is explicit.** Metadata/index descriptors contain byte counts, gzip-size measurements and SHA-256 hashes. Every metadata row contains the detail object's SHA-256 and byte count. The manifest contains deterministic corpus ID and record fingerprints.
7. **Streaming detail emission.** Detail JSON is yielded one record at a time before corpus-wide index finalization. The artefact builder does not create a second in-memory copy of all serialized recipe bodies. This directly responds to Step 1's narrow 100k heap margin.
8. **Recommendation behavior is unchanged.** Step 3 changes storage artefacts only. It does not alter hard filters, nutrition authority, evaluator/scorer/planner policy, or public recommendation output.

## Canonical shape

Illustrative `v0001` output:

```text
corpus/v0001/manifest.json
corpus/v0001/metadata/shard-00000.json
corpus/v0001/metadata/shard-00001.json
...
corpus/v0001/indexes/ingredient/tomato.json
corpus/v0001/indexes/cuisine/spanish.json
corpus/v0001/indexes/diet/vegetarian.json
corpus/v0001/indexes/time/under-30.json
...
corpus/v0001/recipes/000000.json
corpus/v0001/recipes/000001.json
...
```

The JSON files are canonical. Gzip is a transport/storage representation and is measured without making compressed binary files the source of truth.

## Detail objects

A detail object is the canonical recipe record serialized without semantic transformation. Ordinal order preserves the supplied `RecipeSource` order. For the current reviewed corpus this means reconstruction from `000000...` upward must exactly reproduce all 84 V1 records in their existing order.

Detail paths use a deterministic fixed ordinal width. The manifest records the width and path template so a bounded candidate ordinal can be mapped to a detail object without provider-specific logic.

## Metadata shards

Default shard size: **500 rows**.

Each metadata row contains:

- ordinal;
- stable recipe ID;
- detail path;
- detail SHA-256 and byte count;
- canonical title;
- cuisine;
- meal types;
- dietary tags;
- total time when known;
- difficulty when known;
- main protein when present;
- canonical ingredient IDs;
- recommendation/admission state when present;
- compact rights/provenance pointers such as licence, source URL and source revision ID when present.

It deliberately excludes full ingredient objects, quantities and instructions.

## Index objects

Step 3 reuses `indexKeysForRecipe()` from the Step 1 benchmark contract so the benchmark and production-shaped portable artefacts cannot silently drift onto different retrieval semantics.

Current dimensions include:

- ingredient;
- cuisine;
- diet;
- meal type;
- protein;
- time buckets;
- difficulty/skill upper bounds.

Each index object stores a sorted ordinal posting list. One object per key is the initial portable shape. Step 4 must measure real intersections/transfer/request behavior and may introduce posting sharding only if the evidence earns it.

## Manifest

The manifest records:

- contract version;
- corpus version;
- recipe count;
- deterministic ID and record fingerprints;
- detail-object count, path template and total bytes;
- metadata shard descriptors;
- index-object descriptors;
- explicit invariants including provider neutrality and `publicRuntimeSwitchAuthorized: false`.

It contains no timestamp so identical inputs/options produce byte-identical canonical output.

## Validation contract

`tests/corpus-scale-step3.test.js` verifies:

- byte-for-byte deterministic builds;
- exact reconstruction of the current 84-record reviewed corpus;
- lightweight metadata/detail separation;
- metadata sharding behavior;
- exact continuity with Step 1 index keys and postings;
- provider-neutral manifest content;
- SHA-256/byte-count integrity across metadata, indexes and details;
- fail-closed detection of detail tampering;
- rejection of invalid versions, invalid records and duplicate recipe IDs.

The validator also reconstructs expected index postings from the detail objects, so a self-consistent but semantically wrong index file does not pass merely because its hash matches its descriptor.

## Build command

```bash
npm run build:corpus-scale-step3
```

Default output is disposable local build material under:

```text
.tmp/corpus-scale-step3/
```

Optional controls:

```bash
node scripts/build-corpus-scale-step3.mjs \
  --out=/desired/output \
  --version=v0001 \
  --metadata-shard-size=500
```

Generated artefacts are not automatically admitted as new runtime data and are not automatically uploaded anywhere.

## Memory implication from Step 1

The 100k Step 1 run passed but observed peak heap was close to the frozen limit. Step 3 therefore intentionally streams serialized detail objects to the consumer/writer rather than retaining all serialized bodies in a second array. It retains only bounded metadata rows plus compact posting lists/descriptors needed to finalize indexes and the manifest.

This does not claim final 100k memory readiness for every future ingestion implementation. Step 6 must still implement incremental changed-record/shard validation, and Step 4 must still measure indexed retrieval at scale.

## Hard boundaries preserved

Step 3 does **not** authorize:

- Cloudflare account/project/domain provisioning;
- Cloudflare Access configuration;
- Worker deployment;
- R2 upload;
- D1;
- real mass recipe ingestion;
- Open Recipe Archive admission before its rights audit;
- paid services;
- source recipe nutrition as authoritative `NutritionSource` evidence;
- a public runtime switch from current V1;
- a private Knowledge Core browser/runtime dependency.

## Next executable action after Step 3 passes

**Step 4 — Indexed retrieval scale proof.**

Use the Step 3 portable artefacts plus the Step 1 synthetic generator to prove deterministic pre-built index intersections, bounded candidate retrieval, detail fetching and transfer/request behavior across 1k / 10k / 50k / 100k. R2-style object retrieval remains the baseline. D1 may be prototyped only if the measured R2/pre-built-index path fails a required gate or becomes unreasonably complex.
