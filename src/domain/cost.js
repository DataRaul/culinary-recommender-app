export function estimatePortfolioCost(planItems) {
  if (!planItems.length) return { tier: 0, label: "—", confidence: "low", note: "No meals selected." };
  const weighted = planItems.reduce((sum, item) => sum + item.recipe.economics.costTier * item.recipe.serving.servings, 0);
  const portions = planItems.reduce((sum, item) => sum + item.recipe.serving.servings, 0);
  const average = weighted / Math.max(portions, 1);
  const tier = Math.max(1, Math.min(4, Math.round(average)));
  return {
    tier,
    label: "€".repeat(tier),
    confidence: "low",
    note: "Relative V0 tier based on project-authored Spain/Canary heuristics; not live supermarket pricing."
  };
}
