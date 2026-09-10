# Nutrition B33 — black-pepper teaspoon form review

## Decision

**HOLD_FORM_AMBIGUITY — no runtime quantity conversion admitted.**

B33 reviewed authoritative USDA household-measure evidence for the two remaining authored `black_pepper` teaspoon blockers after B32 composition admission.

## Source identity

Official source: USDA National Nutrient Database for Standard Reference, Release 28 (2015), Food Group 02, NDB No. `02030`, **Spices, pepper, black**, scientific identity **Piper nigrum**.

The official record publishes three common measures, including two distinct one-teaspoon rows:

- `1 tsp, ground` = **2.3 g**
- `1 tbsp, ground` = **6.9 g**
- `1 tsp, whole` = **2.9 g**

Source report: https://www.ars.usda.gov/ARSUserFiles/80400535/Data/SR/SR28/reports/sr28fg02.pdf

## Repository-form reconciliation

The authored corpus contains exactly two canonical `black_pepper` uses:

- `italian_ricotta_spinach_pasta` — `0.5 tsp`
- `italian_mushroom_risotto` — `0.5 tsp`

Neither ingredient record encodes a `ground` or `whole` preparation/form qualifier. Selecting 2.3 g or 2.9 g would therefore manufacture precision that is absent from the authored recipe contract.

The culinary wording may make ground pepper seem likely, but likely is not sufficient evidence for an authoritative nutrition quantity conversion. B33 therefore records the competing source measures and deliberately leaves the runtime blocker unchanged as `unsupported_quantity_unit`.

## Boundary

B33 is a reviewed negative/hold tranche. It does not import SR28 composition, does not change B32 Matvaretabellen composition authority, does not alias white pepper, does not average the two teaspoon masses, and does not infer ground form from culinary convention.

A future tranche may resolve these blockers only if the authored form is made explicit by authoritative recipe semantics or a source is found whose teaspoon mass applies without a ground/whole distinction.
