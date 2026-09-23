import { ingredientById } from "../src/data/ingredients.js";

const finite = value => typeof value === "number" && Number.isFinite(value);

export function nutritionSignalState(recipe) {
  const nutrition = recipe?.nutrition?.perServing || {};
  const tracked = ["energyKcal", "proteinG", "carbohydrateG", "fatG", "fibreG"];
  const known = tracked.filter(key => finite(nutrition[key]));
  return {
    tracked,
    known,
    unknown: tracked.filter(key => !finite(nutrition[key])),
    complete: known.length === tracked.length,
    proteinKnown: finite(nutrition.proteinG),
    fibreKnown: finite(nutrition.fibreG)
  };
}

export function inspectRecommendationRecord(recipe) {
  const external = recipe?.provenance?.sourceType === "EXTERNAL_OPEN_RECIPE";
  const recommendationState = recipe?.governance?.recommendationState || "ELIGIBLE";
  const ingredients = Array.isArray(recipe?.ingredients) ? recipe.ingredients : [];
  const ingredientIdentityReady = ingredients.length > 0 && ingredients.every(item =>
    typeof item?.canonicalIngredientId === "string" && Boolean(ingredientById(item.canonicalIngredientId))
  );
  const allergenMetadataReady = Array.isArray(recipe?.allergySafety?.declaredAllergens);
  const dietaryMetadataReady = Array.isArray(recipe?.dietaryTags);
  const mealRoleReady = Array.isArray(recipe?.culinary?.mealTypes) && recipe.culinary.mealTypes.length > 0;
  const difficultyReady = finite(recipe?.culinary?.difficulty) && recipe.culinary.difficulty >= 1 && recipe.culinary.difficulty <= 4;
  const timeReady = finite(recipe?.time?.totalMinutes) && recipe.time.totalMinutes >= 0;
  const instructionsReady = Array.isArray(recipe?.instructions) && recipe.instructions.length > 0;
  const provenanceReady = !external || (
    typeof recipe?.provenance?.sourceUrl === "string" &&
    typeof recipe?.provenance?.license === "string" &&
    typeof recipe?.provenance?.attribution === "string"
  );
  const softMetadataReady =
    finite(recipe?.economics?.costTier) &&
    finite(recipe?.convenience?.mealPrepSuitability) &&
    finite(recipe?.convenience?.batchSuitability) &&
    finite(recipe?.convenience?.leftoverSuitability) &&
    finite(recipe?.convenience?.portability) &&
    finite(recipe?.discovery?.novelty) &&
    finite(recipe?.discovery?.techniqueLearningValue) &&
    typeof recipe?.culinary?.cuisine === "string" &&
    recipe.culinary.cuisine.length > 0;

  return {
    recipeId: recipe?.id || null,
    external,
    recommendationState,
    recommendationEligibleState: recommendationState === "ELIGIBLE",
    ingredientIdentityReady,
    allergenMetadataReady,
    dietaryMetadataReady,
    mealRoleReady,
    difficultyReady,
    timeReady,
    instructionsReady,
    provenanceReady,
    softMetadataReady,
    hardMetadataReady:
      ingredientIdentityReady &&
      allergenMetadataReady &&
      dietaryMetadataReady &&
      mealRoleReady &&
      difficultyReady &&
      timeReady &&
      instructionsReady &&
      provenanceReady,
    nutrition: nutritionSignalState(recipe)
  };
}

export function inspectUnknownNutritionEvaluation(record, evaluation) {
  if (!record.recommendationEligibleState || record.nutrition.complete) {
    return {
      applicable: false,
      safe: true,
      zeroCoercion: false,
      missingSignalsExplicit: true
    };
  }
  const missing = [];
  if (!record.nutrition.fibreKnown) missing.push("nutrition");
  if (!record.nutrition.proteinKnown) missing.push("protein");
  const unavailable = new Set(evaluation?.evidence?.unavailableSoftSignals || []);
  const missingSignalsExplicit = missing.every(signal => unavailable.has(signal));
  const zeroCoercion =
    (!record.nutrition.fibreKnown && evaluation?.components?.nutrition === 0) ||
    (!record.nutrition.proteinKnown && evaluation?.components?.protein === 0);
  return {
    applicable: true,
    safe: missingSignalsExplicit && !zeroCoercion,
    zeroCoercion,
    missingSignalsExplicit,
    expectedUnavailableSignals: missing
  };
}

