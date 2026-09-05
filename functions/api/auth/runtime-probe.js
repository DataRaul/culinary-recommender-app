import {
  cookieValue,
  currentSessionAccount,
  jsonResponse
} from "../../../src/server/auth-core.mjs";

export async function onRequestGet({ request, env }) {
  const requestUrl = new URL(request.url);
  const configured = Boolean(env?.SESSION_SECRET && env?.CULINARY_CONTROL_DB);
  const cookiePresent = Boolean(cookieValue(request));

  if (!configured) {
    return jsonResponse({
      ok: false,
      probe: "STEP7C_SESSION_RUNTIME_PROBE_V1",
      host: requestUrl.host,
      configured: false,
      sessionSecretConfigured: Boolean(env?.SESSION_SECRET),
      controlDbConfigured: Boolean(env?.CULINARY_CONTROL_DB),
      cookiePresent,
      authenticated: false,
      reason: "AUTH_NOT_CONFIGURED"
    }, 503);
  }

  let current;
  try {
    current = await currentSessionAccount({ request, env });
  } catch {
    return jsonResponse({
      ok: false,
      probe: "STEP7C_SESSION_RUNTIME_PROBE_V1",
      host: requestUrl.host,
      configured: true,
      sessionSecretConfigured: true,
      controlDbConfigured: true,
      cookiePresent,
      authenticated: false,
      reason: "SESSION_CHECK_EXCEPTION"
    }, 503);
  }

  return jsonResponse({
    ok: true,
    probe: "STEP7C_SESSION_RUNTIME_PROBE_V1",
    host: requestUrl.host,
    configured: true,
    sessionSecretConfigured: true,
    controlDbConfigured: true,
    cookiePresent,
    authenticated: current.pass,
    reason: current.pass ? "AUTHORIZED" : current.reason,
    accountId: current.pass ? current.account.accountId : null
  }, 200);
}
