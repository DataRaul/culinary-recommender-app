const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

export const GOOGLE_ISSUERS = new Set(["accounts.google.com", "https://accounts.google.com"]);
export const GOOGLE_JWKS_URL = "https://www.googleapis.com/oauth2/v3/certs";
export const SESSION_COOKIE_NAME = "__Host-culinary_session";
export const DEFAULT_SESSION_TTL_SECONDS = 8 * 60 * 60;

let jwksCache = { expiresAtMs: 0, keys: null };

export function normalizeInviteEmail(value) {
  return String(value || "").trim().toLowerCase();
}

export function isGoogleAuthoritativeEmail(claims = {}) {
  if (claims.email_verified !== true) return false;
  const email = normalizeInviteEmail(claims.email);
  if (!email) return false;
  if (email.endsWith("@gmail.com")) return true;
  return typeof claims.hd === "string" && claims.hd.trim().length > 0;
}

function bytesToBase64Url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(value) {
  const normalized = String(value || "").replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4 || 4)) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, char => char.charCodeAt(0));
}

function encodeJson(value) {
  return bytesToBase64Url(textEncoder.encode(JSON.stringify(value)));
}

function decodeJson(value) {
  return JSON.parse(textDecoder.decode(base64UrlToBytes(value)));
}

function maxAgeFromCacheControl(cacheControl) {
  const match = String(cacheControl || "").match(/(?:^|,)\s*max-age=(\d+)/i);
  return match ? Number(match[1]) : 300;
}

