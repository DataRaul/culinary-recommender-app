import {
  bootstrapOrAuthorizeInvite,
  createSessionToken,
  jsonResponse,
  sessionCookie,
  verifyGoogleIdToken
} from "../../../src/server/auth-core.mjs";

export async function onRequestPost({ request, env }) {
  if (!env?.GOOGLE_CLIENT_ID || !env?.SESSION_SECRET || !env?.CULINARY_CONTROL_DB) {
    return jsonResponse({ ok: false, error: "AUTH_NOT_CONFIGURED" }, 503);
  }

  const requestOrigin = request.headers.get("origin");
  const ownOrigin = new URL(request.url).origin;
  if (requestOrigin !== ownOrigin) return jsonResponse({ ok: false, error: "INVALID_ORIGIN" }, 403);

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ ok: false, error: "INVALID_JSON" }, 400);
  }
  const credential = typeof body?.credential === "string" ? body.credential : "";
  if (!credential || credential.length > 16_384) return jsonResponse({ ok: false, error: "INVALID_CREDENTIAL" }, 400);

  const verified = await verifyGoogleIdToken(credential, { expectedAudience: env.GOOGLE_CLIENT_ID });
  if (!verified.pass) return jsonResponse({ ok: false, error: "IDENTITY_REJECTED", reasons: verified.reasons }, 401);

  let authorized;
  try {
    authorized = await bootstrapOrAuthorizeInvite({
      db: env.CULINARY_CONTROL_DB,
      identity: verified.identity,
      ownerBootstrapEmail: env.OWNER_BOOTSTRAP_EMAIL || ""
    });
  } catch {
    return jsonResponse({ ok: false, error: "AUTH_STORE_UNAVAILABLE" }, 503);
  }
  if (!authorized.pass) return jsonResponse({ ok: false, error: authorized.reason }, 403);

  const token = await createSessionToken({
    accountId: authorized.account.accountId,
    sessionVersion: authorized.account.sessionVersion
  }, env.SESSION_SECRET);

  return jsonResponse({
    ok: true,
    authenticated: true,
    account: { id: authorized.account.accountId, email: authorized.account.email }
  }, 200, { "set-cookie": sessionCookie(token) });
}
