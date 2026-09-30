import { createHash } from "node:crypto";
import { inspectUnitoolsRecipe } from "./protected-corpus-recommendation-expansion-r1-frontier-core.mjs";
import { resolveWithReviewedUnitoolsAlias } from "./culinary-brain-c4-unitools-high-leverage-ingredient-alias-review-core.mjs";
import { ingredientById, normalizeIngredient } from "../src/data/ingredients.js";
import { PUBLIC_RUNTIME_RECIPES } from "../src/data/corpus-v1.js";

export const ITERATION_SCHEMA = "CULINARY_PROTECTED_CORPUS_RECOMMENDATION_EXPANSION_ITERATION_V1";
export const ITERATION_TERMINAL = "PROTECTED_CORPUS_RECOMMENDATION_EXPANSION_ITERATION_V3_PASS__NO_IDENTITY_READY_CANDIDATE__NEXT_FRONTIER_V4_READY";
export const ITERATION_SUMMARY_SCHEMA = "CULINARY_PROTECTED_CORPUS_RECOMMENDATION_EXPANSION_ITERATION_V3_SUMMARY_V1";
const ENTRY_TERMINAL = "PROTECTED_CORPUS_RECOMMENDATION_EXPANSION_ITERATION_V2_PASS__JASHA_MAROO_HELD__NEXT_FRONTIER_V3_READY";
const norm = value => String(value ?? "").trim().toLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").replace(/\\s+/g, " ");
const sourceName = ingredient => ingredient?.name?.en == null ? null : String(ingredient.name.en);
const sourceKey = ingredient => `${ingredient?.id ?? "<no-id>"} :: ${sourceName(ingredient) ?? "<no-name>"}`;
const decisionKey = (sourceId, name) => norm(sourceId) + " :: " + norm(name);
const same = (a,b) => JSON.stringify(a) === JSON.stringify(b);

export function validateIterationV3Contract(contract) {
  const errors=[];
  if (contract?.schemaVersion !== ITERATION_SCHEMA) errors.push("schemaVersion");
  if (contract?.iterationId !== "V3") errors.push("iterationId");
  if (contract?.protectedCorpusVersion !== "v8018") errors.push("protectedCorpusVersion");
  if (contract?.entryTerminal !== ENTRY_TERMINAL) errors.push("entryTerminal");
  if (contract?.source?.sourceCohortId !== "unitools-world-recipes-v1_1_0" || contract?.source?.expectedRecipeCount !== 501) errors.push("source");
  if (contract?.source?.commit !== "1d09e9548d957dd0375301146a86dddf5e269c1b" || contract?.source?.dataBlobSha !== "a81e96415f09eac7fc0aec94a4da8d9f6d66d9ed") errors.push("sourcePin");
  if (contract?.frontier?.candidateTrancheMaxRecipes !== 10 || contract?.frontier?.processedSourceSlugs?.length !== 22) errors.push("frontier");
  if (contract?.frontier?.expectedRemainingRankedCount !== 408 || contract?.frontier?.expectedZeroGapCount !== 0 || contract?.frontier?.expectedOneGapCount !== 0) errors.push("frontierCounts");
  if (!same(contract?.frontier?.expectedSourceSlugs, ["muriwo-unedovi","placinta","rolex-uganda","sukuma-wiki","suutei-tsai","tarator","tostones","baklava","banitsa","baursaki"])) errors.push("frontierSlugs");
  if (contract?.frontier?.expectedDigestSha256 !== "a5bac131f73ca80439def654ca6b88007e15cd43ab2ef373b20a69e87ee7cf1c") errors.push("frontierDigest");

  const decisions=contract?.identityDecisions || [];
  if (decisions.length !== 17) errors.push("identityDecisionCount");
  const seen=new Set();
  for (const row of decisions) {
    const key=decisionKey(row.sourceId,row.sourceName);
    if (seen.has(key)) errors.push("duplicateDecision:"+key);
    seen.add(key);
    if (!["MAP_EXISTING","HOLD"].includes(row.decision)) errors.push("identityDecision:"+key);
    if (row.decision === "MAP_EXISTING") {
      if (!row.canonicalIngredientId || !ingredientById(row.canonicalIngredientId)) errors.push("identityTarget:"+key);
    } else if (row.canonicalIngredientId) errors.push("holdTarget:"+key);
    if (!row.reason) errors.push("identityReason:"+key);
  }
  if (!same(contract?.expectedIdentityReadySourceSlugs, [])) errors.push("identityReadyExpectation");

  const auth=contract?.authority || {};
  for (const key of ["candidateDiscoveryAuthorized","candidateIdentityReviewAuthorized","candidateHardSafetyReviewAuthorized","deterministicMachineAcceptanceAuthorized"]) {
    if (auth[key] !== true) errors.push("authority."+key);
  }
  for (const key of ["runtimeActivationAuthorized","publicRuntimeWideningAuthorized","automaticRecommendationAdmissionAuthorized","ownerAdmissionGateOpen","globalIngredientAliasIndexMutationAuthorized","globalIngredientCatalogMutationAuthorized","protectedD1ReadAuthorized","protectedD1WriteAuthorized","protectedBodyRewriteAuthorized","knowledgeCoreWriteAuthorized","paidModelOrApiAuthorized","thirdShardAuthorized","barbecueMutationAuthorized"]) {
    if (auth[key] !== false) errors.push("authority."+key);
  }
  if (contract?.targetTerminal !== ITERATION_TERMINAL || contract?.nextGate !== "R1_NEXT_FRONTIER_ITERATION_V4") errors.push("terminal");
  return [...new Set(errors)].sort();
}

