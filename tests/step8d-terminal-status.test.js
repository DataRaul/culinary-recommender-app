import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const page = readFileSync(new URL("../step8d-populate.html", import.meta.url), "utf8");
const readiness = JSON.parse(readFileSync(new URL("../data/generated/corpus-scale-step8d-production-readiness.json", import.meta.url), "utf8"));

test("Step 8D authenticated runner reports the final terminal after the external production probe passed", () => {
  assert.equal(readiness.pass, true);
  assert.equal(readiness.externalUnauthenticatedProbe.pass, true);
  assert.equal(readiness.externalUnauthenticatedProbe.httpStatus, 401);
  assert.equal(readiness.externalUnauthenticatedProbe.shardQueries, 0);
  assert.equal(readiness.remainingGate, "ONE_AUTHENTICATED_STEP8D_POPULATION_SESSION");
  assert.equal(readiness.terminalOnAuthenticatedPass, "STEP_8D_PROTECTED_POPULATION_PASS");

  assert.match(page, /terminalCandidate: "STEP_8D_PROTECTED_POPULATION_PASS"/);
  assert.match(page, /externalUnauthenticatedProbePass: true/);
  assert.match(page, /externalUnauthenticatedProbeRun: 34834330389/);
  assert.doesNotMatch(page, /STEP_8D_PROTECTED_POPULATION_PASS_PENDING_EXTERNAL_UNAUTH_PROBE/);
  assert.doesNotMatch(page, /external unauthenticated zero-shard probe remains/);
});
