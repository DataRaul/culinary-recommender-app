# Corpus Scale / 100k Readiness — Accepted Cloudflare Architecture

Status: **USER-ACCEPTED TARGET ARCHITECTURE / IMPLEMENTATION NOT YET BENCHMARK-VALIDATED / STEP 1 READY / NO MASS INGESTION AUTHORIZED**

This document reconciles the earlier Firebase-first production sketch in `docs/ROADMAP.md` with the later Knowledge Core review, large-corpus source research and the user's explicit architecture/access decision on 2026-09-04.

The earlier Firebase design remains a useful fallback/comparator. It is **not** the preferred production baseline after this reconciliation.

The canonical source/licensing/reuse research remains in `docs/CORPUS_SCALE_100K_REFERENCE_AND_SOURCE_ROADMAP.md`. This document has precedence only for the **runtime/storage/access architecture and next executable action**.

## 1. Accepted target architecture

```text
GitHub repository
  - source code / review / version history
  - GitHub remains project source of truth
        ↓ deploy
Cloudflare Pages
  - lightweight static Culinary app
  - production private entry point
        ↓
Cloudflare Access
  - exact-email allowlist
  - one-time email code / OTP
  - NO public registration
  - NO "any email may sign in"
        ↓
Cloudflare Worker
  - small authenticated API/gateway
  - validates protected identity/request boundary
  - exposes only bounded corpus retrieval operations
        ↓
Cloudflare R2
  - versioned recipe bodies
  - immutable/source-aware provenance
  - licence/attribution/transformation metadata
  - pre-built retrieval-index shards
  - manifests / corpus versions
        ↓
RecipeSource V2
  - retrieves bounded candidate IDs/details only
        ↓
existing app-owned deterministic hard filters
+ RecipeEvaluator + scorer + planner
        ↓
recommendations / fridge-first discovery / recipe search

Optional only if benchmark earns it:
Cloudflare D1
  - compact relational/query index
  - NOT the default recipe warehouse
  - NOT required merely because SQL exists
```

## 2. Hard access constraint — invitation only

This is a product/security requirement, not an optional implementation detail.

1. The production Culinary app is **not open signup**.
2. A person is eligible to authenticate only when their **exact email address has been explicitly placed on the owner's allowlist**.
3. Cloudflare Access email OTP/passwordless login is the preferred initial identity flow; the app does not maintain application passwords.
4. A valid email address alone is insufficient. An address outside the explicit allowlist is denied.
5. Do not use a wildcard policy such as `*@gmail.com`, a whole public email domain, or an `Everyone` Access rule.
6. Any future identity provider (Google, GitHub, passkey, etc.) must still be intersected with the owner-controlled allowlist; identity proof never becomes self-service membership.
7. Removal from the allowlist must revoke future access without requiring deletion of recipe data or rebuilding the recommendation engine.
8. Defense in depth: protected Worker/API routes must trust/validate the Cloudflare Access identity boundary rather than assuming that hiding UI controls is authorization.
9. The GitHub repository being public **must not grant production application access**. Source-code visibility and application membership are separate concepts.
10. When the private Cloudflare production entry point is activated, the legacy public GitHub Pages deployment must not expose protected corpus functionality. It should be retired, disabled, or reduced to a non-sensitive shell/landing surface as appropriate at that activation gate.

## 3. Why R2 is the default corpus store

The recipe corpus is expected to be **read-mostly**. Large source cohorts are ingested/reviewed in controlled batches, then served many times with comparatively infrequent rewrites.

Therefore the default storage model is immutable/versioned objects rather than one database write per recipe per deployment.

Illustrative shape:

```text
/corpus/v0001/manifest.json
/corpus/v0001/indexes/ingredient/tomato.json.gz
/corpus/v0001/indexes/ingredient/chicken.json.gz
/corpus/v0001/indexes/cuisine/spanish.json.gz
/corpus/v0001/indexes/diet/vegetarian.json.gz
/corpus/v0001/indexes/time/under-30.json.gz
/corpus/v0001/recipes/000001.json
/corpus/v0001/recipes/000002.json
...
```

The exact sharding/index shape is **not frozen yet**. Step 1 and Step 4 benchmarks must determine it.

Runtime principle:

`large corpus -> tiny pre-built indexes -> bounded candidate IDs -> fetch bounded recipe details -> existing deterministic evaluator/scorer`

The browser must never need to load the complete corpus.

## 4. D1 definition and gate

