import { PUBLIC_RUNTIME_RECIPES } from "../src/data/corpus-v1.js";
import { DEFAULT_PROFILE, normalizeProfile } from "../src/domain/profile.js";
import { rankRecipes } from "../src/domain/recommendation.js";
import { planSlots } from "../src/domain/planner.js";

export const R3_SCHEMA = "CULINARY_PROTECTED_CORPUS_RECOMMENDATION_EXPANSION_R3_MACHINE_ACCEPTANCE_CONTRACT_V1";
export const R3_TERMINAL = "PROTECTED_CORPUS_RECOMMENDATION_EXPANSION_R3_MACHINE_ACCEPTANCE_PASS__CHIMICHURRI_HELD__NEXT_FRONTIER_READY";
export const R3_SUMMARY_SCHEMA = "CULINARY_PROTECTED_CORPUS_RECOMMENDATION_EXPANSION_R3_MACHINE_ACCEPTANCE_SUMMARY_V1";
const R2_TERMINAL = "PROTECTED_CORPUS_RECOMMENDATION_EXPANSION_R2_HARD_SAFETY_PASS__R3_READY";
const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"];
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

export function validateR3Contract(contract, r2) {
  const errors = [];
  if (contract?.schemaVersion !== R3_SCHEMA) errors.push("schemaVersion");
  if (contract?.protectedCorpusVersion !== "v8018") errors.push("protectedCorpusVersion");
  if (contract?.entryTerminal !== R2_TERMINAL) errors.push("entryTerminal");
  if (r2?.pass !== true || r2?.terminal !== R2_TERMINAL || r2?.candidate?.sourceSlug !== "chimichurri") errors.push("r2Evidence");
  if (contract?.source?.sourceCohortId !== "unitools-world-recipes-v1_1_0" || contract?.source?.sourceSlug !== "chimichurri") errors.push("source");
  if (contract?.source?.commit !== "1d09e9548d957dd0375301146a86dddf5e269c1b" || contract?.source?.dataBlobSha !== "a81e96415f09eac7fc0aec94a4da8d9f6d66d9ed") errors.push("sourcePin");
  if (contract?.candidate?.canonicalRecipeId !== "unitools_chimichurri") errors.push("candidateId");
  if (!same(contract?.candidate?.sourceOrderedCanonicalIngredientIds, ["parsley", "oregano", "garlic", "chilli_flakes", "vinegar", "olive_oil", "water", "salt"])) errors.push("ingredientOrder");
  if (!same(contract?.candidate?.candidateDeclaredAllergens, []) || !same(contract?.candidate?.candidateDietaryTags, ["unrestricted", "vegetarian", "vegan"])) errors.push("hardSafety");

  const difficulty = contract?.candidate?.reviewedDifficultyMapping || {};
  if (difficulty.sourceDifficulty !== "easy" || difficulty.runtimeDifficulty !== 1) errors.push("difficulty");

  const meal = contract?.candidate?.mealRoleDecision || {};
  if (meal.state !== "HOLD" || !same(meal.runtimeMealTypes, []) || meal.reason !== "SOURCE_CATEGORY_SAUCE_IS_NOT_STANDALONE_MEAL_ROLE_AUTHORITY") errors.push("mealRole");

  const time = contract?.candidate?.timeDecision || {};
  if (time.state !== "HOLD" || time.sourcePrepMinutes !== 15 || time.sourceCookMinutes !== 0 || time.sourceDeclaredTotalMinutes !== 15 || time.sourceInstructionMinuteSum !== 20 || time.sourceInstructionContainsTwoHourStand !== true || time.runtimeTotalMinutes !== null) errors.push("time");

  const auth = contract?.authority || {};
  for (const key of ["candidateSerializationAuthorized", "deterministicMachineAcceptanceAuthorized", "reviewedDifficultyMappingReuseAuthorized"]) {
    if (auth[key] !== true) errors.push("authority." + key);
  }
  for (const key of ["runtimeActivationAuthorized", "publicRuntimeWideningAuthorized", "automaticRecommendationAdmissionAuthorized", "ownerAdmissionGateOpen", "mealRoleInferenceAuthorized", "sourceTimeOverrideAuthorized", "sourceNutritionPromotionAuthorized", "sourceDietaryClaimPromotionAuthorized", "globalIngredientAliasIndexMutationAuthorized", "globalIngredientCatalogMutationAuthorized", "protectedD1ReadAuthorized", "protectedD1WriteAuthorized", "protectedBodyRewriteAuthorized", "knowledgeCoreWriteAuthorized", "paidModelOrApiAuthorized", "thirdShardAuthorized", "barbecueMutationAuthorized"]) {
    if (auth[key] !== false) errors.push("authority." + key);
  }
  if (contract?.targetTerminal !== R3_TERMINAL || contract?.nextGate !== "R1_NEXT_FRONTIER_ITERATION_V2") errors.push("terminal");
  return [...new Set(errors)].sort();
}

