# Corpus Scale Step 8C — Scalable Source Qualification

Status: **PASS CANDIDATE / REPOSITORY VALIDATION PENDING / NO INGESTION**

Date: **2026-09-10**

Entry authority:

`STEP_8A_POPULATION_CONTRACT_PASS`

Machine contract:

`scripts/corpus-scale-step8c-core.mjs`

Pinned source evidence:

`config/corpus_scale_step8c_sources.json`

Validation:

`tests/corpus-scale-step8c.test.js`

## 1. Decision

Step 8C has identified one bounded source cohort that satisfies the project's documentary rights/provenance gate for **protected population input only**:

**UniTools World Recipes Dataset — pinned GitHub snapshot at commit `1d09e9548d957dd0375301146a86dddf5e269c1b`, data blob `a81e96415f09eac7fc0aec94a4da8d9f6d66d9ed`, 501 recipes / 127 countries.**

The publisher's pinned commit says the repository data files were refreshed to **1.1.0**, adds the full CC BY-SA 4.0 legal code, and explicitly characterizes the repository as data rather than software. The full dataset file and licence are both present in that immutable snapshot.

The publisher's current data page independently continues to describe the recipe dataset as **501 recipes / 127 countries**, licensed **CC BY-SA 4.0**, and states that copying, modification and commercial use are allowed subject to attribution and ShareAlike. As of this review the website describes a later **v2.0 (2 September 2026)** release. That mutable website release is supplemental evidence only and does not silently replace the pinned 1.1.0 GitHub snapshot used for this decision.

This is a project engineering/documentary qualification, not a legal opinion or an independent warranty that the publisher owns every possible underlying right. The decision is deliberately pinned so future evidence can be reviewed without rewriting historical provenance.

If repository validation passes, the Step 8C terminal is:

`STEP_8C_RIGHTS_CLEAN_SOURCE_COHORT_AVAILABLE`

That terminal means only that a source cohort is available as Step 8D input. It does not execute Step 8D.

## 2. Why UniTools qualifies for the protected-input gate

The evidence chain is materially stronger than the currently held alternatives:

1. The publisher describes the repository itself as a **data** repository and applies CC BY-SA 4.0 to the dataset rather than merely licensing software around it.
2. The pinned snapshot contains the **full data file**, not only example records or extraction code.
3. The pinned snapshot contains the **full CC BY-SA 4.0 legal code**.
4. The publisher states that the recipes are written in Russian and English for their respective languages rather than machine-translated, and does not identify Food.com/AllRecipes or another external recipe-text corpus as the source of the recipe prose.
5. The snapshot is immutable by Git commit and data-blob SHA rather than depending on a mutable download URL.
6. The publisher's current first-party data page continues to state the dataset-level CC BY-SA licence and the same 501-recipe / 127-country scope.

The qualification therefore records explicit content-level permission to reproduce and adapt the licensed material, with the licence's conditions preserved in the project contract.

## 3. CC BY-SA obligations are retained, not optimized away

CC BY-SA 4.0 permits sharing and adaptation, including commercial use, subject to its conditions. The project records at minimum:

- attribution is required when licensed material is shared;
- a licence reference/link and modification indication must be retained as applicable;
- if adapted material is shared, ShareAlike requires a compatible BY-SA adapter licence;
- no extra restrictions may be imposed that legally prevent recipients from exercising the licensed rights.

Protected/private population does not erase those forward obligations. Any later distribution, publication or recommendation-surface use of licensed/adapted material must be reviewed at the applicable gate. Step 8C does not pre-authorize that later use.

## 4. Immutable snapshot rule

The Step 8C source identity is:

- repository: `farcrak/unitools-recipes`;
- commit: `1d09e9548d957dd0375301146a86dddf5e269c1b`;
- data path: `unitools-recipes-v1.json`;
- data blob: `a81e96415f09eac7fc0aec94a4da8d9f6d66d9ed`;
- publisher commit version: `1.1.0`;
- bounded record count: `501`.

