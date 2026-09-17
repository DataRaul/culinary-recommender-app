# Recipe Family Synthesis P0 — Source Compliance Gate

Status: **MANDATORY BEFORE AUTOMATED SOURCE ACQUISITION / BOUNDED MANUAL REVIEW ALLOWED**

This gate is a mandatory companion to `docs/RECIPE_FAMILY_SYNTHESIS_P0.md`, `docs/RECIPE_FAMILY_PREDEVELOPMENT_GOVERNANCE_CLOSEOUT.md` and `config/recipe_family_synthesis_p0.json`. It implements the legal/source hardening approved for the Carbonara + Hummus prototype after Knowledge Core, Consultant and Project Coach review.

It is an operational compliance control, not a legal opinion. It does not widen production, billing, public recommendation, Nutrition or Step 8G authority.

## Why this gate exists

The P0 architecture intentionally uses source recipes as evidence rather than storing them as canonical recipe objects. That reduces expressive-copying risk, but lawful acquisition still requires source-level controls. Copyright/TDM permission, database extraction rights, attribution/disclosure duties and website/API contractual terms are separate questions and must not be collapsed into one flag.

## Explicit acquisition policy — no generic scraping/crawling

P0 does **not** authorize generic web scraping or crawling of third-party recipe sites.

Do not:

- bypass paywalls, authentication, access controls or technical restrictions;
- evade applicable Terms, rate/usage limits or permissions;
- rotate identities/accounts to defeat source limits;
- download or warehouse source prose/media merely because it is publicly viewable;
- reconstruct a third-party recipe database by substantial or repeated/systematic extraction.

Automated source work may occur only through the explicit governed acquisition modes below after source-specific preflight. An approved TDM/API/licensed adapter is not a general scraping authorization.

The repository states this as a governance rule because it prevents future implementation drift. Such a statement is not legally required and does not itself create a legal defence; actual conduct and rights state control.

## Acquisition modes

Every source use must declare one acquisition mode:

- `MANUAL_REVIEW` — a human reads a lawfully accessible source and records only bounded factual observations needed for synthesis/validation;
- `AUTOMATED_TDM` — software processes lawfully accessible material through a source-specific governed TDM path after Terms/reservation checks pass;
- `API_OPEN_DATA` — acquisition through an API/open-data surface under its applicable licence/terms;
- `LICENSED_REUSE` — acquisition under express permission or a licence that covers the intended use.

A source may be usable under one mode and blocked under another.

## One-time family baseline; no scheduled refresh

Recipe-family synthesis is not a recurring web-refresh product.

Default family acquisition is one bounded evidence wave:

1. one strong reference source where available;
2. approximately 3–5 genuinely independent practical preparations/observations;
3. normalize facts and technique order;
4. resolve or bound variants/disagreements;
5. stop when additional observations no longer materially change identity, ranges, variants or execution confidence.

Those 3–5 observations should normally be independent sources/preparations rather than repeated requests to the same publisher.

There is no scheduled Carbonara/Hummus refresh every few days, weeks or months. Re-acquisition requires an explicit trigger such as unresolved evidence, a new adaptation question, material model change, owner-authorized research refresh or source-use/legal recheck because that source is being used again.

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
- `rawExpressionRetention`;
- `publicAttributionRequirement`;
- `publicAttributionState`;
- when public attribution is required and ready, `attributionLabel` and `attributionLicenseOrBasis`.

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

## Public attribution / disclosure gate

Internal provenance is mandatory even when public credit is not legally required.

`publicAttributionRequirement`:

- `REQUIRED`;
- `NOT_REQUIRED`;
- `UNKNOWN`.

`publicAttributionState`:

- `READY`;
- `NOT_APPLICABLE`;
- `UNSATISFIABLE`;
- `UNKNOWN`.

Rules:

- `UNKNOWN` attribution requirement fails closed until classified;
- when attribution is `REQUIRED`, state must be `READY` before any public/reusable use;
- when required attribution cannot be satisfied, the source is rejected for that public/reusable use;
- the same source may remain evidence/validation-only only if that separate use is lawful and does not itself carry the unsatisfied disclosure obligation.

Typical examples:

- CC BY / CC BY-SA / CC BY-NC-SA reused material carries the applicable public attribution/licence/change-notice obligations when shared/adapted;
- public-domain material does not ordinarily require copyright attribution as a condition of public-domain status, but project provenance remains mandatory;
- standard-copyright evidence-only use does not automatically create a public-credit requirement merely because non-expressive facts informed synthesis, though source-specific Terms/permission can still require one;
- API/open-data attribution follows the applicable API/data licence/terms.

The current UI has a Wikibooks-specific CC BY-SA provenance renderer. That does not authorize other source classes automatically. A new attribution-bearing source cannot enter the public path until its required source/licence/change notices can actually be rendered.

## Public repository firewall

The GitHub repository is public. Application access gating does not make content committed to GitHub private.

Therefore:

