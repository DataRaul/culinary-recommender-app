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
- Step 8C source qualification: `docs/CORPUS_SCALE_STEP8C_SOURCE_QUALIFICATION.md`
- Step 8B/8C human-gate closeout: `docs/CORPUS_SCALE_STEP8BC_HUMAN_GATE_CLOSEOUT.md`
- YouTube generated state: `data/generated/youtube-culinary-daily-discovery-state.json`

Older Access/R2/100k summaries are historical for current runtime/storage/cost sequencing. The 170k no-billing architecture and Step 8 documents control Corpus Scale work.

## Corpus Scale status

Required capacity: **170,000** admitted recipes. Synthetic stress/headroom target: **250,000**.

Hard cost rule: **never accept a product/subscription setup that authorizes automatic overage/payment charges.** Workers Paid, R2 and Zero Trust/Access remain rejected. Free exhaustion must fail closed.

Steps 7A–7E and Step 8A are complete. There is no Step 7F.

### Step 8B — MACHINE PREPARATION COMPLETE / LIVE HUMAN GATE NEXT

PR #116 merged at `280d261979908b42a7522f3f036d958cc619bb41`.

Evidence:

- PR validation `34512554325`: PASS;
- post-merge validation `34513562037`: PASS including production smoke;
- Pages deployment `34513559405`: PASS.

The repository has frozen the minimum two-shard canary, schema, exact batch receipts, idempotent/partial-failure recovery, bounded three-subquery cross-shard read fixture, rollback and live evidence envelope.

**No recipe-body D1 shard has been created.** Therefore `STEP_8B_MINIMUM_MULTI_SHARD_CANARY_PASS` is not yet earned.

Exact live topology permitted by the next gate:

1. `culinary-recipes-00` -> future `CULINARY_RECIPE_SHARD_00_DB` binding;
2. `culinary-recipes-01` -> future `CULINARY_RECIPE_SHARD_01_DB` binding.

Do not provision the other six modeled recipe-body shards.

### Step 8C — COMPLETE / PASS / MERGED GREEN

Terminal:

`STEP_8C_RIGHTS_CLEAN_SOURCE_COHORT_AVAILABLE`

PR #117 merged at `34afa1d73af6f99f20b31739e8bebacabff81b2a`.

Evidence:

- initial PR validation `34513497653`: PASS;
- fresh 8B-inclusive PR validation `34513710875`: PASS;
- post-merge validation `34513900064`: PASS including production smoke;
- Pages deployment `34513897846`: PASS.

Qualified protected-population input:

- UniTools World Recipes Dataset;
- exact snapshot `farcrak/unitools-recipes@1d09e9548d957dd0375301146a86dddf5e269c1b`;
- data blob `a81e96415f09eac7fc0aec94a4da8d9f6d66d9ed`;
- publisher commit version `1.1.0`;
- 501 recipes / 127 countries;
- CC BY-SA 4.0;
- protected-population input only.

Source nutrition, dietary/allergen inference, scaling-rule promotion, media admission, automatic app admission and public runtime activation remain false. Open Recipe Archive Spanish remains `HOLD_RIGHTS_AMBIGUOUS`; RecipeDB whole-source remains `SOURCE_COHORT_SALVAGE_ONLY`.

### Step 8D — BLOCKED ONLY ON STEP 8B LIVE PASS

Step 8C has supplied the source input. Step 8D must not populate anything until the minimum two-shard live canary reaches `STEP_8B_MINIMUM_MULTI_SHARD_CANARY_PASS`.

Steps 8E, 8F and 8G remain blocked as defined by the Step 8 roadmap. Step 8F remains the explicit human public-runtime gate. Step 8G does not depend on 8F but still requires Step 8D PASS.

## Current human gate

The next action is one owner-visible Cloudflare account action for the **first** exact D1 canary shard:

`culinary-recipes-00`

Proceed only if the screen clearly remains D1/Workers Free with **no checkout, payment method, subscription, paid-plan activation, overage authorization, R2 or Zero Trust/Access activation**.

If any such billing/charge authorization appears, stop. If the billing state is ambiguous, stop and inspect before accepting anything.

Do not create the second shard until the first result has been classified.

## Concurrency boundaries

Nutrition is an independent lane and must not be modified by Corpus Scale work.

YT-CUL remains independent and read-only from Corpus Scale; its generated state was reconciled as active with `lastCompletedQuotaDate: 2026-09-10` at this closeout.

Knowledge Core remains read-only/reconciliation from the App lane. Last reconciled `main`: `8f73e22aea81742d8721a80d03f4d605976ec7d6`.

## Next execution rule

Stop machine progression at the Step 8B account gate. After a confirmed Free/no-billing first-shard result, resume with the exact second-shard/binding/live-canary sequence. Do not begin Step 8D population, public activation, paid infrastructure, Nutrition/YT mutation or Knowledge Core writes before the corresponding gate is earned.
