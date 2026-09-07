# Repository Handover Protocol

Status: ACTIVE

The repository, not chat copy-paste, is the continuation source for this lane.

## Canonical slots

- `docs/handovers/CURRENT.json` — latest complete continuation object.
- `docs/handovers/PREVIOUS.json` — immediately preceding complete continuation object.

Do not append an ever-growing sequence of handovers to `docs/ROADMAP.md`. The roadmap stores the protocol and the current next-ready action; the two JSON slots store continuation state.

## New-chat startup

A new chat should be able to start with a short instruction such as:

`Continue the Culinary App lane from the current repository handover.`

Then it must:

1. read `docs/handovers/CURRENT.json`;
2. read the relevant current sections of `docs/ROADMAP.md` and any canonical documents referenced by CURRENT;
3. fresh-reconcile GitHub `main`, open PRs, active/concurrent branches, changed files and CI/status before any meaningful action;
4. read any current generated work-unit state for scheduled child programmes that may have advanced after CURRENT was written;
5. treat live GitHub and newer generated child-programme state as source of truth when they differ from the saved handover baseline;
6. continue the next `READY` action autonomously under the saved operating contract.

The handover object's `handover_written_against_main_sha` is the baseline that existed before the handover rotation was committed. It is intentionally not required to equal the eventual commit SHA containing the handover files, avoiding a self-referential SHA loop.

## Standing execution authority carried by handovers

Repository instruction `AGENTS.md` controls standing execution authority. Current handovers must preserve that authority rather than reintroducing obsolete per-run approval gates.

- Ordinary implementation PRs, normal repository CI, browser acceptance, roadmap-required path-scoped workflows/benchmarks, and technically necessary ordinary CI reruns are standing-preapproved.
- Do not interrupt the user for routine GitHub Actions approval.
- Interrupt only for an unrecoverable error, a material new cost decision outside ordinary repository Actions usage, paid infrastructure/API/corpus licensing, security/access decisions, another genuine human-only gate, a terminal material result, or a continuation boundary.
- A materially abnormal CI loop or runaway Actions consumption is a cost gate; expected repository validation is not.

## Rotation at every continuation boundary

Before a chat/lane closes, transfers, approaches context exhaustion, or otherwise needs continuation:

1. **warn the user that a continuation handover is being prepared before context becomes unreliable;**
2. stop ordinary implementation at a safe deterministic boundary;
3. fresh-reconcile live GitHub;
4. read the exact existing `CURRENT.json` object;
5. replace `PREVIOUS.json` with that exact prior CURRENT object;
6. replace `CURRENT.json` with one new complete self-contained handover object representing the latest state;
7. ensure CURRENT includes the next executable action or the exact human/error/cost gate;
8. reconcile any roadmap status/next-action fields that materially changed;
9. perform the handover update as an isolated documentation change where possible, preserving concurrent work;
10. use `[skip ci]` for handover/documentation-only commits where repository workflow behavior supports it; do not intentionally spend GitHub Actions merely to rotate handover state;
11. after merge/write, verify the files are readable from canonical `main`.

The rotation is always:

```text
old CURRENT -> PREVIOUS
new latest state -> CURRENT
```

Only two canonical handover slots are required. Git history already preserves older handover versions, so a third ever-growing in-repo archive is unnecessary unless a future explicit audit requirement earns one.

## Scheduled child-programme state between handover rotations

A full handover object is intentionally not rewritten after every routine scheduled run. Scheduled/state-changing child programmes use `CULINARY_REPOSITORY_WORK_UNIT_LIFECYCLE_V1` and persist a compact current closure state instead.

For the current YouTube Culinary daily programme, read:

`data/generated/youtube-culinary-work-unit-state.json`

This generated object may be newer than CURRENT and is authoritative for the scheduled child programme's latest closure/successor/scheduler disposition after fresh GitHub reconciliation.

Routine successful daily progress does not require rotating CURRENT. A material work-unit transition does. Examples include:

- a durable hard hold;
- `YT_CUL_6_READINESS_EARNED`;
- a primary-run failure that changes safe continuation;
- a new cost/policy/access/security gate;
- a new successor programme or human gate.

When `roadmapHandoverReconciliation` in generated work-unit state says reconciliation is required, do not cross the successor boundary from a stale CURRENT snapshot. Fresh-reconcile, update the applicable roadmap/current-state surface, rotate CURRENT/PREVIOUS when a continuation snapshot materially changed, and only then proceed under the resulting authority.

This preserves both goals:

```text
routine automation does not create giant handover churn
AND
material scheduled transitions cannot disappear between chats
```

## Completeness contract for CURRENT

`CURRENT.json` should be sufficient for a new chat to resume without asking the user to paste the prior chat. At minimum it should contain:

- handover name/date/timezone/status/human-needed state;
- repository/lane ownership and source-of-truth rule;
- the GitHub baseline it was written against;
- operating/autonomy/cost/concurrency rules relevant to the lane;
- canonical document pointers;
- material accepted architecture/product constraints;
- important gates/decisions that must not be reopened casually;
- concurrent/stale branch state when materially relevant;
- the exact next action, including what is and is not authorized;
- human gates if any;
- the startup instruction for the next chat.

CURRENT should explicitly carry the standing CI authority from `AGENTS.md`: normal expected GitHub Actions validation must not be rewritten as a per-run approval requirement.

CURRENT should point to canonical roadmap/reference documents instead of duplicating every historical detail when those documents are already stable, but it must preserve enough context to prevent a new chat from taking the wrong lane or reopening settled decisions.

## Authority and conflict rules

Priority is:

1. live GitHub state and repository instructions;
2. current generated scheduled work-unit state for the child programme it represents;
3. canonical roadmap/contracts on current `main`;
4. `CURRENT.json` continuation snapshot;
5. `PREVIOUS.json` only for rollback/context when CURRENT appears corrupt or incomplete.

A saved handover never overrides a newer merged change. If another chat or scheduled programme advanced the repo after CURRENT was written, reconcile and update the handover rather than reverting newer work.

## Current lane convention

For the current Culinary App corpus-scale program, a new chat should normally need only:

`Continue from docs/handovers/CURRENT.json and pick up the next READY roadmap action.`

No large copy-pasted handover object should be necessary after this protocol is active.
