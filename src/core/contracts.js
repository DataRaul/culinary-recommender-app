/**
 * Stable runtime boundaries. UI code depends on these behaviours rather than
 * provisional scoring/data implementations so a future public-safe Brain export
 * can replace policy components without rewriting the interface.
 */
export class RecipeSource {
  list() { throw new Error("RecipeSource.list not implemented"); }
  getById(_id) { throw new Error("RecipeSource.getById not implemented"); }
}

export class NutritionSource {
  estimate(_recipe) { throw new Error("NutritionSource.estimate not implemented"); }
}

export class IngredientNormalizer {
  normalize(_value) { throw new Error("IngredientNormalizer.normalize not implemented"); }
}

export class RecipeEvaluator {
  evaluate(_recipe, _profile, _context) { throw new Error("RecipeEvaluator.evaluate not implemented"); }
}

export class RecommendationPolicy {
  rank(_recipes, _profile, _context) { throw new Error("RecommendationPolicy.rank not implemented"); }
}

export class PortfolioPlanner {
  plan(_slots, _ranked, _profile, _context) { throw new Error("PortfolioPlanner.plan not implemented"); }
}

export class SubstitutionEngine {
  suggest(_ingredientId, _context) { throw new Error("SubstitutionEngine.suggest not implemented"); }
}

export class CostEstimator {
  estimate(_recipes) { throw new Error("CostEstimator.estimate not implemented"); }
}

export class PantryStore {
  load() { throw new Error("PantryStore.load not implemented"); }
  save(_pantry) { throw new Error("PantryStore.save not implemented"); }
}

export class PreferenceStore {
  load() { throw new Error("PreferenceStore.load not implemented"); }
  save(_preferences) { throw new Error("PreferenceStore.save not implemented"); }
}
