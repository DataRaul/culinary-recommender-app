import { cookieValue, currentSessionAccount, jsonResponse } from "../../../src/server/auth-core.mjs";

const COMMIT_PROBE_COOKIE_NAME = "__Host-culinary_auth_commit_probe";

export async function onRequestGet({ request, env }) {
  const sessionCookiePresent = Boolean(cookieValue(request));
  const commitMarkerPresent = Boolean(cookieValue(request, COMMIT_PROBE_COOKIE_NAME));

  let sessionValidation = sessionCookiePresent ? "UNVALIDATED" : "NO_SESSION";
  if (sessionCookiePresent) {
    if (!env?.SESSION_SECRET || !env?.CULINARY_CONTROL_DB) {
      sessionValidation = "AUTH_NOT_CONFIGURED";
    } else {
      try {
        const current = await currentSessionAccount({ request, env });
        sessionValidation = current.pass ? "AUTHORIZED" : (current.reason || "SESSION_REJECTED");
      } catch {
        sessionValidation = "SESSION_CHECK_EXCEPTION";
      }
    }
  }

  return jsonResponse({
    ok: true,
    probe: "CULINARY_REAL_SESSION_COMMIT_V1",
    sessionCookiePresent,
    commitMarkerPresent,
    sessionValidation
  });
}
