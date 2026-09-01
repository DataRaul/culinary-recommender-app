# Recipe Corpus Gate F2 — Breadth Expansion Foundation

Status: **BRANCH-LOCAL FOUNDATION / NOT PUBLICLY ACTIVATED**

Working branch: `v1-recipe-corpus-gate-f2-breadth-foundation`

This milestone extends the already user-accepted Recipe Corpus Gate F from a bounded eight-record proof into a scalable, fail-closed corpus-control architecture. It does **not** add new public recipes, change browser recommendation behavior, import source nutrition, or authorize a merge to `main`.

## Why F2 exists

Gate F proved that a text-only English Wikibooks Cookbook lane can be handled under the existing CC BY-SA 4.0 provenance and attribution controls. The next problem is breadth: broad discovery measured 3,792 recipe pages, while only eight exact-revision records are currently normalized into the public repository.

F2 separates that scale problem into explicit states rather than hard-coding thousands of recipes into one JavaScript module:

`metadata discovery → review queue → exact-revision review → reject/admit → ontology/hard-metadata state → compact metadata index → separately gated runtime materialization`

The broad source universe is not assumed to be representative of world cuisine, culturally authoritative, nutritionally authoritative, or recommendation-safe merely because a page exists.

## New artifacts

- `scripts/wikibooks-gate-f2-contract.mjs` — deterministic state machine, validator, coverage report and compact-index builder.
- `scripts/wikibooks-gate-f2-review-ledger.json` — normalized review ledger seeded from the accepted Gate F eight admissions and five preserved rejection examples.
- `scripts/discover-wikibooks-gate-f2.mjs` — metadata-only MediaWiki discovery. It records page IDs, exact revision IDs and revision timestamps; it does not acquire recipe prose, images or nutrition.
- `scripts/report-wikibooks-gate-f2-coverage.mjs` — coverage/rejection reporting.
- `scripts/build-wikibooks-gate-f2-index.mjs` — deterministic compact-index generator.
- `data/generated/wikibooks-gate-f2-index-v1.json` — current metadata-only generated index. It is not imported by the browser.
- `tests/wikibooks-gate-f2.test.js` — fail-closed contract tests.

## State model

Every tracked record is exactly one of:

- `DISCOVERED_UNREVIEWED`
- `REVIEW_READY`
- `ADMITTED`
- `REJECTED`

Discovery never implies admission.

An unadmitted record must have:

- no runtime artifact;
- no recommendation eligibility;
- no inferred hard metadata;
- no inferred ingredient mapping;
- no nutrition authority.

An admitted record must preserve:

- source page title and page ID;
- exact revision ID and timestamp;
- dish-family ID;
- reviewed admission state;
- recommendation state;
- hard-metadata state;
- ingredient-mapping state;
- explicit external-nutrition firewall;
- pointer to the already reviewed runtime artifact;
- coverage metadata.

The current eight admissions remain the same Gate F records. F2 changes their **control-plane representation only**.

## Rights / provenance firewall

The source contract remains:

- English Wikibooks Cookbook;
- CC BY-SA 4.0;
- Wikibooks contributor attribution;
- exact revision pinning;
- text-only after review;
- images excluded;
- source nutrition excluded from authoritative NutritionSource;
- no live browser fetch;
- no runtime dependency on Wikibooks.

The discovery tool is deliberately metadata-only. It does not bulk-copy recipe text. A future admitted recipe still needs bounded text review and transformation under the existing rights audit before any public runtime artifact is created.

## Ingredient ontology firewall

Corpus presence is independent from ontology confidence.

F2 records ingredient mapping as a separate state. Future candidates may remain `UNRESOLVED` rather than being coerced into a canonical ingredient ID. A recipe can therefore be discoverable in the corpus-control plane without being recommendation eligible.

Increasing recipe count is not a reason to reduce ontology confidence.

## Nutrition firewall

Every currently admitted external record carries:

`EXTERNAL_RECIPE_NUTRITION_NOT_IMPORTED`

