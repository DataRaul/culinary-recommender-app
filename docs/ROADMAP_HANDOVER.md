# Roadmap Handover Pointer

Status: ACTIVE

This file is the continuation pointer for `docs/ROADMAP.md`. Live GitHub and `docs/handovers/CURRENT.json` outrank historical summaries.

## Canonical routing

Always use:

- current continuation: `docs/handovers/CURRENT.json`
- previous continuation: `docs/handovers/PREVIOUS.json`
- handover protocol: `docs/HANDOVER_PROTOCOL.md`
- canonical programme: `docs/ROADMAP.md`
- execution-priority amendment: `docs/ROADMAP_EXECUTION_PRIORITY_AMENDMENT_2026-09-06.md`
- 170k no-billing architecture: `docs/CORPUS_SCALE_NO_BILLING_AUTH_170K_ARCHITECTURE.md`
- Step 8 roadmap: `docs/CORPUS_SCALE_STEP8_MEASURED_POPULATION_ROADMAP.md`
- Step 8 machine gate contract: `config/corpus_scale_step8_roadmap.json`
- Step 8A population contract: `docs/CORPUS_SCALE_STEP8A_POPULATION_CONTRACT.md`
- Step 8B machine prerequisites: `docs/CORPUS_SCALE_STEP8B_MACHINE_PREREQUISITES.md`
- Step 8B binding-gate closeout: `docs/CORPUS_SCALE_STEP8B_BINDING_GATE_CLOSEOUT.md`
- Step 8B live terminal closeout: `docs/CORPUS_SCALE_STEP8B_LIVE_CANARY_PASS.md`
- Step 8C source qualification: `docs/CORPUS_SCALE_STEP8C_SOURCE_QUALIFICATION.md`
- Step 8D acceptance/packet contract: `docs/CORPUS_SCALE_STEP8D_ACCEPTANCE_AND_PACKET_CONTRACT.md`
- Step 8D machine contract: `config/corpus_scale_step8d_contract.json`
- Step 8D live runbook: `docs/CORPUS_SCALE_STEP8D_LIVE_POPULATION_RUNBOOK.md`
- Step 8D frozen pre-write evidence: `data/generated/corpus-scale-step8d-prewrite-evidence.json`
- Step 8D production-readiness evidence: `data/generated/corpus-scale-step8d-production-readiness.json`
- Step 8D frozen manifest: `data/generated/step8d/manifest.json`
- Step 8D frozen plan: `data/generated/step8d/population-plan-descriptors.json`
- YouTube generated state: `data/generated/youtube-culinary-daily-discovery-state.json`

Older Access/R2/100k summaries are historical for current runtime/storage/cost sequencing. The 170k no-billing architecture and Step 8 documents control Corpus Scale work.

## Corpus Scale status

Required capacity: **170,000** admitted recipes. Synthetic stress/headroom target: **250,000**.

Hard cost rule: **never accept a product/subscription setup that authorizes automatic overage/payment charges.** Workers Paid, R2 and Zero Trust/Access remain rejected. Free exhaustion must fail closed.

Steps 7A–7E, Step 8A, Step 8B and Step 8C are complete. There is no Step 7F.

### Step 8B — COMPLETE / LIVE PRODUCTION PASS

Terminal: `STEP_8B_MINIMUM_MULTI_SHARD_CANARY_PASS`.

Machine-preparation PR #116 merged at `280d261979908b42a7522f3f036d958cc619bb41`. PR #136 merged the protected live-canary runtime at `3db8084b0571e192094c384ece20417202b1fdc2`. PR #139 fixed the canary page's zero-query UI false negative at `1b97f55b5cd9e7d6a43300eb9ef4ea8148f18cdf`.

The exact earned topology remains only:

1. `CULINARY_RECIPE_SHARD_00_DB` -> `culinary-recipes-00`
2. `CULINARY_RECIPE_SHARD_01_DB` -> `culinary-recipes-01`

Authenticated production evidence passed bindings, Free-limit fail-closed, initialize, partial interruption, resume, idempotent replay, cross-shard read, activation boundary, rollback and final evidence. Observed maximum D1 subqueries were **10**, below the protected-request limit of **16**; full-corpus scans were **0**; normal public recommendation behavior remained unchanged.

A separate no-session production probe returned HTTP **401** with `UNAUTHORIZED`, `protectedDataReturned: false` and `shardQueries: 0`. That probe is resolved PASS and is part of the earned Step 8B terminal.

No third recipe-body shard or additional binding is authorized by Step 8B.

### Step 8C — COMPLETE / PASS / MERGED GREEN

Terminal: `STEP_8C_RIGHTS_CLEAN_SOURCE_COHORT_AVAILABLE`.

PR #117 merged at `34afa1d73af6f99f20b31739e8bebacabff81b2a`.

Qualified protected-population input is the pinned UniTools World Recipes Dataset snapshot `farcrak/unitools-recipes@1d09e9548d957dd0375301146a86dddf5e269c1b`, blob `a81e96415f09eac7fc0aec94a4da8d9f6d66d9ed`, version `1.1.0`, 501 recipes / 127 countries, CC BY-SA 4.0, protected-population input only.

