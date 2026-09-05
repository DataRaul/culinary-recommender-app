import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { createSessionToken, sessionCookie } from "../src/server/auth-core.mjs";
import { onRequestGet as getSession } from "../functions/api/auth/session.js";
import { onRequestGet as getProtectedCanary } from "../functions/api/protected-canary.js";

class ReloadFakeD1 {
  constructor(account) {
    this.account = account;
  }

  prepare(sql) {
    const db = this;
    let args = [];
    return {
      bind(...values) {
        args = values;
        return this;
      },
      async first() {
        if (sql.startsWith("SELECT account_id") && sql.includes("WHERE account_id = ?")) {
          return db.account?.account_id === args[0] ? db.account : null;
        }
        if (sql === "SELECT 1 AS ok") return { ok: 1 };
        throw new Error(`Unhandled first SQL: ${sql}`);
      }
    };
  }
}

function requestWithCookie(path, token) {
  return new Request(`https://culinary-recommender-app.pages.dev${path}`, {
    headers: {
      cookie: `g_state=unrelated; __Host-culinary_session=${token}; cf_clearance=unrelated`
    }
  });
}

test("fresh request after page reload accepts the persisted session cookie", async () => {
  const secret = "0123456789abcdef0123456789abcdef";
  const account = {
    account_id: "owner-account",
    email: "owner@gmail.com",
    enabled: 1,
    provider: "google",
    issuer: "https://accounts.google.com",
    subject: "owner-subject",
    session_version: 1
  };
  const env = { SESSION_SECRET: secret, CULINARY_CONTROL_DB: new ReloadFakeD1(account) };
  const token = await createSessionToken({
    accountId: account.account_id,
    sessionVersion: 1,
    nowEpochSeconds: 2_000_000_000,
    ttlSeconds: 3600
  }, secret);

  const sessionResponse = await getSession({
    request: requestWithCookie("/api/auth/session", token),
    env
  });
  assert.equal(sessionResponse.status, 200);
  assert.deepEqual(await sessionResponse.json(), {
    authenticated: true,
    account: { id: "owner-account", email: "owner@gmail.com" }
  });

  const protectedResponse = await getProtectedCanary({
    request: requestWithCookie("/api/protected-canary", token),
    env
  });
  assert.equal(protectedResponse.status, 200);
  assert.deepEqual(await protectedResponse.json(), {
    ok: true,
    authenticated: true,
    accountId: "owner-account"
  });
});

test("invalid persisted session is diagnosed and cleared fail-closed", async () => {
  const secret = "0123456789abcdef0123456789abcdef";
  const account = {
    account_id: "owner-account",
    email: "owner@gmail.com",
    enabled: 1,
    provider: "google",
    issuer: "https://accounts.google.com",
    subject: "owner-subject",
    session_version: 1
  };
  const env = { SESSION_SECRET: secret, CULINARY_CONTROL_DB: new ReloadFakeD1(account) };
  const token = await createSessionToken({
    accountId: account.account_id,
    sessionVersion: 1,
    nowEpochSeconds: 2_000_000_000,
    ttlSeconds: 3600
  }, secret);
  const [payload, signature] = token.split(".");
  const tampered = `${payload}.${signature[0] === "a" ? "b" : "a"}${signature.slice(1)}`;

  const response = await getSession({
    request: requestWithCookie("/api/auth/session", tampered),
    env
  });
  assert.equal(response.status, 401);
  const body = await response.json();
  assert.equal(body.authenticated, false);
  assert.equal(body.reason, "INVALID_SESSION_SIGNATURE");
  const clearingCookie = response.headers.get("set-cookie") || "";
  assert.match(clearingCookie, /^__Host-culinary_session=/);
  assert.match(clearingCookie, /Max-Age=0/);
});

test("auth canary explicitly keeps browser credentials on every same-origin auth fetch", () => {
  const html = readFileSync(new URL("../auth-canary.html", import.meta.url), "utf8");
  const credentialMentions = html.match(/credentials:\s*'same-origin'/g) || [];
  assert.equal(credentialMentions.length, 5);
  assert.match(sessionCookie("test-token", 60), /Max-Age=60/);
});