Cloudflare D1 is an optional SQL/relational query layer.

Human model:
- **R2 = warehouse** containing recipe/provenance/index objects;
- **D1 = optional librarian/catalogue** capable of answering more complicated relational/filter queries;
- **Worker = receptionist/gateway** controlling authenticated access;
- **Access = security guard** deciding which exact invited emails may enter;
- **Pages = application UI**;
- **GitHub = development/source-of-truth system**.

Do **not** add D1 initially.

D1 may be introduced only if measured tests show that R2 + pre-built deterministic indexes cannot meet one or more required query/retrieval gates without unreasonable complexity, latency or transferred bytes. Examples include difficult intersections across many changing dimensions or query shapes that genuinely benefit from SQL.

If D1 is added, store compact query/index rows there while retaining full recipe bodies/provenance in R2 unless later measurements demonstrate a better portable split.

## 5. Provider portability — hard architecture rule

No infrastructure provider is the canonical recipe source of truth.

Canonical corpus artefacts must remain reproducible/portable outside Cloudflare, for example as versioned JSONL/JSON, manifests, provenance/rights ledgers and deterministic index build inputs/outputs.

The app must access the corpus through app-owned interfaces (`RecipeSource` V2 / retrieval adapter), not Cloudflare-specific calls scattered throughout ranking/planner logic.

If Cloudflare changes pricing, limits, terms or product availability, migration must be possible without rewriting culinary truth:

```text
R2 -> S3-compatible/object store/static object hosting
Access -> another invitation-only identity/access provider
Worker -> another small API/edge/serverless adapter
D1 (if ever used) -> SQLite/Postgres/other SQL store
```

The recipes, IDs, provenance, licence states, source-family links and deterministic recommendation behavior must survive provider replacement.

## 6. Knowledge Core boundary preserved

Knowledge Core reinforces this architecture by requiring separable truth layers:

- broad recipe corpora add coverage; they do not become culinary truth merely by frequency;
- dish-family identity/structure/variant/transformation reasoning remains distinct from runtime recipe records;
- recipe provenance/licensing remains explicit;
- external corpus nutrition never automatically becomes authoritative `NutritionSource` evidence;
- hard dietary/allergen/permanent-exclusion gates run before softer recommendation preferences;
- private `DataRaul/knowledge-core` is never a browser runtime dependency;
- public behavior remains app-owned, deterministic and versioned.

The large corpus therefore remains a **retrieval universe**, not a model that overrides the existing evaluator.

## 7. Reuse-before-reinvent references — Cloudflare reconciliation

Use upstream examples as reference inputs, pin exact commits/releases before copying code, and preserve software notices/licences.

### C1 — `cloudflare/workers-sdk`

Primary official implementation/tooling reference for Workers, Wrangler, local Miniflare-style bindings and R2/D1/Pages development patterns. Use current official patterns rather than hand-rolling deployment/runtime binding machinery.

Research-time repository: `cloudflare/workers-sdk`.

### C2 — `cloudflare/templates`

Official template/reference repository for small Worker/Pages application structures. Use selectively for project bootstrapping patterns; do not migrate the Culinary architecture to a framework merely because a template uses one.

Research-time repository: `cloudflare/templates`.

### C3 — `cloudflare/cloudflare-docs`

Canonical product-behavior reference for Cloudflare Access policies, email allowlists/OTP, Worker protection, R2/D1 quotas and security semantics. Revalidate current limits/policy syntax at the implementation gate.

The official docs repository contains the Access policy material and Worker/Access JWT validation guidance.

### C4 — `cloudflare/pages-plugins` and official Access examples

Useful implementation reference for extracting/validating the `Cf-Access-Jwt-Assertion` boundary in Pages/Worker middleware. Prefer current Cloudflare-supported patterns and docs; do not copy historical plugin code blindly if superseded.

### Existing recipe/corpus references remain active

The detailed companion still governs:
- `smeet666/mcp-wikibooks-cookbook` — Wikimedia/Wikibooks parser/pacing patterns;
- `AdamBouhmad/open-recipe-archive` — provenance-first collection/JSONL/index design;
- `nerkyzas157/gamito` — design-only retrieve-first/hard-filter/deterministic planning pattern while code licence remains absent;
- `mealie-recipes/mealie` — mature feature/data-model comparator, not baseline dependency;
- the prior Firebase references — fallback/comparator only after this reconciliation.

## 8. Source-admission order unchanged

