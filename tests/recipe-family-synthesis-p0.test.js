import test from "node:test";
import assert from "node:assert/strict";
import { synthesizeRecipeFamilyP0 } from "../src/domain/recipe-family-synthesis-p0.js";

const source = (id, role, group) => ({
  publisher: id,
  url: `https://example.test/${id}`,
  accessedAt: "2026-09-17",
  independenceGroup: group,
  publisherLedgerKey: id,
  acquisitionMode: "MANUAL_REVIEW",
  lawfulAccess: "YES",
  termsState: "NO_RELEVANT_RESTRICTION_FOUND",
  termsCheckedAt: "2026-09-17",
  tdmReservation: "NOT_APPLICABLE",
  reuseBasis: "STANDARD_COPYRIGHT",
  databaseExtractionRisk: "LOW",
  cumulativeExtractionRisk: "LOW",
  role,
  sourceExpressionPersisted: false,
  rawExpressionRetention: "NONE",
  publicAttributionRequirement: "NOT_REQUIRED",
  publicAttributionState: "NOT_APPLICABLE"
});

const ingredient = (ingredientId, quantity, unit, role = "STRUCTURAL") => ({ ingredientId, role, quantity, unit });
const observation = (id, role, group, ingredients, techniques, extra = {}) => ({
  observationId: id,
  familyCandidate: "carbonara",
  source: source(id, role, group),
  servings: 2,
  ingredients,
  techniques,
  times: { totalMinutes: 25 },
  equipment: ["pot", "pan"],
  ...extra
});

const definition = {
  familyId: "carbonara",
  principalIngredientId: "pasta",
  independentPracticalMinimum: 3,
  requiredIngredientIds: ["pasta", "egg", "hard_cheese", "cured_pork"],
  referenceProfile: {
    identityClaims: ["pasta bound with egg/cheese emulsion and cured pork"],
    requiredIngredientRoles: ["starch", "egg", "cheese", "pork"],
    requiredTechniques: ["cook_pasta", "render_pork", "off_heat_emulsification"]
  },
  allowedAdaptations: [],
  projection: {
    title: "Project Carbonara Candidate",
    culinary: {
      cuisine: "Italian",
      region: "Lazio",
      mealTypes: ["lunch", "dinner"],
      techniques: ["cook_pasta", "render_pork", "off_heat_emulsification"],
      difficulty: 2,
      techniqueComplexity: 2,
      failureRisk: "medium"
    },
    time: { prepMinutes: 10, activeMinutes: 20, passiveMinutes: 0, totalMinutes: 30 },
    instructions: [
      "Cook the pasta until firm and reserve some cooking water.",
      "Render the cured pork until its fat is released.",
      "Away from direct heat, combine pasta with the egg-cheese mixture and loosen gradually until glossy."
    ],
    equipment: ["hob", "pot", "pan", "bowl"],
    nutrition: { energyKcal: 600, proteinG: 25, carbohydrateG: 70, fatG: 25, fibreG: 3 },
    dietaryTags: ["unrestricted"],
    allergySafety: { declaredAllergens: ["egg", "milk", "gluten"], confidence: "ingredient-list-derived" },
    costTier: 2,
    convenience: { mealPrepSuitability: 1, batchSuitability: 1, freezerSuitability: 1, leftoverSuitability: 1, portability: 1 },
    discovery: { flavourProfile: ["savory"], spiceLevel: 1, familiarity: 4, novelty: 1, techniqueLearningValue: 3 },
    mainProtein: "egg_pork"
  }
};

const observations = [
  observation("ref", "REFERENCE_EVIDENCE", "ref", [
    ingredient("pasta", 200, "g"), ingredient("egg", 2, "piece"), ingredient("hard_cheese", 60, "g"), ingredient("cured_pork", 80, "g")
  ], ["cook_pasta", "render_pork", "off_heat_emulsification"]),
  observation("p1", "STRUCTURE_EVIDENCE", "g1", [
    ingredient("pasta", 200, "g"), ingredient("egg", 2, "piece"), ingredient("hard_cheese", 50, "g"), ingredient("cured_pork", 70, "g")
  ], ["cook_pasta", "render_pork", "off_heat_emulsification"]),
  observation("p2", "STRUCTURE_EVIDENCE", "g2", [
    ingredient("pasta", 220, "g"), ingredient("egg", 3, "piece"), ingredient("hard_cheese", 65, "g"), ingredient("cured_pork", 90, "g")
  ], ["cook_pasta", "render_pork", "off_heat_emulsification"], { variantKey: "whole_egg_forward" }),
  observation("p3", "STRUCTURE_EVIDENCE", "g3", [
    ingredient("pasta", 180, "g"), ingredient("egg", 2, "piece"), ingredient("hard_cheese", 55, "g"), ingredient("cured_pork", 75, "g")
  ], ["cook_pasta", "render_pork", "off_heat_emulsification"], { variantKey: "whole_egg_forward" }),
  observation("dup", "STRUCTURE_EVIDENCE", "g3", [
    ingredient("pasta", 400, "g"), ingredient("egg", 6, "piece"), ingredient("hard_cheese", 150, "g"), ingredient("cured_pork", 160, "g")
  ], ["cook_pasta", "render_pork", "off_heat_emulsification"])
];

test("keeps reference identity separate from observed prevalence and produces an app-owned candidate", () => {
  const result = synthesizeRecipeFamilyP0(observations, definition);
  assert.equal(result.independentPracticalObservationCount, 3);
  assert.deepEqual(result.referenceProfile.evidenceIds, ["ref"]);
  assert.equal(result.referenceProfile.identityClaims.length, 1);
  assert.equal(result.appAuthoringGate.pass, true);
  assert.equal(result.variants[0].state, "OBSERVED_VARIANT");
  assert.equal(result.candidateRecipe.governance.publicActivationAuthorized, false);
  assert.equal(result.provenance.protectedSourceExpressionPersisted, false);
});

test("does not turn a frequent observed ingredient into a reference identity claim", () => {
  const withCream = observations.map((item, index) => index > 0
    ? { ...item, ingredients: [...item.ingredients, ingredient("cream", 30, "g", "OPTIONAL")] }
    : item);
  const result = synthesizeRecipeFamilyP0(withCream, definition);
  const cream = result.observedProfile.ingredientSignals.find(item => item.ingredientId === "cream");
  assert.equal(cream.supportBand, "CORE_SIGNAL");
  assert.equal(result.referenceProfile.identityClaims.some(claim => claim.includes("cream")), false);
});
