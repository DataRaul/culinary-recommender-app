import test from "node:test";
import assert from "node:assert/strict";

import { createSessionToken } from "../src/server/auth-core.mjs";
import { onRequestGet as runtimeProbe } from "../functions/api/auth/runtime-probe.js";

class ProbeFakeD1 {
  constructor(account = null) {
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
        throw new Error(`Unhandled first SQL: ${sql}`);
      }
    };
  }
}

const secret = "0123456789abcdef0123456789abcdef";

function ownerAccount() {
  return {
    account_id: "owner-account",
    email: "owner@gmail.com",
    enabled: 1,
    provider: "google",
    issuer: "https://accounts.google.com",
    subject: "owner-subject",
    session_version: 1
  };
}

test("runtime probe identifies the exact deployed diagnostic contract without exposing secrets", async () => {
  const request = new Request("https://culinary-recommender-app.pages.dev/api/auth/runtime-probe");
  const response = await runtimeProbe({
    request,
    env: { SESSION_SECRET: secret, CULINARY_CONTROL_DB: new ProbeFakeD1(ownerAccount()) }
  });
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.probe, "STEP7C_SESSION_RUNTIME_PROBE_V1");
  assert.equal(body.host, "culinary-recommender-app.pages.dev");
  assert.equal(body.configured, true);
  assert.equal(body.cookiePresent, false);
  assert.equal(body.authenticated, false);
  assert.equal(body.reason, "NO_SESSION");
  assert.equal(JSON.stringify(body).includes(secret), false);
  assert.equal(body.accountId, null);
});

test("runtime probe distinguishes a present valid persisted cookie from Google sign-in state", async () => {
  const account = ownerAccount();
  const now = Math.floor(Date.now() / 1000);
  const token = await createSessionToken({
    accountId: account.account_id,
    sessionVersion: account.session_version,
    nowEpochSeconds: now,
    ttlSeconds: 3600
  }, secret);
  const request = new Request("https://culinary-recommender-app.pages.dev/api/auth/runtime-probe", {
    headers: { cookie: `__Host-culinary_session=${token}` }
  });
  const response = await runtimeProbe({
    request,
    env: { SESSION_SECRET: secret, CULINARY_CONTROL_DB: new ProbeFakeD1(account) }
  });
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.cookiePresent, true);
  assert.equal(body.authenticated, true);
  assert.equal(body.reason, "AUTHORIZED");
  assert.equal(body.accountId, account.account_id);
});

test("runtime probe fails closed when required Pages bindings are absent", async () => {
  const request = new Request("https://culinary-recommender-app.pages.dev/api/auth/runtime-probe", {
    headers: { cookie: "__Host-culinary_session=opaque" }
  });
  const response = await runtimeProbe({ request, env: {} });
  assert.equal(response.status, 503);
  const body = await response.json();
  assert.equal(body.probe, "STEP7C_SESSION_RUNTIME_PROBE_V1");
  assert.equal(body.configured, false);
  assert.equal(body.cookiePresent, true);
  assert.equal(body.authenticated, false);
  assert.equal(body.reason, "AUTH_NOT_CONFIGURED");
  assert.equal(body.sessionSecretConfigured, false);
  assert.equal(body.controlDbConfigured, false);
});
