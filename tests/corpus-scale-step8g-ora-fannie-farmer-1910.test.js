import test from "node:test";
import assert from "node:assert/strict";
import {
  ORA_FANNIE_FARMER_1910_CANDIDATE_TERMINAL,
  ORA_FANNIE_FARMER_1910_REJECT_TERMINAL,
  ORA_FANNIE_FARMER_1910_SOURCE,
  measureOraFannieFarmer1910Candidate
} from "../scripts/corpus-scale-step8g-ora-fannie-farmer-1910-core.mjs";

function row(i, overrides = {}) {
  return {
    title: `Fannie Farmer dish ${i}`, slug: `fannie-farmer-dish-${i}`,
    collection: ORA_FANNIE_FARMER_1910_SOURCE.collection,
    source_title: ORA_FANNIE_FARMER_1910_SOURCE.sourceTitle,
    author: ORA_FANNIE_FARMER_1910_SOURCE.sourceAuthor,
    source_year: ORA_FANNIE_FARMER_1910_SOURCE.sourceYear,
    source_url: ORA_FANNIE_FARMER_1910_SOURCE.sourceUrl,
    license: ORA_FANNIE_FARMER_1910_SOURCE.license,
    body: `## Ingredients\n\n- ingredient ${i}\n- water\n\n## Directions\n\n1. Combine ingredient ${i} with water.\n2. Cook until done.`,
    ...overrides
  };
}
const baseline = Array.from({ length: 100 }, (_, i) => ({ title: `Baseline ${i}`, ingredients: [`baseline ingredient ${i}`] }));
const passInputs = candidateRows => ({
  candidateRows, baselineRecipes: baseline, rightsDocumented:true, repositoryReusePass:true,
  attributionClassified:true, editionSemanticsClassified:true, exactSourcePublicDomainClassified:true
});

test("Fannie Farmer exact PG65061 cohort earns bounded measurement only when rights and 1910 edition gates pass", () => {
  const rows=Array.from({length:ORA_FANNIE_FARMER_1910_SOURCE.expectedRecipeCount},(_,i)=>row(i));
  const r=measureOraFannieFarmer1910Candidate(passInputs(rows));
  assert.equal(r.pass,true); assert.equal(r.terminal,ORA_FANNIE_FARMER_1910_CANDIDATE_TERMINAL);
  assert.equal(r.baseline.activeProtectedVersion,"v8016"); assert.equal(r.baseline.activeProtectedCount,17011);
  assert.equal(r.candidate.recipeCount,1776); assert.equal(r.candidate.workFirstPublicationYear,"1896");
  assert.equal(r.candidate.digitizedEditionYear,"1910");
  assert.equal(r.candidate.projectGutenbergEbookNumber,"65061");
  assert.equal(r.gates.rightsAuditPass,true); assert.equal(r.nextAuthority,"SOURCE_SPECIFIC_PREWRITE_CAPACITY_MEASUREMENT_ONLY");
});

test("Fannie Farmer measurement fails closed without exact 1910 edition classification", () => {
  const rows=Array.from({length:ORA_FANNIE_FARMER_1910_SOURCE.expectedRecipeCount},(_,i)=>row(i));
  const x=passInputs(rows); x.editionSemanticsClassified=false;
  const r=measureOraFannieFarmer1910Candidate(x);
  assert.equal(r.pass,false); assert.equal(r.terminal,ORA_FANNIE_FARMER_1910_REJECT_TERMINAL); assert.equal(r.gates.rightsAuditPass,false);
});

test("Fannie Farmer measurement fails closed without independent exact-source public-domain classification", () => {
  const rows=Array.from({length:ORA_FANNIE_FARMER_1910_SOURCE.expectedRecipeCount},(_,i)=>row(i));
  const x=passInputs(rows); x.exactSourcePublicDomainClassified=false;
  const r=measureOraFannieFarmer1910Candidate(x);
  assert.equal(r.pass,false); assert.equal(r.gates.exactSourcePublicDomainClassified,false); assert.equal(r.gates.rightsAuditPass,false);
});

test("Fannie Farmer measurement rejects source identity drift", () => {
  const rows=Array.from({length:ORA_FANNIE_FARMER_1910_SOURCE.expectedRecipeCount},(_,i)=>row(i,{source_year:"1910"}));
  const r=measureOraFannieFarmer1910Candidate(passInputs(rows));
  assert.equal(r.pass,false); assert.equal(r.gates.rightsMetadataPass,false); assert.equal(r.gates.rightsAuditPass,false);
});
