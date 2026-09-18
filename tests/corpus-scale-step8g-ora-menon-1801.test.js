import test from "node:test";
import assert from "node:assert/strict";

import {
  ORA_MENON_1801_CANDIDATE_TERMINAL,
  ORA_MENON_1801_REJECT_TERMINAL,
  ORA_MENON_1801_SOURCE,
  measureOraMenon1801Candidate
} from "../scripts/corpus-scale-step8g-ora-menon-1801-core.mjs";

function row(i, overrides = {}) {
  return {
    title: `Menon dish ${i}`,
    slug: `menon-dish-${i}`,
    collection: ORA_MENON_1801_SOURCE.collection,
    source_title: ORA_MENON_1801_SOURCE.sourceTitle,
    author: ORA_MENON_1801_SOURCE.sourceAuthor,
    source_year: ORA_MENON_1801_SOURCE.sourceYear,
    source_url: ORA_MENON_1801_SOURCE.sourceUrl,
    license: ORA_MENON_1801_SOURCE.license,
    body: `## Ingredients\n\n- ingredient ${i}\n- water\n\n## Directions\n\n1. Combine ingredient ${i} with water.\n2. Cook until done.`,
    ...overrides
  };
}

const baseline = Array.from({ length: 100 }, (_, i) => ({
  title: `Baseline ${i}`,
  ingredients: [`baseline ingredient ${i}`]
}));

test("Menon 1801 exact cohort earns bounded measurement only when rights and provenance gates pass", () => {
  const candidateRows = Array.from({ length: ORA_MENON_1801_SOURCE.expectedRecipeCount }, (_, i) => row(i));
  const result = measureOraMenon1801Candidate({
    candidateRows,
    baselineRecipes: baseline,
    rightsDocumented: true,
    repositoryReusePass: true,
    attributionClassified: true
  });
  assert.equal(result.pass, true);
  assert.equal(result.terminal, ORA_MENON_1801_CANDIDATE_TERMINAL);
  assert.equal(result.baseline.activeProtectedVersion, "v8008");
  assert.equal(result.baseline.activeProtectedCount, 10171);
  assert.equal(result.candidate.recipeCount, 752);
  assert.equal(result.candidate.parseableRecipeRatio, 1);
  assert.equal(result.candidate.novelTitleRatio, 1);
  assert.equal(result.gates.rightsAuditPass, true);
  assert.equal(result.nextAuthority, "SOURCE_SPECIFIC_PREWRITE_CAPACITY_MEASUREMENT_ONLY");
  assert.equal(result.boundaries.liveD1WritesPerformed, 0);
  assert.equal(result.boundaries.protectedPopulationAuthorized, false);
});

test("Menon 1801 measurement fails closed when repository-layer reuse is not verified", () => {
  const candidateRows = Array.from({ length: ORA_MENON_1801_SOURCE.expectedRecipeCount }, (_, i) => row(i));
  const result = measureOraMenon1801Candidate({
    candidateRows,
    baselineRecipes: baseline,
    rightsDocumented: true,
    repositoryReusePass: false,
    attributionClassified: true
  });
  assert.equal(result.pass, false);
  assert.equal(result.terminal, ORA_MENON_1801_REJECT_TERMINAL);
  assert.equal(result.gates.repositoryReusePass, false);
  assert.equal(result.gates.rightsAuditPass, false);
  assert.equal(result.nextAuthority, "NONE_STOP_OR_SELECT_OTHER_SOURCE");
});

test("Menon 1801 measurement rejects source identity drift", () => {
  const candidateRows = Array.from({ length: ORA_MENON_1801_SOURCE.expectedRecipeCount }, (_, i) => row(i, { author: "Wrong author" }));
  const result = measureOraMenon1801Candidate({
    candidateRows,
    baselineRecipes: baseline,
    rightsDocumented: true,
    repositoryReusePass: true,
    attributionClassified: true
  });
  assert.equal(result.pass, false);
  assert.equal(result.gates.rightsMetadataPass, false);
  assert.equal(result.gates.rightsAuditPass, false);
});
