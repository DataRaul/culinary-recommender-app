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
import { MATVARETABELLEN_COMPOSITION_SOURCE_B9 } from "../data/matvaretabellen-composition-b9.js";
import { MATVARETABELLEN_COMPOSITION_SOURCE_B10 } from "../data/matvaretabellen-composition-b10.js";
import {
  MATVARETABELLEN_PORTION_SOURCE_B6,
  matvaretabellenAmbiguousPortion,
  matvaretabellenPortionConversion
} from "../data/matvaretabellen-portions-b6.js";
import {
  MATVARETABELLEN_PORTION_SOURCE_B15,
  matvaretabellenPortionConversionB15
} from "../data/matvaretabellen-portions-b15.js";
import {
  MATVARETABELLEN_PORTION_SOURCE_B17,
  matvaretabellenPortionConversionB17
} from "../data/matvaretabellen-portions-b17.js";
import {
  USDA_SR_LEGACY_PORTION_SOURCE_B8,
  usdaSrLegacyPortionConversion
} from "../data/usda-sr-legacy-portions-b8.js";
import {
  USDA_SR28_PEANUT_BUTTER_PORTION_SOURCE_B37,
  usdaSr28PeanutButterPortionConversionB37
} from "../data/usda-sr28-peanut-butter-portions-b37.js";
import {
  USDA_NFCS_MISO_PORTION_SOURCE_B38,
  usdaNfcsMisoPortionConversionB38
} from "../data/usda-nfcs-miso-portions-b38.js";
import {
  USDA_SR28_SALT_PORTION_SOURCE_B40,
  usdaSr28SaltPortionConversionB40
} from "../data/usda-sr28-salt-portions-b40.js";
import {
  USDA_SR28_SESAME_OIL_PORTION_SOURCE_B41,
  usdaSr28SesameOilPortionConversionB41
} from "../data/usda-sr28-sesame-oil-portions-b41.js";
import {
  USDA_SR28_FISH_SAUCE_PORTION_SOURCE_B49,
  usdaSr28FishSaucePortionConversionB49
} from "../data/usda-sr28-fish-sauce-portions-b49.js";
import {
  CIQUAL_RUNTIME_SOURCE_V1,
  EUROPEAN_PRIMARY_DENSITIES_V1,
  EUROPEAN_PRIMARY_POLICY_V1,
  europeanPrimaryPolicyCoverage
} from "./nutrition-source-policy-runtime.js";

