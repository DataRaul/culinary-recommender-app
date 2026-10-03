import { createHash } from "node:crypto";
import { runtimeMealTypesFromCanonicalRoles } from "./protected-corpus-shadow-engine-quality-v1-core.mjs";

export const RELEVANCE_SCHEMA = "CULINARY_PROTECTED_CORPUS_SHADOW_RELEVANCE_ACCEPTANCE_V1";
export const RELEVANCE_SUMMARY_SCHEMA = "CULINARY_PROTECTED_CORPUS_SHADOW_RELEVANCE_ACCEPTANCE_SUMMARY_V1";
export const RELEVANCE_TERMINAL = "V21_FIRST_500_SHADOW_RELEVANCE_ACCEPTANCE_PASS__RUNTIME_ROLE_POLICY_NEXT";

const KNOWN = new Set(["EXACT_SOURCE_NORMALIZATION","REVIEWED_MAPPING"]);
const sha=value=>createHash("sha256").update(String(value)).digest("hex");
const keyOf=o=>`${o?.identity?.cohortId||""}::${o?.identity?.sourceRecordKey||""}`;
const known=node=>KNOWN.has(node?.state);
const countBy=(values)=>{
  const out={};
  for(const value of values) out[value]=(out[value]||0)+1;
  return Object.fromEntries(Object.entries(out).sort(([a],[b])=>a.localeCompare(b)));
};
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);

export function classifyMealRoleDisposition(overlay){
  const node=overlay?.canonical?.culinary?.mealRoles;
  if(!known(node)) return {disposition:"UNKNOWN_ROLE_HOLD",canonicalRoles:[],runtimeMealTypes:[]};
  const canonicalRoles=(Array.isArray(node.value)?node.value:[]).map(v=>String(v).toUpperCase()).sort();
  const runtimeMealTypes=runtimeMealTypesFromCanonicalRoles(overlay);
  return {
    disposition:runtimeMealTypes.length ? "DIRECT_RUNTIME_ROLE" : "NON_RUNTIME_ROLE_POLICY_HOLD",
    canonicalRoles,
    runtimeMealTypes
  };
}

export function obviousLexicalConflict({overlay,c2Row,config}){
  const meal=classifyMealRoleDisposition(overlay);
  const candidate=c2Row?.dishCategory;
  return candidate?.disposition==="REVIEW"
    && candidate?.candidateValue===config.obviousLexicalConflictPolicy.candidateDishCategory
    && meal.canonicalRoles.includes(config.obviousLexicalConflictPolicy.authoritativeMealRole);
}

