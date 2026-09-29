import { createHash } from "node:crypto";
import { resolveWithReviewedUnitoolsAlias } from "./culinary-brain-c4-unitools-high-leverage-ingredient-alias-review-core.mjs";

export const R1_TERMINAL = "PROTECTED_CORPUS_RECOMMENDATION_EXPANSION_R1_FRONTIER_PASS__R2_REPAIR_TRANCHE_READY";
export const R1_SCHEMA = "CULINARY_PROTECTED_CORPUS_RECOMMENDATION_EXPANSION_R1_FRONTIER_V1";

const sourceName = ingredient => ingredient?.name?.en == null ? null : String(ingredient.name.en);
const ingredientKey = ingredient => `${ingredient?.id ?? "<no-id>"} :: ${sourceName(ingredient) ?? "<no-name>"}`;
const finite = value => typeof value === "number" && Number.isFinite(value);

export function validateR1MeasurementContract(contract) {
  const errors=[];
  if (contract?.schemaVersion !== "CULINARY_PROTECTED_CORPUS_RECOMMENDATION_EXPANSION_V1") errors.push("schemaVersion");
  if (contract?.ownerAuthorization?.successorProgrammeAuthorized !== true) errors.push("programmeAuthorization");
  if (contract?.authority?.candidateRepairAndEvaluationAuthorized !== true) errors.push("candidateAuthority");
  if (contract?.authority?.publicRuntimeWideningAuthorized !== false || contract?.authority?.automaticRecommendationAdmissionAuthorized !== false) errors.push("runtimeFirewall");
  const r1=contract?.r1FrontierMeasurement || {};
  if (r1.sourceCohortId !== "unitools-world-recipes-v1_1_0") errors.push("sourceCohortId");
  if (r1.expectedSourceRecipeCount !== 501) errors.push("sourceRecipeCount");
  if (!/^[a-f0-9]{40}$/.test(r1.pinnedSourceCommit || "")) errors.push("sourceCommit");
  if (!/^[a-f0-9]{40}$/.test(r1.pinnedSourceDataBlobSha || "")) errors.push("sourceBlob");
  if (r1.reviewedAliasContract !== "config/culinary_brain_c4_unitools_high_leverage_ingredient_alias_review_v1.json") errors.push("aliasContract");
  if (JSON.stringify(r1.knownActivatedSourceSlugs) !== JSON.stringify(["pao-de-queijo"])) errors.push("activatedExclusion");
  if (JSON.stringify(r1.knownPublicDuplicateSourceSlugs) !== JSON.stringify(["tortilla-espanola"])) errors.push("duplicateExclusion");
  if (r1.candidateTrancheMaxRecipes !== 10) errors.push("trancheSize");
  if (r1.requireConflictFree !== true || r1.requireExplicitPrepCookServingsDifficultyCategory !== true) errors.push("failClosedPolicy");
  if (JSON.stringify(r1.rankingOrder) !== JSON.stringify(["uniqueUnresolvedIngredientKeyCount","unresolvedIngredientOccurrenceCount","sourceSlug"])) errors.push("rankingOrder");
  if (r1.targetTerminal !== R1_TERMINAL || r1.nextGate !== "R2_BOUNDED_IDENTITY_AND_HARD_SAFETY_REPAIR") errors.push("terminal");
  return [...new Set(errors)].sort();
}

