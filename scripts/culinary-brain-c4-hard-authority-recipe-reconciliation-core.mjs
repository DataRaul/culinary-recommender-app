import { createHash } from "node:crypto";

export const C4_RECONCILIATION_SCHEMA="CULINARY_BRAIN_C4_HARD_AUTHORITY_RECIPE_RECONCILIATION_V1";
export const C4_RECONCILIATION_SUMMARY_SCHEMA="CULINARY_BRAIN_C4_HARD_AUTHORITY_RECIPE_RECONCILIATION_SUMMARY_V1";
export const C4_RECONCILIATION_TERMINAL="CULINARY_BRAIN_C4_HARD_AUTHORITY_RECIPE_RECONCILIATION_PASS";
const POLICY_TERMINAL="CULINARY_BRAIN_C4_HARD_AUTHORITY_POLICY_REVIEW_PASS__100_POLICY_COMPLETE_CANDIDATES__RECONCILIATION_READY";
const MAPPING_TERMINAL="CORPUS_NORMALIZATION_CATEGORIZATION_MAPPING_V1_PASS";
const authoritativeState=value=>["EXACT_SOURCE_NORMALIZATION","REVIEWED_MAPPING"].includes(value);
const keyOfIdentity=identity=>String(identity?.cohortId||"")+"::"+String(identity?.sourceRecordKey||"");
const sortedUnique=values=>[...new Set(values)].sort();
const countBy=(rows,fn)=>{
  const map=new Map();
  for(const row of rows){
    const key=String(fn(row));
    map.set(key,(map.get(key)||0)+1);
  }
  return Object.fromEntries([...map.entries()].sort(([a],[b])=>a.localeCompare(b)));
};
const digest=value=>createHash("sha256").update(JSON.stringify(value)).digest("hex");

export function validateC4ReconciliationContract(contract){
  const errors=[];
  if(contract?.schemaVersion!==C4_RECONCILIATION_SCHEMA) errors.push("schemaVersion");
  if(contract?.protectedCorpusVersion!=="v8018") errors.push("protectedCorpusVersion");
  if(contract?.entryTerminal!==POLICY_TERMINAL) errors.push("entryTerminal");
  if(contract?.expectedRepairCohortCount!==112) errors.push("expectedRepairCohortCount");
  if(contract?.expectedPolicyCompleteCandidateCount!==100) errors.push("expectedPolicyCompleteCandidateCount");
  if(contract?.expectedPolicyHeldRecipeCount!==12) errors.push("expectedPolicyHeldRecipeCount");
  if(!/^[a-f0-9]{64}$/.test(contract?.expectedRepairCohortDigestSha256||"")) errors.push("repairDigest");
  if(contract?.targetTerminal!==C4_RECONCILIATION_TERMINAL) errors.push("targetTerminal");
  if(contract?.nextGateOnZeroRuntimeReady!=="C4_REMAINING_HARD_METADATA_REPAIR_DESIGN_V1") errors.push("zeroNextGate");
  if(contract?.nextGateOnPositiveRuntimeReady!=="C4_BOUNDED_P3_ADMISSION_CONTRACT_V1") errors.push("positiveNextGate");
  if(contract?.semantics?.sourceDifficultyEvidenceIsNotRuntimeDifficultyAuthority!==true) errors.push("difficultyBoundary");
  if(contract?.semantics?.unknownOrAmbiguousHardMetadataFailsClosed!==true) errors.push("failClosed");
  for(const [key,value] of Object.entries(contract?.authority||{})) if(value!==false) errors.push("authority."+key);
  return sortedUnique(errors);
}

export function inspectRemainingHardMetadata({overlay,structuralException=false,provenanceAvailable=false}){
  const meal=overlay?.canonical?.culinary?.mealRoles;
  const total=overlay?.canonical?.time?.totalMinutes;
  const difficulty=overlay?.canonical?.culinary?.difficulty;
  const mealRoleReady=authoritativeState(meal?.state)&&Array.isArray(meal?.value)&&meal.value.length>0;
  const totalMinutesReady=authoritativeState(total?.state)&&typeof total?.value==="number"&&Number.isFinite(total.value)&&total.value>=0;
  const difficultySourceEvidencePresent=authoritativeState(difficulty?.state)&&difficulty?.value!=null;
  const runtimeDifficultyReady=false;
  const instructionsReady=!structuralException;
  const provenanceReady=provenanceAvailable===true;
  const blockers=[];
  if(!mealRoleReady) blockers.push("MEAL_ROLE_AUTHORITY_MISSING");
  if(!runtimeDifficultyReady) blockers.push(difficultySourceEvidencePresent
    ?"RUNTIME_DIFFICULTY_SCALE_ADAPTER_NOT_AUTHORIZED"
    :"DIFFICULTY_AUTHORITY_MISSING");
  if(!totalMinutesReady) blockers.push("TOTAL_MINUTES_AUTHORITY_MISSING");
  if(!instructionsReady) blockers.push("INSTRUCTIONS_STRUCTURAL_EXCEPTION");
  if(!provenanceReady) blockers.push("SOURCE_PROVENANCE_AUTHORITY_MISSING");
  const readyExceptDifficulty=mealRoleReady&&totalMinutesReady&&instructionsReady&&provenanceReady;
  return {
    mealRoleReady,
    mealRoleState:meal?.state||"MISSING",
    mealRoles:mealRoleReady?[...meal.value]:[],
    totalMinutesReady,
    totalMinutesState:total?.state||"MISSING",
    totalMinutes:totalMinutesReady?total.value:null,
    difficultySourceEvidencePresent,
    difficultyState:difficulty?.state||"MISSING",
    difficultySourceValue:difficultySourceEvidencePresent?difficulty.value:null,
    runtimeDifficultyReady,
    instructionsReady,
    provenanceReady,
    readyExceptDifficulty,
    runtimeHardMetadataReady:blockers.length===0,
    blockers
  };
}

