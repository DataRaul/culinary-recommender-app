import { clearSessionCookie, currentSessionAccount, jsonResponse } from "../../src/server/auth-core.mjs";

export async function onRequestGet({ request, env }) {
  if (!env?.SESSION_SECRET || !env?.CULINARY_CONTROL_DB) {
    return jsonResponse({ ok: false, error: "AUTH_NOT_CONFIGURED" }, 503);
  }

  const current = await currentSessionAccount({ request, env });
  if (!current.pass) {
    const headers = current.reason === "NO_SESSION"
      ? {}
      : { "set-cookie": clearSessionCookie() };
    return jsonResponse({
      ok: false,
      error: "UNAUTHORIZED",
      reason: current.reason || "SESSION_REJECTED"
    }, 401, headers);
  }

  const dbCheck = await env.CULINARY_CONTROL_DB.prepare("SELECT 1 AS ok").first();
  return jsonResponse({
    ok: Number(dbCheck?.ok) === 1,
    authenticated: true,
    accountId: current.account.accountId
  });
}