export function inspectUnitoolsRecipe(recipe, aliasContract) {
  const mappingRows=(recipe?.ingredients || []).map(ingredient => {
    const result=resolveWithReviewedUnitoolsAlias(ingredient,aliasContract);
    return {
      key:ingredientKey(ingredient),
      sourceId:ingredient?.id ?? null,
      sourceName:sourceName(ingredient),
      status:result.status,
      canonicalIngredientId:result.canonicalIngredientId ?? null,
      resolutionState:result.resolutionState ?? result.status
    };
  });
  const unresolved=mappingRows.filter(row=>row.status==="UNRESOLVED");
  const conflicts=mappingRows.filter(row=>row.status==="CONFLICT");
  const uniqueUnresolved=[...new Set(unresolved.map(row=>row.key))].sort();
  const hardMetadata={
    prepMinutesExplicit:finite(recipe?.prepMinutes) && recipe.prepMinutes >= 0,
    cookMinutesExplicit:finite(recipe?.cookMinutes) && recipe.cookMinutes >= 0,
    positiveServingsExplicit:finite(recipe?.baseServings) && recipe.baseServings > 0,
    difficultyExplicit:typeof recipe?.difficulty === "string" && recipe.difficulty.trim().length > 0,
    categoryExplicit:typeof recipe?.category === "string" && recipe.category.trim().length > 0,
    instructionsPresent:Array.isArray(recipe?.instructions) && recipe.instructions.length > 0
  };
  const requiredHardMetadataReady=hardMetadata.prepMinutesExplicit
    && hardMetadata.cookMinutesExplicit
    && hardMetadata.positiveServingsExplicit
    && hardMetadata.difficultyExplicit
    && hardMetadata.categoryExplicit;
  return {
    sourceSlug:String(recipe?.slug ?? ""),
    ingredientOccurrenceCount:mappingRows.length,
    resolvedIngredientOccurrenceCount:mappingRows.filter(row=>row.status==="RESOLVED").length,
    unresolvedIngredientOccurrenceCount:unresolved.length,
    uniqueUnresolvedIngredientKeyCount:uniqueUnresolved.length,
    unresolvedIngredientKeys:uniqueUnresolved,
    conflictIngredientOccurrenceCount:conflicts.length,
    conflictIngredientKeys:[...new Set(conflicts.map(row=>row.key))].sort(),
    requiredHardMetadataReady,
    hardMetadata
  };
}

export function rankFrontierRows(rows, contract) {
  const r1=contract.r1FrontierMeasurement;
  const excluded=new Set([...(r1.knownActivatedSourceSlugs||[]),...(r1.knownPublicDuplicateSourceSlugs||[])]);
  return rows
    .filter(row=>!excluded.has(row.sourceSlug))
    .filter(row=>row.requiredHardMetadataReady)
    .filter(row=>!r1.requireConflictFree || row.conflictIngredientOccurrenceCount===0)
    .sort((a,b)=>
      a.uniqueUnresolvedIngredientKeyCount-b.uniqueUnresolvedIngredientKeyCount
      || a.unresolvedIngredientOccurrenceCount-b.unresolvedIngredientOccurrenceCount
      || a.sourceSlug.localeCompare(b.sourceSlug)
    );
}

