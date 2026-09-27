import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  P2_TERMINAL_MACHINE,
  buildP2Measurement,
  validateP2Measurement
} from "../scripts/protected-corpus-p2-metadata-usability-core.mjs";

const readJson=path=>JSON.parse(readFileSync(path,"utf8"));

test("P2 committed exact-source measurement reproduces deterministically",()=>{
  const mapping=readJson("data/generated/corpus-normalization-mapping-v1.json");
  const nutrition=readJson("data/generated/nutrition-vitamin-applicability-audit-v1.json");
  const prep=readJson("config/culinary_quota_gap_parallel_prep_v1.json");
  const p1=readJson("data/generated/protected-corpus-p1-live-owner-canary-v1.json");
  const committed=readJson("data/generated/protected-corpus-p2-metadata-usability-v1.json");
  const rebuilt=buildP2Measurement({mappingSummary:mapping,nutritionSummary:nutrition,prepEvidence:prep,p1Evidence:p1});
  assert.deepEqual(committed,rebuilt);
  assert.deepEqual(validateP2Measurement(committed),[]);
});

test("P2 preserves frozen priority and explicit unknown coverage",()=>{
  const evidence=readJson("data/generated/protected-corpus-p2-metadata-usability-v1.json");
  assert.equal(evidence.terminal,P2_TERMINAL_MACHINE);
  assert.equal(evidence.recipeCount,19268);
  assert.deepEqual(evidence.rankedMetadataBlockers.map(row=>row.dimension),[
    "mealRoles","dishCategory","culinaryTradition","techniqueFamilies","totalMinutes","difficulty",
    "servings","geographyCountry","geographyRegion","prepMinutes","cookMinutes","reviewedDietaryTags"
  ]);
  const row=dimension=>evidence.rankedMetadataBlockers.find(item=>item.dimension===dimension);
  assert.equal(row("mealRoles").authoritativeCount,524);
  assert.equal(row("dishCategory").authoritativeCount,1079);
  assert.equal(row("totalMinutes").authoritativeCount,1371);
  assert.equal(row("totalMinutes").ambiguousCount,45);
  assert.equal(row("difficulty").authoritativeCount,1416);
  assert.equal(row("reviewedDietaryTags").authoritativeCount,0);
  assert.equal(row("culinaryTradition").unknownCount,19268);
  assert.equal(row("techniqueFamilies").unknownCount,19268);
  assert.equal(row("geographyRegion").unknownCount,19268);
});

test("P2 hard-filter diagnostics remain fail-closed and live alignment remains pending",()=>{
  const evidence=readJson("data/generated/protected-corpus-p2-metadata-usability-v1.json");
  const ingredient=evidence.supplementalDiagnostics.ingredientIdentity;
  assert.equal(ingredient.ingredientOccurrenceCount,144245);
  assert.equal(ingredient.exactCanonicalIngredientOccurrences,36760);
  assert.equal(ingredient.unresolvedIngredientOccurrences,107485);
  assert.equal(ingredient.allIngredientIdentityReadyRecipes,112);
  assert.equal(evidence.supplementalDiagnostics.sourceProvenance.authoritativeRecipeCount,19268);
  assert.equal(evidence.machineMeasurement.live500IdAlignmentPerformed,false);
  assert.equal(evidence.machineMeasurement.liveAlignmentRequiredForTerminalP2Closeout,true);
  assert.deepEqual(evidence.boundaries,{
    protectedD1ReadsPerformed:0,
    protectedD1WritesPerformed:0,
    protectedBodiesReadOrExported:0,
    publicRuntimeChanged:false,
    recommendationBehaviorChanged:false,
    recommendationAuthorityWidened:false,
    nutritionAuthorityChanged:false,
    knowledgeCoreWritePerformed:false,
    paidModelOrApiUsed:false,
    thirdShardUsed:false,
    barbecueMutation:false,
    missingMetadataInferred:false
  });
});

test("P2 rejects a corpus or P1 state that is not exact terminal v8018",()=>{
  const mapping=readJson("data/generated/corpus-normalization-mapping-v1.json");
  const nutrition=readJson("data/generated/nutrition-vitamin-applicability-audit-v1.json");
  const prep=readJson("config/culinary_quota_gap_parallel_prep_v1.json");
  const p1=readJson("data/generated/protected-corpus-p1-live-owner-canary-v1.json");
  assert.throws(()=>buildP2Measurement({
    mappingSummary:{...mapping,observedRecipeCount:19267},
    nutritionSummary:nutrition,prepEvidence:prep,p1Evidence:p1
  }),/P2_MAPPING_SUMMARY_NOT_EXACT_V8018/);
  assert.throws(()=>buildP2Measurement({
    mappingSummary:mapping,nutritionSummary:nutrition,prepEvidence:prep,
    p1Evidence:{...p1,terminal:"STOPPED_SAFE"}
  }),/P2_P1_TERMINAL_EVIDENCE_REQUIRED/);
});
