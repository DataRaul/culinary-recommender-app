# Corpus Scale Step 8G — Bosse / Watanna 1914 v8005 prewrite

Status: **PASS — LIVE PROTECTED POPULATION IMPLEMENTATION EARNED**  
Date: 2026-09-15  
Terminal candidate: `STEP_8G_ORA_BOSSE_WATANNA_V8005_PREWRITE_PASS_LIVE_PROTECTED_POPULATION_IMPLEMENTATION_EARNED`

## Scope

The exact 109-record Sara Bosse / Onoto Watanna 1914 cohort that passed the Step 8G rights and marginal-value measurement is planned as immutable protected layer `v8005`, parented by live protected `v8004`.

- parent protected corpus: 2,355 recipes (`v8004`);
- new protected layer: 109 recipes;
- planned composed protected corpus: **2,464 recipes**;
- recipe-body shards: **2**, unchanged;
- public runtime: unchanged at 85 recipes;
- historical 84-recipe golden benchmark: unchanged;
- cultural-authenticity authority imported: **false**.

The source is treated as a historical public-domain source label only. Its very low ontology-resolution result (13.3148404993% of ingredient occurrences) is retained as a review-cost signal, not silently promoted to canonical ingredient, dietary, allergen, nutrition, scaling, or cultural-authenticity authority.

## Capacity, request and D1 proof

The exact pinned source packets and deterministic two-shard population plan pass the existing Step 8G budgets:

- added protected body bytes: 351,928;
- planned total protected body bytes: 14,914,859;
- shard 0 after population: 1,241 rows / 7,531,627 bytes;
- shard 1 after population: 1,223 rows / 7,383,232 bytes;
- body batches: 12;
- route batches: 12;
- maximum rows per batch: **10**;
- maximum planned write request: 17,182 / 262,144 bytes;
- fresh body write: 15 D1 subqueries;
- fresh route write: **16 / 16 D1 subqueries**;
- bounded hydration worst case: 10 D1 subqueries;
- full-corpus scans required: 0.

The 16-query ceiling has **no assumed headroom**. An 11-row fresh route write models to 17 D1 subqueries and must fail closed. No additional D1 query may be added to that request path without redesign.

No third shard, D1-budget expansion, or paid/billing expansion is required or authorized.

## Authority boundary

This prewrite performs **zero live D1 writes**. Its PASS earns implementation of the v8005 protected-population path only. It does not make v8005 live and does not authorize public recommendation admission, broader Step 8F activation, source metadata as authority, Nutrition/YT-CUL mutation, Knowledge Core writes, a third shard, a higher D1 ceiling, or billing expansion.

The next action is a separate v8005 implementation lane following the proven v8004 runtime pattern: exact body and route hashes, resumable/idempotent 10-row batches, exact parent-route copy, five-layer hydration, rollback/fail-closed proof, no full-corpus scans, and no production writes during implementation. The later production population remains an owner-authenticated same-browser boundary.

## Canonical evidence

- measurement: `data/generated/step8g/ora-bosse-watanna-1914-measurement.json`
- prewrite evidence: `data/generated/step8g/ora-bosse-watanna-v8005-prewrite-evidence.json`
- retained validation: `data/generated/step8g/ora-bosse-watanna-v8005-prewrite-validation.json`
- source workflow run: `35025261910`
- source artifact: `10418613728`
- source artifact digest: `sha256:85de968c9b01f69f1d38d6e07719e42aec191df505ecfae57ec2b4f292a4024d`

The dedicated workflow regenerates the evidence and validation and compares them byte-for-byte with these canonical files before declaring the frozen prewrite green.
