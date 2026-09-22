# Step 8G — Fannie Farmer v8017 optimized no-write prewrite

Date: 2026-09-22

Status: `NO_WRITE_PREWRITE_GATE__V8016_LIVE_PARENT__OPTIMIZED_DELTA_ROUTE_REQUIRED`

This gate composes the rights-qualified and measured 1,776-row Fannie Merritt Farmer cohort over live protected `v8016` without writing production D1.

## Exact contract

- parent: `v8016` / **17,011** recipes
- child candidate: **1,776** recipes
- target: `v8017` / **18,787** recipes
- source cohort: `ORA_FANNIE_FARMER_BOSTON_COOKING_SCHOOL_GUTENBERG_65061`
- exact digitized source: Project Gutenberg #65061, 1910 revised edition
- ORA `source_year=1896`: work-first-publication metadata, not digitized-edition year
- topology: exactly **2** protected recipe-body shards
- maximum body-write batch: 10 rows
- optimized request design target: **<=8 D1 subqueries**
- hard API fail-safe: **16**, not spendable headroom
- request-size ceiling: 262,144 bytes
- full-corpus scans: forbidden

## Route architecture requirement

v8017 must extend the optimized v8016 delta-route architecture:

`V8015_BASE_PLUS_V8016_DELTA_PLUS_V8017_DELTA`

Physical routing state therefore remains:

- v8015: complete immutable base through 16,510 recipes;
- v8016: only the 501 Kenney-Herbert route delta;
- v8017: only the 1,776 Fannie Farmer route delta.

The **17,011 logical parent routes must not be copied** into v8017.

A future v8017 hydration runtime should resolve the ancestry with a bounded query equivalent to:

`composition_version IN ('v8015','v8016','v8017')`

The existing v8016 hydration implementation already proves that adding route versions to the SQL predicate does not require one D1 query per corpus version. The prewrite therefore retains the optimized <=8/request target while preserving the hard 16-query fail-safe.

## D1 write-cost guard

The gate measures body rows, delta-route rows, receipts, request sizes and cumulative two-shard capacity. It explicitly records zero parent-route copies.

Its logical application-row estimate excludes SQLite index amplification, DDL and pointer/control writes. Cloudflare D1 `meta.rows_written` remains authoritative. A later production runner must fail closed if observed request usage exceeds the optimized contract or if any parent-route copying is attempted.

## Parent identity

The v8016 parent is accepted only if all of the following reconcile:

- v8016 no-write prewrite evidence;
- exact v8016 owner-authenticated live PASS;
- v8016 runtime descriptor fingerprints;
- v8016 D1 optimization evidence;
- active v8016 / 17,011;
- route mode `PARENT_V8015_REFERENCE_PLUS_V8016_DELTA`;
- v8016 parent-route copies = 0;
- observed v8016 owner-run request maximum <=8.

## Authority boundaries

A green prewrite may earn **implementation** of a v8017 protected runtime on the existing free/two-shard/optimized-delta-route envelope.

It does not authorize:

- production D1 population;
- owner-authentication bypass;
- a third D1 shard;
- paid infrastructure or billing expansion;
- full parent-route copying;
- public corpus or recommendation activation;
- Nutrition / Recipe Family / YT-CUL / Knowledge Core mutation;
- cultural-authenticity, nutrition, allergen, dietary, scaling or medical authority.

Production population, if eventually earned, still requires a separately implemented/validated runtime and the real owner-authenticated production gate.

The exact CI result is frozen separately in the canonical generated prewrite evidence after this no-write gate runs.
