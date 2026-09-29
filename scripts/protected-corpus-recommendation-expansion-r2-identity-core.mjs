import { createHash } from "node:crypto";
import { ingredientById, normalizeIngredient } from "../src/data/ingredients.js";
import { resolveWithReviewedUnitoolsAlias } from "./culinary-brain-c4-unitools-high-leverage-ingredient-alias-review-core.mjs";

export const R2_IDENTITY_SCHEMA="CULINARY_PROTECTED_CORPUS_RECOMMENDATION_EXPANSION_R2_IDENTITY_REVIEW_V1";
export const R2_IDENTITY_TERMINAL="PROTECTED_CORPUS_RECOMMENDATION_EXPANSION_R2_IDENTITY_REVIEW_PASS__HARD_SAFETY_POLICY_READY";
export const R2_IDENTITY_SUMMARY_SCHEMA="CULINARY_PROTECTED_CORPUS_RECOMMENDATION_EXPANSION_R2_IDENTITY_REVIEW_SUMMARY_V1";
const R1_TERMINAL="PROTECTED_CORPUS_RECOMMENDATION_EXPANSION_R1_FRONTIER_PASS__R2_REPAIR_TRANCHE_READY";
const key=(sourceId,sourceName)=>String(sourceId??"").trim().toLowerCase()+" :: "+String(sourceName??"").trim();

export function validateR2IdentityContract(contract,r1){
  const errors=[];
  if(contract?.schemaVersion!==R2_IDENTITY_SCHEMA) errors.push("schemaVersion");
  if(contract?.protectedCorpusVersion!=="v8018") errors.push("protectedCorpusVersion");
  if(contract?.entryTerminal!==R1_TERMINAL) errors.push("entryTerminal");
  if(contract?.expectedCandidateRecipeCount!==10) errors.push("candidateCount");
  if(contract?.expectedCandidateDigestSha256!=="6dbf598c8a00e07bd0b1bdfae75146d7683487afcc3f0bfc9c0e07ddf938b9c0") errors.push("candidateDigest");
  if(r1?.pass!==true||r1?.terminal!==R1_TERMINAL) errors.push("r1Evidence");
  if(r1?.frozenCandidateTranche?.recipeCount!==contract.expectedCandidateRecipeCount||r1?.frozenCandidateTranche?.digestSha256!==contract.expectedCandidateDigestSha256) errors.push("r1Freeze");
  if(contract?.sourceCohort?.id!=="unitools-world-recipes-v1_1_0"||contract?.sourceCohort?.expectedRecipeCount!==501) errors.push("sourceCohort");
  if(!/^[a-f0-9]{40}$/.test(contract?.sourceCohort?.commit||"")||!/^[a-f0-9]{40}$/.test(contract?.sourceCohort?.dataBlobSha||"")) errors.push("sourcePin");
  const decisions=contract?.identityDecisions||[];
  if(decisions.length!==15) errors.push("decisionCount");
  const seen=new Set();
  for(const row of decisions){
    const k=key(row.sourceId,row.sourceName);
    if(seen.has(k)) errors.push("duplicateDecision:"+k); seen.add(k);
    if(!["MAP_EXISTING","HOLD"].includes(row.decision)) errors.push("decision:"+k);
    if(row.decision==="MAP_EXISTING"){
      if(!row.canonicalIngredientId||!ingredientById(row.canonicalIngredientId)) errors.push("canonicalIngredientId:"+k);
    } else if(row.canonicalIngredientId) errors.push("holdCanonicalIngredientId:"+k);
    if(!row.reason) errors.push("reason:"+k);
  }
  const expectedKeys=new Set((r1?.repairQueue||[]).map(row=>row.key.toLowerCase()));
  if(expectedKeys.size!==15||seen.size!==15||[...seen].some(k=>!expectedKeys.has(k.toLowerCase()))) errors.push("decisionCoverage");
  const auth=contract?.authority||{};
  if(auth.exactFrozenTrancheOverlayAuthorizedOnPass!==true) errors.push("overlayAuthority");
  for(const k of ["globalIngredientAliasIndexMutationAuthorized","globalIngredientCatalogMutationAuthorized","hardDietaryAllergenAuthorityPromotionAuthorized","recommendationAdmissionAuthorized","publicRuntimeWideningAuthorized","protectedD1ReadAuthorized","protectedD1WriteAuthorized","protectedBodyRewriteAuthorized","newProtectedSourceIngestionAuthorized","knowledgeCoreWriteAuthorized","paidModelOrApiAuthorized","thirdShardAuthorized","barbecueMutationAuthorized"]) if(auth[k]!==false) errors.push("authority."+k);
  if(contract?.targetTerminal!==R2_IDENTITY_TERMINAL||contract?.nextGate!=="R2_HARD_SAFETY_POLICY_REVIEW") errors.push("terminal");
  return [...new Set(errors)].sort();
}

