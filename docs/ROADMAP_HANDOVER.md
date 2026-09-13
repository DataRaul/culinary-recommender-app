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
- YouTube generated state: `data/generated/youtube-culinary-daily-discovery-state.json`

Older Access/R2/100k summaries are historical for current runtime/storage/cost sequencing. The 170k no-billing architecture and Step 8 documents control Corpus Scale work.

## Corpus Scale status

Required capacity: **170,000** admitted recipes. Synthetic stress/headroom target: **250,000**.

Hard cost rule: **never accept a product/subscription setup that authorizes automatic overage/payment charges.** Workers Paid, R2 and Zero Trust/Access remain rejected. Free exhaustion must fail closed.

Steps 7A–7E, Step 8A, Step 8B and Step 8C are complete. There is no Step 7F.

### Step 8B — COMPLETE / LIVE PRODUCTION PASS

Terminal: `STEP_8B_MINIMUM_MULTI_SHARD_CANARY_PASS`.

Machine-preparation PR #116 merged at `280d261979908b42a7522f3f036d958cc619bb41`. PR #136 merged the protected live-canary runtime at `3db8084b0571e192094c384ece20417202b1fdc2`. PR #139 fixed the canary page's zero-query UI false negative at `1b97f55b5cd9e7d6a43300eb9ef4ea8148f18cdf`.

The exact earned topology is still only:

1. `CULINARY_RECIPE_SHARD_00_DB` -> `culinary-recipes-00`
2. `CULINARY_RECIPE_SHARD_01_DB` -> `culinary-recipes-01`

Fresh authenticated production evidence passed the complete sequence: bindings, Free-limit fail-closed, initialize, bounded partial interruption, resume, idempotent replay, cross-shard read, activation boundary, rollback and final evidence. Observed maximum D1 subqueries were **10**, below the protected-request limit of **16**; full-corpus scans were **0**; normal public recommendation behavior remained unchanged.

A separate no-session production probe returned HTTP **401** with `UNAUTHORIZED`, `protectedDataReturned: false` and `shardQueries: 0`. That probe is resolved PASS and is part of the earned Step 8B terminal. The Step 8B canary must not report it as pending on later authenticated regression runs.

No third recipe-body shard or additional binding is authorized by Step 8B.

### Step 8C — COMPLETE / PASS / MERGED GREEN

Terminal: `STEP_8C_RIGHTS_CLEAN_SOURCE_COHORT_AVAILABLE`.

PR #117 merged at `34afa1d73af6f99f20b31739e8bebacabff81b2a`.

Qualified protected-population input is the pinned UniTools World Recipes Dataset snapshot `farcrak/unitools-recipes@1d09e9548d957dd0375301146a86dddf5e269c1b`, blob `a81e96415f09eac7fc0aec94a4da8d9f6d66d9ed`, version `1.1.0`, 501 recipes / 127 countries, CC BY-SA 4.0, protected-population input only.

Source nutrition, dietary/allergen inference, scaling-rule promotion, media admission, automatic app admission and public runtime activation remain false. Open Recipe Archive Spanish remains `HOLD_RIGHTS_AMBIGUOUS`; RecipeDB whole-source remains `SOURCE_COHORT_SALVAGE_ONLY`.

### Step 8D — ACTIVE IMPLEMENTATION / PRE-WRITE CONTRACT FROZEN

Both entry requirements are earned:

- Step 8B live two-shard terminal PASS;
- Step 8C rights-clean pinned source cohort PASS.

Step 8D is implementing the exact pinned 501-record UniTools transformation, protected packet schema and deterministic manifest on the already-earned two-shard topology. This does not grant recommendation eligibility or public-runtime authority.

The frozen protected packet schema is `CORPUS_SCALE_STEP8D_PROTECTED_PACKET_V1`. Stable IDs are `unitools:<exact pinned source slug>`. Media is excluded. Source diet, nutrition and scaling values are retained only as `SOURCE_METADATA_ONLY_UNTRUSTED`; unexpected pinned metadata such as `scaling: "damped"` is preserved verbatim rather than normalized into application authority.

The frozen manifest schema is `CORPUS_SCALE_STEP8D_MANIFEST_V1`, corpus version `v8001`. It is descriptor-only, contains no full recipe bodies, routes through exactly two shards using the Step 8A deterministic router, uses at most 10 rows per write batch, exact receipts for idempotency and pointer-only rollback.

No live Step 8D D1 population write is authorized until all pre-write acceptance criteria in `config/corpus_scale_step8d_contract.json` and `docs/CORPUS_SCALE_STEP8D_ACCEPTANCE_AND_PACKET_CONTRACT.md` pass. Pre-write PASS permits controlled population only; it is not the Step 8D terminal.

Step 8D terminal `STEP_8D_PROTECTED_POPULATION_PASS` additionally requires exact post-write 501 verification, resumability/idempotency, bounded cross-shard protected reads within <=16 D1 subqueries, zero full-corpus scans, unauthenticated zero-shard-query denial, pointer-only rollback, unchanged normal public recommendations, no third shard and no billing expansion.

Steps 8E, 8F and 8G remain gated as defined by the Step 8 roadmap. Step 8F remains the explicit human public-runtime gate. Step 8G does not depend on 8F but still requires Step 8D PASS.

## Current human gate

**None in Step 8D.**

The next reserved human gate is Step 8F public-runtime activation. A new human gate may arise earlier only if Step 8D encounters a genuine billing/security/account/rights boundary not already authorized.

## Concurrency boundaries

Nutrition is an independent lane and must not be modified by Corpus Scale work.

YT-CUL remains independent and read-only from Corpus Scale.

Knowledge Core remains read-only/reconciliation from the App lane.

## Next execution rule

Complete repository validation of the frozen Step 8D transformation/manifest/packet contract. Only if the complete pre-write acceptance set is green may controlled population begin on the existing two D1 bindings. Then collect exact receipts/checkpoints, verify post-write state, protected read budget, unauthenticated fail-closed behavior and pointer-only rollback. Stop on any new paid/billing/account/security/rights gate. Do not activate public recommendations, add a third shard, mutate Nutrition/YT-CUL, or write Knowledge Core.
