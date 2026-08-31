export function buildNutritionCoverageAudit(recipes = [], nutritionSource) {
  if (!nutritionSource || typeof nutritionSource.estimate !== "function") {
    throw new TypeError("nutritionSource.estimate is required");
  }

  const stateCounts = new Map();
  const methodCounts = new Map();
  const blockerCounts = new Map();
  const blockerIngredientCounts = new Map();
  const semanticIssueCounts = new Map();
  const authoritativeRecipeIds = [];
  const estimateRecipeIds = [];
  const recipeDetails = [];

  const increment = (map, key) => map.set(key, (map.get(key) || 0) + 1);
  const sortedObject = map => Object.fromEntries([...map.entries()].sort((a, b) => String(a[0]).localeCompare(String(b[0]))));

  for (const recipe of recipes) {
    const estimate = nutritionSource.estimate(recipe);
    const evidence = estimate?.evidence || {};
    const sourceSelectionState = evidence.sourceSelectionState || "UNKNOWN";
    const method = estimate?.method || "UNKNOWN";
    increment(stateCounts, sourceSelectionState);
    increment(methodCounts, method);

    const authoritative = evidence.state === "AUTHORITATIVE_STATIC_RECIPE_CALCULATION_AVAILABLE";
    (authoritative ? authoritativeRecipeIds : estimateRecipeIds).push(recipe.id);

    const calculation = evidence.staticCalculation || {};
    const blockers = [];
    for (const skipped of calculation.skipped || []) {
      const reason = skipped.reason || "unknown_blocker";
      increment(blockerCounts, reason);
      if (skipped.ingredientId) increment(blockerIngredientCounts, skipped.ingredientId);
      blockers.push({ ingredientId: skipped.ingredientId || null, reason });
    }

    const semanticIssues = [];
    for (const [nutrient, coverage] of Object.entries(calculation.nutrientCoverage || {})) {
      if (!coverage?.semanticCompatibility) {
        const issue = coverage.semanticIssue || "semantic_incompatibility";
        increment(semanticIssueCounts, issue);
        semanticIssues.push({ nutrient, issue, semantics: [...(coverage.semantics || [])].sort() });
      }
    }

    recipeDetails.push({
      recipeId: recipe.id,
      sourceSelectionState,
      method,
      authoritative,
      blockers: blockers.sort((a, b) => `${a.ingredientId}:${a.reason}`.localeCompare(`${b.ingredientId}:${b.reason}`)),
      semanticIssues: semanticIssues.sort((a, b) => a.nutrient.localeCompare(b.nutrient))
    });
  }

  const recipeCount = recipes.length;
  return {
    schemaVersion: "nutrition-coverage-audit-v1",
    recipeCount,
    authoritativeRecipeCount: authoritativeRecipeIds.length,
    estimateRecipeCount: estimateRecipeIds.length,
    authoritativeRecipeRatio: recipeCount ? Number((authoritativeRecipeIds.length / recipeCount).toFixed(4)) : 0,
    sourceSelectionStateCounts: sortedObject(stateCounts),
    methodCounts: sortedObject(methodCounts),
    blockerCounts: sortedObject(blockerCounts),
    blockerIngredientCounts: sortedObject(blockerIngredientCounts),
    semanticIssueCounts: sortedObject(semanticIssueCounts),
    authoritativeRecipeIds: authoritativeRecipeIds.sort(),
    estimateRecipeIds: estimateRecipeIds.sort(),
    recipeDetails: recipeDetails.sort((a, b) => a.recipeId.localeCompare(b.recipeId))
  };
}
