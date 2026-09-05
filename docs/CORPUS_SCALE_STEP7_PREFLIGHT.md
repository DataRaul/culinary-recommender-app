# Corpus Scale / 100k Readiness — Step 7 Preflight

Status: **PREFLIGHT COMPLETE / CLOUDFLARE HUMAN SETUP GATE / NO REAL-SOURCE ADMISSION YET**

Date: 2026-09-05

Baseline app `main`: `8495b451beb26a3f7ca5f196bcca41144964ffc9` (Corpus Scale Step 6 merged after green full repository/browser validation).

This preflight is governed by `docs/CORPUS_SCALE_CLOUDFLARE_ACCEPTED_ARCHITECTURE.md`, `docs/ROADMAP.md`, and `docs/CORPUS_SCALE_100K_REFERENCE_AND_SOURCE_ROADMAP.md`.

It does not authorize mass ingestion, public runtime activation, D1, a paid Cloudflare plan, a paid corpus/API, or any weakening of source/provenance/nutrition/hard-filter rules.

## 1. Step 7 entry gate

Infrastructure Steps 1–6 are now implemented and merged. Step 7 is therefore the first production-shaped gate that may use a new real source, but only after:

1. source rights/reuse evidence passes;
2. Cloudflare Pages + Access + Worker + R2 are provisioned under the accepted invitation-only contract;
3. the exact-email allowlist is configured fail-closed;
4. the Worker/R2 path is measured against the already-built RecipeSource V2, portable-object, indexed-retrieval, generalized-ingestion, golden-retention, and incremental-validation contracts.

The existing public GitHub Pages runtime is not the protected Step 7 production endpoint.

## 2. Cloudflare implementation-time revalidation

Official Cloudflare material was rechecked on 2026-09-05 because the accepted architecture explicitly requires current limits/policy syntax to be revalidated at the implementation gate.

### Access / invitation-only fit

Current official references:

- One-time PIN: https://developers.cloudflare.com/cloudflare-one/integrations/identity-providers/one-time-pin/
- Access policy semantics and misconfiguration warnings: https://developers.cloudflare.com/cloudflare-one/access-controls/policies/
- Common Access policies: https://developers.cloudflare.com/cloudflare-one/access-controls/policies/common-policies/
- Access product pricing: https://www.cloudflare.com/sase/products/access/

Current fit:

- Cloudflare explicitly supports OTP login and says an individual user may be granted access by adding their email address to an Access policy.
- The free Access plan is currently advertised for teams under 50 users, consistent with the accepted owner + small invited-friends target.
- `Login Methods: One-time PIN` must **not** be used as a broad `Include` rule by itself. Cloudflare documents that this can admit anyone with a valid email address.
- The Culinary policy therefore remains exact-email allowlist first, with OTP as the authentication method. No wildcard public domain, `Everyone`, or all-valid-email rule is acceptable.

### Worker / R2 free-tier fit

Current official references:

- Workers limits: https://developers.cloudflare.com/workers/platform/limits/
- Workers pricing: https://developers.cloudflare.com/workers/platform/pricing/
- R2 pricing: https://developers.cloudflare.com/r2/pricing/
- R2 limits: https://developers.cloudflare.com/r2/platform/limits/
- Pages/Functions R2 bindings: https://developers.cloudflare.com/pages/functions/bindings/

Current recorded free-tier constraints include:

- Workers Free: 100,000 requests/day, 10 ms CPU per invocation, 128 MB memory;
- R2 Standard free tier: 10 GB-month storage, 1 million Class A operations/month, 10 million Class B operations/month, free egress;
- Pages Functions use Workers billing/limits;
- R2 bindings are supported directly from Pages Functions/Workers.

These limits are sufficient on paper for a 500–1,000-record pilot and a small invited cohort, but Step 7 must measure actual request counts, CPU, object reads, latency, transferred bytes, and storage before claiming the zero-recurring-cost target is proven.

No paid Cloudflare plan is authorized. If measured use cannot stay within the accepted free architecture, stop at a human cost/architecture gate.

## 3. Source B audit — Open Recipe Archive Spanish collection

Pinned upstream snapshot:

- repository: `AdamBouhmad/open-recipe-archive`
- commit: `ae3bd2c009a8899dfe63b9166fa98ae3fa8041a8`
- Spanish manifest: `collections/cocina-espanola/manifest.json`
- recorded size: 928 recipes
- manifest source years: 1888 and 1894
- named source works: `La mesa moderna` (1888) and `El Practicón` (1894)

Upstream repository evidence:

- README describes the exported historical corpus as sourced from public-domain/copyright-safe materials and says historical records default to `public-domain` unless labeled otherwise.
- `LICENSE.md` contains an Unlicense-style public-domain dedication, but its text expressly describes **software**.
- Spanish recipe records themselves carry `license: public-domain` and source metadata.

### Base historical work evidence

`El Practicón`:

- sample upstream record: `collections/cocina-espanola/recipes/ajo-blanco-white-garlic-soup.md`;
- source author recorded as Ángel Muro, source year 1894;
- Biblioteca Virtual Miguel de Cervantes / Universitat de Barcelona catalogues the 1894 work and marks the digitized original with Public Domain Mark 1.0 / `Domini públic`.

`La mesa moderna`:

