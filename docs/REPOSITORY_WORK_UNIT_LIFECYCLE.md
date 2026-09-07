# Culinary Repository Work-Unit Lifecycle

Status: ACTIVE

Policy ID: `CULINARY_REPOSITORY_WORK_UNIT_LIFECYCLE_V1`

## Purpose

Culinary already has repository handovers, roadmap gates, generated programme state, durable daily YouTube discovery state, deterministic validation and human-only boundaries. This contract connects those pieces so scheduled/state-changing work cannot run in isolation.

> A scheduled or otherwise state-changing work unit is complete only when its result is durable, affected current-state surfaces are reconciled, the successor/hold/retirement state is explicit, and the repository remains resumable without reconstructing the prior chat.

This is operational governance. It does not copy Market Lab gate semantics and does not create a second Culinary roadmap.

## Canonical sequence

```text
wake-up / trigger
→ reconcile current GitHub + generated programme truth
→ check eligibility, authority, cost, quota, policy and concurrent work
→ execute only the bounded currently authorized work
→ persist result or recoverable partial state
→ validate domain/safety/public-boundary invariants
→ derive and persist work-unit closure state
→ reconcile static roadmap/handover surfaces when a material transition occurred
→ evaluate successor / hold / retirement
→ materialize only the next necessary trigger
→ stop at human / cost / access / security / scope gates
```

A schedule is a wake-up mechanism, not an authority grant.

## Routine state versus material transition

Daily operational evidence should not cause large documentation rewrites.

Routine YT-CUL daily progress is canonical in:

- `data/generated/youtube-culinary-daily-discovery-state.json`;
- `data/generated/youtube-culinary-work-unit-state.json`.

The static roadmap and full `docs/handovers/CURRENT.json` need reconciliation when the work-unit state marks a **material transition**, such as:

- a durable hard hold;
- YT-CUL-6 readiness earned;
- a primary-run failure that changes safe continuation;
- a changed authority/cost/policy boundary;
- a new successor programme or human gate.

Routine successful quota days do not rotate the full handover object merely to record activity.

## YT-CUL daily closure

For the current daily discovery workflow:

```text
preflight + deterministic tests
→ Knowledge Core review-bridge sync when enabled
→ quota-date-aware adaptive discovery
→ derive work-unit closure state
→ persist daily state + closure state in the same bounded commit
→ emit compact summary including closure/successor/scheduler disposition
```

A discovery command finishing is therefore not the terminal project-state event. The closure state must also be persisted.

## Closure-state meanings

The derived work-unit artifact records at minimum:

- policy/schema identity;
- source daily-state fingerprint;
- primary workflow outcome;
- latest quota date and latest daily terminal state;
- closure status;
- material-transition flag;
- roadmap/handover reconciliation requirement;
- successor action;
- next-trigger disposition;
- scheduler disposition;
- preserved authority boundaries.

Typical dispositions:

- `CONTINUE_BOUNDED_WAKEUP` — routine closed day; next quota-day wake-up remains valid.
- `HOLD_FAIL_CLOSED` — live Search is not eligible until the recorded hold is explicitly resolved.
- `RETIRE_OR_REPLACE_AFTER_READINESS_HANDOFF` — YT-CUL-6 readiness was earned; recurring discovery cannot silently become the next programme.
- `RECONCILE_BEFORE_RETRY` — the primary work failed; current durable state must be reconciled before equivalent live work is retried.

## Handover relationship

`docs/HANDOVER_PROTOCOL.md` remains the full continuation protocol. The generated work-unit state is a current child-programme surface between full handover rotations.

A new chat should:

1. read `docs/handovers/CURRENT.json`;
2. fresh-reconcile live GitHub;
3. read `data/generated/youtube-culinary-work-unit-state.json` for any scheduled child programme that advanced after CURRENT was written;
4. treat the newer live/generated state as authoritative for that child programme;
5. reconcile and rotate CURRENT before crossing any material successor/human/cost boundary.

This keeps repository resumption reliable without forcing a giant handover rewrite after every routine scheduled run.

## New scheduled workflow rule

Any future workflow containing `schedule:` must be registered in `config/work_unit_lifecycle.json` before merge, including:

- durable ID;
- workflow path and work-unit kind;
- durable state/evidence surfaces;
- preflight contract;
- closure surfaces;
- successor rule;
- retirement rule;
- material transition states where applicable.

CI must fail when an unregistered scheduled workflow or incomplete lifecycle contract is introduced.

## No permanent external watcher dependency

Correctness must not depend on a permanent ChatGPT task rediscovering stale Culinary state. External wake-ups may be useful for genuine future dates/human checks, but every repository work unit must leave enough durable state to resume correctly on its own.

## Boundaries preserved

This lifecycle never grants:

- automatic Knowledge Core Atlas promotion;
- automatic app admission or publication;
- public use of private Knowledge Core runtime;
- paid infrastructure/API/corpus authority;
- weakened nutrition/source/quantity/allergen semantics;
- bypass of browser/live human gates;
- permission to cross an undefined roadmap gate.

Machine-readable registry: `config/work_unit_lifecycle.json`.
