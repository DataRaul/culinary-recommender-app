import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const validator = new URL("../scripts/validate-recipe-family-source-compliance.mjs", import.meta.url);
const config = JSON.parse(readFileSync(new URL("../config/recipe_family_synthesis_p0.json", import.meta.url), "utf8"));

function runObservation(source) {
  const dir = mkdtempSync(join(tmpdir(), "recipe-family-source-compliance-"));
  const input = join(dir, "observations.json");
  writeFileSync(input, JSON.stringify({ observations: [{ observationId: "test-observation", source }] }));
  const result = spawnSync(process.execPath, [validator.pathname, input], { encoding: "utf8" });
  rmSync(dir, { recursive: true, force: true });
  return result;
}

const base = {
  publisher: "Example Publisher",
  url: "https://example.invalid/recipe",
  accessedAt: "2026-09-17T12:00:00Z",
  independenceGroup: "example-1",
  publisherLedgerKey: "example-publisher",
  lawfulAccess: "YES",
  termsState: "NO_RELEVANT_RESTRICTION_FOUND",
  termsCheckedAt: "2026-09-17T12:00:00Z",
  reuseBasis: "STANDARD_COPYRIGHT",
  databaseExtractionRisk: "LOW",
  cumulativeExtractionRisk: "LOW",
  role: "STRUCTURE_EVIDENCE",
  sourceExpressionPersisted: false,
  rawExpressionRetention: "NONE",
  publicAttributionRequirement: "NOT_REQUIRED",
  publicAttributionState: "NOT_APPLICABLE"
};

test("bounded manual evidence does not require a TDM reservation field", () => {
  const result = runObservation({
    ...base,
    acquisitionMode: "MANUAL_REVIEW",
    termsState: "PROHIBITS_AUTOMATION"
  });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).terminalCandidate, "RECIPE_FAMILY_SOURCE_COMPLIANCE_PASS");
});

test("automated TDM passes only with current reservation evidence and low extraction risk", () => {
  const result = runObservation({
    ...base,
    acquisitionMode: "AUTOMATED_TDM",
    tdmReservation: "NONE_FOUND",
    tdmReservationCheckedAt: "2026-09-17T12:00:00Z",
    tdmReservationEvidence: "page, terms and available machine-readable reservation surfaces checked",
    rawExpressionRetention: "TEMPORARY_DELETE_AFTER_NORMALIZATION"
  });
  assert.equal(result.status, 0, result.stderr);
});

test("automated TDM fails closed when rights are expressly reserved", () => {
  const result = runObservation({
    ...base,
    acquisitionMode: "AUTOMATED_TDM",
    tdmReservation: "EXPRESSLY_RESERVED",
    tdmReservationCheckedAt: "2026-09-17T12:00:00Z",
    tdmReservationEvidence: "express reservation found",
    rawExpressionRetention: "TEMPORARY_DELETE_AFTER_NORMALIZATION"
  });
  assert.notEqual(result.status, 0);
  const failure = JSON.parse(result.stderr);
  assert.equal(failure.error, "RECIPE_FAMILY_SOURCE_COMPLIANCE_FAIL");
  assert.ok(failure.errors.some((entry) => entry.includes("tdmReservation=NONE_FOUND")));
});

test("DO_NOT_USE and unknown reuse basis cannot enter an eligible packet", () => {
  const result = runObservation({
    ...base,
    acquisitionMode: "MANUAL_REVIEW",
    role: "DO_NOT_USE",
    reuseBasis: "UNKNOWN"
  });
  assert.notEqual(result.status, 0);
  const failure = JSON.parse(result.stderr);
  assert.ok(failure.errors.some((entry) => entry.includes("DO_NOT_USE")));
  assert.ok(failure.errors.some((entry) => entry.includes("reuseBasis=UNKNOWN")));
});

test("reusable content with required attribution passes only when attribution is ready", () => {
  const result = runObservation({
    ...base,
    acquisitionMode: "LICENSED_REUSE",
    reuseBasis: "OPEN_LICENCE",
    role: "REUSABLE_CONTENT",
    publicAttributionRequirement: "REQUIRED",
    publicAttributionState: "READY",
    attributionLabel: "Example Creator — Example Source",
    attributionLicenseOrBasis: "CC BY-SA 4.0"
  });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).attributionRequiredObservations, 1);
});

test("required but unsatisfiable public attribution fails closed", () => {
  const result = runObservation({
    ...base,
    acquisitionMode: "LICENSED_REUSE",
    reuseBasis: "OPEN_LICENCE",
    role: "REUSABLE_CONTENT",
    publicAttributionRequirement: "REQUIRED",
    publicAttributionState: "UNSATISFIABLE"
  });
  assert.notEqual(result.status, 0);
  const failure = JSON.parse(result.stderr);
  assert.ok(failure.errors.some((entry) => entry.includes("required public attribution must be READY")));
  assert.ok(failure.errors.some((entry) => entry.includes("unsatisfiable")));
});

test("unknown public attribution obligation fails closed until classified", () => {
  const result = runObservation({
    ...base,
    acquisitionMode: "MANUAL_REVIEW",
    publicAttributionRequirement: "UNKNOWN",
    publicAttributionState: "UNKNOWN"
  });
  assert.notEqual(result.status, 0);
  const failure = JSON.parse(result.stderr);
  assert.ok(failure.errors.some((entry) => entry.includes("publicAttributionRequirement=UNKNOWN")));
});

test("machine contract freezes no-scraping, one-time family collection, YouTube evidence boundaries and 100k rights distinction", () => {
  assert.equal(config.contractVersion, "0.3.0");
  assert.equal(config.acquisitionPolicy.genericWebScrapingAuthorized, false);
  assert.equal(config.acquisitionPolicy.genericWebCrawlingAuthorized, false);
  assert.equal(config.acquisitionPolicy.accessControlCircumventionAuthorized, false);
  assert.equal(config.sourceTarget.collectionCadence, "ONE_TIME_BASELINE_PER_FAMILY");
  assert.equal(config.sourceTarget.scheduledRefreshAuthorized, false);
  assert.equal(config.prototypeBeforeExpansion.scheduledRefresh, false);
  assert.equal(config.youtubeEvidencePolicy.defaultRole, "EVIDENCE_ONLY");
  assert.equal(config.youtubeEvidencePolicy.automatedYouTubeWebsiteScrapingAuthorized, false);
  assert.equal(config.youtubeEvidencePolicy.unofficialTranscriptScrapingOrDownloadingAuthorized, false);
  assert.equal(config.largeCorpusRelationship.scaleArchitecture, "100K_READY_NOT_100K_RIGHTS_PROMISE");
  assert.equal(config.largeCorpusRelationship.primaryLargeCorpusCandidate.recordedRecipes, 54843);
  assert.equal(config.largeCorpusRelationship.recipeDb.recordedRecipes, 118171);
  assert.equal(config.largeCorpusRelationship.recipeDb.state, "SALVAGE_ONLY_NOT_AUTOMATICALLY_REUSABLE");
  assert.equal(config.publicRepositoryFirewall.gatedRuntimeDoesNotCurePublicRepositoryDisclosure, true);
  assert.equal(config.attributionGate.requiredButCannotDiscloseOutcome, "REJECT_PUBLIC_OR_REUSABLE_USE");
});
