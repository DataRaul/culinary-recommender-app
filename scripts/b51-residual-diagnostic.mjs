import { AUTHORED_RECIPES } from "../src/data/corpus-v1.js";
import { publicNutritionSource } from "../src/domain/nutrition.js";
import { buildNutritionCoverageAudit } from "../src/domain/nutrition-coverage-audit.js";

const audit = buildNutritionCoverageAudit(AUTHORED_RECIPES, publicNutritionSource);
const counts = new Map();
const uses = new Map();
for (const detail of audit.recipeDetails) {
  for (const blocker of detail.blockers) {
    if (blocker.reason !== "missing_density" || !blocker.ingredientId) continue;
    counts.set(blocker.ingredientId, (counts.get(blocker.ingredientId) || 0) + 1);
    const recipe = AUTHORED_RECIPES.find(row => row.id === detail.recipeId);
    const ingredient = recipe?.ingredients.find(row => row.canonicalIngredientId === blocker.ingredientId);
    if (!uses.has(blocker.ingredientId)) uses.set(blocker.ingredientId, []);
    uses.get(blocker.ingredientId).push({ recipeId: detail.recipeId, quantity: ingredient?.quantity ?? null, unit: ingredient?.unit ?? null, preparation: ingredient?.preparation ?? null, steps: recipe?.instructions?.map(step => step.text).join(" ") ?? "" });
  }
}
const ranked = [...counts.entries()].sort((a,b) => b[1]-a[1] || a[0].localeCompare(b[0]));
console.log("B51_RANK=" + ranked.map(([id,count]) => `${id}:${count}`).join(","));
for (const [id,count] of ranked) console.log(`B51_USE=${id}:${count}:` + JSON.stringify(uses.get(id)));
console.log("B51_AUDIT=" + JSON.stringify({ authoritative:audit.authoritativeRecipeCount, estimate:audit.estimateRecipeCount, blockerCounts:audit.blockerCounts, missingNutrientFieldCounts:audit.missingNutrientFieldCounts, semanticIssueCounts:audit.semanticIssueCounts }));
