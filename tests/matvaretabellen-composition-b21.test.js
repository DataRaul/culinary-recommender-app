import test from "node:test";
import assert from "node:assert/strict";
import {
  MATVARETABELLEN_COMPOSITION_COMPLETIONS_B21,
  MATVARETABELLEN_COMPOSITION_SOURCE_B21,
  matvaretabellenCompositionB21CompletionForIngredient
} from "../src/data/matvaretabellen-composition-b21.js";
import { AUTHORED_RECIPES } from "../src/data/corpus-v1.js";
import { publicNutritionSource } from "../src/domain/nutrition.js";
import { buildNutritionCoverageAudit } from "../src/domain/nutrition-coverage-audit.js";
import {
  CIQUAL_CANONICAL_DENSITIES,
  europeanPrimaryPolicyCoverage,
  selectEuropeanPrimaryNutrient
} from "../src/domain/nutrition-source-policy.js";

test("B21 source is explicit static Matvaretabellen field-completion evidence", () => {
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B21.id, "matvaretabellen-2026-composition-b21");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B21.authority, "Norwegian Food Safety Authority (Mattilsynet)");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B21.evidenceTranche, "B21");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B21.runtimeFetch, false);
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B21.state, "BOUNDED_STATIC_REVIEWED_FIELD_COMPLETION_EVIDENCE");
  assert.equal(MATVARETABELLEN_COMPOSITION_SOURCE_B21.runtimePolicy, "ELIGIBLE_ONLY_WHEN_EXISTING_REVIEWED_PRIMARY_FIELD_IS_MISSING");
  assert.match(MATVARETABELLEN_COMPOSITION_SOURCE_B21.license, /NLOD 2\.0/);
});

test("B21 admits exactly farmed raw Atlantic salmon food 04.220 as the B4 salmon completion identity", () => {
  assert.deepEqual(Object.keys(MATVARETABELLEN_COMPOSITION_COMPLETIONS_B21), ["salmon"]);
  const salmon = matvaretabellenCompositionB21CompletionForIngredient("salmon");
  assert.equal(salmon.foodId, "04.220");
  assert.equal(salmon.foodName, "Salmon, farmed, raw");
  assert.equal(salmon.scientificName, "Salmo salar Linnaeus, 1758");
  assert.match(salmon.foodEx2, /Atlantic salmon \(A028P\)/);
  assert.match(salmon.foodEx2, /farmed \/ cultivated \/ aquaculture \(A07RV\)/);
  assert.equal(salmon.foodForm, "EXACT_FARMED_RAW_ATLANTIC_SALMON_EDIBLE_MEAT");
  assert.deepEqual(salmon.per100g, {
    energyKcal: 223,
    proteinG: 19.9,
    carbohydrateG: 0,
    fatG: 15.9,
    fibreG: 0
  });
  assert.equal(salmon.fieldEvidence.carbohydrateG.sourceCode, "MI0181");
  assert.equal(salmon.fieldEvidence.fibreG.sourceCode, "50");
  assert.equal(salmon.fieldEvidence.fibreG.valueType, "Logical zero");

  const ciqual = CIQUAL_CANONICAL_DENSITIES.salmon;
  assert.equal(ciqual.alimCode, "26036");
  assert.equal(ciqual.nameEn, "Salmon, raw, farmed");
  assert.equal(ciqual.scientificName, "Salmo salar (Linnaeus, 1758)");
  assert.equal(ciqual.per100g.carbohydrateAvailableG, null);
  assert.equal(ciqual.per100g.fibreG, null);
});

