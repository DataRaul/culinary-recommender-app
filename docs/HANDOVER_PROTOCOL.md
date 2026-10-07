# Repository Handover Protocol

Status: ACTIVE

GitHub is the project source of truth. The handover is a resumability index.

## Canonical rolling handover

The latest resumability state is stored on Git ref **`continuity-state`**, not on `main`:

- `continuity-state:docs/handovers/CURRENT.json` — latest complete checkpoint.
- `continuity-state:docs/handovers/PREVIOUS.json` — immediately preceding checkpoint.

The files with the same paths on `main` are bootstrap/pointer material only and must not be treated as the latest handover.

Do not merge routine continuity-state checkpoint commits into `main`.

## New-chat startup

A new chat may start with:

`Continue the Culinary App lane from the current repository handover.`

Then it must:

1. fetch `docs/handovers/CURRENT.json` explicitly from ref `continuity-state`;
2. fetch current `AGENTS.md`, `docs/ROADMAP.md` and referenced contracts from live `main`;
3. fresh-reconcile live `main`, open PRs, active branches, changed files and required checks/status;
4. read newer generated work-unit state for any scheduled child programme that may have advanced;
5. let live GitHub and newer authoritative generated state override stale handover fields;
6. continue only the exact next action that remains valid after reconciliation.

## Rolling checkpoint rule

A durable checkpoint is required after any:

- material bounded-package terminal;
- merged material PR;
- material roadmap transition;
- human/error/cost/security gate;
- validated stable waiting state.

**Before starting a successor package, checkpoint the package just completed.** Do not carry more than one materially changed package without a durable rolling snapshot.

At each checkpoint:

1. reach a safe deterministic boundary;
2. fresh-reconcile live GitHub;
3. read CURRENT from `continuity-state`;
4. write that exact prior CURRENT to PREVIOUS on `continuity-state`;
5. write one complete new CURRENT on `continuity-state`;
6. commit with `[skip ci]`;
7. re-read CURRENT from `continuity-state`;
8. only then begin the successor package.

Routine checkpoints remain silent when a standing no-narration contract applies.

## Context-risk boundary

Context percentage is secondary, not the primary safety mechanism.

When telemetry exists, preferred trigger is 65%, target 60–70%, acceptable 55–75%. When it does not exist, never invent a number. Long tool history, repeated repair cycles, many mutable state transitions, runtime compaction signals or increasing identifier/state retention risk are enough to checkpoint early.

At a context-risk boundary:

1. do not start another substantive package;
2. finish only to the nearest safe deterministic boundary;
3. refresh the rolling checkpoint on `continuity-state`;
4. emit that same complete CURRENT object to the user as one copy-pasteable JSON object;
5. stop substantive work in the current conversation.

## Completeness contract

CURRENT should contain enough exact state for another chat to resume without reconstruction:

- handover name/date/timezone/status/human-needed state;
- repository, lane and source-of-truth rule;
- live-main SHA used for the checkpoint;
- open PR/branch/head SHA and material check state;
- active bounded package and terminal condition;
- completed work since the previous checkpoint;
- failures/repairs/rejected approaches that matter;
- architecture/authority/cost/concurrency constraints;
- canonical roadmap/contract pointers;
- exact next safe action;
- remaining Definition of Done;
- human/error/cost gates;
- startup instruction requiring fresh reconciliation.

Never include secrets, tokens, raw protected recipe bodies or other sensitive runtime payloads.

## Standing authority

`AGENTS.md` remains controlling. Handover state never creates new execution authority. Ordinary repository validation already authorized by the active lane remains authorized; cost/security/paid-service/human-only gates remain gates.

## Scheduled child programmes

Scheduled/state-changing child programmes keep their canonical generated closure state on `main`. That newer generated state outranks a rolling handover for the child programme it represents. A rolling checkpoint should point to it, not duplicate large histories.

## Conflict priority

1. live GitHub `main`, repository instructions and current checks;
2. authoritative generated child-programme state;
3. current roadmap/contracts on `main`;
4. `continuity-state:docs/handovers/CURRENT.json`;
5. PREVIOUS only for rollback/context.

## Cost rule

No scheduled context poller is permitted. Continuity-state writes are direct Git state updates by the active agent and must use `[skip ci]`. They are not a reason to run or merge a GitHub Actions workflow.
