# V21 Shadow Signal Coverage Adapter V1

Date: 2026-10-03

## Purpose

The previous meal-slot gate showed that the exact 500-recipe shadow cohort has enough volume, safety isolation, determinism and planner diversity, but only 36.1345% of the production scorer's positive weight is backed by finite evidence.

This gate tests the smallest evidence-preserving adapter that can improve that coverage without fabricating nutrition, price, novelty, meal-prep or dietary facts.

## Adapter

The only newly populated scoring input is **difficulty**, and only when the normalization overlay already holds an `EXACT_SOURCE_NORMALIZATION` or `REVIEWED_MAPPING` difficulty value.

The source scale remains preserved in provenance. For the shadow production-scorer compatibility probe only:

- numeric 1–5 maps to runtime 1,2,3,4,4;
- EASY maps to 1;
- MEDIUM maps to 2;
- HARD maps to 4.

This cross-scale mapping is a product-scoring hypothesis, not a source fact and not live authority.

No other missing scorer field may be populated by this adapter.

## Acceptance

The gate must preserve the exact frozen 500 cohort, preserve meal-slot eligibility counts, keep normal-mode and restricted-profile leakage at zero, improve top-20 scorer evidence coverage by at least 5 percentage points for every slot, and preserve deterministic complete seven-slot planners.

The **50%** live-readiness evidence floor from the preceding gate is unchanged. Improving coverage does not by itself authorize live recommendation exposure.

## Boundaries

No D1 reads/writes, protected-body rewrite, public-runtime widening, recommendation admission, live difficulty translation, live meal-role translation, candidate classification promotion, dietary/allergen promotion, Knowledge Core write, paid model/API, third shard, or Barbecue mutation is authorized.

## Measured result

The gate passed as an offline adapter evaluation, but live recommendation quality is still not earned.

- source-backed difficulty was available and adapted for **500/500** recipes;
- source scales: **422** label-based EASY/MEDIUM/HARD and **78** numeric 1–5;
- top-20 positive scorer-weight coverage increased from **36.1345%** to **43.6975%** for breakfast, lunch, dinner and snack;
- coverage gain: **+7.563 percentage points**;
- meal-slot eligible counts remained unchanged: **22 breakfast, 207 lunch, 207 dinner, 42 snack**;
- normal-mode leakage remained **0**;
- vegetarian and egg-allergy shadow eligibility remained **0**;
- rankings and seven-slot planners remained deterministic and complete;
- score differentiation improved (for example lunch/dinner unique scores increased from **28** to **64**).

The adapter therefore proves that existing source difficulty can safely improve shadow ranking information without inventing unrelated facts. It still misses the unchanged **50%** live-readiness floor, so live exposure remains blocked.

Terminal:

`V21_SHADOW_SIGNAL_COVERAGE_ADAPTER_PASS__LIVE_QUALITY_STILL_HELD__EVIDENCE_ENRICHMENT_NEXT`

Next gate:

`V21_SHADOW_SCORER_EVIDENCE_ENRICHMENT_V1`

Canonical evidence: `data/generated/protected-corpus-shadow-signal-coverage-adapter-v1.json`.
