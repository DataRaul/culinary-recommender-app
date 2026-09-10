# Nutrition B35 — exact miso composition

## Decision

**ADMIT_BOUNDED_EXACT_COMPOSITION.**

B35 returns to the missing-density lane after B34 and admits the highest-leverage currently unresolved candidate for which a reviewed exact food-form match is available without weakening identity rules.

## Priority reconciliation

The earlier B8 target inventory recorded six tofu_firm density blockers, five generic-lentil blockers, four turkey_mince blockers, and three each for miso, rice_vinegar and edamame. The higher-count candidates remain unsuitable for admission under the current evidence boundary: the reviewed tofu source is generic rather than explicitly firm; authored generic lentil states are mixed; and turkey mince requires an exact raw-ground identity with an admissible fat qualification. Edamame also remains state-sensitive, and no exact rice-vinegar row was identified in the reviewed Matvaretabellen path.

Miso therefore becomes the highest-leverage exact candidate currently available from this reviewed path: three authored recipes use canonical `miso`, and the source identity matches the ontology's generic `miso paste` identity.

## Exact source

Norwegian Food Composition Table 2026, Food ID `10.138`, **Miso**.

The source classifies the food as a soybean condiment with semisolid smooth consistency, salted and preserved by fermentation. This is an exact match to canonical `miso`, whose ontology name is `miso paste` and alias is `miso`.

B35 composition per 100 g:

- energy: **182 kcal** (758 kJ)
- protein: **17.2 g**, source `500a`
- available carbohydrate: **1.5 g**, source `MI0181`
- fat: **10.5 g**, source `500a`
- dietary fibre: **7.0 g**, source `500a`

## Runtime boundary

B35 is a standalone post-B25 composition tranche in `nutrition-source-policy-runtime.js`. Its canonical ingredient ID must remain disjoint from the frozen baseline and every earlier standalone post-B25 tranche.

Available-carbohydrate semantics remain Matvaretabellen available carbohydrate and continue to participate in the existing incompatibility firewall against USDA carbohydrate-by-difference.

B35 grants no tablespoon mass, other household-unit conversion, edible-yield conversion, cooked-yield conversion, neighboring fermented-soy identity, named miso subtype, runtime fetch authority, public corpus authority, billing authority, or Knowledge Core write.

## Expected corpus effect

There are three authored `miso` uses and all are declared as `1.5 tbsp`. B35 should therefore move exactly three blocker events from `missing_density` to `unsupported_quantity_unit` while leaving those recipes estimate-preserved. Expected authored cumulative blocker counts become:

- `ambiguous_portion_unit`: **20**
- `missing_density`: **71**
- `unsupported_quantity_unit`: **14**

Authoritative recipe count remains **17**. The seven tracked fibre gaps remain open and unchanged.