export function validateR3Candidate({ contract, r2, dataset, candidateArtifact }) {
  const errors = validateR3Contract(contract, r2);
  if (errors.length) throw new Error("R3_CONTRACT_INVALID__" + errors.join(","));
  if (dataset?.recipes?.length !== 501) throw new Error("R3_SOURCE_COUNT_MISMATCH");

  const source = dataset.recipes.find(row => row.slug === "chimichurri");
  if (!source) throw new Error("R3_SOURCE_RECIPE_MISSING");
  const minuteSum = (source.steps || []).reduce((sum, step) => sum + (Number.isFinite(step.minutes) ? step.minutes : 0), 0);
  const containsTwoHourStand = (source.steps || []).some(step => String(step?.text?.en || "").toLowerCase().includes("two hours"));
  if (source.country !== "AR" || source.category !== "sauce" || source.difficulty !== "easy" || source.prepMinutes !== 15 || source.cookMinutes !== 0 || source.baseServings !== 8 || source.steps?.length !== 4 || minuteSum !== 20 || containsTwoHourStand !== true) {
    throw new Error("R3_SOURCE_METADATA_DRIFT");
  }

  const recipe = candidateArtifact?.recipe;
  if (candidateArtifact?.schemaVersion !== "CULINARY_PROTECTED_CORPUS_RECOMMENDATION_EXPANSION_R3_CANDIDATE_V1" || candidateArtifact?.candidateOnly !== true || recipe?.id !== "unitools_chimichurri") throw new Error("R3_CANDIDATE_IDENTITY_MISMATCH");
  if (recipe?.governance?.recommendationState !== "REFERENCE_ONLY_INCOMPLETE_HARD_METADATA" || recipe?.governance?.candidateSemanticsOnly !== true || recipe?.governance?.runtimeActivationAuthorized !== false || recipe?.governance?.ownerAdmissionGateOpen !== false) throw new Error("R3_CANDIDATE_GOVERNANCE_MISMATCH");
  if (!same(recipe?.culinary?.mealTypes, []) || recipe?.culinary?.mealRoleState !== "HOLD_NON_STANDALONE_SAUCE" || recipe?.culinary?.difficulty !== 1) throw new Error("R3_CANDIDATE_CULINARY_MISMATCH");
  if (recipe?.time?.prepMinutes !== 15 || recipe?.time?.totalMinutes !== null || recipe?.time?.sourceInstructionMinuteSum !== 20 || recipe?.time?.sourceInstructionContainsTwoHourStand !== true) throw new Error("R3_CANDIDATE_TIME_MISMATCH");
  if (recipe?.serving?.servings !== 8 || !same(recipe?.dietaryTags, ["unrestricted", "vegetarian", "vegan"]) || !same(recipe?.allergySafety?.declaredAllergens, [])) throw new Error("R3_CANDIDATE_HARD_SAFETY_MISMATCH");
  if (recipe?.nutrition?.estimationState !== "EXTERNAL_RECIPE_NUTRITION_NOT_IMPORTED" || Object.values(recipe?.nutrition?.perServing || {}).some(value => value !== null)) throw new Error("R3_NUTRITION_FIREWALL_MISMATCH");

  const expectedIds = contract.candidate.sourceOrderedCanonicalIngredientIds;
  if (recipe?.ingredients?.length !== source.ingredients?.length || recipe.ingredients.length !== expectedIds.length) throw new Error("R3_INGREDIENT_COUNT_DRIFT");
  for (let i = 0; i < source.ingredients.length; i += 1) {
    const src = source.ingredients[i];
    const dst = recipe.ingredients[i];
    if (dst?.canonicalIngredientId !== expectedIds[i] || dst?.quantity !== (src.quantity ?? null) || dst?.unit !== (src.unit ?? null) || dst?.sourceText !== (src.name?.en || src.name?.ru || String(src.id || ""))) {
      throw new Error("R3_INGREDIENT_DRIFT__" + i);
    }
  }
  for (let i = 0; i < source.steps.length; i += 1) {
    if (recipe.instructions?.[i]?.text !== source.steps[i]?.text?.en) throw new Error("R3_INSTRUCTION_DRIFT__" + i);
  }

  if (PUBLIC_RUNTIME_RECIPES.length !== 86 || PUBLIC_RUNTIME_RECIPES.some(row => row.id === recipe.id)) throw new Error("R3_PUBLIC_RUNTIME_BOUNDARY_MISMATCH");

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
    const ranked = rankRecipes([recipe], profile, { mealType });
    if (ranked.eligible.length !== 0 || ranked.rejected.length !== 1 || !ranked.rejected[0].hardReasons.includes("external recipe lacks source-backed hard recommendation metadata")) {
      throw new Error("R3_RECOMMENDATION_ABSTENTION_MISMATCH__" + mealType);
    }
    const plan = planSlots([recipe], profile, [{ id: "r3-" + mealType, order: 1, day: "R3", mealType }]);
    if (plan.complete !== false || plan.items.length !== 0 || plan.shortfalls.length !== 1) throw new Error("R3_PLANNER_ABSTENTION_MISMATCH__" + mealType);
  }
  return recipe;
}