export function summarizeRelevanceCohort({qualityFull,mapping,c2Full,config}){
  if(config?.schemaVersion!==RELEVANCE_SCHEMA) throw new Error("RELEVANCE_CONFIG_SCHEMA");
  if(qualityFull?.terminal!=="V21_SHADOW_ENGINE_QUALITY_PASS__FIRST_500_RELEVANCE_ACCEPTANCE_READY") throw new Error("RELEVANCE_ENTRY_TERMINAL");
  if(!Array.isArray(qualityFull?.qualityCohortRecipeKeys) || qualityFull.qualityCohortRecipeKeys.length!==config.qualityCohortSize) throw new Error("RELEVANCE_QUALITY_COHORT");
  if(sha(JSON.stringify(qualityFull.qualityCohortRecipeKeys))!==config.qualityCohortDigestSha256) throw new Error("RELEVANCE_QUALITY_DIGEST");
  if(mapping?.protectedCorpusVersion!=="v8018" || !Array.isArray(mapping?.overlays) || mapping.overlays.length!==19268) throw new Error("RELEVANCE_MAPPING");
  if(!Array.isArray(c2Full?.rows) || c2Full.rows.length!==19268) throw new Error("RELEVANCE_C2");

  const overlayMap=new Map(mapping.overlays.map(row=>[keyOf(row),row]));
  const c2Map=new Map(c2Full.rows.map(row=>[row.recipeKey,row]));
  const details=[];
  for(const recipeKey of qualityFull.qualityCohortRecipeKeys){
    const overlay=overlayMap.get(recipeKey), c2Row=c2Map.get(recipeKey);
    if(!overlay||!c2Row) throw new Error("RELEVANCE_JOIN_"+recipeKey);
    const role=classifyMealRoleDisposition(overlay);
    const dish=overlay?.canonical?.culinary?.dishCategory;
    const total=overlay?.canonical?.time?.totalMinutes;
    const difficulty=overlay?.canonical?.culinary?.difficulty;
    const servings=overlay?.canonical?.serving?.servings;
    details.push({
      recipeKey,
      sourceCohortId:overlay.identity.cohortId,
      role,
      canonicalDishCategoryReady:known(dish),
      candidateDishCategory:c2Row?.dishCategory?.disposition==="REVIEW" ? c2Row.dishCategory.candidateValue : null,
      candidateDishCategoryIsAuthority:false,
      obviousLexicalConflict:obviousLexicalConflict({overlay,c2Row,config}),
      totalTimeAuthority:known(total),
      sourceDifficultyEvidence:known(difficulty),
      runtimeDifficultyAuthority:false,
      servingsAuthority:known(servings)
    });
  }

  const roleDispositionCounts=countBy(details.map(row=>row.role.disposition));
  const directRuntimeMealTypeCounts=countBy(details.flatMap(row=>row.role.runtimeMealTypes));
  const canonicalRoleCounts=countBy(details.flatMap(row=>row.role.canonicalRoles));
  const sourceCounts=countBy(details.map(row=>row.sourceCohortId));
  const conflictKeys=details.filter(row=>row.obviousLexicalConflict).map(row=>row.recipeKey).sort();
  const top100RoleCounts=countBy((qualityFull.comparisonTop100||[]).flatMap(row=>{
    const overlay=overlayMap.get(row.recipeKey);
    const role=overlay ? classifyMealRoleDisposition(overlay) : {canonicalRoles:[]};
    return role.canonicalRoles.length ? role.canonicalRoles : ["UNKNOWN"];
  }));

  const summary={
    schemaVersion:RELEVANCE_SUMMARY_SCHEMA,
    date:"2026-10-03",
    pass:true,
    terminal:RELEVANCE_TERMINAL,
    protectedCorpusVersion:"v8018",
    qualityCohort:{
      size:details.length,
      digestSha256:config.qualityCohortDigestSha256,
      sourceCounts
    },
    mealRoleAudit:{
      directRuntimeRoleCount:roleDispositionCounts.DIRECT_RUNTIME_ROLE||0,
      nonRuntimeRolePolicyHoldCount:roleDispositionCounts.NON_RUNTIME_ROLE_POLICY_HOLD||0,
      unknownRoleHoldCount:roleDispositionCounts.UNKNOWN_ROLE_HOLD||0,
      directRuntimeMealTypeCounts,
      canonicalRoleCounts,
      mealTargetedShadowEligibleCount:roleDispositionCounts.DIRECT_RUNTIME_ROLE||0,
      mealTargetedShadowHeldCount:(roleDispositionCounts.NON_RUNTIME_ROLE_POLICY_HOLD||0)+(roleDispositionCounts.UNKNOWN_ROLE_HOLD||0),
      invalidRuntimeMealTypeLeakCount:details.filter(row=>row.role.runtimeMealTypes.some(v=>!config.runtimeMealTypeVocabulary.includes(v))).length
    },
    metadataAudit:{
      canonicalDishCategoryReadyCount:details.filter(row=>row.canonicalDishCategoryReady).length,
      candidateOnlyDishCategoryCount:details.filter(row=>row.candidateDishCategory!=null).length,
      candidateOnlyDishCategoryAuthorityCount:0,
      obviousLexicalConflictCount:conflictKeys.length,
      obviousLexicalConflictRecipeKeys:conflictKeys,
      totalTimeAuthorityCount:details.filter(row=>row.totalTimeAuthority).length,
      sourceDifficultyEvidenceCount:details.filter(row=>row.sourceDifficultyEvidence).length,
      runtimeDifficultyAuthorityCount:0,
      servingsAuthorityCount:details.filter(row=>row.servingsAuthority).length
    },
    broadRankingDiagnostic:{
      top100CanonicalRoleCounts:top100RoleCounts,
      liveAcceptanceAuthorized:false
    },
    disposition:{
      broadUnrestrictedShadowEvaluationMayContinue:true,
      mealTargetedDirectRoleShadowEvaluationMayContinue:true,
      progressiveLiveExposureAuthorized:false,
      runtimeMealRoleTranslationAuthorized:false,
      nonRuntimeCanonicalRolesRequirePolicy:true
    },
    boundaries:{
      protectedD1Reads:0,
      protectedD1Writes:0,
      protectedBodiesRewritten:0,
      publicRuntimeChanged:false,
      recommendationAdmissionChanged:false,
      recommendationAuthorityWidened:false,
      candidateClassificationPromoted:false,
      dietaryAllergenAuthorityPromoted:false,
      knowledgeCoreWritePerformed:false,
      paidModelOrApiUsed:false,
      thirdShardUsed:false,
      barbecueMutation:false
    },
    nextGate:config.nextGateOnPass
  };

  const expected=config.expectedRoleAudit;
  const meta=config.expectedMetadataAudit;
  const pass=
    same(sourceCounts,config.expectedSourceCounts)
    && summary.mealRoleAudit.directRuntimeRoleCount===expected.directRuntimeRoleCount
    && summary.mealRoleAudit.nonRuntimeRolePolicyHoldCount===expected.nonRuntimeRolePolicyHoldCount
    && summary.mealRoleAudit.unknownRoleHoldCount===expected.unknownRoleHoldCount
    && same(summary.mealRoleAudit.directRuntimeMealTypeCounts,expected.directRuntimeMealTypeCounts)
    && same(summary.mealRoleAudit.canonicalRoleCounts,expected.canonicalRoleCounts)
    && summary.mealRoleAudit.invalidRuntimeMealTypeLeakCount===0
    && summary.metadataAudit.canonicalDishCategoryReadyCount===meta.canonicalDishCategoryReadyCount
    && summary.metadataAudit.candidateOnlyDishCategoryCount===meta.candidateOnlyDishCategoryCount
    && summary.metadataAudit.obviousLexicalConflictCount===meta.obviousLexicalConflictCount
    && same(summary.metadataAudit.obviousLexicalConflictRecipeKeys,[...config.expectedObviousLexicalConflictRecipeKeys].sort())
    && summary.metadataAudit.totalTimeAuthorityCount===meta.totalTimeAuthorityCount
    && summary.metadataAudit.sourceDifficultyEvidenceCount===meta.sourceDifficultyEvidenceCount
    && summary.metadataAudit.servingsAuthorityCount===meta.servingsAuthorityCount;
  summary.pass=pass;
  summary.terminal=pass ? RELEVANCE_TERMINAL : "V21_FIRST_500_SHADOW_RELEVANCE_ACCEPTANCE_FAIL";
  summary.nextGate=pass ? config.nextGateOnPass : "REPAIR_V21_FIRST_500_RELEVANCE_ACCEPTANCE";
  return {summary,details};
}

