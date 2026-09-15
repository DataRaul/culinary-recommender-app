import test from "node:test";
import assert from "node:assert/strict";

import {
  ORA_BW_SOURCE,
  ORA_BW_CANDIDATE_TERMINAL,
  ORA_BW_REJECT_TERMINAL,
  measureOraBosseWatannaCandidate,
  parseOraJsonlRecipe
} from "../scripts/corpus-scale-step8g-ora-bosse-watanna-core.mjs";

function row(index, overrides = {}) {
  return {
    title: `Historical Dish ${index}`,
    slug: `historical-dish-${index}`,
    collection: ORA_BW_SOURCE.collection,
    author: ORA_BW_SOURCE.sourceAuthor,
    source_title: ORA_BW_SOURCE.sourceTitle,
    source_url: ORA_BW_SOURCE.sourceUrl,
    source_year: ORA_BW_SOURCE.sourceYear,
    license: ORA_BW_SOURCE.license,
    body: `## Ingredients\n\n- rice\n- ginger\n\n## Directions\n\n1. Prepare historical dish ${index}.`,
    ...overrides
  };
}

function exactCandidate(overridesAt = null) {
  return Array.from({ length: ORA_BW_SOURCE.expectedRecipeCount }, (_, index) =>
    parseOraJsonlRecipe(row(index, index === overridesAt?.index ? overridesAt.patch : {}))
  );
}

function measure(candidateRecipes, rightsDocumented = true) {
  return measureOraBosseWatannaCandidate({
    candidateRecipes,
    publicRecipes: [],
    unitoolsRecipes: [],
    forkRecipes: [],
    cc0Recipes: [],
    abbottRecipes: [],
    rightsDocumented
  });
}

test("Bosse Watanna measurement admits only the exact rights-clean 109-row cohort", () => {
  const result = measure(exactCandidate());
  assert.equal(result.pass, true);
  assert.equal(result.terminal, ORA_BW_CANDIDATE_TERMINAL);
  assert.equal(result.candidate.recipeCount, 109);
  assert.equal(result.candidate.parseableRecipeRatio, 1);
  assert.equal(result.candidate.uniqueTitleRatio, 1);
  assert.equal(result.candidate.novelTitleRatio, 1);
  assert.equal(result.gates.exactCountPass, true);
  assert.equal(result.gates.rightsAuditPass, true);
  assert.equal(result.boundaries.protectedPopulationAuthorized, false);
  assert.equal(result.boundaries.liveD1WritesAuthorized, false);
  assert.equal(result.boundaries.publicRuntimeChangeAuthorized, false);
  assert.equal(result.boundaries.thirdShardAuthorized, false);
  assert.equal(result.boundaries.billingExpansionAuthorized, false);
  assert.equal(result.candidate.culturalAuthorityImported, false);
  assert.equal(result.candidate.historicalSourceLabelOnly, true);
});

test("measurement fails closed on a single source-rights metadata mismatch", () => {
  const result = measure(exactCandidate({ index: 3, patch: { license: "unknown" } }));
  assert.equal(result.pass, false);
  assert.equal(result.terminal, ORA_BW_REJECT_TERMINAL);
  assert.equal(result.gates.rightsMetadataPass, false);
  assert.equal(result.gates.rightsAuditPass, false);
  assert.equal(result.rightsViolations.length, 1);
});

test("measurement fails closed when documentary rights marker is absent", () => {
  const result = measure(exactCandidate(), false);
  assert.equal(result.pass, false);
  assert.equal(result.gates.rightsDocumented, false);
  assert.equal(result.gates.rightsAuditPass, false);
});

test("measurement rejects count drift rather than silently broadening the shelf", () => {
  const result = measure(exactCandidate().slice(0, 108));
  assert.equal(result.pass, false);
  assert.equal(result.gates.exactCountPass, false);
  assert.equal(result.boundaries.protectedPopulationAuthorized, false);
});

test("JSONL parser requires structured ingredients and directions for parseability", () => {
  const parsed = parseOraJsonlRecipe(row(1, { body: "## Ingredients\n\n- rice" }));
  assert.equal(parsed.quality.hasTitle, true);
  assert.equal(parsed.quality.hasIngredients, true);
  assert.equal(parsed.quality.hasDirections, false);
});
