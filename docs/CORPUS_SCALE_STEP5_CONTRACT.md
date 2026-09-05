# Corpus Scale / 100k Readiness — Step 5 Generalized Ingestion / Control Plane

Status: **IMPLEMENTATION BUILT / FULL REPOSITORY VALIDATION PENDING / NO NEW REAL-SOURCE ADMISSION**

Step 4 proved the provider-neutral pre-built-index retrieval path through 100k synthetic records and therefore did **not** earn D1. Step 5 now generalizes the already-reviewed Wikibooks Gate F2 control machinery into a source-adapter-neutral ingestion/review boundary.

This step builds control infrastructure only. It does not ingest Open Recipe Archive, RecipeDB, ForkRecipe, UniTools or any other new real corpus.

## Core objective

Every external source must enter through the same app-owned sequence:

```text
source registry
→ source adapter
→ rights/reuse state
→ immutable provenance/version locator
→ parse
→ normalize
→ deduplicate / family resolution
→ ingredient + quantity mapping
→ hard metadata review
→ nutrition kept separate
→ explicit ADMIT / HOLD / REJECT decision
→ immutable versioned admission manifest
→ later canonical recipe artifact/index build
```

No source-specific adapter may bypass the canonical decision boundary or activate public runtime records directly.

## Canonical source contract

Each source registry entry must explicitly provide:

- stable source ID and name;
- unique adapter ID;
- source family;
- source-versioning mode;
- rights-evidence mode;
- licence and explicit licence URL/null state;
- attribution policy;
- media policy;
- `runtimeFetch: false`;
- `sourceNutritionImportedAsAuthority: false`;
- `automaticAdmissionAuthorized: false`.

The contract is provider-neutral. It contains no Cloudflare/R2/D1 requirement and no browser runtime dependency.

`createSourceRegistry()` sorts entries deterministically, rejects duplicate source IDs/adapters, fingerprints the registry, and keeps both runtime activation and automatic admission false.

## Canonical rights states

The control plane uses the roadmap's source-rights semantics:

- `RIGHTS_REVIEW_REQUIRED`;
- `ADMIT_RIGHTS_VERIFIED`;
- `HOLD_RIGHTS_AMBIGUOUS`;
- `REJECT_RIGHTS_INCOMPATIBLE`;
- `REJECT_PROVENANCE_MISSING`.

Only records at `ADMIT_RIGHTS_VERIFIED` may reach `ADMITTED`.

A content/quality rejection may still have verified content rights. Rights state and recipe-quality/admission state remain separate axes.

## Canonical review states

Every normalized source record is exactly one of:

- `DISCOVERED_UNREVIEWED`;
- `REVIEW_READY`;
- `HELD`;
- `ADMITTED`;
- `REJECTED`.

`applyExplicitReviewDecision()` requires the explicit marker:

`decisionAuthority = EXPLICIT_REVIEW_DECISION`

There is no automatic-admission transition. A discovered item cannot self-promote merely because parsing succeeds or metadata looks complete.

Terminal reviewed records are not silently overwritten. Later source/version events or explicit new reviewed snapshots must preserve review history rather than mutating old evidence in place.

## Immutable provenance

Each control record requires:

- source name;
- source item ID;
- exact source version ID;
- explicit version timestamp or null state;
- source URL;
- immutable/version-specific locator;
- licence + explicit licence URL/null;
- attribution;
- media inclusion state;
- explicit confirmation that source nutrition was not imported as authority.

The control-plane snapshot is deterministically sorted and SHA-256 fingerprinted. Duplicate source item/version pairs fail closed.

## Canonical pipeline stage state

The source-neutral ingestion pipeline records each control record across:

1. `provenance`;
2. `parse`;
3. `normalize`;
4. `deduplicate`;
5. `ingredientQuantityMapping`;
6. `hardMetadata`;
7. `nutrition`;
8. `decision`;
9. `portableArtifact`.

Allowed stage values are explicit (`NOT_STARTED`, `VERIFIED`, `PASS`, `PARTIAL`, `HOLD`, `REJECT`, `FIREWALLED`, `PENDING`, `READY`, `NOT_APPLICABLE`).

An admitted record must have:

- verified provenance;
- reviewed parse/normalization/deduplication/ingredient-quantity/hard-metadata stages (`PASS` or truthful `PARTIAL`);
- `FIREWALLED` nutrition;
- a passing explicit decision;
- portable-artifact state `PENDING` or `READY`.

This intentionally permits reviewed reference-only recipes with incomplete hard metadata while preventing unreviewed stage gaps from masquerading as admissions.

## Nutrition firewall

External recipe content never becomes nutrition authority merely because the recipe was admitted.

Every admitted external record must retain:

`EXTERNAL_RECIPE_NUTRITION_NOT_IMPORTED`

