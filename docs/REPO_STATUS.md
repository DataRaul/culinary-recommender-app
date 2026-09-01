# Culinary Recommender — Repository Status

**Snapshot date:** 2026-09-01  
**Repository:** `DataRaul/culinary-recommender-app`  
**Source of truth:** current GitHub state at the snapshot below.

This file is a current-state control surface. Historical gate sections elsewhere in the repository remain historical records and must not be rewritten as though later evidence was known earlier.

## Current public-app state

- `main`: `e3d87bdec2880aae2b9ae59a8cde106a9bafb0c8`
- latest merge: PR #27 — **Recipe Corpus Gate F2: add safe category hints**
- open PRs at this snapshot: **none**
- post-merge validation: run `33538967699` — **SUCCESS**
- GitHub Pages deployment: run `33538966639` — **SUCCESS**
- public runtime remains static, backend-free, runtime-LLM-free and independent of private Knowledge Core.

## Nutrition B8 — COMPLETE / MERGED

Nutrition B8 is no longer a candidate.

PR #26 — **Nutrition B8: exact small-onion quantity evidence** — merged at:

`51658632c1684e9206d24ed331ded116b730e412`

Final fully green B8 candidate:

- workflow run `33533992457`
- strict `git diff --check`: **PASS**
- deterministic suite: **109 tests**
- static validation, nutrition coverage, recipe-universe audit, Wikibooks exact-revision verification, Chromium/browser acceptance, bounded USDA Foundation checks and exact SR Legacy row verification all passed.

Normal PR validation also passed:

- run `33535410091`

Post-merge public validation and Pages both passed:

- validation run `33535630446`
- Pages run `33535629306`

### Admitted B8 evidence

USDA FoodData Central SR Legacy final release `2018-04`:

- food: `Onions, raw`
- FDC: `170000`
- NDB: `11282`
- exact portion row: `85862`
- amount: `1`
- modifier: `small`
- mass: **70 g**
- source ID: `usda-fdc-sr-legacy-2018-04-portions-b8`
- evidence tranche: `B8`
- runtime fetch: `false`
- composition use: `PROHIBITED_IN_THIS_TRANCHE`

Only `onion | small -> 70 g` is admitted. Generic onion `piece` remains the separate B6 Matvaretabellen `160 g` mapping. No red-onion, diameter, unspecified-size or other onion-size inference is allowed.

### Authoritative authored-recipe state after B8

- authored nutrition denominator: **76**
- authoritative authored recipes: **1**
- sole authoritative authored ID: `indian_chicken_spinach_curry`
- project estimates preserved: **75**
- unsupported quantity blockers: **27 -> 7**
- missing density blockers: **133**
- ambiguous portions: **20**
- mixed incompatible carbohydrate semantics: **16**
- missing tracked nutrient-field events: carbohydrate **28**, energy **5**, fat **65**, fibre **36**

Missing tracked nutrients remain unknown, never zero. Gate F / Wikibooks recipes remain outside the authored denominator and outside authoritative `NutritionSource`.

## Recipe Corpus Gate F2 — CONTROL PLANE MERGED / RUNTIME GATED

Gate F remains **COMPLETE / USER-ACCEPTED**. F2 is additive breadth-control infrastructure and does not reopen Gate F.

Current merged F2 lineage:

1. PR #24 — **revision-aware breadth control plane** — merged at `0745f8990b3eca0003fdecd083cdc52830f5a233`;
2. PR #25 — **hold source-presence anomalies** — merged at `be143c545d6268413ec68bece7d29c4be18f84b0`;
3. PR #27 — **add safe category hints** — merged at current `main` `e3d87bdec2880aae2b9ae59a8cde106a9bafb0c8`.

F2 currently provides metadata-only discovery/review infrastructure, immutable reviewed exact-revision history, revision-aware review events, source-presence anomaly holds, bounded current category hints, reproducible compact indexing and runtime-separation tests.

Category hints are current metadata only and are **not revision-pinned evidence**. They cannot authorize hard metadata, authenticity, recommendation, trend, nutrition, runtime behavior or coverage promotion.

F2 newly admitted public recipes remain **0** and runtime activation remains **not authorized**. RecipeSource, NutritionSource, regulatory evidence, ingredient ontology and Brain/KC reasoning remain separate truth lanes.

## Current next public-app work

Two public-app lanes remain independently eligible under existing governance:

1. **Gate F2 corpus breadth continuation** — bounded review/admit/reject work, ontology/hard-metadata completion and measured coverage-gap reduction without automatic admission or runtime activation.
2. **Recipe-unlock nutrition continuation** — target residual composition/form, missing tracked nutrient fields and exact quantity semantics by recipe-level unlock value while preserving the existing source and carbohydrate-semantic firewalls.

Do not invent a new B-number solely for continuity; use the repository's next explicitly established nutrition tranche when one is created.

Brain-derived ranking, eligibility, substitution or nutrition behavior remains separately gated.

## Concurrency / Knowledge Core boundary

This repository-status reconciliation makes no `DataRaul/knowledge-core` write and does not assert a fresh Knowledge Core branch SHA. Brain/Atlas work may advance independently and must be reconciled from GitHub before any cross-repository handover or public behavior change.

## Documentation reconciliation note

Some older current-state labels in `README.md`, `docs/ROADMAP.md`, `docs/GATES.md`, `docs/TESTING.md` and `docs/NUTRITION_COVERAGE_AUDIT.md` still use pre-merge wording such as **B8 candidate** or **F2 branch-local**. Those phrases are stale as current-status labels but may remain valid where they describe historical candidate runs.

Future cleanup must change only present-tense/current-state wording and preserve historical B4-B7 and candidate-run chronology.
