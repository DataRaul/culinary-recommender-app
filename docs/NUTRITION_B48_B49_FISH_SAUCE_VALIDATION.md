# B48 + B49 validation contract

This tranche is valid only if CI confirms all of the following simultaneously:

- B48 selects MEXT food `17107` only for canonical `fish_sauce` composition.
- B49 selects USDA SR28 NDB `06179` only for canonical `fish_sauce|tbsp` at 18 g/tbsp.
- B49 never supplies nutrient composition and B48 never supplies household mass.
- the sole authored fish-sauce use is no longer skipped for `fish_sauce`;
- its independent `lime|piece` ambiguity remains fail-closed;
- cumulative authored authority remains 19/76;
- cumulative blocker counts are `missing_density=60`, `unsupported_quantity_unit=6`, `ambiguous_portion_unit=20`;
- fibre gaps remain 7 and mixed incompatible carbohydrate-semantic events remain 16;
- the full public validation and browser suite remain green;
- the protected Step 7E audit remains green because `THIRD_PARTY_NOTICES.md` changed.

No merge is authorized by this document itself; CI and a fresh-main reconciliation are the merge gate.
