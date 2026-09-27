import { createHash } from "node:crypto";

export const C3_SCHEMA_VERSION = "CULINARY_BRAIN_C3_DETERMINISTIC_PRIOR_CALIBRATION_V1";
export const C3_SUMMARY_SCHEMA_VERSION = "CULINARY_BRAIN_C3_DETERMINISTIC_PRIOR_CALIBRATION_SUMMARY_V1";
export const C3_TERMINAL = "CULINARY_BRAIN_C3_PRIOR_CALIBRATION_PASS__NO_NEW_RUNTIME_PRIOR_PROMOTION__C4_READY";

const hash = value => createHash("sha256").update(String(value)).digest("hex");

function stableRankingSnapshot(ranked) {
  return {
    eligible: ranked.eligible.map(item=>({
      id:item.recipe.id,
      score:item.score,
      baseScore:item.baseScore,
      priorityPackBonus:item.priorityPackBonus,
      unavailableSoftSignals:item.evidence?.unavailableSoftSignals || []
    })),
    rejected: ranked.rejected.map(item=>({
      id:item.recipe.id,
      hardReasons:[...(item.hardReasons || [])].sort()
    }))
  };
}

function hardViolationCount(snapshot, recipeById, profile, context) {
  let count=0;
  for (const item of snapshot.eligible) {
    const recipe=recipeById.get(item.id);
    if (!recipe) { count++; continue; }
    if (context?.mealType && !recipe.culinary?.mealTypes?.includes(context.mealType)) count++;
    if (profile.dietaryMode !== "unrestricted" && !recipe.dietaryTags?.includes(profile.dietaryMode)) count++;
    if (recipe.culinary?.difficulty > profile.skill) count++;
    if (Number.isFinite(recipe.time?.totalMinutes) && recipe.time.totalMinutes > profile.maxMinutes) count++;
    const allergens=new Set(profile.allergens || []);
    if ((recipe.allergySafety?.declaredAllergens || []).some(x=>allergens.has(x))) count++;
  }
  return count;
}

export function validateC3Contract(contract) {
  const errors=[];
  if (contract?.schemaVersion !== C3_SCHEMA_VERSION) errors.push("schemaVersion");
  if (contract?.protectedCorpusVersion !== "v8018" || contract?.expectedProtectedRecipeCount !== 19268) errors.push("protectedCorpus");
  if (contract?.goldenPublicRuntimeRecipeCount !== 85) errors.push("goldenRuntime");
  if (contract?.entryTerminal !== "CULINARY_BRAIN_C2_FULL_V8018_CANDIDATE_CLASSIFICATION_PASS") errors.push("entryTerminal");
  if (!Array.isArray(contract?.profileCases) || contract.profileCases.length !== 12) errors.push("profileCases");
  if (new Set((contract?.profileCases||[]).map(row=>row.id)).size !== 12) errors.push("profileCaseIds");
  for (const field of ["dishCategory","mealRole"]) {
    if (contract?.fieldCalibration?.[field]?.decision !== "HOLD_NO_PRIOR_PROMOTION") errors.push("fieldCalibration."+field);
  }
  for (const [key,value] of Object.entries(contract?.authority || {})) if (value !== false) errors.push("authority."+key);
  return errors;
}

