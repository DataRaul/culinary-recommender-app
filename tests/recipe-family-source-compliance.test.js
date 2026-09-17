import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const validator = new URL("../scripts/validate-recipe-family-source-compliance.mjs", import.meta.url);

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
  rawExpressionRetention: "NONE"
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