test("B21 fills only the two missing salmon fields and cannot displace populated Ciqual B4 fields", () => {
  const expected = {
    energyKcal: ["ciqual", "anses-ciqual-2025-b4", 193, "B4", "ONLY_REVIEWED_SOURCE_AVAILABLE"],
    proteinG: ["ciqual", "anses-ciqual-2025-b4", 20.5, "B4", "ONLY_REVIEWED_SOURCE_AVAILABLE"],
    carbohydrateG: ["matvaretabellen", MATVARETABELLEN_COMPOSITION_SOURCE_B21.id, 0, "B21", "EUROPEAN_EXACT_FIELD_COMPLETION"],
    fatG: ["ciqual", "anses-ciqual-2025-b4", 12.4, "B4", "ONLY_REVIEWED_SOURCE_AVAILABLE"],
    fibreG: ["matvaretabellen", MATVARETABELLEN_COMPOSITION_SOURCE_B21.id, 0, "B21", "EUROPEAN_EXACT_FIELD_COMPLETION"]
  };
  for (const [field, expectedSelection] of Object.entries(expected)) {
    const selection = selectEuropeanPrimaryNutrient("salmon", field);
    assert.deepEqual(
      [selection.source, selection.sourceId, selection.value, selection.evidenceTranche, selection.selectionReason],
      expectedSelection,
      field
    );
  }
  assert.equal(selectEuropeanPrimaryNutrient("salmon", "carbohydrateG").semantic, "AVAILABLE_CARBOHYDRATE_MATVARETABELLEN_CHO");
  assert.deepEqual(selectEuropeanPrimaryNutrient("salmon", "carbohydrateG").sourceCodes, ["MI0181"]);
  assert.deepEqual(selectEuropeanPrimaryNutrient("salmon", "fibreG").sourceCodes, ["50"]);
  const coverage = europeanPrimaryPolicyCoverage(["salmon"]);
  assert.equal(coverage.matvaretabellenB21SelectedCount, 2);
  assert.equal(coverage.matvaretabellenSelectedCount, 2);
  assert.equal(coverage.ciqualSelectedCount, 3);
});

test("B21 exact farmed-raw completion does not authorize neighboring salmon forms or quantity evidence", () => {
  for (const unsupported of [
    "salmon_wild",
    "salmon_ocean",
    "salmon_cooked",
    "salmon_smoked",
    "salmon_salted",
    "salmon_slices",
    "trout"
  ]) {
    assert.equal(matvaretabellenCompositionB21CompletionForIngredient(unsupported), null, unsupported);
    const selection = selectEuropeanPrimaryNutrient(unsupported, "fibreG");
    assert.notEqual(selection?.sourceId, MATVARETABELLEN_COMPOSITION_SOURCE_B21.id, unsupported);
  }
  const salmon = matvaretabellenCompositionB21CompletionForIngredient("salmon");
  assert.equal(salmon.gramsPerUnit, undefined);
  assert.equal(salmon.units, undefined);
  assert.equal(salmon.sourcePortionId, undefined);
  assert.equal(salmon.ediblePartPercent, undefined);
});

test("B21 removes eight salmon field-gap events while preserving all independent blockers and semantic gates", () => {
  const audit = buildNutritionCoverageAudit(AUTHORED_RECIPES, publicNutritionSource);
  assert.equal(audit.authoritativeRecipeCount, 16);
  assert.equal(audit.estimateRecipeCount, 60);
  assert.deepEqual(audit.blockerCounts, {
    ambiguous_portion_unit: 20,
    missing_density: 91,
    unsupported_quantity_unit: 7
  });
  assert.deepEqual(audit.missingNutrientFieldCounts, {
    carbohydrateG: 5,
    energyKcal: 5,
    fatG: 18,
    fibreG: 7
  });
  assert.deepEqual(audit.semanticIssueCounts, {
    mixed_incompatible_carbohydrate_semantics: 16
  });

  for (const recipe of AUTHORED_RECIPES.filter(recipe => recipe.ingredients.some(i => i.canonicalIngredientId === "salmon"))) {
    const detail = audit.recipeDetails.find(row => row.recipeId === recipe.id);
    assert.equal(detail.nutrientFieldGaps.some(gap => gap.ingredientId === "salmon"), false, recipe.id);
  }

  const med = audit.recipeDetails.find(row => row.recipeId === "med_salmon_barley_spinach");
  assert.deepEqual(med.blockers.map(blocker => [blocker.ingredientId, blocker.reason]), [["barley", "missing_density"]]);
  const spanish = audit.recipeDetails.find(row => row.recipeId === "spanish_salmon_green_beans_potato");
  assert.deepEqual(spanish.blockers.map(blocker => [blocker.ingredientId, blocker.reason]), [["smoked_paprika", "missing_density"]]);
  assert.equal(spanish.semanticIssues.some(issue => issue.issue === "mixed_incompatible_carbohydrate_semantics"), true);
});
