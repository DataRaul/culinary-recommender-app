import test from "node:test";
import assert from "node:assert/strict";

import {
  STEP8G_FORKRECIPE_CANDIDATE_TERMINAL,
  STEP8G_FORKRECIPE_LOW_VALUE_TERMINAL,
  measureStep8GForkRecipeMarginalValue
} from "../scripts/corpus-scale-step8g-core.mjs";

const publicRecipes = [
  { id: "omelet", title: "Spanish Omelet", ingredients: [{ name: "egg" }, { name: "potato" }] }
];
const unitoolsDataset = {
  recipes: [
    { slug: "paella", name: { en: "Paella" }, ingredients: [{ id: "rice-id", name: { en: "Rice" } }] }
  ]
};

function forkEntries(count, { overlap = false, ingredientPrefix = "novel" } = {}) {
  return Array.from({ length: count }, (_, index) => ({
    fileName: `r-${index}.js`,
    recipe: {
      slug: `r-${index}`,
      title: overlap ? "Paella" : `Fork Dish ${index}`,
      cuisine: `Cuisine ${index % 5}`,
      culture: `Culture ${index % 4}`,
      category: `Category ${index % 3}`,
      tags: [`tag-${index % 7}`],
      ratioSystem: "parts",
      ingredients: [
        { ingId: `${ingredientPrefix}-${index}`, name: `${ingredientPrefix} ingredient ${index}` }
      ]
    }
  }));
}

test("Step 8G measurement earns a cohort candidate only when rights, quality and marginal coverage pass", () => {
  const result = measureStep8GForkRecipeMarginalValue({
    forkEntries: forkEntries(60),
    unitoolsDataset,
    publicRecipes,
    rightsAuditPass: true,
    sourceQualityPass: true
  });
  assert.equal(result.pass, true);
  assert.equal(result.terminal, STEP8G_FORKRECIPE_CANDIDATE_TERMINAL);
  assert.equal(result.gates.coveragePass, true);
  assert.ok(result.candidate.novelNormalizedIngredientNameCount >= 25);
  assert.equal(result.boundaries.liveD1WritesAuthorized, false);
  assert.equal(result.boundaries.publicRuntimeChangeAuthorized, false);
  assert.equal(result.boundaries.thirdShardAuthorized, false);
  assert.equal(result.boundaries.billingExpansionAuthorized, false);
});

test("Step 8G measurement fails closed when rights are not currently verified", () => {
  const result = measureStep8GForkRecipeMarginalValue({
    forkEntries: forkEntries(60),
    unitoolsDataset,
    publicRecipes,
    rightsAuditPass: false,
    sourceQualityPass: true
  });
  assert.equal(result.pass, false);
  assert.equal(result.terminal, STEP8G_FORKRECIPE_LOW_VALUE_TERMINAL);
  assert.equal(result.gates.rightsAuditPass, false);
});

test("Step 8G measurement rejects a large but redundant cohort", () => {
  const entries = forkEntries(60, { overlap: true, ingredientPrefix: "rice" });
  entries.forEach(entry => {
    entry.recipe.ingredients = [{ ingId: `source-only-${entry.recipe.slug}`, name: "Rice" }];
  });
  const result = measureStep8GForkRecipeMarginalValue({
    forkEntries: entries,
    unitoolsDataset,
    publicRecipes,
    rightsAuditPass: true,
    sourceQualityPass: true
  });
  assert.equal(result.pass, false);
  assert.equal(result.gates.coveragePass, false);
  assert.equal(result.candidate.novelNormalizedIngredientNameCount, 0);
  assert.equal(result.terminal, STEP8G_FORKRECIPE_LOW_VALUE_TERMINAL);
});

test("Step 8G normalization folds accents instead of splitting words", () => {
  const entries = forkEntries(60);
  entries[0].recipe.title = "Crème Brûlée";
  const baseline = {
    recipes: [{ slug: "creme-brulee", name: { en: "Creme Brulee" }, ingredients: [{ name: { en: "Sugar" } }] }]
  };
  const result = measureStep8GForkRecipeMarginalValue({
    forkEntries: entries,
    unitoolsDataset: baseline,
    publicRecipes,
    rightsAuditPass: true,
    sourceQualityPass: true
  });
  assert.ok(result.evidenceSamples.overlappingTitles.includes("creme brulee"));
});
