import { createHash } from "node:crypto";
import { ingredientById } from "../src/data/ingredients.js";
import { evaluateShadowRow } from "./protected-corpus-full-shadow-recommendation-v1-core.mjs";

export const SHADOW_ENGINE_SCHEMA = "CULINARY_PROTECTED_CORPUS_SHADOW_ENGINE_QUALITY_V1";
export const SHADOW_ENGINE_SUMMARY_SCHEMA = "CULINARY_PROTECTED_CORPUS_SHADOW_ENGINE_QUALITY_SUMMARY_V1";
export const SHADOW_ENGINE_TERMINAL = "V21_SHADOW_ENGINE_QUALITY_PASS__FIRST_500_RELEVANCE_ACCEPTANCE_READY";

const KNOWN=new Set(["EXACT_SOURCE_NORMALIZATION","REVIEWED_MAPPING"]);
const sha=value=>createHash("sha256").update(String(value)).digest("hex");
const recipeKey=o=>`${o?.identity?.cohortId||""}::${o?.identity?.sourceRecordKey||""}`;
const known=node=>KNOWN.has(node?.state);
const arr=node=>Array.isArray(node?.value)?node.value:[];

function mapBy(rows,keyFn){
  const m=new Map();
  for(const row of rows||[]){
    const k=keyFn(row);
    if(!k||m.has(k)) throw new Error("SHADOW_ENGINE_DUPLICATE_KEY_"+k);
    m.set(k,row);
  }
  return m;
}

const DIRECT_RUNTIME_MEAL_ROLE_MAP = new Map([
  ["BREAKFAST","breakfast"],
  ["SNACK","snack"]
]);

export function canonicalMealRolesFromOverlay(overlay){
  return known(overlay?.canonical?.culinary?.mealRoles)
    ? [...new Set(arr(overlay.canonical.culinary.mealRoles).map(v=>String(v).toUpperCase()))].sort()
    : [];
}

export function runtimeMealTypesForCanonicalRoles(roles,{mainToLunchDinnerShadowCandidate=false}={}){
  const out=roles.map(v=>DIRECT_RUNTIME_MEAL_ROLE_MAP.get(String(v).toUpperCase())).filter(Boolean);
  if(mainToLunchDinnerShadowCandidate && roles.map(v=>String(v).toUpperCase()).includes("MAIN")) out.push("lunch","dinner");
  return [...new Set(out)].sort();
}

export function runtimeMealTypesFromCanonicalRoles(overlay){
  return runtimeMealTypesForCanonicalRoles(canonicalMealRolesFromOverlay(overlay));
}

function exactPositiveAllergens(diag){
  const allergens=[];
  for(const identity of diag?.identityRows||[]){
    const id=identity?.canonicalIngredientId;
    if(!id) continue;
    for(const allergen of ingredientById(id)?.allergens||[]) allergens.push(allergen);
  }
  return [...new Set(allergens)].sort();
}

function shadowIngredients(diag,key){
  return (diag?.identityRows||[]).map((identity,index)=>{
    const canonical=identity?.canonicalIngredientId;
    return {
      canonicalIngredientId:canonical || `shadow_unresolved_${sha(key+"::"+index).slice(0,16)}`,
      quantity:undefined,
      unit:undefined,
      required:true,
      preparation:"",
      sourceText:String(identity?.raw||identity?.candidate||"unresolved ingredient"),
      shadowIdentityState:canonical ? "EXACT_CANONICAL_IDENTITY" : "UNRESOLVED_NONCANONICAL_TOKEN"
    };
  });
}

function knownNumber(node){
  if(!known(node)) return undefined;
  const n=Number(node.value);
  return Number.isFinite(n) ? n : undefined;
}

