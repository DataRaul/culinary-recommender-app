import test from "node:test";
import assert from "node:assert/strict";

import {
  STEP8G_CC0_CANDIDATE_TERMINAL,
  measureStep8GCc0MarkdownMarginalValue,
  parseCc0MarkdownRecipe
} from "../scripts/corpus-scale-step8g-cc0-core.mjs";

test("parses CC0 markdown recipe structure without promoting source metadata", () => {
  const parsed = parseCc0MarkdownRecipe(`# Test Dish\n\n## Ingredients\n\n- 200g potatoes\n- 1 onion\n\n## Directions\n\n1. Cook potatoes.\n2. Add onion.\n\n## Contribution\n\n- Example.\n\n;tags: test potato\n`, { fileName: "test-dish.md" });

  assert.equal(parsed.title, "Test Dish");
  assert.deepEqual(parsed.ingredients, ["potatoes", "onion"]);
  assert.deepEqual(parsed.directions, ["Cook potatoes.", "Add onion."]);
  assert.deepEqual(parsed.tags, ["test", "potato"]);
  assert.deepEqual(parsed.quality, {
    hasTitle: true,
    hasIngredients: true,
    hasDirections: true,
    hasTags: true
  });
});

test("Step 8G CC0 measurement uses public + UniTools + ForkRecipe as the baseline", () => {
  const candidateRecipes = Array.from({ length: 10 }, (_, index) => ({
    title: `Candidate ${index}`,
    ingredients: [index === 0 ? "salt" : `novel ingredient ${index}`],
    directions: ["Cook."],
    tags: ["candidate"],
    quality: { hasTitle: true, hasIngredients: true, hasDirections: true, hasTags: true }
  }));
  const publicRecipes = [{ title: "Public Dish", ingredients: [{ label: "salt" }] }];
  const unitoolsRecipes = [{ name: { en: "Unitools Dish" }, ingredients: [{ name: { en: "water" } }] }];
  const forkRecipes = [{ title: "Fork Dish", ingredients: [{ name: "olive oil" }] }];

  const result = measureStep8GCc0MarkdownMarginalValue({
    candidateRecipes,
    publicRecipes,
    unitoolsRecipes,
    forkRecipes,
    rightsAuditPass: true,
    sourceQualityPass: true
  });

  assert.equal(result.pass, true);
  assert.equal(result.terminal, STEP8G_CC0_CANDIDATE_TERMINAL);
  assert.equal(result.baseline.combinedRecipeCount, 3);
  assert.equal(result.candidate.sourceRecipeCount, 10);
  assert.equal(result.boundaries.liveD1WritesAuthorized, false);
  assert.equal(result.boundaries.publicRuntimeChangeAuthorized, false);
  assert.equal(result.boundaries.thirdShardAuthorized, false);
  assert.equal(result.boundaries.billingExpansionAuthorized, false);
});

test("Step 8G CC0 measurement fails closed when rights evidence is not passed", () => {
  const candidateRecipes = [{
    title: "Novel Dish",
    ingredients: ["salt"],
    directions: ["Cook."],
    tags: ["test"],
    quality: { hasTitle: true, hasIngredients: true, hasDirections: true, hasTags: true }
  }];

  const result = measureStep8GCc0MarkdownMarginalValue({
    candidateRecipes,
    publicRecipes: [],
    unitoolsRecipes: [],
    forkRecipes: [],
    rightsAuditPass: false,
    sourceQualityPass: true
  });

  assert.equal(result.pass, false);
  assert.equal(result.gates.rightsAuditPass, false);
  assert.equal(result.boundaries.liveD1WritesAuthorized, false);
});
