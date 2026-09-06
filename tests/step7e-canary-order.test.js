import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("Step 7E completes authenticated checks before the credentials-omit probe", () => {
  const html = readFileSync(new URL("../auth-canary.html", import.meta.url), "utf8");
  const authenticatedAudit = html.indexOf("Step 7E: checking current protected-pilot state");
  const protectedSample = html.indexOf("Step 7E: reading one authenticated protected source packet");
  const freeLimit = html.indexOf("Step 7E: simulating Free-limit fail-closed behavior");
  const unauthenticatedProbe = html.indexOf("Step 7E: verifying unauthenticated fail-closed behavior");
  const terminalPass = html.indexOf("evidence.canaryPass = true");

  assert.ok(authenticatedAudit >= 0);
  assert.ok(protectedSample > authenticatedAudit);
  assert.ok(freeLimit > protectedSample);
  assert.ok(unauthenticatedProbe > freeLimit);
  assert.ok(terminalPass > unauthenticatedProbe);

  const omitCredentials = html.indexOf("credentials: 'omit'", unauthenticatedProbe);
  assert.ok(omitCredentials > unauthenticatedProbe);
});
