# YT-CUL-5E — Adaptive 95-Call Research Portfolio

Date: 2026-09-06

Status: `IMPLEMENTED / VALIDATION_PENDING`

## Objective

Use the owner-verified 100 Search Queries/day limit as a renewable research portfolio while preserving five calls as a hard reserve. The active-day objective is therefore **up to 95 useful Search calls**, not a 32-call ceiling and not indiscriminate quota burning.

The control objective is verified culinary information gain:

```text
Search discovery
→ cheap known-ID traversal
→ independent non-YouTube evidence
→ review-ready Atlas packet
→ canonical Knowledge Core review
→ feedback
→ same-day / next-day reallocation
→ Atlas lifecycle advancement or justified hard gate
```

Low yield in one search arm is a reallocation signal, not a programme-level stop.

## Corrections implemented

1. **95-call active ceiling** — `100 assigned - 5 reserve = 95 usable`.
2. **No global low-yield stop** — the former three-zero-packet-days programme hold is superseded by arm cooling and portfolio reallocation. Genuine hard gates remain policy/quota staleness, YT-CUL-6 completion and unresolved review backlog.
3. **Intra-day tranches** — first tranche 16 calls, then 8-call reallocations, with a final bounded tranche to land exactly on 95.
4. **Expanded query portfolio** — 128 deterministic bounded channel/playlist search opportunities across the eight current Atlas gaps, before dynamic follow-ups.
5. **Controlled adaptive query generation** — promising same-day candidate labels, canonical accepted outcomes and canonical held/retryable evidence questions may generate bounded follow-up searches. Rejected non-retryable candidates are not blindly repeated.
6. **Known-ID depth preserved** — Search discovers territory; `channels.list`, `playlistItems.list` and `videos.list` traverse discovered territory without wasting Search calls on repeated known surfaces.
7. **Canonical feedback allocation** — accepted / rejected / held Knowledge Core outcomes change future focus priority. Same-day provisional yield changes the next tranche without pretending to be canonical evidence.
8. **Canonical review boundary preserved** — the App does not manufacture Knowledge Core decisions. The separate KC review/export processor is the remaining cross-repository authority layer.
9. **Information-gain KPIs** — daily reporting includes independent pages/Search, Recipe-structured pages/Search, review-ready packets/Search, useful source domains/Search, canonical accepted outcomes/cumulative Search, explicit lifecycle advancements/cumulative Search and app-authoring-eligible outcomes/cumulative Search.

## Allocation law

Each tranche reserves at least 25% for exploration. Exploitation is capped so one focus cannot consume more than half of exploitation slots in a tranche.

A focus gains priority from:

- canonical `ACCEPTED` outcomes;
- strong same-day independent-source and packet yield;
- promising same-day review-ready candidates;
- canonical accepted follow-up questions.

A focus loses priority from:

- canonical `REJECTED` / `HELD` outcomes;
- repeated same-day zero-packet yield;
- duplicate-pair concentration;
- repeated exposure without corresponding evidence gain.

The response to weak yield is therefore:

```text
cool weak arm
→ move next tranche elsewhere
→ preserve exploration
→ retry only through a materially different bounded query or explicit retryable evidence question
```

not:

```text
weak arm
→ stop the whole quota day
```

## Same-day follow-up

A newly admitted review-ready packet may generate a provisional query around its candidate label and bounded Atlas gap for later tranches on the same quota day. This is **discovery-only**. The label does not gain authenticity, canonical identity, structure, variant, nutrition, safety, app-authoring or public-export authority from this follow-up.

Canonical accepted outcomes receive a stronger follow-up bonus. Non-retryable canonical rejections are suppressed.

## Review backlog

The review queue cap remains 40. This is intentionally different from low search yield: once 40 unresolved canonical-review packets exist, the binding constraint is review throughput rather than discovery. Search stops rather than create evidence debt that cannot be retained/reviewed safely.

The intended next architecture is a governed Knowledge Core review processor and static outcome bridge so canonical review throughput can keep pace with the discovery portfolio.

## Crash-safe quota accounting

Search attempts are checkpointed into policy-safe durable quota-day progress before each Search request. If the workflow is interrupted after consuming Search quota, the workflow persists the progress record even on failure. A same-day rerun resumes from that recorded Search-call count and used query IDs instead of assuming zero spend or persisting the former same-day hard hold.

No YouTube channel IDs, playlist IDs, video IDs, titles, descriptions, engagement statistics or raw API payloads are added to durable programme state.

## Terminal states

Normal active completion:

- `DAILY_DISCOVERY_QUOTA_PORTFOLIO_COMPLETE` — usable 95-call portfolio consumed.
- `DAILY_DISCOVERY_PORTFOLIO_EXHAUSTED` — no eligible bounded queries remain before 95.

Hard stops:

- `DAILY_SEARCH_HOLD_REVIEW_BACKLOG` — unresolved canonical-review queue at cap.
- `DAILY_SEARCH_HOLD_POLICY_OR_QUOTA` — current policy/quota preconditions not safe.
- `YT_CUL_6_READINESS_EARNED` — success condition reached; Search stops.

The obsolete `DAILY_SEARCH_HOLD_LOW_MARGINAL_VALUE` is recoverable/superseded under this allocator because low marginal value belongs at the arm-allocation layer rather than programme-level shutdown.
