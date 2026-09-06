import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { onRequestGet as cookieProbe } from "../functions/api/auth/cookie-probe.js";

const ORIGIN = "https://culinary-recommender-app.pages.dev";

async function probe(stage, cookie = "") {
  const headers = cookie ? { cookie } : {};
  return cookieProbe({ request: new Request(`${ORIGIN}/api/auth/cookie-probe?stage=${stage}`, { headers }) });
}

test("cookie probe walks four secure first-party variants without account or session data", async () => {
  const host = await probe("host");
  assert.equal(host.status, 303);
  assert.equal(host.headers.get("location"), "/api/auth/cookie-probe?stage=secure");
  assert.match(host.headers.get("set-cookie") || "", /^__Host-culinary_probe_host=1;/);
  assert.match(host.headers.get("set-cookie") || "", /Path=\//);
  assert.match(host.headers.get("set-cookie") || "", /Secure/);
  assert.match(host.headers.get("set-cookie") || "", /SameSite=Lax/);
  assert.match(host.headers.get("set-cookie") || "", /Max-Age=60/);
  assert.doesNotMatch(host.headers.get("set-cookie") || "", /Domain=/i);

  const secure = await probe("secure");
  assert.equal(secure.headers.get("location"), "/api/auth/cookie-probe?stage=plain");
  assert.match(secure.headers.get("set-cookie") || "", /^__Secure-culinary_probe_secure=1;/);

  const plain = await probe("plain");
  assert.equal(plain.headers.get("location"), "/api/auth/cookie-probe?stage=http");
  assert.match(plain.headers.get("set-cookie") || "", /^culinary_probe_plain=1;/);

  const http = await probe("http");
  assert.equal(http.headers.get("location"), "/auth-cookie-probe.html");
  assert.match(http.headers.get("set-cookie") || "", /^__Host-culinary_probe_http=1;/);
  assert.match(http.headers.get("set-cookie") || "", /HttpOnly/);
});

test("cookie probe check reports only acceptance booleans", async () => {
  const response = await probe("check", [
    "unrelated=1",
    "__Host-culinary_probe_host=1",
    "culinary_probe_plain=1",
    "__Host-culinary_probe_http=1"
  ].join("; "));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.deepEqual(body, {
    ok: true,
    probe: "CULINARY_SERVER_COOKIE_ACCEPTANCE_V1",
    result: { host: true, secure: false, plain: true, http: true },
    acceptedCount: 3,
    expectedCount: 4
  });
  assert.equal(JSON.stringify(body).includes("unrelated"), false);
});

test("cookie probe rejects unknown stages and diagnostic page auto-checks same-origin", async () => {
  const invalid = await probe("unexpected");
  assert.equal(invalid.status, 400);
  assert.deepEqual(await invalid.json(), { ok: false, error: "INVALID_PROBE_STAGE" });

  const html = readFileSync(new URL("../auth-cookie-probe.html", import.meta.url), "utf8");
  assert.match(html, /\/api\/auth\/cookie-probe\?stage=check/);
  assert.match(html, /credentials:\s*'same-origin'/);
  assert.doesNotMatch(html, /accountId|owner@|response\.credential|__Host-culinary_session/);
});
