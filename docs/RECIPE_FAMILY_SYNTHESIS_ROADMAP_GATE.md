# Recipe Family Synthesis P0 — Roadmap Gate

Status: **ACTIVE GOVERNANCE / IMPLEMENTATION DEFERRED PENDING LEGAL_CORPUS_BASELINE_PASS**

This gate formalizes the Recipe Family controls and now inherits the owner-approved sequencing decision in:

- `docs/LEGAL_CORPUS_FIRST_PRIVATE_RUNTIME_DECISION.md`;
- `config/legal_corpus_first_private_runtime.json`;
- `docs/RECIPE_FAMILY_SYNTHESIS_P0.md`;
- `docs/RECIPE_FAMILY_SOURCE_COMPLIANCE_GATE.md`;
- `docs/RECIPE_FAMILY_PREDEVELOPMENT_GOVERNANCE_CLOSEOUT.md`;
- `docs/RECIPE_FAMILY_UI_LEGAL_CONFORMANCE_GATE.md`;
- `config/recipe_family_synthesis_p0.json`;
- `config/recipe_family_ui_legal_conformance_gate.json`.

## 2026-09-17 sequencing decision

Recipe Family synthesis remains approved as a downstream quality/adaptation layer, but it is no longer the next product-development lane.

The blocking product milestone is now:

`rights/source qualification -> attribution/provenance classification -> rights-clean protected ingestion -> LEGAL_CORPUS_BASELINE_PASS`

Only after that baseline is known should substantial Recipe Family implementation resume. This avoids optimizing family synthesis, nutrition, categorization, recommendation logic or YouTube refinement against a corpus shape that may materially change after the large-source rights audit.

The public GitHub repository remains code/review infrastructure. Protected recipe bodies and protected indexes remain private runtime data behind the authenticated Worker/D1 boundary. Private deployment is a containment/security boundary, not a substitute for lawful source admission.

## Unlock sequence

1. **P0 contract merged** — COMPLETE.
   - Knowledge Core reusable policy merged.
   - Culinary action contract and machine-readable config merged.
   - No production or public activation authority.

2. **Source-compliance hardening** — COMPLETE.
   - Mandatory source gate distinguishes `MANUAL_REVIEW`, `AUTOMATED_TDM`, `API_OPEN_DATA` and `LICENSED_REUSE`.
   - Generic web scraping/crawling is **not an authorized lane**.
   - No access-control/technical-restriction bypass, Terms evasion or account rotation to defeat limits is authorized.
   - Automated TDM fails closed unless lawful access, applicable Terms state, current TDM-reservation evidence, individual database-extraction risk and cumulative publisher/database extraction risk pass.
   - Persistent source expression is prohibited for standard-copyright evidence; transient fetched expression must be deleted after normalization.
   - `scripts/validate-recipe-family-source-compliance.mjs` provides the deterministic preflight.
   - A failed source blocks that source, not the dish family.

3. **Pre-development governance closeout** — COMPLETE.
   - Family evidence acquisition is a **one-time bounded baseline by default**, not a scheduled refresh product.
   - Per family target remains one strong reference where available plus approximately 3–5 independent practical preparations/observations.
   - Those observations should normally represent independent preparations/sources, not repeated runs against one publisher.
   - Stop when identity, ranges, variants and execution confidence stabilize; another collection wave requires an explicit evidence/legal/owner trigger.
   - Internal provenance is always required.
   - When licence/permission/API/Terms requires public attribution, the public/reusable path must prove it can display the required attribution before admission.
   - If required public attribution cannot be satisfied, reject that public/reusable use.
   - The public GitHub repository is treated as public disclosure: protected third-party expression may not be committed merely because the runtime database/app is access-gated.
   - The intent/disclaimer language is governance, not a claimed legal defence.

4. **Legal corpus foundation** — NEXT / BLOCKING.
   - Step 8G rights-clean protected scale becomes the principal execution lane.
   - Continue source/cohort rights and provenance audits, prioritizing Open Recipe Archive collection-by-collection and treating RecipeDB as an independent salvage lane.
   - Admit only records/cohorts that earn the applicable rights/reuse state; public/downloadable availability alone is insufficient.
   - Preserve per-source/cohort provenance and attribution/disclosure state.
   - Protected recipe bodies/indexes stay out of GitHub and remain in private D1 runtime databases behind server-side authentication/authorization.
   - Earn `LEGAL_CORPUS_BASELINE_PASS` with the admitted count, source inventory, rights/attribution states, held/rejected reasons, storage/retrieval measurements and private-access verification.
   - Raw count is an output, not a success criterion.

