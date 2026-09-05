import test from "node:test";
import assert from "node:assert/strict";

import { createSessionToken } from "../src/server/auth-core.mjs";
import { onRequestPost as revokeSession } from "../functions/api/auth/revoke-session.js";
import { onRequestGet as getProtectedCanary } from "../functions/api/protected-canary.js";

class RevocationFakeD1 {
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
      },
      async run() {
        if (sql.startsWith("UPDATE invited_accounts SET session_version = session_version + 1")) {
          const [accountId, sessionVersion] = args;
          if (
            db.account?.account_id !== accountId ||
            Number(db.account.enabled) !== 1 ||
            Number(db.account.session_version) !== Number(sessionVersion)
          ) {
            return { meta: { changes: 0 } };
          }
          db.account.session_version += 1;
          return { meta: { changes: 1 } };
        }
        throw new Error(`Unhandled run SQL: ${sql}`);
      }
    };
  }
}

function request(path, token, { method = "GET", origin = null } = {}) {
  const url = `https://culinary-recommender-app.pages.dev${path}`;
  const headers = { cookie: `__Host-culinary_session=${token}` };
  if (origin) headers.origin = origin;
  return new Request(url, { method, headers });
}

test("self-revocation increments the account session version and stale cookie fails closed", async () => {
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
  const db = new RevocationFakeD1(account);
  const env = { SESSION_SECRET: secret, CULINARY_CONTROL_DB: db };
  const token = await createSessionToken({
    accountId: account.account_id,
    sessionVersion: 1,
    nowEpochSeconds: 2_000_000_000,
    ttlSeconds: 3600
  }, secret);

  const revokeResponse = await revokeSession({
    request: request("/api/auth/revoke-session", token, {
      method: "POST",
      origin: "https://culinary-recommender-app.pages.dev"
    }),
    env
  });
  assert.equal(revokeResponse.status, 200);
  assert.deepEqual(await revokeResponse.json(), {
    ok: true,
    authenticated: false,
    revoked: true,
    nextExpectedReason: "SESSION_REVOKED"
  });
  assert.equal(account.session_version, 2);
  assert.equal(revokeResponse.headers.get("set-cookie"), null);

  const protectedResponse = await getProtectedCanary({
    request: request("/api/protected-canary", token),
    env
  });
  assert.equal(protectedResponse.status, 401);
  const protectedBody = await protectedResponse.json();
  assert.equal(protectedBody.ok, false);
  assert.equal(protectedBody.error, "UNAUTHORIZED");
  assert.equal(protectedBody.reason, "SESSION_REVOKED");
  assert.match(protectedResponse.headers.get("set-cookie") || "", /Max-Age=0/);
});

test("revocation endpoint rejects cross-origin requests without mutating session version", async () => {
  const secret = "0123456789abcdef0123456789abcdef";
  const account = {
    account_id: "owner-account",
    email: "owner@gmail.com",
    enabled: 1,
    provider: "google",
    issuer: "https://accounts.google.com",
    subject: "owner-subject",
    session_version: 4
  };
  const env = { SESSION_SECRET: secret, CULINARY_CONTROL_DB: new RevocationFakeD1(account) };
  const token = await createSessionToken({
    accountId: account.account_id,
    sessionVersion: 4,
    nowEpochSeconds: 2_000_000_000,
    ttlSeconds: 3600
  }, secret);

  const response = await revokeSession({
    request: request("/api/auth/revoke-session", token, {
      method: "POST",
      origin: "https://attacker.example"
    }),
    env
  });
  assert.equal(response.status, 403);
  assert.deepEqual(await response.json(), { ok: false, error: "INVALID_ORIGIN" });
  assert.equal(account.session_version, 4);
});