export function resolveWithR2IdentityDecision(ingredient,aliasContract,r2Contract){
  const base=resolveWithReviewedUnitoolsAlias(ingredient,aliasContract);
  if(base.status!=="UNRESOLVED") return {...base,r2ResolutionState:base.resolutionState||base.status};
  const sourceId=ingredient?.id??null, sourceName=ingredient?.name?.en??null;
  const row=(r2Contract.identityDecisions||[]).find(d=>key(d.sourceId,d.sourceName).toLowerCase()===key(sourceId,sourceName).toLowerCase());
  if(!row||row.decision!=="MAP_EXISTING") return {...base,r2ResolutionState:"HOLD"};
  const target=row.canonicalIngredientId;
  if(!ingredientById(target)) throw new Error("R2_IDENTITY_TARGET_MISSING__"+target);
  const sourceIdDiagnostic=normalizeIngredient(String(sourceId??"").replace(/[_-]+/g," "));
  if(sourceIdDiagnostic&&sourceIdDiagnostic!==target) throw new Error("R2_IDENTITY_SOURCE_ID_CONFLICT__"+key(sourceId,sourceName));
  return {...base,status:"RESOLVED",canonicalIngredientId:target,nameMapping:target,r2ResolutionState:"REVIEWED_MAPPING",r2ReviewReason:row.reason};
}

