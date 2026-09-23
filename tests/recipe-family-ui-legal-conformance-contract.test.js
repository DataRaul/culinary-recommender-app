import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const contractUrl = new URL("../config/recipe_family_ui_legal_conformance_gate.json", import.meta.url);
const roadmapUrl = new URL("../docs/RECIPE_FAMILY_SYNTHESIS_ROADMAP_GATE.md", import.meta.url);

const contract = JSON.parse(readFileSync(contractUrl, "utf8"));
const roadmap = readFileSync(roadmapUrl, "utf8");

test("UI legal conformance is triggered by the real candidate and still blocks public/reusable admission", () => {
  assert.equal(contract.state, "TRIGGERED_REAL_CANDIDATE_IMPLEMENTATION_VALIDATION_PENDING");
  assert.equal(contract.trigger.event, "FIRST_REAL_APP_AUTHORING_CANDIDATE_WITH_CLASSIFIED_SOURCE_RIGHTS_AND_ATTRIBUTION");
  assert.equal(contract.trigger.doNotRunBeforeUsefulObjectsExist, true);
  assert.ok(contract.blockingBefore.includes("PUBLIC_OR_REUSABLE_RECIPE_ADMISSION"));
});

test("real candidate objects are authoritative fixtures and negative fixtures remain fail-closed", () => {
  assert.equal(contract.fixturePolicy.useRealCandidateObjectsWhereAvailable, true);
  assert.equal(contract.fixturePolicy.syntheticNegativeFixturesRequired, true);
  for (const field of [
    "candidate_app_owned_recipe_projection",
    "source_compliance_report",
    "provenance",
    "attribution_requirements",
    "publicAttributionRequirement",
    "publicAttributionState",
    "reuseBasis"
  ]) {
    assert.ok(contract.authoritativeInputs.includes(field), `missing authoritative input ${field}`);
  }
});

test("required and unknown attribution states cannot degrade into public rendering", () => {
  const cases = new Map(contract.requiredCases.map(item => [item.case, item.expected]));
  assert.equal(cases.get("ATTRIBUTION_REQUIRED_UNSATISFIABLE"), "FAIL_CLOSED_NO_PUBLIC_OR_REUSABLE_RENDER");
  assert.equal(cases.get("ATTRIBUTION_UNKNOWN"), "FAIL_CLOSED_NO_PUBLIC_OR_REUSABLE_RENDER");
  assert.equal(contract.terminalStates.pass, "RECIPE_FAMILY_UI_LEGAL_CONFORMANCE_PASS");
  assert.equal(contract.terminalStates.fail, "RECIPE_FAMILY_UI_LEGAL_CONFORMANCE_FAIL_CLOSED");
});

test("gate requires renderer, browser, negative and public-runtime evidence", () => {
  for (const layer of [
    "OBJECT_SCHEMA_AND_GATE_VALIDATION",
    "ATTRIBUTION_RENDERER_UNIT_TEST",
    "BROWSER_ACCEPTANCE_WITH_REAL_CANDIDATE_OBJECTS",
    "NEGATIVE_BROWSER_FIXTURES",
    "PUBLIC_RUNTIME_FAIL_CLOSED_ASSERTION"
  ]) {
    assert.ok(contract.testLayers.includes(layer), `missing test layer ${layer}`);
  }
  assert.match(roadmap, /UI legal-conformance gate.*REAL HUMMUS CANDIDATE \/ PR VALIDATION PENDING/s);
  assert.match(roadmap, /UI legal-conformance PASS on real candidate objects/);
  assert.equal(contract.currentRealCandidate.projectionId, "recipe_family_p0_hummus_candidate_v1");
  assert.equal(contract.currentRealCandidate.publicRuntimeAdmissionAuthorized, false);
  assert.equal(contract.nextOnPass, "RECIPE_FAMILY_10_FAMILY_BOUNDED_EXPANSION_NONPUBLIC");
});


test("committed real-candidate evidence freezes PASS without public admission", () => {
  const evidence = JSON.parse(readFileSync(new URL("../data/generated/recipe-family-ui-legal-conformance-v1.json", import.meta.url), "utf8"));
  assert.equal(evidence.pass, true);
  assert.equal(evidence.terminal, "RECIPE_FAMILY_UI_LEGAL_CONFORMANCE_PASS");
  assert.equal(evidence.realCandidate.projectionId, "recipe_family_p0_hummus_candidate_v1");
  assert.equal(evidence.realCandidate.attributionNoticeCount, 5);
  assert.ok(evidence.realCandidate.distinctSourceClassCount >= 4);
  assert.equal(evidence.negativeCases.attributionRequiredUnsatisfiableFailClosed, true);
  assert.equal(evidence.negativeCases.attributionUnknownFailClosed, true);
  assert.equal(evidence.negativeCases.protectedEvidenceExpressionLeakCount, 0);
  assert.equal(evidence.publicRuntime.admissionAuthorizedByThisGate, false);
  assert.equal(evidence.publicRuntime.recipeCountChanged, false);
  assert.equal(evidence.nextPrimaryAction, "RECIPE_FAMILY_10_FAMILY_BOUNDED_EXPANSION_NONPUBLIC");
});