export function adaptProtectedShadowRecipe({overlay,diag,evidenceScore}){
  const key=recipeKey(overlay);
  if(!key||key==="::") throw new Error("SHADOW_ENGINE_IDENTITY_REQUIRED");
  const totalMinutes=knownNumber(overlay?.canonical?.time?.totalMinutes);
  const servings=knownNumber(overlay?.canonical?.serving?.servings);
  const country=known(overlay?.canonical?.geography?.country) ? String(overlay.canonical.geography.country.value||"") : null;
  const canonicalMealRoles=canonicalMealRolesFromOverlay(overlay);
  return {
    id:"shadow_"+sha(key).slice(0,24),
    identity:{canonicalTitle:String(overlay.identity.sourceRecordKey||key)},
    provenance:{
      sourceType:"PROTECTED_SHADOW",
      sourceName:String(overlay.identity.cohortId),
      sourceItemId:String(overlay.identity.sourceRecordKey),
      sourceRevisionId:"v8018",
      sourceVersionId:"v8018",
      runtimeFetch:false
    },
    governance:{
      recommendationState:"SHADOW_CANDIDATE_ONLY",
      runtimeActivationAuthorized:false,
      shadowOnly:true,
      shadowRecipeKey:key,
      shadowEvidenceScore:Number(evidenceScore),
      shadowCanonicalMealRoles:canonicalMealRoles,
      shadowMealRolePolicy:"DIRECT_ONLY"
    },
    culinary:{
      cuisine:"Shadow",
      mealTypes:runtimeMealTypesFromCanonicalRoles(overlay),
      difficulty:undefined,
      techniqueTags:[],
      activeAttention:undefined,
      timingSensitivity:undefined,
      simultaneousTasks:undefined,
      finishingRisk:undefined,
      errorRecovery:undefined,
      equipmentDependence:undefined
    },
    time:{
      totalMinutes,
      prepMinutes:undefined,
      activeMinutes:undefined,
      passiveMinutes:undefined,
      sourceState:totalMinutes===undefined ? "SHADOW_UNKNOWN" : "SHADOW_CANONICAL_TOTAL_MINUTES"
    },
    ingredients:shadowIngredients(diag,key),
    instructions:[],
    equipment:[],
    serving:{servings,sourceState:servings===undefined?"SHADOW_UNKNOWN":"SHADOW_CANONICAL_SERVINGS"},
    nutrition:{
      perServing:{energyKcal:null,proteinG:null,carbohydrateG:null,fatG:null,fibreG:null},
      estimationState:"SHADOW_UNKNOWN",
      confidence:"unknown"
    },
    dietaryTags:[],
    allergySafety:{
      declaredAllergens:exactPositiveAllergens(diag),
      basis:"SHADOW_POSITIVE_CATALOG_SIGNAL_ONLY__NOT_ALLERGEN_FREE_AUTHORITY"
    },
    economics:{},
    convenience:{},
    discovery:{flavourProfile:[]},
    geography:{region:null,country,sourceState:country?"SHADOW_EXACT_SOURCE_COUNTRY":"SHADOW_UNKNOWN"},
    mainProtein:null
  };
}

export function buildShadowEngineCandidates({mapping,nutrition,c2Full,baselineConfig,qualityConfig}){
  if(qualityConfig?.schemaVersion!==SHADOW_ENGINE_SCHEMA) throw new Error("SHADOW_ENGINE_CONFIG_SCHEMA");
  if(mapping?.protectedCorpusVersion!=="v8018" || !Array.isArray(mapping?.overlays) || mapping.overlays.length!==19268) throw new Error("SHADOW_ENGINE_MAPPING_REQUIRED");
  if(!Array.isArray(nutrition?.protectedCorpusRecipeDiagnostics) || nutrition.protectedCorpusRecipeDiagnostics.length!==19268) throw new Error("SHADOW_ENGINE_NUTRITION_REQUIRED");
  if(!Array.isArray(c2Full?.rows) || c2Full.rows.length!==19268) throw new Error("SHADOW_ENGINE_C2_REQUIRED");

  const diagMap=mapBy(nutrition.protectedCorpusRecipeDiagnostics,row=>`${row.cohortId}::${row.sourceRecordKey}`);
  const c2Map=mapBy(c2Full.rows,row=>row.recipeKey);
  const structural=new Set((mapping.structuralExceptions||[]).map(row=>`${row.cohortId}::${row.sourceRecordKey}`));
  const validated=new Map((baselineConfig.validatedProtectedSources||[]).map(row=>[row.recipeKey,row]));
  const profileCase=baselineConfig.profileCases.find(row=>row.id==="UNRESTRICTED_BROAD");
  if(!profileCase) throw new Error("SHADOW_ENGINE_BROAD_PROFILE_REQUIRED");

  const rows=[];
  for(const overlay of mapping.overlays){
    const key=recipeKey(overlay);
    const diag=diagMap.get(key), c2=c2Map.get(key);
    if(!diag||!c2) throw new Error("SHADOW_ENGINE_JOIN_INCOMPLETE_"+key);
    const evalRow=evaluateShadowRow({
      overlay,c2,diag,structuralException:structural.has(key),profileCase,
      config:baselineConfig,validated:validated.get(key)
    });
    if(evalRow.state!=="SHADOW_EVALUABLE_UNRESTRICTED") continue;
    rows.push({
      recipeKey:key,
      evidenceScore:Number(evalRow.score),
      sourceCohortId:overlay.identity.cohortId,
      recipe:adaptProtectedShadowRecipe({overlay,diag,evidenceScore:evalRow.score})
    });
  }
  rows.sort((a,b)=>a.recipeKey.localeCompare(b.recipeKey));
  if(rows.length!==qualityConfig.expectedNewUnrestrictedShadowCandidateCount) throw new Error("SHADOW_ENGINE_CANDIDATE_COUNT_"+rows.length);
  const evidenceRich=rows.filter(row=>row.evidenceScore>=Number(qualityConfig.evidenceRichThreshold));
  if(evidenceRich.length!==qualityConfig.expectedEvidenceRichPoolCount) throw new Error("SHADOW_ENGINE_EVIDENCE_RICH_COUNT_"+evidenceRich.length);
  return {rows,evidenceRich};
}

