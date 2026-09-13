# Corpus Scale Step 8B — Pages Binding Gate Closeout

Date: 2026-09-13

Status: **BOTH D1 ACCOUNT GATES PASS — LIVE CANARY RUNTIME MERGED/DEPLOYED GREEN — EXACT TWO-BINDING HUMAN GATE NEXT**

## Confirmed state

The owner human-attested creation of exactly two D1 recipe-body databases under the no-billing authorization constraint:

- `culinary-recipes-00` — `FREE_NO_BILLING_AUTHORIZATION_CONFIRMED`
- `culinary-recipes-01` — `FREE_NO_BILLING_AUTHORIZATION_CONFIRMED`

Evidence class: `HUMAN_ATTESTED_ACCOUNT_GATE`. This is not represented as Cloudflare API verification.

PR #136 merged the protected two-shard Step 8B live-canary runtime at `3db8084b0571e192094c384ece20417202b1fdc2`.

Validation evidence:

- PR validation `34778087774` — PASS
- post-merge validation `34778233576` — PASS, including browser acceptance and production smoke
- Pages deployment `34778233094` — PASS

The deployed canary surfaces are:

- `/api/step8b/canary`
- `/step8b-canary.html`

The deterministic test contract proves router parity with Step 7A, fail-closed unauthenticated/free-limit/missing-binding behavior, bounded writes, partial-stop/resume, idempotent replay, cross-shard reads, pointer-only rollback, zero full-corpus scans, and the <=16 D1-subquery request budget.

## Current human gate

Add **only** these two D1 bindings to the existing production Pages project `culinary-recommender-app`:

| Binding | Existing D1 database |
| --- | --- |
| `CULINARY_RECIPE_SHARD_00_DB` | `culinary-recipes-00` |
| `CULINARY_RECIPE_SHARD_01_DB` | `culinary-recipes-01` |

No new database, Worker, R2 bucket, Access/Zero Trust resource, payment method, paid plan, checkout, overage authorization or other binding is authorized.

If the Cloudflare UI requests any billing/payment/Workers Paid/overage/R2/Zero Trust authorization, is ambiguous, or cannot bind exactly the two existing databases, stop and report the visible state.

## After the bindings

The next machine sequence is:

1. externally prove unauthenticated `/api/step8b/canary` denial;
2. run the authenticated same-origin `/step8b-canary.html` sequence;
3. validate the resulting live evidence against the frozen Step 8B envelope;
4. earn `STEP_8B_MINIMUM_MULTI_SHARD_CANARY_PASS` only if every required condition passes;
5. only then unlock Step 8D protected population of the already-qualified 501-record UniTools cohort.

Step 8D remains blocked now. Normal public recommendation behavior remains unchanged.
