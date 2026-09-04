# Corpus Scale / 100k Readiness — Reference Architecture and Source Admission Roadmap

Status: PLANNED / RESEARCH RECORDED / NO MASS INGESTION AUTHORIZED

This document is the detailed implementation companion to `docs/ROADMAP.md` for the V1.x Corpus Scale / 100k Readiness program. It records reusable external implementation references, the source-admission order, licensing obligations in operational terms, and the fail-closed RecipeDB salvage gate. Raw recipe count is not a success criterion.

## 1. Reuse-before-reinvent implementation references

These references are implementation inputs, not automatic dependencies. Before copying code, pin the exact upstream commit/release, verify its software licence, copy only the compatible pieces, and preserve attribution/notices where required. Architecture ideas may be reimplemented independently when the upstream code licence is absent or undesirable.

### R1 — Firebase official Web quickstarts

- Repository: `firebase/quickstart-js`
- Upstream role: official Firebase Web examples for Authentication, Cloud Firestore and related browser SDKs.
- Software licence at research time: Apache-2.0.
- Reuse plan: use Google's current Web SDK patterns for initialization, verified identity, Google sign-in/passwordless-capable auth flows, Firestore reads/queries and security-rule testing rather than inventing custom Firebase integration.
- Boundary: do not migrate the Culinary app to Firebase Hosting merely because examples use Firebase services; GitHub Pages remains the baseline front end unless a later measured gate changes that.

### R2 — `smeet666/mcp-wikibooks-cookbook`

- Repository: `smeet666/mcp-wikibooks-cookbook`
- Upstream role: current TypeScript Wikimedia/Wikibooks recipe client and parser with search/read flows, request pacing, cache controls, structured recipe parsing, source URL return and licence return.
- Software licence at research time: MIT.
- Reuse plan: inspect/adapt the Wikimedia client, parsing, pacing, error and attribution patterns when generalizing the existing app-owned Wikibooks Gate F/F2 adapter.
- Content boundary: software MIT does not replace Wikibooks content licensing. Wikibooks recipe text remains CC BY-SA 4.0 with source/revision attribution and ShareAlike obligations.

### R3 — `AdamBouhmad/open-recipe-archive`

- Repository: `AdamBouhmad/open-recipe-archive`
- Upstream role: 54,843-recipe public-domain/copyright-safe historical corpus with per-collection JSONL, per-recipe Markdown, global indexes, source author/title/year/URL and per-record licence metadata.
- Repository/software dedication at research time: Unlicense/public-domain dedication; individual recipe records also carry source/licence metadata.
- Reuse plan: treat its data layout as a strong reference for our metadata/detail separation and provenance-first ingestion. In particular, reuse/adapt the concepts of collection manifests, JSONL bulk records, global collection/culture indexes, per-record source metadata, and SQLite-to-public-data export tooling.
- Boundary: do not trust the label `public-domain` blindly. Before production admission, verify source/public-domain status at collection/source-book level, with particular care for EU/Spanish term rules and translations/modern editorial additions.

### R4 — `nerkyzas157/gamito`

- Repository: `nerkyzas157/gamito`
- Upstream role: deterministic meal-planning/retrieval architecture with a prebuilt recipe index, hard filters, local deterministic planning, pantry and profile state.
- Licence status at research time: no repository licence was found.
- Reuse plan: architecture/design reference only. The useful pattern is `large recipe index -> bounded retrieval -> hard filters -> deterministic planner/scorer`, plus a separately evaluable retrieval golden set.
- Boundary: do not copy code unless an explicit compatible licence is later established.

### R5 — `giladl82/recipes-fs-pwa`

- Repository: `giladl82/recipes-fs-pwa`
- Upstream role: older recipe PWA using Firebase/Firestore, including Firestore rules/index examples.
- Reuse plan: proof-of-concept/reference only for recipe-specific Firestore document/rule shapes.
- Boundary: prefer current official Firebase quickstarts for SDK/auth/security implementation; do not inherit this demo's framework choices or owner-per-recipe security model without review.

### R6 — `mealie-recipes/mealie`

- Repository: `mealie-recipes/mealie`
- Upstream role: mature recipe manager/meal planner with a REST backend and reactive frontend.
- Software licence at research time: AGPL-3.0.
- Reuse plan: comparator and feature/reference source only unless a later explicit AGPL decision is made. It is useful for understanding mature recipe-management edge cases, API/data-model ideas and import/export behavior.
- Boundary: its conventional backend and AGPL obligations are not the baseline architecture for this small-user, zero-recurring-cost app.

