import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { ALL_RECIPES, ACTIVATED_EXTERNAL_RECIPES, PUBLIC_RUNTIME_RECIPES } from "../src/data/corpus-v1.js";

const roadmap = JSON.parse(readFileSync(new URL("../config/corpus_scale_step8_roadmap.json", import.meta.url), "utf8"));
const evidence = JSON.parse(readFileSync(new URL("../data/generated/step8g/ora-turabi-1864-measurement.json", import.meta.url), "utf8"));
const gate = id => roadmap.gates.find(row => row.id === id);

test("Turabi 1864 measurement PASS is frozen with exact artifact-backed metrics", () => {
  assert.equal(evidence.pass, true);
  assert.equal(evidence.terminal, "STEP_8G_ORA_TURABI_EFENDI_1864_MEASUREMENT_EARNED_COHORT_CANDIDATE");
  assert.equal(evidence.workflowRun, 35035941153);
  assert.equal(evidence.artifactId, 10423296747);
  assert.equal(evidence.artifactDigest, "sha256:aaa2744a3ac86acb1f67696a4459f2bb2f6773bdebe8d3d92a5acca98f706e60");
  assert.equal(evidence.baseline.expectedActiveProtectedVersion, "v8005");
  assert.equal(evidence.baseline.protectedComposedRecipeCount, 2464);
  assert.equal(evidence.candidate.recipeCount, 442);
  assert.equal(evidence.candidate.parseableRecipeCount, 442);
  assert.equal(evidence.candidate.parseableRecipeRatio, 1);
  assert.equal(evidence.candidate.distinctNormalizedTitles, 367);
  assert.equal(evidence.candidate.uniqueTitleRatio, 0.830316742081448);
  assert.equal(evidence.candidate.exactBaselineTitleOverlapCount, 0);
  assert.equal(evidence.candidate.novelNormalizedTitleCount, 367);
  assert.equal(evidence.candidate.novelTitleRatio, 1);
  assert.equal(evidence.candidate.distinctIngredientPhraseCount, 946);
  assert.equal(evidence.candidate.novelIngredientPhraseCount, 778);
  assert.equal(evidence.candidate.ontologyResolvedOccurrenceRatio, 0.265271105010295);
  assert.equal(evidence.candidate.ontologyResolvedCanonicalIngredientCount, 28);
  assert.equal(evidence.candidate.ontologyUnresolvedPhraseCount, 913);
  for (const key of ["rightsDocumented","exactCountPass","rightsMetadataPass","rightsAuditPass","structuralQualityPass","culinaryCoveragePass"]) {
    assert.equal(evidence.gates[key], true, key);
  }
});

test("Turabi measurement advances only the next Step 8G iteration while v8005 stays live", () => {
  const g = gate("8G");
  assert.equal(g.status, "ACTIVE_LIVE_PASS_CONTINUED_PROTECTED_SCALE_LOOP");
  assert.equal(g.latestIteration.finalProtectedActiveVersion, "v8005");
  assert.equal(g.latestIteration.composedRecipeCount, 2464);
  assert.equal(g.latestIteration.liveTerminal, "STEP_8G_ORA_BOSSE_WATANNA_V8005_PROTECTED_POPULATION_PASS");
  assert.equal(g.nextIteration.status, "MEASUREMENT_PASS_PREWRITE_EARNED");
  assert.equal(g.nextIteration.candidate, "ORA_TURABI_EFENDI_1864_OTTOMAN_SHELF_AE3BD2C");
  assert.equal(g.nextIteration.measurementTerminal, evidence.terminal);
  assert.equal(g.nextIteration.measurementRecipeCount, 442);
  assert.equal(g.nextIteration.nextAction, "DESIGN_V8006_PREWRITE_CAPACITY_GATE");
  assert.equal(g.nextIteration.plannedParentVersion, "v8005");
  assert.equal(g.nextIteration.plannedParentRecipeCount, 2464);
  assert.equal(g.nextIteration.plannedChildRecipeCount, 442);
  assert.equal(g.nextIteration.plannedComposedRecipeCount, 2906);
  assert.equal(roadmap.currentHumanGate.id, "NONE");
});

test("Turabi measurement creates no live, public, topology, budget or adjacent-lane authority", () => {
  for (const key of ["liveD1WritesAuthorized","protectedPopulationAuthorized","publicRuntimeChangeAuthorized","recommendationAdmissionAuthorized","thirdShardAuthorized","d1BudgetExpansionAuthorized","billingExpansionAuthorized","nutritionAuthorityImported","culturalAuthenticityAuthorityImported","knowledgeCoreWriteAuthorized"]) {
    assert.equal(evidence.boundaries[key], false, key);
  }
  assert.equal(evidence.interpretation.prewriteEarned, true);
  assert.equal(evidence.interpretation.liveProtectedPopulationAuthorized, false);
  assert.equal(evidence.interpretation.recommendationAdmissionAuthorized, false);
  assert.equal(gate("8G").nextIteration.publicRuntimeChangeAuthorized, false);
  assert.equal(gate("8G").nextIteration.recommendationAdmissionAuthorized, false);
  assert.equal(gate("8G").nextIteration.thirdShardAuthorized, false);
  assert.equal(gate("8G").nextIteration.d1BudgetExpansionAuthorized, false);
  assert.equal(gate("8G").nextIteration.billingExpansionAuthorized, false);
  assert.equal(ALL_RECIPES.length, 84);
  assert.equal(ACTIVATED_EXTERNAL_RECIPES.length, 1);
  assert.equal(PUBLIC_RUNTIME_RECIPES.length, 85);
});
