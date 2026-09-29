import { ingredientById, normalizeIngredient } from "../src/data/ingredients.js";
import { P3_ACTIVATED_EXTERNAL_RECIPES, PUBLIC_EXTERNAL_RECIPES, PUBLIC_RUNTIME_RECIPES } from "../src/data/corpus-v1.js";

export const P3_ACTIVATION_SCHEMA = "CULINARY_BRAIN_P3_TAPIOCA_BOUNDED_ACTIVATION_CONTRACT_V1";
export const P3_ACTIVATION_SUMMARY_SCHEMA = "CULINARY_BRAIN_P3_TAPIOCA_BOUNDED_ACTIVATION_SUMMARY_V1";
export const P3_ACTIVATION_TERMINAL = "CULINARY_BRAIN_P3_TAPIOCA_BOUNDED_ACTIVATION_PASS__P4_READY";

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

export function validateP3ActivationContract(contract) {
  const errors = [];
  if (contract?.schemaVersion !== P3_ACTIVATION_SCHEMA) errors.push("schemaVersion");
  if (contract?.protectedCorpusVersion !== "v8018") errors.push("protectedCorpusVersion");
  if (contract?.entryTerminal !== "CULINARY_BRAIN_C4_TAPIOCA_BOUNDED_P3_CONTRACT_PASS__PREACTIVATION_READY") errors.push("entryTerminal");
  if (contract?.ownerAuthorization?.received !== true || !same(contract?.ownerAuthorization?.scope, ["unitools_pao_de_queijo"])) errors.push("ownerAuthorization");
  if (contract?.source?.commit !== "1d09e9548d957dd0375301146a86dddf5e269c1b" || contract?.source?.dataBlobSha !== "a81e96415f09eac7fc0aec94a4da8d9f6d66d9ed") errors.push("sourcePin");
  if (contract?.source?.sourceSlug !== "pao-de-queijo") errors.push("sourceSlug");
  if (contract?.activation?.canonicalRecipeId !== "unitools_pao_de_queijo") errors.push("candidateId");
  if (contract?.activation?.publicRuntimeRecipeCountBefore !== 85 || contract?.activation?.publicRuntimeRecipeCountAfter !== 86) errors.push("publicCounts");
  if (contract?.activation?.publicExternalRecipeCountBefore !== 9 || contract?.activation?.publicExternalRecipeCountAfter !== 10) errors.push("externalCounts");
  if (contract?.activation?.activatedRecipeCount !== 1) errors.push("activatedRecipeCount");
  if (!same(contract?.activation?.reviewedMealTypes, ["breakfast", "snack"])) errors.push("mealTypes");
  if (contract?.activation?.runtimeDifficulty !== 3 || contract?.activation?.totalMinutes !== 50 || contract?.activation?.servings !== 6) errors.push("hardMetadata");
  if (!same(contract?.activation?.declaredAllergens, ["egg", "milk"]) || !same(contract?.activation?.dietaryTags, ["unrestricted"])) errors.push("hardSafety");
  const identity = contract?.activation?.exactCanonicalIngredientIdentity;
  if (identity?.id !== "tapioca_starch" || identity?.name !== "tapioca starch" || !same(identity?.aliases, []) || identity?.scope !== "EXACT_CANONICAL_IDENTITY_ONLY__NO_ALIAS_WIDENING") errors.push("tapiocaIdentity");
  const auth = contract?.authority || {};
  for (const key of ["ownerActivationAuthorized", "runtimeActivationAuthorized", "publicRuntimeWideningAuthorized", "exactCandidateRecommendationAdmissionAuthorized", "exactCanonicalIngredientIdentityPromotionAuthorized"]) {
    if (auth[key] !== true) errors.push("authority." + key);
  }
  for (const key of ["globalIngredientAliasWideningAuthorized", "automaticRecommendationAdmissionAuthorized", "furtherProtectedRecipeAdmissionAuthorized", "protectedD1ReadAuthorized", "protectedD1WriteAuthorized", "protectedBodyRewriteAuthorized", "knowledgeCoreWriteAuthorized", "paidModelOrApiAuthorized", "thirdShardAuthorized", "barbecueMutationAuthorized"]) {
    if (auth[key] !== false) errors.push("authority." + key);
  }
  if (contract?.targetTerminal !== P3_ACTIVATION_TERMINAL) errors.push("targetTerminal");
  if (contract?.nextGate !== "PROTECTED_CORPUS_RUNTIME_USABILITY_P4_REAL_20K_REGRESSION_AND_PRODUCT_ACCEPTANCE") errors.push("nextGate");
  return [...new Set(errors)].sort();
}

