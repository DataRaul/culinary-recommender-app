import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  buildC4HardMetadataRepairDesign,
  validateC4HardMetadataRepairDesignContract,
  validateC4HardMetadataRepairDesignSummary
} from "../scripts/culinary-brain-c4-remaining-hard-metadata-repair-design-core.mjs";

const read=path=>JSON.parse(readFileSync(path,"utf8"));
const contract=read("config/culinary_brain_c4_remaining_hard_metadata_repair_design_v1.json");
const reconciliation=read("data/generated/culinary-brain-c4-hard-authority-recipe-reconciliation-summary-v1.json");
const step8e=read("data/generated/step8e/admission-evidence.json");
const step8f=read("data/generated/step8f/public-runtime-activation-pass.json");

test("C4 hard-metadata repair design contract remains fail-closed",()=>{
  assert.deepEqual(validateC4HardMetadataRepairDesignContract(contract),[]);
  assert.equal(Object.values(contract.authority).every(value=>value===false),true);
  assert.equal(contract.designDecision.firstRepairGate,"C4_UNITOOLS_DIFFICULTY_ADAPTER_REUSE_REVIEW_V1");
});

test("design selects only the already-public pinned UniTools near-ready record",()=>{
  const summary=buildC4HardMetadataRepairDesign({contract,reconciliation,step8e,step8f});
  assert.deepEqual(validateC4HardMetadataRepairDesignSummary(summary),[]);
  assert.equal(summary.firstRepair.protectedRecipeKey,"unitools-world-recipes-v1_1_0::tortilla-espanola");
  assert.equal(summary.firstRepair.existingPublicCanonicalRecipeId,"unitools_tortilla_espanola");
  assert.equal(summary.duplicateSafety.sameSourceRecordAlreadyPublic,true);
  assert.equal(summary.duplicateSafety.netNewPublicRecipeExpectedFromFirstRepair,0);
  assert.equal(summary.remainingCandidates.count,99);
  assert.equal(summary.authorityPromoted,false);
});

test("design rejects source-pin drift",()=>{
  const changed=structuredClone(step8e);
  changed.source.commit="0000000000000000000000000000000000000000";
  assert.throws(
    ()=>buildC4HardMetadataRepairDesign({contract,reconciliation,step8e:changed,step8f}),
    /STEP8E_SOURCE_PIN_MISMATCH/
  );
});
