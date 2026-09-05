import test from "node:test";
import assert from "node:assert/strict";

import { ALL_RECIPES } from "../src/data/corpus-v1.js";
import {
  IDENTITY_VERIFIER_CONTRACT,
  OWNER_BOOTSTRAP_CONTRACT,
  SESSION_CONTRACT,
  STEP7A_BUDGETS,
  STEP7A_TARGETS,
  authorizeExactInvite,
  authorizeSessionState,
  buildStep7AModel,
  estimatePackedPostingRowBytes,
  evaluateStep7AAcceptance,
  isGoogleAuthoritativeEmail,
  normalizeInviteEmail,
  recipeDatabaseShardForId,
  validateFutureDeploymentSeparation,
  verifyGoogleIdentityEnvelope
} from "../scripts/corpus-scale-step7a-core.mjs";

const NOW = 2_000_000_000;

function validGoogleClaims(overrides = {}) {
  return {
    iss: "https://accounts.google.com",
    aud: "culinary-client",
    exp: NOW + 3600,
    sub: "google-subject-123",
    email: "invited.owner@gmail.com",
    email_verified: true,
    ...overrides
  };
}

function acceptanceFixture() {
  const base = buildStep7AModel(ALL_RECIPES, 1_000, { repetitions: 1 });
  return STEP7A_TARGETS.map(targetSize => ({
    ...base,
    targetSize,
    storage: {
      ...base.storage,
      totalEstimatedBytes: 512 * 1024 * 1024,
      recipeShardBytes: Array(8).fill(60 * 1024 * 1024),
      controlDatabaseBytes: 20 * 1024 * 1024,
      maxIndexArtifactRowBytes: targetSize === 250_000 ? 1_000_512 : 700_512,
      databaseSlotsUsed: 9,
      databaseSlotsReserved: 1
    }
  }));
}

test("Step 7A keeps 170k required capacity and 250k stress in the canonical scale ladder", () => {
  assert.deepEqual(STEP7A_TARGETS, [1_000, 10_000, 50_000, 100_000, 170_000, 250_000]);
});

test("D1 recipe sharding is deterministic and bounded to eight recipe databases", () => {
  const ids = ["recipe-a", "recipe-b", "recipe-c", "recipe-a"];
  const shards = ids.map(recipeDatabaseShardForId);
  assert.equal(shards[0], shards[3]);
  assert.ok(shards.every(shard => Number.isInteger(shard) && shard >= 0 && shard < 8));
});

test("packed ordinal postings stay below the internal 1 MiB row budget at 250k", () => {
  assert.equal(estimatePackedPostingRowBytes(250_000), 1_000_512);
  assert.ok(estimatePackedPostingRowBytes(250_000) <= STEP7A_BUDGETS.maxIndexArtifactRowBytes);
  assert.ok(STEP7A_BUDGETS.maxIndexArtifactRowBytes < STEP7A_BUDGETS.maxProviderRowOrBlobBytes);
});

test("protected Step 7A query shape remains bounded without full scans", () => {
  const model = buildStep7AModel(ALL_RECIPES, 10_000, { repetitions: 1 });
  assert.ok(model.storage.databaseSlotsUsed + model.storage.databaseSlotsReserved <= 10);
  assert.equal(model.storage.databaseSlotsReserved, 1);
  assert.ok(model.queries.length > 0);
  for (const query of model.queries) {
    assert.ok(query.boundedCandidateCount <= 256);
    assert.ok(query.d1Subqueries <= 16);
    assert.equal(query.fullCorpusScan, false);
    assert.ok(query.rowsRead <= 261);
  }
});

test("future protected corpus and index paths fail closed if placed on public Pages assets", () => {
  const safe = validateFutureDeploymentSeparation({
    publicAssets: ["index.html", "styles.css", "src/app-shell.js"],
    protectedArtifacts: ["protected/corpus-manifest", "runtime-indexes/cuisine/spanish"]
  });
  assert.equal(safe.pass, true);

  const unsafe = validateFutureDeploymentSeparation({
    publicAssets: ["index.html", "runtime-indexes/cuisine/spanish"],
    protectedArtifacts: ["runtime-indexes/cuisine/spanish"]
  });
  assert.equal(unsafe.pass, false);
  assert.ok(unsafe.violations.length >= 1);
});

