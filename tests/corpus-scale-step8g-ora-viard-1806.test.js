import test from "node:test";
import assert from "node:assert/strict";
import {
  ORA_VIARD_1806_CANDIDATE_TERMINAL,
  ORA_VIARD_1806_REJECT_TERMINAL,
  ORA_VIARD_1806_SOURCE,
  measureOraViard1806Candidate
} from "../scripts/corpus-scale-step8g-ora-viard-1806-core.mjs";

function row(i, overrides = {}) {
  return {
    title: `Viard dish ${i}`, slug: `viard-dish-${i}`,
    collection: ORA_VIARD_1806_SOURCE.collection,
    source_title: ORA_VIARD_1806_SOURCE.sourceTitle,
    author: ORA_VIARD_1806_SOURCE.sourceAuthor,
    source_year: ORA_VIARD_1806_SOURCE.sourceYear,
    source_url: ORA_VIARD_1806_SOURCE.sourceUrl,
    license: ORA_VIARD_1806_SOURCE.license,
    body: `## Ingredients\n\n- ingredient ${i}\n- water\n\n## Directions\n\n1. Combine ingredient ${i} with water.\n2. Cook until done.`,
    ...overrides
  };
}
const baseline = Array.from({ length: 100 }, (_, i) => ({ title: `Baseline ${i}`, ingredients: [`baseline ingredient ${i}`] }));
const passInputs = candidateRows => ({candidateRows, baselineRecipes: baseline, rightsDocumented:true, repositoryReusePass:true, attributionClassified:true, editionSemanticsClassified:true});

test("Viard exact 1806 cohort earns bounded measurement only when rights and edition gates pass", () => {
  const rows=Array.from({length:ORA_VIARD_1806_SOURCE.expectedRecipeCount},(_,i)=>row(i));
  const r=measureOraViard1806Candidate(passInputs(rows));
  assert.equal(r.pass,true); assert.equal(r.terminal,ORA_VIARD_1806_CANDIDATE_TERMINAL);
  assert.equal(r.baseline.activeProtectedVersion,"v8012"); assert.equal(r.baseline.activeProtectedCount,14846);
  assert.equal(r.candidate.recipeCount,807); assert.equal(r.candidate.digitizedEditionLabel,"1806 first edition bibliographic alignment");
  assert.equal(r.gates.rightsAuditPass,true); assert.equal(r.nextAuthority,"SOURCE_SPECIFIC_PREWRITE_CAPACITY_MEASUREMENT_ONLY");
});
test("Viard measurement fails closed without edition classification", () => {
  const rows=Array.from({length:ORA_VIARD_1806_SOURCE.expectedRecipeCount},(_,i)=>row(i));
  const x=passInputs(rows); x.editionSemanticsClassified=false;
  const r=measureOraViard1806Candidate(x);
  assert.equal(r.pass,false); assert.equal(r.terminal,ORA_VIARD_1806_REJECT_TERMINAL); assert.equal(r.gates.rightsAuditPass,false);
});
test("Viard measurement rejects source identity drift", () => {
  const rows=Array.from({length:ORA_VIARD_1806_SOURCE.expectedRecipeCount},(_,i)=>row(i,{author:"Different Author"}));
  const r=measureOraViard1806Candidate(passInputs(rows));
  assert.equal(r.pass,false); assert.equal(r.gates.rightsMetadataPass,false); assert.equal(r.gates.rightsAuditPass,false);
});
