import test from "node:test";
import assert from "node:assert/strict";
import {
  ORA_HEARN_1885_CANDIDATE_TERMINAL,
  ORA_HEARN_1885_REJECT_TERMINAL,
  ORA_HEARN_1885_SOURCE,
  measureOraHearn1885Candidate
} from "../scripts/corpus-scale-step8g-ora-hearn-1885-core.mjs";

function row(i, overrides = {}) {
  return {
    title: `Hearn dish ${i}`, slug: `hearn-dish-${i}`,
    collection: ORA_HEARN_1885_SOURCE.collection,
    source_title: ORA_HEARN_1885_SOURCE.sourceTitle,
    author: ORA_HEARN_1885_SOURCE.sourceAuthor,
    source_year: ORA_HEARN_1885_SOURCE.sourceYear,
    source_url: ORA_HEARN_1885_SOURCE.sourceUrl,
    license: ORA_HEARN_1885_SOURCE.license,
    body: `## Ingredients\n\n- ingredient ${i}\n- water\n\n## Directions\n\n1. Combine ingredient ${i} with water.\n2. Cook until done.`,
    ...overrides
  };
}
const baseline = Array.from({ length: 100 }, (_, i) => ({ title: `Baseline ${i}`, ingredients: [`baseline ingredient ${i}`] }));
const passInputs = candidateRows => ({candidateRows, baselineRecipes: baseline, rightsDocumented:true, repositoryReusePass:true, attributionClassified:true, editionSemanticsClassified:true});

test("Hearn exact 1885 cohort earns bounded measurement only when rights and edition gates pass", () => {
  const rows=Array.from({length:ORA_HEARN_1885_SOURCE.expectedRecipeCount},(_,i)=>row(i));
  const r=measureOraHearn1885Candidate(passInputs(rows));
  assert.equal(r.pass,true); assert.equal(r.terminal,ORA_HEARN_1885_CANDIDATE_TERMINAL);
  assert.equal(r.baseline.activeProtectedVersion,"v8013"); assert.equal(r.baseline.activeProtectedCount,15653);
  assert.equal(r.candidate.recipeCount,712); assert.equal(r.candidate.digitizedEditionLabel,"2nd edition");
  assert.equal(r.gates.rightsAuditPass,true); assert.equal(r.nextAuthority,"SOURCE_SPECIFIC_PREWRITE_CAPACITY_MEASUREMENT_ONLY");
});
test("Hearn measurement fails closed without edition classification", () => {
  const rows=Array.from({length:ORA_HEARN_1885_SOURCE.expectedRecipeCount},(_,i)=>row(i));
  const x=passInputs(rows); x.editionSemanticsClassified=false;
  const r=measureOraHearn1885Candidate(x);
  assert.equal(r.pass,false); assert.equal(r.terminal,ORA_HEARN_1885_REJECT_TERMINAL); assert.equal(r.gates.rightsAuditPass,false);
});
test("Hearn measurement rejects source identity drift", () => {
  const rows=Array.from({length:ORA_HEARN_1885_SOURCE.expectedRecipeCount},(_,i)=>row(i,{author:"Different Author"}));
  const r=measureOraHearn1885Candidate(passInputs(rows));
  assert.equal(r.pass,false); assert.equal(r.gates.rightsMetadataPass,false); assert.equal(r.gates.rightsAuditPass,false);
});
