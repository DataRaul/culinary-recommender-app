import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import {
  KC_REVIEW_AUTHORITY,
  KC_REVIEW_BRIDGE_SCHEMA,
  syncCanonicalReviewBridge,
  validateKcReviewBridge
} from "../scripts/sync-youtube-culinary-kc-review-bridge.mjs";

function bridge() {
  return {
    schemaVersion: KC_REVIEW_BRIDGE_SCHEMA,
    knowledgeCoreCommit: "abc123",
    generatedAt: "2026-09-06T12:00:00Z",
    outcomes: [{
      packetId: "yt-cul-review-0123456789abcdef01234567",
      reviewPairKey: "yt-cul-pair-0123456789abcdef01234567",
      reviewDecision: "HELD",
      reviewAuthority: KC_REVIEW_AUTHORITY,
      decisionReason: "CANONICAL_EVIDENCE_REVIEW_REQUIRED",
      reviewRoute: "ATLAS_IDENTITY_REVIEW",
      requiredEvidenceTerms: ["identity", "regional", "traditional"],
      independentNonYoutubeEvidence: true,
      rightsProvenanceSafetyClear: false,
      appAuthoringEligible: false,
      lifecycleAdvanced: false,
      lifecycleStateAfter: null,
      retryable: true,
      knowledgeCoreCommit: "abc123"
    }]
  };
}

test("KC bridge sync is disabled by default and requires no credential", async () => {
  let called = false;
  const result = await syncCanonicalReviewBridge({ enabled: false, fetchImpl: async () => { called = true; throw new Error("unexpected"); } });
  assert.equal(result.status, "KC_REVIEW_SYNC_DISABLED");
  assert.equal(called, false);
});

test("enabled KC bridge sync fails closed without read-only credential", async () => {
  await assert.rejects(() => syncCanonicalReviewBridge({ enabled: true, token: "" }), /CULINARY_KC_REVIEW_READ_TOKEN/);
});

test("valid KC bridge is fetched with bearer credential and written only to runner workspace path", async () => {
  const dir = await mkdtemp(join(tmpdir(), "kc-review-sync-"));
  try {
    const repoRoot = new URL("../", import.meta.url).pathname;
    const absolute = join(dir, "bridge.json");
    const outputPath = relative(repoRoot, absolute);
    let authorization = null;
    const result = await syncCanonicalReviewBridge({
      enabled: true,
      token: "read-only-test-token",
      outputPath,
      fetchImpl: async (_url, init) => {
        authorization = init.headers.Authorization;
        return new Response(JSON.stringify(bridge()), { status: 200, headers: { "content-type": "application/json" } });
      }
    });
    assert.equal(authorization, "Bearer read-only-test-token");
    assert.equal(result.status, "KC_REVIEW_SYNC_PASS");
    assert.equal(result.outcomes, 1);
    assert.deepEqual(JSON.parse(await readFile(absolute, "utf8")), bridge());
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("KC bridge rejects unknown fields and invalid app-authoring authority", () => {
  const unknown = bridge();
  unknown.outcomes[0].privateBrainNote = "must not cross boundary";
  assert.throws(() => validateKcReviewBridge(unknown), /unapproved field/);

  const invalid = bridge();
  Object.assign(invalid.outcomes[0], { reviewDecision: "ACCEPTED", appAuthoringEligible: true, independentNonYoutubeEvidence: true, rightsProvenanceSafetyClear: false, lifecycleStateAfter: "APP_AUTHORING_ELIGIBLE" });
  assert.throws(() => validateKcReviewBridge(invalid), /full canonical clearance/);
});
