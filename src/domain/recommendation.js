import { activePriorityPacks, normalizeProfile } from "./profile.js";
import { resolveAvailability } from "./substitution.js";
import { isIngredientPermanentlyExcluded } from "./exclusions.js";

const clamp01 = value => Math.max(0, Math.min(1, value));
const closeness = (a, b, span = 3) => clamp01(1 - Math.abs(a - b) / span);

function packAdjustment(recipe, profile, mealType, components) {
  const packs = activePriorityPacks(profile, mealType);
  if (!packs.length) return { bonus: 0, packs: [] };

  const signals = {
    budget: components.budget,
    speed: components.speed,
    simplicity: closeness(recipe.culinary.difficulty, 1),
    nutrition: components.nutrition,
    protein: components.protein,
    availability: components.availability,
    mealPrep: recipe.convenience.mealPrepSuitability / 4,
    batch: recipe.convenience.batchSuitability / 4,
    leftovers: recipe.convenience.leftoverSuitability / 4,
    portable: recipe.convenience.portability / 4,
    novelty: recipe.discovery.novelty / 4,
    learning: recipe.discovery.techniqueLearningValue / 4,
    challenge: recipe.culinary.difficulty / 4
  };

  let rawBonus = 0;
  for (const pack of packs) {
    for (const [signal, weight] of Object.entries(pack.signals || {})) rawBonus += (signals[signal] || 0) * weight;
  }
  return { bonus: Number(Math.min(0.24, rawBonus).toFixed(6)), packs };
}

export function hardConstraintReasons(recipe, rawProfile, mealType = null) {
  const profile = normalizeProfile(rawProfile);
  const reasons = [];
  if (mealType && !recipe.culinary.mealTypes.includes(mealType)) reasons.push(`not tagged for ${mealType}`);
  if (profile.dietaryMode !== "unrestricted" && !recipe.dietaryTags.includes(profile.dietaryMode)) reasons.push(`not ${profile.dietaryMode}`);
  if (recipe.culinary.difficulty > profile.skill) reasons.push("above selected cooking skill");
  if (recipe.time.totalMinutes > profile.maxMinutes) reasons.push(`over ${profile.maxMinutes}-minute limit`);
  const ingredientIds = recipe.ingredients.map(item => item.canonicalIngredientId);
  const excluded = ingredientIds.filter(id => isIngredientPermanentlyExcluded(id, profile.excludedIngredientIds));
  if (excluded.length) reasons.push(`contains excluded ingredient: ${excluded.join(", ")}`);
  const allergenHits = recipe.allergySafety.declaredAllergens.filter(allergen => profile.allergens.includes(allergen));
  if (allergenHits.length) reasons.push(`declared allergen: ${allergenHits.join(", ")}`);
  const availability = resolveAvailability(recipe, profile);
  if (availability.unresolved.length) reasons.push(`unavailable without supported substitute: ${availability.unresolved.join(", ")}`);
  return reasons;
}

