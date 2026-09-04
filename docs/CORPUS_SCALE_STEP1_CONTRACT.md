# Corpus Scale / 100k Readiness — Step 1 Synthetic Benchmark Contract

Status: **IMPLEMENTATION BUILT / FULL REPOSITORY VALIDATION AND 1K→100K MEASUREMENT PENDING**

This is the executable Step-1 contract referenced by `docs/ROADMAP.md` and `docs/CORPUS_SCALE_CLOUDFLARE_ACCEPTED_ARCHITECTURE.md`.

It is intentionally provider-neutral. It models the accepted Cloudflare R2 + pre-built-index shape without provisioning Cloudflare, ingesting a new real corpus, introducing D1, changing public recommendation behavior, or creating a private Knowledge Core runtime dependency.

## Golden behavioral oracle

The frozen Step-1 baseline is the reviewed `ALL_RECIPES` corpus at app `main` commit:

`8625cbb6457442229aa1dedee67d94c9a0727d7a`

Expected composition at that baseline:

- **84 total reviewed runtime records**;
- **76 curated/authored recipes**;
- **8 Gate-F external recipes**.

The benchmark runner refuses to proceed if the runtime count is not 84. It also emits a deterministic SHA-256 fingerprint of the sorted recipe IDs so each measurement records the exact identity set it used.

Synthetic records are deterministic clones of the golden records with unique synthetic IDs and explicit `SYNTHETIC_ONLY_NEVER_PRODUCTION` provenance. They are benchmark material only and must never be treated as admitted recipes.

## Synthetic catalogue sizes

The required default progression is:

1. 1,000 records;
2. 10,000 records;
3. 50,000 records;
4. 100,000 records.

Each larger catalogue deterministically cycles through the same golden recipes. The benchmark therefore measures scale characteristics while holding culinary content shape and evaluator semantics stable.

## Provider-neutral object/index model

The local model represents:

- immutable serialized recipe-detail objects;
- a stable ordinal-to-recipe-ID manifest in memory;
- deterministic pre-built posting-list shards for:
  - canonical ingredient;
  - cuisine;
  - dietary tag;
  - meal type;
  - main protein;
  - cumulative time buckets (`under-30`, `under-45`, `under-60`);
  - cumulative skill/difficulty ceilings (`lte-1` through `lte-4` where applicable);
- sorted posting-list intersections before detail hydration;
- a hard runtime candidate cap of **256** records before the existing evaluator/scorer is invoked.

Posting lists use compact integer ordinals in Step 1. This is an implementation hypothesis for measurement, not a permanently frozen R2 shard format. Step 3/4 may change the portable physical layout if measured evidence warrants it.

## Required metrics

Every requested size must report:

- total serialized recipe bytes;
- average, p95 and maximum recipe-object bytes;
- raw and gzip pre-built-index bytes;
- gzip index bytes per record;
- index shard count;
- full candidate-set cardinality before the 256-record cap;
- bounded candidate cardinality;
- raw and gzip transferred bytes for each benchmark query;
- local retrieval p50/p95 latency, including posting-list intersection plus detail JSON hydration;
- existing deterministic filter/ranking p50/p95 latency over the bounded candidates;
- build time;
- validation time;
- peak sampled process RSS and heap-used memory;
- deterministic catalogue SHA-256 validation fingerprint.

The benchmark uses several deterministic query shapes selected from the most common available meal, time, cuisine, ingredient and dietary index dimensions. This intentionally includes broad and narrower intersections rather than optimizing for one hand-picked happy path.

## Step-1 acceptance thresholds

These thresholds are project architecture budgets. They are deliberately independent from transient Cloudflare free-tier quotas, which must be revalidated later at provisioning time.

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

Acceptance is fail-closed: every applicable check must pass. A threshold failure is evidence to reconcile the index/object design; it does not automatically authorize D1, paid infrastructure, weaker hard filters, a larger candidate cap, or a public behavior change.

## Validation contract

`tests/corpus-scale-step1.test.js` covers:

- deterministic golden fingerprinting and synthetic identity;
- non-mutating synthetic cloning/provenance;
- retrieval index dimensions;
- deterministic posting-list intersections;
- candidate caps;
- transfer/latency report shape;
- catalogue structural validation;
- fail-closed threshold evaluation.

The full benchmark additionally validates every synthetic record, unique ID, benchmark provenance marker, all expected posting memberships, sorted/in-range posting lists and a deterministic catalogue digest.

## Runner

Default full run:

```bash
npm run benchmark:corpus-scale-step1
```

Optional bounded diagnostic run:

```bash
node --expose-gc scripts/run-corpus-scale-step1.mjs --sizes=1000,10000 --repetitions=4
```

Optional report file:

```bash
node --expose-gc scripts/run-corpus-scale-step1.mjs --output=/tmp/corpus-scale-step1.json
```

The runner exits non-zero when any measured acceptance threshold fails.

## Gate after measurement

A full green 1k→10k→50k→100k report is required before Step 1 may be called complete.

Even after Step 1 passes, the result authorizes only progression to the next roadmap implementation step. It does **not** authorize:

- production Cloudflare provisioning;
- real mass recipe ingestion;
- Open Recipe Archive / ForkRecipe / UniTools / RecipeDB admission;
- D1;
- paid infrastructure;
- public signup or any-email authentication;
- a public recommendation/ranking behavior change;
- weakening source-rights, provenance, nutrition, allergen, dietary, permanent-exclusion or review gates;
- private Knowledge Core browser/runtime access.

Cloudflare Access exact-email invitation-only membership remains a hard accepted production constraint, but it is not implemented or exercised in Step 1.
