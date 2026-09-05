# Roadmap Handover Pointer

Status: ACTIVE

This file is the continuation pointer for `docs/ROADMAP.md`.

The roadmap defines the canonical programme, gates and next-ready work. The full chat-continuation object is deliberately stored outside the roadmap body to avoid duplicating a large JSON object on every handover.

Always use:

- current continuation: `docs/handovers/CURRENT.json`
- previous continuation: `docs/handovers/PREVIOUS.json`
- rotation/startup rules: `docs/HANDOVER_PROTOCOL.md`
- canonical programme: `docs/ROADMAP.md`
- current Corpus Scale runtime/storage/cost/scale architecture: `docs/CORPUS_SCALE_ZERO_BILL_170K_ARCHITECTURE.md`
- historical superseded R2-first architecture: `docs/CORPUS_SCALE_CLOUDFLARE_ACCEPTED_ARCHITECTURE.md`
- YouTube Culinary Discovery Atlas child roadmap: `docs/YOUTUBE_CULINARY_DISCOVERY_ATLAS_ROADMAP.md`
- YT-CUL-0 implementation contract: `docs/YT_CUL_0_IMPLEMENTATION_CONTRACT.md`
- YT-CUL-2 connectivity canary contract: `docs/YT_CUL_2_CONNECTIVITY_CANARY_CONTRACT.md`

For runtime storage, cost model, scale target and Step-7 provisioning order, `docs/CORPUS_SCALE_ZERO_BILL_170K_ARCHITECTURE.md` supersedes the older R2-first architecture and any historical 100k/R2 summary line in `docs/ROADMAP.md` until that large historical roadmap body is next consolidated. Existing source-rights, nutrition, safety, RecipeSource V2 portability and invitation-only access gates remain controlling.

At a continuation boundary, rotate `CURRENT -> PREVIOUS`, write the latest complete state to `CURRENT`, and update canonical roadmap status only when programme state, gate state or next-ready action itself changed.

A new chat should begin by reading `docs/handovers/CURRENT.json`, then fresh-reconcile GitHub before acting. Live GitHub remains source of truth.

## Current programme routing

### Corpus Scale / 170k zero-bill

Required capacity: **170,000 admitted recipes**.

Stress/headroom target: **250,000 synthetic records**.

Canonical architecture: **Cloudflare Pages + exact-email Access/OTP + fail-closed Workers Free + compact pre-built static indexes + deliberately sharded D1 Free recipe bodies + RecipeSource V2**.

R2 state: `REJECTED_FOR_CURRENT_ZERO_BILL_CONSTRAINT / DO_NOT_ACTIVATE`.

Steps 1–6 remain merged green evidence. Their 100k/R2 physical assumptions must now be extended/reconciled rather than discarded.

Current repository next action: `STEP_7A_ZERO_BILL_170K_ARCHITECTURE_REBASELINE`.

State: `READY`.

Required Step-7A proof:

- extend scale ladder through 170k required + 250k stress;
- add provider-neutral D1 shard/storage/read/write/subrequest simulation;
- enforce <=3.5 GB total D1 footprint at 170k, <=350 MB per DB, one DB slot reserved, <=256 hydrated candidates, no full scans and <=50 D1 subqueries per Worker invocation;
- preserve V1/V2 parity, hard filters, source rights, nutrition separation and incremental validation;
- only a green terminal `ZERO_BILL_170K_D1_ARCHITECTURE_PASS` may unlock D1 account-side provisioning.

Current human/account-side action: `STEP_7B_ACCESS_EXACT_EMAIL_OTP_SETUP`.

State: `PENDING`.

The Cloudflare Pages project `culinary-recommender-app.pages.dev` has been created and connected to `DataRaul/culinary-recommender-app`. R2 was not activated. The remaining immediate human security action is to protect the Pages hostname with Cloudflare Zero Trust / Access using exact-email membership + One-time PIN/email OTP. Do not use Everyone, wildcard/domain-wide membership, or an OTP-only broad Include rule.

D1 account-side provisioning is `BLOCKED_UNTIL_STEP_7A_PASS`; do not create D1 merely because the Free plan exists. No paid Workers, Access, D1, R2 or other recurring infrastructure is authorized.

After Step 7A PASS + Access configured + measured Free D1 resources exist, proceed to the production-shaped 500–1000 rights-clean real-source pilot. ForkRecipe remains the current leading source candidate unless later rights/data-quality evidence changes precedence.

### YouTube Culinary Discovery Atlas

YT-CUL-0 state: `MERGED_GREEN / ZERO_LIVE_QUOTA_COMPLETE`.

YT-CUL-1 state: `COMPLETE`.

YT-CUL-2 state: `PASS / MERGED_GREEN`.

YT-CUL-3 state: `YOUTUBE_CULINARY_DISCOVERY_USEFUL_BUT_REVIEW_BOUND / MERGED_GREEN`.

PR #60 merged into `main` at `2b099f4b9c61ce8d43a4a8d0420fdb8ba9d3e83f`. The 24-call bounded Search pilot preserved the five-call reserve and transient-data/separation controls. It independently confirmed 6 recipe-structured pages across 6 domains, below the high-information-gain threshold but above the useful/review-bound threshold.

Current YouTube next phase: `YT_CUL_4_CONDITIONAL_EFFICIENCY_LANE` — earned by YT-CUL-3 but not executed by this corpus-scale architecture update. Fresh-reconcile the YouTube child roadmap before starting that lane.

The YouTube child roadmap must remain reflected in `CURRENT.json` so future chats can discover and continue it without reconstructing this conversation.
