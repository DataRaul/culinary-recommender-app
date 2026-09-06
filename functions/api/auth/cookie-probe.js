const PROBE_TTL_SECONDS = 60;

const PROBES = {
  host: {
    name: "__Host-culinary_probe_host",
    attributes: "Path=/; Secure; SameSite=Lax"
  },
  secure: {
    name: "__Secure-culinary_probe_secure",
    attributes: "Path=/; Secure; SameSite=Lax"
  },
  plain: {
    name: "culinary_probe_plain",
    attributes: "Path=/; Secure; SameSite=Lax"
  },
  http: {
    name: "__Host-culinary_probe_http",
    attributes: "Path=/; Secure; HttpOnly; SameSite=Lax"
  }
};

const ORDER = ["host", "secure", "plain", "http"];

function cookieNames(request) {
  const raw = request.headers.get("cookie") || "";
  const names = new Set();
  for (const part of raw.split(";")) {
    const index = part.indexOf("=");
    if (index <= 0) continue;
    names.add(part.slice(0, index).trim());
  }
  return names;
}

function redirectWithProbe(stage, nextLocation) {
  const probe = PROBES[stage];
  return new Response(null, {
    status: 303,
    headers: {
      location: nextLocation,
      "set-cookie": `${probe.name}=1; ${probe.attributes}; Max-Age=${PROBE_TTL_SECONDS}`,
      "cache-control": "no-store",
      "referrer-policy": "no-referrer",
      "x-content-type-options": "nosniff"
    }
  });
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "referrer-policy": "no-referrer",
      "x-content-type-options": "nosniff"
    }
  });
}

export function onRequestGet({ request }) {
  const url = new URL(request.url);
  const stage = url.searchParams.get("stage") || "host";

  if (stage === "check") {
    const names = cookieNames(request);
    const result = Object.fromEntries(ORDER.map(key => [key, names.has(PROBES[key].name)]));
    return json({
      ok: true,
      probe: "CULINARY_SERVER_COOKIE_ACCEPTANCE_V1",
      result,
      acceptedCount: Object.values(result).filter(Boolean).length,
      expectedCount: ORDER.length
    });
  }

  const index = ORDER.indexOf(stage);
  if (index === -1) return json({ ok: false, error: "INVALID_PROBE_STAGE" }, 400);
  const nextLocation = index === ORDER.length - 1
    ? "/auth-cookie-probe.html"
    : `/api/auth/cookie-probe?stage=${ORDER[index + 1]}`;
  return redirectWithProbe(stage, nextLocation);
}
