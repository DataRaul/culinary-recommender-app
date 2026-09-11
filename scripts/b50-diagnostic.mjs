import { AUTHORED_RECIPES } from "../src/data/corpus-v1.js";
import { publicNutritionSource } from "../src/domain/nutrition.js";
import { buildNutritionCoverageAudit } from "../src/domain/nutrition-coverage-audit.js";
import { europeanPrimaryPolicyCoverage } from "../src/domain/nutrition-source-policy-runtime.js";

const tofuRows = AUTHORED_RECIPES
  .filter(recipe => recipe.ingredients.some(ingredient => ingredient.canonicalIngredientId === "tofu_firm"))
  .map(recipe => {
    const ingredient = recipe.ingredients.find(item => item.canonicalIngredientId === "tofu_firm");
    return [recipe.id, ingredient.quantity, ingredient.unit, ingredient.preparation ?? null];
  })
  .sort((a, b) => a[0].localeCompare(b[0]));

const coverage = europeanPrimaryPolicyCoverage(["tofu_firm"]);
const audit = buildNutritionCoverageAudit(AUTHORED_RECIPES, publicNutritionSource);
const tofuDetails = audit.recipeDetails
  .filter(row => tofuRows.some(([recipeId]) => recipeId === row.recipeId))
  .map(row => ({ recipeId: row.recipeId, authoritative: row.authoritative, blockers: row.blockers, nutrientFieldGaps: row.nutrientFieldGaps, semanticIssues: row.semanticIssues }));

console.log(JSON.stringify({
  tofuRows,
  coverage: {
    evidenceIngredientCount: coverage.evidenceIngredientCount,
    matvaretabellenSelectedCount: coverage.matvaretabellenSelectedCount,
    mextSelectedCount: coverage.mextSelectedCount,
    afcdSelectedCount: coverage.afcdSelectedCount,
    afcdB50SelectedCount: coverage.afcdB50SelectedCount,
    selections: coverage.selections
  },
  audit: {
    recipeCount: audit.recipeCount,
    authoritativeRecipeCount: audit.authoritativeRecipeCount,
    estimateRecipeCount: audit.estimateRecipeCount,
    blockerCounts: audit.blockerCounts,
    missingNutrientFieldCounts: audit.missingNutrientFieldCounts,
    semanticIssueCounts: audit.semanticIssueCounts,
    authoritativeRecipeIds: audit.authoritativeRecipeIds,
    tofuDetails
  }
}, null, 2));
