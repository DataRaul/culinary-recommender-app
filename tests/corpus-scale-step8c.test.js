import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import {
  STEP8C_OUTCOMES,
  STEP8C_SOURCE_QUALIFICATION_CONTRACT_VERSION,
  evaluateStep8CPortfolio,
  evaluateStep8CSourceQualification,
  validateStep8CTerminalEvidence
} from "../scripts/corpus-scale-step8c-core.mjs";

const config = JSON.parse(readFileSync(new URL("../config/corpus_scale_step8c_sources.json", import.meta.url), "utf8"));
const unitools = config.sources[0];
const clone = value => JSON.parse(JSON.stringify(value));
const fingerprint = value => createHash("sha256").update(JSON.stringify(value)).digest("hex");

function completeRightsFixture(overrides = {}) {
  const fixture = clone(unitools);
  return {
    ...fixture,
    ...overrides,
    snapshot: { ...fixture.snapshot, ...(overrides.snapshot || {}) },
    rights: { ...fixture.rights, ...(overrides.rights || {}) },
    provenance: { ...fixture.provenance, ...(overrides.provenance || {}) },
    boundaries: { ...fixture.boundaries, ...(overrides.boundaries || {}) }
  };
}

test("Step 8C config and machine contract versions agree", () => {
  assert.equal(config.contractVersion, STEP8C_SOURCE_QUALIFICATION_CONTRACT_VERSION);
  assert.equal(config.sources.length, 1);
});

test("pinned UniTools 1.1.0 snapshot qualifies as protected population input only", () => {
  const result = evaluateStep8CSourceQualification(unitools);
  assert.equal(result.outcome, STEP8C_OUTCOMES.QUALIFIED);
  assert.equal(result.protectedPopulationAllowed, true);
  assert.equal(result.qualifiedRecordCount, 501);
  assert.equal(result.sourceVersion, "1.1.0");
  assert.equal(result.immutableCommit, "1d09e9548d957dd0375301146a86dddf5e269c1b");
  assert.equal(result.dataBlobSha, "a81e96415f09eac7fc0aec94a4da8d9f6d66d9ed");
  assert.equal(result.licenseId, "CC-BY-SA-4.0");
  assert.equal(result.obligations.attributionRequired, true);
  assert.equal(result.obligations.shareAlikeRequired, true);
  assert.equal(result.authority.protectedPopulationInputOnly, true);
  assert.equal(result.authority.publicRuntimeActivationAuthorized, false);
  assert.equal(result.authority.automaticAppAdmissionAuthorized, false);
  assert.equal(result.authority.sourceNutritionAuthoritative, false);
});

test("portfolio terminal is earned from a rights-clean pinned cohort without implying 8D execution", () => {
  const portfolio = evaluateStep8CPortfolio(config.sources);
  assert.equal(portfolio.terminal, "STEP_8C_RIGHTS_CLEAN_SOURCE_COHORT_AVAILABLE");
  assert.deepEqual(portfolio.protectedPopulationInputs, [{
    sourceId: "unitools-world-recipes-v1_1_0",
    recordCount: 501,
    sourceVersion: "1.1.0",
    immutableCommit: "1d09e9548d957dd0375301146a86dddf5e269c1b",
    dataBlobSha: "a81e96415f09eac7fc0aec94a4da8d9f6d66d9ed",
    licenseId: "CC-BY-SA-4.0"
  }]);
});

test("a mutable latest website URL cannot substitute for immutable dataset identity", () => {
  const result = evaluateStep8CSourceQualification(completeRightsFixture({
    snapshot: { mutableLatestUrlUsedAsIdentity: true }
  }));
  assert.equal(result.outcome, STEP8C_OUTCOMES.HOLD);
  assert.equal(result.protectedPopulationAllowed, false);
  assert.ok(result.reasons.includes("MUTABLE_LATEST_URL_CANNOT_BE_SOURCE_IDENTITY"));
});

test("content-level licence and transformation/storage rights are mandatory", () => {
  for (const rights of [
    { contentLevelLicenseExplicit: false },
    { reproductionAllowed: false },
    { transformationAllowed: false },
    { storageAndRehostingAllowed: false },
    { attributionRequirementsRecorded: false },
    { shareAlikeRequirementsRecorded: false }
  ]) {
    const result = evaluateStep8CSourceQualification(completeRightsFixture({ rights }));
    assert.equal(result.outcome, STEP8C_OUTCOMES.HOLD);
    assert.equal(result.protectedPopulationAllowed, false);
  }
});

