# Corpus Scale Step 7E — ForkRecipe production-shaped pilot

Status: **SOURCE AUDIT IMPLEMENTED / LIVE PILOT NOT YET AUTHORIZED BY AUDIT RESULT**

Date: **2026-09-06**

Entry authority: `STEP_7D_PROTECTED_84_CANARY_PASS` on app main `08bce89b340c88bf175cc5bac57f62f7e29af731`.

This gate is governed by `docs/CORPUS_SCALE_NO_BILLING_AUTH_170K_ARCHITECTURE.md`, the generalized source control plane, and all existing nutrition, allergen/dietary, source-rights, public-runtime and Knowledge Core boundaries.

## 1. Scope

Step 7E may evaluate one **500–1000-record rights-clean real-source cohort** using the already-proven authenticated/fail-closed architecture. It does not authorize public recommendation expansion, automatic corpus admission, paid infrastructure, a paid corpus/API, or the eight future recipe-body D1 shard databases.

Current candidate:

- repository: `futurechef/forkrecipe-recipes`;
- pinned commit: `c32255266af39bd77444d39452f3df8088ac8fd9`;
- upstream README declaration: 916 recipes;
- source-level content licence declaration: CC BY-SA 4.0;
- media: excluded;
- external nutrition: never imported as NutritionSource authority.

The upstream commit is immutable for this Step 7E decision. Later upstream changes require a new source-version event and cannot silently rewrite this pilot.

## 2. Rights gate

The pinned audit requires all of the following independently:

1. README identifies the repository as the recipe-content data layer;
2. README explicitly licenses all recipes CC BY-SA 4.0;
3. README states content is originally authored or adapted from public-domain sources;
4. repository `LICENSE` contains the CC BY-SA 4.0 licence;
5. `CONTRIBUTING.md` states accepted content uses the same licence;
6. contributor guidance rejects copying copyrighted commercial recipe prose.

Every admitted pilot packet retains pinned-file provenance and attribution. A failure in source-level rights evidence holds the cohort fail-closed.

## 3. Data-quality and adapter gate

The workflow checks out the exact upstream commit and runs the upstream zero-dependency validator before the Culinary adapter audit.

The Culinary audit then requires:

- exact deterministic recipe-file count and unique slugs/files;
- expected per-record `CC-BY-SA` declaration;
- supported source ratio system;
- non-empty ingredient and process structures;
- finite source ratio values;
- immutable pinned-file provenance;
- deterministic source-pilot packet hashes;
- generalized control-plane and ingestion-pipeline validation;
- duplicate/title-collision observations without automatic merging.

A stale documentation example count is recorded as provenance/data-quality drift but is not by itself a blocking source-body defect when the pinned tree and upstream validator agree.

## 4. Quantity, nutrition, dietary and allergen firewall

ForkRecipe `ratioValue` / `ratioSystem` values are source-native relative recipe structure. Step 7E **does not convert them into absolute grams, household portions or NutritionSource quantity evidence**.

The source pilot therefore:

- promotes zero ratio values to absolute quantities;
- imports zero external nutrition values as authority;
- derives zero dietary or allergen claims from recipe titles/tags/prose;
- makes zero Step 7E records recommendation eligible;
- leaves canonical ingredient mapping and hard recommendation metadata partial pending later evidence/review.

This distinction is deliberate: a record can be rights-clean and structurally valid enough for the protected source pilot without being safe for public recommendation or nutrition calculation.

## 5. Admission semantics

A rights-clean, schema-valid ForkRecipe record may receive:

`ADMIT_PROTECTED_SOURCE_PILOT_ONLY`

This means only:

- exact source content is admitted to the bounded Step 7E protected pilot evidence set;
- provenance is verified against the pinned source file;
- parse passed;
- normalization, deduplication, ingredient quantity mapping and hard metadata remain explicitly partial;
- nutrition is firewalled;
- the portable source packet is ready for a later protected live canary.

It does **not** mean:

- public app admission;
- recommendation eligibility;
- dietary/allergen safety certification;
- nutrition authority;
- automatic Brain/Atlas promotion;
- public runtime activation.

All generated control-plane snapshots retain `runtimeActivationAuthorized: false` and `automaticAdmissionAuthorized: false`.

## 6. Production-shaped packet

Each pilot packet contains:

- source/commit/file identity;
- immutable source URL;
- attribution and CC BY-SA 4.0 rights envelope;
- a strict allowlisted copy of the source recipe fields;
- explicit no-media, no-nutrition-authority, no-diet/allergen-derivation and no-public-runtime flags;
- deterministic packet SHA-256 and byte count.

Unknown top-level source fields are not silently promoted into the packet. Media/nutrition-like top-level fields are not part of the allowlisted source body.

## 7. Repository audit workflow

`.github/workflows/corpus-scale-step7e.yml`:

1. checks out this app;
2. checks out ForkRecipe at the exact pinned commit;
3. verifies the commit SHA;
4. runs upstream `npm run validate`;
5. runs `scripts/run-forkrecipe-step7e-audit.mjs`;
6. uploads `summary.json`, generalized control-plane/pipeline snapshots, and the protected-pilot packet set as CI evidence.

The workflow uses no external secrets and does not write to Cloudflare or provision infrastructure.

## 8. Current terminal states

Repository/source audit:

- `STEP_7E_FORKRECIPE_PINNED_SOURCE_AUDIT_PASS_LIVE_PILOT_PENDING`, or
- `STEP_7E_FORKRECIPE_SOURCE_AUDIT_HOLD`.

Only the PASS state may unlock a live protected D1/Worker pilot design.

A later live Step 7E canary must still prove authenticated access, revocation, Free-limit fail-closed behavior and measured D1/Worker consumption. It must use the existing `culinary-control` D1 only unless a later roadmap gate explicitly earns the future recipe-body shard layout.

## 9. Hard boundaries

Not authorized by this file:

- creating any of the eight future recipe-body D1 shard databases;
- Workers Paid or any charge/overage authorization;
- Zero Trust / Access or R2 activation;
- public static publication of protected recipe bodies or indexes;
- external source runtime fetches;
- replacing the current authenticated same-origin session architecture;
- public V1→V2 cut-over;
- automatic source admission outside this bounded pilot;
- Knowledge Core writes or private Knowledge Core browser/runtime dependency.
