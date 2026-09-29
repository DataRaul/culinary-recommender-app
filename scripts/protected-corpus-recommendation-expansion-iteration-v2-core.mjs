import { createHash } from "node:crypto";
import { inspectUnitoolsRecipe } from "./protected-corpus-recommendation-expansion-r1-frontier-core.mjs";
import { resolveWithReviewedUnitoolsAlias } from "./culinary-brain-c4-unitools-high-leverage-ingredient-alias-review-core.mjs";
import { ingredientById, normalizeIngredient } from "../src/data/ingredients.js";
import { PUBLIC_RUNTIME_RECIPES } from "../src/data/corpus-v1.js";
import { DEFAULT_PROFILE, normalizeProfile } from "../src/domain/profile.js";
import { rankRecipes } from "../src/domain/recommendation.js";
import { planSlots } from "../src/domain/planner.js";

export const ITERATION_SCHEMA = "CULINARY_PROTECTED_CORPUS_RECOMMENDATION_EXPANSION_ITERATION_V1";
export const ITERATION_TERMINAL = "PROTECTED_CORPUS_RECOMMENDATION_EXPANSION_ITERATION_V2_PASS__JASHA_MAROO_HELD__NEXT_FRONTIER_V3_READY";
export const ITERATION_SUMMARY_SCHEMA = "CULINARY_PROTECTED_CORPUS_RECOMMENDATION_EXPANSION_ITERATION_V2_SUMMARY_V1";
const ENTRY_TERMINAL = "PROTECTED_CORPUS_RECOMMENDATION_EXPANSION_R3_MACHINE_ACCEPTANCE_PASS__CHIMICHURRI_HELD__NEXT_FRONTIER_READY";
const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"];
const norm = value => String(value ?? "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ");
const decisionKey = (sourceId, sourceName) => norm(sourceId) + " :: " + norm(sourceName);
const sourceName = ingredient => ingredient?.name?.en == null ? null : String(ingredient.name.en);
const sourceKey = ingredient => `${ingredient?.id ?? "<no-id>"} :: ${sourceName(ingredient) ?? "<no-name>"}`;
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

