import test from "node:test";
import assert from "node:assert/strict";

import {
  ORA_FROKEN_JENSEN_1921_CANDIDATE_TERMINAL,
  ORA_FROKEN_JENSEN_1921_REJECT_TERMINAL,
  ORA_FROKEN_JENSEN_1921_SOURCE,
  measureOraFrokenJensen1921Candidate
} from "../scripts/corpus-scale-step8g-ora-froken-jensen-1921-core.mjs";

function row(i, overrides = {}) {
  return {
    title: `Jensen dish ${i}`,
    slug: `jensen-dish-${i}`,
    collection: ORA_FROKEN_JENSEN_1921_SOURCE.collection,
    source_title: ORA_FROKEN_JENSEN_1921_SOURCE.sourceTitle,
    author: ORA_FROKEN_JENSEN_1921_SOURCE.sourceAuthor,
    source_year: ORA_FROKEN_JENSEN_1921_SOURCE.sourceYear,
    source_url: ORA_FROKEN_JENSEN_1921_SOURCE.sourceUrl,
    license: ORA_FROKEN_JENSEN_1921_SOURCE.license,
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
  editionSemanticsClassified: true
});

test("Frøken Jensen exact 1921 cohort earns bounded measurement only when rights and edition gates pass", () => {
  const candidateRows = Array.from({ length: ORA_FROKEN_JENSEN_1921_SOURCE.expectedRecipeCount }, (_, i) => row(i));
  const result = measureOraFrokenJensen1921Candidate(passInputs(candidateRows));
  assert.equal(result.pass, true);
  assert.equal(result.terminal, ORA_FROKEN_JENSEN_1921_CANDIDATE_TERMINAL);
  assert.equal(result.baseline.activeProtectedVersion, "v8010");
  assert.equal(result.baseline.activeProtectedCount, 11752);
  assert.equal(result.candidate.recipeCount, 1372);
  assert.equal(result.candidate.sourceYearSemantics, "EXACT_DIGITIZED_EDITION_YEAR");
  assert.equal(result.candidate.digitizedEditionYear, "1921");
  assert.equal(result.candidate.digitizedEditionLabel, "23rd printing");
  assert.equal(result.gates.rightsAuditPass, true);
  assert.equal(result.nextAuthority, "SOURCE_SPECIFIC_PREWRITE_CAPACITY_MEASUREMENT_ONLY");
  assert.equal(result.boundaries.liveD1WritesPerformed, 0);
  assert.equal(result.boundaries.protectedPopulationAuthorized, false);
});

test("Frøken Jensen measurement fails closed without edition classification", () => {
  const candidateRows = Array.from({ length: ORA_FROKEN_JENSEN_1921_SOURCE.expectedRecipeCount }, (_, i) => row(i));
  const inputs = passInputs(candidateRows);
  inputs.editionSemanticsClassified = false;
  const result = measureOraFrokenJensen1921Candidate(inputs);
  assert.equal(result.pass, false);
  assert.equal(result.terminal, ORA_FROKEN_JENSEN_1921_REJECT_TERMINAL);
  assert.equal(result.gates.editionSemanticsClassified, false);
  assert.equal(result.gates.rightsAuditPass, false);
});

test("Frøken Jensen measurement rejects source identity drift", () => {
  const candidateRows = Array.from({ length: ORA_FROKEN_JENSEN_1921_SOURCE.expectedRecipeCount }, (_, i) => row(i, { source_year: "1901" }));
  const result = measureOraFrokenJensen1921Candidate(passInputs(candidateRows));
  assert.equal(result.pass, false);
  assert.equal(result.gates.rightsMetadataPass, false);
  assert.equal(result.gates.rightsAuditPass, false);
});
