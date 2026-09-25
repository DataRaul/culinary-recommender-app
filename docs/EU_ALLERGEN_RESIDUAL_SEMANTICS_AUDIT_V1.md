# EU Allergen Residual Semantics Audit V1

State: **PASS — ZERO-RUNTIME AUDIT / NO RUNTIME CHANGE EARNED**  
Lane: **Lane 3 — EU regulatory truth**  
Date: **2026-09-25**

## Scope

This gate deliberately does **not** activate another Annex II allergen. It audits only the two aggregate allergen semantics already present in the app:

- `tree_nut`;
- `gluten`.

The controlling reference is Regulation (EU) No 1169/2011, Annex II. EUR-Lex was reverified on 2026-09-25 and identifies the current consolidated version as 2025-04-01.

## Tree-nut result

Annex II names eight nut species: almond, hazelnut, walnut, cashew, pecan, Brazil nut, pistachio and macadamia/Queensland nut.

The current canonical ontology contains exactly three of those species:

- `almonds`;
- `walnuts`;
- `cashews`.

All three already carry `tree_nut`. The five other named species are not canonical ingredients, so this audit does not invent new ingredient identities or UI vocabulary. `peanuts` correctly remain under the separate `peanut` token, and canonical coconut ingredients are not promoted into the Annex II nut category.

**Finding: no current tree-nut runtime correction is earned.**

## Gluten result

Annex II covers wheat (including spelt and khorasan wheat), rye, barley and oats, plus derived products, subject to listed exceptions.

Current exact canonical cereal identities include `barley` and `oats`; both carry `gluten`. Current wheat-derived canonical products/families include couscous, bulgur, pasta, wholewheat pasta, orzo, wheat noodles, bread and wheat tortilla; those items also carry `gluten`.

The current ontology has no exact canonical identity for wheat, rye, spelt or khorasan. It also has no exact canonical identity for the Annex II cereal exceptions audited here: wheat glucose syrup/dextrose, wheat maltodextrin, barley glucose syrup, or cereals used for alcoholic distillates.

**Finding: no current gluten runtime correction is earned.** The aggregate token remains conservative for the app's presently known identities. This audit does not claim that aggregate `gluten` models every legal exception or future ingredient identity.

## Deferred categories remain deferred

No change is made to:

- mustard;
- lupin;
- molluscs;
- sulphur dioxide/sulphites.

Mustard, lupin and molluscs still lack exact canonical identities. Sulphites still require threshold-aware quantity/concentration evidence semantics.

## Boundary

This is a research/audit gate only:

- 0 ingredient-ontology changes;
- 0 profile-vocabulary changes;
- 0 recipe-allergen metadata changes;
- 0 recommendation/ranking changes;
- 0 protected D1 reads/writes;
- 0 protected recipe-body access;
- 0 NutritionSource authority changes;
- 0 Knowledge Core writes;
- 0 Barbecue mutations;
- 0 paid infrastructure/API changes.

Terminal: **EU_ALLERGEN_RESIDUAL_SEMANTICS_AUDIT_V1_PASS__NO_RUNTIME_CHANGE_EARNED**.\n\nValidation: Validate public V0 **#1128 / 36174477005 SUCCESS**, including static/unit validation and full Chromium browser acceptance.

No successor activation is implied. A future Lane 3 gate should be triggered by a new canonical ontology need or by a separately designed threshold-aware evidence schema.
