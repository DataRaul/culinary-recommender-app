# Culinary Brain C4 — tapioca identity and hard-policy review V1

Status: **PASS / CANDIDATE ONLY / RECONCILIATION READY**

The exact pinned `pao-de-queijo` source has one unresolved ingredient, explicitly named **Tapioca starch**. A proposed `tapioca_starch` identity is confined to this exact recipe and source pin; it is not in the global catalog or activated as an overlay. The other seven source ingredient names resolve to the existing canonical identities `eggs`, `milk`, `mozzarella`, `neutral_oil`, `parmesan`, `salt`, and `water`.

The existing catalog flags egg and milk as positive allergen signals. The candidate dietary scope is **unrestricted only**. Source labels “vegetarian” and “gluten-free” do not become hard claims: parmesan rennet is not established, and no manufacturer or cross-contact guarantee exists. The candidate coverage is limited to the app's current mapped allergen profile; it is not a global allergen-free declaration. EU Regulation 1169/2011 Annex II lists eggs and milk as allergen categories; [official source](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32011R1169).

This review creates **zero recommendation-ready recipes**. It changes no public runtime, global catalog, D1, nutrition authority, Knowledge Core, Barbecue, or protected body. The next gate must reconcile the exact candidate against meal role, time, difficulty, instructions, provenance, duplicate identity and hard-filter semantics before any admission.

Terminal: `CULINARY_BRAIN_C4_TAPIOCA_IDENTITY_AND_HARD_POLICY_REVIEW_PASS__RECONCILIATION_READY`.

Evidence: `data/generated/culinary-brain-c4-tapioca-identity-review-summary-v1.json`.

Next: `C4_TAPIOCA_RECIPE_HARD_POLICY_AND_METADATA_RECONCILIATION_V1`.
