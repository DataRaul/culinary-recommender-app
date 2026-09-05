# Corpus Scale Step 7D — Protected 84-Record Runtime Canary

Date: 2026-09-05

Status: **IMPLEMENTED_PENDING_CI_MERGE_AND_LIVE_CANARY**

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

The simulated failure is not a claim that a real Cloudflare Free quota has been exhausted. Real Workers CPU evidence remains owner-visible runtime evidence.

## Security gate

Repository tests must prove:

1. the golden oracle is exactly 84 unique records;
2. bootstrap is authenticated, same-origin, deterministic, fingerprinted and idempotent;
3. unauthenticated requests cannot query oracle data;
4. a session for a non-member account cannot query oracle data;
5. a current invited/allowed account can audit and retrieve a sample recipe;
6. `session_version` revocation rejects the stale session and clears it fail-closed;
7. simulated Free-limit failure returns no protected data and performs zero oracle queries;
8. cross-origin bootstrap mutation is rejected before auth or D1 writes;
9. ordinary static Pages routing remains unchanged (`/api/*` only for Functions).

The Step 7C live revocation proof is inherited evidence and does not need to be weakened or repeated as a different mechanism.

## Live canary sequence after merged production deployment

The owner performs one action at a time:

1. restore a normal owner session after the intentional Step 7C revocation;
2. click `Initialize Step 7D oracle`; require HTTP 200, `recipeCount:84`, and a 64-character fingerprint;
3. click `Audit Step 7D oracle`; require HTTP 200, the same count/fingerprint, and bounded D1 read metrics;
4. click `Read protected sample recipe`; require HTTP 200 and `protectedDataReturned:true`;
5. click `Simulate Free-limit failure`; require HTTP 503, `FREE_LIMIT_FAIL_CLOSED`, `protectedDataReturned:false`, and `oracleQueries:0`;
6. perform an unauthenticated request to the Step 7D oracle and require HTTP 401 before protected data access;
7. inspect current Cloudflare Pages/Workers runtime metrics for these canary requests and record actual CPU evidence plus D1/subrequest evidence without enabling any paid plan.

## Terminal outcomes

PASS requires all repository and live security checks plus acceptable Workers Free runtime evidence:

`STEP_7D_PROTECTED_84_CANARY_PASS`

Fail-closed alternatives include:

- `STEP_7D_AUTHORIZATION_FAILURE`
- `STEP_7D_ORACLE_INTEGRITY_FAILURE`
- `STEP_7D_FREE_RUNTIME_BUDGET_FAILURE`
- `STEP_7D_RUNTIME_EVIDENCE_INSUFFICIENT`

Only PASS may unlock Step 7E.

## Boundaries

- no billing/payment/overage authorization;
- no Workers Paid;
- no R2;
- no Zero Trust / Access;
- no new D1 database;
- no eight-shard creation yet;
- no new external recipe admission;
- no nutrition-policy change;
- no weakening of allergen/dietary/permanent-exclusion behavior;
- no Knowledge Core browser/runtime dependency;
- no automatic YouTube/Atlas promotion or public recipe admission.