export function validateIterationV2Contract(contract) {
  const errors = [];
  if (contract?.schemaVersion !== ITERATION_SCHEMA) errors.push("schemaVersion");
  if (contract?.iterationId !== "V2") errors.push("iterationId");
  if (contract?.protectedCorpusVersion !== "v8018") errors.push("protectedCorpusVersion");
  if (contract?.entryTerminal !== ENTRY_TERMINAL) errors.push("entryTerminal");
  if (contract?.source?.sourceCohortId !== "unitools-world-recipes-v1_1_0" || contract?.source?.expectedRecipeCount !== 501) errors.push("source");
  if (contract?.source?.commit !== "1d09e9548d957dd0375301146a86dddf5e269c1b" || contract?.source?.dataBlobSha !== "a81e96415f09eac7fc0aec94a4da8d9f6d66d9ed") errors.push("sourcePin");
  if (contract?.frontier?.candidateTrancheMaxRecipes !== 10 || contract?.frontier?.processedSourceSlugs?.length !== 12) errors.push("frontier");
  if (contract?.frontier?.expectedRemainingRankedCount !== 418 || contract?.frontier?.expectedZeroGapCount !== 0 || contract?.frontier?.expectedOneGapCount !== 0) errors.push("frontierCounts");
  if (!same(contract?.frontier?.expectedSourceSlugs, ["flia","gurasa","halloumi-grilled","hangi-style-chicken","hummus","injera","jasha-maroo","karjalanpiirakka","matapa","moros-y-cristianos"])) errors.push("frontierSlugs");
  if (contract?.frontier?.expectedDigestSha256 !== "128ac3e3375ac9dc0e5647c813199eadb9028870ebcabcf808ad2d8f624d56f6") errors.push("frontierDigest");

  const decisions = contract?.identityDecisions || [];
  if (decisions.length !== 19) errors.push("identityDecisionCount");
  const seen = new Set();
  for (const row of decisions) {
    const key = decisionKey(row.sourceId, row.sourceName);
    if (seen.has(key)) errors.push("duplicateDecision:" + key);
    seen.add(key);
    if (!["MAP_EXISTING", "HOLD"].includes(row.decision)) errors.push("identityDecision:" + key);
    if (row.decision === "MAP_EXISTING") {
      if (!row.canonicalIngredientId || !ingredientById(row.canonicalIngredientId)) errors.push("identityTarget:" + key);
    } else if (row.canonicalIngredientId) errors.push("holdTarget:" + key);
    if (!row.reason) errors.push("identityReason:" + key);
  }
  if (!same(contract?.expectedIdentityReadySourceSlugs, ["jasha-maroo"])) errors.push("identityReadyExpectation");

  const policies = contract?.hardSafety?.ingredientPolicies || [];
  if (contract?.hardSafety?.candidateSourceSlug !== "jasha-maroo" || policies.length !== 10) errors.push("hardSafety");
  const policyIds = [...policies.map(row => row.ingredientId)].sort();
  const expectedPolicyIds = ["chicken_breast","chilli","coriander","fresh_ginger","garlic","neutral_oil","onion","rice","salt","tomato"].sort();
  if (!same(policyIds, expectedPolicyIds)) errors.push("hardSafetyIngredientSet");
  for (const row of policies) {
    const ingredient = ingredientById(row.ingredientId);
    if (!ingredient) errors.push("hardSafetyMissingIngredient:" + row.ingredientId);
    if (!same([...(row.reviewedPresentAllergens || [])].sort(), [...(ingredient?.allergens || [])].sort())) errors.push("hardSafetyAllergenDrift:" + row.ingredientId);
    if (typeof row.vegetarian !== "boolean" || typeof row.vegan !== "boolean" || (row.vegan && !row.vegetarian)) errors.push("hardSafetyDiet:" + row.ingredientId);
  }

  const r3 = contract?.r3Decision || {};
  if (r3.candidateSourceSlug !== "jasha-maroo" || r3.canonicalRecipeId !== "unitools_jasha_maroo") errors.push("r3Candidate");
  if (r3.reviewedDifficultyMapping?.sourceDifficulty !== "easy" || r3.reviewedDifficultyMapping?.runtimeDifficulty !== 1) errors.push("r3Difficulty");
  if (r3.mealRoleDecision?.state !== "HOLD" || !same(r3.mealRoleDecision?.runtimeMealTypes, [])) errors.push("r3MealRole");
  if (r3.timeDecision?.state !== "HOLD" || r3.timeDecision?.sourceDeclaredTotalMinutes !== 55 || r3.timeDecision?.sourceInstructionMinuteSum !== 60 || r3.timeDecision?.runtimeTotalMinutes !== null) errors.push("r3Time");

  const auth = contract?.authority || {};
  for (const key of ["candidateDiscoveryAuthorized","candidateIdentityReviewAuthorized","candidateHardSafetyReviewAuthorized","deterministicMachineAcceptanceAuthorized"]) {
    if (auth[key] !== true) errors.push("authority." + key);
  }
  for (const key of ["runtimeActivationAuthorized","publicRuntimeWideningAuthorized","automaticRecommendationAdmissionAuthorized","ownerAdmissionGateOpen","globalIngredientAliasIndexMutationAuthorized","globalIngredientCatalogMutationAuthorized","protectedD1ReadAuthorized","protectedD1WriteAuthorized","protectedBodyRewriteAuthorized","knowledgeCoreWriteAuthorized","paidModelOrApiAuthorized","thirdShardAuthorized","barbecueMutationAuthorized"]) {
    if (auth[key] !== false) errors.push("authority." + key);
  }
  if (contract?.targetTerminal !== ITERATION_TERMINAL || contract?.nextGate !== "R1_NEXT_FRONTIER_ITERATION_V3") errors.push("terminal");
  return [...new Set(errors)].sort();
}

