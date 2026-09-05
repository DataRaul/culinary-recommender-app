import { jsonResponse } from "../../../src/server/auth-core.mjs";

export function onRequestGet({ env }) {
  if (!env?.GOOGLE_CLIENT_ID) return jsonResponse({ ok: false, error: "AUTH_NOT_CONFIGURED" }, 503);
  return jsonResponse({ ok: true, clientId: env.GOOGLE_CLIENT_ID });
}
