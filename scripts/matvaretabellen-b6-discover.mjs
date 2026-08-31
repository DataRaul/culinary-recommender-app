import fs from "node:fs/promises";
import path from "node:path";
import { ALL_RECIPES } from "../src/data/corpus-v1.js";
import { INGREDIENTS } from "../src/data/ingredients.js";
import { publicNutritionSource } from "../src/domain/nutrition.js";

const API_URL = "https://www.matvaretabellen.no/api/en/foods.json";
const OUTPUT = process.argv[2] || "artifacts/matvaretabellen-b6-discovery.json";

const normalize = value => String(value || "")
  .normalize("NFKD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, " ")
  .trim();

const tokens = value => new Set(normalize(value).split(/\s+/).filter(Boolean));
const tokenOverlap = (a, b) => {
  const left = tokens(a);
  const right = tokens(b);
  if (!left.size || !right.size) return 0;
  let common = 0;
  for (const token of left) if (right.has(token)) common += 1;
  return common / Math.max(left.size, right.size);
};

function collectUnsupportedTargets() {
  const counts = new Map();
  const recipesByTarget = new Map();

  for (const recipe of ALL_RECIPES) {
    const estimate = publicNutritionSource.estimate(recipe);
    const skipped = estimate?.evidence?.staticCalculation?.skipped || [];
    for (const blocker of skipped) {
      if (blocker.reason !== "unsupported_quantity_unit") continue;
      const matching = (recipe.ingredients || []).filter(item => item.canonicalIngredientId === blocker.ingredientId);
      for (const ingredient of matching) {
        const unit = String(ingredient.unit || "").toLowerCase();
        const key = `${blocker.ingredientId}|${unit}`;
        counts.set(key, (counts.get(key) || 0) + 1);
        if (!recipesByTarget.has(key)) recipesByTarget.set(key, new Set());
        recipesByTarget.get(key).add(recipe.id);
      }
    }
  }

  return [...counts.entries()]
    .map(([key, count]) => {
      const [ingredientId, unit] = key.split("|");
      const ingredient = INGREDIENTS[ingredientId] || {};
      return {
        ingredientId,
        unit,
        blockerEvents: count,
        recipeIds: [...(recipesByTarget.get(key) || [])].sort(),
        canonicalName: ingredient.name || ingredientId,
        aliases: ingredient.aliases || []
      };
    })
    .sort((a, b) => b.blockerEvents - a.blockerEvents || a.ingredientId.localeCompare(b.ingredientId) || a.unit.localeCompare(b.unit));
}

function candidateScore(target, food) {
  const foodName = normalize(food.foodName);
  const terms = [target.canonicalName, ...(target.aliases || [])].map(normalize).filter(Boolean);
  let score = 0;
  for (const term of terms) {
    if (foodName === term) score = Math.max(score, 100);
    if (foodName.startsWith(`${term} `) || foodName.startsWith(`${term},`)) score = Math.max(score, 90);
    if (foodName.includes(term)) score = Math.max(score, 70);
    score = Math.max(score, Math.round(tokenOverlap(term, foodName) * 60));
  }
  if (food.portions?.length) score += 10;
  return score;
}

const targets = collectUnsupportedTargets();
const response = await fetch(API_URL, { headers: { "user-agent": "DataRaul-culinary-recommender-b6-bounded-discovery" } });
if (!response.ok) throw new Error(`Matvaretabellen fetch failed: HTTP ${response.status}`);
const payload = await response.json();
const foods = Array.isArray(payload) ? payload : payload.foods;
if (!Array.isArray(foods)) throw new Error("Unexpected Matvaretabellen foods payload");

const results = targets.map(target => {
  const candidates = foods
    .filter(food => Array.isArray(food.portions) && food.portions.length > 0)
    .map(food => ({
      foodId: food.foodId,
      foodName: food.foodName,
      url: food.url,
      foodGroupId: food.foodGroupId,
      ediblePart: food.ediblePart,
      portions: food.portions,
      score: candidateScore(target, food)
    }))
    .filter(candidate => candidate.score >= 35)
    .sort((a, b) => b.score - a.score || String(a.foodName).localeCompare(String(b.foodName)))
    .slice(0, 8);

  return { ...target, candidates };
});

const report = {
  schemaVersion: "matvaretabellen-b6-portion-discovery-v1",
  generatedFrom: {
    corpusRecipes: ALL_RECIPES.length,
    apiUrl: API_URL,
    sourceAuthority: "Norwegian Food Safety Authority (Mattilsynet)",
    sourceVersion: "Norwegian Food Composition Table 2026",
    sourceRelease: "2026-01",
    sourceLicense: "NLOD / Norsk lisens for offentlige data; attribution required",
    attribution: "Norwegian Food Composition Table 2026. The Norwegian Food Safety Authority. www.matvaretabellen.no"
  },
  rules: {
    discoveryOnly: true,
    noAutomaticPromotion: true,
    portionEvidenceOnly: true,
    requireExactFoodFormAndPortionSemantics: true,
    noGenericAverages: true
  },
  unsupportedTargetCount: targets.length,
  unsupportedBlockerEvents: targets.reduce((sum, target) => sum + target.blockerEvents, 0),
  targets: results
};

await fs.mkdir(path.dirname(OUTPUT), { recursive: true });
await fs.writeFile(OUTPUT, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log(JSON.stringify({
  schemaVersion: report.schemaVersion,
  unsupportedTargetCount: report.unsupportedTargetCount,
  unsupportedBlockerEvents: report.unsupportedBlockerEvents,
  topTargets: report.targets.slice(0, 30).map(({ ingredientId, unit, blockerEvents, candidates }) => ({
    ingredientId,
    unit,
    blockerEvents,
    candidates: candidates.slice(0, 4).map(({ foodId, foodName, portions, score }) => ({ foodId, foodName, score, portions }))
  }))
}, null, 2));