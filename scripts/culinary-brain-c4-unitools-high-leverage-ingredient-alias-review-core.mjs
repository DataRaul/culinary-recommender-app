import { createHash } from "node:crypto";
import { ingredientById, normalizeIngredient } from "../src/data/ingredients.js";
import { resolveStep8EIngredient } from "./corpus-scale-step8e-core.mjs";

export const C4_UNITOOLS_ALIAS_REVIEW_SCHEMA="CULINARY_BRAIN_C4_UNITOOLS_HIGH_LEVERAGE_INGREDIENT_ALIAS_REVIEW_V1";
export const C4_UNITOOLS_ALIAS_REVIEW_SUMMARY_SCHEMA="CULINARY_BRAIN_C4_UNITOOLS_HIGH_LEVERAGE_INGREDIENT_ALIAS_REVIEW_SUMMARY_V1";
export const C4_UNITOOLS_ALIAS_REVIEW_TERMINAL="CULINARY_BRAIN_C4_UNITOOLS_HIGH_LEVERAGE_INGREDIENT_ALIAS_REVIEW_PASS";
const ENTRY_TERMINAL="CULINARY_BRAIN_C4_NEXT_REPAIR_COHORT_DESIGN_PASS__UNITOOLS_ALIAS_REVIEW_READY";
const norm=value=>String(value??"").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/\s+/g," ");
const decisionKey=(sourceId,sourceName)=>norm(sourceId)+"::"+norm(sourceName);

export function validateC4UnitoolsAliasReviewContract(contract){
  const errors=[];
  if(contract?.schemaVersion!==C4_UNITOOLS_ALIAS_REVIEW_SCHEMA) errors.push("schemaVersion");
  if(contract?.protectedCorpusVersion!=="v8018") errors.push("protectedCorpusVersion");
  if(contract?.entryTerminal!==ENTRY_TERMINAL) errors.push("entryTerminal");
  if(contract?.sourceCohortId!=="unitools-world-recipes-v1_1_0") errors.push("sourceCohortId");
  if(contract?.expectedSourceRecipeCount!==501) errors.push("recipeCount");
  if(!Array.isArray(contract?.decisions)||contract.decisions.length!==25) errors.push("decisionCount");
  const keys=new Set();
  for(const decision of contract?.decisions||[]){
    const key=decisionKey(decision.sourceId,decision.sourceName);
    if(keys.has(key)) errors.push("duplicateDecision:"+key);
    keys.add(key);
    if(!["MAP","HOLD"].includes(decision.decision)) errors.push("decision:"+key);
    if(decision.decision==="MAP"){
      if(!decision.canonicalIngredientId||!ingredientById(decision.canonicalIngredientId)) errors.push("canonicalIngredientId:"+key);
    } else if(decision.canonicalIngredientId) errors.push("holdCanonicalId:"+key);
    if(!decision.reason) errors.push("reason:"+key);
  }
  const auth=contract?.authority||{};
  if(auth.exactCohortReviewedAliasOverlayAuthorizedOnPass!==true) errors.push("overlayAuthority");
  for(const key of ["globalIngredientAliasIndexMutationAuthorized","otherSourceCohortReuseAuthorized","hardDietaryAllergenAuthorityPromoted","recommendationAdmissionAuthorized","publicRuntimeWideningAuthorized","protectedD1ReadAuthorized","protectedD1WriteAuthorized","protectedBodyRewriteAuthorized","knowledgeCoreWriteAuthorized","paidModelOrApiAuthorized","thirdShardAuthorized","barbecueMutationAuthorized"]) if(auth[key]!==false) errors.push("authority."+key);
  if(contract?.targetTerminal!==C4_UNITOOLS_ALIAS_REVIEW_TERMINAL) errors.push("targetTerminal");
  if(contract?.nextGate!=="C4_UNITOOLS_CANONICAL_GAP_DESIGN_V1") errors.push("nextGate");
  return [...new Set(errors)].sort();
}

export function resolveWithReviewedUnitoolsAlias(sourceIngredient, contract){
  const base=resolveStep8EIngredient(sourceIngredient);
  if(base.status!=="UNRESOLVED") return {...base,resolutionState:base.status};
  const sourceName=sourceIngredient?.name?.en??null;
  const decision=(contract.decisions||[]).find(row=>decisionKey(row.sourceId,row.sourceName)===decisionKey(sourceIngredient?.id,sourceName));
  if(!decision||decision.decision!=="MAP") return {...base,resolutionState:"UNRESOLVED"};
  const target=decision.canonicalIngredientId;
  if(!ingredientById(target)) throw new Error("C4_UNITOOLS_ALIAS_TARGET_MISSING__"+target);
  const sourceIdText=sourceIngredient?.id==null?null:String(sourceIngredient.id).replace(/[_-]+/g," ");
  const diagnostic=sourceIdText?normalizeIngredient(sourceIdText):null;
  if(diagnostic&&diagnostic!==target){
    return {...base,status:"CONFLICT",resolutionState:"CONFLICT",reviewedAliasTarget:target,sourceIdDiagnosticMapping:diagnostic,reviewReason:decision.reason};
  }
  return {...base,status:"RESOLVED",resolutionState:"REVIEWED_MAPPING",canonicalIngredientId:target,nameMapping:target,reviewedAliasTarget:target,reviewReason:decision.reason};
}

