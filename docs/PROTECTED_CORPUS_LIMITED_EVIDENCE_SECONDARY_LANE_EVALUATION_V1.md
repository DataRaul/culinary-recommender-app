# V21 Limited-Evidence Secondary Recommendation Lane Evaluation V1

Date: 2026-10-04

## Result

The proposed limited-metadata secondary recommendation lane passes its bounded offline evaluation.

The evaluation reuses the already-frozen, already-reproduced V21 evidence instead of reconstructing the full 19,268-recipe corpus again. That is sufficient because the candidate set, ranking behavior, signal coverage, planner behavior, meal-role semantics and restricted-profile isolation were already measured deterministically on the exact same 500-recipe cohort.

## Candidate volume

The lane has **271 unique meal-targetable candidates**:

- breakfast: 22;
- lunch: 207;
- dinner: 207;
- snack: 42.

The 207 MAIN candidates are eligible for both lunch and dinner under the explicit product-slot hypothesis, so meal-type counts overlap. The remaining **229** frozen-cohort recipes remain held for meal-targeted recommendation.

## Ranking quality inside the secondary lane

After source-backed difficulty adaptation:

- average positive scorer-weight coverage remains **43.6975%**;
- breakfast has 15 unique scores across 22 eligible candidates;
- lunch has 64 unique scores across 207 eligible candidates;
- dinner has 64 unique scores across 207 eligible candidates;
- snack has 28 unique scores across 42 eligible candidates;
- ranking digests are deterministic for every meal type.

This is enough differentiation for a separately labeled limited-evidence lane. It is **not** enough to let these recipes displace the primary validated lane, whose 50% coverage floor remains unchanged.

## Planner quality

Every meal-type planner remains complete and deterministic with seven unique recipes. Pairwise ingredient overlap remains far below the existing 0.85 maximum:

- breakfast maximum Jaccard: 0.272727;
- lunch: 0.2;
- dinner: 0.2;
- snack: 0.166667.

## Required disclosure

The secondary lane must disclose that the following soft dimensions are unknown where not evidenced:

- nutrition;
- protein;
- budget;
- meal-prep suitability;
- novelty.

Unknown values may not be displayed or implied as known.

## Hard boundaries

Normal recommendation mode still admits zero shadow candidates. Vegetarian, allergen and ingredient-exclusion profiles remain fail-closed. Sparse candidates may not displace the 86 validated primary recipes.

This evaluation does not implement or activate the lane.

Terminal:

`V21_LIMITED_EVIDENCE_SECONDARY_RECOMMENDATION_LANE_EVALUATION_PASS__RUNTIME_CONTRACT_NEXT`

Next gate:

`V21_LIMITED_EVIDENCE_SECONDARY_LANE_RUNTIME_CONTRACT_V1`
