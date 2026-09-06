import test from "node:test";
import assert from "node:assert/strict";

import { handleGoogleRedirect } from "../functions/api/auth/google-redirect.js";

const ORIGIN = "https://culinary-recommender-app.pages.dev";

function formRequest({ origin = ORIGIN, credential = "header.payload.signature" } = {}) {
  const body = new URLSearchParams({ credential });
  return new Request(`${ORIGIN}/api/auth/google-redirect`, {
    method: "POST",
    headers: {
      origin,
      "content-type": "application/x-www-form-urlencoded"
    },
    body
  });
}

test("top-level auth redirect delegates canonical Google verification then commits Set-Cookie on 303", async () => {
  let delegated = null;
  const sessionCookie = "__Host-culinary_session=opaque; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=28800";

  const response = await handleGoogleRedirect({
    request: formRequest(),
    env: { marker: "env" },
    issueSession: async context => {
      delegated = context;
      return new Response(JSON.stringify({ ok: true, authenticated: true }), {
        status: 200,
        headers: {
          "content-type": "application/json",
          "set-cookie": sessionCookie
        }
      });
    }
  });

  assert.equal(response.status, 303);
  assert.equal(response.headers.get("location"), "/auth-canary.html?auth=complete");
  assert.equal(response.headers.get("set-cookie"), sessionCookie);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(response.headers.get("referrer-policy"), "no-referrer");
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("location").includes("header.payload.signature"), false);

  assert.ok(delegated);
  assert.deepEqual(delegated.env, { marker: "env" });
  assert.equal(delegated.request.method, "POST");
  assert.equal(delegated.request.headers.get("origin"), ORIGIN);
  assert.match(delegated.request.headers.get("content-type") || "", /^application\/json/);
  assert.deepEqual(await delegated.request.json(), { credential: "header.payload.signature" });
});

test("top-level auth redirect rejects a foreign origin before credential verification", async () => {
  let called = false;
  const response = await handleGoogleRedirect({
    request: formRequest({ origin: "https://attacker.example" }),
    env: {},
    issueSession: async () => {
      called = true;
      throw new Error("must not run");
    }
  });

  assert.equal(response.status, 403);
  assert.equal(called, false);
  assert.deepEqual(await response.json(), { ok: false, error: "INVALID_ORIGIN" });
  assert.equal(response.headers.get("set-cookie"), null);
});

test("top-level auth redirect fails closed when delegated session issuance lacks a cookie", async () => {
  const response = await handleGoogleRedirect({
    request: formRequest(),
    env: {},
    issueSession: async () => new Response(JSON.stringify({ ok: true, authenticated: true }), {
      status: 200,
      headers: { "content-type": "application/json" }
    })
  });

  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { ok: false, error: "SESSION_ISSUANCE_INCOMPLETE" });
  assert.equal(response.headers.get("set-cookie"), null);
});

test("top-level auth redirect preserves canonical authentication failures without setting a cookie", async () => {
  const response = await handleGoogleRedirect({
    request: formRequest(),
    env: {},
    issueSession: async () => new Response(JSON.stringify({ ok: false, error: "IDENTITY_REJECTED" }), {
      status: 401,
      headers: { "content-type": "application/json", "cache-control": "no-store" }
    })
  });

  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { ok: false, error: "IDENTITY_REJECTED" });
  assert.equal(response.headers.get("set-cookie"), null);
});
