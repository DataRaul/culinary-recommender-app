import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { createSessionToken } from "../src/server/auth-core.mjs";
import { onRequestGet as sessionCommitProbe } from "../functions/api/auth/session-commit-probe.js";

const ORIGIN = "https://culinary-recommender-app.pages.dev";
const SECRET = "0123456789abcdef0123456789abcdef";

class ProbeD1 {
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
        throw new Error(`Unhandled first SQL: ${sql}`);
      }
    };
  }
}

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

function request(cookie = "") {
  return new Request(`${ORIGIN}/api/auth/session-commit-probe`, {
    headers: cookie ? { cookie } : {}
  });
}

test("session commit probe reports marker without manufacturing authentication", async () => {
  const response = await sessionCommitProbe({
    request: request("__Host-culinary_auth_commit_probe=1"),
    env: { SESSION_SECRET: SECRET, CULINARY_CONTROL_DB: new ProbeD1(ownerAccount()) }
  });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    ok: true,
    probe: "CULINARY_REAL_SESSION_COMMIT_V1",
    sessionCookiePresent: false,
    commitMarkerPresent: true,
    sessionValidation: "NO_SESSION"
  });
  assert.equal(response.headers.get("set-cookie"), null);
});

test("session commit probe validates a real persisted session without exposing identity or token", async () => {
  const account = ownerAccount();
  const now = Math.floor(Date.now() / 1000);
  const token = await createSessionToken({
    accountId: account.account_id,
    sessionVersion: account.session_version,
    nowEpochSeconds: now,
    ttlSeconds: 3600
  }, SECRET);

  const response = await sessionCommitProbe({
    request: request(`__Host-culinary_session=${token}; __Host-culinary_auth_commit_probe=1`),
    env: { SESSION_SECRET: SECRET, CULINARY_CONTROL_DB: new ProbeD1(account) }
  });
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.deepEqual(body, {
    ok: true,
    probe: "CULINARY_REAL_SESSION_COMMIT_V1",
    sessionCookiePresent: true,
    commitMarkerPresent: true,
    sessionValidation: "AUTHORIZED"
  });
  const serialized = JSON.stringify(body);
  assert.equal(serialized.includes(token), false);
  assert.equal(serialized.includes(account.account_id), false);
  assert.equal(serialized.includes(account.email), false);
  assert.equal(response.headers.get("set-cookie"), null);
});

test("session commit probe reports rejected token reason without clearing evidence", async () => {
  const response = await sessionCommitProbe({
    request: request("__Host-culinary_session=malformed; __Host-culinary_auth_commit_probe=1"),
    env: { SESSION_SECRET: SECRET, CULINARY_CONTROL_DB: new ProbeD1(ownerAccount()) }
  });
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.sessionCookiePresent, true);
  assert.equal(body.commitMarkerPresent, true);
  assert.equal(body.sessionValidation, "MALFORMED_SESSION");
  assert.equal(response.headers.get("set-cookie"), null);
});

test("session commit probe page performs one same-origin sanitized check", () => {
  const html = readFileSync(new URL("../auth-session-commit-probe.html", import.meta.url), "utf8");
  assert.match(html, /\/api\/auth\/session-commit-probe/);
  assert.match(html, /credentials:\s*'same-origin'/);
  assert.doesNotMatch(html, /google\.accounts|credential|accountId|email|session token/i);
});
