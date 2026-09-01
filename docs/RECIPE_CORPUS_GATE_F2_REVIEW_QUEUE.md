# Recipe Corpus Gate F2 — Review Queue and Source-Universe Semantics

Status: **MAIN CONTROL PLANE + BRANCH-LOCAL SOURCE-PRESENCE HARDENING / NO RUNTIME ACTIVATION**

Current follow-up branch: `v1-recipe-corpus-gate-f2-source-presence-holds`

The Gate F2 breadth/review foundation merged through PR #24 at `0745f8990b3eca0003fdecd083cdc52830f5a233`. PR validation run `33531034797`, post-merge validation run `33532299918`, and Pages run `33532298831` all passed. The merged control plane does not authorize new recipes, runtime source fetching, source nutrition, private Knowledge Core runtime access, or automatic admission.

This follow-up hardening adds fail-closed source-presence comparison for **complete** exact-revision discovery snapshots. It remains branch-local until separately reviewed.

## Revision-aware review queue

The F2 discovery snapshot is compared against the immutable reviewed ledger before any review work begins.

A page may legitimately have more than one immutable reviewed ledger row over time. Therefore queue classification always compares discovery against the **newest tracked revision for that page**, not merely against any exact historical page/revision match still present in the ledger.

A discovered row is handled as follows:

- same page ID, same exact **newest tracked** revision ID, same title → skip as an unchanged reviewed revision;
- same page ID, higher revision ID with a later timestamp → queue as `TRACKED_PAGE_NEW_REVISION` / `REVIEW_SOURCE_EVENT`;
- same page ID and same exact newest tracked revision ID but changed source title → queue as `TRACKED_PAGE_METADATA_CHANGED` / `REVIEW_SOURCE_EVENT`;
- page ID not present in the reviewed ledger → queue as `NEW_SOURCE_PAGE` / `REVIEW_SOURCE_EVENT`;
- same page ID with a lower revision ID than the newest tracked revision → `TRACKED_PAGE_REVISION_REGRESSION` / `HOLD_SOURCE_ORDER_ANOMALY`, even when that lower revision exactly matches an older immutable ledger row;
- same page ID with a higher revision ID but a timestamp not later than the newest tracked revision → `TRACKED_PAGE_REVISION_ORDER_INCONSISTENT` / `HOLD_SOURCE_ORDER_ANOMALY`.

The last two states are not treated as new source evidence. They are explicit source-ordering anomalies that must be investigated before review proceeds. Historical exact matches are never allowed to make a stale observation appear current merely because that old revision remains in immutable review history.

Every discovered queued/held row remains:

- `DISCOVERED_UNREVIEWED`;
- `recommendationState: NOT_APPLICABLE`;
- `hardMetadataState: NOT_REVIEWED`;
- `ingredientMappingState: NOT_REVIEWED`;
- `nutritionState: NOT_APPLICABLE`;
- `runtimeArtifact: null`;
- `coverage: null`;
- `mayOverwriteTrackedRecord: false`.

A changed source revision is therefore a new review event. A stale or internally inconsistent discovery observation is held. Neither may silently replace an admitted or rejected exact revision.

## Source-universe completeness

Discovery snapshots state whether enumeration actually exhausted the source category or stopped at the requested limit.

Allowed states:

- `SOURCE_EXHAUSTED` with `sourceUniverseComplete: true`;
- `LIMIT_REACHED` with `sourceUniverseComplete: false`.

A partial discovery snapshot cannot masquerade as a complete source-universe measurement. Queue output carries the discovery completeness state so downstream audit code can distinguish a bounded sample from a full enumeration.

## Source-presence holds

A complete source-universe snapshot provides information that a bounded partial snapshot cannot: whether a previously active/pending tracked source page is no longer present in the enumerated `Category:Recipes` universe.

The follow-up control compares complete discovery page IDs against every tracked page that has **any immutable history row** in one of these presence-relevant states:

