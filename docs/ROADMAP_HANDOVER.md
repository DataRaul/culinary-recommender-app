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

At a continuation boundary, rotate `CURRENT -> PREVIOUS`, write the latest complete state to `CURRENT`, and update canonical roadmap status only when programme state, gate state or next-ready action itself changed.

A new chat should begin by reading `docs/handovers/CURRENT.json`, then fresh-reconcile GitHub before acting. Live GitHub remains source of truth.

## Current programme routing

### Corpus Scale / 100k

Current next action: `STEP_7_PRODUCTION_SHAPED_REAL_SOURCE_PILOT`.

State: `BLOCKED_ON_CLOUDFLARE_OWNER_SECURITY_SETUP`.

Steps 1–6 are complete; Step 7 preflight is merged. Do not restart historical Step 1 planning text.

### YouTube Culinary Discovery Atlas

Current next action: `YT-CUL-0_ARCHITECTURE_POLICY_SYNTHETIC_IMPLEMENTATION`.

State: `READY_NOW / ZERO_LIVE_QUOTA`.

This lane may proceed in parallel because it is additive, uses synthetic fixtures initially, does not touch the public runtime, and does not consume Blue Lagoon credentials/quota. Live YouTube acquisition remains blocked until the separate Culinary Google Cloud API Project and secret are owner-configured and current policy is rechecked.

The YouTube child roadmap must remain reflected in `CURRENT.json` so future chats can discover and continue it without reconstructing this conversation.
