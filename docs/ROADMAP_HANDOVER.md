# Roadmap Handover Pointer

Status: ACTIVE

This file is the continuation pointer for `docs/ROADMAP.md`.

Always use:

- current continuation: `docs/handovers/CURRENT.json`
- previous continuation: `docs/handovers/PREVIOUS.json`
- rotation/startup rules: `docs/HANDOVER_PROTOCOL.md`
- canonical programme: `docs/ROADMAP.md`
- current Corpus Scale auth/runtime/storage/cost/scale architecture: `docs/CORPUS_SCALE_NO_BILLING_AUTH_170K_ARCHITECTURE.md`
- Step 7A measured rebaseline: `docs/CORPUS_SCALE_STEP7A_NO_BILLING_AUTH_REBASELINE.md`
- Step 7B/7C Free-resource + same-origin auth evidence: `docs/CORPUS_SCALE_STEP7B_7C_PAGES_FUNCTIONS_AUTH_CANARY.md`
- Step 7D protected 84-record runtime canary: `docs/CORPUS_SCALE_STEP7D_PROTECTED_84_CANARY.md`
- YouTube Culinary Discovery Atlas base roadmap: `docs/YOUTUBE_CULINARY_DISCOVERY_ATLAS_ROADMAP.md`
- YouTube daily discovery extension: `docs/YOUTUBE_CULINARY_DAILY_DISCOVERY_TO_YT_CUL_6_ROADMAP.md`
- YT-CUL-5R contract: `docs/YT_CUL_5R_RELEVANCE_SOURCE_DIVERSITY_CONTRACT.md`
- YT-CUL-5D contract: `docs/YT_CUL_5D_DAILY_DISCOVERY_CONTRACT.md`

For authentication, protected-data placement, runtime storage/cost model, scale target and Step-7 ordering, the no-billing-auth architecture plus the latest Step-7 gate evidence supersede earlier Access/R2/100k summaries. Existing source-rights, nutrition, safety, RecipeSource V2 portability, Brain/Lab separation and invitation-only membership gates remain controlling.

At a continuation boundary, rotate `CURRENT -> PREVIOUS`, write the latest complete state to `CURRENT`, and update this routing when programme/gate state changes. A new chat begins by reading CURRENT, then fresh-reconciling live GitHub.

## Current programme routing

### Corpus Scale / 170k no-billing-authorization

Required capacity: **170,000 admitted recipes**. Stress/headroom target: **250,000 synthetic records**.

Binding cost rule: **never accept a product/subscription setup that authorizes a payment method to be charged for usage beyond free limits.** Free exhaustion must fail closed.

Current production-shaped candidate:

**existing Cloudflare Pages Free shell + same-origin `/api/*` Pages Functions on Workers Free + app-owned exact private allowlist + provider-neutral `IdentityVerifier` using Google GIS/OIDC in Testing + deliberately sharded D1 Free + RecipeSource V2.**

The standalone `culinary-gateway-canary.workers.dev` Worker is diagnostic evidence only; it is not the intended production authentication surface. No custom domain is required for the current lightweight canary.

Cloudflare Zero Trust / Access: `REJECTED / DO NOT ACTIVATE`.

R2: `REJECTED / DO NOT ACTIVATE`.

Workers Paid: `REJECTED / DO NOT ACTIVATE`.

#### Step 7A — COMPLETE / PASS / MERGED GREEN

PR #66 merged at `8cc1a672d7f7dc33d12b17169908c69685a733c4`.

Terminal: `NO_BILLING_AUTH_170K_ARCHITECTURE_PASS`.

Required 170k model: estimated total **922,455,560 bytes**, max recipe shard **111,938,240 bytes**, max compact index row **680,512 bytes**, 9 modeled database slots + 1 reserved, <=256 hydrated candidates, 10–12 D1 subqueries/request and zero full-corpus scans.

250k stress: estimated total **1,348,698,648 bytes**, max recipe shard **164,884,232 bytes**, max compact index row **1,000,512 bytes**, with the same candidate/subquery/no-scan gates passing.

Actual Workers Free CPU remains a mandatory Step 7D live protected-canary measurement; GitHub wall-clock proxy evidence is advisory only.

#### Step 7B — COMPLETE / PASS

Terminal: `FREE_NO_BILLING_AUTHORIZATION_CONFIRMED`.

Owner-visible evidence:

- D1 Free `culinary-control` created with EU jurisdiction without billing/payment/overage authorization;
- Workers Free `culinary-gateway-canary` deployed without paid-plan activation;
- D1 binding `CULINARY_CONTROL_DB` connected to `culinary-control`;
- Worker -> D1 `SELECT 1` returned `{"ok":1}`;
- R2, Zero Trust/Access and Workers Paid remain unactivated.

Do **not** create the eight recipe-body D1 shards yet. One D1 slot remains reserved by architecture.

#### Step 7C — COMPLETE / LIVE PASS / MERGED GREEN

