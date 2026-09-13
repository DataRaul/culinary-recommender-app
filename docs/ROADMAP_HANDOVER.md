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
- Step 8C source qualification: `docs/CORPUS_SCALE_STEP8C_SOURCE_QUALIFICATION.md`
- YouTube generated state: `data/generated/youtube-culinary-daily-discovery-state.json`

Older Access/R2/100k summaries are historical for current runtime/storage/cost sequencing. The 170k no-billing architecture and Step 8 documents control Corpus Scale work.

## Corpus Scale status

Required capacity: **170,000** admitted recipes. Synthetic stress/headroom target: **250,000**.

Hard cost rule: **never accept a product/subscription setup that authorizes automatic overage/payment charges.** Workers Paid, R2 and Zero Trust/Access remain rejected. Free exhaustion must fail closed.

Steps 7A–7E, Step 8A and Step 8C are complete. There is no Step 7F.

### Step 8B — TWO D1 RESOURCES CREATED / LIVE CANARY DEPLOYED / BINDING GATE NEXT

Machine-preparation PR #116 merged at `280d261979908b42a7522f3f036d958cc619bb41`.

The owner has human-attested creation of exactly the minimum two D1 recipe-body databases, each with `FREE_NO_BILLING_AUTHORIZATION_CONFIRMED`:

1. `culinary-recipes-00`
2. `culinary-recipes-01`

PR #136 merged the protected live-canary runtime at `3db8084b0571e192094c384ece20417202b1fdc2`.

Runtime evidence:

- PR validation `34778087774`: PASS;
- post-merge validation `34778233576`: PASS including browser acceptance and production smoke;
- Pages deployment `34778233094`: PASS.

The deployed canary surfaces are `/api/step8b/canary` and `/step8b-canary.html`. Repository tests prove deterministic router parity, unauthenticated/free-limit/missing-binding fail-closed behavior, bounded partial recovery, idempotent replay, cross-shard reads, pointer-only rollback, zero full-corpus scans, and the <=16 D1-subquery budget.

`STEP_8B_MINIMUM_MULTI_SHARD_CANARY_PASS` is **not yet earned**, because the two D1 resources are not yet bound to the production Pages project and no authenticated live canary has run against them.

Exact binding gate:

- `CULINARY_RECIPE_SHARD_00_DB` -> `culinary-recipes-00`
- `CULINARY_RECIPE_SHARD_01_DB` -> `culinary-recipes-01`

Do not provision any other recipe-body shard or binding.

### Step 8C — COMPLETE / PASS / MERGED GREEN

Terminal: `STEP_8C_RIGHTS_CLEAN_SOURCE_COHORT_AVAILABLE`.

PR #117 merged at `34afa1d73af6f99f20b31739e8bebacabff81b2a`.

Qualified protected-population input remains the pinned UniTools World Recipes Dataset snapshot `farcrak/unitools-recipes@1d09e9548d957dd0375301146a86dddf5e269c1b`, blob `a81e96415f09eac7fc0aec94a4da8d9f6d66d9ed`, version `1.1.0`, 501 recipes / 127 countries, CC BY-SA 4.0, protected-population input only.

Source nutrition, dietary/allergen inference, scaling-rule promotion, media admission, automatic app admission and public runtime activation remain false. Open Recipe Archive Spanish remains `HOLD_RIGHTS_AMBIGUOUS`; RecipeDB whole-source remains `SOURCE_COHORT_SALVAGE_ONLY`.

### Step 8D — BLOCKED ONLY ON STEP 8B LIVE PASS

Step 8C has supplied the source input. Step 8D must not populate anything until the minimum two-shard live canary reaches `STEP_8B_MINIMUM_MULTI_SHARD_CANARY_PASS`.

Steps 8E, 8F and 8G remain blocked as defined by the Step 8 roadmap. Step 8F remains the explicit human public-runtime gate. Step 8G does not depend on 8F but still requires Step 8D PASS.

## Current human gate

In the existing production Cloudflare Pages project `culinary-recommender-app`, add exactly these two D1 bindings:

1. binding `CULINARY_RECIPE_SHARD_00_DB` -> existing database `culinary-recipes-00`;
2. binding `CULINARY_RECIPE_SHARD_01_DB` -> existing database `culinary-recipes-01`.

Do not authorize checkout, a payment method, Workers Paid, overage/usage charges, R2 or Zero Trust/Access. If the UI asks for any of those, is ambiguous, or cannot bind exactly the existing two databases, stop and report the visible state.

## Concurrency boundaries

Nutrition is an independent lane and must not be modified by Corpus Scale work.

YT-CUL remains independent and read-only from Corpus Scale; last reconciled completed quota date was `2026-09-13`.

Knowledge Core remains read-only/reconciliation from the App lane. Last reconciled `main`: `86bd81d04d2fd0b7c19217091ee3e1358a263467`.

## Next execution rule

Stop machine progression only at the exact Pages binding account gate. After the two bindings are confirmed, externally prove unauthenticated denial, run the authenticated same-origin Step 8B canary, validate the frozen evidence envelope, and earn the Step 8B terminal only on complete PASS. Do not begin Step 8D population, public activation, paid infrastructure, Nutrition/YT mutation or Knowledge Core writes before the corresponding gate is earned.
