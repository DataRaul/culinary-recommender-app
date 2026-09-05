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
- superseded intermediate zero-bill architecture: `docs/CORPUS_SCALE_ZERO_BILL_170K_ARCHITECTURE.md`
- historical superseded R2-first architecture: `docs/CORPUS_SCALE_CLOUDFLARE_ACCEPTED_ARCHITECTURE.md`
- YouTube Culinary Discovery Atlas child roadmap: `docs/YOUTUBE_CULINARY_DISCOVERY_ATLAS_ROADMAP.md`

For authentication, protected-data placement, runtime storage/cost model, scale target and Step-7 provisioning order, `docs/CORPUS_SCALE_NO_BILLING_AUTH_170K_ARCHITECTURE.md` plus the latest Step-7 gate evidence supersede earlier Access/R2/100k summaries. Existing source-rights, nutrition, safety, RecipeSource V2 portability, Brain/Lab separation and invitation-only membership gates remain controlling.

At a continuation boundary, rotate `CURRENT -> PREVIOUS`, write the latest complete state to `CURRENT`, and update this routing when programme/gate state changes. A new chat begins by reading CURRENT, then fresh-reconciling live GitHub.

## Current programme routing

### Corpus Scale / 170k no-billing-authorization

Required capacity: **170,000 admitted recipes**. Stress/headroom target: **250,000 synthetic records**.

Binding cost rule: **never accept a product/subscription setup that authorizes a payment method to be charged for usage beyond free limits.** Free exhaustion must fail closed.

Candidate architecture remains:

**Cloudflare Pages Free public shell + Workers Free protected API candidate + app-owned exact private allowlist + provider-neutral `IdentityVerifier` (initial Google GIS/OIDC candidate) + deliberately sharded D1 Free candidate + RecipeSource V2.**

Protected large-corpus recipe bodies and protected retrieval indexes must not be ordinary public Pages static assets.

Cloudflare Zero Trust / Access: `REJECTED / DO NOT ACTIVATE`.

R2: `REJECTED / DO NOT ACTIVATE`.

Workers Paid: `REJECTED / DO NOT ACTIVATE`.

#### Step 7A — COMPLETE / PASS / MERGED GREEN

PR #66 merged at `8cc1a672d7f7dc33d12b17169908c69685a733c4`.

Terminal: `NO_BILLING_AUTH_170K_ARCHITECTURE_PASS`.

Dedicated benchmark workflow `33986959491` passed the full ladder:

`1k -> 10k -> 50k -> 100k -> 170k -> 250k stress`.

Measured at 170k:

- estimated total D1-shaped footprint: **922,455,560 bytes** vs project budget **3,758,096,384**;
- max recipe shard: **111,938,240 bytes** vs **367,001,600** budget;
- control/auth/index DB: **29,514,044 bytes**;
- max compact index artifact row: **680,512 bytes** vs **1,048,576** budget;
- 9 database slots modeled + 1 reserved;
- candidate hydration <=256;
- D1 subqueries 10–12 per modeled protected request, below project cap 16;
- full-corpus scans: 0.

At 250k stress:

- estimated total: **1,348,698,648 bytes**;
- max recipe shard: **164,884,232 bytes**;
- max compact index artifact row: **1,000,512 bytes**, still below the 1 MiB project cap;
- candidate/subquery/no-scan gates still pass.

Local Worker-shaped wall-clock proxy exceeded the current documented 10 ms Workers Free CPU figure in some scenarios. This was preregistered as advisory only because GitHub wall-clock is not Cloudflare Worker CPU accounting. **Actual Worker CPU remains a mandatory Step 7D production canary gate before corpus expansion.**

#### Step 7B — HUMAN REQUIRED NOW

Name: `STEP_7B_FREE_DEVELOPER_RESOURCE_PROVISIONING_CHECK`.

Purpose: determine whether the measured D1 Free resource can be created while the account remains on Workers Free **without accepting any checkout/subscription/payment/overage authorization**.

Owner first action only:

**Cloudflare Dashboard -> Storage & databases -> D1 SQLite Database.**

Inspect the next screen before accepting anything.

Terminal classifications:

- `FREE_NO_BILLING_AUTHORIZATION_CONFIRMED` — may continue;
- `BILLING_OR_OVERAGE_AUTHORIZATION_PRESENT` — reject D1/return to architecture selection;
- `AMBIGUOUS` — stop and inspect before any acceptance.

Do not activate Zero Trust, R2 or Workers Paid. Do not accept a `$0` checkout if its terms authorize charges beyond included limits.

Only after Step 7B succeeds may the app proceed toward identity-provider setup and protected runtime work.

#### Future gates

- Step 7C — identity-provider setup, blocked until Step 7B free/no-billing confirmation.
- Step 7D — protected 84-record security/runtime canary; includes actual Workers Free CPU/subrequest/D1 measurements and auth/revocation tests.
- Step 7E — 500–1000 rights-clean real-source pilot only after Step 7D PASS. ForkRecipe remains the leading current source candidate unless later evidence changes precedence.

### YouTube Culinary Discovery Atlas

YT-CUL-0: `MERGED_GREEN`.

YT-CUL-1: `COMPLETE`.

YT-CUL-2: `PASS / MERGED_GREEN`.

YT-CUL-3: `YOUTUBE_CULINARY_DISCOVERY_USEFUL_BUT_REVIEW_BOUND / MERGED_GREEN`.

YT-CUL-4: `YT_CUL_4_CHANNEL_PLAYLIST_EFFICIENCY_GAIN / PASS / MERGED_GREEN`.

YT-CUL-4 PR #63 merged at `f30ffc78a336b1a5bfc88c14dd335f3a4acf5853`; its handover reconciliation merged through PR #65. The preferred YouTube discovery pattern is now bounded channel/playlist search plus lower-cost read fanout, transient source discovery, and independent external review.

Current YouTube next phase: `YT_CUL_5_ATLAS_EXPANSION_CADENCE` — **EARNED / READY / NOT EXECUTED**. It remains a separate lane and must not bypass independent-evidence, rights, Atlas or app-admission gates.
