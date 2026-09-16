import test from "node:test";
import assert from "node:assert/strict";

import {
  ORA_TURABI_SOURCE,
  ORA_TURABI_CANDIDATE_TERMINAL,
  ORA_TURABI_REJECT_TERMINAL,
  measureOraTurabiCandidate,
  parseOraJsonlRecipe
} from "../scripts/corpus-scale-step8g-ora-turabi-core.mjs";

function row(index, overrides = {}) {
  return {
    title: `Ottoman Historical Dish ${index}`,
    slug: `ottoman-historical-dish-${index}`,
    collection: ORA_TURABI_SOURCE.collection,
    author: ORA_TURABI_SOURCE.sourceAuthor,
    source_title: ORA_TURABI_SOURCE.sourceTitle,
    source_url: ORA_TURABI_SOURCE.sourceUrl,
    source_year: ORA_TURABI_SOURCE.sourceYear,
    license: ORA_TURABI_SOURCE.license,
    body: `## Ingredients\n\n- rice\n- fresh butter\n\n## Directions\n\n1. Prepare Ottoman historical dish ${index}.`,
    ...overrides
  };
}

function exactCandidate(overridesAt = null) {
  return Array.from({ length: ORA_TURABI_SOURCE.expectedRecipeCount }, (_, index) =>
    parseOraJsonlRecipe(row(index, index === overridesAt?.index ? overridesAt.patch : {}))
  );
}

function measure(candidateRecipes, rightsDocumented = true) {
  return measureOraTurabiCandidate({
    candidateRecipes,
    publicRecipes: [],
    unitoolsRecipes: [],
    forkRecipes: [],
    cc0Recipes: [],
    abbottRecipes: [],
    bosseWatannaRecipes: [],
    rightsDocumented
  });
}

test("Turabi measurement admits only the exact rights-clean 442-row cohort", () => {
  const result = measure(exactCandidate());
  assert.equal(result.pass, true);
  assert.equal(result.terminal, ORA_TURABI_CANDIDATE_TERMINAL);
  assert.equal(result.candidate.recipeCount, 442);
  assert.equal(result.candidate.parseableRecipeRatio, 1);
  assert.equal(result.candidate.uniqueTitleRatio, 1);
  assert.equal(result.candidate.novelTitleRatio, 1);
  assert.equal(result.gates.exactCountPass, true);
  assert.equal(result.gates.rightsAuditPass, true);
  assert.equal(result.boundaries.protectedPopulationAuthorized, false);
  assert.equal(result.boundaries.liveD1WritesAuthorized, false);
  assert.equal(result.boundaries.publicRuntimeChangeAuthorized, false);
  assert.equal(result.boundaries.thirdShardAuthorized, false);
  assert.equal(result.boundaries.d1BudgetExpansionAuthorized, false);
  assert.equal(result.boundaries.billingExpansionAuthorized, false);
  assert.equal(result.candidate.culturalAuthorityImported, false);
  assert.equal(result.candidate.historicalSourceLabelOnly, true);
});

test("Turabi measurement fails closed on a single source-rights metadata mismatch", () => {
  const result = measure(exactCandidate({ index: 7, patch: { source_year: "unknown" } }));
  assert.equal(result.pass, false);
  assert.equal(result.terminal, ORA_TURABI_REJECT_TERMINAL);
  assert.equal(result.gates.rightsMetadataPass, false);
  assert.equal(result.gates.rightsAuditPass, false);
  assert.equal(result.rightsViolations.length, 1);
});

test("Turabi measurement fails closed when documentary rights marker is absent", () => {
  const result = measure(exactCandidate(), false);
  assert.equal(result.pass, false);
  assert.equal(result.gates.rightsDocumented, false);
  assert.equal(result.gates.rightsAuditPass, false);
});

test("Turabi measurement rejects count drift rather than silently broadening the shelf", () => {
  const result = measure(exactCandidate().slice(0, 441));
  assert.equal(result.pass, false);
  assert.equal(result.gates.exactCountPass, false);
  assert.equal(result.boundaries.protectedPopulationAuthorized, false);
});

test("Turabi measurement rejects structurally repetitive title coverage below the established uniqueness threshold", () => {
  const candidate = exactCandidate().map((recipe, index) => ({ ...recipe, title: `Repeated Dish ${index % 10}` }));
  const result = measure(candidate);
  assert.equal(result.pass, false);
  assert.equal(result.gates.culinaryCoveragePass, false);
  assert.equal(result.candidate.uniqueTitleRatio < result.thresholds.minUniqueTitleRatio, true);
});
