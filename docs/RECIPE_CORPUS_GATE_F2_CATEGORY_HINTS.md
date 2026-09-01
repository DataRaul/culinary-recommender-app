# Recipe Corpus Gate F2 — Current-Page Category Hints

Status: **AUDIT / DISCOVERY-PRIORITIZATION CONTROL PLANE / NO RUNTIME AUTHORITY**

Gate F2 exact-revision discovery and review remain authoritative for page identity, revision identity and review state. This optional enrichment is deliberately separate: it acquires the **current category metadata of pages already present in a Gate F2 discovery snapshot** so later review prioritization can use source-side navigation hints without pretending those hints are hard recipe facts.

## Why this is a separate pass

The MediaWiki `prop=categories` module has its own continuation. Combining it naively with the existing `generator=categorymembers` discovery call can produce multiple continuation dimensions and split one page's category list across API responses.

Gate F2 therefore keeps two different artifacts:

1. exact-revision discovery — page ID, source title, exact revision ID and revision timestamp;
2. current-page category hints — separately timestamped navigation metadata used only to help decide what deserves review.

The category pass takes a completed or bounded discovery JSON file as input. It queries explicit page-ID batches and **fully drains property continuation for each batch before advancing to the next batch**. Generic MediaWiki continuation keys are forwarded exactly rather than assuming only `clcontinue` exists.

## Evidence role

Category-hint output is marked:

- `acquisitionMode: CURRENT_PAGE_CATEGORY_HINTS_ONLY`;
- `evidenceRole: DISCOVERY_PRIORITIZATION_HINTS_ONLY`;
- `categoryMetadataRevisionPinned: false`;
- `hardMetadataInferenceAuthorized: false`;
- `authenticityInferenceAuthorized: false`;
- `trendInferenceAuthorized: false`;
- `nutritionAuthorityAuthorized: false`;
- `runtimeActivationAuthorized: false`.

The source category list is **not asserted to describe the exact historical revision recorded by discovery**. It is a later current-page observation.

A category such as `Category:Breakfast recipes`, `Category:Japanese recipes`, `Category:Vegan recipes` or a preparation category can therefore be used as a discovery/review hint only. It cannot directly set app `mealTypes`, cuisine/origin, dietary clearance, technique verification, authenticity, popularity or trend status.

## Source-state changes during enrichment

The source may change between exact-revision discovery and category acquisition. Each discovered page therefore retains the exact discovery title/revision/timestamp and separately records current category-query state:

- `PRESENT`;
- `MISSING_AT_CATEGORY_ACQUISITION`;
- `INVALID_AT_CATEGORY_ACQUISITION`;
- `NOT_RETURNED_BY_CATEGORY_QUERY`.

For a present page, `categoryQueryTitle` is recorded separately and `titleChangedSinceDiscovery` exposes title drift. Non-present states do not fabricate a current title.

These signals do not delete, overwrite or admit a reviewed record. They are investigation inputs for the existing fail-closed Gate F2 review/source-presence controls.

## Completeness boundary

The category snapshot inherits:

- `discoverySourceUniverseState`;
- `discoverySourceUniverseComplete`;
- `discoveryRecordCount`.

Category enrichment cannot upgrade a `LIMIT_REACHED` discovery sample into a complete source-universe measurement. It retains one category-hint row per discovery record even if the later category query does not return that page.

## Usage

After producing a Gate F2 discovery snapshot:

```bash
node scripts/wikibooks-gate-f2-category-hints.mjs \
  --input=.cache/wikibooks-gate-f2-discovery.json \
  --output=.cache/wikibooks-gate-f2-category-hints.json
```

The default explicit page-ID batch size is 50. A smaller batch may be selected with `--batch-size=N`.

The output remains a local review/audit artifact by default. This pass does not modify the immutable review ledger, generated runtime corpus, ingredient ontology, nutrition evidence or recommendation behavior.

## Deterministic safety properties

Tests cover:

- separate current-page versus exact-revision evidence roles;
- category deduplication and deterministic sorting;
- current title drift;
- missing-page state;
- partial discovery remaining partial;
- full draining of MediaWiki category-property continuation before moving to a new page-ID batch;
- repeated continuation tokens failing closed rather than looping;
- unexpected page IDs failing closed;
- mutation attempts that would authorize trend or hard coverage metadata being rejected.

## Firewalls preserved

This enrichment does not change the existing Gate F / F2 controls:

- exact page/revision provenance remains mandatory for review/admission;
- rights and page-level attribution obligations remain separate hard gates;
- images/media remain excluded;
- unknown hard metadata remains unknown;
- source categories are hints, not ingredient/dietary/allergen truth;
- source categories are not P4 technique verification;
- source categories and edit timestamps are not trend evidence;
- Wikibooks remains non-authoritative for nutrition composition;
- no private Knowledge Core runtime dependency exists;
- no automatic admission exists;
- no public behavior is authorized by this artifact.
