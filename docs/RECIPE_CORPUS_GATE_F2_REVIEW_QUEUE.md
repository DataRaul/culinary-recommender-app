# Recipe Corpus Gate F2 — Review Queue and Source-Universe Semantics

Status: **BRANCH-LOCAL / AUDIT AND REVIEW CONTROL PLANE / NO PUBLIC ACTIVATION**

Working branch: `v1-recipe-corpus-gate-f2-breadth-foundation`

This note records the Gate F2 review-queue semantics added after the original breadth foundation. It does not authorize new recipes, browser imports, source nutrition, or a merge to `main`.

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

Every queued/held row remains:

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

## Current source navigation observation

On 2026-09-01 the rendered English Wikibooks `Category:Recipes` page reported **3,825** recipe pages:

`https://en.wikibooks.org/wiki/Category:Recipes`

This is recorded separately in:

`data/source-observations/wikibooks-category-recipes-2026-09-01.json`

The observation is intentionally classified as:

`DYNAMIC_CATEGORY_NAVIGATION_COUNT_ONLY`

It does **not** replace the existing Gate F/F2 historical exact-discovery measurement of **3,792** pages. The net count difference of **+33** does not identify which pages were added, removed, renamed, moved, or otherwise changed. Only a fresh complete exact-revision discovery snapshot can establish the current page-level queue.

## Local branch workflow

A future local review cycle is:

```bash
npm run discover:recipe-corpus-f2
npm run queue:recipe-corpus-f2
npm run report:recipe-corpus-f2
npm run validate
```

The discovery and review-queue outputs remain ignored local cache by default. Broad metadata discovery does not itself modify the reviewed ledger.

## Firewalls preserved

This control-plane expansion preserves all prior Gate F / F2 boundaries:

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
- PR, Actions, merge and public activation remain separately gated.

## Current terminal state

The review queue is revision-aware across immutable multi-revision page history, source-universe completeness is explicit, source-title/provenance metadata drift is review-visible, and stale/internally inconsistent revision ordering fails closed into a hold state.

No newly discovered page has been admitted and no public runtime behavior has changed.