and the pipeline nutrition stage must be:

`FIREWALLED`.

Authoritative nutrition remains the independent reviewed `NutritionSource` path with its existing quantity/composition/semantic gates.

## Media firewall

Media defaults to `EXCLUDED`. A source contract may state `SEPARATELY_LICENSED`, but that does not implicitly admit any image or media object. Actual media integration would require its own record-level rights/provenance implementation and is outside Step 5.

## Wikibooks Gate F2 compatibility adapter

`wikibooks-gate-f2-control-plane-adapter.mjs` proves that the established Gate F2 state can cross the generic boundary without rewriting its semantics.

The existing reviewed ledger maps to:

- **8 admitted exact-revision records**;
- **5 reviewed rejections**;
- exact page/revision provenance and CC BY-SA 4.0 attribution;
- existing recommendation/hard-metadata/ingredient-mapping states retained as adapter metadata;
- nutrition firewall preserved;
- media excluded;
- existing runtime artifact pointers preserved only as historical already-reviewed Gate F artifacts;
- generic runtime activation remains false.

The adapter also maps Gate F2 into every canonical pipeline stage. This is a compatibility proof, not a migration that deletes or weakens the original Gate F2 ledger/contracts.

## Action queue

`buildControlPlaneActionQueue()` surfaces only:

- discovered/unreviewed records;
- review-ready records;
- held records.

It never includes already admitted/rejected terminal records as fresh automatic work, never authorizes runtime activation, and never authorizes automatic admission.

## Versioned admission manifest

A reviewed control-plane + pipeline snapshot may produce a deterministic `corpus-source-admission-manifest-v1`.

The manifest contains only admitted record identities, source/version/provenance fingerprints, rights/admission/nutrition/media states and pipeline-stage evidence.

It deliberately contains **no recipe bodies** and keeps:

- `runtimeActivationAuthorized: false`;
- `automaticAdmissionAuthorized: false`;
- `recipeBodiesIncluded: false`.

The admission manifest is an input to later canonical recipe normalization/artifact production, not a public runtime switch.

## Idempotency and resumability

Step 5 is deterministic and snapshot-based:

- source registries are sorted/fingerprinted;
- control-plane snapshots are sorted/fingerprinted;
- pipeline snapshots are complete one-to-one mappings of control records and are fingerprinted;
- admission manifests are sorted/fingerprinted;
- duplicate IDs or duplicate source item/version pairs fail closed;
- missing pipeline state fails closed;
- tampered fingerprints fail validation;
- held/rejected/admitted evidence is never silently promoted by a parser or discovery rerun.

This provides a resumable deterministic state boundary before Step 6 adds changed-record/shard/schema validation mechanics.

## Validation contract

`tests/corpus-source-control-plane.test.js` verifies:

- Gate F2 → generic control-plane compatibility;
- exact 8-admit / 5-reject preservation;
- explicit-decision-only admission;
- hold/reject fail-closed behavior;
- rights verification required before admission;
- nutrition/media firewalls;
- deterministic action queues and snapshots;
- deterministic admission manifests without recipe bodies;
- duplicate/provenance failures.

`tests/corpus-ingestion-pipeline.test.js` verifies:

- deterministic source registry;
- complete Gate F2 stage mapping;
- deterministic pipeline admission manifest;
- resumable pending/NOT_STARTED stage state;
- reviewed stage requirements before admission;
- one-to-one pipeline/control mapping;
- fingerprint tamper detection.

Normal repository validation and browser acceptance remain mandatory before merge.

## Hard non-authorizations

Step 5 does **not** authorize:

- Open Recipe Archive or any other new real-source ingestion;
- source-rights assumptions without evidence;
- automatic admission;
- public runtime activation;
- switching the public browser from V1 to remote V2;
- Cloudflare Pages/Access/Worker/R2 provisioning;
- D1;
- paid infrastructure, APIs or corpus licences;
- source nutrition as authority;
- image/media admission by inheritance;
- weakening allergen/dietary/permanent-exclusion/hard-metadata gates;
- private Knowledge Core browser/runtime dependency.

## Step 5 PASS condition

Step 5 passes when:

1. the source-neutral control plane validates;
2. the source registry validates;
3. Gate F2 maps through it without behavioral/governance loss;
4. canonical pipeline stages fail closed on unreviewed admissions;
5. admit/hold/reject and rights states remain distinct;
6. nutrition/media/runtime firewalls remain intact;
7. deterministic fingerprint/idempotency tests pass;
8. full existing repository tests and browser acceptance remain green.

## Next action after PASS

**Step 6 — Incremental large-corpus validation architecture.**

Build changed-record/shard/schema/provenance validation, golden-corpus parity and bounded sampled regression sets so large source cohorts can be reviewed incrementally without turning normal CI into a 100k × full-profile matrix.