Terminal: `STEP_7C_LIVE_AUTH_REVOCATION_CANARY_PASS`.

Implementation lineage:

- PR #72 / `d02eed5558fb620d47bc7424e5b2a63c39caf3ad` — same-origin Pages Functions auth canary;
- PR #74 / `05531bacbab028beb9e57a6f9490e2a2e7a12fd3` — reload diagnostics and explicit credential persistence;
- PR #75 / `d3f6e1a233240fff6a7075761d5a5d132ca99265` — bounded temporary runtime probe;
- PR #76 / `e99ffa7ac6c9d1976500fc2ff0fd7739baef7ae8` — authenticated fail-closed session revocation canary.

Live owner evidence on the canonical Pages origin proved:

- fresh Google login succeeds;
- Culinary session persists across a later page/session check;
- protected D1 route succeeds for the current invited owner;
- revocation increments `session_version`;
- the stale session is rejected on the next protected request with HTTP 401 `SESSION_REVOKED`.

No account ID, email, cookie, Google credential or secret is retained in repository evidence. The temporary runtime-probe endpoint is removed by Step 7D.

#### Step 7D — CODE MERGED / LIVE PROTECTED-84 CANARY REQUIRED NOW

PR #77 merged to `main` at `110a34c89e912b4bf4d75fb808cc4b9a564d8059`.

The Step 7D canary:

- uses only the existing `culinary-control` D1 Free database;
- creates an idempotent `step7d_recipe_oracle` table inside that database, not a new database;
- requires exactly the existing 84 reviewed recipes and verifies a SHA-256 oracle fingerprint;
- denies unauthenticated and non-member sessions before protected oracle reads;
- permits a current invited session to audit the oracle and retrieve one protected sample recipe;
- preserves `session_version` revocation fail-closed behavior;
- includes an authenticated `FREE_LIMIT_FAIL_CLOSED` simulation that returns no protected data and performs zero oracle reads;
- reports bounded D1 read/write/size timing metadata for the live canary;
- leaves all eight future recipe-body D1 shards uncreated and keeps the reserved database slot untouched.

Repository PR validation `33997006965` passed. Cloudflare production deployment for merge `110a34c` succeeded. Post-merge repository validation is the final repository-side confirmation; live owner/runtime measurement remains mandatory before Step 7D can PASS.

**Current human gate:** `STEP_7D_PROTECTED_84_LIVE_CANARY`.

First action only after this routing/handover update is deployed:

**Open `https://culinary-recommender-app.pages.dev/auth-canary.html` and sign in with Google once to restore the Culinary session intentionally revoked during Step 7C. Paste only the status result; never paste cookies, tokens, email or secrets.**

After that, continue one action at a time through oracle initialization, audit, protected sample, simulated Free-limit failure, unauthenticated denial and owner-visible Workers Free CPU/runtime evidence.

Any billing/payment/overage authorization remains a hard stop.

#### Future gate

- Step 7E — 500–1000 rights-clean real-source pilot only after `STEP_7D_PROTECTED_84_CANARY_PASS`. ForkRecipe remains the leading current source candidate unless later evidence changes precedence.

### YouTube Culinary Discovery Atlas

YT-CUL-0: `MERGED_GREEN`.

YT-CUL-1: `COMPLETE`.

YT-CUL-2: `PASS / MERGED_GREEN`.

YT-CUL-3: `YOUTUBE_CULINARY_DISCOVERY_USEFUL_BUT_REVIEW_BOUND / MERGED_GREEN`.

YT-CUL-4: `YT_CUL_4_CHANNEL_PLAYLIST_EFFICIENCY_GAIN / PASS / MERGED_GREEN`.

YT-CUL-5: `YT_CUL_5_USEFUL_BUT_REVIEW_BOUND / PASS / MERGED_GREEN`. Known successful Search usage through YT-CUL-5 on 2026-09-05 is 43 calls, leaving 52 before the protected five-call reserve.

YT-CUL-5R: `YT_CUL_5R_RELEVANCE_SOURCE_DIVERSITY_ARCHITECTURE_PASS / MERGED_GREEN / ZERO_LIVE_SEARCH`, merge `4bd9678d97dd5369daeb3c08f4e0c49996dbcfda`.

YT-CUL-5D: `MERGED_GREEN / SCHEDULED_ACTIVE`, merge `bfe56563c443549623b56038b4b1a65b2af821e2`.

The scheduled workflow runs one quota-aware cycle per YouTube quota day at 09:20 UTC, uses adaptive 8–32 Search budgeting with a five-call reserve, holds at review backlog 40 or low marginal value, and persists only policy-safe cumulative state. At this snapshot it has **0 completed quota days and 0 YT-CUL-5D Search calls**.

YT-CUL-6: `NOT_EARNED`. Only canonical Knowledge Core Atlas review can create the qualifying accepted outcome; YouTube discovery never auto-promotes Atlas state, auto-admits an app recipe or auto-publishes.