export function resolveIterationV3Identity(ingredient, aliasContract, contract) {
  const base=resolveWithReviewedUnitoolsAlias(ingredient,aliasContract);
  if (base.status !== "UNRESOLVED") return {...base,iterationResolutionState:base.resolutionState || base.status};
  const row=(contract.identityDecisions || []).find(decision => decisionKey(decision.sourceId,decision.sourceName) === decisionKey(ingredient?.id,sourceName(ingredient)));
  if (!row || row.decision !== "MAP_EXISTING") return {...base,iterationResolutionState:"HOLD"};
  const target=row.canonicalIngredientId;
  if (!ingredientById(target)) throw new Error("ITERATION_V3_IDENTITY_TARGET_MISSING__"+target);
  const sourceIdText=ingredient?.id == null ? null : String(ingredient.id).replace(/[_-]+/g," ");
  const diagnostic=sourceIdText ? normalizeIngredient(sourceIdText) : null;
  if (diagnostic && diagnostic !== target) return {...base,status:"CONFLICT",iterationResolutionState:"CONFLICT",reviewedAliasTarget:target};
  return {...base,status:"RESOLVED",canonicalIngredientId:target,nameMapping:target,iterationResolutionState:"REVIEWED_MAPPING"};
}

function buildFrontier(contract,aliasContract,dataset) {
  const processed=new Set(contract.frontier.processedSourceSlugs);
  const rows=dataset.recipes.map(recipe => inspectUnitoolsRecipe(recipe,aliasContract))
    .filter(row => !processed.has(row.sourceSlug))
    .filter(row => row.requiredHardMetadataReady)
    .filter(row => row.conflictIngredientOccurrenceCount === 0)
    .sort((a,b) => a.uniqueUnresolvedIngredientKeyCount-b.uniqueUnresolvedIngredientKeyCount
      || a.unresolvedIngredientOccurrenceCount-b.unresolvedIngredientOccurrenceCount
      || a.sourceSlug.localeCompare(b.sourceSlug));
  const frontier=rows.slice(0,contract.frontier.candidateTrancheMaxRecipes);
  const slugs=frontier.map(row => row.sourceSlug);
  const digest=createHash("sha256").update(JSON.stringify(slugs)).digest("hex");
  if (rows.length !== contract.frontier.expectedRemainingRankedCount) throw new Error("ITERATION_V3_REMAINING_COUNT_DRIFT");
  if (rows.filter(row => row.uniqueUnresolvedIngredientKeyCount === 0).length !== contract.frontier.expectedZeroGapCount) throw new Error("ITERATION_V3_ZERO_GAP_DRIFT");
  if (rows.filter(row => row.uniqueUnresolvedIngredientKeyCount === 1).length !== contract.frontier.expectedOneGapCount) throw new Error("ITERATION_V3_ONE_GAP_DRIFT");
  if (!same(slugs,contract.frontier.expectedSourceSlugs) || digest !== contract.frontier.expectedDigestSha256) throw new Error("ITERATION_V3_FRONTIER_DRIFT");
  const repairKeys=[...new Set(frontier.flatMap(row => row.unresolvedIngredientKeys))].map(norm).sort();
  const decisionKeys=(contract.identityDecisions || []).map(row => norm(row.sourceId+" :: "+row.sourceName)).sort();
  if (!same(repairKeys,decisionKeys)) throw new Error("ITERATION_V3_IDENTITY_DECISION_COVERAGE_DRIFT");
  return {rows,frontier,slugs,digest};
}

