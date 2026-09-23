# Recipe Family Synthesis P0 — UI Legal Conformance Gate

Status: **COMPLETE / PASS**

This gate is intentionally downstream of source-rights review. It does not decide whether a source may be acquired or used; that is owned by the source-compliance gate. It proves that the Culinary UI and public/reusable admission path correctly implement the obligations already encoded on real recipe/source objects.

## 2026-09-24 real-candidate execution

The trigger is now earned by the first real Recipe Family candidate: `recipe_family_p0_hummus_candidate_v1`. The bounded P0 prototype and Consultant/Project Coach review passed before this gate began.

The implementation uses the real Hummus candidate plus its five normalized provenance observations. It renders five required attribution notices across four distinct publisher/source classes (Fandom Recipes Wiki, ForkRecipe, Recidemia and Wikibooks), while the candidate recipe instructions remain project-authored expression derived from normalized factual evidence.

Deterministic and browser acceptance cover the required negative cases. `REQUIRED + UNSATISFIABLE` and `UNKNOWN` states produce no public/reusable render; protected-expression sentinel fields cannot leak through the renderer; missing required external attribution fields fail closed; and private/gated context cannot bypass the admission rule. The existing Wikibooks browser path is routed through the same generic provenance renderer so the gate does not assume that Wikibooks-specific rendering proves support for other source classes.

Committed evidence: `data/generated/recipe-family-ui-legal-conformance-v1.json`.

Terminal: `RECIPE_FAMILY_UI_LEGAL_CONFORMANCE_PASS` (PR #276 merged at `e92d5f13f08790c7c013701618bdcd8fd7ba35af` after green full validation/browser acceptance, Step 1 benchmark and Step 7A no-billing proof).

This PASS does **not** admit the Hummus candidate or any new Recipe Family object to the public runtime. The candidate retains `activationAuthority=NONE`, the public runtime remains 85 recipes, and the next earned work is `RECIPE_FAMILY_10_FAMILY_BOUNDED_EXPANSION_NONPUBLIC`.

## Why this is a separate gate

A source can pass acquisition/use review while the product still implements its obligations incorrectly. Examples include omitting required attribution, showing an incomplete licence/basis notice, failing to identify a required transformation, or accidentally rendering protected evidence-source expression.

Therefore the project uses two distinct compliance layers:

```text
source/use legality
→ recipe-family synthesis + app-authoring candidate
→ UI legal-conformance test against encoded object obligations
→ only then public/reusable admission
```

The second test is not a new legal opinion. It is implementation conformance against the first test's encoded result.

## Trigger

Do **not** spend effort building generic legal UI fixtures before meaningful candidate objects exist.

The gate becomes due when the first real `APP_AUTHORING_ELIGIBLE` candidate exists with classified source rights/provenance and public-attribution state. It must run again when a materially new source/licence/permission class introduces obligations not already covered by the tested renderer.

## Authoritative test objects

Use the real candidate objects produced by the pipeline wherever possible, including:

- candidate app-owned recipe projection;
- source-compliance report;
- provenance object;
- attribution requirements;
- `publicAttributionRequirement`;
- `publicAttributionState`;
- `reuseBasis`.

Add synthetic **negative** fixtures only to prove fail-closed behavior. Negative fixtures must not invent new legal assumptions; they exercise states already permitted by the encoded contract.

## Required cases

### A — no public attribution required

Input state:

`publicAttributionRequirement=NOT_REQUIRED` and `publicAttributionState=NOT_APPLICABLE`.

Expected result: public rendering may proceed without inventing a public source notice, while internal provenance remains preserved.

### B — attribution required and ready

Input state:

`publicAttributionRequirement=REQUIRED` and `publicAttributionState=READY`.

Expected result: the rendered recipe exposes all fields required by the encoded basis, including as applicable:

- attribution/source label;
- source link where required or part of the basis;
- licence or permission/basis identification;
- modification/transformation notice where required.

### C — attribution required but unsatisfiable

Input state:

`publicAttributionRequirement=REQUIRED` and `publicAttributionState=UNSATISFIABLE`.

Expected result: fail closed. The object must not enter the public/reusable recipe path.

### D — attribution state unknown

Input state includes an `UNKNOWN` attribution requirement/state.

Expected result: fail closed until classified.

## Required negative assertions

Browser and renderer tests must also prove:

- protected third-party expression is not leaked from evidence/provenance objects;
- a source class is not assumed supported merely because the existing Wikibooks-specific renderer works;
- missing required fields cannot degrade silently into an incomplete public notice;
- private/gated runtime access does not bypass the public-attribution rule for a public/reusable recipe object.

## Test layers

The gate should be implemented through:

1. object/schema validation;
2. attribution-renderer unit tests;
3. browser acceptance using real candidate objects;
4. negative browser fixtures for `UNSATISFIABLE` / `UNKNOWN` states;
5. a public-runtime fail-closed assertion.

The expected terminal states are:

- `RECIPE_FAMILY_UI_LEGAL_CONFORMANCE_PASS`;
- `RECIPE_FAMILY_UI_LEGAL_CONFORMANCE_FAIL_CLOSED`.

## Relationship to Consultant and Project Coach

Consultant challenges whether new source classes or UI obligations are adding disproportionate complexity relative to product value and whether a materially different source class warrants renewed legal/source review.

Project Coach verifies the sequence and evidence:

```text
source compliance
→ synthesis
→ app-authoring candidate
→ UI legal-conformance tests
→ explicit PASS
→ public/reusable admission can be considered
```

Neither role may convert an unknown or failed legal/attribution state into approval.

## Legal re-review boundary

Do not re-litigate the law merely because the UI test is running. Re-open legal/source review only when the implementation exposes a material mismatch, such as:

- source Terms/licence changed;
- a new obligation cannot be represented by the current object model;
- a materially different source class requires different display behavior;
- the product's public/commercial use scope materially widens.
