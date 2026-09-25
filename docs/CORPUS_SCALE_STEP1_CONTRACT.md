# Corpus Scale / 100k Readiness — Step 1 Synthetic Benchmark Contract

Status: **V2 HARDENING COMPLETE / PASS / PR #291 MERGED**

This is the executable Step-1 contract referenced by `docs/ROADMAP.md` and `docs/CORPUS_SCALE_CLOUDFLARE_ACCEPTED_ARCHITECTURE.md`.

It remains provider-neutral. It models the accepted object-store + pre-built-index shape locally without provisioning Cloudflare, ingesting a new real corpus, introducing D1, changing public recommendation behavior, mutating the protected v8018 corpus, touching the scheduled Barbecue programme, or creating a private Knowledge Core runtime dependency.

## Baseline separation

Step 1 now preserves two explicit and independently frozen baselines.

### Historical behavioral oracle

The immutable historical `ALL_RECIPES` oracle remains the reviewed 84-record corpus from app main commit:

`8625cbb6457442229aa1dedee67d94c9a0727d7a`

Expected composition:

- **84 total records**;
- **76 authored records**;
- **8 Wikibooks Gate-F external records**.

Frozen fingerprint:

- IDs SHA-256: `062105fae761ce06357fdd2b068ed41c89590b9b89d984fbbe3ebb76d1b1407a`
- records SHA-256: `4b876f65ca0aa2ab6db3c2e4f1ca6c0af9e91f03e3923dfd3bfd9da2bcfe2f41`

This oracle is not rewritten by later public-runtime admission.

### Current synthetic benchmark seed

The V2 scale run uses the current 85-record `PUBLIC_RUNTIME_RECIPES` state. The original Step-1 restart baseline was `ca6a1129e52b45cac3b39f61402c7466f71d6761`. PR #318 deliberately re-baselined only the current-runtime records fingerprint after the explicitly owner-authorized celery allergen metadata correction; the immutable 84-record historical oracle and its fingerprint remain unchanged.

Current PR #318 candidate reference:

`f47f346c5366baa72f78018502e23cca1b9f1da0`

Current fingerprint:

- IDs SHA-256: `fbd3e7121f741db2f637fcea917d07ad410c189a0d6c2f1394c23f83ed5bc025`
- records SHA-256: `80da544e464cb83422f80e6a908ab37c863c8e22ee9654e97f22ef2cd8bee7f1`

The IDs fingerprint is unchanged. The records fingerprint changed because the known public celery recipe now truthfully declares the newly authorized `celery` hard-filter token. `ALL_RECIPES` remains the byte-stable historical 84-record oracle, while `CURRENT_PUBLIC_BASE_RECIPES` represents the current corrected 84-record public base used by the 85-record runtime.

The runner fails closed on count or fingerprint drift. A future public-runtime change must therefore be deliberately reconciled and re-baselined before the scale benchmark can silently move. PR #318 reconciliation passed Corpus scale Step 1 run **#39 / 36167651148 SUCCESS**.

Synthetic records remain deterministic clones with unique synthetic IDs and explicit `SYNTHETIC_ONLY_NEVER_PRODUCTION` provenance. Each clone also carries deterministic per-record SHA-256 benchmark entropy derived from source identity + ordinal so compression measurements are not unrealistically dominated by repeated clone payloads.

## Synthetic catalogue sizes

The required progression remains:

1. 1,000 records;
2. 10,000 records;
3. 50,000 records;
4. 100,000 records.

No real external recipe is created or admitted by these synthetic catalogues.

## Provider-neutral object/index model

The local model represents:

- immutable serialized recipe-detail objects;
- a stable ordinal-to-recipe-ID manifest;
- deterministic posting-list indexes for:
  - canonical ingredient;
  - cuisine;
  - dietary tag;
  - meal type;
  - main protein;
  - cumulative time buckets;
  - cumulative skill/difficulty ceilings;
- sorted posting-list intersections;
- a hard runtime candidate cap of **256** records before existing evaluator/scorer execution.

The V2 timed retrieval path now performs a bounded posting intersection and stops after the candidate cap is satisfied, before recipe-detail hydration. Full intersection remains available outside the timed path only to measure true candidate cardinality/selectivity.

Posting lists remain an implementation hypothesis for measurement, not a permanently frozen R2 physical format.

## Benchmark hardness

The benchmark must not pass using one favorable query shape. V2 deterministically exercises broad, common and rare retrieval shapes, including:

- broadest available index;
- broad meal;
- meal + time;
- cuisine + meal + time;
- ingredient + meal;
- diet + meal + time;
- protein + meal;
- rare cuisine;
- rare ingredient;
- rare protein.

Duplicate query signatures are removed. Acceptance requires:

- at least **7** distinct query scenarios;
- at least **7** scenarios with positive candidates;
- at least **3** distinct full candidate cardinalities;
- actual exercise of the **256** candidate cap at catalogue sizes of 10k or larger.

The green PR #291 run exercised **10** scenarios, all 10 positive, with **8** distinct full-candidate cardinalities.

## Required metrics

Every requested size reports:

