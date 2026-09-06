import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("Step 7E uses a protected preflight and flat authenticated routes before the credentials-omit probe", () => {
  const html = readFileSync(new URL("../auth-canary.html", import.meta.url), "utf8");
  const sessionPreflight = html.indexOf("Step 7E: verifying authenticated session preflight");
  const authenticatedAudit = html.indexOf("Step 7E: checking current protected-pilot state");
  const protectedSample = html.indexOf("Step 7E: reading one authenticated protected source packet");
  const freeLimit = html.indexOf("Step 7E: simulating Free-limit fail-closed behavior");
  const unauthenticatedProbe = html.indexOf("Step 7E: verifying unauthenticated fail-closed behavior");
  const terminalPass = html.indexOf("evidence.canaryPass = true");

  assert.ok(sessionPreflight >= 0);
  assert.ok(authenticatedAudit > sessionPreflight);
  assert.ok(protectedSample > authenticatedAudit);
  assert.ok(freeLimit > protectedSample);
  assert.ok(unauthenticatedProbe > freeLimit);
  assert.ok(terminalPass > unauthenticatedProbe);

  assert.match(html, /fetch\('\/api\/protected-canary'/);
  assert.match(html, /fetch\('\/api\/step7e-pilot'/);
  assert.match(html, /fetch\(`\/api\/step7e-bootstrap\?chunk=\$\{chunkIndex\}`/);
  assert.doesNotMatch(html, /fetch\('\/api\/step7e\/pilot'/);
  assert.doesNotMatch(html, /fetch\(`\/api\/step7e\/bootstrap/);

  const omitCredentials = html.indexOf("credentials: 'omit'", unauthenticatedProbe);
  assert.ok(omitCredentials > unauthenticatedProbe);
});

test("flat Step 7E aliases delegate to the canonical nested handlers", () => {
  const pilot = readFileSync(new URL("../functions/api/step7e-pilot.js", import.meta.url), "utf8");
  const bootstrap = readFileSync(new URL("../functions/api/step7e-bootstrap.js", import.meta.url), "utf8");

  assert.equal(pilot, 'export { onRequestGet } from "./step7e/pilot.js";\n');
  assert.equal(bootstrap, 'export { onRequestPost } from "./step7e/bootstrap.js";\n');
});
