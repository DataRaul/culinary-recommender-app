import test from "node:test";
import assert from "node:assert/strict";

import {
  ORA_RIGAUD_SOURCE,
  ORA_RIGAUD_CANDIDATE_TERMINAL,
  ORA_RIGAUD_REJECT_TERMINAL,
  measureOraRigaudCandidate
} from "../scripts/corpus-scale-step8g-ora-rigaud-core.mjs";

function row(index, overrides = {}) {
  return {
    title: `Rigaud Dish ${index}`,
    slug: `rigaud-dish-${index}`,
    collection: ORA_RIGAUD_SOURCE.collection,
    source_title: ORA_RIGAUD_SOURCE.sourceTitle,
    author: ORA_RIGAUD_SOURCE.sourceAuthor,
    source_year: ORA_RIGAUD_SOURCE.sourceYear,
    source_url: ORA_RIGAUD_SOURCE.sourceUrl,
    license: ORA_RIGAUD_SOURCE.license,
    body: `## Ingredients\n\n- ingredient ${index}\n- water\n\n## Directions\n\n1. Combine ingredients.\n2. Cook until done.`,
    ...overrides
  };
}

const baseline = Array.from({ length: 120 }, (_, index) => ({
  title: `Baseline Dish ${index}`,
  ingredients: [`baseline ingredient ${index}`]
}));
const exactRows = Array.from({ length: ORA_RIGAUD_SOURCE.expectedRecipeCount }, (_, index) => row(index));

test("exact Rigaud source clears rights + marginal-value measurement only when documentary marker is present", () => {
  const result = measureOraRigaudCandidate({ candidateRows: exactRows, baselineRecipes: baseline, rightsDocumented: true });
  assert.equal(result.pass, true);
  assert.equal(result.terminal, ORA_RIGAUD_CANDIDATE_TERMINAL);
  assert.equal(result.candidate.recipeCount, 789);
  assert.equal(result.candidate.parseableRecipeRatio, 1);
  assert.equal(result.candidate.uniqueTitleRatio, 1);
  assert.equal(result.candidate.novelTitleRatio, 1);
  assert.equal(result.gates.rightsDocumented, true);
  assert.equal(result.gates.exactCountPass, true);
  assert.equal(result.gates.singleSourcePass, true);
  assert.equal(result.gates.rightsMetadataPass, true);
  assert.equal(result.gates.rightsAuditPass, true);
  assert.equal(result.gates.structuralQualityPass, true);
  assert.equal(result.gates.culinaryCoveragePass, true);
  assert.equal(result.boundaries.liveD1WritesAuthorized, false);
  assert.equal(result.boundaries.protectedPopulationAuthorized, false);
  assert.equal(result.boundaries.publicRuntimeChangeAuthorized, false);
  assert.equal(result.boundaries.thirdShardAuthorized, false);
  assert.equal(result.boundaries.d1BudgetExpansionAuthorized, false);
  assert.equal(result.boundaries.billingExpansionAuthorized, false);
});

test("missing documentary rights marker fails closed even for structurally strong exact rows", () => {
  const result = measureOraRigaudCandidate({ candidateRows: exactRows, baselineRecipes: baseline, rightsDocumented: false });
  assert.equal(result.pass, false);
  assert.equal(result.terminal, ORA_RIGAUD_REJECT_TERMINAL);
  assert.equal(result.gates.rightsAuditPass, false);
  assert.equal(result.gates.structuralQualityPass, true);
  assert.equal(result.gates.culinaryCoveragePass, true);
});

test("wrong count or mixed source identity fails the bounded rights gate", () => {
  const short = measureOraRigaudCandidate({ candidateRows: exactRows.slice(0, 788), baselineRecipes: baseline, rightsDocumented: true });
  assert.equal(short.pass, false);
  assert.equal(short.gates.exactCountPass, false);

  const mixedRows = exactRows.map((value, index) => index === 0 ? { ...value, source_url: "https://archive.org/details/not-the-reviewed-item" } : value);
  const mixed = measureOraRigaudCandidate({ candidateRows: mixedRows, baselineRecipes: baseline, rightsDocumented: true });
  assert.equal(mixed.pass, false);
  assert.equal(mixed.gates.singleSourcePass, false);
  assert.equal(mixed.gates.rightsAuditPass, false);
});
