import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const finalHtml = readFileSync(new URL("../step7e-final.html", import.meta.url), "utf8");
const probeHtml = readFileSync(new URL("../auth-session-commit-probe.html", import.meta.url), "utf8");

test("Step 7E final verifier never falls back to the 50-chunk bootstrap loop", () => {
  assert.doesNotMatch(finalHtml, /step7e-bootstrap/);
  assert.doesNotMatch(finalHtml, /chunkIndex\s*=\s*0/);
  assert.match(finalHtml, /already-materialized protected 500-record pilot/);
  assert.match(finalHtml, /\/api\/step7e-pilot/);
  assert.match(finalHtml, /STEP7E_FINAL_AUDIT_FAILED/);
});

test("Step 7E final verifier bounds every fetch and exposes compact copyable evidence", () => {
  assert.match(finalHtml, /new AbortController\(\)/);
  assert.match(finalHtml, /STEP7E_REQUEST_TIMEOUT/);
  assert.match(finalHtml, /timeoutMs = 10000/);
  assert.match(finalHtml, /id="copy-status"/);
  assert.match(finalHtml, /navigator\.clipboard\.writeText/);
  assert.match(finalHtml, /STEP_7E_PROTECTED_500_SOURCE_PILOT_CANARY_PASS/);
  assert.match(finalHtml, /2aa8106f7521f9cf3f6c2f9ece13d328272f8400f90f4ae79b8cdc4750b5d8b6/);
});

test("successful Step 7E auth commit routes to the short final verifier", () => {
  assert.match(probeHtml, /\/step7e-final\.html\?sessionCommit=1/);
  assert.doesNotMatch(probeHtml, /auth-canary\.html\?sessionCommit=1&intent=step7e/);
});
