# Nutrition B38 — reviewed miso tablespoon evidence

## Decision

**ADMIT_BOUNDED_HISTORICAL_EXACT_PORTION_EVIDENCE.**

B38 follows B37 by reviewing the remaining high-leverage exact quantity opportunities while the larger missing-density candidates remain held on form identity. The current exact composition for canonical `miso` remains B35 Matvaretabellen evidence; B38 adds only a source-backed tablespoon mass.

## Reviewed source

U.S. Department of Agriculture, **Coding Manual to Handle Data from Nationwide Survey of Individuals, Spring 1977-78**, CFE Admin. Report No. 352, Nationwide Food Consumption Survey 1977-78.

The official USDA table for soybean-derived products lists:

- food description: **Soybean product: Miso**
- 1977 food code: **414-2011**
- common measure: **1 tablespoon**
- edible-portion weight: **17 g**

The same table separately identifies **Miso sauce (Include Ae sauce)** as food code `414-2010`, 1 tablespoon = 15 g. That distinct row is evidence that the generic miso row must not be broadened to sauce or neighboring preparations.

Source: https://www.ars.usda.gov/ARSUserFiles/80400530/pdf/7778/cfe_admin_rep_352.pdf

## Evidence confidence and boundary

The identity and household measure are direct published USDA fields, not inferred arithmetic. Because the measurement comes from a historical 1977-78 survey coding manual rather than a current product survey, B38 preserves **medium** match confidence rather than overstating modern formulation precision.

B38 authorizes only canonical `miso` with normalized authored unit `tbsp`, at **17 g/tbsp**. It does not authorize:

- `miso_sauce`, red/white/named miso subtypes or neighboring fermented-soy identities;
- teaspoon or cup conversion;
- generic tablespoon-volume arithmetic;
- historical USDA nutrient composition;
- any change to B35 Matvaretabellen composition provenance;
- edible-yield or cooked-yield inference;
- runtime network fetch, public corpus authority, billing authority or Knowledge Core writes.

## Priority reconciliation

The larger unresolved missing-density candidates remain correctly held: canonical `tofu_firm` is broader than the currently reviewed coagulant-specific firm-tofu composition records; generic lentil authored states remain mixed; `turkey_mince` remains fat-level sensitive; frozen/pod-state edamame is not equivalent to unspecified authored edamame; crushed canned tomato is not passata; and generic paprika is not smoked paprika.

The three authored `miso` uses are all exactly `1.5 tbsp`, so B38 removes three known unsupported-quantity events without weakening any form rule. Each resolves to **25.5 g**.

Expected authored cumulative state after B38:

- authoritative recipes: **17**
- estimate-preserved recipes: **59**
- `missing_density`: **69**
- `unsupported_quantity_unit`: **11**
- `ambiguous_portion_unit`: **20**
- tracked nutrient gaps: **fibreG 7** only
- mixed incompatible carbohydrate semantics: **16**

No authored recipe is expected to become newly authoritative from B38 alone because the three affected recipes retain independent unresolved blockers, principally `rice_vinegar` and, for one recipe, `tofu_firm`.