export function resolveIterationV2Identity(ingredient, aliasContract, contract) {
  const base = resolveWithReviewedUnitoolsAlias(ingredient, aliasContract);
  if (base.status !== "UNRESOLVED") return { ...base, iterationResolutionState: base.resolutionState || base.status };
  const row = (contract.identityDecisions || []).find(decision => decisionKey(decision.sourceId, decision.sourceName) === decisionKey(ingredient?.id, sourceName(ingredient)));
  if (!row || row.decision !== "MAP_EXISTING") return { ...base, iterationResolutionState: "HOLD" };
  const target = row.canonicalIngredientId;
  if (!ingredientById(target)) throw new Error("ITERATION_V2_IDENTITY_TARGET_MISSING__" + target);
  const sourceIdText = ingredient?.id == null ? null : String(ingredient.id).replace(/[_-]+/g, " ");
  const diagnostic = sourceIdText ? normalizeIngredient(sourceIdText) : null;
  if (diagnostic && diagnostic !== target) {
    return { ...base, status: "CONFLICT", iterationResolutionState: "CONFLICT", reviewedAliasTarget: target };
  }
  return { ...base, status: "RESOLVED", canonicalIngredientId: target, nameMapping: target, iterationResolutionState: "REVIEWED_MAPPING" };
}

function buildFrontier(contract, aliasContract, dataset) {
  const processed = new Set(contract.frontier.processedSourceSlugs);
  const rows = dataset.recipes.map(recipe => inspectUnitoolsRecipe(recipe, aliasContract));
  const ranked = rows
    .filter(row => !processed.has(row.sourceSlug))
    .filter(row => row.requiredHardMetadataReady)
    .filter(row => row.conflictIngredientOccurrenceCount === 0)
    .sort((a, b) =>
      a.uniqueUnresolvedIngredientKeyCount - b.uniqueUnresolvedIngredientKeyCount
      || a.unresolvedIngredientOccurrenceCount - b.unresolvedIngredientOccurrenceCount
      || a.sourceSlug.localeCompare(b.sourceSlug)
    );
  const frontier = ranked.slice(0, contract.frontier.candidateTrancheMaxRecipes);
  const slugs = frontier.map(row => row.sourceSlug);
  const digest = createHash("sha256").update(JSON.stringify(slugs)).digest("hex");
  if (ranked.length !== contract.frontier.expectedRemainingRankedCount) throw new Error("ITERATION_V2_REMAINING_COUNT_DRIFT");
  if (ranked.filter(row => row.uniqueUnresolvedIngredientKeyCount === 0).length !== contract.frontier.expectedZeroGapCount) throw new Error("ITERATION_V2_ZERO_GAP_DRIFT");
  if (ranked.filter(row => row.uniqueUnresolvedIngredientKeyCount === 1).length !== contract.frontier.expectedOneGapCount) throw new Error("ITERATION_V2_ONE_GAP_DRIFT");
  if (!same(slugs, contract.frontier.expectedSourceSlugs) || digest !== contract.frontier.expectedDigestSha256) throw new Error("ITERATION_V2_FRONTIER_DRIFT");
  const expectedRepairKeys = [...new Set(frontier.flatMap(row => row.unresolvedIngredientKeys))].map(norm).sort();
  const decisionKeys = (contract.identityDecisions || []).map(row => norm(row.sourceId + " :: " + row.sourceName)).sort();
  if (!same(expectedRepairKeys, decisionKeys)) throw new Error("ITERATION_V2_IDENTITY_DECISION_COVERAGE_DRIFT");
  return { ranked, frontier, slugs, digest };
}

