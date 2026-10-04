# V21 Shadow Sparse-Evidence Scorer Policy Review V1

Date: 2026-10-04

## Decision

Do **not** lower the 50% evidence-coverage floor for the primary validated recommendation lane, and do **not** fill missing scorer signals with defaults.

Instead, advance a separately evaluated **limited-metadata secondary recommendation lane** for the exact **271 meal-targetable** recipes already proven inside the frozen 500-recipe cohort.

The existing **86 validated runtime recipes remain the primary lane** and cannot be displaced by sparse candidates under this policy.

## Why this is the next safe route

The current sparse cohort has passed deterministic ranking, planner completion, meal-slot semantics, and unrestricted-profile mode isolation. Source-backed difficulty improved positive scorer-weight coverage to **43.6975%**, but there is no current authoritative recipe-level evidence to fill nutrition/protein, budget, meal-prep suitability, or scorer novelty.

Knowledge Core's recommendation-calibration rule says to separate hard constraints, evidence confidence and soft objectives; preserve unresolved uncertainty; and avoid fabricating precision. The exact decision basis is pinned to Knowledge Core commit `1f164eb32171238caaf7798d00412725fde4a54a`, object `recommendation_calibration_and_negative_capability.md`, blob `1030717c368c8049772fde6475644e1dfdeac7f7`.

A segregated lane follows that rule better than either extreme:

- it does not pretend sparse recipes are equivalent to fully validated recipes;
- it does not discard useful recipes merely because soft metadata is incomplete;
- it keeps hard safety fail-closed;
- it makes uncertainty visible;
- it lets sparse recipes compete only with other sparse recipes until stronger evidence is earned.

## Candidate lane scope

The next evaluation may use the exact **271** meal-targetable candidates:

- 22 breakfast;
- 207 lunch;
- 207 dinner;
- 42 snack;
- 207 MAIN recipes account for both lunch and dinner, so the unique candidate count remains 271.

The remaining **229** recipes stay held for meal-targeted recommendation because they are DESSERT, BEVERAGE, SIDE, or have unknown meal role under the current slot vocabulary.

The secondary lane must not make claims based on unknown nutrition, protein, budget, meal-prep suitability, novelty, dietary suitability, or allergen-free status. MAIN-to-lunch/dinner remains an explicit product-slot hypothesis rather than a source fact.

## Safety and ranking boundary

Initial evaluation remains unavailable to vegetarian/vegan, allergen, ingredient-exclusion, or other restricted profiles. Those profiles remain fail-closed until their hard metadata authority is separately earned.

The primary 86-recipe lane retains its existing semantics and the **50%** coverage floor. Sparse recipes may not displace primary validated recipes.

The secondary lane may rank sparse candidates against one another using supported evidence only, with a required limited-metadata disclosure. This review does **not** authorize live implementation.

Terminal:

`V21_SHADOW_SPARSE_EVIDENCE_SCORER_POLICY_REVIEW_PASS__SEGREGATED_SECONDARY_LANE_EVALUATION_READY`

Next gate:

`V21_LIMITED_EVIDENCE_SECONDARY_RECOMMENDATION_LANE_EVALUATION_V1`
