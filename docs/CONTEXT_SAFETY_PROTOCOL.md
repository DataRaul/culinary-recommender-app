# Culinary Context Safety Protocol

Status: ACTIVE  
Policy: `config/context_safety_policy.json`

## What changed after the first live test

The first live test proved that a repository instruction alone cannot guarantee that an ordinary ChatGPT conversation will notice a hidden context percentage and interrupt itself before failure. The repository therefore no longer relies on percentage detection as the primary continuity mechanism.

The primary mechanism is now **rolling event-based checkpointing**. Context telemetry, when available, is an additional early-warning trigger.

## Primary mechanism: rolling checkpoint

The canonical resumability state lives on Git ref `continuity-state`:

- `docs/handovers/CURRENT.json`
- `docs/handovers/PREVIOUS.json`

`main` remains the source of truth for implementation, roadmap, contracts and project state. The continuity branch is only a resumability index and must never override newer live GitHub state.

A checkpoint is required after each material bounded-package terminal, merged material PR, material roadmap transition, human/error/cost gate, or validated stable waiting state. **Before starting a successor package, checkpoint the state just completed.**

This bounds worst-case chat failure to at most the currently active package instead of the entire conversation history.

## Rolling checkpoint procedure

1. reach a safe deterministic boundary;
2. fresh-reconcile live `main`, open PRs/branches and required validation;
3. read `CURRENT.json` from ref `continuity-state`;
4. write that exact prior object to `PREVIOUS.json` on `continuity-state`;
5. write one complete self-contained new `CURRENT.json`;
6. commit only to `continuity-state` with `[skip ci]`;
7. re-read CURRENT from `continuity-state`;
8. only then begin the next bounded package.

Routine rolling checkpoints do not need user-visible narration. They are durable recovery points.

## Secondary early trigger: context risk

When exact runtime telemetry exists:

- preferred trigger: **65% used**;
- target: **60–70%**;
- acceptable safety window: **55–75%**.

When telemetry is unavailable, never invent a percentage. Use conservative risk signals: long tool/result history, repeated repair cycles, many mutable state transitions, pre-compaction/compaction signals, or increasing risk of losing exact IDs/gates/next actions.

At a context-risk trigger:

1. do not start another substantive package;
2. reach the nearest safe deterministic boundary;
3. refresh the rolling checkpoint;
4. emit the same complete CURRENT object to the user as one copy-pasteable JSON object;
5. stop substantive execution in the current conversation.

## Bounded packages

Each substantive package must state objective, in-scope, out-of-scope, terminal state, validation/evidence, and next action/stop condition. Deterministic repairs may stay inside that package; successor packages do not gain implicit authority merely because the previous one completed.

## Cost model

There is no context-polling workflow and no background GitHub retriever.

- Context/risk analysis happens in the active agent/runtime.
- Rolling state writes go to `continuity-state`, not `main`.
- The repository's push workflows are scoped to `main`; continuity-state writes therefore do not need an Actions run.
- Use `[skip ci]` on every continuity-state checkpoint as an additional safeguard.
- Do not merge continuity-state into main for routine handover refreshes.

## Acceptance tests

| Case | Expected |
| --- | --- |
| Package/PR closes at low context | Refresh continuity-state before next package |
| Chat dies during next package | New chat recovers at previous durable package boundary and fresh-reconciles live GitHub |
| 63% telemetry at safe boundary | Refresh + emit handover + stop |
| No telemetry, many state transitions | Early refresh + emit handover + stop |
| Continuity branch checkpoint | No normal CI/Pages deployment |
| New chat | Read continuity-state CURRENT, then reconcile live main/open PRs/checks before mutation |

## Runtime-specific hooks

Codex runtimes that expose `PreCompact` may use it as an emergency additional trigger. Ordinary ChatGPT conversations must not be assumed to expose or execute that hook.

## Limit

No repository file can guarantee an interrupt inside a failing ordinary ChatGPT runtime. Rolling checkpoints solve this by making recovery independent of that interrupt: even if the chat disappears, the next chat has a recent durable state.
