import { createHash } from "node:crypto";

export const C4_SCHEMA_VERSION = "CULINARY_BRAIN_C4_REAL_V8018_FAILURE_LOOP_V1";
export const C4_SUMMARY_SCHEMA_VERSION = "CULINARY_BRAIN_C4_REAL_V8018_FAILURE_MATRIX_SUMMARY_V1";
export const C4_TERMINAL = "CULINARY_BRAIN_C4_FAILURE_MATRIX_PASS__112_IDENTITY_READY_REPAIR_COHORT_FROZEN";
export const C4_NEXT_GATE = "C4_HARD_AUTHORITY_REPAIR_TRANCHE_V1";

const sha256 = value => createHash("sha256").update(String(value)).digest("hex");
const keyOf = row => String(row?.cohortId || row?.identity?.cohortId || "") + "::" + String(row?.sourceRecordKey || row?.identity?.sourceRecordKey || "");
const countBy = (rows, selector) => {
  const map = new Map();
  for (const row of rows) {
    const key = String(selector(row));
    map.set(key, (map.get(key) || 0) + 1);
  }
  return Object.fromEntries([...map.entries()].sort(([a],[b]) => a.localeCompare(b)));
};

export function validateC4Contract(contract) {
  const errors=[];
  if (contract?.schemaVersion !== C4_SCHEMA_VERSION) errors.push("schemaVersion");
  if (contract?.protectedCorpusVersion !== "v8018") errors.push("protectedCorpusVersion");
  if (contract?.expectedRecipeCount !== 19268) errors.push("expectedRecipeCount");
  if (contract?.expectedIdentityReadyCount !== 112) errors.push("expectedIdentityReadyCount");
  if (contract?.expectedStructuralExceptionCount !== 3) errors.push("expectedStructuralExceptionCount");
  if (contract?.entryTerminal !== "CULINARY_BRAIN_C3_PRIOR_CALIBRATION_PASS__NO_NEW_RUNTIME_PRIOR_PROMOTION__C4_READY") errors.push("entryTerminal");
  if (!Array.isArray(contract?.failureClasses) || contract.failureClasses.length !== 10 || new Set(contract.failureClasses).size !== 10) errors.push("failureClasses");
  if (contract?.targetTerminal !== C4_TERMINAL) errors.push("targetTerminal");
  if (contract?.nextGate !== C4_NEXT_GATE) errors.push("nextGate");
  for (const [key,value] of Object.entries(contract?.authority || {})) if (value !== false) errors.push("authority."+key);
  return errors;
}

function exactKeySet(rows, expected, label) {
  if (!Array.isArray(rows) || rows.length !== expected) throw new Error("C4_"+label+"_COUNT_MISMATCH");
  const keys = rows.map(keyOf);
  if (keys.some(key => key.startsWith("::") || key.endsWith("::"))) throw new Error("C4_"+label+"_IDENTITY_MISSING");
  if (new Set(keys).size !== expected) throw new Error("C4_"+label+"_DUPLICATE_IDENTITY");
  return new Set(keys);
}

function sameKeys(a,b) {
  if (a.size !== b.size) return false;
  for (const key of a) if (!b.has(key)) return false;
  return true;
}

function c2FieldCounts(rows, field) {
  return countBy(rows, row => row?.[field]?.disposition || "MISSING");
}