export function buildR3Summary(args) {
  const recipe = validateR3Candidate(args);
  return {
    schemaVersion: R3_SUMMARY_SCHEMA,
    date: "2026-09-29",
    pass: true,
    terminal: R3_TERMINAL,
    protectedCorpusVersion: "v8018",
    candidateId: recipe.id,
    sourceKey: "unitools-world-recipes-v1_1_0::chimichurri",
    sourcePin: { commit: args.contract.source.commit, dataBlobSha: args.contract.source.dataBlobSha },
    sourceMetadata: {
      category: "sauce",
      sourceDifficulty: "easy",
      prepMinutes: 15,
      cookMinutes: 0,
      sourceDeclaredTotalMinutes: 15,
      sourceInstructionMinuteSum: 20,
      sourceInstructionContainsTwoHourStand: true
    },
    reconciledHardMetadata: {
      runtimeDifficulty: 1,
      mealRoleState: "HOLD",
      runtimeMealTypes: [],
      timeAuthorityState: "HOLD",
      runtimeTotalMinutes: null
    },
    hardSafety: {
      declaredAllergens: recipe.allergySafety.declaredAllergens,
      dietaryTags: recipe.dietaryTags,
      authorityScope: "CANDIDATE_ONLY__CURRENT_MAPPED_PROFILE_TOKENS"
    },
    machineAcceptance: {
      candidateSerializationPass: true,
      recommendationAbstentionPass: true,
      plannerAbstentionPass: true,
      publicRuntimeUnchangedPass: true,
      nutritionFirewallPass: true
    },
    admissionReadyCandidateCount: 0,
    ownerAdmissionGateOpen: false,
    publicRuntimeRecipeCount: PUBLIC_RUNTIME_RECIPES.length,
    candidatePresentInPublicRuntime: false,
    recommendationAdmissionChanged: false,
    publicRuntimeChanged: false,
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
    nextGate: args.contract.nextGate
  };
}
