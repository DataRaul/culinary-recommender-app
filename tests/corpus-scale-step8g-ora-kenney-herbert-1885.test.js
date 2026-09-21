import test from "node:test";
import assert from "node:assert/strict";
import {
  ORA_KENNEY_HERBERT_1885_CANDIDATE_TERMINAL,
  ORA_KENNEY_HERBERT_1885_REJECT_TERMINAL,
  ORA_KENNEY_HERBERT_1885_SOURCE,
  measureOraKenneyHerbert1885Candidate
} from "../scripts/corpus-scale-step8g-ora-kenney-herbert-1885-core.mjs";

function row(i, overrides = {}) {
  return {
    title: `Kenney Herbert dish ${i}`, slug: `kenney-herbert-dish-${i}`,
    collection: ORA_KENNEY_HERBERT_1885_SOURCE.collection,
    source_title: ORA_KENNEY_HERBERT_1885_SOURCE.sourceTitle,
    author: ORA_KENNEY_HERBERT_1885_SOURCE.sourceAuthor,
    source_year: ORA_KENNEY_HERBERT_1885_SOURCE.sourceYear,
    source_url: ORA_KENNEY_HERBERT_1885_SOURCE.sourceUrl,
    license: ORA_KENNEY_HERBERT_1885_SOURCE.license,
    body: `## Ingredients\n\n- ingredient ${i}\n- water\n\n## Directions\n\n1. Combine ingredient ${i} with water.\n2. Cook until done.`,
    ...overrides
  };
}
const baseline = Array.from({ length: 100 }, (_, i) => ({ title: `Baseline ${i}`, ingredients: [`baseline ingredient ${i}`] }));
const passInputs = candidateRows => ({candidateRows, baselineRecipes: baseline, rightsDocumented:true, repositoryReusePass:true, attributionClassified:true, editionSemanticsClassified:true});

test("Kenney-Herbert exact 1885 fifth-edition cohort earns bounded measurement only when rights and edition gates pass", () => {
  const rows=Array.from({length:ORA_KENNEY_HERBERT_1885_SOURCE.expectedRecipeCount},(_,i)=>row(i));
  const r=measureOraKenneyHerbert1885Candidate(passInputs(rows));
  assert.equal(r.pass,true); assert.equal(r.terminal,ORA_KENNEY_HERBERT_1885_CANDIDATE_TERMINAL);
  assert.equal(r.baseline.activeProtectedVersion,"v8015"); assert.equal(r.baseline.activeProtectedCount,16510);
  assert.equal(r.candidate.recipeCount,501); assert.equal(r.candidate.digitizedEditionLabel,"5th edition");
  assert.equal(r.candidate.canonicalAuthor,"Arthur Robert Kenney-Herbert");
  assert.equal(r.gates.rightsAuditPass,true); assert.equal(r.nextAuthority,"SOURCE_SPECIFIC_PREWRITE_CAPACITY_MEASUREMENT_ONLY");
});

test("Kenney-Herbert measurement fails closed without edition classification", () => {
  const rows=Array.from({length:ORA_KENNEY_HERBERT_1885_SOURCE.expectedRecipeCount},(_,i)=>row(i));
  const x=passInputs(rows); x.editionSemanticsClassified=false;
  const r=measureOraKenneyHerbert1885Candidate(x);
  assert.equal(r.pass,false); assert.equal(r.terminal,ORA_KENNEY_HERBERT_1885_REJECT_TERMINAL); assert.equal(r.gates.rightsAuditPass,false);
});

test("Kenney-Herbert measurement rejects source identity drift", () => {
  const rows=Array.from({length:ORA_KENNEY_HERBERT_1885_SOURCE.expectedRecipeCount},(_,i)=>row(i,{author:"Different Author"}));
  const r=measureOraKenneyHerbert1885Candidate(passInputs(rows));
  assert.equal(r.pass,false); assert.equal(r.gates.rightsMetadataPass,false); assert.equal(r.gates.rightsAuditPass,false);
});
