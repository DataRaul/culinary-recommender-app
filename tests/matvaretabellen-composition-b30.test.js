import test from "node:test";
import assert from "node:assert/strict";
import {
  MATVARETABELLEN_COMPOSITION_COMPLETIONS_B30,
  MATVARETABELLEN_COMPOSITION_SOURCE_B30,
  matvaretabellenCompositionB30CompletionForIngredient
} from "../src/data/matvaretabellen-composition-b30.js";
import { AUTHORED_RECIPES } from "../src/data/corpus-v1.js";
import { publicNutritionSource } from "../src/domain/nutrition.js";
import { buildNutritionCoverageAudit } from "../src/domain/nutrition-coverage-audit.js";
import { CIQUAL_CANONICAL_DENSITIES } from "../src/domain/nutrition-source-policy.js";
import {
  EUROPEAN_PRIMARY_DENSITIES_V1,
  europeanPrimaryPolicyCoverage,
  selectEuropeanPrimaryNutrient
} from "../src/domain/nutrition-source-policy-runtime.js";

test("B30 source is explicit static Matvaretabellen exact field-completion evidence", () => {
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B30.id, "matvaretabellen-2026-composition-b30");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B30.authority, "Norwegian Food Safety Authority (Mattilsynet)");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B30.releaseDate, "2026-01");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B30.evidenceTranche, "B30");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B30.runtimeFetch, false);
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B30.state, "BOUNDED_STATIC_REVIEWED_FIELD_COMPLETION_EVIDENCE");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B30.runtimePolicy, "ELIGIBLE_ONLY_WHEN_EXISTING_REVIEWED_PRIMARY_FIELD_IS_MISSING");
  assert.match(MATVARETABELLEN_COMPOSITION_SOURCE_B30.license, /NLOD 2\.0/);
});

test("B30 admits exactly official food 10.126 soy sauce and exposes only fat as completion-eligible", () => {
  assert.deepEqual(Object.keys(MATVARETABELLEN_COMPOSITION_COMPLETIONS_B30), ["soy_sauce"]);
  const soy = matvaretabellenCompositionB30CompletionForIngredient("soy_sauce");
  assert.equal(soy.foodId, "10.126");
  assert.equal(soy.foodName, "Soy sauce");
  assert.equal(soy.scientificName, "Glycine max (L.) Merr.");
  assert.equal(soy.foodEx2, "Soy sauce (A044R)");
  assert.equal(soy.foodForm, "FERMENTED_WHEAT_CONTAINING_LIQUID_SOY_SAUCE");
  assert.equal(soy.matchConfidence, "high");
  assert.deepEqual(soy.eligibleCompletionFields, ["fatG"]);
  assert.equal(soy.per100g.fatG, 0);
  assert.equal(soy.fieldEvidence.fatG.sourceCode, "60a");
  assert.match(soy.fieldEvidence.fatG.valueType, /Below limit/i);
});

test("B30 fills the Ciqual B5 soy-sauce fat gap without displacing populated primary fields", () => {
  const ciqual = CIQUAL_CANONICAL_DENSITIES.soy_sauce;
  assert.equal(ciqual.alimCode, "11104");
  assert.equal(ciqual.nameEn, "Soy sauce, prepacked");
  assert.equal(ciqual.evidenceTranche, "B5");
  assert.equal(ciqual.per100g.energyEu1169Kcal, 39.9);
  assert.equal(ciqual.per100g.proteinJonesG, 7.25);
  assert.equal(ciqual.per100g.carbohydrateAvailableG, 1.72);
  assert.equal(ciqual.per100g.fatG, null);
  assert.equal(ciqual.per100g.fibreG, 0.9);

  const expected = {
    energyKcal: ["ciqual", "anses-ciqual-2025-b4", 39.9, "B5"],
    proteinG: ["ciqual", "anses-ciqual-2025-b4", 7.25, "B5"],
    carbohydrateG: ["ciqual", "anses-ciqual-2025-b4", 1.72, "B5"],
    fatG: ["matvaretabellen", MATVARETABELLEN_COMPOSITION_SOURCE_B30.id, 0, "B30"],
    fibreG: ["ciqual", "anses-ciqual-2025-b4", 0.9, "B5"]
  };
  for (const [field, expectedSelection] of Object.entries(expected)) {
    const selection = selectEuropeanPrimaryNutrient("soy_sauce", field);
    assert.deepEqual(
      [selection.source, selection.sourceId, selection.value, selection.evidenceTranche],
      expectedSelection,
      field
    );
  }
  assert.equal(selectEuropeanPrimaryNutrient("soy_sauce", "fatG").selectionReason, "EUROPEAN_EXACT_FIELD_COMPLETION");
  assert.deepEqual(selectEuropeanPrimaryNutrient("soy_sauce", "fatG").sourceCodes, ["60a"]);
  assert.equal(selectEuropeanPrimaryNutrient("soy_sauce", "carbohydrateG").semantic, "AVAILABLE_CARBOHYDRATE_CIQUAL_CHOAVL");
});

