import test from "node:test";
import assert from "node:assert/strict";
import {
  USDA_NFCS_MISO_PORTION_EVIDENCE_B38,
  USDA_NFCS_MISO_PORTION_SOURCE_B38,
  usdaNfcsMisoPortionConversionB38
} from "../src/data/usda-nfcs-miso-portions-b38.js";
import { AUTHORED_RECIPES } from "../src/data/corpus-v1.js";
import { calculatePerServingFromDensities, publicNutritionSource } from "../src/domain/nutrition.js";
import { EUROPEAN_PRIMARY_DENSITIES_V1 } from "../src/domain/nutrition-source-policy-runtime.js";

test("B38 is a separate bounded historical USDA portion-only source", () => {
  assert.equal(USDA_NFCS_MISO_PORTION_SOURCE_B38.id, "usda-nfcs-1977-78-miso-portions-b38");
  assert.equal(USDA_NFCS_MISO_PORTION_SOURCE_B38.authority, "U.S. Department of Agriculture");
  assert.equal(USDA_NFCS_MISO_PORTION_SOURCE_B38.dataset, "Nationwide Food Consumption Survey 1977-78");
  assert.equal(USDA_NFCS_MISO_PORTION_SOURCE_B38.reportNumber, "CFE Admin. Report No. 352");
  assert.equal(USDA_NFCS_MISO_PORTION_SOURCE_B38.evidenceTranche, "B38");
  assert.equal(USDA_NFCS_MISO_PORTION_SOURCE_B38.role, "PORTION_EVIDENCE_ONLY");
  assert.equal(USDA_NFCS_MISO_PORTION_SOURCE_B38.compositionUse, "PROHIBITED_IN_THIS_TRANCHE");
  assert.equal(USDA_NFCS_MISO_PORTION_SOURCE_B38.runtimeFetch, false);
});

test("B38 preserves the exact USDA miso food code and published tablespoon mass", () => {
  const record = USDA_NFCS_MISO_PORTION_EVIDENCE_B38.miso;
  assert.equal(record.sourceFoodDescription, "Soybean product: Miso");
  assert.equal(record.sourceFoodCode, "414-2011");
  assert.equal(record.sourceMeasureAmount, 1);
  assert.equal(record.sourceMeasureUnit, "tablespoon");
  assert.equal(record.sourceMeasureGramWeight, 17);
  assert.equal(record.gramsPerUnit, 17);
  assert.equal(record.ediblePortionBasis, true);
  assert.equal(record.matchConfidence, "medium");
});

test("B38 accepts only canonical miso tbsp and does not bleed into sauce, subtype or inferred units", () => {
  assert.equal(usdaNfcsMisoPortionConversionB38("miso", "tbsp")?.gramsPerUnit, 17);
  for (const unsupportedUnit of ["tsp", "tablespoon", "cup", "piece", "g"]) {
    assert.equal(usdaNfcsMisoPortionConversionB38("miso", unsupportedUnit), null, unsupportedUnit);
  }
  for (const unsupportedIdentity of ["miso_sauce", "white_miso", "red_miso", "soy_sauce", "tempeh"]) {
    assert.equal(usdaNfcsMisoPortionConversionB38(unsupportedIdentity, "tbsp"), null, unsupportedIdentity);
  }
});

test("runtime resolves exact miso tablespoons with B38 provenance while B35 remains composition authority", () => {
  const result = calculatePerServingFromDensities({
    ingredients: [{ canonicalIngredientId: "miso", quantity: 1.5, unit: "tbsp" }],
    serving: { servings: 1 }
  }, EUROPEAN_PRIMARY_DENSITIES_V1);
  assert.equal(result.complete, true);
  assert.equal(result.used[0].grams, 25.5);
  assert.equal(result.used[0].quantityEvidence.sourceId, USDA_NFCS_MISO_PORTION_SOURCE_B38.id);
  assert.equal(result.used[0].quantityEvidence.evidenceTranche, "B38");
  assert.equal(result.used[0].quantityEvidence.gramsPerUnit, 17);
  assert.equal(result.used[0].quantityEvidence.sourceFoodCode, "414-2011");
  assert.equal(result.used[0].provenanceByNutrient.proteinG.evidenceTranche, "B35");
});

test("B38 clears only the miso quantity blocker from the three authored tablespoon uses", () => {
  const uses = AUTHORED_RECIPES.filter(recipe => recipe.ingredients.some(item => item.canonicalIngredientId === "miso"));
  assert.equal(uses.length, 3);
  for (const recipe of uses) {
    const miso = recipe.ingredients.find(item => item.canonicalIngredientId === "miso");
    assert.equal(miso.quantity, 1.5, recipe.id);
    assert.equal(miso.unit, "tbsp", recipe.id);
    const estimate = publicNutritionSource.estimate(recipe);
    const calculation = estimate.evidence.europeanStaticCalculation;
    assert.equal(calculation.skipped.some(item => item.ingredientId === "miso"), false, recipe.id);
    const used = calculation.used.find(item => item.ingredientId === "miso");
    assert.equal(used.grams, 25.5, recipe.id);
    assert.equal(used.quantityEvidence.evidenceTranche, "B38", recipe.id);
  }
});

test("B38 does not manufacture teaspoon, cup or miso-sauce conversion", () => {
  for (const [ingredientId, unit] of [["miso", "tsp"], ["miso", "cup"], ["miso_sauce", "tbsp"]]) {
    const result = calculatePerServingFromDensities({
      ingredients: [{ canonicalIngredientId: ingredientId, quantity: 1, unit }],
      serving: { servings: 1 }
    }, {
      [ingredientId]: { energyKcal: 1, proteinG: 1, carbohydrateG: 1, fatG: 1, fibreG: 1 }
    });
    assert.equal(result.complete, false, `${ingredientId}|${unit}`);
    assert.equal(result.skipped[0].reason, "unsupported_quantity_unit", `${ingredientId}|${unit}`);
  }
});