export function buildC4RecipeReconciliation({contract,policyFull,mappingFull,p2Measurement}){
  const contractErrors=validateC4ReconciliationContract(contract);
  if(contractErrors.length) throw new Error("C4_RECONCILIATION_CONTRACT_INVALID__"+contractErrors.join(","));
  if(policyFull?.terminal!==contract.entryTerminal||policyFull?.pass!==true) throw new Error("C4_RECONCILIATION_POLICY_TERMINAL_REQUIRED");
  if(policyFull?.repairCohortCount!==contract.expectedRepairCohortCount) throw new Error("C4_RECONCILIATION_REPAIR_COUNT_MISMATCH");
  if(policyFull?.repairCohortDigestSha256!==contract.expectedRepairCohortDigestSha256) throw new Error("C4_RECONCILIATION_REPAIR_DIGEST_MISMATCH");
  if(policyFull?.policyCompleteRecipeCandidateCount!==contract.expectedPolicyCompleteCandidateCount||policyFull?.policyHeldRecipeCount!==contract.expectedPolicyHeldRecipeCount) {
    throw new Error("C4_RECONCILIATION_POLICY_COUNTS_MISMATCH");
  }
  if(mappingFull?.terminal!==MAPPING_TERMINAL||mappingFull?.pass!==true||mappingFull?.protectedCorpusVersion!=="v8018"||mappingFull?.observedRecipeCount!==19268) {
    throw new Error("C4_RECONCILIATION_FULL_MAPPING_REQUIRED");
  }
  if(!Array.isArray(mappingFull?.overlays)||mappingFull.overlays.length!==19268) throw new Error("C4_RECONCILIATION_OVERLAYS_REQUIRED");
  const provenance=p2Measurement?.supplementalDiagnostics?.sourceProvenance;
  const provenanceAvailable=provenance?.authoritativeRecipeCount===19268&&provenance?.authoritativeCoverage===1;
  if(!provenanceAvailable) throw new Error("C4_RECONCILIATION_PROVENANCE_BASELINE_REQUIRED");
  if(!Array.isArray(policyFull?.recipeRows)||policyFull.recipeRows.length!==112) throw new Error("C4_RECONCILIATION_POLICY_RECIPE_ROWS_REQUIRED");

  const overlays=new Map(mappingFull.overlays.map(row=>[keyOfIdentity(row.identity),row]));
  if(overlays.size!==19268) throw new Error("C4_RECONCILIATION_OVERLAY_IDENTITY_COLLISION");
  const structuralExceptions=new Set((mappingFull.structuralExceptions||[]).map(row=>keyOfIdentity(row)));
  const candidates=policyFull.recipeRows.filter(row=>row.policyComplete===true).sort((a,b)=>a.recipeKey.localeCompare(b.recipeKey));
  if(candidates.length!==contract.expectedPolicyCompleteCandidateCount) throw new Error("C4_RECONCILIATION_CANDIDATE_COUNT_MISMATCH_"+candidates.length);

  const rows=candidates.map(candidate=>{
    const overlay=overlays.get(candidate.recipeKey);
    if(!overlay) throw new Error("C4_RECONCILIATION_OVERLAY_MISSING__"+candidate.recipeKey);
    const hard=inspectRemainingHardMetadata({
      overlay,
      structuralException:structuralExceptions.has(candidate.recipeKey),
      provenanceAvailable
    });
    return {
      recipeKey:candidate.recipeKey,
      sourceSystem:candidate.recipeKey.split("::")[0]===overlay.identity.cohortId?overlay.identity.sourceSystem:overlay.identity.sourceSystem,
      cohortId:overlay.identity.cohortId,
      candidateDeclaredAllergens:[...(candidate.candidateDeclaredAllergens||[])],
      candidateDietaryTags:[...(candidate.candidateDietaryTags||[])],
      ingredientPolicyReady:true,
      dietaryAllergenPolicyReady:Array.isArray(candidate.candidateDeclaredAllergens)&&Array.isArray(candidate.candidateDietaryTags)&&candidate.candidateDietaryTags.includes("unrestricted"),
      ...hard
    };
  });

  const runtimeReady=rows.filter(row=>row.runtimeHardMetadataReady);
  const readyExceptDifficulty=rows.filter(row=>row.readyExceptDifficulty);
  const blockerCounts={};
  for(const row of rows) for(const blocker of row.blockers) blockerCounts[blocker]=(blockerCounts[blocker]||0)+1;
  const sourceSystemCounts=countBy(rows,row=>row.sourceSystem);
  const summary={
    schemaVersion:C4_RECONCILIATION_SUMMARY_SCHEMA,
    date:"2026-09-27",
    pass:true,
    terminal:C4_RECONCILIATION_TERMINAL,
    protectedCorpusVersion:"v8018",
    repairCohortCount:contract.expectedRepairCohortCount,
    repairCohortDigestSha256:contract.expectedRepairCohortDigestSha256,
    policyCompleteCandidateCount:rows.length,
    policyHeldRecipeCount:contract.expectedPolicyHeldRecipeCount,
    ingredientPolicyReadyCount:rows.filter(row=>row.ingredientPolicyReady).length,
    dietaryAllergenPolicyReadyCount:rows.filter(row=>row.dietaryAllergenPolicyReady).length,
    mealRoleAuthorityReadyCount:rows.filter(row=>row.mealRoleReady).length,
    sourceDifficultyEvidencePresentCount:rows.filter(row=>row.difficultySourceEvidencePresent).length,
    runtimeDifficultyReadyCount:rows.filter(row=>row.runtimeDifficultyReady).length,
    totalMinutesAuthorityReadyCount:rows.filter(row=>row.totalMinutesReady).length,
    instructionsReadyCount:rows.filter(row=>row.instructionsReady).length,
    provenanceReadyCount:rows.filter(row=>row.provenanceReady).length,
    readyExceptDifficultyCount:readyExceptDifficulty.length,
    runtimeHardMetadataReadyCount:runtimeReady.length,
    blockerCounts:Object.fromEntries(Object.entries(blockerCounts).sort(([a],[b])=>a.localeCompare(b))),
    sourceSystemCounts,
    candidateRecipeKeyDigestSha256:digest(rows.map(row=>row.recipeKey)),
    runtimeReadyRecipeKeyDigestSha256:digest(runtimeReady.map(row=>row.recipeKey)),
    runtimeReadyRecipeKeys:runtimeReady.map(row=>row.recipeKey),
    authorityPromoted:false,
    recommendationAdmissionChanged:false,
    interpretation:{
      policyCompleteDoesNotMeanRecommendationReady:true,
      sourceDifficultyEvidenceDoesNotEqualRuntimeDifficultyAuthority:true,
      emptyAllergenListIsNotGlobalAllergenFreeProof:true,
      nutritionIndependent:true,
      unknownHardMetadataFailsClosed:true
    },
    boundaries:{
      protectedD1Reads:0,
      protectedD1Writes:0,
      protectedBodiesRewritten:0,
      publicRuntimeChanged:false,
      recommendationBehaviorChanged:false,
      recommendationAdmissionChanged:false,
      difficultyScaleMappingPromoted:false,
      mealRoleInferencePerformed:false,
      timeInferenceBeyondExistingReviewedNormalizationPerformed:false,
      nutritionAuthorityPromoted:false,
      knowledgeCoreWritePerformed:false,
      paidModelOrApiUsed:false,
      thirdShardUsed:false,
      barbecueMutation:false
    },
    nextGate:runtimeReady.length===0?contract.nextGateOnZeroRuntimeReady:contract.nextGateOnPositiveRuntimeReady
  };
  return {summary,full:{...summary,recipeRows:rows}};
}

