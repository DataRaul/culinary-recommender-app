# Legal Corpus First + Private Runtime Decision

Status: **OWNER-APPROVED ROADMAP ORDER / IMPLEMENTATION BOUNDARY**

Decision date: **2026-09-17**

This decision refines the Culinary App roadmap. Where an older roadmap section implies that Recipe Family, nutrition expansion, YouTube refinement, categorization, or recommendation sophistication should be optimized before the usable rights-cleared corpus is known, this decision controls the sequencing.

## 1. Primary milestone: establish the useful legal corpus first

The next product-level objective is to determine how far the app can scale using recipe content that is lawfully admissible for the exact storage, normalization, indexing, private display, and later-public-use path intended by the project.

The target is **not an arbitrary recipe count**. The output is the largest useful corpus earned by source rights, provenance, attribution/disclosure capability, quality, deduplication, technical capacity, and zero-billing constraints.

The source pipeline remains fail closed:

`source discovery -> rights/provenance review -> attribution/disclosure classification -> admit/hold/reject -> protected ingestion -> measured corpus baseline`

Only records/cohorts with an earned admission state enter the protected production corpus. Public/downloadable availability alone is not sufficient rights evidence.

Primary large-corpus work remains:

1. continue collection/source-work audits for Open Recipe Archive and ingest admitted cohorts incrementally;
2. add other clean public-domain/open-licensed supplements where they materially improve coverage;
3. treat RecipeDB as a separate provenance/rights salvage lane, admitting only defensible cohorts/records;
4. stop raw-count expansion when marginal coverage/quality no longer justifies ingestion/review cost or when technical/cost constraints intervene.

The corpus-baseline terminal must record at minimum:

- admitted recipe count and corpus version;
- source/cohort inventory;
- rights/reuse basis per cohort/record as required;
- provenance completeness;
- attribution/disclosure requirement and readiness;
- held/rejected cohorts and reasons;
- storage/retrieval/cost measurements;
- authentication/private-data boundary verification.

## 2. Downstream feature work follows the corpus baseline

Until `LEGAL_CORPUS_BASELINE_PASS` is earned, the following are not the primary roadmap lane and should not consume substantial implementation effort except where needed to preserve existing tests/contracts:

- Recipe Family synthesis / Carbonara-Hummus prototype;
- nutrition/vitamin coverage expansion across the new corpus;
- broad categorization/ontology enrichment;
- recommendation-quality optimization over the expanded corpus;
- YouTube recipe/technique refinement;
- other feature expansion dependent on the shape of the real corpus.

After the legal corpus baseline, the intended order is:

`legal corpus baseline -> corpus normalization/categorization -> nutrition/vitamin applicability audit -> recommendation readiness -> Recipe Family/adaptation -> YouTube/authoritative-evidence refinement -> further product features`

This does not erase completed nutrition, Recipe Family governance, YouTube, or recommendation work. It changes which lane is blocking for the next useful product milestone.

## 3. Public code, private corpus

The GitHub repository remains public for code, review history, schemas, migrations, deterministic builders, tests, public-safe provenance/licence machinery, and non-sensitive fixtures.

Protected recipe bodies, protected indexes, invitation identities, session secrets, and other private runtime state must not be stored in or published through GitHub unless independently classified as public-safe.

The recipe corpus lives in **private Cloudflare D1 runtime databases** behind the server-side Worker/Pages Function boundary. There must be no browser-direct or unauthenticated database access path.

The public application shell may remain reachable, but protected corpus functionality must require authenticated and authorized server-side access on every protected request.

The current approved authentication architecture remains **application-owned identity verification + exact allowlist + secure session**, rather than storing a custom shared/application password. A later explicit auth redesign may add a password flow, but private-corpus protection must not be weakened to do so.

Required runtime assertions:

- unauthenticated protected request -> deny before protected data read;
- authenticated but unauthorized identity -> deny;
- authorized active identity/session -> bounded protected access only;
- revoked identity/session -> deny;
- no protected recipe/index asset in ordinary public Pages/GitHub artifacts;
- secrets never committed to GitHub;
- Free-plan exhaustion fails closed and never widens access.

## 4. Legal/security interpretation boundary

Private/authenticated deployment reduces public-distribution exposure and is the intended containment model, but it does not create permission to ingest content that otherwise lacks an adequate legal/reuse basis. Source admission therefore remains rights-gated even though the database is private.

Unauthorized third-party intrusion is not an authorized distribution path and must not be modeled as one. Nevertheless, normal security, incident-response, and data-protection obligations remain separate concerns; the project must not encode a blanket assumption that a breach automatically eliminates every possible responsibility.

## 5. Relationship to existing gates

- Step 8G protected scale work is the principal execution lane toward `LEGAL_CORPUS_BASELINE_PASS`.
- Existing rights/provenance and attribution fail-closed gates remain controlling.
- Recipe Family P0 becomes **deferred pending legal corpus baseline**, not cancelled.
- Nutrition and YT-CUL remain independent and resumable, but are downstream product-priority lanes until the legal corpus baseline is known.
- Public recommendation activation remains separately gated; a private-corpus PASS does not automatically authorize broad public recipe publication.
- No paid infrastructure, third D1 shard, broader billing authority, or weakening of source-rights controls is authorized by this decision.
