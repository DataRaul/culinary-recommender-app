import test from "node:test";
import assert from "node:assert/strict";

import {
  STEP8G_FORKRECIPE_CANDIDATE_TERMINAL,
  STEP8G_FORKRECIPE_LOW_VALUE_TERMINAL,
  measureStep8GForkRecipeMarginalValue
} from "../scripts/corpus-scale-step8g-core.mjs";

const publicRecipes = [
  { id: "omelet", title: "Spanish Omelet", ingredients: [{ id: "eggs", name: "egg" }, { id: "potato", name: "potato" }] }
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

test("Step 8G measurement earns a protected-storage cohort candidate from culinary novelty without implying ontology authority", () => {
  const result = measureStep8GForkRecipeMarginalValue({
    forkEntries: forkEntries(60),
    unitoolsDataset,
    publicRecipes,
    rightsAuditPass: true,
    sourceQualityPass: true
  });
  assert.equal(result.pass, true);
  assert.equal(result.terminal, STEP8G_FORKRECIPE_CANDIDATE_TERMINAL);
  assert.equal(result.gates.culinaryCoveragePass, true);
  assert.ok(result.candidate.lexicalIngredientPhrases.novelNormalizedIngredientPhraseCount >= 25);
  assert.equal(result.candidate.ontology.sourceSpecificIngredientIdsUsedAsOntologyAuthority, false);
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

test("Step 8G measurement rejects a large but title-redundant cohort even when source IDs differ", () => {
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
  assert.equal(result.gates.culinaryCoveragePass, false);
  assert.equal(result.candidate.lexicalIngredientPhrases.novelNormalizedIngredientPhraseCount, 0);
  assert.equal(result.candidate.ontology.canonicalIngredientIdsNewToBaselineCount, 0);
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

test("Step 8G reports canonical ontology resolution separately from rich source phrases", () => {
  const entries = forkEntries(60);
  entries[0].recipe.ingredients = [{ ingId: "source-garlic", name: "garlic cloves" }];
  entries[1].recipe.ingredients = [{ ingId: "source-rich", name: "garlic cloves finely minced for serving" }];
  const result = measureStep8GForkRecipeMarginalValue({
    forkEntries: entries,
    unitoolsDataset,
    publicRecipes,
    rightsAuditPass: true,
    sourceQualityPass: true
  });
  assert.ok(result.candidate.ontology.resolvedIngredientOccurrences >= 1);
  assert.ok(result.candidate.ontology.unresolvedIngredientOccurrences >= 1);
  assert.equal(result.candidate.ontology.sourceSpecificIngredientIdsUsedAsOntologyAuthority, false);
});