- sample upstream record: `collections/cocina-espanola/recipes/alfajor-de-primera-calidad-first-quality-alfajor.md`;
- source author recorded as José Castro y Serrano, source year 1888;
- Biblioteca Nacional de España identifies the 1888 edition and the authors/pseudonyms, including Mariano Pardo de Figueroa (1828–1918) and José de Castro y Serrano (1829–1896).

The underlying nineteenth-century source works are therefore strong public-domain candidates. That does **not** automatically clear every modern digital/transformation layer.

### Blocking transformation-layer finding

The pinned Spanish collection is not merely a byte-for-byte reproduction of the Spanish originals. Sample records contain modern English titles, normalized English ingredient lists, and English numbered directions while pointing back to Spanish-language nineteenth-century sources.

The repository does not, in the inspected pinned materials, provide a sufficiently explicit per-record transformation provenance stating:

- who produced the English translation/normalization;
- whether it was human-, OCR-, script-, or model-produced;
- the exact transformation date/version;
- whether any independently copyrightable translation/editorial layer is explicitly dedicated or licensed as recipe **content**, rather than only the repository software;
- whether every selected digitization/transcription layer is reusable under the same claimed public-domain status.

One public library catalogue for a digital copy of `La mesa moderna` currently labels that digital item `In Copyright`, illustrating why source-work status and a particular modern digital representation cannot be conflated.

### Source B result

**`HOLD_RIGHTS_AMBIGUOUS` for the packaged Open Recipe Archive Spanish recipe bodies at this pinned snapshot.**

This is **not** a rejection of the underlying public-domain books and not a claim that the upstream project is infringing. It is a fail-closed Culinary admission decision under our stricter transformation-provenance contract.

Therefore:

- admit **0** Open Recipe Archive Spanish recipe bodies at this preflight;
- do not upload the 928 packaged records to R2;
- retain the source as a provenance/layout reference;
- Source B may return to `ADMIT_RIGHTS_VERIFIED` if the transformation/content-license chain becomes explicit, or if we independently derive a bounded pilot from a verified public-domain source representation with our own recorded transformation provenance.

## 4. Clean fallback candidate — ForkRecipe

Pinned upstream snapshot:

- repository: `futurechef/forkrecipe-recipes`
- commit: `c32255266af39bd77444d39452f3df8088ac8fd9`
- recorded size: 916 recipes

The pinned README expressly says this repository is the **data layer / recipe content**, that content is originally authored or adapted from public-domain sources, and that **all recipes are licensed CC BY-SA 4.0**. The repository includes the full CC BY-SA 4.0 licence text.

This materially reduces the transformation-rights ambiguity found in Source B and naturally fits the planned 500–1,000-record Step 7 pilot size.

Current status: **`PASS_CANDIDATE_RIGHTS_DECLARATION / DATA_QUALITY_AND_ADAPTER_AUDIT_STILL_REQUIRED`**.

Before any ForkRecipe record is admitted, Step 7 must still verify:

1. the exact pinned file/schema set and deterministic record count;
2. attribution fields sufficient for CC BY-SA 4.0 compliance;
3. transformation/source metadata available per record where needed;
4. media exclusion unless separately cleared;
5. parse/normalize coverage and fail-closed handling of unsupported units/ingredients;
6. duplicate/variant behavior against the existing curated/Wikibooks corpus;
7. external nutrition remains non-authoritative;
8. recommendation-state admission remains separate from raw ingestion.

The fallback does not bypass the generalized Step 5 control plane or Step 6 validation architecture.

## 5. Step 7 human setup gate

The remaining blocking dependency is real Cloudflare account provisioning. No connected Cloudflare management capability is available in this session, and account/security configuration requires owner authority.

Required owner-side setup is intentionally minimal and must stay on the free architecture:

1. create/connect the Cloudflare Pages project to `DataRaul/culinary-recommender-app`;
2. create one R2 Standard bucket for the pilot corpus;
3. enable Cloudflare Zero Trust / Access on the protected production hostname;
4. enable One-time PIN as the login method;
5. create an **exact-email** allow policy containing only invited addresses (initially the owner address is sufficient for validation);
6. do not add `Everyone`, broad email-domain, or OTP-only Include rules;
7. provide the Worker/Pages project with the R2 binding required by the repository deployment configuration once that configuration is introduced;
8. do not enable a paid Workers/Access/R2 plan or D1.

No email address, API token, account ID, secret, or credential should be committed to GitHub.

## 6. Next executable action after the human setup gate

Once the Cloudflare project/Access/R2 resources exist, continue autonomously with:

1. add the minimal Cloudflare deployment/runtime adapter using official current Wrangler/Workers patterns;
2. protect every corpus API route behind the Access identity boundary;
3. validate exact-email denial/allow behavior;
4. run a bounded real-source adapter pilot, preferring the first rights-clean ~500–1,000-record cohort (currently ForkRecipe unless Source B rights evidence is repaired first);
5. upload only admitted portable versioned objects/indexes to R2;
6. run V1/V2 golden parity, hard-filter, provenance, incremental-validation, latency/read-count/CPU/storage measurements;
7. keep D1 absent unless R2 + pre-built indexes fail the measured retrieval contract;
8. only after Step 7 passes, enter Step 8 measured population/readiness expansion.

Until that setup exists, Step 7 remains **blocked at a genuine human/security setup gate**, with no real-source runtime activation.
