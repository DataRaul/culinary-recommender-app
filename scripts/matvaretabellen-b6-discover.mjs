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

const unitPortionNames = {
  piece: ["pcs", "piece"],
  pieces: ["pcs", "piece"],
  clove: ["clove"],
  cloves: ["clove"],
  tbsp: ["tablespoon"],
  tsp: ["teaspoon"],
  small: ["pcs (small)", "small"]
};

const transformedPieceTerms = [
  "juice", "mousse", "soup", "salad", "puree", "puree", "powder", "paste", "ketchup",
  "canned", "pickled", "smoothie", "tart", "pie", "cake", "drink", "sauce", "cooked"
];

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

function hasMatchingPortion(target, food) {
  const expected = unitPortionNames[target.unit] || [];
  if (!expected.length) return false;
  return (food.portions || []).some(portion => expected.includes(normalize(portion.portionName)));
}

function candidateScore(target, food) {
  const foodName = normalize(food.foodName);
  const canonical = normalize(target.canonicalName);
  const aliases = [...new Set((target.aliases || []).map(normalize).filter(Boolean))];
  let score = 0;

  if (foodName === canonical) score = 160;
  else if (foodName === `${canonical} raw`) score = 155;
  else if (foodName.startsWith(`${canonical} raw`)) score = 150;
  else if (foodName.startsWith(`${canonical} `)) score = 130;
  else if (foodName.includes(canonical)) score = 90;
  score = Math.max(score, Math.round(tokenOverlap(canonical, foodName) * 75));

  for (const alias of aliases) {
    if (foodName === alias) score = Math.max(score, 125);
    else if (foodName === `${alias} raw`) score = Math.max(score, 120);
    else if (foodName.startsWith(`${alias} raw`)) score = Math.max(score, 115);
    else if (foodName.startsWith(`${alias} `)) score = Math.max(score, 100);
    else if (foodName.includes(alias)) score = Math.max(score, 70);
    score = Math.max(score, Math.round(tokenOverlap(alias, foodName) * 55));
  }

  if (hasMatchingPortion(target, food)) score += 35;
  if (/\braw\b/.test(foodName)) score += 20;

  if (["piece", "pieces", "clove", "cloves", "small"].includes(target.unit)) {
    if (transformedPieceTerms.some(term => foodName.includes(term))) score -= 60;
  }

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
      matchingPortion: hasMatchingPortion(target, food),
      score: candidateScore(target, food)
    }))
    .filter(candidate => candidate.score >= 35)
    .sort((a, b) => b.score - a.score || Number(b.matchingPortion) - Number(a.matchingPortion) || String(a.foodName).localeCompare(String(b.foodName)))
    .slice(0, 10);

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
    sourceLicense: "NLOD 2.0 / Norsk lisens for offentlige data; attribution required",
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
  targets: report.targets.map(({ ingredientId, unit, blockerEvents, recipeIds, candidates }) => ({
    ingredientId,
    unit,
    blockerEvents,
    recipeIds,
    candidates: candidates.slice(0, 6).map(({ foodId, foodName, portions, matchingPortion, score }) => ({
      foodId, foodName, matchingPortion, score, portions
    }))
  }))
}, null, 2));