- do not commit protected third-party source expression to the public repository unless redistribution rights for that exact material are established;
- standard-copyright evidence must remain normalized facts/provenance, not a public recipe-text archive;
- protected/gated database storage may remain private to authorized runtime users, but gating does not cure a public-repository disclosure;
- code, schemas, validators, non-protected normalized facts and lawful provenance metadata may remain public where their own rights/privacy state permits.

## YouTube evidence boundary

YouTube is evidence-only by default for this lane.

Do not scrape the YouTube website, scrape/download unofficial transcripts, or warehouse video/audio. Use manual review or an explicitly permitted API/data path under its applicable terms. Retain internal provenance such as channel/publisher, video URL/ID, access date and a relevant timestamp/segment when practical.

Normalize culinary facts/claims only. Do not persist creator prose/transcript/media unless separate reuse rights expressly permit it.

An authoritative creator does not become canonical truth by popularity or expertise alone. Preserve the existing Culinary YouTube requirement for independent non-YouTube evidence and `rightsProvenanceSafetyClear=true` before YouTube-derived discovery can contribute to `APP_AUTHORING_ELIGIBLE`.

## Large-corpus relationship

`100k readiness` means scale architecture, not that one fully rights-cleared 100,000-recipe source has already been approved.

Current canonical source roadmap:

- Open Recipe Archive: ~54,843 records, primary large-corpus candidate, collection/source-book audit required;
- RecipeDB: ~118,171 records, salvage-only/conditional because database-level licensing does not automatically clear every underlying recipe text;
- other open/admitted cohorts remain governed by their own licence/attribution obligations.

Recipe Family Synthesis is a quality/adaptation layer on top of a rights-clean base corpus; it is not a mechanism for manufacturing a 100k corpus from third-party recipe sites.

## Deterministic preflight

`scripts/validate-recipe-family-source-compliance.mjs` is the executable fail-closed validator for source-observation packets.

Before the Carbonara/Hummus gatherer consumes an observation packet:

```text
source candidate
→ acquisition-mode classification
→ lawful-access check
→ terms/contract check
→ TDM reservation check where applicable
→ individual + cumulative database-extraction check
→ expression-retention check
→ attribution/disclosure check
→ deterministic compliance validator
→ eligible factual observation OR source-level block
```

A failed source blocks that source, not the dish family.

## Legal anchors reviewed

Operational interpretation is grounded in the following current primary/source terms checked on 2026-09-17:

- Spain, Real Decreto-ley 24/2021, Article 67 — lawful-access TDM; general exception unavailable where rights are expressly reserved: `https://www.boe.es/eli/es/rdl/2021/11/02/24`;
- Spain, Texto Refundido de la Ley de Propiedad Intelectual, Articles 133–135 — database extraction/reuse and repeated/systematic extraction: `https://www.boe.es/eli/es/rdlg/1996/04/12/1/con`;
- CC BY-SA 4.0 — attribution, licence identification/link, change indication and ShareAlike when licensed material is shared/adapted: `https://creativecommons.org/licenses/by-sa/4.0/legalcode`;
- YouTube Terms of Service — restrictions on automated access/scrapers and independent use of service content: `https://www.youtube.com/static?template=terms`;
- YouTube API Services Terms — API compliance, required notices/attribution and no general grant to reproduce/distribute audiovisual content outside the authorized path: `https://developers.google.com/youtube/terms/api-services-terms-of-service`.

## Consultant + Project Coach implementation challenge

Before expansion beyond Carbonara + Hummus, the prototype review must explicitly answer:

1. Are low-risk factual/manual sources being blocked unnecessarily?
2. Is any automated source proceeding without sufficiently current Terms/TDM evidence?
3. Does cumulative publisher extraction remain genuinely bounded?
4. Is protected expression absent from persistent observation/family objects and from the public repository?
5. Does each material synthesized claim have auditable provenance without turning provenance into a recipe-copy archive?
6. Does more collection still add information, or is direct app authoring + validation cheaper and safer?
7. Has the public/private runtime firewall remained intact?
8. Is any required public attribution actually renderable before public/reusable admission?
9. Is the one-time family baseline still sufficient, or has a specific evidence trigger genuinely earned another collection wave?
10. Is 100k readiness being kept distinct from rights-cleared source volume?

Consultant owns the scale/trade-off recommendation. Project Coach owns sequencing, terminal evidence and gate discipline. Neither role creates source-use permission or public/runtime authority.

## Re-review triggers

Re-run legal/source review before widening or reusing the lane if any of these changes materially:

- acquisition switches from manual to automated;
- a new commercial recipe platform/database becomes a material source;
- source Terms, licence or TDM reservation changes;
- source volume per publisher increases materially;
- raw source text begins to be retained beyond transient normalization;
- the project becomes broadly public, commercial, multi-user or redistribution-oriented;
- the system begins exposing source-derived prose/media rather than project-owned expression;
- a new public attribution/disclosure obligation appears;
- a previously reviewed source is reacquired under materially changed conditions.
