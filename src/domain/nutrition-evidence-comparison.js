import { CIQUAL_2025_SOURCE, CIQUAL_DENSITIES_B4 } from "../data/ciqual-nutrients-b4.js";
import { CIQUAL_DENSITIES_B5 } from "../data/ciqual-nutrients-b5.js";
import { USDA_FOUNDATION_DENSITIES, USDA_FOUNDATION_SOURCE } from "../data/nutrition-evidence.js";

const CIQUAL_CANONICAL_ALIASES = {
  egg: "eggs",
  mushrooms: "mushroom",
  yogurt: "greek_yogurt"
};

const canonicalize = records => Object.fromEntries(
  Object.entries(records).map(([id, record]) => [CIQUAL_CANONICAL_ALIASES[id] || id, record])
);

export const CIQUAL_CANONICAL_DENSITIES_B4 = canonicalize(CIQUAL_DENSITIES_B4);
export const CIQUAL_CANONICAL_DENSITIES_B5 = canonicalize(CIQUAL_DENSITIES_B5);
export const CIQUAL_CANONICAL_DENSITIES = {
  ...CIQUAL_CANONICAL_DENSITIES_B4,
  ...CIQUAL_CANONICAL_DENSITIES_B5
};

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
  const ciqual = CIQUAL_CANONICAL_DENSITIES[ingredientId] || null;
  const ciqualEvidenceTranche = CIQUAL_CANONICAL_DENSITIES_B5[ingredientId] ? "B5" : CIQUAL_CANONICAL_DENSITIES_B4[ingredientId] ? "B4" : null;
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
    primarySelectionPolicy: "COMPARISON_ONLY_SELECTION_SEPARATE",
    sources: {
      usda: usda ? {
        source: USDA_FOUNDATION_SOURCE,
        sourceIdentifier: usda.fdcId,
        description: usda.description,
        per100g: usda.per100g
      } : null,
      ciqual: ciqual ? {
        source: CIQUAL_2025_SOURCE,
        evidenceTranche: ciqualEvidenceTranche,
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
    ciqualB4EvidenceCount: comparisons.filter(item => item.sources.ciqual?.evidenceTranche === "B4").length,
    ciqualB5EvidenceCount: comparisons.filter(item => item.sources.ciqual?.evidenceTranche === "B5").length,
    noEvidenceCount: count("NO_STATIC_EVIDENCE"),
    formCaveatCount: count("MULTI_SOURCE_FORM_CAVEAT"),
    comparisons
  };
};
