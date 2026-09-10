# Corpus Scale Step 8B/8C — Machine Closeout and Human Gate

Status: **8B MACHINE PREPARATION COMPLETE / 8C PASS / HUMAN ACCOUNT GATE NEXT**

Date: **2026-09-10**

## Terminal state

### Step 8B — machine preparation complete

Repository implementation:

- PR #116;
- merge commit `280d261979908b42a7522f3f036d958cc619bb41`;
- PR validation run `34512554325`: PASS;
- post-merge validation run `34513562037`: PASS including production smoke;
- Pages deployment run `34513559405`: PASS;
- machine contract: `scripts/corpus-scale-step8b-core.mjs`;
- tests: `tests/corpus-scale-step8b.test.js`;
- design: `docs/CORPUS_SCALE_STEP8B_MACHINE_PREREQUISITES.md`.

Step 8B has **not** reached `STEP_8B_MINIMUM_MULTI_SHARD_CANARY_PASS` because no recipe-body D1 shard has been created and no live cross-shard canary has run.

The exact earned live topology is limited to two recipe-body D1 databases:

1. `culinary-recipes-00` -> future binding `CULINARY_RECIPE_SHARD_00_DB`;
2. `culinary-recipes-01` -> future binding `CULINARY_RECIPE_SHARD_01_DB`.

No other recipe-body shard is authorized by the current live gate.

### Step 8C — source qualification PASS

Repository implementation:

- PR #117;
- merge commit `34afa1d73af6f99f20b31739e8bebacabff81b2a`;
- first PR validation run `34513497653`: PASS;
- fresh 8B-inclusive PR validation run `34513710875`: PASS;
- post-merge validation run `34513900064`: PASS including production smoke;
- Pages deployment run `34513897846`: PASS;
- machine contract: `scripts/corpus-scale-step8c-core.mjs`;
- evidence: `config/corpus_scale_step8c_sources.json`;
- tests: `tests/corpus-scale-step8c.test.js`;
- qualification report: `docs/CORPUS_SCALE_STEP8C_SOURCE_QUALIFICATION.md`.

Terminal:

`STEP_8C_RIGHTS_CLEAN_SOURCE_COHORT_AVAILABLE`

Qualified protected-population input:

- source: UniTools World Recipes Dataset;
- exact repository snapshot: `farcrak/unitools-recipes@1d09e9548d957dd0375301146a86dddf5e269c1b`;
- exact data blob: `a81e96415f09eac7fc0aec94a4da8d9f6d66d9ed`;
- publisher commit version: `1.1.0`;
- bounded cohort: 501 recipes / 127 countries;
- licence: CC BY-SA 4.0;
- source nutrition authority: false;
- automatic dietary/allergen/scaling authority: false;
- media admission: false;
- automatic app/public recommendation admission: false.

Open Recipe Archive Spanish remains `HOLD_RIGHTS_AMBIGUOUS`. RecipeDB whole-source remains `SOURCE_COHORT_SALVAGE_ONLY`.

## Step 8D remains blocked

Step 8C has supplied the rights-clean population input, but Step 8D requires **both** 8B and 8C.

Current blocker:

`STEP_8B_LIVE_HUMAN_ACCOUNT_GATE_AND_MINIMUM_MULTI_SHARD_CANARY`

Do not begin Step 8D population merely because UniTools qualified.

## Human/account gate — first action only

The next action is owner-visible Cloudflare D1 provisioning for the first exact canary shard:

`culinary-recipes-00`

The account screen must be classified before creation/acceptance:

- if it clearly remains D1/Workers **Free** with no checkout, payment method, subscription, paid plan or overage/usage-charge authorization: `FREE_NO_BILLING_AUTHORIZATION_CONFIRMED` and the owner may create this exact database;
- if any checkout, payment authorization, Workers Paid activation, overage authorization, R2, Zero Trust/Access, or other chargeable subscription is introduced: **stop** and classify `BILLING_OR_OVERAGE_AUTHORIZATION_PRESENT`;
- if ambiguous: **stop** and inspect before accepting anything.

Only after the first result is known should the second exact database be handled. This preserves the project's one-high-information-action-at-a-time rule.

## Boundaries preserved through closeout

```json
{
  "recipeBodyD1ShardsCreated": 0,
  "step8DPopulationPerformed": false,
  "normalPublicRecommendationRuntimeChanged": false,
  "billingAuthorizationObserved": false,
  "workersPaidActivated": false,
  "r2Activated": false,
  "zeroTrustAccessActivated": false,
  "youtubeStateModified": false,
  "nutritionBLaneModified": false,
  "knowledgeCoreWritePerformed": false
}
```

YT-CUL remains an independent active/read-only lane from Corpus Scale. Knowledge Core remains read-only. Nutrition remains independent.

## Next machine work after the human result

A confirmed Free/no-billing first-shard creation does not itself complete Step 8B. It provides the exact resource needed for the next bounded machine step: verify the resource, repeat the same classification for the second exact shard, configure only the required bindings/runtime canary, and execute the minimum two-shard protected live proof under `validateStep8BLiveEvidenceEnvelope()`.

Until then, no Step 8D, 8E, 8F or 8G execution is earned.
