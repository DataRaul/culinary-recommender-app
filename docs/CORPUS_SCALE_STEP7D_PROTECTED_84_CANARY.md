# Corpus Scale Step 7D — Protected 84-Record Runtime Canary

Date: 2026-09-06

Status: **STEP_7D_PROTECTED_84_CANARY_PASS**

## Purpose

Step 7D is the production-shaped security/runtime gate between the completed Step 7C authentication proof and any real corpus expansion.

It uses the already-reviewed 84-record corpus as an oracle while preserving all existing public behavior. It does not admit new recipe sources and does not create any of the eight future recipe-body shard databases.

## Runtime shape

The canary uses only the existing Free resources already accepted in Step 7B/7C:

- existing Cloudflare Pages Free project;
- same-origin `/api/*` Pages Functions on Workers Free;
- existing `culinary-control` D1 Free database;
- existing Google GIS/OIDC owner identity and exact private account authorization.

A temporary table named `step7d_recipe_oracle` is created inside `culinary-control`. The tracked schema is `migrations/0002_step7d_oracle.sql`; the authenticated bootstrap route creates the same table idempotently so the owner does not need a second manual D1 migration step.

The eight future recipe-body D1 shard databases remain **uncreated**. The reserved database slot remains untouched.

## Protected routes

### `POST /api/step7d/bootstrap`

- same-origin mutation only;
- requires a valid current Culinary session;
- bundles the existing `ALL_RECIPES` golden corpus;
- requires exactly 84 unique recipe IDs;
- inserts the 84 records only when the oracle table is empty;
- verifies the post-write SHA-256 fingerprint;
- is idempotent when the exact oracle is already present;
- fails closed on partial/mismatched state rather than overwriting it;
- reports bounded D1 write/read/size metadata without returning recipe bodies.

### `GET /api/step7d/oracle`

- requires a valid current Culinary session before any oracle query;
- reads all 84 rows and reports count, SHA-256 fingerprint, total stored body bytes and D1 metadata;
- does not return recipe bodies in audit mode.

### `GET /api/step7d/oracle?sample=1`

- requires authorization;
- returns one protected recipe body to prove allowed-data retrieval.

### `GET /api/step7d/oracle?simulate=free-limit`

- authenticates first;
- deliberately returns HTTP 503 `FREE_LIMIT_FAIL_CLOSED` before any oracle query;
- returns no protected recipe data;
- proves the application-level Free-exhaustion/error path does not bypass authorization or degrade open.

The simulated failure is not a claim that a real Cloudflare Free quota has been exhausted.

## Repository security gate

Repository tests proved:

1. the golden oracle is exactly 84 unique records;
2. bootstrap is authenticated, same-origin, deterministic, fingerprinted and idempotent;
3. unauthenticated requests cannot query oracle data;
4. a session for a non-member account cannot query oracle data;
5. a current invited/allowed account can audit and retrieve a sample recipe;
6. `session_version` revocation rejects the stale session and clears it fail-closed;
7. simulated Free-limit failure returns no protected data and performs zero oracle queries;
8. cross-origin bootstrap mutation is rejected before auth or D1 writes;
9. ordinary static Pages routing remains unchanged (`/api/*` only for Functions).

The Step 7C live revocation proof is inherited evidence and remains valid.

## Production live canary evidence

The owner completed the production canary on the canonical Pages host.

### Session restoration

- Google sign-in / restored Culinary session: HTTP 200.
- `authenticated:true`.
- No owner email, account ID, cookie, token or secret is retained here.

### Oracle initialization and integrity

- bootstrap: HTTP 200, `ok:true`, `initialized:true`;
- exact `recipeCount:84`;
- stable SHA-256 fingerprint: `c13a6be98c8308e59496968e4293def9547e79ed99778a1dd39e878d90373317`;
- repeat bootstrap returned `idempotent:true`;
- repeat verification read: 84 rows, 0 rows written;
- D1 database size after verification: 393,216 bytes.

### Full protected audit

- HTTP 200, `authenticated:true`, `oracleReady:true`;
- `protectedDataReturned:false`;
- exact `recipeCount:84`;
- fingerprint matched bootstrap exactly;
- stored recipe body bytes: 312,538;
- one oracle query;
- D1 rows read: 84;
- D1 rows written: 0;
- D1 size after query: 393,216 bytes.

### Protected sample retrieval

- HTTP 200, `authenticated:true`;
- `protectedDataReturned:true`;
- one protected recipe returned;
- one oracle query;
- D1 rows read: 1;
- D1 rows written: 0;
- D1 size after query: 393,216 bytes.

### Free-limit fail-closed simulation

- HTTP 503;
- `error:FREE_LIMIT_FAIL_CLOSED`;
- `authenticated:true`;
- `protectedDataReturned:false`;
- `oracleQueries:0`.

This is an application fail-closed-path proof, not a claim of real quota exhaustion.

### Unauthenticated denial

After logout, a Step 7D oracle audit returned:

- HTTP 401;
- `ok:false`;
- `error:UNAUTHORIZED`;
- `reason:NO_SESSION`.

No protected oracle data was returned.

### Cloudflare Workers Free runtime evidence

Owner-visible Cloudflare Pages Functions Metrics for the current project window showed:

- requests: 90 successful, 0 errors;
- subrequests: 21;
- internal errors: 0;
- script-threw exceptions: 0;
- exceeded CPU time limits: 0;
- exceeded memory: 0;
- client disconnected: 0;
- CPU p50: 3,002 microseconds (3.002 ms);
- CPU p75: 5,803 microseconds (5.803 ms);
- CPU p99: 14,845 microseconds (14.845 ms);
- CPU p99.9: 14,845 microseconds (14.845 ms);
- request-duration p50: 0.006 s;
- request-duration p75: 0.033 s;
- request-duration p99: 0.092 s;
- request-duration p99.9: 0.092 s.

Cloudflare Workers Free currently documents a 10 ms CPU limit per HTTP invocation. Cloudflare also documents that higher CPU quantiles can appear above the nominal limit without invocation errors because the Workers runtime allows limited rollover/flexibility for requests below the configured limit. The live window recorded **0 exceeded-CPU-time-limit errors**. This evidence is acceptable for the bounded 84-record Step 7D canary, while the p99 tail above 10 ms remains a headroom signal to monitor in later scale gates; it is not treated as proof that the final 170k architecture can skip later production-shaped validation.

## Terminal outcome

All repository and required live security/runtime checks passed with acceptable Workers Free evidence.

`STEP_7D_PROTECTED_84_CANARY_PASS`

Step 7E is therefore **unblocked**.

## Boundaries preserved

- no billing/payment/overage authorization;
- no Workers Paid;
- no R2;
- no Zero Trust / Access;
- no new D1 database;
- no eight-shard creation yet;
- no new external recipe admission in Step 7D;
- no nutrition-policy change;
- no weakening of allergen/dietary/permanent-exclusion behavior;
- no Knowledge Core browser/runtime dependency;
- no automatic YouTube/Atlas promotion or public recipe admission.
