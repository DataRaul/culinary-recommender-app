# V21 Shadow Scorer Evidence Enrichment V1

Date: 2026-10-04

## Purpose

The preceding signal-coverage adapter raised the frozen 500-recipe shadow cohort from 36.1345% to 43.6975% positive scorer-weight coverage by translating source-backed difficulty. This gate asks the next narrower question: does the current protected evidence base contain another scorer-native signal that can be populated without inventing facts or silently changing scorer semantics?

## Evidence rule

Unknown scorer inputs stay unknown. The gate does not use neutral/default values to manufacture coverage.

Specifically:

- nutrition/protein require authoritative, joinable recipe-level nutrition values;
- budget cannot be inferred from ingredient count, cuisine, country, age or title;
- meal-prep suitability cannot be inferred from total time alone;
- novelty cannot be inferred from title uniqueness or corpus marginality;
- already-used total-time and difficulty evidence cannot be relabeled into a second signal to double-count the same fact.

This is consistent with the repository/Knowledge Core evidence boundary: inference and scorer hypotheses must remain explicit, and missing precision is not replaced by convenient defaults.

## Measured result

No additional safe scorer-native signal is currently available for the frozen cohort:

- protected authoritative current-engine recipe nutrition: **0**;
- therefore authoritative protein values available for this gate: **0**;
- no authoritative normalized protected dimension exists for 'costTier';
- no authoritative normalized protected dimension exists for 'mealPrepSuitability';
- no authoritative normalized protected dimension exists for scorer 'novelty'.

The package therefore deliberately applies **no enrichment**. Coverage remains **43.6975%**, leaving **6.3025 percentage points** to the 50% live-readiness floor.

This is a successful fail-closed result, not a quality failure: the evidence audit completed and prevented fabricated scorer inputs.

## Boundaries

No D1 read/write, protected-body rewrite, public-runtime widening, recommendation admission, scorer behavior change, candidate-classification promotion, dietary/allergen promotion, Knowledge Core write, paid model/API, third shard or Barbecue mutation is authorized.

Terminal:

V21_SHADOW_SCORER_EVIDENCE_ENRICHMENT_PASS__NO_ADDITIONAL_SAFE_SCORER_SIGNAL__SCORER_POLICY_REVIEW_NEXT

Next gate:

V21_SHADOW_SPARSE_EVIDENCE_SCORER_POLICY_REVIEW_V1

The next gate must review how the production scorer should behave when valid recipes have structurally sparse soft evidence. It must not lower hard-safety requirements or treat unknown nutrition/cost/convenience/novelty as known.
