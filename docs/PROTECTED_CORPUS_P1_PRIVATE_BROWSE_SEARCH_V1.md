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

The index build itself is restart-safe and keyset-paginated by recipe ID. Each request handles at most **40** recipes. Browse/search pages return at most **50** recipes.

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

Thus the worst planned batch is **8 D1 subqueries/request**, matching the measured target. Any request above 8 fails closed; 16 remains the hard fail-safe and is not spendable headroom.

## Authentication and privacy

`/api/protected-corpus/v1` validates the hardened Culinary session before executing any protected control/shard query. The mobile/browser test explicitly proves that an unauthenticated page load makes zero protected API calls.

The owner page `/protected-corpus.html` is network-only in the service worker so protected pages and API responses are not stored in Cache Storage.

## Search and browse

- Browse: keyset pagination over the compact v8018 index; no OFFSET.
- Search: bounded FTS5 query over title/source fields, then stable recipe IDs.
- Detail: one selected recipe at a time, hydrated from the existing two-shard body store.
- Source/provenance: source work, author/year where present, cohort and source URL are shown.
- Structural exceptions: records lacking ingredient/direction structure remain discoverable and display a soft `PARTIAL` state rather than failing the corpus page.

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
3. PR CI — **Validate public V0 #1088 PASS** (workflow run `36061685454`);
4. merge only when green;
5. deploy through the existing Pages path;
6. one authenticated owner live canary builds/resumes the compact index until it proves **19,268 / 19,268**, verifies the expected **3** structural partial records, exercises browse/search/detail across both shards, and confirms all live D1 counts remain at or below 8.

P1 is not terminal PASS until that live owner canary succeeds.