## 2. Point-by-point reference map for the eight-step scale program

1. **Scale contract + synthetic benchmark**
   - Build ourselves because acceptance criteria are app-specific.
   - Borrow Gamito's idea of a retrieval golden set and measured warm-query latency, but not its unlicensed code.
   - Record Firebase free-tier budgets as measured constraints, not assumptions.

2. **`RecipeSource` V2 compatibility layer**
   - Preserve the current app contract and deterministic evaluator.
   - Use no external framework migration as a prerequisite.
   - Add V1/V2 parity fixtures using the existing reviewed corpus as the golden oracle.

3. **Remote metadata/detail separation**
   - Use Open Recipe Archive's collection manifest + JSONL + global-index layout as the primary data-layout reference.
   - Map that shape to Firestore collections/documents only after synthetic storage/index measurements prove the representation.
   - Keep full recipe detail separate from lightweight searchable/index metadata.

4. **Indexed candidate retrieval + progressive scale proof**
   - Use Gamito's retrieve-first / hard-filter / deterministic-plan pattern as a design reference.
   - Use Firestore's documented query/index patterns from official Firebase examples.
   - Do not require embeddings/vector search unless deterministic metadata retrieval fails measured relevance/latency gates.

5. **Generalized ingestion/control plane**
   - Generalize the existing Gate F2 state machine and exact-revision/provenance controls.
   - Reuse/adapt Wikibooks client/parser/pacing patterns from `mcp-wikibooks-cookbook` where compatible.
   - Reuse/adapt Open Recipe Archive's source-author/title/year/URL/licence record shape and collection manifests.
   - Every source adapter must produce the same canonical admit/hold/reject contract.

6. **Incremental large-corpus validation**
   - Build app-specific schema/shard/change validation and golden-corpus parity.
   - Borrow the idea of small retrieval-evaluation golden sets from Gamito.
   - Full 100k-scale benchmarks are separately runnable; normal CI must not become an all-profile × all-recipe matrix.

7. **Production-shaped real-source pilot**
   - Preferred first external pilot is Open Recipe Archive's Spanish collection after its source-book/public-domain audit passes.
   - Current recorded size: 928 recipes, which naturally fits the planned 500–1,000 record first pilot.
   - Run through the actual GitHub Pages + Firebase Auth + Firestore + `RecipeSource` V2 architecture; no JavaScript bundle fallback.

8. **Measured large-corpus readiness/population gate**
   - Expand only source cohorts that pass rights, quality, provenance, deduplication, coverage and cost/performance gates.
   - The useful final corpus may be far below or above 100k; raw count never overrides quality or rights.

## 3. Source admission order — A through E

### A — Existing curated corpus + Wikibooks — PASS / ALREADY ESTABLISHED

Scope:
- existing project-authored reviewed recipes;
- existing exact-revision Wikibooks Gate F corpus;
- broader Wikibooks corpus only through the existing/genericized F2 review/admission machinery.

Human legal meaning for Wikibooks CC BY-SA 4.0:
- we may copy, normalize, adapt and display the recipe text;
- we must credit Wikibooks/source contributors as required, retain source/revision provenance, link/identify the licence, identify transformations, and keep adaptations under compatible ShareAlike terms;
- images/media remain separately licensed and excluded unless independently cleared.

Operational status: `PASS`.

### B — Open Recipe Archive / Spanish collection — PASS-CANDIDATE / PREFERRED FIRST STEP-7 PILOT

Current recorded scale: 928 recipes.

Why it is preferred:
- close to the planned 500–1,000 first real-source pilot size;
- ingredients and directions are already structured in JSONL/Markdown;
- records carry source author/title/year/URL and a licence field;
- Spanish source collection is described as coming from `El Practicón` (1894) and `La mesa moderna` (1888), enabling source-book-level verification instead of anonymous scraping.

Required pre-admission audit:
1. enumerate every source book/edition represented in the collection;
2. verify public-domain status for the actual source text/edition used, including EU/Spanish term considerations;
3. detect any modern translation, transcription, editorial annotation or other layer that could carry separate rights;
4. exclude images/media unless independently licensed;
5. freeze source URL/year/author/title/licence provenance on every admitted record;
6. sample recipe-body fidelity/parseability and obvious duplicate/variant behavior.

