# Repository Handover Protocol

Status: ACTIVE

GitHub is the project source of truth. The handover is a resumability index.

## Canonical handover

- `continuity-state:docs/handovers/CURRENT.json` — latest complete checkpoint.
- `continuity-state:docs/handovers/PREVIOUS.json` — immediately preceding checkpoint.

Live `main`, open PRs/checks and authoritative generated state outrank these snapshots.

## Mandatory one-package cycle

For ordinary ChatGPT/Culinary repository development:

```text
fresh reconcile
→ exactly one bounded package
→ terminal/gate/wait/context boundary
→ fresh reconcile
→ CURRENT -> PREVIOUS
→ write + verify new CURRENT
→ emit the same complete JSON object to the user
→ STOP
```

Do not begin the successor package in the same cycle, even when it is READY and within standing authority.

## Terminal boundaries

A handover is mandatory when any of these occurs:

- the bounded package reaches its declared terminal state;
- a material PR is merged or closed;
- a human/error/cost/security gate is reached;
- an external dependency is stably waiting after one bounded unchanged re-check;
- context/tool history is becoming unsafe to retain exactly;
- the user explicitly asks for a handover.

“No narration” does not suppress a terminal handover.

## New-chat startup

A new chat should:

1. fetch CURRENT explicitly from ref `continuity-state`;
2. fetch current `AGENTS.md`, `docs/ROADMAP.md` and relevant contracts from live `main`;
3. fresh-reconcile main SHA, open PRs/branches, changed files and checks;
4. let newer live state override stale handover fields;
5. execute **one** next bounded package only;
6. terminalize, emit the next handover, and stop again.

## CURRENT completeness

CURRENT should include:

- date/timezone/status;
- repository/lane/source-of-truth rule;
- live main SHA used for reconciliation;
- open PR/branch/head SHA/check state;
- current package objective/in-scope/out-of-scope/terminal;
- completed work;
- relevant failures/repairs/rejected approaches;
- authority/cost/concurrency constraints;
- exact next action;
- human/error/cost/waiting gates;
- remaining Definition of Done;
- startup instruction for the next chat.

Never store secrets, tokens, raw protected recipe bodies, or sensitive runtime payloads.

## Loop breakers

One unchanged external-status re-check per cycle. One equivalent repair/revalidation cycle per package. If either repeats without material new evidence, persist state, emit handover, stop.

## Context

Context percentage is not the primary control. Where telemetry exists, ~50% is a conservative early handover trigger. Otherwise use qualitative context risk and prefer stopping early.

## Cost

No scheduled/background context poller is permitted. Direct continuity-state writes use `[skip ci]` and do not require GitHub Actions.