A mutable website file or a later release cannot substitute for this identity. Moving to the current website v2.0 dataset, or any future repository snapshot, requires a new evidence decision and new immutable fingerprint.

## 5. Authority firewalls

The 501-source-record qualification does **not** mean every source field becomes canonical app truth.

The following remain false:

- source nutrition is authoritative NutritionSource evidence;
- source diet/allergen labels are automatically authoritative hard-filter claims;
- source serving/scaling rules may be promoted automatically into canonical quantities;
- source media is admitted automatically;
- source records are automatically app-admitted;
- normal public recommendation/runtime activation is authorized;
- Knowledge Core writes are authorized from the App lane.

The current source page states that nutrition is computed from ingredients, which reinforces why source nutrition remains non-authoritative under the independent Nutrition lane rather than being imported as truth.

Photographs are excluded from this Step 8C cohort. The publisher states that photographs may carry their own Wikimedia Commons author/licence metadata, but media rights are a separate per-asset decision and are not needed for corpus-body scale proof.

## 6. Retained hold — Open Recipe Archive Spanish

`Open Recipe Archive Spanish` remains:

`HOLD_RIGHTS_AMBIGUOUS`

The older Step 7 review found that the source books may be public-domain candidates, but the packaged modern English translation/normalization layer lacked sufficiently explicit transformation provenance/content-rights evidence. Public-domain status of the underlying books does not automatically establish rights for a later transformed textual layer.

Step 8C does not weaken that hold merely because another source has now qualified.

## 7. Retained salvage-only state — RecipeDB

Whole-source RecipeDB remains:

`SOURCE_COHORT_SALVAGE_ONLY`

Its database licence does not by itself resolve underlying detailed recipe prose attributed to Food.com/GeniusKitchen/AllRecipes. RecipeDB may advance only through separately rights-verified records/cohorts; it is not required for the current Step 8C terminal because UniTools already provides a bounded qualified cohort.

## 8. Why this is enough for Step 8C without overbuilding

Step 8C asks whether at least one scalable, rights-clean source cohort is available for the next protected population gate. It does not require us to qualify every candidate source before progress is possible.

A 501-record cohort is large enough to provide real new-source population/recovery evidence beyond the existing 84 reviewed corpus and the Step 7E protected source pilot, while remaining bounded enough for controlled Step 8D progression. Qualifying additional sources now would add review cost without changing the immediate gate result.

The project should therefore stop broad source hunting at this point and use the qualified cohort as the next bounded input once Step 8B independently proves the live two-shard runtime.

## 9. Test contract

`tests/corpus-scale-step8c.test.js` proves that:

- the pinned UniTools snapshot qualifies only as protected population input;
- immutable commit/blob identity is mandatory;
- a mutable latest URL cannot substitute for the pinned source identity;
- content-level licence, reproduction, transformation, storage/rehosting, attribution and ShareAlike requirements are mandatory;
- Open Recipe Archive-style unresolved transformation provenance remains held;
- RecipeDB-style underlying third-party prose remains salvage-only;
- media/nutrition/dietary/allergen/scaling/app-admission/public-runtime/Knowledge-Core authority leakage fails closed;
- malformed or unpinned source identity fails closed;
- terminal Step 8C evidence permits repository-only qualification and rejects any shard creation, corpus population, billing, public-runtime, YT-CUL, Nutrition B or Knowledge Core mutation.

## 10. PASS condition and next authority

Step 8C reaches:

`STEP_8C_RIGHTS_CLEAN_SOURCE_COHORT_AVAILABLE`

only after the source contract, evidence config, tests and normal repository/browser validation pass.

Step 8C PASS supplies the **rights-clean source input** required by Step 8D.

Step 8D remains blocked until Step 8B separately reaches:

`STEP_8B_MINIMUM_MULTI_SHARD_CANARY_PASS`

No ingestion has occurred in Step 8C. No recipe-body D1 shard has been created. No normal public runtime has changed. No paid/billing product has been activated. YT-CUL, Nutrition B and Knowledge Core were not modified.
