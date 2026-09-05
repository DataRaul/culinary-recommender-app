import { clearSessionCookie, jsonResponse } from "../../../src/server/auth-core.mjs";

export function onRequestPost() {
  return jsonResponse({ ok: true }, 200, { "set-cookie": clearSessionCookie() });
}
