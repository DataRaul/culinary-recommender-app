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

### Step 8D — PRE-WRITE PASS EARNED / LIVE POPULATION IMPLEMENTED / PRODUCTION EVIDENCE PENDING

Both entry requirements are earned:

- Step 8B live two-shard terminal PASS;
- Step 8C rights-clean pinned source cohort PASS.

The deterministic pre-write gate is now earned and merged. PR #141 froze the packet/manifest/acceptance contract; PR #142 merged the exact pinned-source materialization and permanent read-only drift verifier at main `7036c01dcfa38e9803834ee0bc2c14e5d8658ad0`.

Frozen source/manifest facts:

- exact recipes: **501**;
- corpus version: `v8001`;
- packet schema: `CORPUS_SCALE_STEP8D_PROTECTED_PACKET_V1`;
- manifest schema: `CORPUS_SCALE_STEP8D_MANIFEST_V1`;
- population plan SHA-256: `18ea4d1bfaf424709de22a7badd680fb82c887fb70e54af5e190c33371dbad12`;
- shard 0 rows: **257**;
- shard 1 rows: **244**;
- batches: **51**;
- max rows per batch: **10**;
- source scaling values observed verbatim: `damped`, `fixed`, `linear`;
- media excluded;
- diet/nutrition/scaling remain `SOURCE_METADATA_ONLY_UNTRUSTED`;
- live D1 writes performed by the pre-write phase: **0**.

The live population implementation is in PR #143 on `agent/corpus-scale-step8d-live-population`. It reuses the existing `corpus_recipe_bodies` and `corpus_population_receipts` tables and exactly the two earned D1 bindings. It adds no third shard and no public recommendation runtime path.

The live receipt state machine writes each new receipt as `verified=0`, verifies the exact batch rows after the bounded D1 batch, then promotes the receipt to `verified=1`. Unknown commit state is resumable: a matching `verified=0` receipt causes exact row verification and safe promotion rather than a blind rewrite. A ten-row fresh write remains within the frozen `<=16` D1 subquery request budget including auth.

Progress/closure reads only receipt metadata. It does not scan recipe bodies. Final cross-shard evidence reads one frozen recipe ID from each shard.

The one-session same-origin runner is `/step8d-populate.html`; the protected route is `/api/step8d/populate`. The machine preflight fetches the exact immutable source and has already proven:

- browser CORS wildcard PASS;
- all 501 shared/live packet hashes equal the frozen descriptors;
- all 51 live batch fingerprints accepted;
- largest write request **65,383 bytes** vs **262,144-byte** cap;
- machine-preflight D1 writes **0**.

No production population is performed merely by merging the implementation. Terminal production evidence still requires one continuous authenticated runner session plus a separate external no-session zero-shard-query probe. The authenticated runner must first earn `STEP_8D_PROTECTED_POPULATION_PASS_PENDING_EXTERNAL_UNAUTH_PROBE`; only after the external probe passes may the canonical terminal become `STEP_8D_PROTECTED_POPULATION_PASS`.

Step 8D terminal additionally requires exact 501 / 51-batch closure, persisted partial checkpoint + successful resume, idempotent replay, bounded cross-shard protected reads within <=16 D1 subqueries, zero full-corpus scans, pointer-only rollback, unchanged normal public recommendations, no third shard and no billing expansion.

Steps 8E, 8F and 8G remain gated as defined by the Step 8 roadmap. Step 8F remains the explicit human public-runtime gate. Step 8G does not depend on 8F but still requires Step 8D PASS.

## Current human gate

**Deferred until all Step 8D machine work, CI, merge, deployment and unauthenticated production probing are complete.**

The remaining Step 8D human-only evidence is the authenticated same-origin `/step8d-populate.html` run in one continuous browser/session context. Do not ask for this before the live implementation is merged/deployed and the external no-session route has been machine-probed.

The next reserved human gate after Step 8D is Step 8F public-runtime activation.

## Concurrency boundaries

Nutrition is an independent lane and must not be modified by Corpus Scale work.

YT-CUL remains independent and read-only from Corpus Scale.

Knowledge Core remains read-only/reconciliation from the App lane.

## Next execution rule

Finish PR #143 validation, repair any CI issue within scope, merge when green, verify post-merge deployment, and externally probe unauthenticated `/api/step8d/populate` before any human request. Once those machine gates are green, run one authenticated same-origin Step 8D population session, capture the returned terminal-candidate JSON, then autonomously freeze the live evidence, update roadmap/handover, merge closeout and reconcile the terminal. Do not activate public recommendations, add a third shard, mutate Nutrition/YT-CUL, write Knowledge Core, or authorize billing expansion.