test("Open Recipe Archive-style modern transformation ambiguity remains held even when base works are public-domain candidates", () => {
  const result = evaluateStep8CSourceQualification(completeRightsFixture({
    id: "open-recipe-archive-spanish-pinned",
    name: "Open Recipe Archive Spanish",
    provenance: {
      materialModernTransformationObserved: true,
      transformationLayerRightsExplicit: false,
      knownUnderlyingThirdPartyRecipeProse: false
    }
  }));
  assert.equal(result.outcome, STEP8C_OUTCOMES.HOLD);
  assert.equal(result.protectedPopulationAllowed, false);
  assert.deepEqual(result.reasons, ["MATERIAL_MODERN_TRANSFORMATION_LAYER_RIGHTS_UNRESOLVED"]);
});

test("RecipeDB-style underlying third-party prose remains cohort-salvage only", () => {
  const result = evaluateStep8CSourceQualification(completeRightsFixture({
    id: "recipedb-whole-source",
    name: "RecipeDB whole source",
    provenance: {
      knownUnderlyingThirdPartyRecipeProse: true,
      recordLevelRightsResolutionRequired: true,
      materialModernTransformationObserved: false,
      transformationLayerRightsExplicit: true
    }
  }));
  assert.equal(result.outcome, STEP8C_OUTCOMES.SALVAGE_ONLY);
  assert.equal(result.protectedPopulationAllowed, false);
  assert.deepEqual(result.reasons, ["UNDERLYING_THIRD_PARTY_RECIPE_PROSE_REQUIRES_RECORD_OR_COHORT_RIGHTS_RESOLUTION"]);
});

test("media, nutrition, dietary/allergen, scaling, public admission and KC authority remain fail-closed", () => {
  const boundaryMutations = [
    { mediaExcluded: false },
    { sourceNutritionAuthoritative: true },
    { sourceDietaryAllergenClaimsAuthoritative: true },
    { sourceScalingRulesPromotedToCanonicalQuantity: true },
    { automaticAppAdmissionAuthorized: true },
    { publicRuntimeActivationAuthorized: true },
    { knowledgeCoreWriteAuthorized: true }
  ];
  for (const boundaries of boundaryMutations) {
    const result = evaluateStep8CSourceQualification(completeRightsFixture({ boundaries }));
    assert.equal(result.outcome, STEP8C_OUTCOMES.HOLD);
    assert.equal(result.protectedPopulationAllowed, false);
  }
});

test("missing or malformed immutable source identity fails closed", () => {
  for (const snapshot of [
    { commit: "main" },
    { dataBlobSha: "not-a-blob" },
    { datasetVersion: "" },
    { recordCount: 0 }
  ]) {
    const result = evaluateStep8CSourceQualification(completeRightsFixture({ snapshot }));
    assert.equal(result.outcome, STEP8C_OUTCOMES.HOLD);
    assert.equal(result.protectedPopulationAllowed, false);
  }
});

test("terminal evidence permits documentary qualification only and rejects infrastructure/public/lane mutation", () => {
  const portfolio = evaluateStep8CPortfolio(config.sources);
  const clean = {
    repositoryOnly: true,
    evidenceFingerprint: fingerprint(config),
    portfolioTerminal: portfolio.terminal,
    corpusPopulationPerformed: false,
    createdRecipeBodyShards: 0,
    publicRuntimeChanged: false,
    billingAuthorizationObserved: false,
    youtubeStateModified: false,
    nutritionBLaneModified: false,
    knowledgeCoreWritePerformed: false
  };
  const pass = validateStep8CTerminalEvidence(clean);
  assert.equal(pass.pass, true);
  assert.equal(pass.terminal, "STEP_8C_RIGHTS_CLEAN_SOURCE_COHORT_AVAILABLE");

  for (const mutation of [
    { repositoryOnly: false },
    { corpusPopulationPerformed: true },
    { createdRecipeBodyShards: 1 },
    { publicRuntimeChanged: true },
    { billingAuthorizationObserved: true },
    { youtubeStateModified: true },
    { nutritionBLaneModified: true },
    { knowledgeCoreWritePerformed: true }
  ]) {
    assert.equal(validateStep8CTerminalEvidence({ ...clean, ...mutation }).pass, false);
  }
});
