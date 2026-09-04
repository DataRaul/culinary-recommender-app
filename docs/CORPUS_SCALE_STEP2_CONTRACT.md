# Corpus Scale / 100k Readiness — Step 2 RecipeSource V2 Compatibility Contract

Status: **IMPLEMENTATION BUILT / PR VALIDATION PENDING / V1 REMAINS PUBLIC DEFAULT**

This is the executable Step-2 compatibility gate referenced by `docs/ROADMAP.md`, `docs/CORPUS_SCALE_CLOUDFLARE_ACCEPTED_ARCHITECTURE.md` and `docs/CORPUS_SCALE_100K_REFERENCE_AND_SOURCE_ROADMAP.md`.

Step 1 passed its deterministic 1k → 10k → 50k → 100k benchmark on PR #47 and merged at `fda51cd144a0d0e56906ed126856580a963a8dca`. Step 2 therefore tests whether the app can cross a provider-neutral serialized recipe boundary without changing culinary behavior.

## Frozen compatibility baseline

The Step-2 golden corpus is the reviewed runtime corpus on `main` at:

`fda51cd144a0d0e56906ed126856580a963a8dca`

Expected corpus:

- 84 runtime recipe records;
- 76 curated/authored records;
- 8 exact-revision Gate-F external records.

`RecipeSource` remains the stable app-owned contract from `src/core/contracts.js`:

- `list()`;
- `getById(id)`.

No Cloudflare-specific method is added to that contract in Step 2.

## V1 and V2 roles

### V1 — reviewed current runtime source

`StaticRecipeSourceV1` wraps the existing `ALL_RECIPES` / `recipeByIdV1` corpus and preserves defensive cloning.

`publicRecipeSource` remains bound to V1 during Step 2. This is deliberate: proving compatibility is not the same as authorizing a browser-runtime cut-over.

### V2 — provider-neutral portable JSON boundary

`PortableJsonRecipeSourceV2` implements the same stable `RecipeSource` interface using deterministic JSON recipe bodies keyed by recipe ID.

The purpose is to prove that the complete reviewed recipe record can cross the same kind of serialization boundary required by a future object store / Worker adapter while remaining independent of Cloudflare implementation details.

V2 must:

1. require an array of recipes;
2. require a non-empty unique string ID for every record;
3. fail closed on duplicate or invalid identity;
4. retain stable corpus ordering for `list()`;
5. return `null` for unknown IDs;
6. return defensive parsed copies rather than mutable internal records;
7. preserve every serialized field needed by current recommendation/search/planner behavior.

The internal representation in Step 2 is not the final Step-3 object/shard layout and does not freeze R2 key structure, manifest format, remote transport, cache policy or Worker API shape.

## Required parity gate

Before V2 can be considered compatible, deterministic tests must demonstrate V1/V2 equivalence for the frozen 84-record corpus across:

- exact recipe identity and stable order;
- complete serialized recipe values and provenance;
- `getById` behavior;
- defensive-copy semantics;
- ranking eligibility and rejection;
- hard-constraint reasons;
- scores and explanations;
- SEARCH_ONLY / reference-only external governance behavior;
- ingredient-search ordering, eligibility and blocked reasons;
- default and full-week planner output;
- dietary, allergen, permanent-exclusion, availability, time, skill, cuisine and priority-pack profile contexts.

The bounded Step-2 parity fixture supplements rather than duplicates the existing 15,552-case profile matrix. Full repository validation continues to run the existing matrix and browser acceptance suite.

## Explicit non-authorizations

Step 2 does **not** authorize:

- switching `publicRecipeSource` from V1 to V2 by default;
- Cloudflare Pages, Access, Worker or R2 provisioning;
- D1;
- a final remote metadata/detail or R2 object layout;
- any new real external recipe ingestion;
- mass ingestion of source candidates B–E;
- paid infrastructure;
- any ranking, planner, hard-filter, nutrition, recipe-admission or public UX behavior change;
- any private Knowledge Core browser/runtime dependency;
- interference with the independent nutrition B24 lane.

## Pass / fail interpretation

**PASS** means the reviewed app behavior is invariant across the current in-memory V1 source and the provider-neutral serialized V2 source for the required parity fixtures and full repository validation.

A PASS earns Step 3: define the metadata/detail split and portable manifest/object/index layout that maps naturally to R2 while remaining provider-neutral.

A FAIL means V2 must be repaired or the serialization boundary reconsidered before Step 3. Do not mask a parity failure by weakening existing hard constraints, provenance, external governance, nutrition separation or deterministic behavior.
