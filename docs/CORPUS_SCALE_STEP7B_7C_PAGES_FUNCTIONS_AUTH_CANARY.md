# Corpus Scale Step 7B/7C — Free Resource Proof and Same-Origin Auth Canary

Date: 2026-09-05

Status: **STEP_7B `FREE_NO_BILLING_AUTHORIZATION_CONFIRMED` / STEP_7C ACCOUNT PREREQUISITES COMPLETE / SAME-ORIGIN AUTH CANARY IMPLEMENTED_PENDING_CI**

This document records the owner-visible Free-resource checks and the smallest code-side authentication canary that follows them. It does not authorize paid infrastructure, corpus population, public signup, production OAuth publishing, R2, Zero Trust, Workers Paid, or recipe-source admission.

## 1. Owner-visible Step 7B evidence

The owner completed the following account-side checks without accepting a checkout, subscription, payment authorization, or overage authorization:

- created D1 Free database `culinary-control` with EU jurisdiction;
- created Workers Free canary `culinary-gateway-canary`;
- bound the canary Worker to `culinary-control` as `CULINARY_CONTROL_DB`;
- deployed a minimal D1 query and received `{"ok":1}` from `SELECT 1 AS ok`;
- remained on Workers Free and did not activate Workers Paid;
- did not activate R2 or Cloudflare Zero Trust / Access.

Step 7B terminal result is therefore:

`FREE_NO_BILLING_AUTHORIZATION_CONFIRMED`

This result is account-specific evidence for the current Free deployment shape. It does not weaken the standing rule that any future screen containing billing/payment/overage authorization is a hard stop.

## 2. Google identity account-side prerequisites

The owner also completed the bounded Google identity setup needed for the canary:

- Google Auth Platform configured for the existing `culinary-lab` project;
- user type `External`;
- publishing status remains `Testing`;
- one owner test user added;
- one Web application OAuth client created for Culinary Recommender;
- authorized JavaScript origin is the existing Pages origin `https://culinary-recommender-app.pages.dev`;
- no custom domain, Search Console verification, production publishing, paid API, or client-secret download is required for this canary;
- the public OAuth client ID was added as runtime configuration on the temporary Worker canary while account setup was being proven.

The repository never stores the owner's invited email, a client secret, a session secret, or a reusable Google credential.

## 3. Architecture refinement: Pages Functions for the real lightweight app

The standalone Worker remains useful evidence that Workers Free can execute and access D1, but it is **not** the preferred application auth surface.

The application shell already lives at `culinary-recommender-app.pages.dev`. Keeping the UI on `pages.dev` while placing the authenticated API on an unrelated `workers.dev` site would make the hardened `SameSite=Lax` session-cookie contract unnecessarily dependent on cross-site-cookie behavior.

The production-shaped canary therefore uses **Cloudflare Pages Functions inside the existing Pages project**:

```text
culinary-recommender-app.pages.dev
  static shell / auth-canary.html
        |
        +-- same-origin /api/auth/* Pages Functions
        |       - Google ID-token verification
        |       - exact private invite authorization
        |       - __Host- Secure/HttpOnly/SameSite=Lax session
        |
        +-- same-origin /api/protected-canary
                - current account/revocation recheck
                - D1 canary query
                        |
                        v
                 culinary-control (D1 Free)
```

Pages Functions consume the same Workers Free request/CPU quota. `_routes.json` restricts Function invocation to `/api/*`, leaving ordinary static assets outside the Functions path.

No custom domain is required for this architecture.

## 4. Canary security contract

The implementation preserves the Step 7A contract:

- no public signup;
- Google is an identity provider, not authorization authority;
- Google ID tokens are verified server-side against Google's JWKS signature plus `aud`, `iss`, `exp`, `sub`, `email`, and `email_verified`;
- Google-authoritative email proof remains limited to Gmail or Google Workspace identities with the hosted-domain signal;
- exact invite membership is private D1 runtime state;
- provider issuer + subject become the stable account binding;
- the owner's email is supplied only as a temporary runtime secret for first bootstrap and is never committed;
- after the first owner account is successfully created, the bootstrap secret may be removed; an empty account table is required for bootstrap;
- session cookies use the `__Host-` prefix with `Secure`, `HttpOnly`, `SameSite=Lax`, and `Path=/`;
- session payloads are HMAC-SHA256 protected and short-lived;
- every protected request rechecks current D1 account enabled state and `session_version` so revocation fails closed;
- Google ID tokens are not stored as reusable application sessions;
- no recipe/index data is exposed by the canary.

## 5. Repository canary surface

- `src/server/auth-core.mjs` — portable identity/session/allowlist primitives;
- `functions/api/auth/config.js` — public client-ID configuration only;
- `functions/api/auth/google.js` — server-side Google verification + exact invite/bootstrap + session issue;
- `functions/api/auth/session.js` — current session check;
- `functions/api/auth/logout.js` — session clear;
- `functions/api/protected-canary.js` — protected D1 `SELECT 1` route;
- `migrations/0001_auth_canary.sql` — private allowlist/account schema;
- `auth-canary.html` — isolated login/security canary; no recipe data;
- `_routes.json` — invoke Pages Functions only for `/api/*`;
- `_headers` — bounded canary hardening headers;
- `tests/auth-canary.test.js` — cryptographic, authorization, revocation, bootstrap and routing regression coverage.

## 6. Remaining human-only configuration after merge

Do not create the eight recipe-body D1 shards yet. Do not populate recipe data yet.

On the existing **Pages project** `culinary-recommender-app` only:

1. add D1 binding `CULINARY_CONTROL_DB` -> `culinary-control` for Production;
2. add plain runtime variable `GOOGLE_CLIENT_ID` using the already-created Google Web client ID;
3. add secret `SESSION_SECRET` with a fresh random value of at least 32 characters;
4. add temporary secret `OWNER_BOOTSTRAP_EMAIL` containing only the owner's exact Google-authoritative invited address;
5. run `migrations/0001_auth_canary.sql` once in the `culinary-control` D1 Console;
6. redeploy the Pages project so bindings/secrets are available;
7. open `/auth-canary.html`, sign in as the sole Google test user, and require the protected canary to return success;
8. after the first successful owner bootstrap, remove `OWNER_BOOTSTRAP_EMAIL` and redeploy;
9. verify the existing session still works, then increment `session_version` or disable the account in D1 and prove the protected route fails closed.

Any billing/payment/overage authorization screen remains a hard stop.

## 7. Gate state

- Step 7A: `NO_BILLING_AUTH_170K_ARCHITECTURE_PASS` / merged green.
- Step 7B: `FREE_NO_BILLING_AUTHORIZATION_CONFIRMED` / owner-visible account proof complete.
- Step 7C account prerequisites: complete.
- Step 7C code canary: implemented here, pending repository CI/merge and Pages binding deployment.
- Step 7D protected 84-record canary: **not started**. The auth/D1 canary must pass first; actual Workers Free CPU/subrequest/D1 consumption remains a required live measurement.
- Step 7E real-source pilot: blocked until Step 7D PASS.

The temporary standalone Worker `culinary-gateway-canary` may remain as a disposable Free diagnostic until the Pages Function canary passes; it is not production authority and must never be upgraded to Workers Paid.