- total serialized recipe bytes;
- average, p95 and maximum recipe-object bytes;
- raw and gzip pre-built-index bytes;
- gzip index bytes per record;
- index shard count;
- full candidate-set cardinality;
- bounded candidate cardinality;
- selectivity ratio;
- raw and gzip transferred bytes;
- local retrieval p50/p95 latency;
- existing deterministic filter/ranking p50/p95 latency;
- build time;
- validation time;
- sampled process RSS and heap-used memory;
- deterministic catalogue SHA-256.

Validation verifies synthetic provenance, ordinal/entropy integrity, unique IDs, every expected index membership, posting order/range, total membership equivalence and a digest covering complete serialized synthetic bodies plus index postings.

Explicit garbage collection is permitted only between benchmark phases/scenarios when Node is run with `--expose-gc`, so sampled live-memory pressure is not polluted by unreachable objects retained from prior independent phases. It is not invoked inside timed retrieval or ranking samples.

## Acceptance thresholds

| Metric | Threshold |
|---|---:|
| Average serialized recipe detail | **≤ 12 KiB** |
| p95 serialized recipe detail | **≤ 24 KiB** |
| Gzip index bytes / record | **≤ 768 B** |
| Gzip transferred bytes / benchmark query | **≤ 2 MiB** |
| Bounded candidate set | **≤ 256** |
| Local retrieval p95 | **≤ 25 ms** |
| Existing filter/rank p95 on bounded candidates | **≤ 100 ms** |
| 100k build time | **≤ 60 s** |
| 100k structural validation time | **≤ 30 s** |
| 100k peak sampled RSS | **≤ 1 GiB** |
| 100k peak sampled heap used | **≤ 768 MiB** |
| Query scenarios | **≥ 7** |
| Positive query scenarios | **≥ 7** |
| Distinct full-candidate cardinalities | **≥ 3** |
| Candidate-cap exercise at ≥10k | **required** |

Acceptance remains fail-closed. A threshold failure is evidence to repair/reconcile the retrieval/object design; it does not authorize D1, paid infrastructure, weaker hard filters, a larger candidate cap, or a public behavior change.

## PR #291 measured evidence

PR #291 merged at `200680b90b1ad887e9796fe255a09102e61b9293`. Its final pre-merge head was validated again by Corpus scale Step 1 workflow run **#26 / run 35995816545: SUCCESS**, with benchmark artifact **10806550530**. The same final head also passed Validate public V0 run **#1020 / 35995816580**, Step 4 indexed-retrieval proof **35995816549**, and Step 7A no-billing-auth proof **35995816569**.

| Size | Build | Validation | Peak RSS | Peak heap | Max transfer gzip | Max retrieval p95 | Max rank p95 |
|---:|---:|---:|---:|---:|---:|---:|---:|
| 1k | 95.689 ms | 44.253 ms | 120,213,504 B | 37,164,288 B | 104,018 B | 10.443 ms | 10.340 ms |
| 10k | 674.114 ms | 317.568 ms | 167,374,848 B | 72,354,608 B | 151,872 B | 7.531 ms | 6.983 ms |
| 50k | 3,033.085 ms | 1,557.445 ms | 393,048,064 B | 291,597,776 B | 370,947 B | 7.990 ms | 6.928 ms |
| 100k | 6,126.347 ms | 3,125.071 ms | 816,226,304 B | 697,934,632 B | 640,737 B | 7.508 ms | 6.447 ms |

100k catalogue SHA-256:
`1451acfddca7ad0082c196707937c6c1f55ff1ded1e5a1cf7b0dd3aba15cf354`

All original scale budgets and all V2 hardness checks passed.

The workflow writes the full JSON report and uploads it as the `corpus-scale-step1-report` CI artifact for review/audit.

## Runner

Default full run:

```bash
npm run benchmark:corpus-scale-step1
```

Evidence file:

```bash
node --expose-gc scripts/run-corpus-scale-step1.mjs --output=corpus-scale-step1-report.json
```

Optional bounded diagnostic:

```bash
node --expose-gc scripts/run-corpus-scale-step1.mjs --sizes=1000,10000 --repetitions=4
```

The runner exits non-zero on baseline drift or any acceptance failure.

## Gate after Step 1

V2 Step 1 is complete. PR #291 merged the measured candidate unchanged at `200680b90b1ad887e9796fe255a09102e61b9293`.

That result authorizes only continuation of the **independent scale-development lane**. It does not authorize:

- production Cloudflare provisioning;
- real mass recipe ingestion;
- a new protected corpus version;
- protected D1 mutation or a third shard;
- D1 as a new architecture dependency;
- paid infrastructure;
- public signup or any-email authentication;
- public recommendation/ranking behavior changes;
- weakening rights, provenance, nutrition, allergen, dietary, exclusion or review gates;
- private Knowledge Core browser/runtime access;
- any Barbecue workflow/state/query change.

Because historical Steps 2–7 already exist in the repository, the next scale action is **reconciliation/revalidation of those existing artifacts against the hardened V2 Step-1 contract and current 85-record public seed**, not blind reimplementation of already-completed work.