function buildIdentityReview(contract,aliasContract,dataset,frontier) {
  const bySlug=new Map(dataset.recipes.map(recipe => [recipe.slug,recipe]));
  const rows=frontier.map(frontierRow => {
    const recipe=bySlug.get(frontierRow.sourceSlug);
    const mappings=(recipe.ingredients || []).map(ingredient => {
      const resolved=resolveIterationV3Identity(ingredient,aliasContract,contract);
      return {key:sourceKey(ingredient),status:resolved.status};
    });
    const unresolved=mappings.filter(row => row.status !== "RESOLVED").map(row => row.key).sort();
    return {sourceSlug:recipe.slug,identityReady:unresolved.length === 0,unresolvedIngredientKeys:unresolved};
  });
  const ready=rows.filter(row => row.identityReady).map(row => row.sourceSlug).sort();
  if (!same(ready,contract.expectedIdentityReadySourceSlugs)) throw new Error("ITERATION_V3_IDENTITY_READY_DRIFT");
  return {rows,ready};
}

export function buildIterationV3Summary({contract,aliasContract,dataset}) {
  const errors=validateIterationV3Contract(contract);
  if (errors.length) throw new Error("ITERATION_V3_CONTRACT_INVALID__"+errors.join(","));
  if (!dataset?.recipes || dataset.recipes.length !== contract.source.expectedRecipeCount) throw new Error("ITERATION_V3_SOURCE_COUNT_DRIFT");
  const frontier=buildFrontier(contract,aliasContract,dataset);
  const identity=buildIdentityReview(contract,aliasContract,dataset,frontier.frontier);
  if (identity.ready.length !== 0) throw new Error("ITERATION_V3_UNEXPECTED_IDENTITY_READY_CANDIDATE");
  if (PUBLIC_RUNTIME_RECIPES.length !== 86) throw new Error("ITERATION_V3_PUBLIC_RUNTIME_BOUNDARY_DRIFT");
  return {
    schemaVersion:ITERATION_SUMMARY_SCHEMA,
    date:"2026-09-30",
    pass:true,
    terminal:ITERATION_TERMINAL,
    protectedCorpusVersion:"v8018",
    iterationId:"V3",
    sourcePin:{commit:contract.source.commit,dataBlobSha:contract.source.dataBlobSha},
    frontier:{
      remainingRankedCount:frontier.rows.length,
      zeroGapCount:frontier.rows.filter(row => row.uniqueUnresolvedIngredientKeyCount === 0).length,
      oneGapCount:frontier.rows.filter(row => row.uniqueUnresolvedIngredientKeyCount === 1).length,
      recipeCount:frontier.frontier.length,
      sourceSlugs:frontier.slugs,
      digestSha256:frontier.digest,
      rows:frontier.frontier.map(row => ({
        sourceSlug:row.sourceSlug,
        unresolvedIngredientOccurrenceCount:row.unresolvedIngredientOccurrenceCount,
        uniqueUnresolvedIngredientKeyCount:row.uniqueUnresolvedIngredientKeyCount,
        unresolvedIngredientKeys:row.unresolvedIngredientKeys
      }))
    },
    identityReview:{
      reviewedDecisionCount:contract.identityDecisions.length,
      mappedExistingDecisionCount:contract.identityDecisions.filter(row => row.decision === "MAP_EXISTING").length,
      heldDecisionCount:contract.identityDecisions.filter(row => row.decision === "HOLD").length,
      identityReadySourceSlugs:identity.ready,
      rows:identity.rows
    },
    machineAcceptance:{
      executed:false,
      reason:"NO_IDENTITY_READY_CANDIDATE",
      admissionReadyCandidateCount:0,
      ownerAdmissionGateOpen:false
    },
    publicRuntimeRecipeCount:PUBLIC_RUNTIME_RECIPES.length,
    publicRuntimeChanged:false,
    recommendationAdmissionChanged:false,
    boundaries:{
      protectedD1Reads:0,protectedD1Writes:0,protectedBodiesRewritten:0,
      globalIngredientAliasIndexMutations:0,globalIngredientCatalogMutations:0,
      knowledgeCoreWrites:0,paidInfrastructureUsed:false,thirdShardUsed:false,barbecueMutation:false
    },
    nextGate:contract.nextGate
  };
}
