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
- Step 8D live terminal closeout: `docs/CORPUS_SCALE_STEP8D_LIVE_POPULATION_PASS.md`
- Step 8D live terminal evidence: `data/generated/corpus-scale-step8d-live-pass.json`
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

### Step 8D — COMPLETE / LIVE PRODUCTION PASS

Terminal: `STEP_8D_PROTECTED_POPULATION_PASS`.

The exact pinned UniTools cohort completed protected population in production: **501 recipes**, **51 verified batches**, exactly **2 shards**, resume PASS, idempotent replay PASS, exact post-write closure PASS, cross-shard protected read PASS and pointer-only rollback PASS. Full-corpus scans were **0**. Maximum observed D1 subqueries were **15**, within the frozen limit of **16**.

The frozen population-plan SHA-256 remained `18ea4d1bfaf424709de22a7badd680fb82c887fb70e54af5e190c33371dbad12`; the pinned-source blob check passed. Normal public recommendation behavior remained unchanged. No third shard and no billing expansion occurred.

Canonical terminal evidence is `data/generated/corpus-scale-step8d-live-pass.json`; narrative closeout is `docs/CORPUS_SCALE_STEP8D_LIVE_POPULATION_PASS.md`.

Step 8D PASS unlocks Step 8E recommendation-eligibility review and Step 8G continued protected scale learning. Step 8F remains an explicit human public-runtime gate and is **not authorized** by Step 8D.

## Current human gate

None. Step 8D terminal PASS is earned. Step 8E and Step 8G may proceed autonomously inside the existing no-billing, no-public-activation and lane-separation boundaries.

The next reserved human gate is Step 8F public-runtime activation, after Step 8E produces decision input. Do not enter or authorize Step 8F without explicit human approval.

## Concurrency boundaries

Nutrition is an independent lane and must not be modified by Corpus Scale work.

YT-CUL remains independent and read-only from Corpus Scale.

Knowledge Core remains read-only/reconciliation from the App lane.

## Next execution rule

Continue from the earned Step 8D terminal. Step 8E recommendation-eligibility review and Step 8G protected-scale continuation are now eligible autonomous work. Preserve the exact two-shard/no-billing boundary unless a later gate separately earns expansion. Never activate public recommendations, mutate Nutrition/YT-CUL, write Knowledge Core, promote untrusted source metadata to canonical authority, or enter Step 8F without explicit human authorization.