Architecture reconciliation does not weaken source-rights gates.

- **A — existing curated corpus + Wikibooks:** `PASS / ALREADY ESTABLISHED`.
- **B — Open Recipe Archive Spanish collection (~928):** `PASS-CANDIDATE / PREFERRED FIRST REAL PILOT`, after source-book/public-domain verification.
- **C — Open Recipe Archive complete corpus (54,843):** `PASS-CANDIDATE / PRIMARY LARGE-CORPUS BASE`, audited/admitted incrementally.
- **D — ForkRecipe + UniTools:** `PASS-CANDIDATE / CLEAN OPEN SUPPLEMENTS`, exact licence/version snapshots required.
- **E — RecipeDB (118,171):** `CONDITIONAL / SOURCE-COHORT SALVAGE GATE`, never all-or-nothing; only `ADMIT_RIGHTS_VERIFIED` records may enter.

Recipe Box, RecipeNLG and Recipe1M+ remain excluded from production under the current rights contract.

## 9. Cost constraint

Target: **€0 recurring infrastructure cost** for owner + a small invited-friends cohort.

Free-tier quotas are implementation-time constraints, not permanent assumptions. Revalidate Cloudflare Pages/Access/Workers/R2/D1 limits before production provisioning and record the measured fit.

No paid Cloudflare plan, paid search service, paid API, paid corpus licence or conventional hosted backend is pre-authorized. If a free architecture fails measured requirements, stop at a human cost/architecture gate with evidence and alternatives.

## 10. Eight-step program reconciliation

The original sequence remains valid, with these clarifications:

1. **Scale contract + synthetic benchmark — NEXT / READY.** Use the existing reviewed corpus as the golden oracle; create deterministic 1k/10k/50k/100k synthetic corpora. Measure candidate-index size, detail-object size, candidate-set cardinality, transferred bytes, local filter/rank latency, build time and validation cost. Model the accepted R2/pre-built-index architecture first. No Cloudflare account provisioning is required to begin.
2. **`RecipeSource` V2 compatibility.** V1/V2 behavioral parity before runtime replacement.
3. **Metadata/detail + portable object layout.** Define provider-neutral manifests/shards/index artefacts that map naturally to R2 but can move elsewhere.
4. **Indexed retrieval scale proof.** Prove pre-built deterministic index intersections first. Introduce D1 only if this test earns it.
5. **Generalized ingestion/control plane.** Reuse Gate F2 and recorded upstream parsing/provenance patterns.
6. **Incremental validation architecture.** Changed-record/shard/schema/golden-property testing; no routine 100k × full-profile matrix.
7. **Production-shaped real-source pilot.** Provision Cloudflare only when infrastructure proof is ready; configure exact-email Access allowlist; use B (~928 Spanish public-domain candidate records) only after rights audit. This is the first new large real-source runtime pilot.
8. **Measured population/readiness gate.** Scale B -> C -> D -> verified E cohorts only as rights, quality, retrieval, cost and behavior pass.

## 11. Next executable action / continuation contract

**NEXT ACTION: STEP 1 — CORPUS SCALE CONTRACT + SYNTHETIC BENCHMARK HARNESS.**

A continuation chat should:

1. fresh-reconcile `main`, open PRs, active branches and concurrent nutrition work;
2. treat this document plus `docs/ROADMAP.md` and `docs/CORPUS_SCALE_100K_REFERENCE_AND_SOURCE_ROADMAP.md` as the architecture/source contract;
3. preserve the current reviewed recipe corpus as the golden behavioral oracle;
4. implement only synthetic benchmark/scale-contract infrastructure first;
5. benchmark R2-style immutable object + pre-built index shapes locally/provider-neutrally before provisioning Cloudflare;
6. include acceptance thresholds and metrics sufficient to decide whether R2-only retrieval is viable;
7. keep D1 absent unless benchmark evidence earns a separate prototype;
8. make no real mass recipe ingestion, no public behavior change, no paid service, no weakening of licensing/provenance/nutrition rules and no private Knowledge Core runtime dependency;
9. preserve nutrition B24 work as a separate resumable lane and do not overwrite it;
10. before every write/merge, fresh-reconcile GitHub state again.

The user has accepted the Cloudflare target architecture and the invitation-only access policy. No further architecture-choice confirmation is required before Step 1. Cloudflare account/project/domain/Access provisioning remains a later human/setup gate when Step 7 is actually reached.