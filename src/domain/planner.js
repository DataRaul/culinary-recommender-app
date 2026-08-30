import { rankRecipes, explainShortfall } from "./recommendation.js";

const ingredientSet = recipe => new Set(recipe.ingredients.map(item => item.canonicalIngredientId));
const intersectionSize = (a, b) => [...a].filter(value => b.has(value)).length;

function portfolioAdjustment(candidate, chosen, profile) {
  if (!chosen.length) return 0;
  const candidateIngredients = ingredientSet(candidate.recipe);
  const reuse = chosen.reduce((sum, item) => sum + intersectionSize(candidateIngredients, ingredientSet(item.recipe)), 0);
  const cuisineRepeats = chosen.filter(item => item.recipe.culinary.cuisine === candidate.recipe.culinary.cuisine).length;
  const proteinRepeats = chosen.filter(item => item.recipe.mainProtein && item.recipe.mainProtein === candidate.recipe.mainProtein).length;
  const flavourRepeats = chosen.filter(item => item.recipe.discovery.flavourProfile.some(flavour => candidate.recipe.discovery.flavourProfile.includes(flavour))).length;
  const reuseBonus = Math.min(0.14, reuse * 0.012) * (profile.mealPrep >= 3 ? 1.25 : 1);
  const diversityPenalty = cuisineRepeats * (profile.variety >= 3 ? 0.075 : 0.045) + proteinRepeats * 0.07 + flavourRepeats * 0.025;
  return reuseBonus - diversityPenalty;
}

export function planSlots(recipes, profile, slots, options = {}) {
  const chosen = [];
  const excludedIds = new Set(options.excludeRecipeIds || []);
  const shortfalls = [];
  for (const slot of slots) {
    const ranked = rankRecipes(recipes.filter(recipe => !excludedIds.has(recipe.id)), profile, { mealType: slot.mealType });
    const available = ranked.eligible.filter(item => !chosen.some(chosenItem => chosenItem.recipe.id === item.recipe.id));
    if (!available.length) {
      shortfalls.push({ slot, causes: explainShortfall(ranked.rejected) });
      continue;
    }
    const scored = available.map(item => ({ ...item, portfolioScore: Number((item.score + portfolioAdjustment(item, chosen, profile)).toFixed(6)) }))
      .sort((a, b) => b.portfolioScore - a.portfolioScore || a.recipe.id.localeCompare(b.recipe.id));
    const winner = { ...scored[0], slot };
    chosen.push(winner);
    excludedIds.add(winner.recipe.id);
  }
  return { items: chosen, shortfalls, complete: chosen.length === slots.length };
}

export function swapSlot(recipes, profile, plan, slotId) {
  const current = plan.items.find(item => item.slot.id === slotId);
  if (!current) return plan;
  const retained = plan.items.filter(item => item.slot.id !== slotId);
  const excludeRecipeIds = retained.map(item => item.recipe.id).concat(current.recipe.id);
  const replacementPlan = planSlots(recipes, profile, [current.slot], { excludeRecipeIds });
  if (!replacementPlan.items.length) return plan;
  return { items: [...retained, replacementPlan.items[0]].sort((a, b) => a.slot.order - b.slot.order), shortfalls: plan.shortfalls.filter(item => item.slot.id !== slotId), complete: true };
}

export function defaultSlots() {
  return [
    { id: "mon-lunch", order: 1, day: "Monday", mealType: "lunch" },
    { id: "tue-lunch", order: 2, day: "Tuesday", mealType: "lunch" },
    { id: "wed-dinner", order: 3, day: "Wednesday", mealType: "dinner" },
    { id: "fri-dinner", order: 4, day: "Friday", mealType: "dinner" },
    { id: "sat-dinner", order: 5, day: "Saturday", mealType: "dinner" }
  ];
}

export function allWeekSlots() {
  const days = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
  return days.flatMap((day, dayIndex) => ["lunch","dinner"].map((mealType, mealIndex) => ({ id: `${day.slice(0,3).toLowerCase()}-${mealType}`, order: dayIndex * 2 + mealIndex + 1, day, mealType })));
}