Operational status: `PASS-CANDIDATE`; admission only after this bounded audit passes.

### C — Open Recipe Archive / complete corpus — PASS-CANDIDATE / PRIMARY LARGE-CORPUS BASE

Current recorded scale: 54,843 recipes across 31 exported collections.

Intended use:
- after B proves the pipeline, audit and ingest collection-by-collection rather than all at once;
- prioritize geographically different collections that add measured coverage;
- retain source-book provenance and per-record licence state;
- permit `ADMIT`, `HOLD` and `REJECT` at collection, source-book and record level.

Human legal meaning for genuinely public-domain source recipes:
- no permission/payment is required to copy, normalize, store or display the public-domain text;
- nevertheless retain provenance because our product values auditability, source identity and cultural context;
- any modern translation/editorial material is separately checked and can be excluded while the underlying public-domain source remains usable.

Operational status: `PASS-CANDIDATE`; expected to become the first major large-corpus base if the collection audits confirm the repository's public-domain claims.

### D — Clean modern/open supplements — PASS-CANDIDATE

#### D1 — ForkRecipe
- current recorded scale: 916 recipes;
- repository states recipe content is originally authored or adapted from public-domain sources and licensed CC BY-SA 4.0;
- intended role: contemporary/structured supplement and useful lineage/variant reference, not the main scale source.

#### D2 — UniTools
- current recorded scale: 501 recipes across 127 countries;
- site states dataset licence is CC BY-SA 4.0 and exposes structured fields including timing, difficulty, diets and stable ingredient IDs/scaling rules;
- intended role: small but geographically broad structured supplement.

Human legal meaning for D1/D2 CC BY-SA 4.0:
- use is allowed, including commercial use;
- provide attribution and licence notice/link;
- mark material changes;
- distribute adaptations of the licensed recipe content under the same/compatible ShareAlike terms;
- photographs remain separately licensed and are excluded unless their individual licences are implemented.

Operational status: `PASS-CANDIDATE`, subject to pinning the exact source/version/licence snapshot during ingestion.

### E — RecipeDB 118,171-record salvage gate — CONDITIONAL / PARTIAL ADMISSION EXPECTED

RecipeDB is not an all-or-nothing source. Its published database states 118,171 recipes across 26 geocultural regions and 74 countries and offers its data under CC BY-NC-SA 3.0. Its paper also states that recipes were aggregated primarily from GeniusKitchen/Food.com and AllRecipes. That means the database-level CC statement is useful but does not, by itself, prove that every underlying third-party recipe text can be rehosted by us.

The correct strategy is therefore **source-cohort salvage**, not asking for permission first and not assuming all 118,171 records are usable.

#### E1 — Provenance extraction

For every RecipeDB record or available source mapping, capture:
- RecipeDB ID;
- original/source URL or source identifier when available;
- originating domain/provider;
- title;
- ingredient text/structured ingredient fields;
- instruction text where available;
- RecipeDB licence statement/version;
- any original-source licence/terms evidence;
- evidence retrieval date and immutable locator/snapshot where lawful.

If RecipeDB's downloadable representation does not expose a source URL per record, use the paper/database metadata and any available companion data to partition by known originating source. Missing provenance is not silently repaired.

#### E2 — Cohort partitioning

Group records into source cohorts, for example:
- Food.com / former GeniusKitchen;
- AllRecipes;
- any separately identifiable source cohort;
- records with source provenance missing/ambiguous.

The cohort is only a review accelerator. Final rights state may still be record-specific.

#### E3 — Rights test per cohort/record

A record may be admitted only when evidence supports the exact fields we plan to store/display. Acceptable pathways include:
- original content explicitly public domain;
- original content explicitly licensed under a compatible Creative Commons/open-content licence;
- an official dataset/export whose rights holder clearly grants the necessary storing, normalization, redistribution/rehosting and display rights for those recipe fields;
- another explicit permission that covers our intended noncommercial/small-friends use and the transformations we perform.

A database/repository software licence alone is insufficient.

#### E4 — Fail-closed outcomes