export function validateP3Activation({ contract, dataset, candidateArtifact }) {
  const errors = validateP3ActivationContract(contract);
  if (errors.length) throw new Error("P3_ACTIVATION_CONTRACT_INVALID__" + errors.join(","));
  if (dataset?.recipes?.length !== 501) throw new Error("P3_ACTIVATION_SOURCE_COUNT_MISMATCH");
  const source = dataset.recipes.find(row => row.slug === contract.source.sourceSlug);
  if (!source) throw new Error("P3_ACTIVATION_SOURCE_RECIPE_MISSING");
  if (source.country !== "BR" || source.category !== "bread" || source.difficulty !== "medium" || source.prepMinutes !== 25 || source.cookMinutes !== 25 || source.baseServings !== 6) throw new Error("P3_ACTIVATION_SOURCE_HARD_METADATA_DRIFT");
  if (!Array.isArray(source.steps) || source.steps.length !== 5) throw new Error("P3_ACTIVATION_SOURCE_INSTRUCTION_DRIFT");

  const frozenCandidate = candidateArtifact?.recipe;
  if (candidateArtifact?.candidateOnly !== true || frozenCandidate?.id !== "unitools_pao_de_queijo" || frozenCandidate?.governance?.runtimeActivationAuthorized !== false) {
    throw new Error("P3_ACTIVATION_PREACTIVATION_ARTIFACT_DRIFT");
  }

  const recipe = PUBLIC_RUNTIME_RECIPES.find(row => row.id === contract.activation.canonicalRecipeId);
  if (!recipe || P3_ACTIVATED_EXTERNAL_RECIPES.length !== 1 || P3_ACTIVATED_EXTERNAL_RECIPES[0] !== recipe) throw new Error("P3_ACTIVATION_RUNTIME_ADMISSION_MISMATCH");
  if (PUBLIC_RUNTIME_RECIPES.length !== 86 || PUBLIC_EXTERNAL_RECIPES.length !== 10 || new Set(PUBLIC_RUNTIME_RECIPES.map(row => row.id)).size !== 86) throw new Error("P3_ACTIVATION_PUBLIC_COUNT_MISMATCH");
  if (recipe.governance?.runtimeActivationAuthorized !== true || recipe.governance?.candidateSemanticsOnly !== false || recipe.governance?.recommendationState !== "ELIGIBLE") throw new Error("P3_ACTIVATION_GOVERNANCE_MISMATCH");
  if (!same(recipe.culinary?.mealTypes, ["breakfast", "snack"]) || recipe.culinary?.difficulty !== 3 || recipe.time?.totalMinutes !== 50 || recipe.serving?.servings !== 6) throw new Error("P3_ACTIVATION_HARD_METADATA_MISMATCH");
  if (!same(recipe.dietaryTags, ["unrestricted"]) || !same(recipe.allergySafety?.declaredAllergens, ["egg", "milk"])) throw new Error("P3_ACTIVATION_HARD_SAFETY_MISMATCH");
  if (recipe.nutrition?.estimationState !== "EXTERNAL_RECIPE_NUTRITION_NOT_IMPORTED" || Object.values(recipe.nutrition?.perServing || {}).some(value => value !== null)) throw new Error("P3_ACTIVATION_NUTRITION_FIREWALL_MISMATCH");
  if (recipe.provenance?.license !== "CC-BY-SA-4.0" || recipe.provenance?.sourceItemId !== "pao-de-queijo" || recipe.provenance?.sourceVersionId !== contract.source.datasetVersion + "@" + contract.source.commit + ":" + contract.source.dataBlobSha) throw new Error("P3_ACTIVATION_PROVENANCE_MISMATCH");

  const tapioca = ingredientById("tapioca_starch");
  if (!tapioca || tapioca.name !== "tapioca starch" || tapioca.allergens?.length !== 0) throw new Error("P3_ACTIVATION_TAPIOCA_IDENTITY_MISMATCH");
  if (normalizeIngredient("tapioca starch") !== "tapioca_starch" || normalizeIngredient("Tapioca starch") !== "tapioca_starch") throw new Error("P3_ACTIVATION_TAPIOCA_EXACT_NORMALIZATION_MISMATCH");
  if (normalizeIngredient("tapioca") !== null) throw new Error("P3_ACTIVATION_TAPIOCA_ALIAS_WIDENED");

  if (recipe.ingredients?.length !== 8 || recipe.ingredients[0]?.canonicalIngredientId !== "tapioca_starch") throw new Error("P3_ACTIVATION_INGREDIENT_MAPPING_MISMATCH");
  return recipe;
}

export function buildP3ActivationSummary(args) {
  const recipe = validateP3Activation(args);
  return {
    schemaVersion: P3_ACTIVATION_SUMMARY_SCHEMA,
    date: "2026-09-28",
    pass: true,
    terminal: P3_ACTIVATION_TERMINAL,
    protectedCorpusVersion: "v8018",
    ownerAuthorization: { received: true, scope: [recipe.id] },
    sourceKey: "unitools-world-recipes-v1_1_0::pao-de-queijo",
    candidateId: recipe.id,
    sourcePin: { commit: args.contract.source.commit, dataBlobSha: args.contract.source.dataBlobSha },
    publicRuntime: {
      recipeCountBefore: 85,
      recipeCountAfter: PUBLIC_RUNTIME_RECIPES.length,
      publicExternalCountBefore: 9,
      publicExternalCountAfter: PUBLIC_EXTERNAL_RECIPES.length,
      activatedCandidateCount: P3_ACTIVATED_EXTERNAL_RECIPES.length
    },
    hardSafety: {
      declaredAllergens: recipe.allergySafety.declaredAllergens,
      dietaryTags: recipe.dietaryTags,
      reviewedMealTypes: recipe.culinary.mealTypes,
      exactCanonicalIngredientIdentity: "tapioca_starch",
      globalAliasWidening: false
    },
    provenance: {
      license: recipe.provenance.license,
      attribution: recipe.provenance.attribution,
      sourceNutritionImported: false
    },
    boundaries: {
      automaticRecommendationAdmissionAuthorized: false,
      furtherProtectedRecipeAdmissionAuthorized: false,
      protectedD1Reads: 0,
      protectedD1Writes: 0,
      protectedBodyRewrites: 0,
      knowledgeCoreWrites: 0,
      paidModelOrApi: false,
      thirdShard: false,
      barbecueMutation: false
    },
    nextGate: args.contract.nextGate
  };
}
