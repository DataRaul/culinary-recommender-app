# Roadmap Handover Pointer

Status: ACTIVE

This file is the continuation pointer for `docs/ROADMAP.md`.

The roadmap defines the canonical programme, gates and next-ready work. The full chat-continuation object is deliberately stored outside the roadmap body to avoid duplicating a large JSON object on every handover.

Always use:

- current continuation: `docs/handovers/CURRENT.json`
- previous continuation: `docs/handovers/PREVIOUS.json`
- rotation/startup rules: `docs/HANDOVER_PROTOCOL.md`
- canonical programme: `docs/ROADMAP.md`
- YouTube Culinary Discovery Atlas child roadmap: `docs/YOUTUBE_CULINARY_DISCOVERY_ATLAS_ROADMAP.md`
- YT-CUL-0 implementation contract: `docs/YT_CUL_0_IMPLEMENTATION_CONTRACT.md`
- YT-CUL-2 connectivity canary contract: `docs/YT_CUL_2_CONNECTIVITY_CANARY_CONTRACT.md`

At a continuation boundary, rotate `CURRENT -> PREVIOUS`, write the latest complete state to `CURRENT`, and update canonical roadmap status only when programme state, gate state or next-ready action itself changed.

A new chat should begin by reading `docs/handovers/CURRENT.json`, then fresh-reconcile GitHub before acting. Live GitHub remains source of truth.

## Current programme routing

### Corpus Scale / 100k

Current next action: `STEP_7_PRODUCTION_SHAPED_REAL_SOURCE_PILOT`.

State: `BLOCKED_ON_CLOUDFLARE_OWNER_SECURITY_SETUP`.

Steps 1–6 are complete; Step 7 preflight is merged. Do not restart historical Step 1 planning text.

### YouTube Culinary Discovery Atlas

YT-CUL-0 state: `MERGED_GREEN / ZERO_LIVE_QUOTA_COMPLETE`.

YT-CUL-1 state: `COMPLETE`.

The distinct Culinary Google Cloud project is active, YouTube Data API v3 is enabled, the restricted API key is available only through `CULINARY_YOUTUBE_API_KEY`, and the owner-verified Search Queries daily limit is `100/day` as of 2026-09-05. Never reveal the key and do not create quota shards.

YT-CUL-2 state: `PASS / MERGED_GREEN`.

Canonical implementation: PR #58, main SHA `56104c104e63342772e0db4dbf21d8ebf8b471ca`.

Live canary run `33984625070` passed with exactly one `search.list` call, HTTP 200, one result slot, a five-call protected reserve and 94 calls remaining before the reserve boundary. Raw API data stayed transient and was deleted before job exit; no raw YouTube metadata entered durable output; no Blue Lagoon credential or state participated.

Validation: all 11 focused YT-CUL-0/YT-CUL-2 safety tests passed; PR validation passed; post-merge main validation run `33984711330` passed; Pages build/deploy run `33984710650` passed.

Current next YouTube phase: `YT-CUL-3_ONE_DAY_BOUNDED_DISCOVERY_PILOT`.

State: `READY / NOT_YET_EXECUTED`.

Before YT-CUL-3 execution, fresh-reconcile GitHub and current YouTube policy/project quota, preserve the >=5 Search-call reserve, transient-data firewall, Blue Lagoon separation and independent-evidence promotion boundary. Measure the conversion funnel from Search calls to independently reviewable culinary/source evidence; never count gross YouTube results as recipes acquired.

The YouTube child roadmap must remain reflected in `CURRENT.json` so future chats can discover and continue it without reconstructing this conversation.
