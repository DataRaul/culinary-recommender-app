import { clearSessionCookie, currentSessionAccount, jsonResponse } from "../../../src/server/auth-core.mjs";

export async function onRequestGet({ request, env }) {
  if (!env?.SESSION_SECRET || !env?.CULINARY_CONTROL_DB) {
    return jsonResponse({ authenticated: false, error: "AUTH_NOT_CONFIGURED" }, 503);
  }

  const current = await currentSessionAccount({ request, env });
  if (!current.pass) {
    const headers = current.reason === "NO_SESSION"
      ? {}
      : { "set-cookie": clearSessionCookie() };
    return jsonResponse({
      authenticated: false,
      reason: current.reason || "SESSION_REJECTED"
    }, 401, headers);
  }

  return jsonResponse({
    authenticated: true,
    account: { id: current.account.accountId, email: current.account.email }
  });
}
