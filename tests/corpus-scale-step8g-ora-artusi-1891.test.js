import test from "node:test";
import assert from "node:assert/strict";

import {
  ORA_ARTUSI_1891_CANDIDATE_TERMINAL,
  ORA_ARTUSI_1891_REJECT_TERMINAL,
  ORA_ARTUSI_1891_SOURCE,
  measureOraArtusi1891Candidate
} from "../scripts/corpus-scale-step8g-ora-artusi-1891-core.mjs";

function row(i, overrides = {}) {
  return {
    title: `Artusi dish ${i}`,
    slug: `artusi-dish-${i}`,
    collection: ORA_ARTUSI_1891_SOURCE.collection,
    source_title: ORA_ARTUSI_1891_SOURCE.sourceTitle,
    author: ORA_ARTUSI_1891_SOURCE.sourceAuthor,
    source_year: ORA_ARTUSI_1891_SOURCE.sourceYear,
    source_url: ORA_ARTUSI_1891_SOURCE.sourceUrl,
    license: ORA_ARTUSI_1891_SOURCE.license,
    body: `## Ingredients\n\n- ingredient ${i}\n- water\n\n## Directions\n\n1. Combine ingredient ${i} with water.\n2. Cook until done.`,
    ...overrides
  };
}

const baseline = Array.from({ length: 100 }, (_, i) => ({
  title: `Baseline ${i}`,
  ingredients: [`baseline ingredient ${i}`]
}));

const passInputs = candidateRows => ({
  candidateRows,
  baselineRecipes: baseline,
  rightsDocumented: true,
  repositoryReusePass: true,
  attributionClassified: true,
  editionSemanticsClassified: true,
  sourceGroundingSamplePass: true
});

test("Artusi exact cohort earns bounded measurement only when rights, edition and grounding gates pass", () => {
  const candidateRows = Array.from({ length: ORA_ARTUSI_1891_SOURCE.expectedRecipeCount }, (_, i) => row(i));
  const result = measureOraArtusi1891Candidate(passInputs(candidateRows));
  assert.equal(result.pass, true);
  assert.equal(result.terminal, ORA_ARTUSI_1891_CANDIDATE_TERMINAL);
  assert.equal(result.baseline.activeProtectedVersion, "v8009");
  assert.equal(result.baseline.activeProtectedCount, 10923);
  assert.equal(result.candidate.recipeCount, 829);
  assert.equal(result.candidate.sourceYearSemantics, "WORK_FIRST_PUBLICATION_YEAR");
  assert.equal(result.candidate.digitizedEditionYear, "1922");
  assert.equal(result.gates.rightsAuditPass, true);
  assert.equal(result.nextAuthority, "SOURCE_SPECIFIC_PREWRITE_CAPACITY_MEASUREMENT_ONLY");
  assert.equal(result.boundaries.liveD1WritesPerformed, 0);
  assert.equal(result.boundaries.protectedPopulationAuthorized, false);
});

test("Artusi measurement fails closed when digitized-edition semantics are not classified", () => {
  const candidateRows = Array.from({ length: ORA_ARTUSI_1891_SOURCE.expectedRecipeCount }, (_, i) => row(i));
  const inputs = passInputs(candidateRows);
  inputs.editionSemanticsClassified = false;
  const result = measureOraArtusi1891Candidate(inputs);
  assert.equal(result.pass, false);
  assert.equal(result.terminal, ORA_ARTUSI_1891_REJECT_TERMINAL);
  assert.equal(result.gates.editionSemanticsClassified, false);
  assert.equal(result.gates.rightsAuditPass, false);
});

test("Artusi measurement fails closed when source-grounding sample is absent", () => {
  const candidateRows = Array.from({ length: ORA_ARTUSI_1891_SOURCE.expectedRecipeCount }, (_, i) => row(i));
  const inputs = passInputs(candidateRows);
  inputs.sourceGroundingSamplePass = false;
  const result = measureOraArtusi1891Candidate(inputs);
  assert.equal(result.pass, false);
  assert.equal(result.gates.sourceGroundingSamplePass, false);
  assert.equal(result.gates.rightsAuditPass, false);
});

test("Artusi measurement rejects source identity drift", () => {
  const candidateRows = Array.from({ length: ORA_ARTUSI_1891_SOURCE.expectedRecipeCount }, (_, i) => row(i, { source_year: "1922" }));
  const result = measureOraArtusi1891Candidate(passInputs(candidateRows));
  assert.equal(result.pass, false);
  assert.equal(result.gates.rightsMetadataPass, false);
  assert.equal(result.gates.rightsAuditPass, false);
});