test("runtime density reconstructs soy sauce with B30 fat and preserves all other Ciqual provenance", () => {
  const density = EUROPEAN_PRIMARY_DENSITIES_V1.soy_sauce;
  assert.deepEqual(density.per100g, {
    energyKcal: 39.9,
    proteinG: 7.25,
    carbohydrateG: 1.72,
    fatG: 0,
    fibreG: 0.9
  });
  assert.equal(density.provenanceByNutrient.fatG.sourceId, MATVARETABELLEN_COMPOSITION_SOURCE_B30.id);
  assert.equal(density.provenanceByNutrient.fatG.selectionReason, "EUROPEAN_EXACT_FIELD_COMPLETION");
  for (const field of ["energyKcal", "proteinG", "carbohydrateG", "fibreG"]) {
    assert.equal(density.provenanceByNutrient[field].source, "ciqual", field);
    assert.equal(density.provenanceByNutrient[field].evidenceTranche, "B5", field);
  }
});

test("B30 coverage counts one Matvaretabellen completion without double-counting the existing soy-sauce identity", () => {
  const coverage = europeanPrimaryPolicyCoverage(["soy_sauce"]);
  assert.equal(coverage.evidenceIngredientCount, 1);
  assert.equal(coverage.matvaretabellenB30SelectedCount, 1);
  assert.equal(coverage.matvaretabellenSelectedCount, 1);
  assert.equal(coverage.ciqualSelectedCount, 4);
  const b30 = coverage.selections.filter(selection => selection.evidenceTranche === "B30");
  assert.deepEqual(b30.map(selection => [selection.ingredientId, selection.nutrient]), [["soy_sauce", "fatG"]]);
});

test("B30 removes soy-sauce fat gaps across authored recipes while preserving unrelated blockers", () => {
  const soyRecipeIds = AUTHORED_RECIPES
    .filter(recipe => recipe.ingredients.some(ingredient => ingredient.canonicalIngredientId === "soy_sauce"))
    .map(recipe => recipe.id);
  assert.ok(soyRecipeIds.length > 0);
  const audit = buildNutritionCoverageAudit(AUTHORED_RECIPES, publicNutritionSource);
  for (const recipeId of soyRecipeIds) {
    const detail = audit.recipeDetails.find(row => row.recipeId === recipeId);
    assert.ok(detail, recipeId);
    assert.equal(
      detail.nutrientFieldGaps.some(gap => gap.ingredientId === "soy_sauce" && gap.nutrient === "fatG"),
      false,
      recipeId
    );
  }
  assert.ok(audit.blockerCounts.ambiguous_portion_unit > 0);
  assert.ok(audit.blockerCounts.missing_density > 0);
  assert.ok(audit.blockerCounts.unsupported_quantity_unit > 0);
});

test("B30 exact soy-sauce completion does not bleed into variants or authorize quantity evidence", () => {
  for (const unsupported of ["sweet_soy_sauce", "tamari", "gluten_free_soy_sauce", "soybean_paste", "miso"]) {
    assert.equal(matvaretabellenCompositionB30CompletionForIngredient(unsupported), null, unsupported);
    const selection = selectEuropeanPrimaryNutrient(unsupported, "fatG");
    assert.notEqual(selection?.sourceId, MATVARETABELLEN_COMPOSITION_SOURCE_B30.id, unsupported);
  }
  const soy = matvaretabellenCompositionB30CompletionForIngredient("soy_sauce");
  assert.equal(soy.gramsPerUnit, undefined);
  assert.equal(soy.units, undefined);
  assert.equal(soy.sourcePortionId, undefined);
  assert.equal(soy.ediblePartPercent, undefined);
  assert.equal(soy.cookedYieldFactor, undefined);
});
