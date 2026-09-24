# Corpus Scale / 100k Readiness — Step 4 Indexed Retrieval Scale Proof

Status: **CURRENT 85-RUNTIME RECONCILIATION BUILT / FULL 1K→100K MEASUREMENT AND REPOSITORY VALIDATION PENDING**

Step 1 V2 proved the hardened synthetic bounded-index hypothesis against the current 85-record public seed while preserving the historical 84-record oracle. Step 2 proved current-runtime `RecipeSource` V1/V2 behavioral parity. Step 3 then validated a provider-neutral portable corpus layout for the current 85-record public runtime, again preserving the historical oracle.

Step 4 now tests the actual Step-3-shaped retrieval path at 1k / 10k / 50k / 100k without provisioning Cloudflare or introducing D1.

## Decision this gate must answer

Can the accepted object-store architecture remain:

```text
one browser request
→ Worker/gateway
→ read a few deterministic pre-built index objects
→ intersect sorted ordinal postings
→ cap candidates at 256
→ read only bounded detail objects
→ existing deterministic evaluator/scorer
```

while staying inside the frozen local transfer, latency, memory and bounded-read budgets?

If yes, **D1 is not earned** and Step 5 may proceed.

If no, the failure earns evidence review only. It does not automatically authorize D1. The failed dimension must first be classified because SQL cannot repair every possible problem (for example, ranking cost, excessive detail-object reads or unrelated build memory).

## Current-runtime baseline and historical oracle

The full Step 4 runner is now frozen against the current 85-record public runtime established after Step 3 merge `72d792ab0bd17ae5ad418e1b92b27ac2770f8843`.

Composition:

- the immutable historical 84-record `ALL_RECIPES` oracle remains preserved for compatibility checks;
- the current runtime adds the one explicitly approved Step 8F UniTools record;
- 85 total `PUBLIC_RUNTIME_RECIPES` records seed the full 1k → 100k retrieval proof.

The runner fails closed if the current public runtime count drifts. The historical 84-record oracle remains separately exercised and is not rewritten merely because the active public runtime gained one explicitly admitted record.

## Scale model

The scale proof reuses `syntheticRecipeFromGolden()` and the same `indexKeysForRecipe()` dimensions from Step 1.

For each target size it builds only:

- deterministic sorted ordinal posting lists;
- Step-3-shaped JSON index objects;
- the fixed ordinal/path rules needed to retrieve details.

It deliberately does **not** retain a second full serialized 100k-detail corpus in memory. Synthetic detail JSON is reconstructed deterministically on read from the frozen golden fixture. This keeps the benchmark focused on retrieval/index behavior while preserving Step 3's memory lesson.

Separate compatibility tests prove byte-identical Step 3 detail/index reads for both the frozen historical 84-record oracle and the current 85-record public runtime.

## Runtime request model

Per benchmark query:

- browser → Worker requests: **1**;
- metadata shard reads: **0**;
- index-object reads: one per query dimension, capped by the gate;
- detail-object reads: one per bounded candidate, maximum **256**;
- total backend object reads: index reads + detail reads;
- full metadata/corpus scans are forbidden.

The Worker boundary is modeled as the aggregation point. The browser never needs to fetch or interpret the index objects directly.

The benchmark reports both:

1. backend object-store read bytes (index + detail objects); and
2. the aggregated Worker response bytes sent toward the browser.

Raw and gzip-estimated sizes are recorded separately.

## Frozen Step 4 acceptance thresholds

These are local architecture budgets. They are not claims about real Cloudflare R2 latency or free-tier limits; those remain a later production-shaped pilot gate.