export function buildC4FailureMatrix({contract,nutritionFull,mappingFull,c2Full,c3Summary,readinessSummary}) {
  const contractErrors=validateC4Contract(contract);
  if (contractErrors.length) throw new Error("C4_CONTRACT_INVALID__"+contractErrors.join(","));
  const expected=contract.expectedRecipeCount;

  if (nutritionFull?.protectedCorpusVersion !== "v8018" || nutritionFull?.observedRecipeCount !== expected) {
    throw new Error("C4_NUTRITION_FULL_V8018_REQUIRED");
  }
  if (mappingFull?.protectedCorpusVersion !== "v8018" || mappingFull?.observedRecipeCount !== expected) {
    throw new Error("C4_MAPPING_FULL_V8018_REQUIRED");
  }
  if (c2Full?.protectedCorpusVersion !== "v8018" || c2Full?.recipeCount !== expected) {
    throw new Error("C4_C2_FULL_V8018_REQUIRED");
  }
  if (c3Summary?.terminal !== contract.entryTerminal || c3Summary?.pass !== true) {
    throw new Error("C4_C3_TERMINAL_REQUIRED");
  }
  if (c2Full?.digestSha256 !== c3Summary?.c2DigestSha256) {
    throw new Error("C4_C2_DIGEST_MISMATCH");
  }
  if (readinessSummary?.protectedCorpusVersion !== "v8018" || readinessSummary?.protectedCorpus?.recipeCount !== expected) {
    throw new Error("C4_READINESS_V8018_REQUIRED");
  }
  if (readinessSummary.protectedCorpus.automaticRecommendationReadyCount !== 0) {
    throw new Error("C4_EXPECTED_ZERO_AUTOMATIC_READY");
  }

  const diagnostics=nutritionFull.protectedCorpusRecipeDiagnostics;
  const overlays=mappingFull.overlays;
  const c2Rows=c2Full.rows;
  const diagKeys=exactKeySet(diagnostics,expected,"DIAGNOSTICS");
  const overlayKeys=exactKeySet(overlays,expected,"MAPPING");
  const c2Keys=new Set((Array.isArray(c2Rows)?c2Rows:[]).map(row=>row.recipeKey));
  if (c2Keys.size !== expected) throw new Error("C4_C2_IDENTITY_COUNT_MISMATCH");
  if (!sameKeys(diagKeys,overlayKeys) || !sameKeys(diagKeys,c2Keys)) throw new Error("C4_CROSS_ARTIFACT_IDENTITY_MISMATCH");

  const structuralKeys=(mappingFull.structuralExceptions || []).map(row=>String(row.cohortId)+"::"+String(row.sourceRecordKey)).sort();
  if (structuralKeys.length !== contract.expectedStructuralExceptionCount) throw new Error("C4_STRUCTURAL_EXCEPTION_COUNT_MISMATCH");

  const identityReady=diagnostics
    .filter(row=>row.allIngredientIdentitiesResolved === true && Number(row.ingredientOccurrenceCount) > 0)
    .map(row=>({recipeKey:keyOf(row),cohortId:row.cohortId,sourceSystem:row.sourceSystem,quantityModel:row.quantityModel}))
    .sort((a,b)=>a.recipeKey.localeCompare(b.recipeKey));
  if (identityReady.length !== contract.expectedIdentityReadyCount) throw new Error("C4_IDENTITY_READY_COUNT_MISMATCH_"+identityReady.length);

  const identityReadyKeys=identityReady.map(row=>row.recipeKey);
  const identityReadyDigestSha256=sha256(JSON.stringify(identityReadyKeys));
  const unresolvedIdentityCount=expected-identityReady.length;
  const reviewedDietaryAuthorityCount=Number(readinessSummary.protectedCorpus.reviewedDietaryAuthorityCount || 0);
  if (reviewedDietaryAuthorityCount !== 0) throw new Error("C4_DIETARY_AUTHORITY_BASELINE_CHANGED");

  const directNutritionReady=Number(readinessSummary.protectedCorpus.directCurrentEngineAuthoritativeNutritionCount || 0);
  const c2Dish=c2FieldCounts(c2Rows,"dishCategory");
  const c2Meal=c2FieldCounts(c2Rows,"mealRole");

  const failureMatrix={
    sourceProvenance:{
      state:"NO_CURRENT_MATERIAL_DEFECT",
      affectedRecipeCount:0,
      evidence:"Pinned source/cohort identity exists for all reconstructed v8018 records; P1/P2 separately proved protected provenance surface behavior."
    },
    identityNormalization:{
      state:"MATERIAL_BLOCKER",
      affectedRecipeCount:unresolvedIdentityCount,
      identityReadyRecipeCount:identityReady.length,
      evidence:"Recommendation hard filters cannot safely reason over unresolved ingredient identities."
    },
    hardDietaryAllergenAuthority:{
      state:"UNIVERSAL_HARD_BLOCKER",
      affectedRecipeCount:expected,
      reviewedDietaryAuthorityCount,
      evidence:"No protected recipe currently has reviewed dietary authority; allergen/dietary safety must not be inferred into authority by C4."
    },
    nutritionEvidence:{
      state:"SOFT_FEATURE_GAP_NOT_ADMISSION_HARD_BLOCKER",
      affectedRecipeCount:expected-directNutritionReady,
      directCurrentEngineAuthoritativeCount:directNutritionReady,
      evidence:"Unknown nutrition stays explicit and independent from protected recommendation admission."
    },
    brainClassificationCalibration:{
      state:"CALIBRATED_CANDIDATE_ONLY_NO_RUNTIME_PROMOTION",
      affectedRecipeCount:0,
      dishCategoryDispositionCounts:c2Dish,
      mealRoleDispositionCounts:c2Meal,
      evidence:"C2 candidates remain review aids; C3 promoted zero priors."
    },
    reconciliationAuthority:{
      state:"BLOCKED_BY_HARD_AUTHORITY",
      affectedRecipeCount:expected,
      automaticRecommendationReadyCount:0,
      evidence:"Candidate classification cannot create recommendation authority."
    },
    rankingPlanner:{
      state:"NOT_EXERCISED_FOR_PROTECTED_CORPUS__UPSTREAM_HARD_GATE",
      defectCount:0,
      blockedRecipeCount:expected,
      evidence:"Do not label ranking/planner defective before any protected cohort earns admission."
    },
    abstention:{
      state:"PASS_FAIL_CLOSED",
      affectedRecipeCount:0,
      evidence:"C1/C2/C3 preserve UNKNOWN/REVIEW/abstention and zero automatic promotion."
    },
    runtimePerformance:{
      state:"NO_CURRENT_MATERIAL_DEFECT",
      affectedRecipeCount:0,
      evidence:"P1/P2 bounded protected runtime passed without full scans and within the D1 request budget."
    },
    browserUx:{
      state:"NO_CURRENT_MATERIAL_DEFECT_FOR_PRIVATE_BROWSE_SEARCH",
      affectedRecipeCount:0,
      evidence:"Protected browse/search owner canary is terminal PASS; protected recommendation UX remains downstream of admission."
    }
  };

  const repairCohort={
    rule:"ALL_INGREDIENT_IDENTITIES_RESOLVED_AND_NONEMPTY__PINNED_V8018_ONLY",
    recipeCount:identityReady.length,
    digestSha256:identityReadyDigestSha256,
    cohortCounts:countBy(identityReady,row=>row.cohortId),
    sourceSystemCounts:countBy(identityReady,row=>row.sourceSystem),
    keys:identityReadyKeys
  };

  const summary={
    schemaVersion:C4_SUMMARY_SCHEMA_VERSION,
    date:"2026-09-27",
    pass:true,
    terminal:C4_TERMINAL,
    protectedCorpusVersion:"v8018",
    recipeCount:expected,
    c2DigestSha256:c2Full.digestSha256,
    c3MatrixDigestSha256:c3Summary.calibration.matrixDigestSha256,
    failureMatrix,
    repairCohort:{
      rule:repairCohort.rule,
      recipeCount:repairCohort.recipeCount,
      digestSha256:repairCohort.digestSha256,
      cohortCounts:repairCohort.cohortCounts,
      sourceSystemCounts:repairCohort.sourceSystemCounts
    },
    structuralExceptionCount:structuralKeys.length,
    boundaries:{
      protectedD1Reads:0,
      protectedD1Writes:0,
      protectedRuntimeBodyReads:0,
      protectedBodiesRewritten:0,
      publicRuntimeChanged:false,
      recommendationBehaviorChanged:false,
      recommendationAuthorityWidened:false,
      dietaryAllergenAuthorityPromoted:false,
      nutritionAuthorityPromoted:false,
      c2CandidatesPromoted:false,
      knowledgeCoreRuntimeDependencyAdded:false,
      knowledgeCoreWritePerformed:false,
      paidModelOrApiUsed:false,
      thirdShardUsed:false,
      barbecueMutation:false
    },
    nextGate:C4_NEXT_GATE
  };

  return {summary,full:{...summary,repairCohort,structuralExceptionKeys:structuralKeys}};
}

