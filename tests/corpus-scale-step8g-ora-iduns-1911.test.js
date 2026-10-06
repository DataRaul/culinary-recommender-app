import test from "node:test";
import assert from "node:assert/strict";

import {
  ORA_IDUNS_1911_CANDIDATE_TERMINAL,
  ORA_IDUNS_1911_REJECT_TERMINAL,
  ORA_IDUNS_1911_SOURCE,
  measureOraIduns1911Candidate
} from "../scripts/corpus-scale-step8g-ora-iduns-1911-core.mjs";

const discovery={
  baseline:{activeProtectedVersion:"v8018",activeProtectedCount:19268}
};
const candidate={
  collection:ORA_IDUNS_1911_SOURCE.collection,
  sourceUrl:ORA_IDUNS_1911_SOURCE.sourceUrl,
  sourceTitle:ORA_IDUNS_1911_SOURCE.sourceTitle,
  sourceAuthor:ORA_IDUNS_1911_SOURCE.sourceAuthor,
  sourceYear:ORA_IDUNS_1911_SOURCE.sourceYear,
  licenseId:ORA_IDUNS_1911_SOURCE.license,
  recipeCount:2818,
  parseableRecipeCount:2818,
  parseableRecipeRatio:1,
  structuralPass:true,
  acquisitionValuePass:true,
  distinctNormalizedTitles:1762,
  uniqueTitleRatio:0.6252661462029808,
  exactBaselineTitleOverlapCount:5,
  novelNormalizedTitleCount:1757,
  novelTitleRatio:0.9971623155505108,
  distinctIngredientPhraseCount:2500,
  novelIngredientPhraseCount:1000,
  ontologyResolvedOccurrenceRatio:0.2,
  ontologyResolvedCanonicalIngredientCount:100,
  ontologyUnresolvedPhraseCount:2000
};

const passInputs=()=>({
  discovery,
  candidate,
  rightsDocumented:true,
  repositoryReusePass:true,
  attributionClassified:true,
  exactEditionClassified:true,
  authorTermClassified:true,
  independentExactSourceClassified:true
});

test("Iduns 1911 earns acquisition measurement only when exact rights and structural gates pass",()=>{
  const r=measureOraIduns1911Candidate(passInputs());
  assert.equal(r.pass,true);
  assert.equal(r.terminal,ORA_IDUNS_1911_CANDIDATE_TERMINAL);
  assert.equal(r.baseline.activeProtectedVersion,"v8018");
  assert.equal(r.baseline.activeProtectedCount,19268);
  assert.equal(r.candidate.recipeCount,2818);
  assert.equal(r.candidate.digitizedEditionLabel,"1911 first edition");
  assert.equal(r.candidate.authorDeathYear,"1933");
  assert.equal(r.gates.rightsAuditPass,true);
  assert.equal(r.gates.acquisitionValuePass,true);
  assert.equal(r.nextAuthority,"SOURCE_SPECIFIC_PREWRITE_CAPACITY_MEASUREMENT_ONLY");
});

test("Iduns 1911 fails closed when author-term evidence is absent",()=>{
  const x=passInputs();
  x.authorTermClassified=false;
  const r=measureOraIduns1911Candidate(x);
  assert.equal(r.pass,false);
  assert.equal(r.terminal,ORA_IDUNS_1911_REJECT_TERMINAL);
  assert.equal(r.gates.rightsAuditPass,false);
});

test("Iduns 1911 rejects source identity drift",()=>{
  const x=passInputs();
  x.candidate={...candidate,sourceAuthor:"Different Author"};
  const r=measureOraIduns1911Candidate(x);
  assert.equal(r.pass,false);
  assert.equal(r.gates.rightsMetadataPass,false);
});

test("Iduns 1911 uses absolute acquisition value and does not require the historical 0.8 unique-title ratio",()=>{
  const r=measureOraIduns1911Candidate(passInputs());
  assert.ok(r.candidate.uniqueTitleRatio<0.8);
  assert.equal(r.gates.acquisitionValuePass,true);
  assert.equal(r.pass,true);
});

test("Iduns 1911 measurement never authorizes population or recommendation changes",()=>{
  const r=measureOraIduns1911Candidate(passInputs());
  assert.equal(r.boundaries.liveD1WritesPerformed,0);
  assert.equal(r.boundaries.protectedPopulationAuthorized,false);
  assert.equal(r.boundaries.recommendationAdmissionAuthorized,false);
  assert.equal(r.boundaries.thirdShardAuthorized,false);
  assert.equal(r.boundaries.billingExpansionAuthorized,false);
});
