# Culinary Brain C4 hard-authority recipe reconciliation V1

Date: **2026-09-27**

Status: **PASS / REMAINING HARD-METADATA REPAIR REQUIRED**

The exact **100** policy-complete C4 candidates were reconciled against the current deterministic recommender's remaining hard-metadata requirements, using the exact pinned v8018 normalization overlay and no new inference.

## Result

- ingredient identity + reviewed dietary/allergen policy ready: **100 / 100**;
- instructions structurally present: **100 / 100**;
- source provenance available: **100 / 100**;
- authoritative meal role: **1 / 100**;
- source difficulty evidence present: **1 / 100**;
- runtime-compatible difficulty authority: **0 / 100**;
- authoritative total time: **1 / 100**;
- ready on every measured hard field except runtime difficulty: **1 / 100**;
- runtime hard-metadata ready: **0 / 100**.

The single near-ready candidate is `unitools-world-recipes-v1_1_0::tortilla-espanola`: reviewed meal role `MAIN`, reviewed total time **50 min**, source difficulty `MEDIUM`, candidate allergen declaration `egg`, and candidate dietary tags `unrestricted` + `vegetarian`. The source difficulty label is not silently relabeled onto the app's 1–4 Beginner/Intermediate/Advanced/Expert scale.

The other **99** candidates are historical Open Recipe Archive records and remain blocked by missing authoritative meal role, total time and difficulty under the current contracts. Their title, collection, cuisine/culture hints and C2 candidate classifications are not used to fill those hard fields.

No protected recipe was admitted; public runtime, recommendation behavior, D1, nutrition authority, Knowledge Core and Barbecue were unchanged.

Terminal: `CULINARY_BRAIN_C4_HARD_AUTHORITY_RECIPE_RECONCILIATION_PASS`.

Next: `C4_REMAINING_HARD_METADATA_REPAIR_DESIGN_V1`.
