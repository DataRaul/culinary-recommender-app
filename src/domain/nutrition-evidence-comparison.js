import { CIQUAL_2025_SOURCE, CIQUAL_DENSITIES_B4 } from "../data/ciqual-nutrients-b4.js";
import { USDA_FOUNDATION_DENSITIES, USDA_FOUNDATION_SOURCE } from "../data/nutrition-evidence.js";

const CIQUAL_CANONICAL_ALIASES = {
  egg: "eggs",
  mushrooms: "mushroom",
  yogurt: "greek_yogurt"
};

export const CIQUAL_CANONICAL_DENSITIES_B4 = Object.fromEntries(
  Object.entries(CIQUAL_DENSITIES_B4).map(([id, record]) => [CIQUAL_CANONICAL_ALIASES[id] || id, record])
);

const percentDifference = (left, right) => {
  if (![left, right].every(value => typeof value === "number" && Number.isFinite(value))) return null;
  const denominator = (Math.abs(left) + Math.abs(right)) / 2;
  if (!denominator) return 0;
  return Number(((Math.abs(left - right) / denominator) * 100).toFixed(1));
};

const nutrientComparison = (usda, ciqual) => ({
  energy: {
    usdaValue: usda?.per100g?.energyKcal ?? null,
    ciqualValue: ciqual?.per100g?.energyJonesWithFibreKcal ?? null,
    ciqualRegulatoryValue: ciqual?.per100g?.energyEu1169Kcal ?? null,
    comparability: "METHOD_DIFFERENT_COMPARE_WITH_CAUTION",
    relativeDifferencePct: percentDifference(usda?.per100g?.energyKcal, ciqual?.per100g?.energyJonesWithFibreKcal),
    ciqualConfidenceCode: ciqual?.confidenceCodes?.energyJonesWithFibreKcal ?? null
  },
  protein: {
    usdaValue: usda?.per100g?.proteinG ?? null,
    ciqualValue: ciqual?.per100g?.proteinJonesG ?? null,
    comparability: "METHOD_DEPENDENT",
    relativeDifferencePct: percentDifference(usda?.per100g?.proteinG, ciqual?.per100g?.proteinJonesG),
    ciqualConfidenceCode: ciqual?.confidenceCodes?.proteinJonesG ?? null
  },
  carbohydrate: {
    usdaValue: usda?.per100g?.carbohydrateG ?? null,
    ciqualValue: ciqual?.per100g?.carbohydrateAvailableG ?? null,
    comparability: "NOT_DIRECTLY_COMPARABLE_USDA_BY_DIFFERENCE_VS_CIQUAL_AVAILABLE",
    relativeDifferencePct: null,
    ciqualConfidenceCode: ciqual?.confidenceCodes?.carbohydrateAvailableG ?? null
  },
  fat: {
    usdaValue: usda?.per100g?.fatG ?? null,
    ciqualValue: ciqual?.per100g?.fatG ?? null,
    comparability: "DIRECT_WITH_FORM_AND_METHOD_CAVEATS",
    relativeDifferencePct: percentDifference(usda?.per100g?.fatG, ciqual?.per100g?.fatG),
    ciqualConfidenceCode: ciqual?.confidenceCodes?.fatG ?? null
  },
  fibre: {
    usdaValue: usda?.per100g?.fibreG ?? null,
    ciqualValue: ciqual?.per100g?.fibreG ?? null,
    comparability: "METHOD_DEPENDENT",
    relativeDifferencePct: percentDifference(usda?.per100g?.fibreG, ciqual?.per100g?.fibreG),
    ciqualConfidenceCode: ciqual?.confidenceCodes?.fibreG ?? null
  }
});

export const nutritionEvidenceComparisonForIngredient = ingredientId => {
  const usda = USDA_FOUNDATION_DENSITIES[ingredientId] || null;
  const ciqual = CIQUAL_CANONICAL_DENSITIES_B4[ingredientId] || null;
  const sourceCount = Number(Boolean(usda)) + Number(Boolean(ciqual));
  const formCaveat = Boolean(usda && ciqual && (ciqual.matchConfidence !== "high" || /differs|generic|specific|underspecified/i.test(ciqual.matchNotes || "")));
  const state = sourceCount === 0
    ? "NO_STATIC_EVIDENCE"
    : sourceCount === 1
      ? "SINGLE_SOURCE_EVIDENCE"
      : formCaveat
        ? "MULTI_SOURCE_FORM_CAVEAT"
        : "MULTI_SOURCE_REVIEWED_EVIDENCE";

  return {
    canonicalIngredientId: ingredientId,
    state,
    primarySelectionPolicy: "NO_AUTOMATIC_PRIMARY_SELECTION_IN_B4",
    sources: {
      usda: usda ? {
        source: USDA_FOUNDATION_SOURCE,
        sourceIdentifier: usda.fdcId,
        description: usda.description,
        per100g: usda.per100g
      } : null,
      ciqual: ciqual ? {
        source: CIQUAL_2025_SOURCE,
        sourceIdentifier: ciqual.alimCode,
        description: ciqual.nameEn,
        descriptionFr: ciqual.nameFr,
        scientificName: ciqual.scientificName,
        matchConfidence: ciqual.matchConfidence,
        matchNotes: ciqual.matchNotes,
        per100g: ciqual.per100g,
        confidenceCodes: ciqual.confidenceCodes,
        sourceCodes: ciqual.sourceCodes
      } : null
    },
    nutrients: nutrientComparison(usda, ciqual)
  };
};

export const nutritionEvidenceComparisonCoverage = ingredientIds => {
  const unique = [...new Set((ingredientIds || []).filter(Boolean))];
  const comparisons = unique.map(nutritionEvidenceComparisonForIngredient);
  const count = state => comparisons.filter(item => item.state === state).length;
  return {
    ingredientCount: unique.length,
    multiSourceCount: comparisons.filter(item => item.sources.usda && item.sources.ciqual).length,
    usdaOnlyCount: comparisons.filter(item => item.sources.usda && !item.sources.ciqual).length,
    ciqualOnlyCount: comparisons.filter(item => !item.sources.usda && item.sources.ciqual).length,
    noEvidenceCount: count("NO_STATIC_EVIDENCE"),
    formCaveatCount: count("MULTI_SOURCE_FORM_CAVEAT"),
    comparisons
  };
};