test("Google identity envelope requires verified signature, correct audience and Google-authoritative email", () => {
  const valid = verifyGoogleIdentityEnvelope({
    claims: validGoogleClaims(),
    expectedAudience: "culinary-client",
    signatureVerified: true,
    nowEpochSeconds: NOW
  });
  assert.equal(valid.pass, true);
  assert.equal(valid.identity.email, "invited.owner@gmail.com");

  const unverifiedSignature = verifyGoogleIdentityEnvelope({
    claims: validGoogleClaims(),
    expectedAudience: "culinary-client",
    signatureVerified: false,
    nowEpochSeconds: NOW
  });
  assert.equal(unverifiedSignature.pass, false);
  assert.ok(unverifiedSignature.reasons.includes("SIGNATURE_NOT_VERIFIED"));

  const thirdPartyEmail = validGoogleClaims({ email: "owner@example.com", hd: undefined });
  assert.equal(isGoogleAuthoritativeEmail(thirdPartyEmail), false);
  const thirdParty = verifyGoogleIdentityEnvelope({
    claims: thirdPartyEmail,
    expectedAudience: "culinary-client",
    signatureVerified: true,
    nowEpochSeconds: NOW
  });
  assert.equal(thirdParty.pass, false);
  assert.ok(thirdParty.reasons.includes("GOOGLE_NOT_AUTHORITATIVE_FOR_EMAIL"));

  const workspace = validGoogleClaims({ email: "owner@company.example", hd: "company.example" });
  assert.equal(isGoogleAuthoritativeEmail(workspace), true);
});

test("exact invitation is distinct from authentication and subject binding is fail closed", () => {
  const identity = {
    provider: "google",
    issuer: "https://accounts.google.com",
    subject: "google-subject-123",
    email: "invited.owner@gmail.com"
  };
  const allowlist = [{
    accountId: "acct-1",
    email: "Invited.Owner@GMAIL.com",
    provider: "google",
    subject: "google-subject-123",
    enabled: true
  }];
  assert.equal(normalizeInviteEmail(allowlist[0].email), "invited.owner@gmail.com");
  assert.equal(authorizeExactInvite(identity, allowlist).pass, true);
  assert.equal(authorizeExactInvite({ ...identity, subject: "attacker" }, allowlist).pass, false);
  assert.equal(authorizeExactInvite({ ...identity, email: "someone.else@gmail.com" }, allowlist).pass, false);
});

test("revocation and session-version change invalidate protected sessions", () => {
  const session = { accountId: "acct-1", accountVersion: 4, exp: NOW + 1000 };
  const active = { accountId: "acct-1", version: 4, enabled: true };
  assert.equal(authorizeSessionState({ session, account: active, nowEpochSeconds: NOW }).pass, true);
  assert.equal(authorizeSessionState({ session, account: { ...active, enabled: false }, nowEpochSeconds: NOW }).reason, "ACCOUNT_REVOKED");
  assert.equal(authorizeSessionState({ session, account: { ...active, version: 5 }, nowEpochSeconds: NOW }).reason, "SESSION_REVOKED_BY_VERSION");
});

test("auth contracts prohibit public signup, public invite storage and reusable provider credentials", () => {
  assert.equal(IDENTITY_VERIFIER_CONTRACT.publicSignupAllowed, false);
  assert.equal(IDENTITY_VERIFIER_CONTRACT.exactPrivateAllowlistRequired, true);
  assert.equal(IDENTITY_VERIFIER_CONTRACT.invitedEmailStorage, "PRIVATE_RUNTIME_STATE_ONLY");
  assert.equal(OWNER_BOOTSTRAP_CONTRACT.repositoryEmailLiteralAllowed, false);
  assert.equal(OWNER_BOOTSTRAP_CONTRACT.emailSource, "RUNTIME_PRIVATE_INPUT");
  assert.equal(SESSION_CONTRACT.reusableProviderCredentialStored, false);
  assert.equal(SESSION_CONTRACT.revocationMustFailClosed, true);
});

test("Step 7A acceptance is fail closed and only PASS can earn provisioning", () => {
  const passing = evaluateStep7AAcceptance(acceptanceFixture());
  assert.equal(passing.pass, true);
  assert.equal(passing.terminal, "NO_BILLING_AUTH_170K_ARCHITECTURE_PASS");

  const failingReports = acceptanceFixture();
  const required = failingReports.find(report => report.targetSize === 170_000);
  required.storage.recipeShardBytes[0] = STEP7A_BUDGETS.maxDatabaseBytesAt170k + 1;
  const failing = evaluateStep7AAcceptance(failingReports);
  assert.equal(failing.pass, false);
  assert.equal(failing.terminal, "REBASELINE_REQUIRED_NO_PROVISIONING");
  assert.ok(failing.failedCheckIds.includes("170k.maxRecipeShardBytes"));
});
