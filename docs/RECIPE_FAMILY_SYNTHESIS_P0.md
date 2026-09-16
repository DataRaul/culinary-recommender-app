# Recipe Family Synthesis P0 — Action Contract

Status: **PROPOSED / BOUNDED PILOT / NO PRODUCTION POPULATION AUTHORITY**  
Scope: additive lane beside Step 8G; must not alter current protected population, shard topology, public runtime, billing state or existing RecipeSource behavior.

## Objective

Prove that a small number of legally usable source observations can produce a compact, reliable recipe-family object that is more useful than storing duplicate source recipes.

The pilot optimizes for **recipes that work**, not maximum recipe count.

## Architecture

```text
World Recipe Atlas identity/reference evidence
        +
bounded practical source observations
        ↓
normalization
        ↓
recipe-family synthesis
        ↓
reference profile + observed ranges + variants + disagreements
        ↓
personalization/adaptation rules
        ↓
project-authored recipe projection
        ↓
existing RecipeSource / evaluator / planner gates
```

Knowledge Core remains authoritative for reusable family/variant/transformation/source-governance reasoning. The app remains authoritative for normalized runtime recipe records, ingredient/quantity semantics, allergen/dietary filters, recommendation eligibility and browser behavior.

## Pilot cohort

Initial target: 10 familiar families unless an information-gain review removes/replaces one:

1. carbonara
2. pizza margherita
3. cacio e pepe
4. pesto genovese
5. hummus
6. guacamole
7. tortilla española
8. pancakes
9. basic tomato pasta sauce
10. ragù/bolognese family with careful naming/identity handling

There is no corpus-size growth target.

## Evidence target per family

Default target:

- one strong reference source where one exists;
- three to five independent practical preparations;
- stop early when identity, practical ranges, variants and execution are stable;
- collect more only where material disagreement remains.

Reposts, syndications and obvious derivative copies share an independence group and do not count as independent corroboration.

## Source roles

Each source is assigned exactly one operational role per use:

- `REFERENCE_EVIDENCE`
- `STRUCTURE_EVIDENCE`
- `VARIANT_EVIDENCE`
- `VALIDATION_ONLY`
- `REUSABLE_CONTENT`
- `DO_NOT_USE`

Minimum legal metadata:

- lawful access state;
- TDM reservation state when automated extraction is proposed;
- reuse basis/licence state;
- database extraction risk;
- source provenance.

The pilot must not retain or publish third-party prose, photography, video/audio or decorative expression unless a separate licence expressly permits it.

Standard-copyright recipes may be used only within the bounded evidence/validation role permitted by the governing policy; protected expression is not copied into generated recipe objects.

Do not reconstruct a third-party recipe database through substantial or repeated systematic extraction.

## Observation schema

Each source observation should capture structured facts only:

```json
{
  "observationId": "...",
  "familyCandidate": "carbonara",
  "source": {
    "publisher": "...",
    "creator": "...",
    "url": "...",
    "accessedAt": "...",
    "independenceGroup": "...",
    "role": "STRUCTURE_EVIDENCE",
    "lawfulAccess": "YES",
    "tdmReservation": "NONE_FOUND",
    "reuseBasis": "STANDARD_COPYRIGHT",
    "databaseExtractionRisk": "LOW"
  },
  "servings": 2,
  "ingredients": [
    {
      "ingredientId": "pasta",
      "role": "STRUCTURAL",
      "quantity": 200,
      "unit": "g",
      "form": "dry"
    }
  ],
  "techniques": ["cook_pasta", "render_cured_pork", "off_heat_emulsification"],
  "times": {},
  "temperatures": {},
  "equipment": []
}
```

Unknown values remain unknown. Existing governed unit/form conversions apply; the synthesis lane must not invent new conversions silently.

## Family synthesis schema

Each family output should separate three concepts:

### Reference profile
What strong culinary/reference evidence supports as the conventional/basic identity.

### Observed profile
What the bounded practical sources actually do, including:

- observed min/max;
- robust central estimate where useful;
- recommended working range;
- independent observation count;
- prevalence/frequency;
- evidence ids;
- unresolved conflicts.

### Variant/adaptation profile
Separate:

