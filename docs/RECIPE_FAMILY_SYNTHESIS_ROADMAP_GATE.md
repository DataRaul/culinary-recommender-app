# Recipe Family Synthesis P0 — Roadmap Gate

Status: **ACTIVE / CONTRACT MERGED / COMPLIANCE HARDENING IMPLEMENTED / PROTOTYPE NEXT**

This gate formalizes the unlock sequence for `docs/RECIPE_FAMILY_SYNTHESIS_P0.md`, `docs/RECIPE_FAMILY_SOURCE_COMPLIANCE_GATE.md` and `config/recipe_family_synthesis_p0.json`.

## Unlock sequence

1. **P0 contract merged** — COMPLETE.
   - Knowledge Core reusable policy merged.
   - Culinary action contract and machine-readable config merged.
   - No production or public activation authority.

2. **Source-compliance hardening** — IMPLEMENTED / REQUIRED BEFORE AUTOMATED GATHERING.
   - Mandatory source gate distinguishes `MANUAL_REVIEW`, `AUTOMATED_TDM`, `API_OPEN_DATA` and `LICENSED_REUSE`.
   - Automated gathering fails closed unless lawful access, applicable Terms state, current TDM-reservation evidence, individual database-extraction risk and cumulative publisher/database extraction risk pass.
   - Persistent source expression is prohibited for standard-copyright evidence; transient fetched expression must be deleted after normalization.
   - `scripts/validate-recipe-family-source-compliance.mjs` provides the deterministic preflight.
   - A failed source blocks that source, not the dish family.

3. **Two-family deterministic prototype** — NEXT.
   - Families: `carbonara`, `hummus`.
   - Required order: `source eligibility preflight -> bounded observation acquisition -> family synthesis -> expression-independence validation -> prototype report -> Consultant/Coach review`.
   - Build factual observation normalization, family synthesis, reference/observed/recommended ranges, variant classification, provenance, validation report and one candidate app-owned recipe projection per eligible family.
   - Measure legal/source blocks, operator effort, contradictions, unresolved facts, cumulative publisher extraction and whether additional source collection has positive information gain.

4. **P0 prototype review gate** — BLOCKING.
   - Run existing Consultant + Project Coach challenge.
   - Consultant must challenge whether source/legal controls are proportionate, reference claims exceed evidence, variants are noise, additional collection has positive information gain, and synthesis outperforms duplicate source storage.
   - Project Coach must verify sequencing, explicit terminal evidence, cumulative extraction control, absence of protected expression from persistent objects, and preservation of the public/private runtime firewall.
   - Neither role creates legal permission, production authority or public activation authority.

5. **10-family bounded expansion** — UNLOCKED ONLY ON PROTOTYPE PASS.
   - Expand only if the two-family prototype demonstrates useful stable ranges, practical recipe quality, manageable source/compliance effort and clean provenance.
   - Expansion remains bounded; there is no raw recipe-count target and no mass crawling authority.

6. **App-authoring candidate gate** — EARNED PER FAMILY, NOT GLOBALLY.
   - A family may earn `APP_AUTHORING_ELIGIBLE` only under the existing contract.
   - This permits a project-authored candidate recipe object to enter existing `RecipeSource` / evaluator / planner review gates.

7. **Public recommendation activation** — SEPARATELY GATED.
   - P0 pass, 10-family expansion, or `APP_AUTHORING_ELIGIBLE` do **not** authorize public recommendation activation, production population changes, shard changes, billing, or nutrition-authority widening.

## Prototype PASS criteria

The two-family prototype passes only if both the system and compliance model are usable:

- source legal/use state can be classified without disproportionate manual work;
- automated sources have passed the deterministic compliance preflight;
- Terms/TDM evidence is current enough for the acquisition mode;
- cumulative extraction from any publisher/database remains bounded and low-risk under the operational gate;
- no protected third-party prose/media is required in persistent recipe objects;
- bounded factual observations can be normalized with provenance;
- reference, observed and recommended ranges remain distinct;
- required ingredient roles and technique sequence are coherent;
- variants/adaptations are distinguishable from the reference profile;
- generated app-owned instructions are original project expression;
- at least one family earns a credible `APP_AUTHORING_ELIGIBLE` candidate, or the report explains why the architecture is still worth continuing despite neither earning it;
- Consultant/Coach review does not identify a material unresolved governance, source-rights, safety or execution failure.

## Prototype FAIL / REDESIGN outcomes

Do not expand automatically if:

- legal/source review effort is disproportionate to culinary value;
- automated acquisition would violate an applicable rights reservation, licence, Terms restriction or platform restriction;
- publisher-level cumulative extraction becomes material or cannot be assessed;
- the method drifts toward reconstructing a third-party database;
- stable useful ranges cannot be obtained from bounded independent evidence;
- recipe quality is not better than direct project authoring plus validation;
- source expression would need to be copied to make the output useful;
- identity/variant/adaptation boundaries remain materially unstable.

A failed source blocks that source, not the dish family. A failed prototype blocks expansion until redesigned.

## Legal re-review triggers

Re-run the legal/source review before widening the lane when any of these materially changes:

- manual acquisition becomes automated;
- a new commercial recipe platform/database becomes a material source;
- Terms, licence or TDM reservation changes;
- per-publisher extraction volume rises materially;
- raw source-text retention widens beyond transient normalization;
- the product becomes broadly public, commercial or materially multi-user;
- source-derived prose/media begins to be exposed rather than project-owned expression.

## Relationship to Step 8G

This lane is additive and parallel to Step 8G. It must not mutate:

- protected production population;
- active Step 8G state;
- shard topology;
- public runtime recipe count;
- billing state;
- nutrition authority policy.

The intended progression is therefore:

`contract -> source compliance preflight -> 2-family prototype -> measured compliance + recipe-quality review -> bounded 10-family expansion -> per-family app-authoring candidates -> existing downstream gates`

not:

`contract -> mass ingestion -> public runtime`.
