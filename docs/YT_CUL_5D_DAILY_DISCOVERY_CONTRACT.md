# YT-CUL-5D — Automatic Daily Discovery Contract

Date: 2026-09-05

State: `MERGED_GREEN / SCHEDULED_ACTIVE`

Merge: `bfe56563c443549623b56038b4b1a65b2af821e2`.

Prerequisite: `YT_CUL_5R_RELEVANCE_SOURCE_DIVERSITY_ARCHITECTURE_PASS` — merged green at `4bd9678d97dd5369daeb3c08f4e0c49996dbcfda`.

## Operating behavior

After this workflow is merged to `main`, GitHub Actions schedules one quota-aware cycle per YouTube quota day at `09:20 UTC`. The runner calculates the authoritative quota date in `America/Los_Angeles`, so DST does not change the once-per-quota-day invariant.

The live loop is:

```text
quota-day preflight
→ adaptive 8–32 Search-call plan
→ channel / playlist discovery
→ lower-cost uploads / playlist / video snippet reads
→ transient external-source pointer extraction
→ independent non-YouTube page fetch
→ Recipe-structured-page detection
→ bounded Atlas-gap relevance pre-screen
→ ATLAS_RELEVANCE_REVIEW_READY packets
→ source/target deduplication
→ source-domain diversity accounting
→ cumulative policy-safe state
→ next quota day
```

Raw YouTube API payloads are runner-local transient files and are deleted before job exit. No raw YouTube title, description, IDs, statistics, creator ranking, audiovisual material or Blue Lagoon data is committed to cumulative state.

## Adaptive Search budget

- first active day: `16` Search calls;
- minimum active budget: `8`;
- ordinary ceiling: `32`;
- hard ceiling: assigned daily Search limit minus the protected five-call reserve;
- useful multi-domain packet yield can increase the next budget by 8;
- zero packet yield, duplicate dominance, source concentration or backlog pressure reduces the next budget by 8;
- hard holds use `0` Search calls.

The current owner-verified Search Queries daily limit is `100`, rechecked `2026-09-05`. The workflow fails closed if that configured quota/policy vintage becomes stale under the preregistered 30-day freshness guard.

## Stop / hold control law

Before any Search call, the workflow reads only cumulative policy-safe state and evaluates these stop states:

- `YT_CUL_6_READINESS_EARNED` — stop Search;
- `DAILY_SEARCH_HOLD_ALREADY_COMPLETED_QUOTA_DAY` — no duplicate same-quota-day spend;
- `DAILY_SEARCH_HOLD_REVIEW_BACKLOG` — unresolved review packets reached the cap of `40`;
- `DAILY_SEARCH_HOLD_LOW_MARGINAL_VALUE` — three consecutive active quota days created zero new review-ready packets after deduplication;
- `DAILY_SEARCH_HOLD_POLICY_OR_QUOTA` — policy/quota vintage is stale or unsafe.

Otherwise the normal daily terminal states are:

- `DAILY_DISCOVERY_CONTINUE`;
- `DAILY_DISCOVERY_CONTINUE_REDUCED_BUDGET`.

A hard hold is durable. Live Search does not silently restart from a stale query/relevance vintage.

## Knowledge Core authority and YT-CUL-6

YT-CUL-5D packages evidence but does not impersonate canonical Knowledge Core review.

The durable bridge file `data/generated/youtube-culinary-canonical-review-bridge.json` accepts only explicit outcomes carrying `reviewAuthority: KNOWLEDGE_CORE_ATLAS_REVIEW`. A bridge outcome may resolve a review packet as `ACCEPTED`, `REJECTED` or `HELD`.

YT-CUL-6 is marked earned only when a canonical accepted outcome explicitly states all of the following:

- the programme-origin packet reached `APP_AUTHORING_ELIGIBLE` or the then-current canonical equivalent;
- independent non-YouTube evidence supports the outcome;
- rights, provenance and safety are clear;
- the outcome is pinned to a Knowledge Core commit.

When that occurs, YT-CUL-5D records `YT_CUL_6_READINESS_EARNED` and stops further live Search automatically. It still does not auto-admit a public recipe or change public runtime behavior.

## Persistence

The scheduled workflow has `contents: write` only to persist the policy-safe cumulative state file after a successful live run. It does not upload raw YouTube payload artifacts. State commits use `[skip ci]` and bounded rebase/push retries so ordinary concurrent repository work does not create a second discovery run.

Manual `workflow_dispatch` defaults to `dry_run=true`, which validates state, quota-date logic and safety contracts with zero Search spend. The scheduled trigger is live by default.

Cloudflare D1 Step 7B remains a separate human gate and does not block YT-CUL-5D.
