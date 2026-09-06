import { onRequestPost as issueGoogleSession } from "./google.js";

const SUCCESS_LOCATION = "/auth-canary.html?auth=complete";

export async function handleGoogleRedirect({ request, env, issueSession = issueGoogleSession }) {
  const requestOrigin = request.headers.get("origin");
  const ownOrigin = new URL(request.url).origin;
  if (requestOrigin !== ownOrigin) {
    return new Response(JSON.stringify({ ok: false, error: "INVALID_ORIGIN" }), {
      status: 403,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store"
      }
    });
  }

  let form;
  try {
    form = await request.formData();
  } catch {
    return new Response(JSON.stringify({ ok: false, error: "INVALID_FORM" }), {
      status: 400,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store"
      }
    });
  }

  const credential = typeof form.get("credential") === "string" ? form.get("credential") : "";
  if (!credential || credential.length > 16_384) {
    return new Response(JSON.stringify({ ok: false, error: "INVALID_CREDENTIAL" }), {
      status: 400,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store"
      }
    });
  }

  const delegatedRequest = new Request(request.url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: requestOrigin
    },
    body: JSON.stringify({ credential })
  });
  const issued = await issueSession({ request: delegatedRequest, env });
  if (issued.status !== 200) return issued;

  const issuedBody = await issued.clone().json().catch(() => null);
  const setCookie = issued.headers.get("set-cookie");
  if (issuedBody?.ok !== true || issuedBody?.authenticated !== true || !setCookie) {
    return new Response(JSON.stringify({ ok: false, error: "SESSION_ISSUANCE_INCOMPLETE" }), {
      status: 503,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store"
      }
    });
  }

  return new Response(null, {
    status: 303,
    headers: {
      location: SUCCESS_LOCATION,
      "set-cookie": setCookie,
      "cache-control": "no-store",
      "referrer-policy": "no-referrer",
      "x-content-type-options": "nosniff"
    }
  });
}

export async function onRequestPost(context) {
  return handleGoogleRedirect(context);
}
