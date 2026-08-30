import { costHeuristicForIngredient, COST_HEURISTIC_VERSION } from "../data/cost-heuristics.js";

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export function analyzePortfolioCost(planItems = []) {
  if (!planItems.length) {
    return {
      tier: 0,
      label: "—",
      confidence: "low",
      note: "No meals selected.",
      heuristicVersion: COST_HEURISTIC_VERSION,
      uniqueIngredientCount: 0,
      reusedIngredientCount: 0,
      reuseScore: 0,
      packageBurden: 0,
      availabilityBurden: 0,
      ingredientClassMix: { low: 0, medium: 0, high: 0, premium: 0 }
    };
  }

  const usage = new Map();
  const heuristics = new Map();
  for (const item of planItems) {
    for (const ingredient of item.recipe.ingredients || []) {
      if (!ingredient.required) continue;
      const id = ingredient.canonicalIngredientId;
      usage.set(id, (usage.get(id) || 0) + 1);
      if (!heuristics.has(id)) heuristics.set(id, costHeuristicForIngredient(id));
    }
  }

  const unique = [...heuristics.values()];
  const mix = { low: 0, medium: 0, high: 0, premium: 0 };
  for (const item of unique) mix[item.costClass] += 1;

  const ingredientAverage = unique.length ? unique.reduce((sum, item) => sum + item.classScore, 0) / unique.length : 1;
  const reusedIngredientCount = [...usage.values()].filter(count => count > 1).length;
  const reuseScore = unique.length ? reusedIngredientCount / unique.length : 0;

  const oneOff = unique.filter(item => usage.get(item.ingredientId) === 1 && !item.pantryCandidate);
  const packageBurden = unique.length ? oneOff.reduce((sum, item) => sum + item.packageSensitivity, 0) / unique.length : 0;
  const availabilityBurden = unique.length ? unique.reduce((sum, item) => sum + item.availabilityPenalty, 0) / unique.length : 0;

  const portions = planItems.reduce((sum, item) => sum + (Number(item.recipe.serving?.servings) || 1), 0);
  const authoredAverage = planItems.reduce((sum, item) => {
    const servings = Number(item.recipe.serving?.servings) || 1;
    return sum + (Number(item.recipe.economics?.costTier) || 2) * servings;
  }, 0) / Math.max(portions, 1);

  // Keep the project-authored recipe tier as the strongest prior, then refine it
  // with ingredient classes, one-off package burden, Canary availability and reuse.
  const composite = authoredAverage * 0.58 + ingredientAverage * 0.30 + packageBurden * 0.35 + availabilityBurden * 0.45 - reuseScore * 0.35;
  const tier = clamp(Math.round(composite), 1, 4);

  return {
    tier,
    label: "€".repeat(tier),
    confidence: "low",
    note: "Relative Spain/Canary portfolio heuristic using authored recipe tiers, ingredient classes, package burden, availability and cross-meal reuse; not live supermarket pricing.",
    heuristicVersion: COST_HEURISTIC_VERSION,
    authoredAverage: Number(authoredAverage.toFixed(3)),
    ingredientAverage: Number(ingredientAverage.toFixed(3)),
    uniqueIngredientCount: unique.length,
    reusedIngredientCount,
    reuseScore: Number(reuseScore.toFixed(3)),
    packageBurden: Number(packageBurden.toFixed(3)),
    availabilityBurden: Number(availabilityBurden.toFixed(3)),
    ingredientClassMix: mix
  };
}

export function estimatePortfolioCost(planItems) {
  return analyzePortfolioCost(planItems);
}