5. **Two-family deterministic prototype** — DEFERRED UNTIL `LEGAL_CORPUS_BASELINE_PASS`.
   - Families remain `carbonara`, `hummus`.
   - Required order remains: `source eligibility preflight -> bounded one-time observation acquisition -> family synthesis -> expression-independence validation -> attribution-requirement validation -> prototype report -> Consultant/Coach review`.
   - Build factual observation normalization, family synthesis, reference/observed/recommended ranges, variant classification, provenance, attribution requirements, validation report and one candidate app-owned recipe projection per eligible family.
   - Measure legal/source blocks, operator effort, contradictions, unresolved facts, cumulative publisher extraction and whether additional source collection has positive information gain.
   - No recurring Carbonara/Hummus refresh is scheduled or implied.

6. **P0 prototype review gate** — BLOCKING AFTER PROTOTYPE.
   - Run existing Consultant + Project Coach challenge.
   - Consultant must challenge whether source/legal controls are proportionate, reference claims exceed evidence, variants are noise, additional collection has positive information gain, synthesis outperforms duplicate source storage, and 100k readiness is not being confused with rights-cleared source volume.
   - Project Coach must verify sequencing, explicit terminal evidence, cumulative extraction control, absence of protected expression from persistent objects/public repo, attribution fail-closed behavior, no unearned refresh loop, and preservation of the public/private runtime firewall.
   - Neither role creates legal permission, production authority or public activation authority.

7. **10-family bounded expansion** — UNLOCKED ONLY ON PROTOTYPE PASS.
   - Expand only if the two-family prototype demonstrates useful stable ranges, practical recipe quality, manageable source/compliance effort and clean provenance.
   - Expansion remains bounded; there is no raw recipe-count target and no mass crawling authority.
   - Each family receives its own one-time bounded baseline unless a later explicit research trigger earns more collection.

8. **App-authoring candidate gate** — EARNED PER FAMILY, NOT GLOBALLY.
   - A family may earn `APP_AUTHORING_ELIGIBLE` only under the existing contract.
   - This permits a project-authored candidate recipe object to enter existing `RecipeSource` / evaluator / planner review gates.
   - Evidence sources do not automatically become the displayed recipe source; display obligations follow the actual reuse/licence/permission/Terms basis.

9. **UI legal-conformance gate** — BLOCKING WHEN REAL CANDIDATE OBJECTS EXIST.
   - Trigger when the first real `APP_AUTHORING_ELIGIBLE` candidate exists with classified source rights/provenance and public-attribution state; do not build speculative licence UI before useful objects exist.
   - Use real candidate recipe/source/provenance/attribution objects as browser and renderer fixtures, plus synthetic negative fixtures exercising `UNSATISFIABLE` and `UNKNOWN` states.
   - This gate does **not** decide source legality again. It revalidates that the UI implements the already-encoded legal/source result correctly.
   - Required cases include: attribution not required; attribution required and ready; attribution required but unsatisfiable; and attribution requirement/state unknown.
   - When attribution is required and ready, render every field required by the encoded basis, including source/creator label, source link where applicable, licence/permission basis and transformation/modification notice where applicable.
   - `UNSATISFIABLE` or `UNKNOWN` must fail closed: no public/reusable recipe rendering or admission.
   - Tests must also prove that protected third-party expression cannot leak from evidence/provenance objects and that a new source class is not considered supported merely because the Wikibooks-specific renderer works.
   - Required layers: object/schema validation -> renderer unit test -> browser acceptance with real candidate objects -> negative browser fixtures -> public-runtime fail-closed assertion.
   - Required terminal state before public/reusable admission for the tested source class: `RECIPE_FAMILY_UI_LEGAL_CONFORMANCE_PASS`.

10. **Public recommendation activation** — SEPARATELY GATED.
   - Legal corpus baseline, P0 pass, 10-family expansion, `APP_AUTHORING_ELIGIBLE`, or UI legal-conformance PASS do **not** by themselves authorize broad public recommendation activation.
   - Before a new attribution-bearing source class can become public, the UI legal-conformance gate must have passed for representative real objects from that class.
   - The existing Wikibooks-specific CC BY-SA provenance renderer does not by itself prove support for every future licence/source class.

## Prototype PASS criteria

The two-family prototype passes only if both the system and compliance model are usable:

