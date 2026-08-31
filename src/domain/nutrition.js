import {
  nutritionEvidenceCoverage,
  nutritionEvidenceForIngredient,
  USDA_FOUNDATION_DENSITIES,
  USDA_FOUNDATION_SOURCE
} from "../data/nutrition-evidence.js";
import { USDA_FOUNDATION_COMPOSITION_SOURCE } from "../data/usda-foundation-nutrients-v1.js";
import {
  USDA_FOUNDATION_PORTION_SOURCE,
  usdaFoundationAmbiguousPortion,
  usdaFoundationPortionConversion
} from "../data/usda-foundation-portions-v1.js";

const quantityToGrams = ingredient => {
  const quantity = ingredient?.quantity;
  const unit = String(ingredient?.unit || "").toLowerCase();
  if (typeof quantity !== "number" || !Number.isFinite(quantity)) {
    return { grams: null, reason: "invalid_quantity", quantityEvidence: null };
  }
  if (unit === "g") return { grams: quantity, reason: null, quantityEvidence: { state: "DIRECT_MASS", unit: "g" } };
  if (unit === "kg") return { grams: quantity * 1000, reason: null, quantityEvidence: { state: "DIRECT_MASS", unit: "kg" } };

  const ingredientId = ingredient?.canonicalIngredientId;
  const portion = usdaFoundationPortionConversion(ingredientId, unit);
  if (portion) {
    return {
      grams: quantity * portion.gramsPerUnit,
      reason: null,
      quantityEvidence: {
        state: portion.evidenceState,
        inputUnit: unit,
        gramsPerUnit: portion.gramsPerUnit,
        sourceUnit: portion.sourceUnit,
        modifier: portion.modifier,
        fdcId: portion.fdcId
      }
    };
  }

  const ambiguous = usdaFoundationAmbiguousPortion(ingredientId, unit);
  if (ambiguous) {
    return {
      grams: null,
      reason: "ambiguous_portion_unit",
      quantityEvidence: {
        state: "USDA_FOUNDATION_PORTION_AMBIGUOUS",
        inputUnit: unit,
        reason: ambiguous.reason,
        candidateGramWeights: [...ambiguous.candidateGramWeights]
      }
    };
  }

  return { grams: null, reason: "unsupported_quantity_unit", quantityEvidence: null };
};

const nutrientKeys = ["energyKcal", "proteinG", "carbohydrateG", "fatG", "fibreG"];
const roundToTenths = value => Math.round((value + Number.EPSILON * Math.max(1, Math.abs(value))) * 10) / 10;
const roundNutrient = (key, value) => key === "energyKcal" ? Math.round(value) : roundToTenths(value);

export function calculatePerServingFromDensities(recipe, densityMap = {}) {
  const ingredients = (recipe.ingredients || []).filter(ingredient => ingredient.required !== false);
  const totals = Object.fromEntries(nutrientKeys.map(key => [key, 0]));
  const coveredCounts = Object.fromEntries(nutrientKeys.map(key => [key, 0]));
  const used = [];
  const skipped = [];

  for (const ingredient of ingredients) {
    const ingredientId = ingredient.canonicalIngredientId;
    const densityRecord = densityMap[ingredientId];
    const density = densityRecord?.per100g || densityRecord;
    const quantityResolution = quantityToGrams(ingredient);
    if (!density || quantityResolution.grams === null) {
      skipped.push({
        ingredientId,
        reason: !density ? "missing_density" : quantityResolution.reason,
        ...(quantityResolution.quantityEvidence ? { quantityEvidence: quantityResolution.quantityEvidence } : {})
      });
      continue;
    }

    const grams = quantityResolution.grams;
    const factor = grams / 100;
    const availableNutrients = [];
    const missingNutrients = [];
    for (const key of nutrientKeys) {
      const value = density[key];
      if (value === null || value === undefined || !Number.isFinite(Number(value))) {
        missingNutrients.push(key);
        continue;
      }
      totals[key] += Number(value) * factor;
      coveredCounts[key] += 1;
      availableNutrients.push(key);
    }
    used.push({
      ingredientId,
      grams,
      quantityEvidence: quantityResolution.quantityEvidence,
      availableNutrients,
      missingNutrients
    });
  }

  const servings = Math.max(1, Number(recipe.serving?.servings) || 1);
  const totalIngredients = ingredients.length;
  const knownContributionPerServing = Object.fromEntries(nutrientKeys.map(key => [key, roundNutrient(key, totals[key] / servings)]));
  const nutrientCoverage = Object.fromEntries(nutrientKeys.map(key => [key, {
    coveredIngredients: coveredCounts[key],
    totalIngredients,
    complete: totalIngredients > 0 && coveredCounts[key] === totalIngredients
  }]));
  const perServing = Object.fromEntries(nutrientKeys.map(key => [
    key,
    nutrientCoverage[key].complete ? knownContributionPerServing[key] : null
  ]));
  const complete = totalIngredients > 0 && skipped.length === 0 && nutrientKeys.every(key => nutrientCoverage[key].complete);
  const anyCoverage = used.length > 0 && nutrientKeys.some(key => coveredCounts[key] > 0);

  return {
    perServing,
    knownContributionPerServing,
    nutrientCoverage,
    used,
    skipped,
    complete,
    calculationState: complete ? "CALCULATED_FROM_STATIC_DENSITIES" : anyCoverage ? "PARTIAL_STATIC_CALCULATION" : "INSUFFICIENT_STATIC_DATA"
  };
}

export const publicNutritionSource = {
  estimate(recipe) {
    const ingredientIds = (recipe.ingredients || []).map(item => item.canonicalIngredientId);
    const coverage = nutritionEvidenceCoverage(ingredientIds);
    const identities = coverage.mappedIngredientIds.map(ingredientId => nutritionEvidenceForIngredient(ingredientId));
    const staticCalculation = calculatePerServingFromDensities(recipe, USDA_FOUNDATION_DENSITIES);
    const authoritativeRecipeCalculation = staticCalculation.complete;
    return {
      perServing: authoritativeRecipeCalculation ? staticCalculation.perServing : { ...(recipe.nutrition?.perServing || {}) },
      method: authoritativeRecipeCalculation ? "USDA_FDC_FOUNDATION_STATIC_CALCULATION" : recipe.nutrition?.estimationState || "INFERRED_ESTIMATE",
      confidence: authoritativeRecipeCalculation ? "medium" : recipe.nutrition?.confidence || "low",
      provenance: authoritativeRecipeCalculation
        ? "Calculated deterministically from reviewed bounded USDA FoodData Central Foundation Foods per-100g composition and evidence-backed quantity weights; cooking/yield uncertainty remains."
        : recipe.nutrition?.provenance || "Project-authored estimate.",
      evidence: {
        source: USDA_FOUNDATION_SOURCE,
        compositionSource: USDA_FOUNDATION_COMPOSITION_SOURCE,
        portionSource: USDA_FOUNDATION_PORTION_SOURCE,
        coverage,
        identities,
        compositionImported: true,
        portionEvidenceImported: true,
        staticCalculation,
        state: authoritativeRecipeCalculation
          ? "AUTHORITATIVE_STATIC_RECIPE_CALCULATION_AVAILABLE"
          : staticCalculation.calculationState === "PARTIAL_STATIC_CALCULATION"
            ? "PARTIAL_STATIC_EVIDENCE_ESTIMATE_PRESERVED"
            : "STATIC_EVIDENCE_INSUFFICIENT_ESTIMATE_PRESERVED"
      }
    };
  }
};
