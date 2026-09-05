# Roadmap Handover Pointer

Status: ACTIVE

This file is the continuation pointer for `docs/ROADMAP.md`.

The roadmap defines the canonical programme, gates and next-ready work. The full chat-continuation object is deliberately stored outside the roadmap body to avoid duplicating a large JSON object on every handover.

Always use:

- current continuation: `docs/handovers/CURRENT.json`
- previous continuation: `docs/handovers/PREVIOUS.json`
- rotation/startup rules: `docs/HANDOVER_PROTOCOL.md`
- canonical programme: `docs/ROADMAP.md`
- current Corpus Scale auth/runtime/storage/cost/scale architecture: `docs/CORPUS_SCALE_NO_BILLING_AUTH_170K_ARCHITECTURE.md`
- superseded intermediate zero-bill architecture: `docs/CORPUS_SCALE_ZERO_BILL_170K_ARCHITECTURE.md`
- historical superseded R2-first architecture: `docs/CORPUS_SCALE_CLOUDFLARE_ACCEPTED_ARCHITECTURE.md`
- YouTube Culinary Discovery Atlas child roadmap: `docs/YOUTUBE_CULINARY_DISCOVERY_ATLAS_ROADMAP.md`
- YT-CUL-0 implementation contract: `docs/YT_CUL_0_IMPLEMENTATION_CONTRACT.md`
- YT-CUL-2 connectivity canary contract: `docs/YT_CUL_2_CONNECTIVITY_CANARY_CONTRACT.md`

For authentication, protected-data placement, runtime storage/cost model, scale target and Step-7 provisioning order, `docs/CORPUS_SCALE_NO_BILLING_AUTH_170K_ARCHITECTURE.md` supersedes the earlier Access/R2 architecture documents and any historical 100k/R2 summary line in `docs/ROADMAP.md` until that large historical roadmap body is next consolidated. Existing source-rights, nutrition, safety, RecipeSource V2 portability, Brain/Lab separation and invitation-only membership gates remain controlling.

At a continuation boundary, rotate `CURRENT -> PREVIOUS`, write the latest complete state to `CURRENT`, and update canonical roadmap status only when programme state, gate state or next-ready action itself changed.

A new chat should begin by reading `docs/handovers/CURRENT.json`, then fresh-reconcile GitHub before acting. Live GitHub remains source of truth.

## Current programme routing

### Corpus Scale / 170k no-billing-authorization

Required capacity: **170,000 admitted recipes**.

Stress/headroom target: **250,000 synthetic records**.

Binding cost rule: **do not activate or accept any product/subscription whose setup authorizes a payment method to be charged for usage beyond free limits.** Free-plan exhaustion must fail closed.

Current candidate architecture:

**Cloudflare Pages Free public shell + Workers Free protected API candidate + app-owned exact private allowlist + provider-neutral `IdentityVerifier` (initial Google GIS/OIDC candidate) + deliberately sharded D1 Free candidate + RecipeSource V2.**

Protected recipe bodies and protected retrieval indexes must **not** be ordinary public Pages static assets.

Cloudflare Zero Trust / Access state: `REJECTED_FOR_CURRENT_NO_BILLING_AUTHORIZATION_CONSTRAINT / DO_NOT_ACTIVATE`.

R2 state: `REJECTED_FOR_CURRENT_NO_BILLING_AUTHORIZATION_CONSTRAINT / DO_NOT_ACTIVATE`.

D1 state: `CANDIDATE_ONLY / DO_NOT_PROVISION YET`.

Workers state: `FREE_PLAN_CANDIDATE / DO NOT ACTIVATE PAID`.

Steps 1–6 remain merged-green evidence. Their 100k/R2 physical assumptions must be extended/reconciled rather than discarded.

Current repository next action: `STEP_7A_NO_BILLING_AUTH_170K_REBASELINE`.

State: `READY`.

Required Step-7A proof:

- extend scale ladder through 170k required + 250k stress;
- simulate one D1 control/auth/index DB + approximately eight recipe-body shards + one reserved DB slot;
- enforce <=3.5 GB total D1 footprint at 170k, <=350 MB per DB, <=1 MiB per index artifact row, <=256 hydrated candidates, <=16 D1 subqueries per protected request and zero full scans;
- add app-owned `IdentityVerifier`, exact allowlist, owner-bootstrap, session and revocation contracts;
- initial identity candidate is Google Sign in with Google/OIDC with server-side token verification; do not treat third-party-email Google accounts as authoritative email proof when Google itself is not authoritative;
- prove protected recipe/index data cannot be served as ordinary public Pages static assets;
- add a Worker Free CPU/request budget proxy and defer actual Worker CPU/security confirmation to the protected canary;
- preserve V1/V2 parity, hard filters, source rights, nutrition separation, provider portability and incremental validation;
- only a green terminal `NO_BILLING_AUTH_170K_ARCHITECTURE_PASS` may unlock account-side resource checks.

Current human/account-side action: `NONE`.

The Cloudflare Pages project `culinary-recommender-app.pages.dev` already exists and should be kept. The owner should **not** activate Zero Trust, R2, D1 or Workers Paid now. No more Cloudflare clicking is required until Step 7A earns a specific provisioning check.

Future Step 7B, only after Step 7A PASS: attempt the exact measured D1 Free/Workers Free provisioning state. If Cloudflare shows any checkout, subscription activation, payment authorization, overage authorization or ambiguous billing language, stop and reject the resource. Only `FREE_NO_BILLING_AUTHORIZATION_CONFIRMED` may proceed.

Future Step 7C: configure the selected identity provider after the application-side auth contract is ready. If that provider asks for billing/payment authorization, stop.

Future Step 7D: protected 84-record security/runtime canary.

Future Step 7E: production-shaped 500–1000 rights-clean real-source pilot. ForkRecipe remains the current leading source candidate unless later rights/data-quality evidence changes precedence.

### YouTube Culinary Discovery Atlas

YT-CUL-0 state: `MERGED_GREEN / ZERO_LIVE_QUOTA_COMPLETE`.

YT-CUL-1 state: `COMPLETE`.

YT-CUL-2 state: `PASS / MERGED_GREEN`.

YT-CUL-3 state: `YOUTUBE_CULINARY_DISCOVERY_USEFUL_BUT_REVIEW_BOUND / MERGED_GREEN`.

PR #60 merged into `main` at `2b099f4b9c61ce8d43a4a8d0420fdb8ba9d3e83f`. The 24-call bounded Search pilot preserved the five-call reserve and transient-data/separation controls. It independently confirmed 6 recipe-structured pages across 6 domains, below the high-information-gain threshold but above the useful/review-bound threshold.

YT-CUL-3 terminal reconciliation was recorded through PR #62 at `89f78902869f4ef8d02cde5b0842345c3dd5e439`.

Current YouTube next phase: `YT_CUL_4_CONDITIONAL_EFFICIENCY_LANE` — earned by YT-CUL-3 but not executed by this corpus-scale architecture update. Fresh-reconcile the YouTube child roadmap before starting that lane.

The YouTube child roadmap must remain reflected in `CURRENT.json` so future chats can discover and continue it without reconstructing this conversation.
