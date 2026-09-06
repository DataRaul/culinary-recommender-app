import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { onRequestGet as finalPage } from "../functions/api/step7e-final-page.js";

const staticFinalHtml = readFileSync(new URL("../step7e-final.html", import.meta.url), "utf8");
const functionSource = readFileSync(new URL("../functions/api/step7e-final-page.js", import.meta.url), "utf8");
const probeHtml = readFileSync(new URL("../auth-session-commit-probe.html", import.meta.url), "utf8");

test("Step 7E final verifier never falls back to the 50-chunk bootstrap loop", () => {
  for (const source of [staticFinalHtml, functionSource]) {
    assert.doesNotMatch(source, /step7e-bootstrap/);
    assert.doesNotMatch(source, /chunkIndex\s*=\s*0/);
    assert.match(source, /already-materialized protected 500-record pilot/);
    assert.match(source, /\/api\/step7e-pilot/);
    assert.match(source, /STEP7E_FINAL_AUDIT_FAILED/);
  }
});

test("function-served Step 7E verifier bounds fetches and exposes compact copyable evidence", async () => {
  assert.match(functionSource, /new AbortController\(\)/);
  assert.match(functionSource, /STEP7E_REQUEST_TIMEOUT/);
  assert.match(functionSource, /timeoutMs=10000/);
  assert.match(functionSource, /id=\"copy-status\"/);
  assert.match(functionSource, /navigator\.clipboard\.writeText/);
  assert.match(functionSource, /STEP_7E_PROTECTED_500_SOURCE_PILOT_CANARY_PASS/);
  assert.match(functionSource, /2aa8106f7521f9cf3f6c2f9ece13d328272f8400f90f4ae79b8cdc4750b5d8b6/);

  const response = await finalPage({});
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type"), /^text\/html/);
  assert.equal(response.headers.get("cache-control"), "no-store");
  const html = await response.text();
  assert.match(html, /Step 7E final verification/);
  assert.match(html, /SIGN_IN_WITH_GOOGLE_ONCE/);
  assert.doesNotMatch(html, /step7e-bootstrap/);
});

test("successful Step 7E auth commit routes to the function-served final verifier", () => {
  assert.match(probeHtml, /\/api\/step7e-final-page\?sessionCommit=1/);
  assert.doesNotMatch(probeHtml, /\/step7e-final\.html\?sessionCommit=1/);
});
