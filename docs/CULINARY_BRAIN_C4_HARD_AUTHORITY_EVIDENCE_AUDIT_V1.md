# Culinary Brain C4 Hard-Authority Evidence Audit V1

Date: **2026-09-27**

Status: **PASS / POLICY REVIEW READY**

This is the first substage of the C4 hard-authority repair tranche. It operates only on the exact 112-recipe identity-ready cohort frozen by the real-v8018 failure matrix.

The audit reconstructs the exact pinned source snapshots, retains the exact canonical ingredient identity rows, and measures positive allergen signals already encoded in the reviewed canonical ingredient catalog.

Important safety semantics:
- a positive catalog allergen signal is candidate evidence for a later reviewed declaration;
- an empty allergen array is **not** proof that a recipe is allergen-free;
- ingredient family, title, cuisine or historical source wording is **not** dietary authority;
- no vegetarian/vegan or allergen-free status is inferred;
- this audit earns **zero** recommendation or hard-safety authority.

The full recipe-level ingredient and allergen candidate rows remain CI artifacts. The compact summary may be committed after reproducibility is proven.

Next gate: `C4_HARD_AUTHORITY_POLICY_REVIEW_V1`.


## Terminal result

Exact frozen-112 reconstruction passed at `CULINARY_BRAIN_C4_HARD_AUTHORITY_EVIDENCE_AUDIT_PASS__POLICY_REVIEW_READY`.

- frozen recipes: **112**;
- distinct canonical ingredients: **49**;
- recipes with at least one positive current-catalog allergen signal: **89**;
- recipes with no positive current-catalog allergen signal: **23** (this is not an allergen-free claim);
- signal counts: milk 59, egg 38, gluten 12, fish 4, crustacean 3, tree_nut 2;
- hard authority earned: **0**.

Catalog digest: `867b5161280acc7afa43676ff22916c5b9e45df559511abd5dde2d6565cfd6fd`.
Committed summary: `data/generated/culinary-brain-c4-hard-authority-evidence-summary-v1.json`.

The next gate is a reviewed ingredient-policy pass. It must use explicit ingredient-level decisions rather than family/title inference, preserve the product contract that declared-allergen filtering is not a cross-contact guarantee, and respect the EU residual semantics boundary for currently unsupported/threshold-dependent allergen categories.