export function validateRelevanceSummary(summary,config){
  const errors=[];
  if(summary?.schemaVersion!==RELEVANCE_SUMMARY_SCHEMA) errors.push("schemaVersion");
  if(summary?.pass!==true || summary?.terminal!==RELEVANCE_TERMINAL) errors.push("terminal");
  if(summary?.qualityCohort?.size!==config.qualityCohortSize || summary?.qualityCohort?.digestSha256!==config.qualityCohortDigestSha256) errors.push("qualityCohort");
  if(summary?.mealRoleAudit?.invalidRuntimeMealTypeLeakCount!==0) errors.push("runtimeMealTypeLeak");
  if(summary?.mealRoleAudit?.directRuntimeRoleCount!==config.expectedRoleAudit.directRuntimeRoleCount) errors.push("directRuntimeRoleCount");
  if(summary?.mealRoleAudit?.mealTargetedShadowHeldCount!==config.expectedRoleAudit.nonRuntimeRolePolicyHoldCount+config.expectedRoleAudit.unknownRoleHoldCount) errors.push("mealTargetedHoldCount");
  if(summary?.metadataAudit?.candidateOnlyDishCategoryAuthorityCount!==0) errors.push("candidateDishAuthority");
  if(summary?.metadataAudit?.runtimeDifficultyAuthorityCount!==0) errors.push("runtimeDifficultyAuthority");
  if(summary?.disposition?.progressiveLiveExposureAuthorized!==false || summary?.disposition?.runtimeMealRoleTranslationAuthorized!==false) errors.push("authority");
  for(const [key,value] of Object.entries(summary?.boundaries||{})){
    if(["protectedD1Reads","protectedD1Writes","protectedBodiesRewritten"].includes(key)){ if(value!==0) errors.push("boundaries."+key); }
    else if(value!==false) errors.push("boundaries."+key);
  }
  return errors;
}
