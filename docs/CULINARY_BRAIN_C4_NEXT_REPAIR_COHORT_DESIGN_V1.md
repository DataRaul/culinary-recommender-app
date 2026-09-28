# Culinary Brain C4 — next repair cohort design V1

Status: **MEASUREMENT GATE / UNIT OOLS INGREDIENT-IDENTITY LEVERAGE**

After duplicate-safe handling of the first C4 hard-metadata-ready identity, no distinct protected recipe has yet entered recommendation runtime. The next repair should therefore maximize measured unlock leverage rather than continue repairing Open Recipe Archive records that simultaneously lack meal-role, time and difficulty authority.

The selected measurement cohort is the exact pinned **501-recipe UniTools 1.1.0** source. This cohort already carries structured time, difficulty and category fields; its dominant blocker is ingredient identity. The historical Step 8E census found only one recipe with every ingredient mapped, leaving 500 stored-only records.

This gate recomputes that census from the immutable source pin and ranks unresolved ingredient-name candidates by how many recipes have exactly that one unresolved alias as their remaining identity blocker, then by occurrence frequency. Conflicts are excluded from promotion candidates.

No alias mapping is authorized by this design run. The output is a review queue for `C4_UNITOOLS_HIGH_LEVERAGE_INGREDIENT_ALIAS_REVIEW_V1`.