export function evaluateRecipe(recipe, rawProfile, context = {}) {
  const profile = normalizeProfile(rawProfile);
  const mealType = context.mealType || null;
  const hardReasons = hardConstraintReasons(recipe, profile, mealType);
  if (hardReasons.length) return { recipe, eligible: false, hardReasons, score: -Infinity, components: {}, explanation: "" };

  const nutrition = recipe.nutrition.perServing;
  const proteinTarget = profile.proteinEmphasis >= 4 ? 30 : profile.proteinEmphasis >= 3 ? 22 : 15;
  const nutritionScore = clamp01((nutrition.fibreG || 0) / 14) * 0.5 + clamp01((nutrition.proteinG || 0) / proteinTarget) * 0.5;
  const budgetScore = recipe.economics.costTier <= profile.budget ? 1 : clamp01(1 - (recipe.economics.costTier - profile.budget) * 0.35);
  const speedScore = clamp01(1 - recipe.time.totalMinutes / Math.max(profile.maxMinutes * 1.4, 1));
  const skillScore = closeness(recipe.culinary.difficulty, profile.skill);
  const cuisineScore = profile.cuisinePreferences.length === 0 ? 0.7 : profile.cuisinePreferences.includes(recipe.culinary.cuisine) ? 1 : 0.45;
  const proteinScore = clamp01((nutrition.proteinG || 0) / proteinTarget);
  const mealPrepScore = recipe.convenience.mealPrepSuitability / 4;
  const noveltyScore = profile.variety <= 1 ? closeness(recipe.discovery.novelty, 1) : profile.variety >= 4 ? recipe.discovery.novelty / 4 : closeness(recipe.discovery.novelty, profile.variety);
  const availability = resolveAvailability(recipe, profile);
  const availabilityScore = clamp01(1 - availability.substitutionBurden * 0.12);
  const currentPantry = new Set(profile.currentPantryIngredientIds || []);
  const pantryMatches = recipe.ingredients.filter(item => currentPantry.has(item.canonicalIngredientId)).length;
  const pantryUtilization = recipe.ingredients.length ? pantryMatches / recipe.ingredients.length : 0;

  const components = {
    nutrition: nutritionScore,
    budget: budgetScore,
    speed: speedScore,
    skill: skillScore,
    cuisine: cuisineScore,
    protein: proteinScore,
    mealPrep: mealPrepScore,
    novelty: noveltyScore,
    availability: availabilityScore,
    pantry: pantryUtilization,
    substitutionPenalty: clamp01(availability.substitutionBurden / 5)
  };

  const weights = {
    nutrition: 0.12 + profile.nutritionPriority * 0.025,
    budget: 0.11 + (5 - profile.budget) * 0.02,
    speed: 0.11 + profile.speed * 0.02,
    skill: 0.09,
    cuisine: 0.11,
    protein: 0.08 + profile.proteinEmphasis * 0.025,
    mealPrep: 0.06 + profile.mealPrep * 0.02,
    novelty: 0.09,
    availability: 0.10,
    pantry: 0.05,
    substitutionPenalty: -0.08
  };
  const baseScore = Object.entries(components).reduce((sum, [key, value]) => sum + value * weights[key], 0);
  const pack = packAdjustment(recipe, profile, mealType, components);
  const score = baseScore + pack.bonus;

  const reasons = [];
  if (components.budget >= 0.95) reasons.push(`${"€".repeat(recipe.economics.costTier)} budget fit`);
  if (recipe.time.totalMinutes <= profile.maxMinutes) reasons.push(`${recipe.time.totalMinutes}-minute target`);
  if (profile.dietaryMode !== "unrestricted") reasons.push(profile.dietaryMode);
  if (profile.proteinEmphasis >= 3 && nutrition.proteinG >= 20) reasons.push(`~${nutrition.proteinG}g protein/serving`);
  if (components.cuisine === 1) reasons.push(`${recipe.culinary.cuisine} preference`);
  if (components.pantry > 0) reasons.push(`${pantryMatches} current-pantry ingredient${pantryMatches === 1 ? "" : "s"}`);
  if (availability.adaptations.length) reasons.push(`${availability.adaptations.length} supported substitution${availability.adaptations.length === 1 ? "" : "s"}`);
  if (pack.packs.length) reasons.push(`${pack.packs.map(item => item.label).join(" + ")} priority`);

  return {
    recipe,
    eligible: true,
    hardReasons: [],
    score: Number(score.toFixed(6)),
    baseScore: Number(baseScore.toFixed(6)),
    priorityPackBonus: pack.bonus,
    activePriorityPacks: pack.packs.map(item => ({ id: item.id, scope: item.scope, label: item.label })),
    components,
    availability,
    explanation: `Recommended because it fits ${reasons.slice(0, 4).join(", ") || "your selected profile"}.`
  };
}

export function rankRecipes(recipes, profile, context = {}) {
  const evaluated = recipes.map(recipe => evaluateRecipe(recipe, profile, context));
  const eligible = evaluated.filter(item => item.eligible).sort((a, b) => b.score - a.score || a.recipe.id.localeCompare(b.recipe.id));
  const rejected = evaluated.filter(item => !item.eligible).sort((a, b) => a.recipe.id.localeCompare(b.recipe.id));
  return { eligible, rejected };
}

export function explainShortfall(rejected) {
  const counts = new Map();
  for (const item of rejected) for (const reason of item.hardReasons) counts.set(reason, (counts.get(reason) || 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 4).map(([reason, count]) => ({ reason, count }));
}