function buildIdentityReview(contract, aliasContract, dataset, frontier) {
  const bySlug = new Map(dataset.recipes.map(recipe => [recipe.slug, recipe]));
  const rows = frontier.map(frontierRow => {
    const recipe = bySlug.get(frontierRow.sourceSlug);
    const mappings = (recipe.ingredients || []).map(ingredient => {
      const resolved = resolveIterationV2Identity(ingredient, aliasContract, contract);
      return {
        key: sourceKey(ingredient),
        status: resolved.status,
        canonicalIngredientId: resolved.canonicalIngredientId ?? null,
        resolutionState: resolved.iterationResolutionState
      };
    });
    const unresolved = mappings.filter(row => row.status !== "RESOLVED");
    const conflicts = mappings.filter(row => row.status === "CONFLICT");
    return {
      sourceSlug: recipe.slug,
      identityReady: unresolved.length === 0 && conflicts.length === 0,
      unresolvedIngredientKeys: unresolved.map(row => row.key).sort(),
      canonicalIngredientIds: unresolved.length === 0 && conflicts.length === 0 ? mappings.map(row => row.canonicalIngredientId) : []
    };
  });
  const ready = rows.filter(row => row.identityReady).map(row => row.sourceSlug).sort();
  if (!same(ready, contract.expectedIdentityReadySourceSlugs)) throw new Error("ITERATION_V2_IDENTITY_READY_DRIFT");
  return { rows, ready };
}

function buildHardSafety(contract, identityReview) {
  const candidate = identityReview.rows.find(row => row.sourceSlug === contract.hardSafety.candidateSourceSlug);
  if (!candidate?.identityReady) throw new Error("ITERATION_V2_HARD_SAFETY_CANDIDATE_NOT_READY");
  const uniqueIds = [...new Set(candidate.canonicalIngredientIds)].sort();
  const policies = contract.hardSafety.ingredientPolicies;
  if (!same(uniqueIds, policies.map(row => row.ingredientId).sort())) throw new Error("ITERATION_V2_HARD_SAFETY_POLICY_COVERAGE_DRIFT");
  const declaredAllergens = [...new Set(policies.flatMap(row => row.reviewedPresentAllergens || []))].sort();
  const dietaryTags = ["unrestricted"];
  if (policies.every(row => row.vegetarian === true)) dietaryTags.push("vegetarian");
  if (policies.every(row => row.vegan === true)) dietaryTags.push("vegan");
  return { declaredAllergens, dietaryTags, reviewedIngredientPolicyCount: policies.length };
}