Each record/cohort receives one of:
- `ADMIT_RIGHTS_VERIFIED` — content-level rights established for our intended fields/use;
- `HOLD_RIGHTS_AMBIGUOUS` — potentially usable but evidence incomplete;
- `REJECT_RIGHTS_INCOMPATIBLE` — terms prohibit or do not permit our intended storage/rehosting/display path;
- `REJECT_PROVENANCE_MISSING` — no defensible source chain for the content fields.

Only `ADMIT_RIGHTS_VERIFIED` enters the real corpus pipeline.

#### E5 — Contact is last resort, not first step

Do not contact RecipeDB or the originating website merely because a record is present. First exhaust:
1. dataset documentation and downloadable metadata;
2. peer-reviewed RecipeDB paper/supplementary material;
3. record/source URL metadata;
4. originating site's explicit licence/terms/open-data pages;
5. archived/versioned rights evidence where lawful and necessary.

Only if a materially valuable cohort remains ambiguous after those checks should a concise rights clarification be requested from the relevant rights holder/dataset maintainer. A reply is evidence, not a substitute for verifying that the respondent has authority over the underlying content.

#### E6 — No target retention rate

The E gate has **no minimum number of recipes that must survive**. If 40,000 of 118,171 pass, 40,000 may be useful. If only 5,000 pass, use 5,000. If none pass, use none. Rights confidence, useful coverage and quality dominate row count.

#### E7 — NonCommercial containment

Even when RecipeDB-derived content itself passes under CC BY-NC-SA 3.0:
- keep RecipeDB-derived recipe records explicitly tagged as noncommercial/ShareAlike content;
- display attribution/licence information as required;
- do not allow a future monetization change to silently reuse this cohort;
- keep app code, public-domain sources, CC BY-SA sources and RecipeDB-derived content as separately traceable licence layers rather than pretending the strictest recipe-content licence automatically owns every unrelated app component.

Operational status: `CONDITIONAL / SALVAGE GATE`; the retained count is an output of the audit, not an input target.

## 4. Explicitly excluded large datasets

These remain useful research references but are not production corpus candidates under the current contract:

- **Recipe Box ~125k** — `FAILED_CURRENT_ADMISSION`; scraped from third-party recipe websites and no sufficient content-level redistribution/rehosting chain established.
- **RecipeNLG 2,231,142** — `FAIL_PRODUCTION`; dataset is presented for non-commercial research/educational use, not ordinary consumer-app production.
- **Recipe1M+ >1M** — `FAIL_PRODUCTION`; access is granted for research purposes to universities/research institutions, not this app deployment.

Do not spend implementation time adapting these into production unless their rights situation materially changes.

## 5. Human-readable licence rules

- **Public domain:** normally copy/store/modify/display is allowed without permission; retain provenance anyway, and verify that the exact edition/translation/editorial layer is also public domain.
- **CC BY-SA:** copy/modify/display is allowed; credit the source, preserve licence notice/link, mark changes, and keep adaptations under ShareAlike.
- **CC BY-NC-SA:** same as BY-SA plus do not use the licensed recipe content commercially. Keep this cohort separately tagged so a later business-model change cannot accidentally violate the restriction.
- **Research-only / academic-only:** do not place the content in the production Culinary app.
- **Software MIT/Apache/etc.:** this can license code, but it does not automatically license recipe text that the code scraped or processed.

## 6. Sequential population plan after infrastructure Steps 1–6

When Step 7 is reached:

1. run B audit and ingest the ~928 Spanish Open Recipe Archive records that pass;
2. measure real Firestore storage/index/read behavior and V1/V2 recommendation parity;
3. expand C by a few diverse Open Recipe Archive collections, not the whole corpus at once;
4. incrementally grow toward the full audited C corpus as coverage/quality justify;
5. add D supplements where they fill contemporary/geographic/structured-metadata gaps;
6. run E as an independent salvage lane and admit only rights-cleared RecipeDB cohorts/records;
7. deduplicate/family-cluster across sources without deleting meaningful variants or source provenance;
8. stop increasing raw count whenever new records add little coverage/quality relative to ingestion/review cost.

This sequencing intentionally lets the system become useful at ~1k, then tens of thousands, before the E gate is resolved.

## 7. Evidence revalidation rule

All external repository licences, Firebase free-tier assumptions, corpus counts and source licence statements are time-sensitive inputs. At the implementation/admission moment, re-fetch the exact upstream version and rights terms, pin them in the source registry, and fail closed if a material term changed.
