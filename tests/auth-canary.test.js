import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  clearSessionCookie,
  createSessionToken,
  currentSessionAccount,
  parseSessionCookie,
  sessionCookie,
  verifySessionToken
} from "../src/server/auth-core.mjs";
import { onRequestGet as getAuthConfig } from "../functions/api/auth/config.js";
import { onRequestPost as postGoogleAuth } from "../functions/api/auth/google.js";
import { onRequestPost as postLogout } from "../functions/api/auth/logout.js";
import { onRequestPost as postRevokeSession } from "../functions/api/auth/revoke-session.js";
import { onRequestGet as getSession } from "../functions/api/auth/session.js";
import { onRequestGet as getProtectedCanary } from "../functions/api/protected-canary.js";

class FakeD1 {
  constructor() {
    this.accounts = [];
  }

  prepare(sql) {
    const db = this;
    let args = [];
    const statement = {
      bind(...values) {
        args = values;
        return statement;
      },
      async first() {
        if (sql.startsWith("SELECT account_id") && sql.includes("WHERE account_id = ?")) {
          return db.accounts.find(row => row.account_id === args[0]) || null;
        }
        if (sql.startsWith("SELECT account_id") && sql.includes("WHERE provider = ?")) {
          return db.accounts.find(row => row.provider === args[0] && row.issuer === args[1] && row.subject === args[2]) || null;
        }
        if (sql === "SELECT 1 AS ok") return { ok: 1 };
        throw new Error(`Unhandled first SQL: ${sql}`);
      },
      async run() {
        if (sql.startsWith("CREATE TABLE IF NOT EXISTS culinary_accounts")) return { success: true };
        if (sql.startsWith("CREATE UNIQUE INDEX IF NOT EXISTS idx_culinary_accounts_identity")) return { success: true };
        if (sql.startsWith("INSERT INTO culinary_accounts")) {
          const [accountId, email, enabled, provider, issuer, subject, sessionVersion] = args;
          db.accounts.push({
            account_id: accountId,
            email,
            enabled,
            provider,
            issuer,
            subject,
            session_version: sessionVersion
          });
          return { success: true };
        }
        if (sql.startsWith("UPDATE culinary_accounts SET session_version = session_version + 1")) {
          const account = db.accounts.find(row => row.account_id === args[0]);
          if (!account) return { success: true, meta: { changes: 0 } };
          account.session_version += 1;
          return { success: true, meta: { changes: 1 } };
        }
        throw new Error(`Unhandled run SQL: ${sql}`);
      }
    };
    return statement;
  }
}

const SECRET = "unit-test-session-secret-material-32bytes";

function account(overrides = {}) {
  return {
    account_id: "owner-account",
    email: "owner@example.test",
    enabled: 1,
    provider: "google",
    issuer: "https://accounts.google.com",
    subject: "owner-subject",
    session_version: 1,
    ...overrides
  };
}

async function tokenFor(overrides = {}) {
  return createSessionToken({
    accountId: "owner-account",
    sessionVersion: 1,
    nowEpochSeconds: 1000,
    ttlSeconds: 3600,
    ...overrides
  }, SECRET);
}

function cookieRequest(path, token) {
  return new Request(`https://example.test${path}`, {
    headers: { cookie: `__Host-culinary_session=${token}` }
  });
}

test("auth cookie helper uses hardened host cookie and parser isolates it", () => {
  const cookie = sessionCookie("abc", 3600);
  assert.match(cookie, /^__Host-culinary_session=abc;/);
  assert.match(cookie, /Path=\//);
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /Secure/);
  assert.match(cookie, /SameSite=Lax/);
  assert.equal(parseSessionCookie("x=1; __Host-culinary_session=abc; y=2"), "abc");
  assert.match(clearSessionCookie(), /Max-Age=0/);
});

test("signed session token verifies and rejects expiration", async () => {
  const token = await tokenFor();
  const pass = await verifySessionToken(token, SECRET, 1050);
  assert.equal(pass.pass, true);
  assert.equal(pass.payload.a, "owner-account");
  assert.equal(pass.payload.v, 1);
  assert.equal((await verifySessionToken(token, SECRET, 5000)).reason, "SESSION_EXPIRED");
});

test("current session enforces D1 account enablement and session version", async () => {
  const db = new FakeD1();
  db.accounts.push(account());
  const token = await tokenFor();
  const request = cookieRequest("/api/auth/session", token);
  const env = { SESSION_SECRET: SECRET, CULINARY_CONTROL_DB: db };

  assert.equal((await currentSessionAccount({ request, env, nowEpochSeconds: 1050 })).pass, true);
  db.accounts[0].session_version = 2;
  const revoked = await currentSessionAccount({ request, env, nowEpochSeconds: 1050 });
  assert.equal(revoked.pass, false);
  assert.equal(revoked.reason, "SESSION_REVOKED");
  db.accounts[0].session_version = 1;
  db.accounts[0].enabled = 0;
  assert.equal((await currentSessionAccount({ request, env, nowEpochSeconds: 1050 })).reason, "ACCOUNT_DISABLED");
});

test("Pages auth canary routes APIs plus generated Step 7E payload path through Functions", () => {
  const routes = JSON.parse(readFileSync(new URL("../_routes.json", import.meta.url), "utf8"));
  assert.deepEqual(routes.include, [
    "/api/*",
    "/src/data/external/generated/forkrecipe-step7e-live/*"
  ]);
  assert.deepEqual(routes.exclude, []);
  const html = readFileSync(new URL("../auth-canary.html", import.meta.url), "utf8");
  assert.match(html, /\/api\/auth\/config/);
  assert.match(html, /\/api\/step7e\/pilot/);
  assert.doesNotMatch(html, /apps\.googleusercontent\.com/);
  assert.doesNotMatch(html, /@gmail\.com/i);
});
