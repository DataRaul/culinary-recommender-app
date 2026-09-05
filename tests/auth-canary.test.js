import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  bootstrapOrAuthorizeInvite,
  createSessionToken,
  currentSessionAccount,
  isGoogleAuthoritativeEmail,
  normalizeInviteEmail,
  sessionCookie,
  verifyGoogleIdToken,
  verifySessionToken
} from "../src/server/auth-core.mjs";

const encoder = new TextEncoder();

function b64url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function signedJwt(privateKey, kid, claims) {
  const header = b64url(encoder.encode(JSON.stringify({ alg: "RS256", typ: "JWT", kid })));
  const payload = b64url(encoder.encode(JSON.stringify(claims)));
  const signingInput = `${header}.${payload}`;
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", privateKey, encoder.encode(signingInput));
  return `${signingInput}.${b64url(new Uint8Array(signature))}`;
}

class FakeD1 {
  constructor() {
    this.accounts = [];
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
        if (sql.startsWith("SELECT account_id") && sql.includes("WHERE email = ?")) {
          return db.accounts.find(row => row.email === args[0]) || null;
        }
        if (sql.startsWith("SELECT COUNT(*)")) return { count: db.accounts.length };
        if (sql.startsWith("SELECT account_id") && sql.includes("WHERE account_id = ?")) {
          return db.accounts.find(row => row.account_id === args[0]) || null;
        }
        if (sql === "SELECT 1 AS ok") return { ok: 1 };
        throw new Error(`Unhandled first SQL: ${sql}`);
      },
      async run() {
        if (sql.startsWith("INSERT INTO invited_accounts")) {
          const [accountId, email, issuer, subject] = args;
          db.accounts.push({
            account_id: accountId,
            email,
            enabled: 1,
            provider: "google",
            issuer,
            subject,
            session_version: 1
          });
          return { meta: { changes: 1 } };
        }
        if (sql.startsWith("UPDATE invited_accounts SET provider")) {
          const [issuer, subject, accountId] = args;
          const row = db.accounts.find(item => item.account_id === accountId && (!item.subject || item.subject === ""));
          if (!row) return { meta: { changes: 0 } };
          row.provider = "google";
          row.issuer = issuer;
          row.subject = subject;
          return { meta: { changes: 1 } };
        }
        throw new Error(`Unhandled run SQL: ${sql}`);
      }
    };
  }
}

test("Google authoritative email boundary matches Step 7A contract", () => {
  assert.equal(normalizeInviteEmail(" User@Gmail.com "), "user@gmail.com");
  assert.equal(isGoogleAuthoritativeEmail({ email: "user@gmail.com", email_verified: true }), true);
  assert.equal(isGoogleAuthoritativeEmail({ email: "user@example.com", email_verified: true, hd: "example.com" }), true);
  assert.equal(isGoogleAuthoritativeEmail({ email: "user@example.com", email_verified: true }), false);
});

test("Google ID token verification checks signature, audience, issuer and expiry", async () => {
  const keyPair = await crypto.subtle.generateKey({
    name: "RSASSA-PKCS1-v1_5",
    modulusLength: 2048,
    publicExponent: new Uint8Array([1, 0, 1]),
    hash: "SHA-256"
  }, true, ["sign", "verify"]);
  const publicJwk = await crypto.subtle.exportKey("jwk", keyPair.publicKey);
  const kid = "test-key";
  const now = 2_000_000_000;
  const claims = {
    iss: "https://accounts.google.com",
    aud: "culinary-client",
    sub: "google-subject",
    email: "owner@gmail.com",
    email_verified: true,
    exp: now + 3600
  };
  const token = await signedJwt(keyPair.privateKey, kid, claims);
  const jwks = [{ ...publicJwk, kid, alg: "RS256", use: "sig" }];

  const valid = await verifyGoogleIdToken(token, { expectedAudience: "culinary-client", jwks, nowEpochSeconds: now });
  assert.equal(valid.pass, true);
  assert.equal(valid.identity.email, "owner@gmail.com");
  assert.equal(valid.identity.subject, "google-subject");

  const wrongAudience = await verifyGoogleIdToken(token, { expectedAudience: "wrong-client", jwks, nowEpochSeconds: now });
  assert.equal(wrongAudience.pass, false);
  assert.ok(wrongAudience.reasons.includes("INVALID_AUDIENCE"));

  const expiredToken = await signedJwt(keyPair.privateKey, kid, { ...claims, exp: now - 1 });
  const expired = await verifyGoogleIdToken(expiredToken, { expectedAudience: "culinary-client", jwks, nowEpochSeconds: now });
  assert.equal(expired.pass, false);
  assert.ok(expired.reasons.includes("EXPIRED_OR_MISSING_EXPIRY"));

  const [jwtHeader, jwtPayload, jwtSignature] = token.split(".");
  const tampered = `${jwtHeader}.${jwtPayload}.${jwtSignature[0] === "a" ? "b" : "a"}${jwtSignature.slice(1)}`;
  const badSignature = await verifyGoogleIdToken(tampered, { expectedAudience: "culinary-client", jwks, nowEpochSeconds: now });
  assert.equal(badSignature.pass, false);
  assert.ok(badSignature.reasons.includes("SIGNATURE_NOT_VERIFIED"));
});