const quantityToGrams = ingredient => {
  const quantity = ingredient?.quantity;
  const unit = String(ingredient?.unit || "").toLowerCase();
  if (typeof quantity !== "number" || !Number.isFinite(quantity)) {
    return { grams: null, reason: "invalid_quantity", quantityEvidence: null };
  }
  if (unit === "g") return { grams: quantity, reason: null, quantityEvidence: { state: "DIRECT_MASS", unit: "g" } };
  if (unit === "kg") return { grams: quantity * 1000, reason: null, quantityEvidence: { state: "DIRECT_MASS", unit: "kg" } };

  const ingredientId = ingredient?.canonicalIngredientId;
  const srLegacyPortion = usdaSrLegacyPortionConversion(ingredientId, unit);
  if (srLegacyPortion) {
    return {
      grams: quantity * srLegacyPortion.gramsPerUnit,
      reason: null,
      quantityEvidence: {
        state: srLegacyPortion.evidenceState,
        sourceId: USDA_SR_LEGACY_PORTION_SOURCE_B8.id,
        evidenceTranche: srLegacyPortion.evidenceTranche,
        inputUnit: unit,
        gramsPerUnit: srLegacyPortion.gramsPerUnit,
        sourceUnit: srLegacyPortion.sourceUnit,
        modifier: srLegacyPortion.modifier,
        fdcId: srLegacyPortion.fdcId,
        ndbNumber: srLegacyPortion.ndbNumber,
        portionRowId: srLegacyPortion.portionRowId
      }
    };
  }

  const sr28PeanutButterPortion = usdaSr28PeanutButterPortionConversionB37(ingredientId, unit);
  if (sr28PeanutButterPortion) {
    return {
      grams: quantity * sr28PeanutButterPortion.gramsPerUnit,
      reason: null,
      quantityEvidence: {
        state: sr28PeanutButterPortion.evidenceState,
        sourceId: USDA_SR28_PEANUT_BUTTER_PORTION_SOURCE_B37.id,
        evidenceTranche: sr28PeanutButterPortion.evidenceTranche,
        inputUnit: unit,
        gramsPerUnit: sr28PeanutButterPortion.gramsPerUnit,
        sourceUnit: sr28PeanutButterPortion.sourceUnit,
        sourceMeasureAmount: sr28PeanutButterPortion.sourceMeasureAmount,
        sourceMeasureGramWeight: sr28PeanutButterPortion.sourceMeasureGramWeight,
        reviewedNdbNumbers: [...sr28PeanutButterPortion.reviewedNdbNumbers],
        reviewedVariantCount: sr28PeanutButterPortion.reviewedVariantCount,
        matchConfidence: sr28PeanutButterPortion.matchConfidence
      }
    };
  }

  const nfcsMisoPortion = usdaNfcsMisoPortionConversionB38(ingredientId, unit);
  if (nfcsMisoPortion) {
    return {
      grams: quantity * nfcsMisoPortion.gramsPerUnit,
      reason: null,
      quantityEvidence: {
        state: nfcsMisoPortion.evidenceState,
        sourceId: USDA_NFCS_MISO_PORTION_SOURCE_B38.id,
        evidenceTranche: nfcsMisoPortion.evidenceTranche,
        inputUnit: unit,
        gramsPerUnit: nfcsMisoPortion.gramsPerUnit,
        sourceMeasureAmount: nfcsMisoPortion.sourceMeasureAmount,
        sourceMeasureUnit: nfcsMisoPortion.sourceMeasureUnit,
        sourceMeasureGramWeight: nfcsMisoPortion.sourceMeasureGramWeight,
        sourceFoodDescription: nfcsMisoPortion.sourceFoodDescription,
        sourceFoodCode: nfcsMisoPortion.sourceFoodCode,
        ediblePortionBasis: nfcsMisoPortion.ediblePortionBasis,
        matchConfidence: nfcsMisoPortion.matchConfidence
      }
    };
  }

  const sr28SaltPortion = usdaSr28SaltPortionConversionB40(ingredientId, unit);
  if (sr28SaltPortion) {
    return {
      grams: quantity * sr28SaltPortion.gramsPerUnit,
      reason: null,
      quantityEvidence: {
        state: sr28SaltPortion.evidenceState,
        sourceId: USDA_SR28_SALT_PORTION_SOURCE_B40.id,
        evidenceTranche: sr28SaltPortion.evidenceTranche,
        inputUnit: unit,
        gramsPerUnit: sr28SaltPortion.gramsPerUnit,
        sourceMeasureAmount: sr28SaltPortion.sourceMeasureAmount,
        sourceMeasureUnit: sr28SaltPortion.sourceMeasureUnit,
        sourceMeasureGramWeight: sr28SaltPortion.sourceMeasureGramWeight,
        sourceFoodDescription: sr28SaltPortion.sourceFoodDescription,
        ndbNumber: sr28SaltPortion.ndbNumber,
        matchConfidence: sr28SaltPortion.matchConfidence
      }
    };
  }

  const sr28SesameOilPortion = usdaSr28SesameOilPortionConversionB41(ingredientId, unit);
  if (sr28SesameOilPortion) {
    return {
      grams: quantity * sr28SesameOilPortion.gramsPerUnit,
      reason: null,
      quantityEvidence: {
        state: sr28SesameOilPortion.evidenceState,
        sourceId: USDA_SR28_SESAME_OIL_PORTION_SOURCE_B41.id,
        evidenceTranche: sr28SesameOilPortion.evidenceTranche,
        inputUnit: unit,
        gramsPerUnit: sr28SesameOilPortion.gramsPerUnit,
        sourceMeasureAmount: sr28SesameOilPortion.sourceMeasureAmount,
        sourceMeasureUnit: sr28SesameOilPortion.sourceMeasureUnit,
        sourceMeasureGramWeight: sr28SesameOilPortion.sourceMeasureGramWeight,
        sourceFoodDescription: sr28SesameOilPortion.sourceFoodDescription,
        ndbNumber: sr28SesameOilPortion.ndbNumber,
        matchConfidence: sr28SesameOilPortion.matchConfidence
      }
    };
  }

  const sr28FishSaucePortion = usdaSr28FishSaucePortionConversionB49(ingredientId, unit);
  if (sr28FishSaucePortion) {
    return {
      grams: quantity * sr28FishSaucePortion.gramsPerUnit,
      reason: null,
      quantityEvidence: {
        state: sr28FishSaucePortion.evidenceState,
        sourceId: USDA_SR28_FISH_SAUCE_PORTION_SOURCE_B49.id,
        evidenceTranche: sr28FishSaucePortion.evidenceTranche,
        inputUnit: unit,
        gramsPerUnit: sr28FishSaucePortion.gramsPerUnit,
        sourceMeasureAmount: sr28FishSaucePortion.sourceMeasureAmount,
        sourceMeasureUnit: sr28FishSaucePortion.sourceMeasureUnit,
        sourceMeasureGramWeight: sr28FishSaucePortion.sourceMeasureGramWeight,
        sourceFoodDescription: sr28FishSaucePortion.sourceFoodDescription,
        ndbNumber: sr28FishSaucePortion.ndbNumber,
        matchConfidence: sr28FishSaucePortion.matchConfidence
      }
    };
  }

  const usdaPortion = usdaFoundationPortionConversion(ingredientId, unit);
  if (usdaPortion) {
    return {
      grams: quantity * usdaPortion.gramsPerUnit,
      reason: null,
      quantityEvidence: {
        state: usdaPortion.evidenceState,
        sourceId: USDA_FOUNDATION_PORTION_SOURCE.id,
        inputUnit: unit,
        gramsPerUnit: usdaPortion.gramsPerUnit,
        sourceUnit: usdaPortion.sourceUnit,
        modifier: usdaPortion.modifier,
        fdcId: usdaPortion.fdcId
      }
    };
  }

  const matvaretabellenPortion = matvaretabellenPortionConversion(ingredientId, unit);
  if (matvaretabellenPortion) {
    return {
      grams: quantity * matvaretabellenPortion.gramsPerUnit,
      reason: null,
      quantityEvidence: {
        state: matvaretabellenPortion.evidenceState,
        sourceId: MATVARETABELLEN_PORTION_SOURCE_B6.id,
        evidenceTranche: matvaretabellenPortion.evidenceTranche,
        inputUnit: unit,
        gramsPerUnit: matvaretabellenPortion.gramsPerUnit,
        sourceUnit: matvaretabellenPortion.portionName,
        foodId: matvaretabellenPortion.foodId,
        foodName: matvaretabellenPortion.foodName
      }
    };
  }

  const matvaretabellenPortionB15 = matvaretabellenPortionConversionB15(ingredientId, unit);
  if (matvaretabellenPortionB15) {
    return {
      grams: quantity * matvaretabellenPortionB15.gramsPerUnit,
      reason: null,
      quantityEvidence: {
        state: matvaretabellenPortionB15.evidenceState,
        sourceId: MATVARETABELLEN_PORTION_SOURCE_B15.id,
        evidenceTranche: matvaretabellenPortionB15.evidenceTranche,
        inputUnit: unit,
        gramsPerUnit: matvaretabellenPortionB15.gramsPerUnit,
        sourceUnit: matvaretabellenPortionB15.portionName,
        foodId: matvaretabellenPortionB15.foodId,
        foodName: matvaretabellenPortionB15.foodName
      }
    };
  }

  const matvaretabellenPortionB17 = matvaretabellenPortionConversionB17(ingredientId, unit);
  if (matvaretabellenPortionB17) {
    return {
      grams: quantity * matvaretabellenPortionB17.gramsPerUnit,
      reason: null,
      quantityEvidence: {
        state: matvaretabellenPortionB17.evidenceState,
        sourceId: MATVARETABELLEN_PORTION_SOURCE_B17.id,
        evidenceTranche: matvaretabellenPortionB17.evidenceTranche,
        inputUnit: unit,
        gramsPerUnit: matvaretabellenPortionB17.gramsPerUnit,
        sourceUnit: matvaretabellenPortionB17.sourcePortionName,
        sourcePortionId: matvaretabellenPortionB17.sourcePortionId,
        sourcePortionUnit: matvaretabellenPortionB17.sourcePortionUnit,
        foodId: matvaretabellenPortionB17.foodId,
        foodName: matvaretabellenPortionB17.foodName
      }
    };
  }

  const usdaAmbiguous = usdaFoundationAmbiguousPortion(ingredientId, unit);
  if (usdaAmbiguous) {
    return {
      grams: null,
      reason: "ambiguous_portion_unit",
      quantityEvidence: {
        state: "USDA_FOUNDATION_PORTION_AMBIGUOUS",
        sourceId: USDA_FOUNDATION_PORTION_SOURCE.id,
        inputUnit: unit,
        reason: usdaAmbiguous.reason,
        candidateGramWeights: [...usdaAmbiguous.candidateGramWeights]
      }
    };
  }

  const matvaretabellenAmbiguous = matvaretabellenAmbiguousPortion(ingredientId, unit);
  if (matvaretabellenAmbiguous) {
    return {
      grams: null,
      reason: "ambiguous_portion_unit",
      quantityEvidence: {
        state: matvaretabellenAmbiguous.evidenceState,
        sourceId: MATVARETABELLEN_PORTION_SOURCE_B6.id,
        evidenceTranche: matvaretabellenAmbiguous.evidenceTranche,
        inputUnit: unit,
        foodId: matvaretabellenAmbiguous.foodId,
        foodName: matvaretabellenAmbiguous.foodName,
        reason: matvaretabellenAmbiguous.reason,
        candidateGramWeights: [...matvaretabellenAmbiguous.candidateGramWeights]
      }
    };
  }

  return { grams: null, reason: "unsupported_quantity_unit", quantityEvidence: null };
};

