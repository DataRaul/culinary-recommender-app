# Recommendation Readiness Audit V1

Date: 2026-09-23

Status: `USABLE_RECOMMENDATION_BASELINE_PASS__FROZEN`

## Purpose

This gate tests whether the already-public 85-recipe runtime is semantically safe and usable as the recommendation baseline before Recipe Family/adaptation work begins. It separately measures the protected `v8018 / 19,268` corpus as a review pool. It does not widen public admission.

The audit carries forward the legal-corpus, normalization and nutrition applicability results. In particular, missing nutrition authority must remain explicit: a recipe may remain recommendation-eligible when the product contract allows unknown nutrition, but unknown protein/fibre values must not be silently converted into numeric zero as recommendation evidence.

## Acceptance model

A usable baseline requires:

- the legal corpus baseline, normalization mapping and nutrition applicability audit to remain passed and frozen;
- exactly 85 public runtime recipes and no new admission;
- every recommendation-eligible public record to retain canonical ingredients, dietary/allergen hard metadata, meal role, time, difficulty, instructions and provenance where external;
- Search-only and reference-only external records to remain fail-closed outside their authorized surfaces;
- recommendation scoring to represent unavailable nutrition signals as unavailable rather than numeric zero;
- the 19,268 protected recipes to remain non-admitted unless the later review path earns all required hard metadata and behavior gates.

The protected corpus can expose review candidates without creating recommendation authority. The current exact-identity-ready count from the nutrition applicability audit is diagnostic only.

## Boundaries

This audit performs no D1 read/write, protected-body export/rewrite, public corpus widening, recommendation behavior change, new admission, Knowledge Core write, YouTube retry, third shard or billing expansion.

## Initial measured result

The audit executed successfully without mutating runtime state.

- public runtime: **85** recipes;
- recommendation-state eligible: **77**;
- Search-only: **2**;
- reference-only incomplete hard metadata: **6**;
- all 77 recommendation-state eligible records have the required hard metadata and remain evaluator-eligible under the permissive audit profile;
- exactly **1** recommendation-eligible record has fully unknown tracked nutrition: `unitools_tortilla_espanola`;
- that record currently receives numeric `0` for both nutrition and protein soft-score components, so missing authority is being used as zero evidence;
- the protected corpus remains correctly held: **112** records have all ingredient identities exact-mapped, **0** have reviewed dietary authority in Mapping V1, **0** are automatically recommendation-ready, and no protected record is admitted.

Therefore the audit itself passes, but the usable recommendation baseline is **not yet earned**. The bounded successor is to repair unknown-nutrition scoring so unavailable nutrition signals remain explicit and non-numeric, then rerun this same audit before advancing to Recipe Family/adaptation.


## Remediation closeout

The bounded readiness repair changed recommendation scoring semantics only for unavailable soft evidence.

- unknown nutrition/protein soft components remain `null`, not numeric zero;
- available positive soft weights are re-normalized across available signals;
- unavailable priority-pack signals earn no bonus and remain explicit;
- hard constraints, recommendation-state governance and source/nutrition firewalls are unchanged;
- public runtime remains **85** recipes with **77** recommendation-state eligible, **2** Search-only and **6** reference-only records;
- the one eligible unknown-nutrition record, `unitools_tortilla_espanola`, now reports missing nutrition/protein explicitly;
- unknown-nutrition safe count is **1 / 1**, zero-coercion count is **0**, and missing-signal disclosure count is **1 / 1**;
- protected v8018 remains **0 automatically recommendation-ready**; its **112** exact-identity-ready records remain review candidates only.

The rerun therefore earns:

`USABLE_RECOMMENDATION_BASELINE_PASS`

Successor:

`RECIPE_FAMILY_AND_ADAPTATION`

The audit rerun itself performs no mutation. The repository change that earned this result is the separately bounded scoring remediation defined in `config/recommendation_readiness_repair_v1.json`.