Source nutrition, dietary/allergen inference, scaling-rule promotion, media admission, automatic app admission and public runtime activation remain false. Open Recipe Archive Spanish remains `HOLD_RIGHTS_AMBIGUOUS`; RecipeDB whole-source remains `SOURCE_COHORT_SALVAGE_ONLY`.

### Step 8D — MACHINE READY / PRODUCTION GREEN / AUTHENTICATED POPULATION GATE

Both entry requirements and the deterministic pre-write gate are earned. PR #141 froze the packet/manifest/acceptance contract and PR #142 merged the exact pinned-source materialization and permanent read-only drift verifier.

Frozen source/manifest facts:

- exact recipes: **501**;
- corpus version: `v8001`;
- packet schema: `CORPUS_SCALE_STEP8D_PROTECTED_PACKET_V1`;
- manifest schema: `CORPUS_SCALE_STEP8D_MANIFEST_V1`;
- packet-set SHA-256: `6b6e12011e9a12ffdc362acae32bc43304d66705c75325a898da1b84b3ed4c48`;
- manifest SHA-256: `0cb09afd9dd87ead733c3798c4832fdd96c8022867fb857a8730f74243562743`;
- population-plan SHA-256: `18ea4d1bfaf424709de22a7badd680fb82c887fb70e54af5e190c33371dbad12`;
- shard 0 rows: **257**;
- shard 1 rows: **244**;
- batches: **51**;
- max rows per batch: **10**;
- source scaling values observed verbatim: `damped`, `fixed`, `linear`;
- media excluded;
- diet/nutrition/scaling remain `SOURCE_METADATA_ONLY_UNTRUSTED`.

PR #143 merged the bounded resumable live population runner and protected route. It reuses the existing `corpus_recipe_bodies` and `corpus_population_receipts` tables and exactly the two earned D1 bindings. It adds no third shard and no normal public recommendation path.

A Cloudflare Pages packaging incompatibility in the first live runtime deployment was isolated to direct JSON-module imports in the Pages Function dependency graph. PR #146 replaced only that deployment boundary with a JavaScript runtime descriptor parity-checked against the canonical frozen JSON. Standard tests, the real-source 51-payload preflight, Cloudflare preview deployment and production deployment all pass after the repair.

PR #147 froze the production-readiness evidence and resolved the runner's stale `...PENDING_EXTERNAL_UNAUTH_PROBE` label. Production `main` at `1bd61fcc0ac70b15f5f529f17998fcb9b44890eb` is deployed green. Post-merge validation run `34836427610` passed repository validation, browser validation and production smoke. Live-payload preflight run `34836427579` passed. The production unauthenticated probe run `34836427544` passed HTTP **401**, `UNAUTHORIZED`, `NO_SESSION`, `protectedDataReturned: false`, `shardQueries: 0`.

The authenticated runner now returns terminal candidate `STEP_8D_PROTECTED_POPULATION_PASS` because the separate external no-session requirement is already earned. No Step 8D production D1 population writes have occurred yet.

The remaining terminal evidence is exactly one authenticated same-origin `/step8d-populate.html` run. It must produce exact 501 / 51-batch closure, persisted partial checkpoint + successful resume, idempotent replay, bounded cross-shard protected reads within <=16 D1 subqueries, zero full-corpus scans, pointer-only rollback, unchanged normal public recommendations, no third shard and no billing expansion.

Steps 8E and 8G remain blocked only until this Step 8D terminal PASS. Step 8F remains a separate explicit human public-runtime gate and is **not authorized** by Step 8D.

## Current human gate

**STEP8D_AUTHENTICATED_PROTECTED_POPULATION — HUMAN REQUIRED NOW.**

Use the production page `https://culinary-recommender-app.pages.dev/step8d-populate.html` in one continuous browser/session context. If the Culinary session is absent, use the page's **Open sign-in canary** link, sign in, return in the same browser context, then press **Run / resume Step 8D** once. Paste only the final JSON result; never paste cookies or session tokens.

A successful result must report `pass: true`, terminal candidate `STEP_8D_PROTECTED_POPULATION_PASS`, 501 recipes, 51 verified batches, two shards, resume/idempotency/cross-shard/rollback PASS, zero full-corpus scans, max observed D1 subqueries <=16, unchanged normal public recommendation runtime, no third shard and no billing expansion.

After that PASS JSON, the App lane must autonomously freeze the live closeout evidence, update roadmap/handover, merge the closeout and reconcile the terminal before entering Step 8E or Step 8G. Do not enter Step 8F without explicit human authorization.

## Concurrency boundaries

Nutrition is an independent lane and must not be modified by Corpus Scale work.

YT-CUL remains independent and read-only from Corpus Scale.

Knowledge Core remains read-only/reconciliation from the App lane.

## Next execution rule

Stop at the authenticated Step 8D production population gate. After the human returns the final runner JSON, validate it against the frozen terminal contract. If it passes, autonomously complete Step 8D closeout and unlock Step 8E/Step 8G. If it fails, resume only from receipt-backed state and repair the demonstrated issue; do not blind-retry writes. Never activate public recommendations, add a third shard, mutate Nutrition/YT-CUL, write Knowledge Core, or authorize billing expansion.
