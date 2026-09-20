import test from "node:test";
import assert from "node:assert/strict";
import {
  ORA_SELESKOWITZ_1883_CANDIDATE_TERMINAL,
  ORA_SELESKOWITZ_1883_REJECT_TERMINAL,
  ORA_SELESKOWITZ_1883_SOURCE,
  measureOraSeleskowitz1883Candidate
} from "../scripts/corpus-scale-step8g-ora-seleskowitz-1883-core.mjs";

function row(i, overrides = {}) {
  return {
    title: `Seleskowitz dish ${i}`, slug: `seleskowitz-dish-${i}`,
    collection: ORA_SELESKOWITZ_1883_SOURCE.collection,
    source_title: ORA_SELESKOWITZ_1883_SOURCE.sourceTitle,
    author: ORA_SELESKOWITZ_1883_SOURCE.sourceAuthor,
    source_year: ORA_SELESKOWITZ_1883_SOURCE.sourceYear,
    source_url: ORA_SELESKOWITZ_1883_SOURCE.sourceUrl,
    license: ORA_SELESKOWITZ_1883_SOURCE.license,
    body: `## Ingredients\n\n- ingredient ${i}\n- water\n\n## Directions\n\n1. Combine ingredient ${i} with water.\n2. Cook until done.`,
    ...overrides
  };
}
const baseline = Array.from({ length: 100 }, (_, i) => ({ title: `Baseline ${i}`, ingredients: [`baseline ingredient ${i}`] }));
const passInputs = candidateRows => ({candidateRows, baselineRecipes: baseline, rightsDocumented:true, repositoryReusePass:true, attributionClassified:true, editionSemanticsClassified:true});

test("Seleskowitz exact 1883 cohort earns bounded measurement only when rights and edition gates pass", () => {
  const rows=Array.from({length:ORA_SELESKOWITZ_1883_SOURCE.expectedRecipeCount},(_,i)=>row(i));
  const r=measureOraSeleskowitz1883Candidate(passInputs(rows));
  assert.equal(r.pass,true); assert.equal(r.terminal,ORA_SELESKOWITZ_1883_CANDIDATE_TERMINAL);
  assert.equal(r.baseline.activeProtectedVersion,"v8011"); assert.equal(r.baseline.activeProtectedCount,13124);
  assert.equal(r.candidate.recipeCount,1722); assert.equal(r.candidate.digitizedEditionLabel,"4th edition");
  assert.equal(r.gates.rightsAuditPass,true); assert.equal(r.nextAuthority,"SOURCE_SPECIFIC_PREWRITE_CAPACITY_MEASUREMENT_ONLY");
});
test("Seleskowitz measurement fails closed without edition classification", () => {
  const rows=Array.from({length:ORA_SELESKOWITZ_1883_SOURCE.expectedRecipeCount},(_,i)=>row(i));
  const x=passInputs(rows); x.editionSemanticsClassified=false;
  const r=measureOraSeleskowitz1883Candidate(x);
  assert.equal(r.pass,false); assert.equal(r.terminal,ORA_SELESKOWITZ_1883_REJECT_TERMINAL); assert.equal(r.gates.rightsAuditPass,false);
});
test("Seleskowitz measurement rejects source identity drift", () => {
  const rows=Array.from({length:ORA_SELESKOWITZ_1883_SOURCE.expectedRecipeCount},(_,i)=>row(i,{author:"Anna Dorn"}));
  const r=measureOraSeleskowitz1883Candidate(passInputs(rows));
  assert.equal(r.pass,false); assert.equal(r.gates.rightsMetadataPass,false); assert.equal(r.gates.rightsAuditPass,false);
});