export function runC3Calibration({
  recipes,
  contract,
  c2Summary,
  brainPolicy,
  rankRecipes,
  normalizeProfile,
  recommendationSource
}) {
  const contractErrors=validateC3Contract(contract);
  if (contractErrors.length) throw new Error("C3_CONTRACT_INVALID__"+contractErrors.join(","));
  if (!Array.isArray(recipes) || recipes.length !== 85 || new Set(recipes.map(r=>r.id)).size !== 85) {
    throw new Error("C3_EXACT_85_PUBLIC_RUNTIME_REQUIRED");
  }
  if (c2Summary?.terminal !== contract.entryTerminal || c2Summary?.pass !== true || c2Summary?.recipeCount !== 19268) {
    throw new Error("C3_C2_TERMINAL_EVIDENCE_REQUIRED");
  }
  if (brainPolicy?.status !== contract.brainPolicy.requiredStatus
      || brainPolicy?.knowledgeCore?.domain !== contract.brainPolicy.knowledgeCoreDomain
      || brainPolicy?.knowledgeCore?.commit !== contract.brainPolicy.knowledgeCoreCommit) {
    throw new Error("C3_BRAIN_POLICY_PIN_MISMATCH");
  }
  if (/brain-public-policy-v1|BRAIN_PUBLIC_POLICY_V1/.test(String(recommendationSource||""))) {
    throw new Error("C3_RUNTIME_BRAIN_POLICY_IMPORT_DETECTED");
  }

  const recipeById=new Map(recipes.map(recipe=>[recipe.id,recipe]));
  const matrix=[];
  let hardConstraintViolations=0;
  let deterministicMismatchCount=0;
  let unknownNutritionNonNumericCases=0;

  for (const row of contract.profileCases) {
    const profile=normalizeProfile(row.profile || {});
    const first=stableRankingSnapshot(rankRecipes(recipes,profile,row.context || {}));
    const second=stableRankingSnapshot(rankRecipes(recipes,profile,row.context || {}));
    const firstDigest=hash(JSON.stringify(first));
    const secondDigest=hash(JSON.stringify(second));
    if (firstDigest !== secondDigest) deterministicMismatchCount++;
    hardConstraintViolations += hardViolationCount(first,recipeById,profile,row.context || {});
    unknownNutritionNonNumericCases += first.eligible.filter(item=>
      Array.isArray(item.unavailableSoftSignals)
      && item.unavailableSoftSignals.includes("nutrition")
      && item.unavailableSoftSignals.includes("protein")
    ).length;
    matrix.push({
      id:row.id,
      context:row.context || {},
      eligibleCount:first.eligible.length,
      rejectedCount:first.rejected.length,
      top10:first.eligible.slice(0,10).map(item=>({id:item.id,score:item.score})),
      rankingDigestSha256:firstDigest
    });
  }

  const matrixDigestSha256=hash(JSON.stringify(matrix));
  const priorDecisions=Object.entries(contract.fieldCalibration).map(([field,row])=>({
    field,
    c2State:row.c2State,
    currentRecommendationSignal:row.currentRecommendationSignal,
    decision:row.decision,
    reason:row.reason
  }));
  const promotedPriorCount=priorDecisions.filter(row=>row.decision==="PROMOTE").length;

  const summary={
    schemaVersion:C3_SUMMARY_SCHEMA_VERSION,
    date:"2026-09-27",
    pass: deterministicMismatchCount===0 && hardConstraintViolations===0 && promotedPriorCount===0,
    terminal:C3_TERMINAL,
    protectedCorpusVersion:"v8018",
    publicRuntimeRecipeCount:85,
    c2DigestSha256:c2Summary.fullClassificationDigestSha256,
    brainPolicy:{
      id:brainPolicy.id,
      status:brainPolicy.status,
      knowledgeCoreDomain:brainPolicy.knowledgeCore.domain,
      knowledgeCoreCommit:brainPolicy.knowledgeCore.commit,
      runtimeDependency:brainPolicy.knowledgeCore.runtimeDependency
    },
    calibration:{
      profileCaseCount:matrix.length,
      matrixDigestSha256,
      deterministicMismatchCount,
      hardConstraintViolations,
      unknownNutritionNonNumericCases,
      priorDecisions,
      promotedPriorCount,
      scorerDisposition:"CURRENT_DETERMINISTIC_SCORER_RETAINED_UNCHANGED",
      interpretation:"C3 calibrates the safe prior-admission boundary. C2 review-only fields do not earn runtime ranking influence; current deterministic scoring remains the baseline."
    },
    matrix:matrix.map(row=>({
      id:row.id,
      context:row.context,
      eligibleCount:row.eligibleCount,
      rejectedCount:row.rejectedCount,
      rankingDigestSha256:row.rankingDigestSha256
    })),
    boundaries:{
      protectedD1Reads:0,
      protectedD1Writes:0,
      protectedBodiesReadOrExported:0,
      publicRuntimeChanged:false,
      recommendationBehaviorChanged:false,
      recommendationAuthorityWidened:false,
      c2CandidatesPromoted:false,
      nutritionAuthorityChanged:false,
      dietaryAllergenAuthorityChanged:false,
      sourceRightsAuthorityChanged:false,
      knowledgeCoreRuntimeDependencyAdded:false,
      knowledgeCoreWritePerformed:false,
      paidModelOrApiUsed:false,
      thirdShardUsed:false,
      barbecueMutation:false
    },
    nextGate:"C4_REAL_V8018_FAILURE_REPAIR_LOOP"
  };
  if (!summary.pass) throw new Error("C3_CALIBRATION_FAIL__"+JSON.stringify({deterministicMismatchCount,hardConstraintViolations,promotedPriorCount}));
  return summary;
}

export function validateC3Summary(summary) {
  const errors=[];
  if (summary?.schemaVersion !== C3_SUMMARY_SCHEMA_VERSION) errors.push("schemaVersion");
  if (summary?.terminal !== C3_TERMINAL || summary?.pass !== true) errors.push("terminal");
  if (summary?.protectedCorpusVersion !== "v8018" || summary?.publicRuntimeRecipeCount !== 85) errors.push("corpus");
  if (summary?.calibration?.profileCaseCount !== 12) errors.push("profileCaseCount");
  if (!/^[a-f0-9]{64}$/.test(summary?.calibration?.matrixDigestSha256 || "")) errors.push("matrixDigest");
  if (summary?.calibration?.deterministicMismatchCount !== 0) errors.push("determinism");
  if (summary?.calibration?.hardConstraintViolations !== 0) errors.push("hardConstraintViolations");
  if (summary?.calibration?.promotedPriorCount !== 0) errors.push("promotedPriorCount");
  if (summary?.calibration?.scorerDisposition !== "CURRENT_DETERMINISTIC_SCORER_RETAINED_UNCHANGED") errors.push("scorerDisposition");
  for (const row of summary?.calibration?.priorDecisions || []) if (row.decision !== "HOLD_NO_PRIOR_PROMOTION") errors.push("priorDecision");
  for (const [key,value] of Object.entries(summary?.boundaries || {})) {
    if (["protectedD1Reads","protectedD1Writes","protectedBodiesReadOrExported"].includes(key)) {
      if (value !== 0) errors.push("boundaries."+key);
    } else if (value !== false) errors.push("boundaries."+key);
  }
  if (summary?.nextGate !== "C4_REAL_V8018_FAILURE_REPAIR_LOOP") errors.push("nextGate");
  return errors;
}