export function validateC4RecipeReconciliationSummary(summary){
  const errors=[];
  if(summary?.schemaVersion!==C4_RECONCILIATION_SUMMARY_SCHEMA) errors.push("schemaVersion");
  if(summary?.pass!==true||summary?.terminal!==C4_RECONCILIATION_TERMINAL) errors.push("terminal");
  if(summary?.policyCompleteCandidateCount!==100||summary?.policyHeldRecipeCount!==12) errors.push("policyCounts");
  if(summary?.ingredientPolicyReadyCount!==100||summary?.dietaryAllergenPolicyReadyCount!==100) errors.push("policyReadiness");
  if(summary?.provenanceReadyCount!==100) errors.push("provenance");
  if(summary?.runtimeDifficultyReadyCount!==0) errors.push("difficultyAuthorityLeak");
  if(summary?.authorityPromoted!==false||summary?.recommendationAdmissionChanged!==false) errors.push("authority");
  if(summary?.interpretation?.unknownHardMetadataFailsClosed!==true) errors.push("failClosed");
  if(!["C4_REMAINING_HARD_METADATA_REPAIR_DESIGN_V1","C4_BOUNDED_P3_ADMISSION_CONTRACT_V1"].includes(summary?.nextGate)) errors.push("nextGate");
  return errors;
}