test("session token is MAC protected, expiring, and cookie is hardened", async () => {
  const secret = "0123456789abcdef0123456789abcdef";
  const token = await createSessionToken({ accountId: "acct-1", sessionVersion: 3, nowEpochSeconds: 1000, ttlSeconds: 60 }, secret);
  const valid = await verifySessionToken(token, secret, 1050);
  assert.equal(valid.pass, true);
  assert.equal(valid.payload.a, "acct-1");
  assert.equal(valid.payload.v, 3);

  const expired = await verifySessionToken(token, secret, 1060);
  assert.equal(expired.pass, false);
  assert.equal(expired.reason, "SESSION_EXPIRED");

  const [payloadPart, signaturePart] = token.split(".");
  const tampered = `${payloadPart}.${signaturePart[0] === "a" ? "b" : "a"}${signaturePart.slice(1)}`;
  assert.equal((await verifySessionToken(tampered, secret, 1050)).pass, false);

  const cookie = sessionCookie(token, 60);
  assert.match(cookie, /^__Host-culinary_session=/);
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /Secure/);
  assert.match(cookie, /SameSite=Lax/);
  assert.match(cookie, /Path=\//);
});

test("owner bootstrap is exact, private, single-use and subject-bound", async () => {
  const db = new FakeD1();
  const ownerIdentity = {
    provider: "google",
    issuer: "https://accounts.google.com",
    subject: "owner-subject",
    email: "owner@gmail.com"
  };
  const bootstrap = await bootstrapOrAuthorizeInvite({
    db,
    identity: ownerIdentity,
    ownerBootstrapEmail: " OWNER@GMAIL.COM ",
    idFactory: () => "owner-account"
  });
  assert.equal(bootstrap.pass, true);
  assert.equal(db.accounts.length, 1);
  assert.equal(db.accounts[0].subject, "owner-subject");

  const repeat = await bootstrapOrAuthorizeInvite({ db, identity: ownerIdentity, ownerBootstrapEmail: "owner@gmail.com" });
  assert.equal(repeat.pass, true);

  const wrongSubject = await bootstrapOrAuthorizeInvite({
    db,
    identity: { ...ownerIdentity, subject: "attacker-subject" },
    ownerBootstrapEmail: "owner@gmail.com"
  });
  assert.equal(wrongSubject.pass, false);
  assert.equal(wrongSubject.reason, "BOUND_SUBJECT_MISMATCH");

  const other = await bootstrapOrAuthorizeInvite({
    db,
    identity: { ...ownerIdentity, email: "other@gmail.com", subject: "other-subject" },
    ownerBootstrapEmail: "owner@gmail.com"
  });
  assert.equal(other.pass, false);
  assert.equal(other.reason, "NOT_EXACTLY_INVITED");
});

test("protected session rechecks current account state and revocation version", async () => {
  const db = new FakeD1();
  db.accounts.push({
    account_id: "acct-1",
    email: "owner@gmail.com",
    enabled: 1,
    provider: "google",
    issuer: "https://accounts.google.com",
    subject: "owner-subject",
    session_version: 1
  });
  const secret = "0123456789abcdef0123456789abcdef";
  const token = await createSessionToken({ accountId: "acct-1", sessionVersion: 1, nowEpochSeconds: 1000, ttlSeconds: 100 }, secret);
  const request = new Request("https://culinary-recommender-app.pages.dev/api/protected-canary", {
    headers: { cookie: `__Host-culinary_session=${token}` }
  });
  const env = { SESSION_SECRET: secret, CULINARY_CONTROL_DB: db };

  assert.equal((await currentSessionAccount({ request, env, nowEpochSeconds: 1050 })).pass, true);
  db.accounts[0].session_version = 2;
  const revoked = await currentSessionAccount({ request, env, nowEpochSeconds: 1050 });
  assert.equal(revoked.pass, false);
  assert.equal(revoked.reason, "SESSION_REVOKED");
  db.accounts[0].session_version = 1;
  db.accounts[0].enabled = 0;
  assert.equal((await currentSessionAccount({ request, env, nowEpochSeconds: 1050 })).reason, "ACCOUNT_DISABLED");
});

test("Pages auth canary keeps static traffic free and runtime identity private", () => {
  const routes = JSON.parse(readFileSync(new URL("../_routes.json", import.meta.url), "utf8"));
  assert.deepEqual(routes.include, ["/api/*"]);
  assert.deepEqual(routes.exclude, []);
  const html = readFileSync(new URL("../auth-canary.html", import.meta.url), "utf8");
  assert.match(html, /\/api\/auth\/config/);
  assert.doesNotMatch(html, /apps\.googleusercontent\.com/);
  assert.doesNotMatch(html, /@gmail\.com/i);
});
