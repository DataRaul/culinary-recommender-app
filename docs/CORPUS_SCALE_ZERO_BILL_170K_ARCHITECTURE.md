# Corpus Scale / 170k Zero-Bill Architecture

Status: **CANONICAL CURRENT ARCHITECTURE / USER-ACCEPTED COST CONSTRAINT / IMPLEMENTATION REBASELINE REQUIRED**

Decision date: **2026-09-05**

This document supersedes `docs/CORPUS_SCALE_CLOUDFLARE_ACCEPTED_ARCHITECTURE.md` for **runtime storage, cost model, scale target, and Step-7 provisioning order**. The older R2-first document remains useful historical lineage but is no longer authoritative for those dimensions. All existing source-rights, nutrition, allergen/dietary/permanent-exclusion, RecipeSource V2 portability, deterministic ranking/planning, Brain/Lab separation, and invitation-only access rules remain unchanged unless explicitly restated here.

## 1. Binding constraint

The infrastructure target is no longer merely `expected EUR 0 recurring cost`.

The hard requirement is:

> **Normal or abnormal application usage must not be able to create an automatic infrastructure overage charge. Free-plan exhaustion should fail closed rather than silently produce a bill.**

Therefore:

- **Cloudflare R2 is not authorized** for this deployment because enabling R2 requires a usage-based subscription that can bill over free-tier limits.
- Do not activate an R2 subscription merely because expected pilot usage is small.
- Do not enable paid Workers, paid D1, paid Access, paid APIs, paid corpus licences, or any auto-upgrade path without a new explicit human cost gate.

## 2. Required scale target

Production engineering target:

- **170,000 admitted recipes required capacity**;
- **250,000 synthetic stress/headroom target**;
- 250k is a stress test, not a population commitment.

The existing reviewed 84-recipe corpus remains the behavioral golden oracle. External recipe admission remains incremental and source-rights gated.

The synthetic benchmark ladder must become:

`1k -> 10k -> 50k -> 100k -> 170k -> 250k stress`

## 3. Canonical target architecture

```text
GitHub repository
  - source code / review / version history
  - schemas, source registry, provenance/rights ledgers
  - deterministic corpus/index builders
  - corpus manifests and hashes
  - NOT the 170k browser runtime warehouse
        |
        v
Cloudflare Pages
  - lightweight static Culinary UI
  - compact immutable pre-built retrieval/index shards
  - corpus/version manifest
        |
        v
Cloudflare Access
  - exact-email allowlist
  - email OTP / one-time PIN
  - no public registration
  - no domain-wide or Everyone rule
        |
        v
Workers Free / Pages Function gateway
  - authenticated bounded corpus API
  - fail closed when free-plan request/subrequest limits are exhausted
  - no full-corpus scans
        |
        v
D1 Free, deliberately sharded
  - bounded recipe-body store
  - provider-neutral portable recipe payloads
  - no SQL-everything design
        |
        v
RecipeSource V2
  - bounded retrieval only
        |
        v
existing deterministic hard filters
+ evaluator + scorer + planner
```

## 4. Why D1 Free is acceptable under the zero-bill rule

Implementation-time Cloudflare documentation was revalidated on 2026-09-05.

Workers Free / D1 current limits used by this architecture:

- **10 D1 databases** on Free;
- **500 MB maximum per database**;
- **5 GB maximum total D1 storage**;
- **5 million rows read/day**;
- **100,000 rows written/day**;
- **50 D1 subqueries per Worker invocation** on Free;
- when Free daily row-read/write limits are exceeded, **queries fail** until reset rather than being billed as paid overage;
- when the included storage limit is reached, new writes/schema/index changes fail until storage is reduced or the plan is explicitly upgraded.

Authoritative current references:

- `https://developers.cloudflare.com/d1/platform/limits/`
- `https://developers.cloudflare.com/d1/platform/pricing/`
- `https://developers.cloudflare.com/changelog/post/2026-09-01-d1-free-tier-limit-enforcement/`

This fail-closed behavior is the key reason D1 Free is preferred over R2 for this user's deployment constraint.

## 5. Deliberate internal safety budgets

Do not architect to Cloudflare's absolute maximums.

Initial production budgets:

- **<= 3.5 GB total D1 footprint at 170k**;
- **<= 350 MB in any one D1 database**;
- **one D1 database slot kept unused** for migration/emergency headroom;
- target **8 recipe-body shards** plus at most one control/catalogue DB;
- **<= 256 hydrated recipe candidates per user query**;
- no full table scans;
- no unindexed broad filtering in D1;
- no automatic paid-plan upgrade;
- fail closed on quota/resource exhaustion.

The existing Step-1 acceptance threshold of average serialized recipe detail <= 12 KiB implies approximately 1.95 GiB for 170k recipe bodies before SQLite/index overhead, so the 3.5 GB internal budget provides measured room for storage overhead. This is a hypothesis to validate, not permission to populate D1 before measurement.

## 6. Storage and query model

D1 is the **bounded detail store**, not the primary search engine.

Pre-built compact indexes remain the first-stage retrieval mechanism. Query flow remains:

```text
large corpus
-> compact deterministic posting/index shards
-> intersect candidate IDs
-> deterministic cap <= 256
-> group IDs by D1 shard
-> bounded primary-key/indexed detail reads
-> existing hard filters/evaluator/scorer/planner
```

The browser must never fetch or scan the complete corpus.

Avoid a highly normalized row explosion such as one row per ingredient/tag/provenance fact. The free write/read budgets favor approximately one primary recipe-body row per admitted recipe plus only the minimum D1 metadata required for safe bounded retrieval/versioning. Search postings should be produced as deterministic compact index artefacts unless benchmark evidence earns a different layout.