- `DISCOVERED_UNREVIEWED`;
- `REVIEW_READY`;
- `ADMITTED`.

The hold itself is anchored to the **newest tracked revision**, regardless of that newest row's review outcome. This matters when an older exact revision remains admitted but a newer reviewed revision was rejected: the page still carries a public/provenance presence obligation because the older admitted record remains part of tracked history. Pages whose entire tracked history is rejected are not source-presence obligations.

If a presence-relevant page is absent from a **complete** discovery snapshot, the queue emits a separate source-presence hold:

- reason: `TRACKED_PAGE_NOT_IN_COMPLETE_DISCOVERY`;
- action: `HOLD_SOURCE_PRESENCE_ANOMALY`;
- newest tracked revision remains the anchor;
- `presenceRelevantReviewStates` records which active/pending history states make the page presence-relevant;
- `mayDeleteTrackedRecord: false`;
- `mayOverwriteTrackedRecord: false`;
- `runtimeActivationAuthorized: false`.

These holds are deliberately separate from ordinary `reviewQueue` rows because no current source revision was discovered. Absence from a category can reflect deletion, move, recategorization, source-side restructuring or another source event; the control plane does not guess which.

**Partial discovery snapshots never create source-presence holds.** Unobserved pages in a `LIMIT_REACHED` sample are simply unknown, not removals.

Queue summaries therefore expose separately:

- `holdCount` / `revisionOrderHoldCount` for revision-order anomalies among observed rows;
- `sourcePresenceAuditEligible`;
- `sourcePresenceHoldCount`;
- `sourcePresenceHolds`;
- `totalHoldCount` across both classes.

This preserves backward meaning for the existing `holdCount` while making complete-universe disappearance events explicit.

## Current source navigation observation

On 2026-09-01 the rendered English Wikibooks `Category:Recipes` page reported **3,825** recipe pages:

`https://en.wikibooks.org/wiki/Category:Recipes`

This is recorded separately in:

`data/source-observations/wikibooks-category-recipes-2026-09-01.json`

The observation is intentionally classified as:

`DYNAMIC_CATEGORY_NAVIGATION_COUNT_ONLY`

It does **not** replace the existing Gate F/F2 historical exact-discovery measurement of **3,792** pages. The net count difference of **+33** does not identify which pages were added, removed, renamed, moved, or otherwise changed. Only a fresh complete exact-revision discovery snapshot can establish current page-level review events and source-presence holds.

## Local review workflow

A future local review cycle is:

```bash
npm run discover:recipe-corpus-f2
npm run queue:recipe-corpus-f2
npm run report:recipe-corpus-f2
npm run validate
```

The discovery and review-queue outputs remain ignored local cache by default. Broad metadata discovery does not itself modify the reviewed ledger.

## Firewalls preserved

This control-plane hardening preserves all prior Gate F / F2 boundaries:

- CC BY-SA 4.0 page-level provenance remains mandatory;
- extra page-level attribution/licensing notices remain review gates;
- images/media remain excluded;
- source nutrition is not authoritative nutrition evidence;
- ingredient ontology remains fail-closed;
- unknown hard metadata remains unknown;
- no live browser Wikibooks fetch exists;
- no Knowledge Core runtime dependency exists;
- no automatic admission exists;
- no generated F2 control-plane artifact is imported by browser runtime;
- source disappearance never deletes or downgrades a tracked record automatically;
- follow-up PR, Actions and merge remain separately gated.

## Current terminal state

The merged review queue is revision-aware across immutable multi-revision page history, source-universe completeness is explicit, source-title/provenance metadata drift is review-visible, and stale/internally inconsistent revision ordering fails closed into a hold state.

The current branch additionally makes presence-relevant tracked pages missing from a complete source snapshot visible as separate, non-destructive source-presence holds while refusing to infer removals from partial snapshots.

No newly discovered page has been admitted and no public runtime behavior has changed.