| Metric | Threshold |
|---|---:|
| Browser → Worker requests / query | **≤ 1** |
| Metadata object reads / query | **0** |
| Index object reads / query | **≤ 4** |
| Detail object reads / query | **≤ 256** |
| Total backend object reads / query | **≤ 260** |
| Backend gzip-estimated bytes / query | **≤ 2 MiB** |
| Worker response gzip bytes / query | **≤ 2 MiB** |
| Bounded candidate set | **≤ 256** |
| Local indexed retrieval p95 | **≤ 25 ms** |
| Existing deterministic rank/filter p95 | **≤ 100 ms** |
| 100k model/index build time | **≤ 60 s** |
| 100k sampled process RSS | **≤ 1 GiB** |
| 100k sampled heap used | **≤ 768 MiB** |

The 260-object bound is deliberately explicit. A broad query may still require 256 bounded detail reads, but it may never become an unbounded scan. Step 7 must measure real object-operation latency/cost. If real R2 proves that individual bounded detail reads are inefficient, a provider-neutral derived detail-packing/cache optimization may be evaluated separately; that alone does not justify D1.

## Query scenarios

Step 4 reuses the deterministic Step 1 scenario selector across available:

- meal type;
- time bucket;
- cuisine;
- canonical ingredient;
- dietary tag.

This produces broad and narrower intersections while avoiding a hand-picked happy path.

For every scenario the report records:

- index keys;
- full candidate count before cap;
- bounded candidate count;
- ranked record count;
- browser request count;
- metadata/index/detail/backend object-read counts;
- raw/gzip-estimated index bytes;
- raw/gzip-estimated detail bytes;
- total backend bytes;
- Worker response bytes;
- retrieval p50/p95;
- rank/filter p50/p95.

## D1 gate

Step 4 never auto-adds D1.

Terminal values are:

- `NOT_EARNED_R2_PREBUILT_INDEX_PATH_PASSES`; or
- `REVIEW_ONLY_AFTER_RETRIEVAL_GATE_FAILURE__DO_NOT_AUTO_ADD_D1`.

A PASS means deterministic pre-built object indexes remain the accepted baseline.

A FAIL requires classification of the exact failed checks. Only a failure that SQL can plausibly solve may earn a bounded D1 prototype. Paid infrastructure remains separately gated.

## Validation contract

`tests/corpus-scale-step4.test.js` verifies:

- byte-identical Step 3 detail/index reads on the historical 84-record oracle;
- byte-identical Step 3 detail/index reads on the current 85-record public runtime;
- Step 1/Step 4 candidate-intersection parity at synthetic scale;
- exact bounded candidate identities;
- one browser request and zero metadata scans;
- bounded index/detail/backend object reads;
- deterministic transfer/read shape;
- fail-closed gate evaluation;
- no automatic D1 adoption after failure;
- absence of a second retained full serialized detail corpus;
- portable path/input validation.

Normal repository validation runs these bounded tests. The dedicated Step 4 workflow performs the full 1k → 10k → 50k → 100k benchmark separately.

## Full benchmark command

```bash
node --expose-gc scripts/run-corpus-scale-step4.mjs
```

Diagnostic example:

```bash
node --expose-gc scripts/run-corpus-scale-step4.mjs \
  --sizes=1000,10000 \
  --repetitions=4
```

Optional JSON output:

```bash
node --expose-gc scripts/run-corpus-scale-step4.mjs \
  --output=/tmp/corpus-scale-step4.json
```

The runner exits non-zero if any applicable frozen gate fails.

## Hard non-authorizations

Step 4 does **not** authorize:

- production Cloudflare provisioning;
- Cloudflare Access configuration;
- Worker or R2 deployment;
- D1 merely because it exists;
- a larger candidate cap;
- public runtime cut-over to V2;
- real external mass ingestion;
- paid infrastructure/API/corpus licensing;
- weaker dietary/allergen/permanent-exclusion/source-rights/nutrition gates;
- private Knowledge Core browser/runtime dependency.

## Next action after PASS

**Step 5 — Generalized ingestion/control plane.**

Generalize the existing Gate F2 review/admission state machine into a source-adapter-neutral control plane while preserving exact provenance, rights states, hold/reject outcomes, nutrition separation and immutable corpus-version production. No real large-corpus admission occurs merely because the control plane exists.