export function buildR2IdentityReview({contract,r1,aliasContract,dataset}){
  const errors=validateR2IdentityContract(contract,r1);
  if(errors.length) throw new Error("R2_IDENTITY_CONTRACT_INVALID__"+errors.join(","));
  if(!dataset?.recipes||dataset.recipes.length!==contract.sourceCohort.expectedRecipeCount) throw new Error("R2_IDENTITY_SOURCE_RECIPE_COUNT_MISMATCH");
  const bySlug=new Map(dataset.recipes.map(recipe=>[recipe.slug,recipe]));
  const rows=[];
  for(const slug of r1.frozenCandidateTranche.sourceSlugs){
    const recipe=bySlug.get(slug);
    if(!recipe) throw new Error("R2_IDENTITY_FROZEN_RECIPE_MISSING__"+slug);
    const mappings=(recipe.ingredients||[]).map(ingredient=>{
      const resolved=resolveWithR2IdentityDecision(ingredient,aliasContract,contract);
      return {
        sourceId:ingredient?.id??null,
        sourceName:ingredient?.name?.en??null,
        status:resolved.status,
        canonicalIngredientId:resolved.canonicalIngredientId??null,
        resolutionState:resolved.r2ResolutionState
      };
    });
    const unresolved=mappings.filter(row=>row.status!=="RESOLVED");
    const conflicts=mappings.filter(row=>row.status==="CONFLICT");
    const identityReady=unresolved.length===0&&conflicts.length===0;
    const canonicalIngredientIds=identityReady?[...new Set(mappings.map(row=>row.canonicalIngredientId))].sort():[];
    const positiveCatalogAllergenSignals=identityReady?[...new Set(canonicalIngredientIds.flatMap(id=>ingredientById(id)?.allergens||[]))].sort():[];
    rows.push({
      sourceSlug:slug,
      identityReady,
      ingredientOccurrenceCount:mappings.length,
      unresolvedIngredientCount:unresolved.length,
      conflictIngredientCount:conflicts.length,
      unresolvedIngredientKeys:unresolved.map(row=>key(row.sourceId,row.sourceName)).sort(),
      canonicalIngredientIds,
      positiveCatalogAllergenSignals,
      hardSafetyAuthorityPromoted:false
    });
  }
  const ready=rows.filter(row=>row.identityReady);
  const readySlugs=ready.map(row=>row.sourceSlug).sort();
  return {
    schemaVersion:R2_IDENTITY_SUMMARY_SCHEMA,
    date:"2026-09-29",
    pass:true,
    terminal:R2_IDENTITY_TERMINAL,
    protectedCorpusVersion:"v8018",
    sourceCohort:{id:contract.sourceCohort.id,recipeCount:dataset.recipes.length,commit:contract.sourceCohort.commit,dataBlobSha:contract.sourceCohort.dataBlobSha},
    frozenCandidateDigestSha256:r1.frozenCandidateTranche.digestSha256,
    reviewedDecisionCount:contract.identityDecisions.length,
    mappedExistingDecisionCount:contract.identityDecisions.filter(row=>row.decision==="MAP_EXISTING").length,
    heldDecisionCount:contract.identityDecisions.filter(row=>row.decision==="HOLD").length,
    identityReadyCandidateCount:ready.length,
    identityReadySourceSlugs:readySlugs,
    identityReadyDigestSha256:createHash("sha256").update(JSON.stringify(readySlugs)).digest("hex"),
    rows,
    interpretation:{
      catalogAllergenSignalsAreNotRuntimeHardAuthority:true,
      heldIdentityBlocksCandidate:true,
      identityReadyDoesNotMeanRecommendationReady:true
    },
    authorityPromoted:false,
    recommendationAdmissionChanged:false,
    publicRuntimeChanged:false,
    boundaries:{
      protectedD1Reads:0,protectedD1Writes:0,protectedBodiesRewritten:0,newProtectedSourcesIngested:0,
      globalIngredientAliasIndexMutations:0,globalIngredientCatalogMutations:0,knowledgeCoreWrites:0,
      paidInfrastructureUsed:false,thirdShardUsed:false,barbecueMutation:false
    },
    nextGate:"R2_HARD_SAFETY_POLICY_REVIEW"
  };
}

export function compactR2IdentityEvidence(summary){
  if(summary?.pass!==true||summary?.terminal!==R2_IDENTITY_TERMINAL) throw new Error("R2_IDENTITY_COMPACT_SOURCE_INVALID");
  return {
    schemaVersion:"CULINARY_PROTECTED_CORPUS_RECOMMENDATION_EXPANSION_R2_IDENTITY_REVIEW_COMPACT_V1",
    date:summary.date,
    pass:true,
    terminal:summary.terminal,
    protectedCorpusVersion:summary.protectedCorpusVersion,
    frozenCandidateDigestSha256:summary.frozenCandidateDigestSha256,
    reviewedDecisionCount:summary.reviewedDecisionCount,
    mappedExistingDecisionCount:summary.mappedExistingDecisionCount,
    heldDecisionCount:summary.heldDecisionCount,
    identityReadyCandidateCount:summary.identityReadyCandidateCount,
    identityReadySourceSlugs:summary.identityReadySourceSlugs,
    identityReadyDigestSha256:summary.identityReadyDigestSha256,
    identityReadyCandidates:summary.rows.filter(r=>r.identityReady).map(r=>({sourceSlug:r.sourceSlug,canonicalIngredientIds:r.canonicalIngredientIds,positiveCatalogAllergenSignals:r.positiveCatalogAllergenSignals})),
    heldCandidates:summary.rows.filter(r=>!r.identityReady).map(r=>({sourceSlug:r.sourceSlug,unresolvedIngredientKeys:r.unresolvedIngredientKeys})),
    authorityPromoted:summary.authorityPromoted,
    recommendationAdmissionChanged:summary.recommendationAdmissionChanged,
    publicRuntimeChanged:summary.publicRuntimeChanged,
    boundaries:summary.boundaries,
    nextGate:summary.nextGate
  };
}
