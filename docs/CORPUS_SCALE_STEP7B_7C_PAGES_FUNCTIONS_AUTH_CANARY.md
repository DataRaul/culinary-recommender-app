# Corpus Scale Step 7B/7C — Free Resource Proof and Same-Origin Auth Canary

Date: 2026-09-05

Status: **STEP_7B `FREE_NO_BILLING_AUTHORIZATION_CONFIRMED` / STEP_7C `LIVE_AUTH_REVOCATION_CANARY_PASS`**

This document records the owner-visible Free-resource checks and the completed same-origin authentication canary. It does not authorize paid infrastructure, mass corpus population, public signup, production OAuth publishing, R2, Zero Trust, Workers Paid, or paid recipe-source admission.

## 1. Step 7B owner-visible Free-resource evidence

The owner completed the following account-side checks without accepting a checkout, subscription, payment authorization, or overage authorization:

- created D1 Free database `culinary-control` with EU jurisdiction;
- created Workers Free diagnostic canary `culinary-gateway-canary`;
- bound the diagnostic Worker to `culinary-control` as `CULINARY_CONTROL_DB`;
- deployed a minimal D1 query and received `{"ok":1}` from `SELECT 1 AS ok`;
- remained on Workers Free and did not activate Workers Paid;
- did not activate R2 or Cloudflare Zero Trust / Access.

Step 7B terminal result:

`FREE_NO_BILLING_AUTHORIZATION_CONFIRMED`

Any later screen containing billing/payment/overage authorization remains a hard stop.

## 2. Google identity prerequisites

The bounded Google identity setup used by Step 7C is:

- Google Auth Platform user type `External`;
- publishing status `Testing`;
- one owner test user;
- one Web application OAuth client for Culinary Recommender;
- authorized JavaScript origin `https://culinary-recommender-app.pages.dev`;
- no custom domain, production publication, paid API, or client-secret download required for this canary.

The repository never stores the owner's invited email, a client secret, the session secret, a session cookie, or a reusable Google credential.

## 3. Production-shaped auth surface

The accepted lightweight runtime shape is:

```text
culinary-recommender-app.pages.dev
  static shell / auth-canary.html
        |
        +-- same-origin /api/auth/* Pages Functions
        |       - Google ID-token verification
        |       - exact private invite authorization
        |       - __Host- Secure/HttpOnly/SameSite=Lax session
        |
        +-- same-origin protected API routes
                - current account + session_version recheck
                - D1 access only after authorization
                        |
                        v
                 culinary-control (D1 Free)
```

Pages Functions consume the Workers Free runtime. `_routes.json` invokes Functions only for `/api/*`, leaving ordinary static traffic outside the Functions path.

## 4. Security contract proven by repository tests and live canary

The implementation preserves the Step 7A contract:

- no public signup;
- Google proves identity, not authorization;
- server-side Google JWKS signature, audience, issuer, expiry, subject and verified-email checks;
- exact private invitation/bootstrap authorization;
- stable provider issuer + subject binding;
- `__Host-` session cookie with `Secure`, `HttpOnly`, `SameSite=Lax`, `Path=/`;
- HMAC-SHA256 session integrity and expiry;
- every protected request rechecks current D1 account enabled state and `session_version`;
- revocation fails closed;
- Google ID tokens are not retained as reusable application sessions.

## 5. Step 7C implementation lineage

- PR #72 / merge `d02eed5558fb620d47bc7424e5b2a63c39caf3ad` — initial same-origin Pages Functions auth canary and D1 account schema.
- PR #74 / merge `05531bacbab028beb9e57a6f9490e2a2e7a12fd3` — bounded reload diagnostics, explicit same-origin credentials and stale-cookie clearing.
- PR #75 / merge `d3f6e1a233240fff6a7075761d5a5d132ca99265` — temporary non-secret runtime probe used only to classify the live cookie issue.
- PR #76 / merge `e99ffa7ac6c9d1976500fc2ff0fd7739baef7ae8` — authenticated same-origin self-revocation canary and regression coverage.

PR #76 validation run `33996446995` passed. Post-merge validation run `33996530533` passed. Cloudflare Pages production deployment for merge `e99ffa7` completed successfully.

## 6. Live owner canary evidence

No account ID, email, session token, cookie value, Google credential, or secret is retained in this evidence.

Observed production sequence on `https://culinary-recommender-app.pages.dev`:

1. Before a fresh Culinary login, the temporary runtime probe reported runtime bindings configured but `cookiePresent:false` and `reason:"NO_SESSION"`. This classified the earlier 401 as absence of an application session, not a signature or D1-binding failure.
2. Fresh Google sign-in returned HTTP 200 with `authenticated:true`.
3. A later page/session check returned HTTP 200 with `authenticated:true`, proving the Culinary session persisted in the tested browser context.
4. The protected D1 route returned HTTP 200 with `ok:true` and `authenticated:true`.
5. `Revoke current session` returned HTTP 200 with `revoked:true` and `nextExpectedReason:"SESSION_REVOKED"`.
6. The next protected-route request returned HTTP 401 with `reason:"SESSION_REVOKED"`.

Terminal result:

`STEP_7C_LIVE_AUTH_REVOCATION_CANARY_PASS`

The temporary public runtime-probe endpoint is removed in the Step 7D implementation branch after serving its bounded diagnostic purpose.

## 7. Gate state after Step 7C PASS

- Step 7A: `NO_BILLING_AUTH_170K_ARCHITECTURE_PASS` / merged green.
- Step 7B: `FREE_NO_BILLING_AUTHORIZATION_CONFIRMED` / complete.
- Step 7C: `STEP_7C_LIVE_AUTH_REVOCATION_CANARY_PASS` / complete.
- Step 7D protected 84-record canary: **UNBLOCKED / IMPLEMENTATION IN PROGRESS**. It must measure the protected 84-record oracle on the existing `culinary-control` D1 Free database, prove unauthenticated/non-member/revoked/Free-limit paths fail closed, prove an allowed owner can retrieve protected data, and collect D1 runtime metrics plus owner-visible Workers CPU evidence.
- Step 7E real-source pilot: blocked until Step 7D PASS.

Step 7D must not create the eight future recipe-body D1 shard databases. One D1 database slot remains reserved by the 170k architecture. No paid infrastructure is authorized.
