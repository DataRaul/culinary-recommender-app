import { OWNER_CANARY_FIXED_PROFILE_V1 } from "./protected-corpus-limited-evidence-secondary-lane-owner-canary-manifest-v1.mjs";
import { OWNER_SECONDARY_ROLLOUT_META_V1, ownerSecondaryRankedRows } from "./protected-corpus-limited-evidence-secondary-lane-owner-rollout-manifest-v1.mjs";

export const OWNER_SECONDARY_MODE="limited_evidence_secondary";
export const OWNER_SECONDARY_LANE_LABEL="Limited-evidence suggestions";
export const OWNER_SECONDARY_DISCLOSURE="These suggestions use incomplete soft metadata. Nutrition, protein, budget, meal-prep suitability, and novelty may be unknown.";
export const OWNER_SECONDARY_VALIDATION_STATE="LIMITED_EVIDENCE_NOT_PRIMARY_VALIDATED";
export const OWNER_SECONDARY_UNKNOWN_SOFT_SIGNALS=Object.freeze(["nutrition","protein","budget","mealPrep","novelty"]);
const MEALS=new Set(["breakfast","lunch","dinner","snack"]);
const arraysEqual=(a,b)=>Array.isArray(a)&&Array.isArray(b)&&JSON.stringify(a)===JSON.stringify(b);
export function ownerSecondaryFeatureEnabled(env={}){return String(env?.CULINARY_LIMITED_EVIDENCE_SECONDARY_LANE_V1??"1").trim()!=="0";}
export function validateOwnerSecondaryRequest(input={}){
  const errors=[],profile=input?.profile||{},mealType=String(input?.mealType||"").trim().toLowerCase();
  if(input?.mode!==OWNER_SECONDARY_MODE) errors.push("MODE_NOT_EXPLICIT");
  if(!MEALS.has(mealType)) errors.push("UNSUPPORTED_MEAL_TYPE");
  for(const key of ["budget","nutritionPriority","speed","skill","variety","proteinEmphasis","mealPrep","maxMinutes"]) if(Number(profile?.[key])!==Number(OWNER_CANARY_FIXED_PROFILE_V1[key])) errors.push("PROFILE_"+key);
  if(profile?.dietaryMode!==OWNER_CANARY_FIXED_PROFILE_V1.dietaryMode) errors.push("PROFILE_dietaryMode");
  for(const key of ["cuisinePreferences","priorityPacks","allergens","excludedIngredientIds","unavailableIngredientIds","currentPantryIngredientIds","pantryStapleIds"]) if(!arraysEqual(profile?.[key],OWNER_CANARY_FIXED_PROFILE_V1[key])) errors.push("PROFILE_"+key);
  const parsedLimit=Number(input?.limit),limit=Number.isInteger(parsedLimit)&&parsedLimit>0?Math.min(OWNER_SECONDARY_ROLLOUT_META_V1.maximumResultsPerRequest,parsedLimit):OWNER_SECONDARY_ROLLOUT_META_V1.maximumResultsPerRequest;
  const parsedCursor=Number(input?.cursor??0),offset=Number.isInteger(parsedCursor)&&parsedCursor>=0?parsedCursor:0;
  return {pass:errors.length===0,errors,mealType,limit,offset};
}
function disabledLane(reason){return {pass:false,reason,candidateUniverseCount:OWNER_SECONDARY_ROLLOUT_META_V1.candidateUniverseCount,primaryRuntimeRecipeCount:OWNER_SECONDARY_ROLLOUT_META_V1.primaryRuntimeRecipeCount,secondaryLane:{enabled:false,label:OWNER_SECONDARY_LANE_LABEL,disclosure:OWNER_SECONDARY_DISCLOSURE,unknownSoftSignals:[...OWNER_SECONDARY_UNKNOWN_SOFT_SIGNALS],recommendationValidationState:OWNER_SECONDARY_VALIDATION_STATE,mayDisplacePrimary:false,results:[],nextCursor:null},metrics:{d1Subqueries:0,fullCorpusScans:0,rowsWritten:0}};}
export async function executeOwnerSecondaryRollout({request,featureEnabled=false,hydrateTopK}){
  if(!featureEnabled) return disabledLane("OWNER_SECONDARY_FEATURE_DISABLED");
  const validation=validateOwnerSecondaryRequest(request);
  if(!validation.pass) return disabledLane("OWNER_SECONDARY_REQUEST_INVALID__"+validation.errors.join(","));
  if(typeof hydrateTopK!=="function") throw new Error("OWNER_SECONDARY_HYDRATOR_REQUIRED");
  const ranking=ownerSecondaryRankedRows(validation.mealType);
  if(ranking.length!==OWNER_SECONDARY_ROLLOUT_META_V1.eligibleCounts[validation.mealType]) throw new Error("OWNER_SECONDARY_RANKING_MANIFEST_INVALID");
  const selected=ranking.slice(validation.offset,validation.offset+validation.limit);
  if(selected.length===0&&validation.offset>ranking.length) return disabledLane("OWNER_SECONDARY_CURSOR_OUT_OF_RANGE");
  const hydrated=await hydrateTopK(selected.map(row=>row.protectedRecipeId));
  const metrics={d1Subqueries:Number(hydrated?.d1Subqueries||0),fullCorpusScans:Number(hydrated?.fullCorpusScans||0),rowsWritten:Number(hydrated?.rowsWritten||0)};
  if(metrics.d1Subqueries>7) throw new Error("OWNER_SECONDARY_INTERNAL_D1_BUDGET");
  if(metrics.fullCorpusScans!==0) throw new Error("OWNER_SECONDARY_FULL_SCAN");
  if(metrics.rowsWritten!==0) throw new Error("OWNER_SECONDARY_WRITE");
  if(!Array.isArray(hydrated?.results)||hydrated.results.length!==selected.length) throw new Error("OWNER_SECONDARY_HYDRATION_INCOMPLETE");
  const byId=new Map(hydrated.results.map(row=>[row?.protectedRecipeId,row]));
  const results=selected.map(row=>{const detail=byId.get(row.protectedRecipeId);if(!detail||!detail.sourceProvenance?.sourceCohortId) throw new Error("OWNER_SECONDARY_PROVENANCE_REQUIRED");return {...row,title:detail.title,ingredients:Array.isArray(detail.ingredients)?detail.ingredients:[],directions:Array.isArray(detail.directions)?detail.directions:[],structuralState:detail.structuralState||null,sourceProvenance:detail.sourceProvenance,recommendationValidationState:OWNER_SECONDARY_VALIDATION_STATE,unknownSoftSignals:[...OWNER_SECONDARY_UNKNOWN_SOFT_SIGNALS]};});
  const nextOffset=validation.offset+selected.length;
  return {pass:true,reason:null,candidateUniverseCount:OWNER_SECONDARY_ROLLOUT_META_V1.candidateUniverseCount,primaryRuntimeRecipeCount:OWNER_SECONDARY_ROLLOUT_META_V1.primaryRuntimeRecipeCount,mealType:validation.mealType,eligibleCount:ranking.length,rankingDigestSha256:OWNER_SECONDARY_ROLLOUT_META_V1.rankingDigests[validation.mealType],secondaryLane:{enabled:true,label:OWNER_SECONDARY_LANE_LABEL,disclosure:OWNER_SECONDARY_DISCLOSURE,unknownSoftSignals:[...OWNER_SECONDARY_UNKNOWN_SOFT_SIGNALS],recommendationValidationState:OWNER_SECONDARY_VALIDATION_STATE,mayDisplacePrimary:false,results,nextCursor:nextOffset<ranking.length?String(nextOffset):null},metrics};
}
