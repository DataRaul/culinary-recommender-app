const increment = (map, key) => map.set(key, (map.get(key) || 0) + 1);
const sortedObject = map => Object.fromEntries([...map.entries()].sort((a, b) => String(a[0]).localeCompare(String(b[0]))));

export function ingredientSearchCoverage(recipes = [], ingredientIds = []) {
  const uniqueIds = [...new Set((ingredientIds || []).filter(Boolean))].sort();
  const result = {};
  for (const ingredientId of uniqueIds) {
    const matches = recipes
      .filter(recipe => (recipe.ingredients || []).some(item => item.canonicalIngredientId === ingredientId))
      .map(recipe => recipe.id)
      .sort();
    result[ingredientId] = { recipeCount: matches.length, recipeIds: matches };
  }
  return result;
}

export function buildCorpusCoverage(recipes = [], canonicalIngredientIds = []) {
  const cuisine = new Map();
  const dietary = new Map();
  const difficulty = new Map();
  const costTier = new Map();
  const ingredientUsage = new Map();
  const time = { upTo20: 0, upTo30: 0, upTo45: 0, over45: 0 };
  let highProtein = 0;
  let strongMealPrep = 0;
  let strongBatch = 0;
  let vegan = 0;
  let vegetarian = 0;

  for (const recipe of recipes) {
    increment(cuisine, recipe.culinary?.cuisine || "Unknown");
    increment(difficulty, String(recipe.culinary?.difficulty || "unknown"));
    increment(costTier, String(recipe.economics?.costTier || "unknown"));
    for (const tag of recipe.dietaryTags || []) increment(dietary, tag);
    if (recipe.dietaryTags?.includes("vegan")) vegan += 1;
    if (recipe.dietaryTags?.includes("vegetarian")) vegetarian += 1;
    if (Number(recipe.nutrition?.perServing?.proteinG || 0) >= 30) highProtein += 1;
    if (Number(recipe.convenience?.mealPrepSuitability || 0) >= 4) strongMealPrep += 1;
    if (Number(recipe.convenience?.batchSuitability || 0) >= 4) strongBatch += 1;

    const totalMinutes = Number(recipe.time?.totalMinutes || 0);
    if (totalMinutes <= 20) time.upTo20 += 1;
    else if (totalMinutes <= 30) time.upTo30 += 1;
    else if (totalMinutes <= 45) time.upTo45 += 1;
    else time.over45 += 1;

    for (const ingredientId of new Set((recipe.ingredients || []).map(item => item.canonicalIngredientId).filter(Boolean))) {
      increment(ingredientUsage, ingredientId);
    }
  }

  const normalizedIngredientIds = [...new Set((canonicalIngredientIds || []).filter(Boolean))].sort();
  const unusedCanonicalIngredientIds = normalizedIngredientIds.filter(id => !ingredientUsage.has(id));
  const singleRecipeIngredientIds = normalizedIngredientIds.filter(id => ingredientUsage.get(id) === 1);

  return {
    schemaVersion: "corpus-coverage-v1",
    recipeCount: recipes.length,
    cuisineCounts: sortedObject(cuisine),
    dietaryTagCounts: sortedObject(dietary),
    difficultyCounts: sortedObject(difficulty),
    costTierCounts: sortedObject(costTier),
    timeBuckets: time,
    highProteinCount: highProtein,
    strongMealPrepCount: strongMealPrep,
    strongBatchCount: strongBatch,
    veganCount: vegan,
    vegetarianCount: vegetarian,
    ingredientUsageCounts: sortedObject(ingredientUsage),
    canonicalIngredientCount: normalizedIngredientIds.length,
    unusedCanonicalIngredientIds,
    singleRecipeIngredientIds,
    coveredCanonicalIngredientCount: normalizedIngredientIds.length - unusedCanonicalIngredientIds.length,
    ingredientCoverageRatio: normalizedIngredientIds.length
      ? Number(((normalizedIngredientIds.length - unusedCanonicalIngredientIds.length) / normalizedIngredientIds.length).toFixed(4))
      : 0
  };
}
