const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
const RISK = { low: 1, medium: 2, high: 3, very_high: 4 };

const toFour = value => Math.max(1, Math.min(4, Math.round(Number(value) || 1)));

const TECHNIQUE_RULES = [
  ["pan-browning", /\b(brown|sear|saute|sauté|pan-roast|pan roast)\b/],
  ["stir-frying", /\bstir-fry|stir fry\b/],
  ["simmering", /\bsimmer\b/],
  ["boiling", /\bboil\b/],
  ["steaming", /\bsteam\b/],
  ["toasting", /\btoast\b/],
  ["gentle-poaching", /\bpoach|cook gently|gently until\b/],
  ["egg-setting", /\bwhisk eggs|beat eggs|mostly set|nearly set|scramble\b/],
  ["glazing", /\bglaze|coat .*miso|coat .*sauce\b/],
  ["emulsifying", /\bemuls|beat in butter|cooking water.*loosen|loosen.*cooking water\b/],
  ["mashing-blending", /\bmash|blend\b/],
  ["roasting-grilling", /\broast|under a grill|grill\b/],
  ["cold-assembly", /\bcombine|assemble|dress with|toss with\b/]
];

function inferTechniques(recipe) {
  const explicit = (recipe.culinary?.techniques || []).filter(Boolean);
  const instructionText = (recipe.instructions || []).map(step => step.text || "").join(" ").toLowerCase();
  const inferred = TECHNIQUE_RULES.filter(([, rule]) => rule.test(instructionText)).map(([name]) => name);
  const techniques = [...new Set([...explicit, ...inferred])];
  return {
    techniques,
    source: explicit.length && inferred.some(name => !explicit.includes(name)) ? "explicit_plus_inferred" : explicit.length ? "explicit" : inferred.length ? "inferred_from_authored_instructions" : "none"
  };
}

export function culinaryQualityProfile(recipe) {
  const techniqueProfile = inferTechniques(recipe);
  const techniques = techniqueProfile.techniques;
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
    techniqueSource: techniqueProfile.source,
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
    state: "NORMALIZED_FROM_AUTHORED_RECIPE_METADATA"
  };
}

export function culinaryQualityCoverage(recipes = []) {
  const profiles = recipes.map(culinaryQualityProfile);
  const missingTechnique = profiles.filter(profile => profile.techniques.length === 0).length;
  const missingFlavour = profiles.filter(profile => profile.flavourProfile.length === 0).length;
  const inferredTechniqueCount = profiles.filter(profile => profile.techniqueSource.includes("inferred")).length;
  return {
    recipeCount: profiles.length,
    normalizedCount: profiles.length,
    techniqueTaggedCount: profiles.length - missingTechnique,
    inferredTechniqueCount,
    flavourTaggedCount: profiles.length - missingFlavour,
    completeNormalization: true,
    editorialGaps: {
      missingTechnique,
      missingFlavour
    }
  };
}