- `LEGAL_CORPUS_BASELINE_PASS` has already been earned;
- source legal/use state can be classified without disproportionate manual work;
- no generic scraping/crawling path is used;
- automated sources have passed the deterministic compliance preflight;
- Terms/TDM evidence is current enough for the acquisition mode;
- cumulative extraction from any publisher/database remains bounded and low-risk under the operational gate;
- no protected third-party prose/media is required in persistent recipe objects or public-repo artifacts;
- bounded factual observations can be normalized with provenance;
- public-attribution requirement is classified for every eligible source;
- required-but-unsatisfiable public attribution fails closed;
- reference, observed and recommended ranges remain distinct;
- required ingredient roles and technique sequence are coherent;
- variants/adaptations are distinguishable from the reference profile;
- generated app-owned instructions are original project expression;
- one-time family baseline is sufficient or the report identifies the exact trigger earning more evidence;
- at least one family earns a credible `APP_AUTHORING_ELIGIBLE` candidate, or the report explains why the architecture is still worth continuing despite neither earning it;
- Consultant/Coach review does not identify a material unresolved governance, source-rights, safety or execution failure.

## Prototype FAIL / REDESIGN outcomes

Do not expand automatically if:

- legal/source review effort is disproportionate to culinary value;
- implementation introduces generic scraping/crawling or access-control circumvention;
- automated acquisition would violate an applicable rights reservation, licence, Terms restriction or platform restriction;
- publisher-level cumulative extraction becomes material or cannot be assessed;
- the method drifts toward reconstructing a third-party database;
- stable useful ranges cannot be obtained from bounded independent evidence;
- recipe quality is not better than direct project authoring plus validation;
- source expression would need to be copied to make the output useful;
- required public attribution cannot be rendered for the intended public/reusable use;
- identity/variant/adaptation boundaries remain materially unstable.

A failed source blocks that source, not the dish family. A failed prototype blocks expansion until redesigned.

## Relationship to large-corpus / 100k readiness

The canonical source/licensing map remains `docs/CORPUS_SCALE_100K_REFERENCE_AND_SOURCE_ROADMAP.md`.

Important interpretation:

- `100k readiness` is a storage/retrieval/validation capacity target, not a promise of one 100k rights-cleared source;
- Open Recipe Archive (~54,843 recorded recipes) remains the primary large-corpus candidate after collection/source-book audits;
- RecipeDB (~118,171 records) remains a conditional salvage lane, not automatically reusable merely because the dataset is public/downloadable;
- the final admitted count may be below or above 100k;
- Recipe Family Synthesis is a **quality/adaptation layer** on top of a rights-clean base corpus, not the source of scale itself;
- under the 2026-09-17 owner decision, the rights-clean corpus baseline is now a blocking predecessor to substantial Recipe Family implementation.

Intended relationship:

`rights-clean large corpus -> LEGAL_CORPUS_BASELINE_PASS -> family/variant/technique evidence -> app-owned normalization/adaptation -> existing app gates`

not:

`third-party recipe sites -> scraping -> synthetic 100k corpus`.

## YouTube / authoritative culinary-source relationship

YouTube evidence may help refine technique, family boundaries, recurring variants, ranges or adaptations for recipes/families already represented in the rights-clean corpus after the legal corpus baseline.

It remains evidence-only by default:

- no automated scraping of the YouTube website;
- no unofficial transcript scraping/downloading or media warehousing;
- use manual review or explicitly permitted API/data paths under their applicable terms;
- retain internal video/channel provenance and relevant timestamp/segment when practical;
- do not retain creator expression unless separately licensed;
- preserve independent non-YouTube corroboration and `rightsProvenanceSafetyClear=true` before app-authoring eligibility.

YouTube authority can strengthen an evidence claim; it does not turn a creator's recipe into app-owned reusable content.

## Legal re-review triggers

Re-run the legal/source review before widening or reacquiring when any of these materially changes:

- manual acquisition becomes automated;
- a new commercial recipe platform/database becomes a material source;
- Terms, licence or TDM reservation changes;
- per-publisher extraction volume rises materially;
- raw source-text retention widens beyond transient normalization;
- the product becomes broadly public, commercial or materially multi-user;
- source-derived prose/media begins to be exposed rather than project-owned expression;
- a new public attribution/disclosure obligation appears;
- a previously reviewed source is reacquired under materially changed conditions;
- the UI gate discovers an obligation that the current object model cannot represent.

## Relationship to Step 8G

Recipe Family governance remains valid and can be maintained in parallel, but substantial implementation is deferred while Step 8G earns the legal corpus baseline.

The intended progression is now:

`rights/source qualification -> rights-clean protected Step 8G scale -> LEGAL_CORPUS_BASELINE_PASS -> corpus normalization/categorization -> nutrition/vitamin applicability audit -> recommendation readiness -> 2-family one-time prototype -> measured compliance + recipe-quality review -> bounded 10-family expansion -> per-family app-authoring candidates -> UI legal-conformance PASS on real candidate objects -> existing downstream/public gates`

This sequence preserves completed work while making the real legal corpus the next blocking product milestone.
