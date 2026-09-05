import { currentSessionAccount, jsonResponse } from "../../../src/server/auth-core.mjs";

export async function onRequestPost({ request, env }) {
  if (!env?.SESSION_SECRET || !env?.CULINARY_CONTROL_DB) {
    return jsonResponse({ ok: false, error: "AUTH_NOT_CONFIGURED" }, 503);
  }

  const requestOrigin = request.headers.get("origin");
  const ownOrigin = new URL(request.url).origin;
  if (requestOrigin !== ownOrigin) {
    return jsonResponse({ ok: false, error: "INVALID_ORIGIN" }, 403);
  }

  const current = await currentSessionAccount({ request, env });
  if (!current.pass) {
    return jsonResponse({
      ok: false,
      authenticated: false,
      error: current.reason || "SESSION_REJECTED"
    }, 401);
  }

  let result;
  try {
    result = await env.CULINARY_CONTROL_DB.prepare(
      "UPDATE invited_accounts SET session_version = session_version + 1 WHERE account_id = ? AND enabled = 1 AND session_version = ?"
    ).bind(current.account.accountId, current.account.sessionVersion).run();
  } catch {
    return jsonResponse({ ok: false, error: "AUTH_STORE_UNAVAILABLE" }, 503);
  }

  if (Number(result?.meta?.changes || 0) !== 1) {
    return jsonResponse({ ok: false, error: "REVOCATION_RACE" }, 409);
  }

  // Intentionally keep the stale cookie for one follow-up protected-route call.
  // That call must fail with SESSION_REVOKED and will then clear the rejected cookie.
  return jsonResponse({
    ok: true,
    authenticated: false,
    revoked: true,
    nextExpectedReason: "SESSION_REVOKED"
  });
}