function buildCandidate(contract, aliasContract, dataset, hardSafety) {
  const source = dataset.recipes.find(recipe => recipe.slug === contract.r3Decision.candidateSourceSlug);
  if (!source) throw new Error("ITERATION_V2_R3_SOURCE_MISSING");
  const minuteSum = (source.steps || []).reduce((sum, step) => sum + (Number.isFinite(step.minutes) ? step.minutes : 0), 0);
  if (source.category !== "main" || source.difficulty !== "easy" || source.prepMinutes !== 20 || source.cookMinutes !== 35 || source.baseServings !== 4 || minuteSum !== 60) throw new Error("ITERATION_V2_R3_SOURCE_METADATA_DRIFT");
  const ingredients = source.ingredients.map(ingredient => {
    const resolved = resolveIterationV2Identity(ingredient, aliasContract, contract);
    if (resolved.status !== "RESOLVED") throw new Error("ITERATION_V2_R3_IDENTITY_DRIFT__" + sourceKey(ingredient));
    return {
      canonicalIngredientId: resolved.canonicalIngredientId,
      quantity: ingredient.quantity ?? null,
      unit: ingredient.unit ?? null,
      required: true,
      sourceText: sourceName(ingredient)
    };
  });
  return {
    id: "unitools_jasha_maroo",
    identity: { canonicalTitle: source.name.en },
    provenance: {
      sourceType: "EXTERNAL_OPEN_RECIPE",
      sourceName: "UniTools World Recipes Dataset",
      sourceItemId: source.slug,
      sourceVersionId: "1.1.0@" + contract.source.commit + ":" + contract.source.dataBlobSha,
      attribution: "UniTools — theunitools.com",
      license: "CC-BY-SA-4.0",
      modifiedFromSource: true,
      admissionState: "ITERATION_V2_CANDIDATE_ONLY_HELD_INCOMPLETE_HARD_METADATA"
    },
    corpusMetadata: {
      corpus: "protected_v8018_iteration_v2_candidate_only",
      protectedSourceKey: "unitools-world-recipes-v1_1_0::jasha-maroo",
      admissionState: "ITERATION_V2_CANDIDATE_ONLY_HELD_INCOMPLETE_HARD_METADATA"
    },
    governance: {
      recommendationState: "REFERENCE_ONLY_INCOMPLETE_HARD_METADATA",
      candidateSemanticsOnly: true,
      runtimeActivationAuthorized: false,
      ownerAdmissionGateOpen: false,
      holdReasons: ["MEAL_ROLE_AUTHORITY_MISSING", "SOURCE_TIME_CONTRADICTION"],
      unknownIsNotZero: true
    },
    culinary: {
      cuisine: "Bhutanese",
      mealTypes: [],
      mealRoleState: "HOLD_SOURCE_MAIN_NOT_RUNTIME_ROLE",
      difficulty: 1,
      techniqueTags: []
    },
    time: {
      prepMinutes: 20,
      activeMinutes: null,
      passiveMinutes: null,
      totalMinutes: null,
      sourceDeclaredTotalMinutes: 55,
      sourceInstructionMinuteSum: 60,
      sourceState: "SOURCE_DECLARED_TIME_SHORTER_THAN_STEP_SUM__HOLD"
    },
    ingredients,
    instructions: source.steps.map(step => ({ text: step.text.en })),
    equipment: [],
    serving: { servings: 4 },
    nutrition: {
      perServing: { energyKcal: null, proteinG: null, carbohydrateG: null, fatG: null, fibreG: null },
      estimationState: "EXTERNAL_RECIPE_NUTRITION_NOT_IMPORTED",
      confidence: "unknown"
    },
    dietaryTags: hardSafety.dietaryTags,
    allergySafety: {
      declaredAllergens: hardSafety.declaredAllergens,
      basis: "ITERATION_V2_REVIEWED_CURRENT_PROFILE_TOKENS_ONLY"
    },
    economics: { costTier: 2 },
    convenience: { mealPrepSuitability: 2, batchSuitability: 2, leftoverSuitability: 2, portability: 2 },
    discovery: { flavourProfile: [], novelty: 2, techniqueLearningValue: 2 },
    geography: { region: null, country: "Bhutan" },
    mainProtein: "chicken_breast"
  };
}

function runMachineAcceptance(candidate) {
  if (PUBLIC_RUNTIME_RECIPES.length !== 86 || PUBLIC_RUNTIME_RECIPES.some(recipe => recipe.id === candidate.id)) throw new Error("ITERATION_V2_PUBLIC_RUNTIME_BOUNDARY_DRIFT");
  const profile = normalizeProfile({
    ...DEFAULT_PROFILE,
    maxMinutes: 180,
    skill: 4,
    budget: 4,
    cuisinePreferences: [],
    priorityPacks: [],
    allergens: [],
    excludedIngredientIds: [],
    unavailableIngredientIds: []
  });
  for (const mealType of MEAL_TYPES) {
    const ranked = rankRecipes([candidate], profile, { mealType });
    if (ranked.eligible.length !== 0 || ranked.rejected.length !== 1 || !ranked.rejected[0].hardReasons.includes("external recipe lacks source-backed hard recommendation metadata")) throw new Error("ITERATION_V2_RECOMMENDATION_ABSTENTION_DRIFT__" + mealType);
    const plan = planSlots([candidate], profile, [{ id: "iteration-v2-" + mealType, order: 1, day: "V2", mealType }]);
    if (plan.complete !== false || plan.items.length !== 0 || plan.shortfalls.length !== 1) throw new Error("ITERATION_V2_PLANNER_ABSTENTION_DRIFT__" + mealType);
  }
}

