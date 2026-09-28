import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { UNITOOLS_STEP8F_RECIPES } from "../src/data/external/unitools-step8f-v1.js";
import { validateC4UnitoolsDifficultyReuseContract, buildC4UnitoolsDifficultyReuseReview, validateC4UnitoolsDifficultyReuseSummary } from "../scripts/culinary-brain-c4-unitools-difficulty-adapter-reuse-review-core.mjs";

const read=path=>JSON.parse(readFileSync(path,"utf8"));
const contract=read("config/culinary_brain_c4_unitools_difficulty_adapter_reuse_review_v1.json");
const design=read("data/generated/culinary-brain-c4-remaining-hard-metadata-repair-design-summary-v1.json");
const step8f=read("data/generated/step8f/public-runtime-activation-pass.json");
const publicRecipe=UNITOOLS_STEP8F_RECIPES.find(row=>row.id==="unitools_tortilla_espanola");
const sourceRecipe={slug:"tortilla-espanola",difficulty:"medium"};

test("exact-candidate adapter review contract is bounded",()=>{
  assert.deepEqual(validateC4UnitoolsDifficultyReuseContract(contract),[]);
  assert.equal(contract.authority.exactCandidateDifficultyAuthorityAuthorizedOnPass,true);
  assert.equal(contract.authority.broaderDifficultyAdapterAuthorized,false);
  assert.equal(contract.authority.publicRuntimeWideningAuthorized,false);
});

test("exact pinned medium label reuses reviewed runtime difficulty 3 without duplicate admission",()=>{
  const summary=buildC4UnitoolsDifficultyReuseReview({contract,design,step8f,sourceRecipe,publicRecipe,observedBlobSha:contract.sourceDataBlobSha});
  assert.deepEqual(validateC4UnitoolsDifficultyReuseSummary(summary),[]);
  assert.equal(summary.adapter.runtimeDifficulty,3);
  assert.equal(summary.readiness.newProtectedRuntimeHardMetadataReadyCount,1);
  assert.equal(summary.readiness.sameCanonicalSourceRecordAlreadyPublic,true);
  assert.equal(summary.readiness.netNewPublicRecipeCount,0);
});

test("source difficulty drift fails closed",()=>{
  assert.throws(()=>buildC4UnitoolsDifficultyReuseReview({contract,design,step8f,sourceRecipe:{...sourceRecipe,difficulty:"hard"},publicRecipe,observedBlobSha:contract.sourceDataBlobSha}),/SOURCE_DIFFICULTY_MISMATCH/);
});