export function buildR1FrontierMeasurement({contract,aliasContract,dataset}) {
  const errors=validateR1MeasurementContract(contract);
  if (errors.length) throw new Error("R1_CONTRACT_INVALID__"+errors.join(","));
  const r1=contract.r1FrontierMeasurement;
  if (!dataset || !Array.isArray(dataset.recipes) || dataset.recipes.length!==r1.expectedSourceRecipeCount) throw new Error("R1_SOURCE_RECIPE_COUNT_MISMATCH");
  const rows=dataset.recipes.map(recipe=>inspectUnitoolsRecipe(recipe,aliasContract));
  const ranked=rankFrontierRows(rows,contract);
  const frontier=ranked.slice(0,r1.candidateTrancheMaxRecipes);
  const keyStats=new Map();
  for(const row of frontier){
    for(const key of row.unresolvedIngredientKeys){
      const stat=keyStats.get(key)||{key,candidateRecipeCount:0,occurrenceCount:0,sourceSlugs:[]};
      stat.candidateRecipeCount++;
      stat.occurrenceCount+=row.unresolvedIngredientKeys.filter(value=>value===key).length;
      stat.sourceSlugs.push(row.sourceSlug);
      keyStats.set(key,stat);
    }
  }
  const repairQueue=[...keyStats.values()]
    .map(row=>({...row,sourceSlugs:[...new Set(row.sourceSlugs)].sort()}))
    .sort((a,b)=>b.candidateRecipeCount-a.candidateRecipeCount||b.occurrenceCount-a.occurrenceCount||a.key.localeCompare(b.key));
  const frontierSlugs=frontier.map(row=>row.sourceSlug);
  return {
    schemaVersion:R1_SCHEMA,
    date:"2026-09-29",
    pass:true,
    terminal:R1_TERMINAL,
    protectedCorpusVersion:"v8018",
    sourceCohort:{
      id:r1.sourceCohortId,
      recipeCount:dataset.recipes.length,
      commit:r1.pinnedSourceCommit,
      dataBlobSha:r1.pinnedSourceDataBlobSha
    },
    exclusions:{
      activatedSourceSlugs:r1.knownActivatedSourceSlugs,
      publicDuplicateSourceSlugs:r1.knownPublicDuplicateSourceSlugs
    },
    census:{
      recipeCount:rows.length,
      conflictFreeRequiredHardMetadataRecipeCount:ranked.length,
      zeroUnresolvedConflictFreeCandidateCount:ranked.filter(row=>row.uniqueUnresolvedIngredientKeyCount===0).length,
      oneUnresolvedConflictFreeCandidateCount:ranked.filter(row=>row.uniqueUnresolvedIngredientKeyCount===1).length
    },
    frozenCandidateTranche:{
      maxRecipeCount:r1.candidateTrancheMaxRecipes,
      recipeCount:frontier.length,
      sourceSlugs:frontierSlugs,
      digestSha256:createHash("sha256").update(JSON.stringify(frontierSlugs)).digest("hex"),
      rows:frontier
    },
    repairQueue,
    candidateOnly:true,
    runtimeAdmissionChanged:false,
    publicRuntimeChanged:false,
    boundaries:{
      protectedD1Reads:0,
      protectedD1Writes:0,
      protectedBodiesRewritten:0,
      newProtectedSourcesIngested:0,
      knowledgeCoreWrites:0,
      paidInfrastructureUsed:false,
      thirdShardUsed:false,
      barbecueMutation:false
    },
    nextGate:r1.nextGate
  };
}

export function compactR1FrontierEvidence(summary) {
  if (summary?.pass !== true || summary?.terminal !== R1_TERMINAL) throw new Error("R1_COMPACT_SOURCE_INVALID");
  return {
    schemaVersion:"CULINARY_PROTECTED_CORPUS_RECOMMENDATION_EXPANSION_R1_FRONTIER_COMPACT_V1",
    date:summary.date,
    pass:true,
    terminal:summary.terminal,
    protectedCorpusVersion:summary.protectedCorpusVersion,
    sourceCohort:summary.sourceCohort,
    census:{
      conflictFreeRequiredHardMetadataRecipeCount:summary.census.conflictFreeRequiredHardMetadataRecipeCount,
      zeroUnresolvedConflictFreeCandidateCount:summary.census.zeroUnresolvedConflictFreeCandidateCount,
      oneUnresolvedConflictFreeCandidateCount:summary.census.oneUnresolvedConflictFreeCandidateCount
    },
    frozenCandidateTranche:{
      recipeCount:summary.frozenCandidateTranche.recipeCount,
      sourceSlugs:summary.frozenCandidateTranche.sourceSlugs,
      digestSha256:summary.frozenCandidateTranche.digestSha256
    },
    repairQueue:summary.repairQueue.map(row=>({key:row.key,candidateRecipeCount:row.candidateRecipeCount,sourceSlugs:row.sourceSlugs})),
    candidateOnly:summary.candidateOnly,
    runtimeAdmissionChanged:summary.runtimeAdmissionChanged,
    publicRuntimeChanged:summary.publicRuntimeChanged,
    boundaries:summary.boundaries,
    nextGate:summary.nextGate
  };
}
