import test from "node:test";
import assert from "node:assert/strict";
import {
  ORA_ATRUTEL_1874_CANDIDATE_TERMINAL,
  ORA_ATRUTEL_1874_REJECT_TERMINAL,
  ORA_ATRUTEL_1874_SOURCE,
  measureOraAtrutel1874Candidate
} from "../scripts/corpus-scale-step8g-ora-atrutel-1874-core.mjs";

function row(i, overrides = {}) {
  return {
    title: `Atrutel dish ${i}`,
    slug: `atrutel-dish-${i}`,
    collection: ORA_ATRUTEL_1874_SOURCE.collection,
    source_title: ORA_ATRUTEL_1874_SOURCE.sourceTitle,
    author: ORA_ATRUTEL_1874_SOURCE.sourceAuthor,
    source_year: ORA_ATRUTEL_1874_SOURCE.sourceYear,
    source_url: ORA_ATRUTEL_1874_SOURCE.sourceUrl,
    license: ORA_ATRUTEL_1874_SOURCE.license,
    body: `## Ingredients\n\n- ingredient ${i}\n- water\n\n## Directions\n\n1. Combine ingredient ${i} with water.\n2. Cook until done.`,
    ...overrides
  };
}
const baseline=Array.from({length:100},(_,i)=>({title:`Baseline ${i}`,ingredients:[`baseline ingredient ${i}`]}));
const passInputs=candidateRows=>({
  candidateRows,
  baselineRecipes:baseline,
  rightsDocumented:true,
  repositoryReusePass:true,
  attributionClassified:true,
  exactEditionClassified:true,
  authorTermClassified:true,
  exactSourcePublicDomainClassified:true
});

test("Atrutel exact 1874 cohort earns bounded measurement only when all rights gates pass",()=>{
  const rows=Array.from({length:ORA_ATRUTEL_1874_SOURCE.expectedRecipeCount},(_,i)=>row(i));
  const r=measureOraAtrutel1874Candidate(passInputs(rows));
  assert.equal(r.pass,true);
  assert.equal(r.terminal,ORA_ATRUTEL_1874_CANDIDATE_TERMINAL);
  assert.equal(r.baseline.activeProtectedVersion,"v8017");
  assert.equal(r.baseline.activeProtectedCount,18787);
  assert.equal(r.candidate.recipeCount,481);
  assert.equal(r.candidate.digitizedEditionYear,"1874");
  assert.equal(r.candidate.authorDeathYear,"1884");
  assert.equal(r.gates.rightsAuditPass,true);
  assert.equal(r.nextAuthority,"SOURCE_SPECIFIC_PREWRITE_CAPACITY_MEASUREMENT_ONLY");
});

test("Atrutel measurement fails closed without author-term classification",()=>{
  const rows=Array.from({length:ORA_ATRUTEL_1874_SOURCE.expectedRecipeCount},(_,i)=>row(i));
  const x=passInputs(rows); x.authorTermClassified=false;
  const r=measureOraAtrutel1874Candidate(x);
  assert.equal(r.pass,false);
  assert.equal(r.terminal,ORA_ATRUTEL_1874_REJECT_TERMINAL);
  assert.equal(r.gates.rightsAuditPass,false);
});

test("Atrutel measurement fails closed without independent exact-source public-domain classification",()=>{
  const rows=Array.from({length:ORA_ATRUTEL_1874_SOURCE.expectedRecipeCount},(_,i)=>row(i));
  const x=passInputs(rows); x.exactSourcePublicDomainClassified=false;
  const r=measureOraAtrutel1874Candidate(x);
  assert.equal(r.pass,false);
  assert.equal(r.gates.exactSourcePublicDomainClassified,false);
  assert.equal(r.gates.rightsAuditPass,false);
});

test("Atrutel measurement rejects source identity drift",()=>{
  const rows=Array.from({length:ORA_ATRUTEL_1874_SOURCE.expectedRecipeCount},(_,i)=>row(i,{author:"Mrs. J. Atrutel"}));
  const r=measureOraAtrutel1874Candidate(passInputs(rows));
  assert.equal(r.pass,false);
  assert.equal(r.gates.rightsMetadataPass,false);
  assert.equal(r.gates.rightsAuditPass,false);
});