export function validateC4Summary(summary) {
  const errors=[];
  if (summary?.schemaVersion !== C4_SUMMARY_SCHEMA_VERSION) errors.push("schemaVersion");
  if (summary?.terminal !== C4_TERMINAL || summary?.pass !== true) errors.push("terminal");
  if (summary?.protectedCorpusVersion !== "v8018" || summary?.recipeCount !== 19268) errors.push("corpus");
  if (summary?.repairCohort?.recipeCount !== 112) errors.push("repairCohortCount");
  if (!/^[a-f0-9]{64}$/.test(summary?.repairCohort?.digestSha256 || "")) errors.push("repairCohortDigest");
  if (summary?.structuralExceptionCount !== 3) errors.push("structuralExceptionCount");
  if (summary?.failureMatrix?.hardDietaryAllergenAuthority?.state !== "UNIVERSAL_HARD_BLOCKER") errors.push("hardAuthority");
  if (summary?.failureMatrix?.rankingPlanner?.defectCount !== 0) errors.push("rankingPlanner");
  if (summary?.nextGate !== C4_NEXT_GATE) errors.push("nextGate");
  for (const [key,value] of Object.entries(summary?.boundaries || {})) {
    if (["protectedD1Reads","protectedD1Writes","protectedRuntimeBodyReads","protectedBodiesRewritten"].includes(key)) {
      if (value !== 0) errors.push("boundaries."+key);
    } else if (value !== false) errors.push("boundaries."+key);
  }
  return errors;
}
