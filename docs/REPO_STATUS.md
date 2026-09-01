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

Fresh reconciliation at this checkpoint:

- Knowledge Core `main`: `043de7274ee85ce56ef1618f9b1bb31f7a99f6fc`
- active Brain branch: `agent/culinary-nutrition-brain-p0`
- branch head: `81d19c9e84c1f685fb555d0c584c7389fa370df7`
- comparison: **49 ahead / 3 behind**, merge base `0ab4c0d7a1882a494bc92ff0bdd6421764394eca`
- Knowledge Core `main`-only divergence is currently confined to `ops/WORKSTREAM_STATUS.md` and `ops/runner_registry.csv`;
- Knowledge Core open PRs: **none** at the reconciliation checkpoint.

This public-app lane made no Knowledge Core write. Knowledge Core remains read-only here. The active KC Culinary adapter/corpus critic predates public-app PR #27 category-hint semantics and should be reconciled in a separate Brain lane rather than by this repository lane.

## Knowledge Core platform integration — branch-local reconciled

The Culinary Lab has now been aligned to the same generalized Knowledge Core platform-adapter architecture used by the other downstream repositories.

Canonical KC architecture inspected:

- `DataRaul/knowledge-core/docs/KNOWLEDGE_CORE_PLATFORM_ADAPTER_ARCHITECTURE.md` on KC `main`;
- canonical rule: **Expose Knowledge Core as the platform, not each individual capability as a separate repo-local integration.**

Representative downstream patterns inspected:

- Market Lab's thin platform routing boundary and project-local evidence authority;
- the workout recommender's Knowledge Core integration/reasoning-coverage contract and local runtime authority.

Culinary now records the same architecture in:

- `docs/KNOWLEDGE_CORE_INTEGRATION.md`;
- `docs/BRAIN_ADAPTER_CONTRACT.md`;
- `docs/ARCHITECTURE.md`;
- `docs/DEFERRED_CAPABILITIES.md`.

The Knowledge Core specialist `adapters/repo_culinary_recommender_app.md` remains valid as a specialist contract but is explicitly consumed **through** the generalized Knowledge Core platform boundary. It does not create a second integration model.

The integration remains routed/advisory:

- Knowledge Core owns reusable culinary/nutrition reasoning and Brain/Atlas methodology;
- Culinary Lab owns current recipes, evidence, runtime state, tests and public admission/behavior;
- private Knowledge Core is never a browser/runtime dependency;
- behavior-driving Brain exports must be narrow, versioned, source-safe, exact-pin-bound and separately tested/gated;
- public-safe Lab blocker/corpus metadata may travel back to Knowledge Core only as offline research/review input, not automatic canonical promotion.

No ranking, eligibility, substitution, nutrition or recipe-admission behavior is activated by this architecture reconciliation.

## Documentation reconciliation — branch-local complete

Current-state semantics have now been reconciled branch-locally in:

- `README.md` — B8 is **COMPLETE**; first authoritative authored recipe and 1/76 state are explicit; Gate F2 is **CONTROL PLANE MERGED / RUNTIME GATED**;
- `docs/ROADMAP.md` — present-tense B8/F2 state and current KC branch facts are reconciled while historical gate chronology is preserved;
- `docs/GATES.md` — terminal B8 state and merged-but-runtime-gated F2 control-plane state are explicit;
- `docs/RECIPE_CORPUS_GATE_F2_REVIEW_QUEUE.md` — the old branch-local source-presence wording is reconciled to the PR #24/#25/#27 merged control-plane state while preserving the fail-closed queue semantics;
- `docs/BRAIN_ADAPTER_CONTRACT.md` and `docs/ARCHITECTURE.md` — Culinary's Brain relationship is routed through the generalized Knowledge Core platform boundary rather than a bespoke integration;
- `docs/DEFERRED_CAPABILITIES.md` — private Brain/Atlas maturity is distinguished from still-gated public behavior.

`docs/TESTING.md` retains **Nutrition B8 candidate checks** because that section describes the historical validation phase rather than present repository status. `docs/NUTRITION_COVERAGE_AUDIT.md` likewise retains its **measured candidate** section and candidate-run metrics while already exposing the post-B8 current blocker interpretation. Those historical labels are intentional and should not be rewritten as though the later merge state existed during the candidate measurement.

The branch is intentionally not opened as a PR because opening a PR would trigger GitHub Actions. No Actions were spent by this branch-local documentation/integration reconciliation. The next cost/human gate for this branch is explicit approval to open the bounded PR and run its validation.
