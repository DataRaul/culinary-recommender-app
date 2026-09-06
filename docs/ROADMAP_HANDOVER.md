# Roadmap Handover Pointer

Status: ACTIVE

This file is the continuation pointer for `docs/ROADMAP.md`.

Always use:

- current continuation: `docs/handovers/CURRENT.json`
- previous continuation: `docs/handovers/PREVIOUS.json`
- rotation/startup rules: `docs/HANDOVER_PROTOCOL.md`
- canonical programme: `docs/ROADMAP.md`
- execution-priority amendment: `docs/ROADMAP_EXECUTION_PRIORITY_AMENDMENT_2026-09-06.md`
- current Corpus Scale auth/runtime/storage/cost/scale architecture: `docs/CORPUS_SCALE_NO_BILLING_AUTH_170K_ARCHITECTURE.md`
- Step 7A measured rebaseline: `docs/CORPUS_SCALE_STEP7A_NO_BILLING_AUTH_REBASELINE.md`
- Step 7B/7C Free-resource + same-origin auth evidence: `docs/CORPUS_SCALE_STEP7B_7C_PAGES_FUNCTIONS_AUTH_CANARY.md`
- Step 7D protected 84-record runtime canary: `docs/CORPUS_SCALE_STEP7D_PROTECTED_84_CANARY.md`
- Step 7E ForkRecipe production-shaped pilot/source contract: `docs/CORPUS_SCALE_STEP7E_FORKRECIPE_PILOT.md`
- Step 7E protected 500-record live terminal evidence: `docs/CORPUS_SCALE_STEP7E_LIVE_500_CANARY.md`
- Step 7E auth/session diagnostic resolution: `docs/CORPUS_SCALE_STEP7E_AUTH_SESSION_COMMIT_DIAGNOSTIC.md`
- YouTube Culinary Discovery Atlas base roadmap: `docs/YOUTUBE_CULINARY_DISCOVERY_ATLAS_ROADMAP.md`
- YouTube daily discovery extension: `docs/YOUTUBE_CULINARY_DAILY_DISCOVERY_TO_YT_CUL_6_ROADMAP.md`
- YT-CUL-5R contract: `docs/YT_CUL_5R_RELEVANCE_SOURCE_DIVERSITY_CONTRACT.md`
- YT-CUL-5D contract: `docs/YT_CUL_5D_DAILY_DISCOVERY_CONTRACT.md`

For authentication, protected-data placement, runtime storage/cost model, scale target and Step-7 ordering, the no-billing-auth architecture plus the latest Step-7 gate evidence supersede earlier Access/R2/100k summaries. Existing source-rights, nutrition, safety, RecipeSource V2 portability, Brain/Lab separation and invitation-only membership gates remain controlling.

The 2026-09-06 execution-priority amendment is binding for sequencing inside an already-earned gate: **heavyweight machine work first -> minimum necessary live architectural proof -> convenience/compatibility polish later**. It does not authorize crossing an unearned security, rights, cost, public-runtime or human-approval gate.

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

The production auth boundary has already proved:

- Google identity verification and exact invited-owner authorization;
- persisted Culinary session on the supported production path;
- protected D1 access for the current invited owner;
- revocation through `session_version`;
- stale-session rejection with HTTP 401 `SESSION_REVOKED`.

This is sufficient to treat authentication as a proven architecture component for roadmap sequencing. Later browser/WebView/session work is defect repair only, not a standing programme of its own.

#### Step 7D — COMPLETE / LIVE PASS / MERGED GREEN

PR #81 recorded the production terminal evidence and merged at `08bce89b340c88bf175cc5bac57f62f7e29af731`.

Terminal: `STEP_7D_PROTECTED_84_CANARY_PASS`.

The live canary proved:

- exact 84-record protected oracle integrity;
- authenticated protected sample retrieval;
- unauthenticated denial before protected data access;
- Free-limit fail-closed behavior;
- D1 read/write/runtime evidence;
- owner-visible Workers Free runtime measurement;
- no new D1 database, recipe-body shard, paid plan or billing authorization.

