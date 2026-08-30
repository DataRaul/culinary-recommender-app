const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
const RISK = { low: 1, medium: 2, high: 3, very_high: 4 };

const toFour = value => Math.max(1, Math.min(4, Math.round(Number(value) || 1)));

export function culinaryQualityProfile(recipe) {
  const techniques = [...new Set((recipe.culinary?.techniques || []).filter(Boolean))];
  const requiredEquipment = [...new Set((recipe.equipment?.required || []).filter(Boolean))];
  const totalMinutes = Math.max(1, Number(recipe.time?.totalMinutes) || 1);
  const activeMinutes = Math.max(0, Number(recipe.time?.activeMinutes) || 0);
  const activeShare = clamp(activeMinutes / totalMinutes);
  const difficulty = toFour(recipe.culinary?.difficulty);
  const failureRisk = RISK[recipe.culinary?.failureRisk] || 1;
  const learningValue = toFour(recipe.discovery?.techniqueLearningValue);
  const novelty = toFour(recipe.discovery?.novelty);
  const familiarity = toFour(recipe.discovery?.familiarity);
  const mealPrep = toFour(recipe.convenience?.mealPrepSuitability);
  const batch = toFour(recipe.convenience?.batchSuitability);
  const freezer = toFour(recipe.convenience?.freezerSuitability);
  const leftovers = toFour(recipe.convenience?.leftoverSuitability);
  const portability = toFour(recipe.convenience?.portability);

  const equipmentBurden = toFour(requiredEquipment.length <= 1 ? 1 : requiredEquipment.length === 2 ? 2 : requiredEquipment.length === 3 ? 3 : 4);
  const techniqueDepth = toFour(Math.max(difficulty, Math.min(4, techniques.length || 1)));
  const convenienceScore = Number(((mealPrep + batch + leftovers + portability) / 16).toFixed(3));
  const storageScore = Number(((freezer + leftovers) / 8).toFixed(3));
  const explorationScore = Number(((novelty + learningValue + (5 - familiarity)) / 12).toFixed(3));
  const executionLoad = Number(clamp((difficulty / 4) * 0.4 + (failureRisk / 4) * 0.25 + activeShare * 0.2 + (equipmentBurden / 4) * 0.15).toFixed(3));

  return {
    schemaVersion: "culinary-quality-v1",
    techniques,
    techniqueDepth,
    failureRisk: recipe.culinary?.failureRisk || "low",
    failureRiskLevel: failureRisk,
    difficulty,
    activeShare: Number(activeShare.toFixed(3)),
    equipmentBurden,
    learningValue,
    novelty,
    familiarity,
    spiceLevel: toFour(recipe.discovery?.spiceLevel),
    flavourProfile: [...new Set((recipe.discovery?.flavourProfile || []).filter(Boolean))],
    convenience: {
      mealPrep,
      batch,
      freezer,
      leftovers,
      portability,
      score: convenienceScore,
      storageScore
    },
    explorationScore,
    executionLoad,
    state: "NORMALIZED_FROM_STRUCTURED_RECIPE_METADATA"
  };
}

export function culinaryQualityCoverage(recipes = []) {
  const profiles = recipes.map(culinaryQualityProfile);
  const missingTechnique = profiles.filter(profile => profile.techniques.length === 0).length;
  const missingFlavour = profiles.filter(profile => profile.flavourProfile.length === 0).length;
  return {
    recipeCount: profiles.length,
    normalizedCount: profiles.length,
    techniqueTaggedCount: profiles.length - missingTechnique,
    flavourTaggedCount: profiles.length - missingFlavour,
    completeNormalization: true,
    editorialGaps: {
      missingTechnique,
      missingFlavour
    }
  };
}
