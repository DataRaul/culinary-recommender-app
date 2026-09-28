# Culinary Brain C4 — next repair cohort design V1

Status: **PASS / UNITOOLS HIGH-LEVERAGE ALIAS REVIEW READY**

Terminal: `CULINARY_BRAIN_C4_NEXT_REPAIR_COHORT_DESIGN_PASS__UNITOOLS_ALIAS_REVIEW_READY`

After duplicate-safe handling of the first C4 hard-metadata-ready identity, no distinct protected recipe has yet entered recommendation runtime. The next repair therefore targets measured unlock leverage rather than Open Recipe Archive records that simultaneously lack meal-role, time and difficulty authority.

The exact pinned **501-recipe UniTools 1.1.0** cohort was reconstructed from commit `1d09e9548d957dd0375301146a86dddf5e269c1b`. All **501/501** records have explicit prep+ cook time, positive servings, difficulty and category metadata. Ingredient identity remains the dominant blocker: **5,404** ingredient occurrences contain **2,524 resolved**, **2,807 unresolved** and **73 conflicting** occurrences, with only **1/501** recipes currently fully identity-mapped.

The ranked alias-repair queue found only two top-25 unresolved names that individually stand between a recipe and complete ingredient identity: **Soft white cheese** (2 occurrences; 1 single-alias recipe potentially unlocked) and **Tapioca starch** (1 occurrence; 1 single-alias recipe potentially unlocked). High-frequency unresolved strings such as **Salt and pepper** and **Flour** affect many occurrences but do not individually unlock a recipe in the current census.

Conflicts remain excluded and no alias mapping is authorized by this design run. No D1/runtime/recommendation/public/Knowledge Core/Barbecue state changed.

Evidence: `data/generated/culinary-brain-c4-next-repair-cohort-design-summary-v1.json`.

Next: `C4_UNITOOLS_HIGH_LEVERAGE_INGREDIENT_ALIAS_REVIEW_V1`.