- `CULINARY_VARIANT` — recurring real-world variation;
- `DIETARY_ADAPTATION`;
- `PREFERENCE_ADAPTATION`;
- `PANTRY_ADAPTATION`;
- `EQUIPMENT_ADAPTATION`;
- `CONTEXT_ADAPTATION`.

Generated adaptations must never be represented as traditional/reference evidence unless separately supported.

## Range rules

Prefer normalized ratios when they better preserve culinary structure, for example:

- grams per 100 g principal ingredient;
- grams per serving;
- baker's percentage;
- egg:pasta;
- cheese:pasta;
- fat:acid;
- liquid:starch.

Store separately:

1. `referenceRange`;
2. `observedRange`;
3. `recommendedRange`.

The observed range must not automatically widen the recommended range.

## Initial descriptive support bands

These are synthesis aids, not authenticity rules:

- `CORE_SIGNAL`: >=70% of eligible independent practical observations;
- `COMMON_SIGNAL`: 40–69%;
- `VARIANT_SIGNAL`: 20–39%;
- `ISOLATED_SIGNAL`: below 20% or one independent observation.

Variant promotion:

- `CANDIDATE_VARIANT`: one coherent observation;
- `OBSERVED_VARIANT`: at least two independent observations;
- `ESTABLISHED_VARIANT`: at least three independent observations or stronger authoritative evidence.

## Identity boundary

Every material modification must resolve to one of:

- `SAME_FAMILY`
- `VARIANT`
- `ADAPTATION`
- `TRANSFORMATION`
- `ADJACENT_FAMILY`
- `UNRESOLVED`

Repeated substitutions cannot retain the original family label indefinitely.

## App-authoring gate

A family becomes `APP_AUTHORING_ELIGIBLE` only when:

- identity/reference structure is coherent;
- required ingredients/roles have usable ranges;
- required technique order is coherent;
- material time/temperature/equipment constraints are resolved;
- allergen/dietary logic remains fail-closed;
- personalization stays inside explicit family/adaptation boundaries;
- provenance can explain each material synthesized claim;
- an original project-authored instruction set can be produced without copying source expression.

This gate authorizes a candidate authored recipe object only. It does not authorize public recommendation activation.

## Validation stage

For each synthesized family, compare the result against one or more independent validation sources where useful.

Validation checks:

- core ingredient-role agreement;
- ratio plausibility;
- timing/temperature plausibility;
- technique-sequence completeness;
- variant recurrence;
- identity drift;
- adaptation feasibility.

A validation source can be `VALIDATION_ONLY`; its text/media need not and should not become runtime content.

## P0 acceptance report

The pilot report must contain, per family:

- reference profile;
- number of eligible independent observations;
- stabilized ranges and ratios;
- common/variant/isolated signals;
- unresolved disagreements;
- validation contradictions;
- legal/source-role summary;
- adaptation boundaries;
- whether `APP_AUTHORING_ELIGIBLE` was earned;
- one example project-authored recipe projection if earned.

Aggregate metrics:

- families attempted / eligible;
- median independent observations required;
- median operator/source-review effort;
- percent of required facts resolved;
- number of useful recurring variants;
- number of legal/source blocks;
- number of validation contradictions;
- whether additional source collection still has positive information gain.

## Stop conditions

Stop the pilot before expansion if:

- the legal/source policy requires source-by-source work disproportionate to culinary value;
- normalized observations cannot produce stable usable ranges;
- generated recipes require copied source expression to remain useful;
- family identity/variant classification is too unstable;
- operator effort per family is too high relative to simply authoring and validating recipes directly.

## Explicit non-goals

P0 does **not** authorize:

- mass crawling;
- millions or hundreds of thousands of recipes;
- bulk acquisition from one commercial source;
- a new production shard;
- public recommendation activation;
- replacement of Step 8G;
- nutrition-authority widening;
- weakening allergen/dietary safety gates;
- billing or paid-data authorization.

## Next implementation step after contract acceptance

Build the smallest deterministic offline prototype that can ingest a handful of structured observations for two pilot families (recommended: carbonara and hummus), synthesize reference/observed/recommended ranges, classify variants, emit provenance, and generate a candidate app-owned recipe projection. Run Consultant/Coach challenge before expanding the cohort.