F2 does not read, trust or promote recipe-source nutrition. Authoritative recipe nutrition still requires the separate reviewed NutritionSource path, exact quantity normalization, nutrient-semantic compatibility and deterministic recipe calculation.

RecipeSource and NutritionSource remain independent.

## Coverage reporting

The F2 report measures the reviewed corpus-control state by:

- review state;
- admission/rejection state;
- recommendation state;
- dish family;
- cuisine;
- region/country;
- meal type;
- recipe role;
- dietary/constraint signal;
- source-category-derived technique signal;
- rejection reason;
- ingredient-mapping status;
- exact-revision coverage;
- nutrition-firewall coverage.

The seed ledger truthfully preserves the current external-corpus gaps. In particular, `contemporary_modern` and `genuinely_new_trending` remain uncovered recipe roles.

Coverage counts are diagnostic. They are not authenticity scores, world-cuisine-completeness scores, popularity rankings, or trend evidence.

## Duplicate / family handling

Each admitted record has a `dishFamilyId`. Multiple source records may eventually share one family without losing their individual provenance. Family grouping is therefore an indexing relationship, not destructive deduplication.

The already-known Spanish omelet record remains grouped under `spanish_potato_omelet`, preserving the cross-source family rather than replacing the project-authored variant.

## Performance boundary

F2's generated index is intentionally metadata-only. It contains no ingredient list, recipe instructions or source prose.

That design allows future breadth work to keep:

- compact browse/search metadata separate from heavier normalized recipe detail;
- exact provenance available without loading every recipe body;
- runtime activation separately gated;
- local deterministic search possible later;
- no backend, private Knowledge Core runtime, paid API or runtime LLM.

The current generated index is **not imported by the public app** and has `runtimeActivationAuthorized: false`.

## Acquisition / review operating mode

Metadata discovery can be run locally:

```bash
node scripts/discover-wikibooks-gate-f2.mjs
```

Default output is under ignored `.cache/` state. The tool can be bounded with `--limit=<n>` and redirected with `--output=<path>`.

The discovery result is an acquisition snapshot, not an admission list. Review must decide page-level rights/attribution issues, source completeness, dish-family mapping, ingredient normalization, hard metadata and final admission/rejection state.

Coverage can be inspected with:

```bash
node scripts/report-wikibooks-gate-f2-coverage.mjs
```

The compact branch-local index can be rebuilt with:

```bash
node scripts/build-wikibooks-gate-f2-index.mjs
```

## Current branch-local baseline

The F2 seed ledger contains:

- 8 admitted exact-revision Gate F records;
- 5 preserved reviewed rejection examples;
- 2 current `SEARCH_ONLY` external records;
- 6 current `REFERENCE_ONLY_INCOMPLETE_HARD_METADATA` external records;
- 0 newly admitted recipes;
- 0 runtime behavior changes;
- 0 Brain-derived public behavior changes.

The earlier broad discovery measurement remains 3,792 recipe pages. That number is not forced to equal the separate Knowledge Core source-navigation snapshot.

## Knowledge Core reconciliation

Knowledge Core remains the reasoning / Culinary & Nutrition Brain layer. At the start of this F2 work the authoritative active Brain branch was rechecked as identical to:

`3cfc49c63559c31664375b71aea0dcd9f0525580`

That state contains:

- 338 seed families;
- 20 identity-verified;
- 20 structure-verified;
- 20 variant-aware;
- 4 transformation-aware;
- 20/20 initial-cohort P4 technique links;
- 0 app-authoring eligible;
- 0 public-export eligible.

F2 therefore does not treat current Brain knowledge as authorization to change the public corpus or recommendation behavior.

## Public activation gate

This branch is intentionally non-main.

Before any PR, merge, `main` push or public activation:

1. run deterministic repository validation;
2. review generated/review-ledger diffs;
3. keep the Wikibooks rights/provenance contract green;
4. keep ontology and nutrition firewalls green;
5. confirm no accidental runtime import of the F2 index;
6. obtain user approval before any action that triggers GitHub Actions;
7. separately review any actual new public recipe admission.

No GitHub Actions are required to continue branch-local F2 development.
