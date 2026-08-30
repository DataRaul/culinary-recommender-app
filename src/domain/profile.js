export const PROFILE_DIMENSIONS = {
  budget: [1, 2, 3, 4],
  nutritionPriority: [1, 2, 3, 4],
  speed: [1, 2, 3, 4],
  skill: [1, 2, 3, 4],
  variety: [1, 2, 3, 4],
  proteinEmphasis: [1, 2, 3, 4],
  mealPrep: [1, 2, 3, 4]
};

export const CUISINE_CHOICES = [
  { value: "Mediterranean", label: "Mediterranean" },
  { value: "Italian", label: "Italian" },
  { value: "Spanish", label: "Spanish" },
  { value: "Indian", label: "Indian" },
  { value: "Southeast Asian", label: "Thai / Southeast Asian" },
  { value: "East Asian", label: "East Asian" },
  { value: "Middle Eastern", label: "Middle Eastern" },
  { value: "Latin American", label: "Latin American" },
  { value: "Canarian", label: "Local / Canarian" }
];
export const CUISINES = ["Any", ...CUISINE_CHOICES.map(item => item.value)];
export const DIETARY_MODES = ["unrestricted", "vegetarian", "vegan"];

export const MAX_PRIORITY_PACKS = 3;
export const PACK_SCOPES = ["all", "lunch", "dinner"];
export const PACK_SCOPE_LABELS = {
  all: "All meals",
  lunch: "Lunch",
  dinner: "Dinner"
};

export const PRIORITY_PACKS = {
  budget_easy: {
    label: "Budget & Easy",
    description: "Economical, simple choices when cost and effort matter.",
    signals: { budget: 0.07, speed: 0.04, simplicity: 0.05 }
  },
  healthy_convenience: {
    label: "Healthy Convenience",
    description: "Nutrition-aware food that stays practical on busy days.",
    signals: { nutrition: 0.07, speed: 0.06, protein: 0.03 }
  },
  premium_healthy: {
    label: "Premium Healthy",
    description: "Prioritize nutrition and quality without pushing cost down.",
    signals: { nutrition: 0.08, availability: 0.03, novelty: 0.03 }
  },
  meal_prep: {
    label: "Meal Prep",
    description: "Batch-friendly, portable food with useful leftovers.",
    signals: { mealPrep: 0.07, batch: 0.04, leftovers: 0.04, portable: 0.03 }
  },
  culinary_explorer: {
    label: "Culinary Explorer",
    description: "Favor novelty and learning while keeping hard limits intact.",
    signals: { novelty: 0.09, learning: 0.05, challenge: 0.02 }
  },
  advanced_technique: {
    label: "Technique Builder",
    description: "Reward recipes that teach more and use higher-skill methods.",
    signals: { learning: 0.08, challenge: 0.07, novelty: 0.03 }
  },
  high_protein_convenience: {
    label: "High-Protein Convenience",
    description: "Protein-forward choices that remain fast and prep-friendly.",
    signals: { protein: 0.08, speed: 0.05, mealPrep: 0.04 }
  },
  weeknight_fast: {
    label: "Weeknight Fast",
    description: "Push strongly toward quick, straightforward cooking.",
    signals: { speed: 0.08, simplicity: 0.08 }
  }
};

// Backward-compatible alias for code or exported backups created before V0.9.2.
export const PRESETS = PRIORITY_PACKS;

const LEGACY_PRESET_MAP = {
  budget_beginner: "budget_easy",
  healthy_convenience: "healthy_convenience",
  premium_healthy: "premium_healthy",
  meal_prep_worker: "meal_prep",
  culinary_explorer: "culinary_explorer",
  advanced_cook: "advanced_technique",
  high_protein_convenience: "high_protein_convenience",
  mediterranean_everyday: "healthy_convenience",
  vegetarian_explorer: "culinary_explorer"
};

export const DEFAULT_PROFILE = {
  name: "My cooking profile",
  preset: null,
  priorityPacks: [{ id: "healthy_convenience", scope: "all" }],
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

const clamp = value => Math.max(1, Math.min(4, Number(value) || 1));

function normalizePriorityPacks(value, legacyPreset = null) {
  const source = Array.isArray(value) ? value : [];
  const normalized = [];
  const seen = new Set();
  for (const item of source) {
    const id = typeof item === "string" ? item : item?.id;
    const scope = typeof item === "object" && PACK_SCOPES.includes(item?.scope) ? item.scope : "all";
    if (!PRIORITY_PACKS[id] || seen.has(id)) continue;
    normalized.push({ id, scope });
    seen.add(id);
    if (normalized.length >= MAX_PRIORITY_PACKS) break;
  }
  if (!normalized.length && legacyPreset) {
    const mapped = LEGACY_PRESET_MAP[legacyPreset] || legacyPreset;
    if (PRIORITY_PACKS[mapped]) normalized.push({ id: mapped, scope: "all" });
  }
  return normalized;
}

export function applyPreset(profile, presetId, scope = "all") {
  const mapped = LEGACY_PRESET_MAP[presetId] || presetId;
  if (!PRIORITY_PACKS[mapped]) return normalizeProfile(profile);
  return normalizeProfile({ ...profile, preset: null, priorityPacks: [{ id: mapped, scope }] });
}

export function activePriorityPacks(rawProfile, mealType = null) {
  const profile = normalizeProfile(rawProfile);
  return profile.priorityPacks
    .filter(item => item.scope === "all" || (mealType && item.scope === mealType))
    .map(item => ({ ...item, ...PRIORITY_PACKS[item.id] }));
}

export function normalizeProfile(input = {}) {
  const hasPriorityPackInput = Object.prototype.hasOwnProperty.call(input || {}, "priorityPacks");
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
  profile.cuisinePreferences = [...new Set(Array.isArray(profile.cuisinePreferences) ? profile.cuisinePreferences.filter(value => CUISINES.includes(value) && value !== "Any") : [])];
  profile.allergens = [...new Set(Array.isArray(profile.allergens) ? profile.allergens.filter(Boolean) : [])];
  for (const key of ["excludedIngredientIds", "unavailableIngredientIds", "currentPantryIngredientIds", "pantryStapleIds"]) {
    profile[key] = [...new Set(Array.isArray(profile[key]) ? profile[key].filter(Boolean) : [])];
  }
  const packSource = hasPriorityPackInput ? input.priorityPacks : (input.preset ? [] : profile.priorityPacks);
  profile.priorityPacks = normalizePriorityPacks(packSource, hasPriorityPackInput ? null : input.preset);
  profile.preset = null;
  return profile;
}
