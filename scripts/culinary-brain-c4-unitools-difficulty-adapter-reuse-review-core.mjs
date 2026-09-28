export const C4_UNITOOLS_DIFFICULTY_REUSE_SCHEMA="CULINARY_BRAIN_C4_UNITOOLS_DIFFICULTY_ADAPTER_REUSE_REVIEW_V1";
export const C4_UNITOOLS_DIFFICULTY_REUSE_SUMMARY_SCHEMA="CULINARY_BRAIN_C4_UNITOOLS_DIFFICULTY_ADAPTER_REUSE_REVIEW_SUMMARY_V1";
export const C4_UNITOOLS_DIFFICULTY_REUSE_TERMINAL="CULINARY_BRAIN_C4_UNITOOLS_DIFFICULTY_ADAPTER_REUSE_REVIEW_PASS__ONE_PROTECTED_HARD_METADATA_READY";
const DESIGN_TERMINAL="CULINARY_BRAIN_C4_REMAINING_HARD_METADATA_REPAIR_DESIGN_PASS__UNITOOLS_ADAPTER_REUSE_REVIEW_READY";
const STEP8F_TERMINAL="STEP_8F_PUBLIC_RUNTIME_ACTIVATION_APPROVED";

export function validateC4UnitoolsDifficultyReuseContract(contract){
  const errors=[];
  if(contract?.schemaVersion!==C4_UNITOOLS_DIFFICULTY_REUSE_SCHEMA) errors.push("schemaVersion");
  if(contract?.protectedCorpusVersion!=="v8018") errors.push("protectedCorpusVersion");
  if(contract?.entryTerminal!==DESIGN_TERMINAL) errors.push("entryTerminal");
  if(contract?.protectedRecipeKey!=="unitools-world-recipes-v1_1_0::tortilla-espanola") errors.push("protectedRecipeKey");
  if(contract?.sourceCohortId!=="unitools-world-recipes-v1_1_0"||contract?.sourceSlug!=="tortilla-espanola") errors.push("sourceIdentity");
  if(!/^[a-f0-9]{40}$/.test(contract?.sourceCommit||"")||!/^[a-f0-9]{40}$/.test(contract?.sourceDataBlobSha||"")) errors.push("sourcePins");
  if(contract?.expectedSourceDifficultyLabel!=="medium") errors.push("sourceDifficulty");
  if(JSON.stringify(contract?.reviewedMapping||{})!==JSON.stringify({easy:1,medium:3,hard:4})) errors.push("mapping");
  if(contract?.expectedRuntimeDifficulty!==3) errors.push("runtimeDifficulty");
  if(contract?.existingPublicCanonicalRecipeId!=="unitools_tortilla_espanola") errors.push("publicCanonicalId");
  if(contract?.existingPublicActivationTerminal!==STEP8F_TERMINAL) errors.push("publicActivationTerminal");
  if(contract?.authority?.exactCandidateDifficultyAuthorityAuthorizedOnPass!==true) errors.push("exactAuthority");
  for(const key of ["broaderDifficultyAdapterAuthorized","protectedRecommendationAdmissionAuthorized","publicRuntimeWideningAuthorized","duplicatePublicRecipeCreationAuthorized","protectedD1ReadAuthorized","protectedD1WriteAuthorized","protectedBodyRewriteAuthorized","knowledgeCoreWriteAuthorized","paidModelOrApiAuthorized","thirdShardAuthorized","barbecueMutationAuthorized"]) if(contract?.authority?.[key]!==false) errors.push("authority."+key);
  if(contract?.targetTerminal!==C4_UNITOOLS_DIFFICULTY_REUSE_TERMINAL) errors.push("targetTerminal");
  if(contract?.nextGate!=="C4_BOUNDED_P3_DUPLICATE_SAFE_ADMISSION_CONTRACT_V1") errors.push("nextGate");
  return [...new Set(errors)].sort();
}

