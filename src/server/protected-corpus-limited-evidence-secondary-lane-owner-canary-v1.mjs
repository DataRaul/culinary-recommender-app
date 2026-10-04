import { OWNER_CANARY_FIXED_PROFILE_V1,OWNER_CANARY_RANKING_META_V1,ownerCanaryTop20Rows } from "./protected-corpus-limited-evidence-secondary-lane-owner-canary-manifest-v1.mjs";
export const OWNER_CANARY_MODE="limited_evidence_secondary";
export const OWNER_CANARY_LANE_LABEL="Limited-evidence suggestions";
export const OWNER_CANARY_DISCLOSURE="These suggestions use incomplete soft metadata. Nutrition, protein, budget, meal-prep suitability, and novelty may be unknown.";
export const OWNER_CANARY_UNKNOWN_SOFT_SIGNALS=Object.freeze(["nutrition","protein","budget","mealPrep","novelty"]);
export const OWNER_CANARY_VALIDATION_STATE="LIMITED_EVIDENCE_NOT_PRIMARY_VALIDATED";
const MEALS=new Set(["breakfast","lunch","dinner","snack"]);
const arraysEqual=(a,b)=>Array.isArray(a)&&Array.isArray(b)&&JSON.stringify(a)===JSON.stringify(b);
export function ownerCanaryFeatureEnabled(env={}){return String(env?.CULINARY_LIMITED_EVIDENCE_SECONDARY_LANE_V1??"1").trim()!=="0";}
export function validateOwnerCanaryRequest(input={}){
  const errors=[],profile=input?.profile||{},mealType=String(input?.mealType||"").trim().toLowerCase();
  if(input?.mode!==OWNER_CANARY_MODE) errors.push("MODE_NOT_EXPLICIT");
  if(!MEALS.has(mealType)) errors.push("UNSUPPORTED_MEAL_TYPE");
  for(const key of ["budget","nutritionPriority","speed","skill","variety","proteinEmphasis","mealPrep","maxMinutes"]) if(Number(profile?.[key])!==Number(OWNER_CANARY_FIXED_PROFILE_V1[key])) errors.push("PROFILE_"+key);
  if(profile?.dietaryMode!==OWNER_CANARY_FIXED_PROFILE_V1.dietaryMode) errors.push("PROFILE_dietaryMode");
  for(const key of ["cuisinePreferences","priorityPacks","allergens","excludedIngredientIds","unavailableIngredientIds","currentPantryIngredientIds","pantryStapleIds"]) if(!arraysEqual(profile?.[key],OWNER_CANARY_FIXED_PROFILE_V1[key])) errors.push("PROFILE_"+key);
  const parsed=Number(input?.limit),limit=Number.isInteger(parsed)&&parsed>0?Math.min(20,parsed):20;
  return {pass:errors.length===0,errors,mealType,limit};
}
function disabledLane(reason){return {pass:false,reason,candidateUniverseCount:OWNER_CANARY_RANKING_META_V1.candidateUniverseCount,primaryRuntimeRecipeCount:86,secondaryLane:{enabled:false,label:OWNER_CANARY_LANE_LABEL,disclosure:OWNER_CANARY_DISCLOSURE,unknownSoftSignals:[...OWNER_CANARY_UNKNOWN_SOFT_SIGNALS],recommendationValidationState:OWNER_CANARY_VALIDATION_STATE,mayDisplacePrimary:false,results:[]},metrics:{d1Subqueries:0,fullCorpusScans:0,rowsWritten:0}};}
export async function executeOwnerCanaryProbe({request,featureEnabled=false,hydrateTopK}){
  if(!featureEnabled) return disabledLane("OWNER_CANARY_FEATURE_DISABLED");
  const validation=validateOwnerCanaryRequest(request);
  if(!validation.pass) return disabledLane("OWNER_CANARY_REQUEST_INVALID__"+validation.errors.join(","));
  if(typeof hydrateTopK!=="function") throw new Error("OWNER_CANARY_HYDRATOR_REQUIRED");
  const ranking=ownerCanaryTop20Rows(validation.mealType);
  if(ranking.length!==20) throw new Error("OWNER_CANARY_RANKING_MANIFEST_INVALID");
  const selected=ranking.slice(0,validation.limit),hydrated=await hydrateTopK(selected.map(row=>row.protectedRecipeId));
  const metrics={d1Subqueries:Number(hydrated?.d1Subqueries||0),fullCorpusScans:Number(hydrated?.fullCorpusScans||0),rowsWritten:Number(hydrated?.rowsWritten||0)};
  if(metrics.d1Subqueries>7) throw new Error("OWNER_CANARY_INTERNAL_D1_BUDGET");
  if(metrics.fullCorpusScans!==0) throw new Error("OWNER_CANARY_FULL_SCAN");
  if(metrics.rowsWritten!==0) throw new Error("OWNER_CANARY_WRITE");
  if(!Array.isArray(hydrated?.results)||hydrated.results.length!==selected.length) throw new Error("OWNER_CANARY_HYDRATION_INCOMPLETE");
  const byId=new Map(hydrated.results.map(row=>[row?.protectedRecipeId,row]));
  const results=selected.map(row=>{const detail=byId.get(row.protectedRecipeId);if(!detail||!detail.sourceProvenance?.sourceCohortId) throw new Error("OWNER_CANARY_PROVENANCE_REQUIRED");return {...row,title:detail.title,sourceProvenance:detail.sourceProvenance,recommendationValidationState:OWNER_CANARY_VALIDATION_STATE,unknownSoftSignals:[...OWNER_CANARY_UNKNOWN_SOFT_SIGNALS]};});
  return {pass:true,reason:null,candidateUniverseCount:OWNER_CANARY_RANKING_META_V1.candidateUniverseCount,primaryRuntimeRecipeCount:86,mealType:validation.mealType,rankingDigestSha256:OWNER_CANARY_RANKING_META_V1.rankingDigests[validation.mealType],secondaryLane:{enabled:true,label:OWNER_CANARY_LANE_LABEL,disclosure:OWNER_CANARY_DISCLOSURE,unknownSoftSignals:[...OWNER_CANARY_UNKNOWN_SOFT_SIGNALS],recommendationValidationState:OWNER_CANARY_VALIDATION_STATE,mayDisplacePrimary:false,results},metrics};
}