export function buildC4UnitoolsAliasReview({contract,design,dataset,baselinePreflight}){
  const errors=validateC4UnitoolsAliasReviewContract(contract);
  if(errors.length) throw new Error("C4_UNITOOLS_ALIAS_REVIEW_CONTRACT_INVALID__"+errors.join(","));
  if(design?.pass!==true||design?.terminal!==ENTRY_TERMINAL) throw new Error("C4_UNITOOLS_ALIAS_REVIEW_DESIGN_REQUIRED");
  if(dataset?.recipes?.length!==contract.expectedSourceRecipeCount) throw new Error("C4_UNITOOLS_ALIAS_REVIEW_RECIPE_COUNT_MISMATCH");
  const baseline=design.currentIdentityBaseline||{};
  const observed=baselinePreflight?.ontology||{};
  for(const [a,b] of [["ingredientOccurrenceCount","ingredientOccurrences"],["resolvedIngredientOccurrenceCount","resolvedIngredientOccurrences"],["unresolvedIngredientOccurrenceCount","unresolvedIngredientOccurrences"],["conflictingIngredientOccurrenceCount","conflictingIngredientOccurrences"],["recipesAllIngredientsMapped","recipesAllIngredientsMapped"]]){
    if(baseline[a]!==observed[b]) throw new Error("C4_UNITOOLS_ALIAS_REVIEW_BASELINE_DRIFT__"+a);
  }

  const mappedDecisions=(contract.decisions||[]).filter(row=>row.decision==="MAP");
  const heldDecisions=(contract.decisions||[]).filter(row=>row.decision==="HOLD");
  const decisionStats=new Map((contract.decisions||[]).map(row=>[decisionKey(row.sourceId,row.sourceName),{...row,occurrenceCount:0,resolvedOccurrenceCount:0,conflictOccurrenceCount:0}]));
  let resolved=0,unresolved=0,conflicts=0,reviewed=0;
  const fullyMapped=[];
  const newlyMapped=[];
  for(const recipe of dataset.recipes||[]){
    let all=true;
    const resolutions=[];
    for(const ingredient of recipe.ingredients||[]){
      const result=resolveWithReviewedUnitoolsAlias(ingredient,contract);
      const key=decisionKey(ingredient?.id,ingredient?.name?.en);
      const stat=decisionStats.get(key);
      if(stat){
        stat.occurrenceCount++;
        if(result.status==="RESOLVED") stat.resolvedOccurrenceCount++;
        if(result.status==="CONFLICT") stat.conflictOccurrenceCount++;
      }
      if(result.status==="RESOLVED"){resolved++; if(result.resolutionState==="REVIEWED_MAPPING") reviewed++;}
      else if(result.status==="CONFLICT"){conflicts++; all=false;}
      else {unresolved++; all=false;}
      resolutions.push(result);
    }
    if(all){
      fullyMapped.push(recipe.slug);
      const baselineRow=(baselinePreflight.recipeRows||[]).find(row=>row.sourceSlug===recipe.slug);
      if(!baselineRow?.allIngredientsMapped) newlyMapped.push(recipe.slug);
    }
  }
  const sortedFully=[...fullyMapped].sort();
  const sortedNew=[...newlyMapped].sort();
  const digest=createHash("sha256").update(JSON.stringify(sortedNew)).digest("hex");
  return {
    schemaVersion:C4_UNITOOLS_ALIAS_REVIEW_SUMMARY_SCHEMA,
    date:"2026-09-28",
    pass:true,
    terminal:C4_UNITOOLS_ALIAS_REVIEW_TERMINAL,
    protectedCorpusVersion:"v8018",
    sourceCohortId:contract.sourceCohortId,
    review:{
      reviewedDecisionCount:contract.decisions.length,
      mappedDecisionCount:mappedDecisions.length,
      heldDecisionCount:heldDecisions.length,
      mappedDecisions:mappedDecisions.map(row=>({sourceId:row.sourceId,sourceName:row.sourceName,canonicalIngredientId:row.canonicalIngredientId,reason:row.reason})),
      heldDecisions:heldDecisions.map(row=>({sourceId:row.sourceId,sourceName:row.sourceName,reason:row.reason})),
      decisionStats:[...decisionStats.values()]
    },
    identity:{
      baselineResolvedIngredientOccurrences:observed.resolvedIngredientOccurrences,
      baselineUnresolvedIngredientOccurrences:observed.unresolvedIngredientOccurrences,
      baselineConflictingIngredientOccurrences:observed.conflictingIngredientOccurrences,
      baselineFullyMappedRecipeCount:observed.recipesAllIngredientsMapped,
      reviewedAliasResolvedOccurrences:reviewed,
      postReviewResolvedIngredientOccurrences:resolved,
      postReviewUnresolvedIngredientOccurrences:unresolved,
      postReviewConflictingIngredientOccurrences:conflicts,
      postReviewFullyMappedRecipeCount:sortedFully.length,
      newlyFullyMappedRecipeCount:sortedNew.length,
      newlyFullyMappedRecipeSlugs:sortedNew,
      newlyFullyMappedRecipeDigestSha256:digest
    },
    authority:{
      exactCohortReviewedAliasOverlayActive:true,
      globalIngredientAliasIndexChanged:false,
      hardDietaryAllergenAuthorityPromoted:false,
      recommendationAdmissionChanged:false,
      publicRuntimeChanged:false
    },
    boundaries:{
      protectedD1Reads:0,protectedD1Writes:0,protectedBodiesRewritten:0,
      globalAliasIndexMutations:0,knowledgeCoreWritePerformed:false,paidModelOrApiUsed:false,thirdShardUsed:false,barbecueMutation:false
    },
    nextGate:contract.nextGate
  };
}
