export const PROFILE_DIMENSIONS = {
  budget: [1, 2, 3, 4],
  nutritionPriority: [1, 2, 3, 4],
  speed: [1, 2, 3, 4],
  skill: [1, 2, 3, 4],
  variety: [1, 2, 3, 4],
  proteinEmphasis: [1, 2, 3, 4],
  mealPrep: [1, 2, 3, 4]
};

export const CUISINES = ["Any", "Canarian", "Spanish", "Mediterranean", "Italian", "Indian", "East Asian", "Southeast Asian", "Middle Eastern", "Latin American"];
export const DIETARY_MODES = ["unrestricted", "vegetarian", "vegan"];

export const DEFAULT_PROFILE = {
  name: "My cooking profile",
  preset: "healthy_convenience",
  budget: 2,
  nutritionPriority: 3,
  speed: 3,
  maxMinutes: 35,
  skill: 2,
  variety: 2,
  cuisinePreferences: ["Mediterranean"],
  proteinEmphasis: 3,
  mealPrep: 2,
  dietaryMode: "unrestricted",
  allergens: [],
  excludedIngredientIds: [],
  unavailableIngredientIds: [],
  currentPantryIngredientIds: [],
  pantryStapleIds: [],
  objective: "make healthy cooking easy"
};

export const PRESETS = {
  budget_beginner: { label: "Budget Beginner", budget: 1, nutritionPriority: 2, speed: 3, maxMinutes: 30, skill: 1, variety: 1, proteinEmphasis: 2, mealPrep: 2, objective: "reduce cost" },
  healthy_convenience: { label: "Healthy Convenience", budget: 2, nutritionPriority: 4, speed: 4, maxMinutes: 30, skill: 2, variety: 2, proteinEmphasis: 3, mealPrep: 2, objective: "make healthy cooking easy" },
  premium_healthy: { label: "Premium Healthy", budget: 4, nutritionPriority: 4, speed: 2, maxMinutes: 50, skill: 2, variety: 3, proteinEmphasis: 3, mealPrep: 1, objective: "make healthy cooking easy" },
  meal_prep_worker: { label: "Meal Prep Worker", budget: 2, nutritionPriority: 3, speed: 3, maxMinutes: 40, skill: 2, variety: 2, proteinEmphasis: 3, mealPrep: 4, objective: "meal prep" },
  culinary_explorer: { label: "Culinary Explorer", budget: 3, nutritionPriority: 2, speed: 1, maxMinutes: 70, skill: 3, variety: 4, proteinEmphasis: 2, mealPrep: 1, objective: "discover new food" },
  advanced_cook: { label: "Advanced Cook", budget: 4, nutritionPriority: 2, speed: 1, maxMinutes: 90, skill: 4, variety: 4, proteinEmphasis: 2, mealPrep: 1, objective: "learn techniques" },
  high_protein_convenience: { label: "High-Protein Convenience", budget: 2, nutritionPriority: 3, speed: 4, maxMinutes: 30, skill: 2, variety: 2, proteinEmphasis: 4, mealPrep: 3, objective: "increase protein" },
  mediterranean_everyday: { label: "Mediterranean Everyday", budget: 2, nutritionPriority: 3, speed: 3, maxMinutes: 35, skill: 2, variety: 2, cuisinePreferences: ["Mediterranean", "Spanish", "Canarian"], proteinEmphasis: 2, mealPrep: 2, objective: "make healthy cooking easy" },
  vegetarian_explorer: { label: "Vegetarian Explorer", budget: 2, nutritionPriority: 3, speed: 2, maxMinutes: 45, skill: 2, variety: 4, dietaryMode: "vegetarian", proteinEmphasis: 3, mealPrep: 2, objective: "discover new food" }
};

const clamp = value => Math.max(1, Math.min(4, Number(value) || 1));

export function applyPreset(profile, presetId) {
  const preset = PRESETS[presetId];
  if (!preset) return { ...profile };
  return normalizeProfile({ ...profile, ...preset, preset: presetId });
}

export function normalizeProfile(input = {}) {
  const profile = { ...DEFAULT_PROFILE, ...input };
  profile.budget = clamp(profile.budget);
  profile.nutritionPriority = clamp(profile.nutritionPriority);
  profile.speed = clamp(profile.speed);
  profile.skill = clamp(profile.skill);
  profile.variety = clamp(profile.variety);
  profile.proteinEmphasis = clamp(profile.proteinEmphasis);
  profile.mealPrep = clamp(profile.mealPrep);
  profile.maxMinutes = Math.max(10, Math.min(180, Number(profile.maxMinutes) || 35));
  profile.dietaryMode = DIETARY_MODES.includes(profile.dietaryMode) ? profile.dietaryMode : "unrestricted";
  profile.cuisinePreferences = [...new Set(Array.isArray(profile.cuisinePreferences) ? profile.cuisinePreferences.filter(Boolean) : [])];
  profile.allergens = [...new Set(Array.isArray(profile.allergens) ? profile.allergens.filter(Boolean) : [])];
  for (const key of ["excludedIngredientIds", "unavailableIngredientIds", "currentPantryIngredientIds", "pantryStapleIds"]) {
    profile[key] = [...new Set(Array.isArray(profile[key]) ? profile[key].filter(Boolean) : [])];
  }
  return profile;
}
