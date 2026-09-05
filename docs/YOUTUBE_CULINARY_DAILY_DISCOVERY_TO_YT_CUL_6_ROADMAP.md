# YouTube Culinary Daily Discovery → YT-CUL-6 Roadmap

Status: **AUTHORIZED ROADMAP EXTENSION / YT-CUL-5R RELEVANCE-SOURCE-DIVERSITY REPAIR READY / DAILY LIVE RUN BLOCKED UNTIL REPAIR PASS / YT-CUL-6 NOT YET EARNED**

Date: 2026-09-05

## Decision

YT-CUL-5 established that the YouTube acquisition surface is large enough but the conversion layer is weak: Search can expose many videos and outbound source pointers, while independently reachable Recipe-structured pages are not automatically relevant World Recipe Atlas evidence.

The programme therefore does **not** end after YT-CUL-5. It becomes a bounded, recurring daily discovery programme once the relevance/source-diversity repair passes.

Canonical sequence:

```text
YT-CUL-5 terminal result
→ YT-CUL-5R relevance + source-diversity repair (zero live Search)
→ YT-CUL-5D recurring daily bounded discovery
→ independent non-YouTube source review
→ Atlas-relevance review-ready packets
→ canonical Knowledge Core Atlas review/promotion
→ cumulative accepted evidence
→ YT-CUL-6 readiness gate
→ app translation only when separately earned
```

This document is an additive roadmap extension to `docs/YOUTUBE_CULINARY_DISCOVERY_ATLAS_ROADMAP.md` and supersedes only that document's stale YT-CUL-5/6 transition text. All YT-CUL-0 through YT-CUL-5 evidence, safety, quota, storage, rights, nutrition, Blue Lagoon-separation and Knowledge Core boundaries remain unchanged.

## Why the daily programme is required

The Search Queries allowance is a renewable quota-day resource, not a one-time pool. The programme should use that renewable resource to accumulate genuinely useful culinary discovery evidence over multiple days rather than expecting one pilot to populate the World Recipe Atlas.

However, recurring Search must optimize **accepted relevance and source diversity**, not activity. YT-CUL-5 showed:

- 10 Search calls;
- 568 transient unique video pointers;
- 812 transient external-source pointers;
- 14 independently reachable pages;
- 3 Recipe-structured pages;
- 1 confirmed source domain;
- 0 verified Knowledge Core Atlas relevance mappings;
- 0 canonical Atlas-family nominations/promotions.

Therefore `MORE_SEARCH != MORE_ATLAS_KNOWLEDGE` unless the relevance conversion layer is repaired.

## YT-CUL-5R — relevance + source-diversity repair

State: `READY / REPOSITORY_ONLY / ZERO_LIVE_SEARCH`

Objective: make every retained discovery packet answer the question **"why is this independent source relevant to a specific Atlas gap or lifecycle claim?"** before it can enter the Brain review queue.

Required implementation contract:

1. Preserve `INDEPENDENT_RECIPE_STRUCTURED_PAGE != ATLAS_FAMILY_RELEVANCE`.
2. Add an explicit `ATLAS_RELEVANCE_REVIEW_READY` packet schema.
3. Every packet must identify:
   - bounded Atlas target or candidate label;
   - intended claim scope: identity, structure, variant, technique/source question or transformation question;
   - macro-region/family/meal-role/technique gap being investigated;
   - independently fetched non-YouTube source provenance;
   - machine-extracted evidence limited to policy-safe discovery metadata;
   - reason the source appears relevant;
   - unresolved ambiguity/contradiction;
   - `automaticAtlasPromotionAuthorized=false`;
   - `automaticAppAdmissionAuthorized=false`.
4. Add deterministic source-domain diversity accounting using only independent non-YouTube source data.
5. Add duplicate suppression so already-reviewed source/target pairs do not consume new Search budget unnecessarily.
6. Add an unresolved-review queue cap so Search pauses rather than creating an unbounded review backlog.
7. Add tests proving a Recipe-structured page cannot become an Atlas nomination without the canonical Knowledge Core review boundary.
8. Preserve runner-local transient raw YouTube storage, TTL/delete rules, network safety, no statistics, no audiovisual downloads, no YouTube-derived creator/authenticity/engagement scoring and Blue Lagoon isolation.

Terminal result:

- `YT_CUL_5R_RELEVANCE_SOURCE_DIVERSITY_ARCHITECTURE_PASS` → daily activation may be built/armed.
- otherwise → `YT_CUL_5R_REPAIR_REQUIRED`, with zero live Search spend.