export function summarizePublicReadiness(recipes, evaluations) {
  const rows = recipes.map(recipe => {
    const record = inspectRecommendationRecord(recipe);
    const evaluation = evaluations.get(recipe.id);
    const unknownNutritionEvaluation = inspectUnknownNutritionEvaluation(record, evaluation);
    return {
      ...record,
      evaluatorEligible: Boolean(evaluation?.eligible),
      unknownNutritionEvaluation
    };
  });
  const count = predicate => rows.filter(predicate).length;
  const stateCounts = {};
  for (const row of rows) stateCounts[row.recommendationState] = (stateCounts[row.recommendationState] || 0) + 1;
  const unknownEligibleRows = rows.filter(row => row.recommendationEligibleState && !row.nutrition.complete);
  return {
    recipeCount: rows.length,
    authoredRecipeCount: count(row => !row.external),
    externalRecipeCount: count(row => row.external),
    recommendationStateCounts: Object.fromEntries(Object.entries(stateCounts).sort(([a],[b]) => a.localeCompare(b))),
    recommendationEligibleStateCount: count(row => row.recommendationEligibleState),
    evaluatorEligibleCount: count(row => row.evaluatorEligible),
    hardMetadataReadyRecommendationEligibleCount: count(row => row.recommendationEligibleState && row.hardMetadataReady),
    hardMetadataBlockedRecommendationEligibleIds: rows
      .filter(row => row.recommendationEligibleState && !row.hardMetadataReady)
      .map(row => row.recipeId).sort(),
    unknownNutritionRecommendationEligibleCount: unknownEligibleRows.length,
    unknownNutritionSafeCount: unknownEligibleRows.filter(row => row.unknownNutritionEvaluation.safe).length,
    unknownNutritionZeroCoercionCount: unknownEligibleRows.filter(row => row.unknownNutritionEvaluation.zeroCoercion).length,
    unknownNutritionMissingSignalDisclosureCount: unknownEligibleRows.filter(row => row.unknownNutritionEvaluation.missingSignalsExplicit).length,
    unknownNutritionRecommendationEligibleIds: unknownEligibleRows.map(row => row.recipeId).sort()
  };
}

export function protectedReadinessFromFrozenSummaries(mapping, nutrition) {
  const protectedCount = Number(mapping?.observedRecipeCount || 0);
  const structuralExceptions = Array.isArray(mapping?.structuralExceptions) ? mapping.structuralExceptions.length : 0;
  const reviewedDietary = mapping?.canonicalAuthorityCoverage?.reviewedDietaryTags || {};
  const reviewedDietaryUnknown = Number(reviewedDietary.UNKNOWN || 0);
  const allIdentityReady = Number(nutrition?.protectedCorpusApplicability?.recipesWithAllIngredientIdentitiesResolved || 0);
  const directNutritionReady = Number(nutrition?.protectedCorpusApplicability?.directCurrentEngineAuthoritativeRecipes || 0);
  return {
    recipeCount: protectedCount,
    structurallyUsableCount: Math.max(0, protectedCount - structuralExceptions),
    structuralExceptionCount: structuralExceptions,
    allIngredientIdentityReadyCount: allIdentityReady,
    reviewedDietaryAuthorityCount: Math.max(0, protectedCount - reviewedDietaryUnknown),
    directCurrentEngineAuthoritativeNutritionCount: directNutritionReady,
    automaticRecommendationReadyCount: 0,
    identityReadyReviewCandidateCount: allIdentityReady,
    automaticAdmissionState: "HELD_FAIL_CLOSED",
    blockingReasons: [
      "REVIEWED_DIETARY_AUTHORITY_ABSENT_ACROSS_FROZEN_MAPPING_V1",
      "FULL_RECOMMENDATION_HARD_METADATA_NOT_EARNED_FOR_PROTECTED_CORPUS",
      "NUTRITION_UNKNOWN_MUST_REMAIN_EXPLICIT_AND_SEPARATE_FROM_ADMISSION"
    ]
  };
}