const nutrientKeys = ["energyKcal", "proteinG", "carbohydrateG", "fatG", "fibreG"];
const roundToTenths = value => Math.round((value + Number.EPSILON * Math.max(1, Math.abs(value))) * 10) / 10;
const roundNutrient = (key, value) => key === "energyKcal" ? Math.round(value) : roundToTenths(value);
const AVAILABLE_CARBOHYDRATE_SEMANTICS = new Set([
  "AVAILABLE_CARBOHYDRATE_CIQUAL_CHOAVL",
  "AVAILABLE_CARBOHYDRATE_MATVARETABELLEN_CHO",
  "AVAILABLE_CARBOHYDRATE_MEXT_CHOAVLDF",
  "AVAILABLE_CARBOHYDRATE_AFCD_WITHOUT_SUGAR_ALCOHOLS"
]);

const semanticCompatibility = (key, semantics) => {
  if (key !== "carbohydrateG") return { compatible: true, reason: null };
  const unique = [...semantics];
  if (unique.length <= 1) return { compatible: true, reason: null };
  const incompatible = unique.includes("CARBOHYDRATE_BY_DIFFERENCE_USDA_1005") && unique.some(semantic => AVAILABLE_CARBOHYDRATE_SEMANTICS.has(semantic));
  return incompatible
    ? { compatible: false, reason: "mixed_incompatible_carbohydrate_semantics" }
    : { compatible: true, reason: null };
};