## YT-CUL-5D — recurring daily discovery cadence

State: `BLOCKED_UNTIL_YT_CUL_5R_PASS`

Once YT-CUL-5R passes, activate one scheduled run per YouTube quota day. The scheduler must be quota-date aware and must not assume a fixed local-calendar boundary when YouTube quota semantics use Pacific Time.

Each daily run performs:

```text
fresh policy/quota guard
→ read current cumulative programme state
→ inspect unresolved Atlas-review queue
→ choose highest-information Atlas gaps
→ allocate bounded Search budget
→ channel/playlist-first Search
→ lower-cost read fan-out
→ transient outbound-source discovery
→ independent external review
→ relevance pre-screen
→ source-diversity check
→ emit review-ready packets
→ update cumulative programme metrics
→ evaluate stop / hold / continue / YT-CUL-6 readiness
```

### Daily quota guard

For every quota day:

- use the actual assigned Culinary project quota as authority;
- preserve at least 5 Search calls as protected reserve;
- no quota extension request;
- no second Culinary project for quota multiplication;
- no Blue Lagoon cross-use;
- no automatic assumption that the full available quota should be spent.

### Adaptive Search budget

The daily engine starts conservatively after activation and expands only when downstream conversion earns it.

Preregistered control law:

- default live Search budget: **16 calls/quota day**;
- minimum exploration budget when active: **8 calls/quota day**;
- ordinary adaptive ceiling: **32 calls/quota day**;
- absolute ceiling: assigned daily limit minus protected reserve;
- the absolute ceiling is a safety bound, not a target.

Budget may rise from 16 toward 32 only when recent completed quota days show both:

- non-zero `ATLAS_RELEVANCE_REVIEW_READY` packet yield; and
- more than one independent source domain contributing useful review-ready evidence.

Budget falls toward 8 when relevance yield deteriorates, duplicates dominate, source concentration rises, or the unresolved review queue approaches its cap.

Search spend becomes **0 for that day** when any hard hold condition is active.

### Review-queue backpressure

The daily engine must not create unlimited evidence debt.

Initial roadmap cap: **40 unresolved `ATLAS_RELEVANCE_REVIEW_READY` packets**.

If the unresolved queue is at or above the cap:

```text
DAILY_SEARCH_HOLD_REVIEW_BACKLOG
```

No new Search is spent until enough packets are resolved, rejected or deduplicated below the cap.

The queue cap is a governance parameter and may be changed only in a new documented roadmap vintage after observing real review throughput.

### Adaptive gap selection

Daily Search allocation must use only programme-owned admissible state and canonical Atlas gap metadata. It may shift effort across macro-regions, dish families, meal roles, technique questions, variants and multilingual aliases based on:

- unresolved Atlas coverage gaps;
- prior independently reviewed evidence yield;
- accepted/rejected review history;
- duplicate rate;
- independent source-domain diversity;
- review backlog.

It must **not** use views, likes, subscribers, comments, engagement, creator popularity or a custom YouTube-derived authenticity/quality score.

## Cumulative evidence ledger

Daily runs are not independent pilots. They append policy-safe cumulative programme state across quota days.

Track at minimum:

- quota days completed;
- Search calls used by quota day and cumulative phase;
- independent pages reviewed;
- Recipe-structured pages confirmed;
- unique independent source domains;
- `ATLAS_RELEVANCE_REVIEW_READY` packets created;
- packets accepted/rejected/held by canonical Knowledge Core review;
- accepted lifecycle outcomes by `IDENTITY_VERIFIED`, `STRUCTURE_VERIFIED`, `VARIANT_AWARE`, technique linkage/question and transformation state where applicable;
- duplicate/redundant discoveries suppressed;
- unresolved review backlog;
- relevant accepted evidence per Search call;
- source-domain concentration;
- marginal yield trend.

Do not retain raw YouTube metadata in the cumulative ledger.

## Knowledge Core boundary

The app lane may discover, independently review and package evidence. It may not impersonate the Culinary Brain.

Only canonical Knowledge Core review may turn a review-ready packet into an Atlas lifecycle state transition.

The daily engine therefore distinguishes:

```text
DISCOVERED_SOURCE_POINTER
!= ATLAS_RELEVANCE_REVIEW_READY
!= KNOWLEDGE_CORE_ACCEPTED_ATLAS_CLAIM
!= APP_AUTHORING_ELIGIBLE
!= PUBLIC_EXPORT_ELIGIBLE
```

