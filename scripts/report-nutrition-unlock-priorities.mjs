import { AUTHORED_RECIPES } from "../src/data/corpus-v1.js";
import { publicNutritionSource } from "../src/domain/nutrition.js";
import { buildNutritionCoverageAudit } from "../src/domain/nutrition-coverage-audit.js";

const audit = buildNutritionCoverageAudit(AUTHORED_RECIPES, publicNutritionSource);
const byIngredient = new Map();
const recipeRows = [];

const rowFor = ingredientId => {
  if (!byIngredient.has(ingredientId)) byIngredient.set(ingredientId, {
    ingredientId,
    densityBlockers: 0,
    quantityBlockers: 0,
    ambiguousPortions: 0,
    missingNutrientFields: 0,
    affectedRecipes: new Set(),
    nearUnlockRecipes: new Set(),
    weightedUnlockScore: 0
  });
  return byIngredient.get(ingredientId);
};

for (const detail of audit.recipeDetails) {
  const unresolvedKeys = new Set();
  for (const blocker of detail.blockers) {
    const ingredientId = blocker.ingredientId || "__unknown__";
    unresolvedKeys.add(`ingredient:${ingredientId}`);
    const row = rowFor(ingredientId);
    row.affectedRecipes.add(detail.recipeId);
    if (blocker.reason === "missing_density") row.densityBlockers += 1;
    else if (blocker.reason === "ambiguous_portion_unit") row.ambiguousPortions += 1;
    else row.quantityBlockers += 1;
  }
  for (const gap of detail.nutrientFieldGaps) {
    const ingredientId = gap.ingredientId || "__unknown__";
    unresolvedKeys.add(`ingredient:${ingredientId}`);
    const row = rowFor(ingredientId);
    row.affectedRecipes.add(detail.recipeId);
    row.missingNutrientFields += 1;
  }
  for (const issue of detail.semanticIssues) unresolvedKeys.add(`semantic:${issue.nutrient}:${issue.issue}`);

  const unresolvedCount = unresolvedKeys.size;
  const blockingIngredients = [...unresolvedKeys].filter(key => key.startsWith("ingredient:")).map(key => key.slice(11)).sort();
  if (unresolvedCount) {
    for (const ingredientId of blockingIngredients) {
      const row = rowFor(ingredientId);
      row.weightedUnlockScore += 1 / unresolvedCount;
      if (unresolvedCount <= 2) row.nearUnlockRecipes.add(detail.recipeId);
    }
  }
  recipeRows.push({
    recipeId: detail.recipeId,
    unresolvedCount,
    blockingIngredients,
    blockerEvents: detail.blockers.length,
    nutrientFieldGapEvents: detail.nutrientFieldGaps.length,
    semanticIssueEvents: detail.semanticIssues.length
  });
}

const ingredientPriorities = [...byIngredient.values()].map(row => ({
  ingredientId: row.ingredientId,
  densityBlockers: row.densityBlockers,
  quantityBlockers: row.quantityBlockers,
  ambiguousPortions: row.ambiguousPortions,
  missingNutrientFields: row.missingNutrientFields,
  affectedRecipeCount: row.affectedRecipes.size,
  nearUnlockRecipeCount: row.nearUnlockRecipes.size,
  nearUnlockRecipeIds: [...row.nearUnlockRecipes].sort(),
  weightedUnlockScore: Number(row.weightedUnlockScore.toFixed(4))
})).sort((a,b) =>
  b.nearUnlockRecipeCount - a.nearUnlockRecipeCount ||
  b.weightedUnlockScore - a.weightedUnlockScore ||
  b.affectedRecipeCount - a.affectedRecipeCount ||
  a.ingredientId.localeCompare(b.ingredientId)
);

const closestRecipes = recipeRows.filter(row => row.unresolvedCount > 0)
  .sort((a,b) => a.unresolvedCount - b.unresolvedCount || a.recipeId.localeCompare(b.recipeId));

const report = {
  schemaVersion: "nutrition-unlock-priorities-v1",
  authoredRecipeCount: AUTHORED_RECIPES.length,
  authoritativeRecipeCount: audit.authoritativeRecipeCount,
  blockerCounts: audit.blockerCounts,
  missingNutrientFieldCounts: audit.missingNutrientFieldCounts,
  semanticIssueCounts: audit.semanticIssueCounts,
  ingredientPriorities: ingredientPriorities.slice(0, 40),
  closestRecipes: closestRecipes.slice(0, 40)
};
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
