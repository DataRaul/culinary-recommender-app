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

At a continuation boundary, rotate `CURRENT -> PREVIOUS`, write the latest complete state to `CURRENT`, and update canonical roadmap status only when programme state, gate state or next-ready action itself changed.

A new chat should begin by reading `docs/handovers/CURRENT.json`, then fresh-reconcile GitHub before acting. Live GitHub remains source of truth.

## Current programme routing

### Corpus Scale / 100k

Current next action: `STEP_7_PRODUCTION_SHAPED_REAL_SOURCE_PILOT`.

State: `BLOCKED_ON_CLOUDFLARE_OWNER_SECURITY_SETUP`.

Steps 1–6 are complete; Step 7 preflight is merged. Do not restart historical Step 1 planning text.

### YouTube Culinary Discovery Atlas

YT-CUL-0 state: `MERGED_GREEN / ZERO_LIVE_QUOTA_COMPLETE`.

Canonical merge: PR #56, main SHA `fcbbc5df8ca6ac10cb61b25b142506f51b8a6253`.

Validation: pull-request CI passed; post-merge main validation, Pages build and deploy passed. Live YouTube API calls consumed: `0`.

Current next action: `YT-CUL-1_OWNER_GOOGLE_CLOUD_SETUP`.

State: `HUMAN_SETUP_REQUIRED`.

The owner must create one distinct Culinary Google Cloud project, enable YouTube Data API v3, create/restrict an API key, store it only as repository/runner secret `CULINARY_YOUTUBE_API_KEY`, and report the actual non-secret Search Queries daily limit. Do not reveal the key and do not create quota shards.

YT-CUL-2 remains blocked until that setup exists and current policy/quota are rechecked. No YouTube work may consume Blue Lagoon credentials/quota or alter Blue Lagoon planner/evidence state.

The YouTube child roadmap must remain reflected in `CURRENT.json` so future chats can discover and continue it without reconstructing this conversation.