export function weightedShadowRanking(engineRows){
  return engineRows.map(row=>{
    const evidenceScore=Number(row.recipe.governance?.shadowEvidenceScore||0);
    return {...row,evidenceScore,weightedShadowScore:Number((Number(row.score)*evidenceScore).toFixed(6))};
  }).sort((a,b)=>b.weightedShadowScore-a.weightedShadowScore || b.evidenceScore-a.evidenceScore || a.recipe.id.localeCompare(b.recipe.id));
}

export function rankingDigest(rows,scoreKey="score"){
  return sha(JSON.stringify(rows.map(row=>[row.recipe.id,Number(row[scoreKey])]))); 
}

export function averageEvidence(rows){
  if(!rows.length) return 0;
  return Number((rows.reduce((s,row)=>s+Number(row.recipe.governance?.shadowEvidenceScore||row.evidenceScore||0),0)/rows.length).toFixed(6));
}

export function sourceCounts(rows){
  const m=new Map();
  for(const row of rows){
    const k=row.recipe.provenance.sourceName;
    m.set(k,(m.get(k)||0)+1);
  }
  return Object.fromEntries([...m.entries()].sort(([a],[b])=>a.localeCompare(b)));
}

export function validateShadowEngineSummary(summary,config){
  const errors=[];
  if(summary?.schemaVersion!==SHADOW_ENGINE_SUMMARY_SCHEMA) errors.push("schemaVersion");
  if(summary?.terminal!==SHADOW_ENGINE_TERMINAL || summary?.pass!==true) errors.push("terminal");
  if(summary?.candidateCount!==config.expectedNewUnrestrictedShadowCandidateCount) errors.push("candidateCount");
  if(summary?.evidenceRichPoolCount!==config.expectedEvidenceRichPoolCount) errors.push("evidenceRichPoolCount");
  if(summary?.qualityCohort?.size!==config.firstQualityCohortSize) errors.push("qualityCohortSize");
  if(summary?.qualityCohort?.minimumEvidenceScore<config.qualityEvaluation.requireQualityCohortMinimumEvidenceScore) errors.push("qualityCohortEvidence");
  if(summary?.control?.nonFiniteEligibleScoreCount!==0) errors.push("nonFiniteControl");
  if(summary?.safety?.eligibleOutsideShadowMode!==0) errors.push("outsideShadowLeak");
  if(summary?.safety?.vegetarianEligibleInShadowMode!==0 || summary?.safety?.eggAllergyEligibleInShadowMode!==0) errors.push("restrictedLeak");
  if(summary?.comparison?.top100AverageEvidence<summary?.control?.top100AverageEvidence) errors.push("comparisonEvidenceRegression");
  if(summary?.determinism?.controlDigestA!==summary?.determinism?.controlDigestB) errors.push("controlDeterminism");
  if(summary?.determinism?.comparisonDigestA!==summary?.determinism?.comparisonDigestB) errors.push("comparisonDeterminism");
  for(const [key,value] of Object.entries(summary?.boundaries||{})){
    if(["protectedD1Reads","protectedD1Writes","protectedBodiesRewritten"].includes(key)){ if(value!==0) errors.push("boundaries."+key); }
    else if(value!==false) errors.push("boundaries."+key);
  }
  return errors;
}
