import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const canary = readFileSync(new URL("../step8b-canary.html", import.meta.url), "utf8");
const closeout = readFileSync(new URL("../docs/CORPUS_SCALE_STEP8B_LIVE_CANARY_PASS.md", import.meta.url), "utf8");

test("Step 8B canary no longer reports the resolved external probe as pending", () => {
  assert.equal(canary.includes("terminalCandidate: \"STEP_8B_MINIMUM_MULTI_SHARD_CANARY_PASS_PENDING_EXTERNAL_UNAUTH_PROBE\""), false);
  assert.match(canary, /terminal: "STEP_8B_MINIMUM_MULTI_SHARD_CANARY_PASS"/);
  assert.match(canary, /externalUnauthenticatedProbeStatus: "PASS_FROZEN_IN_STEP8B_CLOSEOUT"/);
});

test("Step 8B closeout explicitly resolves the external unauthenticated probe", () => {
  assert.match(closeout, /External unauthenticated production probe — RESOLVED PASS/);
  assert.match(closeout, /canonical Step 8B status is therefore the terminal `STEP_8B_MINIMUM_MULTI_SHARD_CANARY_PASS`/);
  assert.match(closeout, /shardQueries": 0/);
});
