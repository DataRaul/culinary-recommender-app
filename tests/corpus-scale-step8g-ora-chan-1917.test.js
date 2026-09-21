import test from "node:test";
import assert from "node:assert/strict";
import {
  ORA_CHAN_1917_CANDIDATE_TERMINAL,
  ORA_CHAN_1917_REJECT_TERMINAL,
  ORA_CHAN_1917_SOURCE,
  measureOraChan1917Candidate
} from "../scripts/corpus-scale-step8g-ora-chan-1917-core.mjs";

function row(i, overrides = {}) {
  return {
    title: `Chan dish ${i}`, slug: `chan-dish-${i}`,
    collection: ORA_CHAN_1917_SOURCE.collection,
    source_title: ORA_CHAN_1917_SOURCE.sourceTitle,
    author: ORA_CHAN_1917_SOURCE.sourceAuthor,
    source_year: ORA_CHAN_1917_SOURCE.sourceYear,
    source_url: ORA_CHAN_1917_SOURCE.sourceUrl,
    license: ORA_CHAN_1917_SOURCE.license,
    body: `## Ingredients\n\n- ingredient ${i}\n- water\n\n## Directions\n\n1. Combine ingredient ${i} with water.\n2. Cook until done.`,
    ...overrides
  };
}
const baseline = Array.from({ length: 100 }, (_, i) => ({ title: `Baseline ${i}`, ingredients: [`baseline ingredient ${i}`] }));
const passInputs = candidateRows => ({candidateRows, baselineRecipes: baseline, rightsDocumented:true, repositoryReusePass:true, attributionClassified:true, editionSemanticsClassified:true});

test("Chan exact 1917 cohort earns bounded measurement only when rights and edition gates pass", () => {
  const rows=Array.from({length:ORA_CHAN_1917_SOURCE.expectedRecipeCount},(_,i)=>row(i));
  const r=measureOraChan1917Candidate(passInputs(rows));
  assert.equal(r.pass,true); assert.equal(r.terminal,ORA_CHAN_1917_CANDIDATE_TERMINAL);
  assert.equal(r.baseline.activeProtectedVersion,"v8014"); assert.equal(r.baseline.activeProtectedCount,16365);
  assert.equal(r.candidate.recipeCount,145); assert.equal(r.candidate.digitizedEditionLabel,"1st edition");
  assert.equal(r.gates.rightsAuditPass,true); assert.equal(r.nextAuthority,"SOURCE_SPECIFIC_PREWRITE_CAPACITY_MEASUREMENT_ONLY");
});
test("Chan measurement fails closed without edition classification", () => {
  const rows=Array.from({length:ORA_CHAN_1917_SOURCE.expectedRecipeCount},(_,i)=>row(i));
  const x=passInputs(rows); x.editionSemanticsClassified=false;
  const r=measureOraChan1917Candidate(x);
  assert.equal(r.pass,false); assert.equal(r.terminal,ORA_CHAN_1917_REJECT_TERMINAL); assert.equal(r.gates.rightsAuditPass,false);
});
test("Chan measurement rejects source identity drift", () => {
  const rows=Array.from({length:ORA_CHAN_1917_SOURCE.expectedRecipeCount},(_,i)=>row(i,{author:"Different Author"}));
  const r=measureOraChan1917Candidate(passInputs(rows));
  assert.equal(r.pass,false); assert.equal(r.gates.rightsMetadataPass,false); assert.equal(r.gates.rightsAuditPass,false);
});