export function buildC4UnitoolsDifficultyReuseReview({contract,design,step8f,sourceRecipe,publicRecipe,observedBlobSha}){
  const errors=validateC4UnitoolsDifficultyReuseContract(contract);
  if(errors.length) throw new Error("C4_UNITOOLS_DIFFICULTY_REUSE_CONTRACT_INVALID__"+errors.join(","));
  if(design?.pass!==true||design?.terminal!==DESIGN_TERMINAL) throw new Error("C4_UNITOOLS_DIFFICULTY_REUSE_DESIGN_REQUIRED");
  if(design?.firstRepair?.protectedRecipeKey!==contract.protectedRecipeKey) throw new Error("C4_UNITOOLS_DIFFICULTY_REUSE_DESIGN_KEY_MISMATCH");
  if(design?.firstRepair?.sourceCommit!==contract.sourceCommit||design?.firstRepair?.sourceDataBlobSha!==contract.sourceDataBlobSha) throw new Error("C4_UNITOOLS_DIFFICULTY_REUSE_DESIGN_PIN_MISMATCH");
  if(observedBlobSha!==contract.sourceDataBlobSha) throw new Error("C4_UNITOOLS_DIFFICULTY_REUSE_BLOB_MISMATCH");
  if(sourceRecipe?.slug!==contract.sourceSlug) throw new Error("C4_UNITOOLS_DIFFICULTY_REUSE_SOURCE_SLUG_MISMATCH");
  if(sourceRecipe?.difficulty!==contract.expectedSourceDifficultyLabel) throw new Error("C4_UNITOOLS_DIFFICULTY_REUSE_SOURCE_DIFFICULTY_MISMATCH");
  const mapped=contract.reviewedMapping[sourceRecipe.difficulty];
  if(mapped!==contract.expectedRuntimeDifficulty) throw new Error("C4_UNITOOLS_DIFFICULTY_REUSE_MAPPING_MISMATCH");
  if(step8f?.pass!==true||step8f?.terminal!==STEP8F_TERMINAL||step8f?.candidate?.canonicalRecipeId!==contract.existingPublicCanonicalRecipeId) throw new Error("C4_UNITOOLS_DIFFICULTY_REUSE_STEP8F_REQUIRED");
  if(step8f?.publicRuntime?.activatedCandidatePresent!==true) throw new Error("C4_UNITOOLS_DIFFICULTY_REUSE_PUBLIC_ACTIVATION_MISSING");
  if(publicRecipe?.id!==contract.existingPublicCanonicalRecipeId) throw new Error("C4_UNITOOLS_DIFFICULTY_REUSE_PUBLIC_RECIPE_ID_MISMATCH");
  if(publicRecipe?.provenance?.sourceItemId!==contract.sourceSlug) throw new Error("C4_UNITOOLS_DIFFICULTY_REUSE_PUBLIC_SOURCE_ITEM_MISMATCH");
  if(!String(publicRecipe?.provenance?.sourceVersionId||"").includes(contract.sourceCommit) || !String(publicRecipe?.provenance?.sourceVersionId||"").includes(contract.sourceDataBlobSha)) throw new Error("C4_UNITOOLS_DIFFICULTY_REUSE_PUBLIC_SOURCE_PIN_MISMATCH");
  if(publicRecipe?.culinary?.difficulty!==contract.expectedRuntimeDifficulty) throw new Error("C4_UNITOOLS_DIFFICULTY_REUSE_PUBLIC_DIFFICULTY_MISMATCH");
  if(publicRecipe?.governance?.runtimeActivationAuthorized!==true) throw new Error("C4_UNITOOLS_DIFFICULTY_REUSE_PUBLIC_NOT_ACTIVE");

  return {
    schemaVersion:C4_UNITOOLS_DIFFICULTY_REUSE_SUMMARY_SCHEMA,
    date:"2026-09-28",
    pass:true,
    terminal:C4_UNITOOLS_DIFFICULTY_REUSE_TERMINAL,
    protectedCorpusVersion:"v8018",
    protectedRecipeKey:contract.protectedRecipeKey,
    source:{
      cohortId:contract.sourceCohortId,
      slug:contract.sourceSlug,
      commit:contract.sourceCommit,
      dataBlobSha:contract.sourceDataBlobSha,
      difficultyLabel:sourceRecipe.difficulty
    },
    adapter:{
      reviewedMapping:{...contract.reviewedMapping},
      runtimeDifficulty:mapped,
      authorityScope:"EXACT_PINNED_UNITOOLS_TORTILLA_RECORD_ONLY",
      broaderSourceCohortAuthority:false
    },
    readiness:{
      previousProtectedRuntimeHardMetadataReadyCount:0,
      newProtectedRuntimeHardMetadataReadyCount:1,
      newlyReadyProtectedRecipeKeys:[contract.protectedRecipeKey],
      existingPublicCanonicalRecipeId:contract.existingPublicCanonicalRecipeId,
      sameCanonicalSourceRecordAlreadyPublic:true,
      netNewPublicRecipeCount:0
    },
    authority:{
      exactCandidateDifficultyAuthorityPromoted:true,
      protectedRecommendationAdmissionChanged:false,
      publicRuntimeChanged:false,
      broaderDifficultyAdapterPromoted:false
    },
    boundaries:{
      protectedD1Reads:0,
      protectedD1Writes:0,
      protectedBodiesRewritten:0,
      duplicatePublicRecipeCreated:false,
      mealRoleInferencePerformed:false,
      timeInferencePerformed:false,
      nutritionAuthorityPromoted:false,
      knowledgeCoreWritePerformed:false,
      paidModelOrApiUsed:false,
      thirdShardUsed:false,
      barbecueMutation:false
    },
    nextGate:contract.nextGate
  };
}

export function validateC4UnitoolsDifficultyReuseSummary(summary){
  const errors=[];
  if(summary?.schemaVersion!==C4_UNITOOLS_DIFFICULTY_REUSE_SUMMARY_SCHEMA) errors.push("schemaVersion");
  if(summary?.pass!==true||summary?.terminal!==C4_UNITOOLS_DIFFICULTY_REUSE_TERMINAL) errors.push("terminal");
  if(summary?.adapter?.runtimeDifficulty!==3||summary?.adapter?.broaderSourceCohortAuthority!==false) errors.push("adapter");
  if(summary?.readiness?.newProtectedRuntimeHardMetadataReadyCount!==1) errors.push("readyCount");
  if(JSON.stringify(summary?.readiness?.newlyReadyProtectedRecipeKeys||[])!==JSON.stringify(["unitools-world-recipes-v1_1_0::tortilla-espanola"])) errors.push("readyKeys");
  if(summary?.readiness?.sameCanonicalSourceRecordAlreadyPublic!==true||summary?.readiness?.netNewPublicRecipeCount!==0) errors.push("duplicateSafety");
  if(summary?.authority?.exactCandidateDifficultyAuthorityPromoted!==true||summary?.authority?.protectedRecommendationAdmissionChanged!==false||summary?.authority?.publicRuntimeChanged!==false) errors.push("authority");
  if(summary?.nextGate!=="C4_BOUNDED_P3_DUPLICATE_SAFE_ADMISSION_CONTRACT_V1") errors.push("nextGate");
  return errors;
}