Knowledge Core remains read-only/reconciliation from the Culinary App lane. Any cross-repository state exchange must use the existing generalized Knowledge Core platform integration architecture and must never create a private browser/runtime dependency.

## YT-CUL-6 readiness gate

YT-CUL-6 is **not** unlocked by number of searches, number of videos, number of links or number of Recipe-schema pages.

YT-CUL-6 becomes eligible to start only when all of the following are true:

1. YT-CUL-5R has passed and the recurring daily engine is operating without policy/storage/quota failures.
2. At least one discovery originating from this programme has crossed the canonical Knowledge Core lifecycle far enough to be explicitly marked `APP_AUTHORING_ELIGIBLE` (or the then-current canonical equivalent).
3. That eligibility is based on independent non-YouTube evidence and does not rely on YouTube as authenticity/canonicality/nutrition/safety authority.
4. No unresolved rights/provenance/safety blocker forbids downstream authoring review for that candidate.
5. The app lane fresh-reconciles the accepted Knowledge Core state before beginning translation.

When those conditions are met:

```text
YT_CUL_6_READINESS_EARNED
```

The daily discovery programme may then stop, pause, or continue in parallel according to the next roadmap vintage; it does not automatically publish a recipe.

If no candidate reaches `APP_AUTHORING_ELIGIBLE`, the daily programme continues only while marginal relevance value remains positive and no hold condition is active.

## Daily terminal states

Each scheduled run ends in exactly one of:

- `DAILY_DISCOVERY_CONTINUE` — useful evidence produced and programme remains below YT-CUL-6 readiness.
- `DAILY_DISCOVERY_CONTINUE_REDUCED_BUDGET` — useful but deteriorating/duplicate/concentrated yield.
- `DAILY_SEARCH_HOLD_REVIEW_BACKLOG` — unresolved review queue at/above cap.
- `DAILY_SEARCH_HOLD_LOW_MARGINAL_VALUE` — repeated low-value days require query/relevance redesign before more spend.
- `DAILY_SEARCH_HOLD_POLICY_OR_QUOTA` — policy, assigned quota, credential, storage or separation assumption changed.
- `YT_CUL_6_READINESS_EARNED` — canonical downstream eligibility gate satisfied.

## Low-marginal-value stopping rule

Do not burn quota indefinitely.

After activation, if **three consecutive completed active quota days** produce zero new `ATLAS_RELEVANCE_REVIEW_READY` packets after deduplication, enter:

```text
DAILY_SEARCH_HOLD_LOW_MARGINAL_VALUE
```

A new query/relevance vintage must be preregistered before Search resumes.

This hold is not a claim that YouTube has no culinary value; it means the current search strategy is no longer earning additional reviewable Atlas evidence.

## Automation and observability

The implementation phase should create a scheduled GitHub Actions control plane only after YT-CUL-5R passes.

The scheduled workflow must:

- execute at most once per YouTube quota day;
- calculate/record the applicable quota date;
- fail closed if the quota/policy vintage is stale;
- read cumulative durable programme state but no raw historical YouTube API payloads;
- preserve the five-call reserve;
- respect queue backpressure and low-value holds before making any Search call;
- emit a compact policy-safe daily summary;
- never upload raw YouTube API payloads as artifacts;
- never automatically promote Atlas or app state;
- stop scheduling live Search automatically once `YT_CUL_6_READINESS_EARNED` or another hard hold is recorded, unless a later roadmap explicitly authorizes continued parallel discovery.

## Consultant + Project Coach reconciliation

This roadmap applies the canonical guidance that activity volume is not terminal value. The renewable Search allowance is useful only when it advances the current binding constraint.

Consulting conclusion:

- continue discovery as a system, not as repeated one-off pilots;
- attack the relevance/source-diversity bottleneck before scaling Search;
- make continuation, hold and unlock conditions explicit.

Project Coach conclusion:

- define observable success and terminal state;
- sequence relevance repair before recurring live spend;
- preserve source-of-truth/authority boundaries;
- add queue backpressure, validation and cumulative handover state so the programme can run repeatedly without confusing activity with progress.

## Immediate next action

`YT_CUL_5R_RELEVANCE_SOURCE_DIVERSITY_ARCHITECTURE`

This is repository-only and consumes **0 live YouTube Search calls**. After it passes, implement and validate the scheduled `YT-CUL-5D` daily workflow. Only then activate recurring live discovery.
