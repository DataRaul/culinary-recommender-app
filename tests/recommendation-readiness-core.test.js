import test from "node:test";
import assert from "node:assert/strict";

import {
  inspectRecommendationRecord,
  inspectUnknownNutritionEvaluation,
  nutritionSignalState
} from "../scripts/recommendation-readiness-core.mjs";

const baseRecipe = {
  id: "fixture",
  provenance: { sourceType: "PROJECT_AUTHORED" },
  culinary: { cuisine: "Test", mealTypes: ["lunch"], difficulty: 2 },
  time: { totalMinutes: 20 },
  ingredients: [{ canonicalIngredientId: "onion", quantity: 1, unit: "piece" }],
  instructions: [{ text: "Cook." }],
  nutrition: { perServing: { energyKcal: 100, proteinG: 5, carbohydrateG: 10, fatG: 4, fibreG: 2 } },
  dietaryTags: ["vegetarian"],
  allergySafety: { declaredAllergens: [] },
  economics: { costTier: 1 },
  convenience: { mealPrepSuitability: 1, batchSuitability: 1, leftoverSuitability: 1, portability: 1 },
  discovery: { novelty: 1, techniqueLearningValue: 1 }
};

test("readiness record requires canonical ingredient and hard metadata", () => {
  const row = inspectRecommendationRecord(baseRecipe);
  assert.equal(row.recommendationEligibleState, true);
  assert.equal(row.hardMetadataReady, true);
  const broken = inspectRecommendationRecord({ ...baseRecipe, ingredients: [{ canonicalIngredientId: "not_in_ontology" }] });
  assert.equal(broken.ingredientIdentityReady, false);
  assert.equal(broken.hardMetadataReady, false);
});

test("nutrition signal state distinguishes unknown from numeric zero", () => {
  const state = nutritionSignalState({
    nutrition: { perServing: { energyKcal: null, proteinG: null, carbohydrateG: null, fatG: null, fibreG: null } }
  });
  assert.equal(state.complete, false);
  assert.equal(state.known.length, 0);
  assert.equal(state.unknown.length, 5);
});

test("unknown recommendation nutrition is unsafe when evaluator numerically coerces it to zero", () => {
  const record = inspectRecommendationRecord({
    ...baseRecipe,
    nutrition: { perServing: { energyKcal: null, proteinG: null, carbohydrateG: null, fatG: null, fibreG: null } }
  });
  const finding = inspectUnknownNutritionEvaluation(record, {
    components: { nutrition: 0, protein: 0 },
    evidence: { unavailableSoftSignals: [] }
  });
  assert.equal(finding.applicable, true);
  assert.equal(finding.zeroCoercion, true);
  assert.equal(finding.safe, false);
});

test("unknown recommendation nutrition is safe when unavailable signals remain explicit and non-numeric", () => {
  const record = inspectRecommendationRecord({
    ...baseRecipe,
    nutrition: { perServing: { energyKcal: null, proteinG: null, carbohydrateG: null, fatG: null, fibreG: null } }
  });
  const finding = inspectUnknownNutritionEvaluation(record, {
    components: { nutrition: null, protein: null },
    evidence: { unavailableSoftSignals: ["nutrition", "protein"] }
  });
  assert.equal(finding.applicable, true);
  assert.equal(finding.zeroCoercion, false);
  assert.equal(finding.missingSignalsExplicit, true);
  assert.equal(finding.safe, true);
});
