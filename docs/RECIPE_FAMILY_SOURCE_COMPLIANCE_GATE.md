# Recipe Family Synthesis P0 — Source Compliance Gate

Status: **MANDATORY BEFORE AUTOMATED SOURCE ACQUISITION / BOUNDED MANUAL REVIEW ALLOWED**

This gate is a mandatory companion to `docs/RECIPE_FAMILY_SYNTHESIS_P0.md` and `config/recipe_family_synthesis_p0.json`. It implements the legal/source hardening approved for the Carbonara + Hummus prototype after Knowledge Core, Consultant and Project Coach review.

It is an operational compliance control, not a legal opinion. It does not widen production, billing, public recommendation, Nutrition or Step 8G authority.

## Why this gate exists

The P0 architecture intentionally uses source recipes as evidence rather than storing them as canonical recipe objects. That reduces expressive-copying risk, but lawful acquisition still requires source-level controls. Copyright/TDM permission, database extraction rights and website/API contractual terms are separate questions and must not be collapsed into one flag.

## Acquisition modes

Every source use must declare one acquisition mode:

- `MANUAL_REVIEW` — a human reads a lawfully accessible source and records only bounded factual observations needed for synthesis/validation;
- `AUTOMATED_TDM` — software fetches/processes lawfully accessible material for text/data-mining style factual extraction;
- `API_OPEN_DATA` — acquisition through an API/open-data surface under its applicable licence/terms;
- `LICENSED_REUSE` — acquisition under express permission or a licence that covers the intended use.

A source may be usable under one mode and blocked under another.

## Mandatory source record

Before an observation becomes eligible, record:

- publisher, creator where relevant, canonical URL and access timestamp;
- `acquisitionMode`;
- `lawfulAccess`;
- `termsState` and `termsCheckedAt`;
- `tdmReservation`, `tdmReservationCheckedAt` and `tdmReservationEvidence` when automated TDM is proposed;
- `reuseBasis`;
- `databaseExtractionRisk` for the individual use;
- `publisherLedgerKey` and `cumulativeExtractionRisk` across repeated uses from the same publisher/database;
- source role and independence group;
- `sourceExpressionPersisted`;
- `rawExpressionRetention`.

## Terms / contract state

Allowed operational states:

- `ALLOWS_INTENDED_USE`;
- `NO_RELEVANT_RESTRICTION_FOUND`;
- `PROHIBITS_AUTOMATION`;
- `REQUIRES_PERMISSION`;
- `UNKNOWN`.

For `AUTOMATED_TDM`, `UNKNOWN`, `PROHIBITS_AUTOMATION` and `REQUIRES_PERMISSION` fail closed unless a separate permission/licence resolves the restriction.

For `MANUAL_REVIEW`, an unknown automation term does not by itself block bounded factual reading. An explicit restriction applicable to the intended manual use still controls.

## TDM reservation evidence

For `AUTOMATED_TDM`, record how the reservation check was performed and when. At minimum inspect the relevant source/page and available machine-readable reservation surfaces appropriate to the source. A supported TDM reservation mechanism may include a site policy, HTTP/header signal, HTML metadata or a recognized TDM reservation file/policy.

Operational states remain:

- `NONE_FOUND`;
- `EXPRESSLY_RESERVED`;
- `UNKNOWN`;
- `NOT_APPLICABLE`.

`EXPRESSLY_RESERVED` or `UNKNOWN` blocks the general automated-TDM lane. The source may still be usable through permission/licence, an open API, or bounded manual evidence review if otherwise lawful.

## Database / repeated extraction ledger

Database risk is cumulative, not only per recipe. Every source must map to `publisherLedgerKey`, so repeated extraction from one publisher/database can be assessed as a single series.

States:

- `LOW`;
- `MATERIAL`;
- `UNKNOWN`.

`MATERIAL` or `UNKNOWN` blocks automated extraction. Do not evade the gate by splitting one extraction programme into many individually small requests.

The pilot remains deliberately small: one reference source plus usually three to five independent practical observations per family, with information-gain stopping. This is a product-design limit as well as a compliance control.

## Copyright / expression firewall

Persistent P0 recipe-family objects may contain normalized factual observations and provenance needed for verification, such as ingredient identities/roles, quantities, ratios, factual times/temperatures/equipment and normalized technique ordering.

Unless actual reuse rights exist, do not persist source headnotes, distinctive instructions, stories, photographs, video/audio, decorative presentation or other protected expression.

`sourceExpressionPersisted` must be `false` for standard-copyright evidence sources. Temporary fetched text used for permitted automated normalization must use `TEMPORARY_DELETE_AFTER_NORMALIZATION` and must not become a hidden recipe-text corpus.

`REUSABLE_CONTENT` requires a reuse basis that actually permits persistent reuse (`OPEN_LICENCE`, `PERMISSION` or `PUBLIC_DOMAIN`) and compliance with its conditions.

## Deterministic preflight

`scripts/validate-recipe-family-source-compliance.mjs` is the executable fail-closed validator for source-observation packets.

Before the automated Carbonara/Hummus gatherer consumes an observation packet:

```text
source candidate
→ acquisition-mode classification
→ lawful-access check
→ terms/contract check
→ TDM reservation check where applicable
→ individual + cumulative database-extraction check
→ expression-retention check
→ deterministic compliance validator
→ eligible factual observation OR source-level block
```

A failed source blocks that source, not the dish family.

## Consultant + Project Coach implementation challenge

Before expansion beyond Carbonara + Hummus, the prototype review must explicitly answer:

1. Are low-risk factual/manual sources being blocked unnecessarily?
2. Is any automated source proceeding without sufficiently current Terms/TDM evidence?
3. Does cumulative publisher extraction remain genuinely bounded?
4. Is protected expression absent from persistent observation/family objects?
5. Does each material synthesized claim have auditable provenance without turning provenance into a recipe-copy archive?
6. Does more collection still add information, or is direct app authoring + validation cheaper and safer?
7. Has the public/private runtime firewall remained intact?

Consultant owns the scale/trade-off recommendation. Project Coach owns sequencing, terminal evidence and gate discipline. Neither role creates source-use permission or public/runtime authority.

## Re-review triggers

Re-run legal/source review before widening the lane if any of these changes materially:

- acquisition switches from manual to automated;
- a new commercial recipe platform/database becomes a material source;
- source Terms, licence or TDM reservation changes;
- source volume per publisher increases materially;
- raw source text begins to be retained beyond transient normalization;
- the project becomes broadly public, commercial, multi-user or redistribution-oriented;
- the system begins exposing source-derived prose/media rather than project-owned recipe expression.