export function calculatePerServingFromDensities(recipe, densityMap = {}) {
  const ingredients = (recipe.ingredients || []).filter(ingredient => ingredient.required !== false);
  const totals = Object.fromEntries(nutrientKeys.map(key => [key, 0]));
  const coveredCounts = Object.fromEntries(nutrientKeys.map(key => [key, 0]));
  const semanticSets = Object.fromEntries(nutrientKeys.map(key => [key, new Set()]));
  const used = [];
  const skipped = [];

  for (const ingredient of ingredients) {
    const ingredientId = ingredient.canonicalIngredientId;
    const densityRecord = densityMap[ingredientId];
    const density = densityRecord?.per100g || densityRecord;
    const nutrientProvenance = densityRecord?.provenanceByNutrient || {};
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
      const semantic = nutrientProvenance[key]?.semantic;
      if (semantic) semanticSets[key].add(semantic);
    }
    used.push({
      ingredientId,
      grams,
      quantityEvidence: quantityResolution.quantityEvidence,
      availableNutrients,
      missingNutrients,
      ...(Object.keys(nutrientProvenance).length ? { provenanceByNutrient: nutrientProvenance } : {})
    });
  }

  const servings = Math.max(1, Number(recipe.serving?.servings) || 1);
  const totalIngredients = ingredients.length;
  const knownContributionPerServing = Object.fromEntries(nutrientKeys.map(key => [key, roundNutrient(key, totals[key] / servings)]));
  const nutrientCoverage = Object.fromEntries(nutrientKeys.map(key => {
    const semantics = [...semanticSets[key]];
    const compatibility = semanticCompatibility(key, semanticSets[key]);
    return [key, {
      coveredIngredients: coveredCounts[key],
      totalIngredients,
      semantics,
      semanticCompatibility: compatibility.compatible,
      semanticIssue: compatibility.reason,
      complete: totalIngredients > 0 && coveredCounts[key] === totalIngredients && compatibility.compatible
    }];
  }));
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
    const europeanPrimaryCoverage = europeanPrimaryPolicyCoverage(ingredientIds);
    const europeanStaticCalculation = calculatePerServingFromDensities(recipe, EUROPEAN_PRIMARY_DENSITIES_V1);
    const usdaFallbackCalculation = calculatePerServingFromDensities(recipe, USDA_FOUNDATION_DENSITIES);
    const usesEuropeanPrimary = europeanStaticCalculation.complete;
    const usesCoherentUsdaFallback = !usesEuropeanPrimary && usdaFallbackCalculation.complete;
    const authoritativeRecipeCalculation = usesEuropeanPrimary || usesCoherentUsdaFallback;
    const staticCalculation = usesEuropeanPrimary ? europeanStaticCalculation : usesCoherentUsdaFallback ? usdaFallbackCalculation : europeanStaticCalculation;
    const method = usesEuropeanPrimary
      ? "EUROPEAN_PRIMARY_STATIC_CALCULATION_V1"
      : usesCoherentUsdaFallback
        ? "USDA_FDC_FOUNDATION_STATIC_CALCULATION"
        : recipe.nutrition?.estimationState || "INFERRED_ESTIMATE";
    return {
      perServing: authoritativeRecipeCalculation ? staticCalculation.perServing : { ...(recipe.nutrition?.perServing || {}) },
      method,
      confidence: authoritativeRecipeCalculation ? "medium" : recipe.nutrition?.confidence || "low",
      provenance: usesEuropeanPrimary
        ? "Calculated deterministically under the Canary/Spain/Europe source-selection policy from reviewed USDA Foundation, ANSES-Ciqual and bounded reviewed composition or exact field-completion evidence, with exact per-nutrient provenance and source-backed household quantity weights; incompatible carbohydrate semantics are never mixed and cooking/yield uncertainty remains."
        : usesCoherentUsdaFallback
          ? "European-primary selection was incomplete or semantically incompatible for a full recipe total, so the deterministic fully coherent reviewed USDA Foundation calculation was retained; source-backed household quantity weights may be used and cooking/yield uncertainty remains."
          : recipe.nutrition?.provenance || "Project-authored estimate.",
      evidence: {
        source: USDA_FOUNDATION_SOURCE,
        sources: [USDA_FOUNDATION_SOURCE, CIQUAL_RUNTIME_SOURCE_V1, MATVARETABELLEN_COMPOSITION_SOURCE_B9, MATVARETABELLEN_COMPOSITION_SOURCE_B10],
        sourcePolicy: EUROPEAN_PRIMARY_POLICY_V1,
        compositionSource: USDA_FOUNDATION_COMPOSITION_SOURCE,
        compositionSources: [USDA_FOUNDATION_COMPOSITION_SOURCE, CIQUAL_RUNTIME_SOURCE_V1, MATVARETABELLEN_COMPOSITION_SOURCE_B9, MATVARETABELLEN_COMPOSITION_SOURCE_B10],
        portionSource: USDA_FOUNDATION_PORTION_SOURCE,
        portionSources: [USDA_FOUNDATION_PORTION_SOURCE, MATVARETABELLEN_PORTION_SOURCE_B6, MATVARETABELLEN_PORTION_SOURCE_B15, MATVARETABELLEN_PORTION_SOURCE_B17, USDA_SR_LEGACY_PORTION_SOURCE_B8, USDA_SR28_PEANUT_BUTTER_PORTION_SOURCE_B37, USDA_NFCS_MISO_PORTION_SOURCE_B38, USDA_SR28_SALT_PORTION_SOURCE_B40, USDA_SR28_SESAME_OIL_PORTION_SOURCE_B41, USDA_SR28_FISH_SAUCE_PORTION_SOURCE_B49],
        coverage,
        europeanPrimaryCoverage,
        identities,
        compositionImported: true,
        portionEvidenceImported: true,
        europeanStaticCalculation,
        usdaFallbackCalculation,
        staticCalculation,
        sourceSelectionState: usesEuropeanPrimary
          ? "EUROPEAN_PRIMARY_COMPLETE"
          : usesCoherentUsdaFallback
            ? "USDA_COHERENT_FALLBACK_COMPLETE"
            : "NO_COMPLETE_AUTHORITATIVE_RECIPE_CALCULATION",
        state: authoritativeRecipeCalculation
          ? "AUTHORITATIVE_STATIC_RECIPE_CALCULATION_AVAILABLE"
          : staticCalculation.calculationState === "PARTIAL_STATIC_CALCULATION"
            ? "PARTIAL_STATIC_EVIDENCE_ESTIMATE_PRESERVED"
            : "STATIC_EVIDENCE_INSUFFICIENT_ESTIMATE_PRESERVED"
      }
    };
  }
};