export function buildIterationV2Summary({ contract, aliasContract, dataset }) {
  const errors = validateIterationV2Contract(contract);
  if (errors.length) throw new Error("ITERATION_V2_CONTRACT_INVALID__" + errors.join(","));
  if (!dataset?.recipes || dataset.recipes.length !== contract.source.expectedRecipeCount) throw new Error("ITERATION_V2_SOURCE_COUNT_DRIFT");
  const frontier = buildFrontier(contract, aliasContract, dataset);
  const identity = buildIdentityReview(contract, aliasContract, dataset, frontier.frontier);
  const hardSafety = buildHardSafety(contract, identity);
  const candidate = buildCandidate(contract, aliasContract, dataset, hardSafety);
  runMachineAcceptance(candidate);
  return {
    schemaVersion: ITERATION_SUMMARY_SCHEMA,
    date: "2026-09-29",
    pass: true,
    terminal: ITERATION_TERMINAL,
    protectedCorpusVersion: "v8018",
    iterationId: "V2",
    sourcePin: { commit: contract.source.commit, dataBlobSha: contract.source.dataBlobSha },
    frontier: {
      remainingRankedCount: frontier.ranked.length,
      zeroGapCount: frontier.ranked.filter(row => row.uniqueUnresolvedIngredientKeyCount === 0).length,
      oneGapCount: frontier.ranked.filter(row => row.uniqueUnresolvedIngredientKeyCount === 1).length,
      recipeCount: frontier.frontier.length,
      sourceSlugs: frontier.slugs,
      digestSha256: frontier.digest,
      rows: frontier.frontier.map(row => ({
        sourceSlug: row.sourceSlug,
        unresolvedIngredientOccurrenceCount: row.unresolvedIngredientOccurrenceCount,
        uniqueUnresolvedIngredientKeyCount: row.uniqueUnresolvedIngredientKeyCount,
        unresolvedIngredientKeys: row.unresolvedIngredientKeys
      }))
    },
    identityReview: {
      reviewedDecisionCount: contract.identityDecisions.length,
      mappedExistingDecisionCount: contract.identityDecisions.filter(row => row.decision === "MAP_EXISTING").length,
      heldDecisionCount: contract.identityDecisions.filter(row => row.decision === "HOLD").length,
      identityReadySourceSlugs: identity.ready,
      rows: identity.rows
    },
    hardSafety: {
      candidateSourceSlug: contract.hardSafety.candidateSourceSlug,
      reviewedIngredientPolicyCount: hardSafety.reviewedIngredientPolicyCount,
      declaredAllergens: hardSafety.declaredAllergens,
      dietaryTags: hardSafety.dietaryTags,
      authorityScope: "CANDIDATE_ONLY__CURRENT_MAPPED_PROFILE_TOKENS"
    },
    r3: {
      candidateId: candidate.id,
      sourceCategory: "main",
      sourceDifficulty: "easy",
      runtimeDifficulty: 1,
      mealRoleState: "HOLD",
      runtimeMealTypes: [],
      sourceDeclaredTotalMinutes: 55,
      sourceInstructionMinuteSum: 60,
      timeAuthorityState: "HOLD",
      runtimeTotalMinutes: null,
      recommendationAbstentionPass: true,
      plannerAbstentionPass: true,
      admissionReadyCandidateCount: 0,
      ownerAdmissionGateOpen: false
    },
    publicRuntimeRecipeCount: PUBLIC_RUNTIME_RECIPES.length,
    publicRuntimeChanged: false,
    recommendationAdmissionChanged: false,
    boundaries: {
      protectedD1Reads: 0,
      protectedD1Writes: 0,
      protectedBodiesRewritten: 0,
      globalIngredientAliasIndexMutations: 0,
      globalIngredientCatalogMutations: 0,
      knowledgeCoreWrites: 0,
      paidInfrastructureUsed: false,
      thirdShardUsed: false,
      barbecueMutation: false
    },
    nextGate: contract.nextGate
  };
}
