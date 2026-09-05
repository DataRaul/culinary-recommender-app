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
- Step 7B/7C Free-resource + same-origin auth canary: `docs/CORPUS_SCALE_STEP7B_7C_PAGES_FUNCTIONS_AUTH_CANARY.md`
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

Actual Workers Free CPU remains a mandatory Step 7D live protected canary measurement; GitHub wall-clock proxy evidence remains advisory only.

#### Step 7B — COMPLETE / PASS

Terminal: `FREE_NO_BILLING_AUTHORIZATION_CONFIRMED`.

Owner-visible evidence:

- D1 Free `culinary-control` created with EU jurisdiction without billing/payment/overage authorization;
- Workers Free `culinary-gateway-canary` deployed without paid-plan activation;
- D1 binding `CULINARY_CONTROL_DB` connected to `culinary-control`;
- Worker -> D1 `SELECT 1` returned `{"ok":1}`;
- R2, Zero Trust/Access and Workers Paid remain unactivated.

Do **not** create the eight recipe-body D1 shards yet. One D1 slot remains reserved by architecture.

#### Step 7C — CODE MERGED GREEN / HUMAN RUNTIME CANARY REQUIRED NOW

PR #72 merged at `d02eed5558fb620d47bc7424e5b2a63c39caf3ad`.

Validation:

- focused auth battery: **6/6 PASS**;
- PR validation: `33990435065` — PASS;
- post-merge validation: `33990522336` — PASS;
- post-merge GitHub Pages build/deploy: `33990521780` — PASS.

Google account prerequisites are complete for the canary:

- External / Testing;
- one owner test user;
- Culinary Web OAuth client created;
- authorized JavaScript origin `https://culinary-recommender-app.pages.dev`;
- no custom domain, production publishing or client-secret download required for this Testing canary.

Merged canary includes server-side Google signature/audience/issuer/expiry verification, exact private invitation/bootstrap, issuer+subject binding, HMAC session cookie, current account/revocation recheck, D1 auth migration, isolated `/auth-canary.html`, protected D1 route and `/api/*`-only Pages Function routing.

**Current human gate:** `STEP_7C_PAGES_RUNTIME_BINDINGS_MIGRATION_AND_OWNER_LOGIN_CANARY`.

First action only:

**Cloudflare Dashboard -> Workers & Pages -> `culinary-recommender-app` -> Settings.**

Report/paste the bindings/runtime variables section before changing anything. Continue one screen/action at a time.

Later, only after each screen is verified, the gate will bind the existing `culinary-control` database, add the public Google client ID plus private session/bootstrap secrets, run `migrations/0001_auth_canary.sql`, deploy, test owner login, remove the temporary bootstrap email secret, and prove revocation fails closed.

Any billing/payment/overage authorization remains a hard stop.

#### Future gates

- Step 7D — protected 84-record security/runtime canary, blocked until Step 7C live owner-login/revocation canary passes; includes actual Workers Free CPU/subrequest/D1 measurements.
- Step 7E — 500–1000 rights-clean real-source pilot only after Step 7D PASS. ForkRecipe remains the leading current source candidate unless later evidence changes precedence.

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
