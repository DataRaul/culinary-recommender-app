# Corpus Scale Step 8G — Lucas Rigaud v8007 implementation / owner gate

Status: **IMPLEMENTED + DEPLOYED / OWNER-AUTHENTICATED PRODUCTION RUN REQUIRED**  
Date: 2026-09-16

## Current live state

Protected production remains **v8006 / 2,906 recipes** until the owner runs the deployed v8007 page. Public runtime remains **85 recipes** and Step 8F remains exactly `unitools_tortilla_espanola`.

No v8007 production D1 write has occurred as part of discovery, measurement, prewrite, implementation, CI or deployment.

## Earned v8007 target

Exact source cohort: `ORA_RIGAUD_1785_PORTUGUESE_SOURCE_AE3BD2C`.

- source work: *Cozinheiro moderno, ou nova arte de cozinha*
- author: Lucas Rigaud
- source year: 1785
- source item: `https://archive.org/details/b28764626`
- pinned ORA commit: `ae3bd2c009a8899dfe63b9166fa98ae3fa8041a8`
- child recipes: 789
- parent v8006 recipes: 2,906
- target v8007 composition: 3,695
- protected body shards: exactly 2
- body batches: 79
- route batches: 79
- max rows per batch: 10
- fresh route-write ceiling: exactly 16/16 D1 subqueries; zero headroom assumed

## Evidence chain

Discovery:

- PR #177 merged as `e352cba5c63443ba1d4e9d3b7f8d33381c6d93a2`
- run `35094233571`
- artifact `10445970646`
- digest `sha256:aa915c0905c8c28190dd0a093b1d8646e36a43ad28b17c77416acd512bf4a05d`

Source-specific rights + marginal-value measurement:

- PR #178 merged as `664d427b582fa3fa45ee4583319668cc7d2f93c7`
- terminal `STEP_8G_ORA_RIGAUD_1785_MEASUREMENT_EARNED_COHORT_CANDIDATE`
- run `35094671354`
- artifact `10444908664`
- digest `sha256:b10edc3cc4837915b7e22571c9a58848fdb6eebf6fe22202336d683f4e98c6f2`
- 789/789 parseable
- 773 distinct normalized titles
- 97.97211660329531% unique normalized titles
- 0 exact normalized-title overlap with v8006 baseline
- 773 novel normalized titles
- 2,495 distinct ingredient phrases / 2,197 novel

Prewrite:

- PR #179 merged as `8e9a8251196bba3e12eeefee4e3f9759fce519bd`
- terminal `STEP_8G_ORA_RIGAUD_1785_V8007_PREWRITE_PASS_LIVE_PROTECTED_POPULATION_IMPLEMENTATION_EARNED`
- run `35107716388`
- artifact `10451336020`
- digest `sha256:048a23d83ac5d5d55ec32a15d760e574315ed34bc2819d1e30c1438934f75852`
- parent fingerprint `345db0d7d8fd664807431de604596b6a685b48f382a0179c5c264a8758b4464b`
- layer manifest `1b840b2d0c0ccd5e64309206a4e3640c6e51e9d7f505ab9e976414361c526d02`
- population plan `e30f5ffb8c914e3138eae7375236daf3507210c2f4182e1c824b78fd3db1a7fd`
- child shard rows 399 / 390
- max modeled request 16,790 bytes
- fresh route write 16/16 D1; 11-row batches fail closed

Implementation:

- PR #180 merged as `10136684d4f80514141ace5c8ea1f989a2996a15`
- exact payload parity workflow `35109193228`: PASS
- all 789 source rows / 79 body batches / 79 route batches reproduce the frozen hashes
- restart-safe parent-route continuation: PASS
- post-merge validation run `35109408598`: PASS including repository validation, browser tests and production public-runtime smoke
- GitHub Pages build/deploy run `35109403972`: PASS
- Cloudflare Pages deployment for `10136684...`: PASS

## Owner gate

Open in the same browser used for Culinary authentication:

`https://culinary-recommender-app.pages.dev/step8g-v8007-populate.html`

1. Sign in normally using the linked sign-in canary if the session is not current.
2. Return to the v8007 page.
3. Press **Run / resume v8007** once.
4. Do not manually alter D1, routes, bindings, pointers, cookies or tokens.
5. If interrupted, reopen the same v8007 page and press **Run / resume v8007** again. The v8007 implementation is restart-safe and verifies prior exact writes idempotently.
6. Return the final JSON to ChatGPT.

Expected success terminal:

`STEP_8G_ORA_RIGAUD_V8007_PROTECTED_POPULATION_PASS`

Expected success state: v8007 active with exactly 3,695 protected recipes, 789 child recipes, 79 verified body batches, 79 verified route batches, seven-layer hydration PASS, rollback to v8006 PASS, v8007 hydration fail-closed while rolled back, and final v8007 reactivation.

## Boundaries

This gate does not authorize a third shard, D1 query-budget expansion, billing/paid infrastructure, broader public recommendation admission, Nutrition/YT-CUL/Knowledge Core mutation, or cultural-authenticity authority import.
