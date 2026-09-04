# Roadmap Handover Pointer

Status: ACTIVE

This file is the continuation pointer for `docs/ROADMAP.md`.

The roadmap defines the canonical programme, gates and next-ready work. The full chat-continuation object is deliberately stored outside the roadmap body to avoid duplicating a large JSON object on every handover.

Always use:

- current continuation: `docs/handovers/CURRENT.json`
- previous continuation: `docs/handovers/PREVIOUS.json`
- rotation/startup rules: `docs/HANDOVER_PROTOCOL.md`
- canonical programme: `docs/ROADMAP.md`

At a continuation boundary, rotate `CURRENT -> PREVIOUS`, write the latest complete state to `CURRENT`, and update `docs/ROADMAP.md` only when the programme status, gate state or next-ready action itself changed.

A new chat should begin by reading `docs/handovers/CURRENT.json`, then fresh-reconcile GitHub before acting. Live GitHub remains source of truth.

Current next-ready programme action at initialization: `STEP_1_CORPUS_SCALE_CONTRACT_AND_SYNTHETIC_BENCHMARK_HARNESS`.