async function getGoogleJwks(fetchImpl = fetch, nowMs = Date.now()) {
  if (jwksCache.keys && jwksCache.expiresAtMs > nowMs) return jwksCache.keys;
  const response = await fetchImpl(GOOGLE_JWKS_URL, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error("GOOGLE_JWKS_FETCH_FAILED");
  const body = await response.json();
  if (!Array.isArray(body?.keys) || body.keys.length === 0) throw new Error("GOOGLE_JWKS_INVALID");
  const ttlSeconds = Math.max(60, Math.min(86_400, maxAgeFromCacheControl(response.headers?.get?.("cache-control"))));
  jwksCache = { expiresAtMs: nowMs + ttlSeconds * 1000, keys: body.keys };
  return body.keys;
}

export function validateGoogleClaims(claims, expectedAudience, nowEpochSeconds = Math.floor(Date.now() / 1000)) {
  const reasons = [];
  if (!GOOGLE_ISSUERS.has(claims?.iss)) reasons.push("INVALID_ISSUER");
  const audience = claims?.aud;
  const audienceMatches = Array.isArray(audience)
    ? audience.includes(expectedAudience)
    : audience === expectedAudience;
  if (!expectedAudience || !audienceMatches) reasons.push("INVALID_AUDIENCE");
  if (!Number.isFinite(Number(claims?.exp)) || Number(claims.exp) <= nowEpochSeconds) reasons.push("EXPIRED_OR_MISSING_EXPIRY");
  if (typeof claims?.sub !== "string" || !claims.sub.trim()) reasons.push("MISSING_SUBJECT");
  if (!normalizeInviteEmail(claims?.email)) reasons.push("MISSING_EMAIL");
  if (claims?.email_verified !== true) reasons.push("EMAIL_NOT_VERIFIED");
  if (!isGoogleAuthoritativeEmail(claims)) reasons.push("GOOGLE_NOT_AUTHORITATIVE_FOR_EMAIL");
  return reasons;
}

export async function verifyGoogleIdToken(token, {
  expectedAudience,
  fetchImpl = fetch,
  jwks = null,
  nowEpochSeconds = Math.floor(Date.now() / 1000)
} = {}) {
  const parts = String(token || "").split(".");
  if (parts.length !== 3) return { pass: false, reasons: ["MALFORMED_TOKEN"], identity: null, claims: null };

  let header;
  let claims;
  try {
    header = decodeJson(parts[0]);
    claims = decodeJson(parts[1]);
  } catch {
    return { pass: false, reasons: ["MALFORMED_TOKEN"], identity: null, claims: null };
  }

  if (header?.alg !== "RS256" || typeof header?.kid !== "string" || !header.kid) {
    return { pass: false, reasons: ["UNSUPPORTED_TOKEN_HEADER"], identity: null, claims };
  }

  let keys;
  try {
    keys = jwks || await getGoogleJwks(fetchImpl);
  } catch {
    return { pass: false, reasons: ["GOOGLE_JWKS_UNAVAILABLE"], identity: null, claims };
  }
  const jwk = keys.find(key => key?.kid === header.kid && key?.kty === "RSA");
  if (!jwk) return { pass: false, reasons: ["SIGNING_KEY_NOT_FOUND"], identity: null, claims };

  let signatureVerified = false;
  try {
    const publicKey = await crypto.subtle.importKey(
      "jwk",
      jwk,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["verify"]
    );
    signatureVerified = await crypto.subtle.verify(
      "RSASSA-PKCS1-v1_5",
      publicKey,
      base64UrlToBytes(parts[2]),
      textEncoder.encode(`${parts[0]}.${parts[1]}`)
    );
  } catch {
    signatureVerified = false;
  }

  const reasons = [];
  if (!signatureVerified) reasons.push("SIGNATURE_NOT_VERIFIED");
  reasons.push(...validateGoogleClaims(claims, expectedAudience, nowEpochSeconds));
  if (reasons.length) return { pass: false, reasons: [...new Set(reasons)], identity: null, claims };

  return {
    pass: true,
    reasons: [],
    claims,
    identity: {
      provider: "google",
      issuer: claims.iss,
      subject: claims.sub,
      email: normalizeInviteEmail(claims.email)
    }
  };
}

async function importSessionKey(secret, usages) {
  if (typeof secret !== "string" || secret.length < 32) throw new Error("SESSION_SECRET_TOO_SHORT");
  return crypto.subtle.importKey(
    "raw",
    textEncoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    usages
  );
}

export async function createSessionToken({ accountId, sessionVersion, nowEpochSeconds = Math.floor(Date.now() / 1000), ttlSeconds = DEFAULT_SESSION_TTL_SECONDS }, secret) {
  if (!accountId || !Number.isInteger(Number(sessionVersion))) throw new Error("INVALID_SESSION_SUBJECT");
  const payload = encodeJson({
    a: String(accountId),
    v: Number(sessionVersion),
    iat: nowEpochSeconds,
    exp: nowEpochSeconds + ttlSeconds
  });
  const key = await importSessionKey(secret, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, textEncoder.encode(payload));
  return `${payload}.${bytesToBase64Url(new Uint8Array(signature))}`;
}

export async function verifySessionToken(token, secret, nowEpochSeconds = Math.floor(Date.now() / 1000)) {
  const parts = String(token || "").split(".");
  if (parts.length !== 2) return { pass: false, reason: "MALFORMED_SESSION" };
  try {
    const key = await importSessionKey(secret, ["verify"]);
    const ok = await crypto.subtle.verify(
      "HMAC",
      key,
      base64UrlToBytes(parts[1]),
      textEncoder.encode(parts[0])
    );
    if (!ok) return { pass: false, reason: "INVALID_SESSION_SIGNATURE" };
    const payload = decodeJson(parts[0]);
    if (!payload?.a || !Number.isInteger(Number(payload?.v))) return { pass: false, reason: "INVALID_SESSION_PAYLOAD" };
    if (!Number.isFinite(Number(payload?.exp)) || Number(payload.exp) <= nowEpochSeconds) return { pass: false, reason: "SESSION_EXPIRED" };
    return { pass: true, payload };
  } catch {
    return { pass: false, reason: "INVALID_SESSION" };
  }
}

export function sessionCookie(token, ttlSeconds = DEFAULT_SESSION_TTL_SECONDS) {
  return `${SESSION_COOKIE_NAME}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${ttlSeconds}`;
}

export function clearSessionCookie() {
  return `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

export function cookieValue(request, name = SESSION_COOKIE_NAME) {
  const raw = request?.headers?.get?.("cookie") || "";
  for (const part of raw.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return rest.join("=");
  }
  return null;
}

function accountFromRow(row) {
  if (!row) return null;
  return {
    accountId: String(row.account_id),
    email: normalizeInviteEmail(row.email),
    enabled: Number(row.enabled) === 1,
    provider: row.provider || null,
    issuer: row.issuer || null,
    subject: row.subject || null,
    sessionVersion: Number(row.session_version || 1)
  };
}

export async function bootstrapOrAuthorizeInvite({ db, identity, ownerBootstrapEmail, idFactory = () => crypto.randomUUID() }) {
  if (!db || !identity?.email || !identity?.subject || !identity?.issuer) return { pass: false, reason: "INVALID_AUTHORIZATION_INPUT" };
  const email = normalizeInviteEmail(identity.email);
  let row = await db.prepare(
    "SELECT account_id, email, enabled, provider, issuer, subject, session_version FROM invited_accounts WHERE email = ? LIMIT 1"
  ).bind(email).first();

  if (!row) {
    if (normalizeInviteEmail(ownerBootstrapEmail) !== email) return { pass: false, reason: "NOT_EXACTLY_INVITED" };
    const countRow = await db.prepare("SELECT COUNT(*) AS count FROM invited_accounts").first();
    if (Number(countRow?.count || 0) !== 0) return { pass: false, reason: "OWNER_BOOTSTRAP_CLOSED" };
    const accountId = idFactory();
    await db.prepare(
      "INSERT INTO invited_accounts (account_id, email, enabled, provider, issuer, subject, session_version) VALUES (?, ?, 1, 'google', ?, ?, 1)"
    ).bind(accountId, email, identity.issuer, identity.subject).run();
    row = await db.prepare(
      "SELECT account_id, email, enabled, provider, issuer, subject, session_version FROM invited_accounts WHERE account_id = ? LIMIT 1"
    ).bind(accountId).first();
  }

  let account = accountFromRow(row);
  if (!account?.enabled) return { pass: false, reason: "ACCOUNT_DISABLED" };
  if (account.provider && account.provider !== identity.provider) return { pass: false, reason: "PROVIDER_MISMATCH" };
  if (account.issuer && account.issuer !== identity.issuer) return { pass: false, reason: "BOUND_ISSUER_MISMATCH" };
  if (account.subject && account.subject !== identity.subject) return { pass: false, reason: "BOUND_SUBJECT_MISMATCH" };

  if (!account.subject || !account.issuer) {
    const result = await db.prepare(
      "UPDATE invited_accounts SET provider = 'google', issuer = ?, subject = ? WHERE account_id = ? AND (subject IS NULL OR subject = '')"
    ).bind(identity.issuer, identity.subject, account.accountId).run();
    if (Number(result?.meta?.changes || 0) !== 1) return { pass: false, reason: "IDENTITY_BIND_RACE" };
    account = { ...account, provider: "google", issuer: identity.issuer, subject: identity.subject };
  }

  return { pass: true, reason: "AUTHORIZED", account };
}

export async function currentSessionAccount({ request, env, nowEpochSeconds = Math.floor(Date.now() / 1000) }) {
  const token = cookieValue(request);
  if (!token) return { pass: false, reason: "NO_SESSION" };
  const verified = await verifySessionToken(token, env?.SESSION_SECRET, nowEpochSeconds);
  if (!verified.pass) return verified;
  const row = await env.CULINARY_CONTROL_DB.prepare(
    "SELECT account_id, email, enabled, provider, issuer, subject, session_version FROM invited_accounts WHERE account_id = ? LIMIT 1"
  ).bind(verified.payload.a).first();
  const account = accountFromRow(row);
  if (!account?.enabled) return { pass: false, reason: "ACCOUNT_DISABLED" };
  if (account.sessionVersion !== Number(verified.payload.v)) return { pass: false, reason: "SESSION_REVOKED" };
  return { pass: true, account, payload: verified.payload };
}

export function jsonResponse(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...headers
    }
  });
}