## 7. Cloudflare Pages role

Pages remains the application shell and static compact-index delivery layer, not the full canonical 170k warehouse.

Current Free Pages limits revalidated on 2026-09-05 include:

- up to **20,000 files/site**;
- **25 MiB maximum individual static asset**.

Reference: `https://developers.cloudflare.com/pages/platform/limits/`

These limits make compact static index shards viable, but storing all generated recipe bodies in Pages would couple corpus population to deployment/repository ergonomics. Therefore Pages-only corpus storage is a fallback, not the preferred baseline.

## 8. Workers Free role

Current Workers Free limits revalidated on 2026-09-05 include:

- **100,000 requests/day**;
- **10 ms CPU/request**;
- **128 MB memory**;
- **50 subrequests/request**.

Reference: `https://developers.cloudflare.com/workers/platform/limits/`

The gateway must be designed so resource exhaustion produces an unavailable/error state rather than bypassing authentication or serving protected corpus functionality publicly.

## 9. Access remains invitation-only

Existing hard rule remains unchanged:

1. exact invited email addresses only;
2. email OTP / one-time PIN may authenticate identity;
3. valid email alone is insufficient without explicit allowlist membership;
4. no `Everyone` rule;
5. no wildcard/public-domain allow rule;
6. no OTP-only broad Include rule;
7. removal from the allowlist revokes future access;
8. protected corpus API routes must remain behind the Access identity boundary;
9. public GitHub source visibility does not grant production membership.

## 10. Rebaseline before provisioning D1

Steps 1–6 remain valid as implemented evidence, but their 100k/R2 physical assumptions must be **extended/reconciled**, not blindly reused for production provisioning.

Before D1 resources are created, repository work must:

1. extend synthetic scale runs through **170k required + 250k stress**;
2. add a provider-neutral D1-shard/storage simulator;
3. measure estimated SQLite/D1 storage overhead, per-shard distribution, row/read/write shape, query grouping and subrequest count;
4. enforce the internal <=3.5 GB total and <=350 MB/shard budgets;
5. prove candidate hydration remains <=256 and no query requires >50 D1 subqueries;
6. preserve V1/V2 behavioral parity and existing hard-filter semantics;
7. prove incremental population can respect the 100k Free write-row/day limit without weakening source review/admission;
8. classify any failure before changing architecture.

Terminal outcomes:

- `ZERO_BILL_170K_D1_ARCHITECTURE_PASS`
- `REBASELINE_REQUIRED_NO_D1_PROVISIONING`

A PASS authorizes the human account-side creation of the required **Free D1** databases. It does not authorize paid upgrade.

## 11. Revised Step 7 sequence

### Step 7A — zero-bill 170k architecture rebaseline

Repository-only and autonomous:

- extend 100k tests to 170k/250k;
- simulate D1 sharding/storage/read/write/subrequest budgets;
- update portable layout/adapters where required;
- run normal repository validation/benchmarks;
- stop on failed zero-bill capacity gates rather than provisioning infrastructure.

### Step 7B — Access security setup

Human/account-side:

- protect `culinary-recommender-app.pages.dev` with Cloudflare Zero Trust / Access;
- enable One-time PIN/email OTP;
- create an exact-email allow policy for the owner first;
- no Everyone/domain-wide rule.

This can be configured before 7A finishes because it does not commit the project to a paid storage service.

### Step 7C — Free D1 provisioning

Human/account-side **only after Step 7A PASS**:

- create the bounded Free D1 shard set specified by the measured implementation;
- do not upgrade Workers/D1 to paid;
- do not create R2.

### Step 7D — production-shaped real-source pilot

After 7A PASS + Access configured + D1 Free resources exist:

- use the first rights-clean 500–1000-record source cohort;
- current leading candidate remains ForkRecipe unless another source earns precedence through rights/data-quality audit;
- pass all records through the generalized Step-5 admit/hold/reject control plane;
- upload/admit only approved portable recipe bodies and compact indexes;
- measure real Worker/D1 requests, rows read/written, latency, transfer, storage and behavioral parity;
- fail closed on quota exhaustion;
- no paid infrastructure.

## 12. Provider portability remains mandatory

No Cloudflare product becomes culinary truth or the canonical corpus representation.

Canonical corpus artefacts remain reproducible as provider-neutral JSON/JSONL/manifests/provenance/rights ledgers/index-build inputs and outputs. `RecipeSource` V2 remains the abstraction boundary.

A future provider migration must not rewrite recipe IDs, source provenance, licence state, nutrition semantics, hard filters, evaluator/scorer/planner behavior, or Knowledge Core boundaries.

## 13. Human/cost authority

Authorized now:

- normal repository implementation/PR/CI/benchmarks under `AGENTS.md`;
- current Cloudflare Pages project already created;
- configuring Access under the existing exact-email security requirement.

Not authorized now:

- activating R2 subscription;
- creating D1 before the 170k/250k rebaseline passes;
- upgrading Workers/D1/Access to paid;
- paid API/corpus licence/backend;
- weakening any source-rights, nutrition, allergen, exclusion or public-export gate.

## 14. Immediate next actions

Repository lane:

`STEP_7A_ZERO_BILL_170K_ARCHITECTURE_REBASELINE` — **READY**.

Human lane:

`STEP_7B_ACCESS_EXACT_EMAIL_OTP_SETUP` — **PENDING**.

D1 provisioning:

`STEP_7C_FREE_D1_PROVISIONING` — **BLOCKED UNTIL STEP_7A PASS**.

R2:

`REJECTED_FOR_CURRENT_ZERO_BILL_CONSTRAINT / DO_NOT_ACTIVATE`.