Step 7E was therefore earned.

#### Step 7E — COMPLETE / LIVE PASS / PROTECTED 500-RECORD FORKRECIPE PILOT

Terminal:

`STEP_7E_PROTECTED_500_SOURCE_PILOT_CANARY_PASS`

The completed gate proved:

- pinned ForkRecipe source rights/data-quality/adapter audit PASS at source commit `c32255266af39bd77444d39452f3df8088ac8fd9` and verified source universe 915;
- deterministic protected live cohort of exactly **500 recipes / 50 chunks / 5,115,695 source-body bytes**;
- exact live fingerprint `2aa8106f7521f9cf3f6c2f9ece13d328272f8400f90f4ae79b8cdc4750b5d8b6`;
- final audit status 200, `ready: true`, metadata validation PASS and no bootstrap required;
- authenticated protected sample retrieval while recommendation, public-runtime, automatic-admission, nutrition-authority, dietary/allergen and ratio-promotion boundaries remained false;
- simulated Free-limit HTTP 503 `STEP7E_FREE_LIMIT_FAIL_CLOSED` with zero pilot queries and no protected data;
- credential-omitted HTTP 401 denial;
- existing `culinary-control` D1 only, observed final size-after **5,931,008 bytes**;
- no future recipe-body D1 shard, no Workers Paid/R2/Zero Trust, no billing authorization and no public ForkRecipe activation.

Live-path defects found during the gate were repaired without weakening security: ambiguous audit errors can no longer trigger the full bootstrap loop, final reads have bounded retry/classification, sensitive API/auth paths are network-only in the service worker, and main validation now includes a tiny production runtime smoke.

The owner's Wi-Fi path could not reach fresh `pages.dev` resources while mobile data could; the final successful owner verification used mobile data. Production runtime reachability was independently proven by the main-branch smoke.

**Post-Step-7E boundary:** the governing no-billing architecture defines no Step 7F. Step 7E PASS therefore closes the currently defined Corpus Scale Step-7 sequence but does **not** authorize any additional corpus-scale infrastructure or public activation by implication. A later explicit roadmap/gate decision is required before creating the eight future recipe-body shards, publicly activating ForkRecipe, changing source nutrition/dietary/allergen/quantity authority, or crossing any paid/billing boundary.

### YouTube Culinary Discovery Atlas

YT-CUL-0: `MERGED_GREEN`.

YT-CUL-1: `COMPLETE`.

YT-CUL-2: `PASS / MERGED_GREEN`.

YT-CUL-3: `YOUTUBE_CULINARY_DISCOVERY_USEFUL_BUT_REVIEW_BOUND / MERGED_GREEN`.

YT-CUL-4: `YT_CUL_4_CHANNEL_PLAYLIST_EFFICIENCY_GAIN / PASS / MERGED_GREEN`.

YT-CUL-5: `YT_CUL_5_USEFUL_BUT_REVIEW_BOUND / PASS / MERGED_GREEN`.

YT-CUL-5R: `YT_CUL_5R_RELEVANCE_SOURCE_DIVERSITY_ARCHITECTURE_PASS / MERGED_GREEN / ZERO_LIVE_SEARCH`, merge `4bd9678d97dd5369daeb3c08f4e0c49996dbcfda`.

YT-CUL-5D: `MERGED_GREEN / SCHEDULED_ACTIVE`; current generated state remains `ACTIVE` with zero completed quota days/search calls as last reconciled on 2026-09-06. The adaptive portfolio/feedback extensions remain governed by the same Knowledge Core authority boundary.

YT-CUL-6: `NOT_EARNED`. Only canonical Knowledge Core Atlas review can create the qualifying accepted outcome; YouTube discovery never auto-promotes Atlas state, auto-admits an app recipe or auto-publishes.
