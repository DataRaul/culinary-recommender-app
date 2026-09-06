import test from "node:test";
import assert from "node:assert/strict";

import { handleGoogleRedirect } from "../functions/api/auth/google-redirect.js";

const ORIGIN = "https://culinary-recommender-app.pages.dev";

function formRequest({ origin = ORIGIN, credential = "header.payload.signature", intent = "" } = {}) {
  const body = new URLSearchParams({ credential });
  if (intent) body.set("intent", intent);
  return new Request(`${ORIGIN}/api/auth/google-redirect`, {
    method: "POST",
    headers: {
      origin,
      "content-type": "application/x-www-form-urlencoded"
    },
    body
  });
}

function setCookieValues(headers) {
  if (typeof headers.getSetCookie === "function") return headers.getSetCookie();
  return [headers.get("set-cookie") || ""];
}

function successfulSessionResponse() {
  return new Response(JSON.stringify({ ok: true, authenticated: true }), {
    status: 200,
    headers: {
      "content-type": "application/json",
      "set-cookie": "__Host-culinary_session=opaque; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=28800"
    }
  });
}

test("top-level auth redirect delegates canonical Google verification then commits session and bounded marker cookies on 303", async () => {
  let delegated = null;
  const sessionCookie = "__Host-culinary_session=opaque; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=28800";

  const response = await handleGoogleRedirect({
    request: formRequest(),
    env: { marker: "env" },
    issueSession: async context => {
      delegated = context;
      return successfulSessionResponse();
    }
  });

  assert.equal(response.status, 303);
  assert.equal(response.headers.get("location"), "/auth-session-commit-probe.html");
  const cookies = setCookieValues(response.headers);
  assert.ok(cookies.some(value => value.includes(sessionCookie)));
  assert.ok(cookies.some(value => value.includes("__Host-culinary_auth_commit_probe=1")));
  assert.ok(cookies.some(value => value.includes("Max-Age=120")));
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

test("bounded Step 7E intent is forwarded only to the post-commit probe", async () => {
  let delegatedBody = null;
  const response = await handleGoogleRedirect({
    request: formRequest({ intent: "step7e" }),
    env: {},
    issueSession: async context => {
      delegatedBody = await context.request.json();
      return successfulSessionResponse();
    }
  });

  assert.equal(response.status, 303);
  assert.equal(response.headers.get("location"), "/auth-session-commit-probe.html?intent=step7e");
  assert.deepEqual(delegatedBody, { credential: "header.payload.signature" });
});

test("unknown auth intent fails closed before canonical session issuance", async () => {
  let called = false;
  const response = await handleGoogleRedirect({
    request: formRequest({ intent: "unexpected" }),
    env: {},
    issueSession: async () => {
      called = true;
      return successfulSessionResponse();
    }
  });

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { ok: false, error: "INVALID_INTENT" });
  assert.equal(called, false);
  assert.equal(response.headers.get("set-cookie"), null);
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
