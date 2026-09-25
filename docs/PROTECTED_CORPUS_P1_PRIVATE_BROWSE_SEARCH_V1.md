# Protected Corpus Runtime Usability P1 — Private Browse/Search Canary

Date: **2026-09-24**

Status: **IMPLEMENTATION CI PASS / LIVE OWNER CANARY PENDING**

## Objective

Make the complete protected **v8018 / 19,268** corpus privately browsable and searchable for an authenticated owner without changing public runtime or recommendation authority.

## Architecture

The P1 canary reuses the existing protected corpus rather than creating a new corpus path:

- recipe bodies remain unchanged across exactly two protected D1 body shards;
- the existing v8015 base + v8016/v8017/v8018 route ancestry remains authoritative;
- a compact search/provenance index is built in the existing control D1;
- the search index uses SQLite FTS5 for bounded text retrieval;
- browse and search return stable recipe IDs and lightweight metadata before any body hydration;
- detail fetch hydrates one selected body through the already-proven v8018 bounded hydration runtime.

The index build itself is restart-safe and keyset-paginated by recipe ID. Each request handles at most **7** recipes. The original 40-row design was corrected after the first live owner attempt exposed Cloudflare D1's 100-bound-parameter/query ceiling: the summary upsert binds 13 values per recipe, so 40 rows would require 520 parameters while 7 rows require 91. Browse/search pages return at most **50** recipes.

## D1 budget

Authentication is counted inside the product request budget.

Maximum planned index-build request:

1. session/account authorization: 1;
2. active-v8018 pointer check: 1;
3. bounded route page: 1;
4. body read from shard 00 when needed: 1;
5. body read from shard 01 when needed: 1;
6. summary upsert: 1;
7. FTS removal for the bounded ID set: 1;
8. FTS insertion for the bounded ID set: 1.

Thus the worst planned batch is **8 D1 subqueries/request**, matching the measured target. The per-statement bind ceiling is independently enforced at **100 parameters/query**; the 7-recipe batch keeps the largest summary statement at **91** bound parameters. Any request above 8 fails closed; 16 remains the hard fail-safe and is not spendable headroom.

## Authentication and privacy

`/api/protected-corpus/v1` validates the hardened Culinary session before executing any protected control/shard query. The mobile/browser test explicitly proves that an unauthenticated page load makes zero protected API calls.

The owner page `/protected-corpus.html` is network-only in the service worker so protected pages and API responses are not stored in Cache Storage.

## Search and browse

- Browse: keyset pagination over the compact v8018 index; no OFFSET.
- Search: bounded FTS5 query over title/source fields, then stable recipe IDs.
- Detail: one selected recipe at a time, hydrated from the existing two-shard body store.
- Source/provenance: source work, author/year where present, cohort and source URL are shown.
- Structural exceptions: records lacking ingredient/direction structure remain discoverable and display a soft `PARTIAL` state rather than failing the corpus page.

## Terminal owner verification

After the private index is ready, the owner page exposes one bounded **Run live verification** action. It reuses only the existing authenticated P1 API and checks the exact terminal contract in one continuous browser session:

- status is exactly `v8018`, `19,268 / 19,268`, with exactly **3** soft structural exceptions;
- bounded browse returns protected summaries without a full-corpus request scan;
- bounded FTS search resolves the fixed Carbonara canary;
- fixed public-known v8001 ancestry representatives prove detail hydration from **shard 0** (`unitools:risotto-alla-milanese`) and **shard 1** (`unitools:spaghetti-carbonara`);
- source/cohort provenance and protected-only authority remain present;
- every observed request remains at or below the **8 D1** target.

The verifier emits only a sanitized terminal JSON result: corpus/count/budget/boolean acceptance evidence. It does not include owner account/email, session material, recipe bodies, ingredients or directions.

## Authority firewalls

P1 does **not**:

- admit protected recipes to recommendation;
- widen the 85-recipe public runtime;
- create dietary/allergen or nutrition authority;
- rewrite protected recipe bodies;
- add a third shard;
- ingest new sources;
- create a live Knowledge Core/LLM dependency;
- use paid infrastructure;
- mutate or rerun the separate Barbecue lane.

## Validation sequence

1. deterministic runtime/API tests — **PASS**;
2. mobile browser acceptance with mocked authenticated protected responses and a zero-query unauthenticated assertion — **PASS**;
3. terminal-verifier PR CI — **Validate public V0 #1092 PASS** (workflow run `36069895736`);
4. PR #309 merged at `5222da210d40721886f6ab0fc093e14c727f296b`;
5. production Pages deployment **#360 PASS** (workflow run `36070082857`) and post-merge **Validate public V0 #1093 PASS** (workflow run `36070083309`);
6. one authenticated owner live canary builds/resumes the compact index until ready, then uses the built-in **Run live verification** action to prove **19,268 / 19,268**, exactly **3** structural partial records, bounded browse/search, detail hydration across both shards, provenance, and live D1 counts at or below 8; the owner copies only the sanitized terminal JSON result.

P1 is not terminal PASS until that live owner canary succeeds.

## Live owner attempt — first-batch failure and repair

The first authenticated production preparation attempt reached the initialized index at **0 / 19,268** and then stopped safely on the first `index-batch` with `INDEX_BATCH_FAILED`; zero recipes were committed. Static reconciliation against the production code and Cloudflare's documented D1 limit found a deterministic contract mismatch: the 40-recipe summary upsert used 13 bound values per recipe (**520** total) while D1 allows **100 bound parameters per query**. The repair reduces index batches to **7 recipes / 91 summary parameters**, preserves the existing <=8 D1 subquery target, and changes the owner page to surface the server-provided failure reason before the generic error label. No blind retry is authorized until the repaired deployment is green.


## Live owner attempt — free-tier daily D1 quota hold

The changed-variable owner retry after PR #311 progressed from **0** to approximately **13k / 19,268** indexed recipes before Cloudflare returned a non-JSON provider-limit response. This proves the 100-bound-parameter repair worked and that committed keyset progress is durable.

Current Cloudflare D1 Workers Free limits are **100,000 rows written/day** and **5,000,000 rows read/day**, reset at **00:00 UTC**. D1 counts index writes as rows written, and Cloudflare explicitly notes that FTS5 increases write cost. Therefore the initial full FTS build is treated as a **restart-safe multi-quota-day canary**, not as a one-day requirement.

The repair records exact `meta.rows_written` from every successful D1 batch, surfaces it in the owner UI, and installs an **80,000 browser-observed row-write safety guard** per UTC day. The guard intentionally leaves headroom for authentication/control activity and other D1 work. A provider daily-limit response is classified as a quota hold, not a corpus/runtime defect. No blind same-day retry is authorized. Committed recipes are never rebuilt; the next eligible run resumes from the last indexed recipe ID.
