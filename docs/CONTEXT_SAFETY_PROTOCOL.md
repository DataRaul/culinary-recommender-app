# Culinary Context Safety Protocol

Status: ACTIVE  
Policy: `config/context_safety_policy.json`

## Purpose

Keep long Culinary development sessions resumable before conversation context becomes unreliable, while preserving GitHub as the source of truth and avoiding a recurring GitHub Actions watcher.

This protocol extends the existing repository handover mechanism. It does not create a second handover store, a background service, or new execution authority.

## Detection

### Runtime telemetry available

When the active agent/runtime exposes context-use telemetry:

- preferred trigger: **65% used**;
- target continuation range: **60–70%**;
- acceptable safety range: **55–75%**;
- do not intentionally continue past 75% just to consume more roadmap scope.

The percentage is a runtime observation. Do not fabricate one when the surface does not expose it.

### Runtime telemetry unavailable

Use conservative context-risk detection. Treat any combination of these as sufficient reason to checkpoint early:

- long accumulated tool/result history;
- several implementation → validation → repair cycles;
- many branch/PR/SHA/deployment/gate transitions that must remain exact;
- a pre-compaction or compaction signal exposed by the runtime;
- increasing risk that exact identifiers, rejected approaches, concurrency state, or next action could be omitted.

The objective is safe continuation, not maximizing use of the context window.

## Trigger behavior

At a context-safety trigger:

1. do not start another substantive roadmap package;
2. finish only the smallest atomic operation required to reach a safe deterministic boundary;
3. fresh-reconcile live GitHub and any newer generated programme state;
4. apply `docs/HANDOVER_PROTOCOL.md`;
5. rotate `CURRENT -> PREVIOUS`;
6. write a complete new `CURRENT.json`;
7. verify the canonical file is readable from the authoritative branch;
8. emit the same complete CURRENT object to the user as one copy-pasteable JSON object;
9. stop substantive execution for the current conversation.

A new session must still fresh-reconcile GitHub before continuing because the handover is an index, not the source of truth.

## Bounded roadmap objects

Long autonomous work must be shaped into bounded outcome-bearing packages. Each active package must state:

- objective;
- in scope;
- out of scope;
- terminal state;
- validation/evidence;
- next action or stop condition.

Repair/revalidation loops may remain inside the same package when they are deterministic and in scope. Finishing a package does not silently authorize an unlimited chain of successor packages. A successor may continue only if it is already READY and within standing repository authority.

If a package becomes too large for a safe handover or has an ambiguous terminal state, split future work at a meaningful outcome boundary.

## Cost model

Context analysis happens in the active agent/runtime. GitHub stores durable policy and handover state.

Therefore:

- no scheduled context polling workflow is allowed;
- no background GitHub context retriever is required;
- ordinary GitHub API reads/writes do not consume Actions minutes;
- handover/documentation-only commits should use `[skip ci]` where supported;
- a future runtime-specific local hook may call this policy, but it must not convert the policy into a GitHub polling job.

## Verification scenarios

The contract is considered structurally sound when these cases hold:

| Scenario | Expected behavior |
| --- | --- |
| Telemetry reports 63% at a safe boundary | Prepare handover now; do not start another package |
| Telemetry reports 52%, state is simple and exact | Continue current bounded package |
| Telemetry unavailable after many repair/state cycles | Prepare an early heuristic handover |
| Runtime emits pre-compaction signal | Treat as emergency continuation signal |
| Package completes at 66% and successor is READY | Handover first; successor belongs in the next session |
| Handover-only repository update | Prefer `[skip ci]`; no context polling Action |

## Limits

This repository policy cannot force an ordinary ChatGPT surface to expose an exact context percentage. Where exact telemetry is unavailable, compliance is deliberately heuristic. The durable behavior—safe boundary, reconciliation, rotation, and copy-paste object—is still enforceable through repository instructions.
