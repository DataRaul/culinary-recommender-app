# Recipe Family Synthesis P0 — Pre-development Review Record

Status: **PASS / READY FOR BOUNDED CARBONARA + HUMMUS PROTOTYPE**

Reviewed: 2026-09-17

This record captures the pre-development reconciliation requested by the owner across current Culinary project truth, Knowledge Core, current Spanish/EU legal/source controls, Consulting and Project Coach. It does not grant public activation authority and is not a formal legal opinion.

## Inputs reviewed

### Culinary repository

- `docs/RECIPE_FAMILY_SYNTHESIS_P0.md`
- `docs/RECIPE_FAMILY_SOURCE_COMPLIANCE_GATE.md`
- `docs/RECIPE_FAMILY_PREDEVELOPMENT_GOVERNANCE_CLOSEOUT.md`
- `docs/RECIPE_FAMILY_SYNTHESIS_ROADMAP_GATE.md`
- `config/recipe_family_synthesis_p0.json`
- `scripts/validate-recipe-family-source-compliance.mjs`
- `docs/CORPUS_SCALE_100K_REFERENCE_AND_SOURCE_ROADMAP.md`
- current YouTube Culinary rights/provenance bridge behavior
- current public source-attribution UI behavior

### Knowledge Core

Canonical reusable culinary policy reviewed:

- `DataRaul/knowledge-core/domains/culinary_nutrition/objects/recipe_family_synthesis_and_validation.md`

The Knowledge Core policy already establishes:

- source recipes are evidence rather than canonical recipe objects;
- one strong reference source where available;
- approximately 3–5 independent practical preparations;
- information-gain stopping when added observations no longer change identity, ranges, variants or execution confidence;
- normalized factual observations rather than copied prose/media;
- bounded lawful source-use checks;
- no mass crawling;
- no automatic public export;
- Consultant/Coach challenge before expansion.

### Legal/source anchors

Current primary/source terms reviewed on 2026-09-17:

- Spain — Real Decreto-ley 24/2021, Article 67, text/data mining of lawfully accessible works and express rights reservation;
- Spain — Texto Refundido de la Ley de Propiedad Intelectual, Articles 133–135, database extraction/reuse, repeated/systematic extraction and exceptions;
- Creative Commons BY-SA 4.0 attribution/change/ShareAlike obligations;
- YouTube Terms of Service automated-access/content-use restrictions;
- YouTube API Services Terms for authorized API use, third-party rights, attribution/notices and content-right limits.

## Review conclusions

### 1. Generic scraping/crawling

**PASS — explicitly excluded.**

No generic third-party recipe-site scraping or crawling is authorized. Source automation must fit a named governed path (`AUTOMATED_TDM`, `API_OPEN_DATA`, `LICENSED_REUSE`) and pass its source-specific controls. No bypass of access controls, technical restrictions, Terms or rate limits is authorized.

The project statement of lawful intent is useful governance but is not treated as a legal defence.

### 2. One-time family acquisition

**PASS — one-time bounded baseline is the default.**

For Carbonara and Hummus, the expected evidence unit is one strong reference where available plus approximately 3–5 independent practical preparations/observations. The purpose is to establish useful ingredient/technique ranges, recurring variants and disagreements.

There is no periodic refresh schedule. More evidence must be earned by a concrete unresolved question, material model change, source/legal recheck or explicit owner-authorized research refresh.

### 3. Public/source attribution

**PASS — now fail-closed.**

Internal provenance is always preserved.

For public/reusable source content, the source-use packet must classify whether attribution/disclosure is required. If it is required, the public path must be capable of rendering the required attribution/licence/basis before admission. If required disclosure cannot be satisfied, public/reusable use is rejected.

Evidence-only use is separately assessed and may proceed only when that evidence use is itself lawful and carries no unsatisfied disclosure requirement.

### 4. Public GitHub repository versus gated runtime

**PASS — boundary explicitly encoded.**

The GitHub repository is public, so app/database authentication cannot be relied on to protect material committed to GitHub. Protected third-party expression cannot be committed to the public repository without redistribution rights for that material.

The gated runtime remains useful for limiting user access to runtime data, but it is not treated as a cure for improper acquisition or public-repository disclosure.

### 5. Large public/open corpus

**PASS WITH IMPORTANT TERMINOLOGY CORRECTION.**

The architecture is **100k-ready**; there is not yet one approved 100k rights-cleared source.

Current source roadmap state:

- Open Recipe Archive: ~54,843 recorded recipes, primary large-corpus candidate, but collection/source-book audit remains required;
- RecipeDB: ~118,171 recorded recipes, conditional salvage-only lane, not automatically reusable because database-level licensing does not establish underlying recipe-text rights for every record;
- other open/public-domain/CC cohorts may supplement the admitted corpus under their own licence and attribution obligations.

The final admitted corpus count is an output of rights/quality/provenance gates, not an input target.

### 6. Recipe Family Synthesis relationship to the large corpus

**PASS — complementary, not duplicative.**

The intended architecture is:

```text
rights-clean/open/public-domain base corpus
+
bounded family/reference/variant/technique evidence
→ family ranges + adaptation intelligence
→ project-authored normalization/instructions where authorized
→ existing RecipeSource/evaluator/planner gates
```

The synthesis lane is therefore a quality/intelligence layer, not a mechanism for copying external recipe sites or manufacturing corpus size.

### 7. YouTube authoritative culinary sources

**PASS — evidence-only by default.**

YouTube may strengthen technique, variant, range, identity-boundary or adaptation reasoning, including for families/recipes already represented in the rights-clean corpus.

It does not authorize copying a creator's recipe expression. The project prohibits generic YouTube website scraping, unofficial transcript scraping/downloading and media warehousing. Manual review or an explicitly permitted API/data path is required, with internal provenance.

The existing app-authoring boundary remains stronger than creator authority alone: independent non-YouTube evidence and `rightsProvenanceSafetyClear=true` remain required before YouTube-derived discovery can contribute to `APP_AUTHORING_ELIGIBLE`.

## Knowledge Core reconciliation

**Result: ALIGNED / NO ARCHITECTURE CONFLICT.**

The app closeout is a stricter implementation envelope around the existing reusable Knowledge Core culinary policy. It does not create a second culinary reasoning architecture. Knowledge Core remains authoritative for reusable family/variant/transformation reasoning; the Culinary repo owns executable source admission, runtime/public attribution and app-authoring gates.

No Knowledge Core mutation is required to begin the bounded prototype because the added controls narrow execution rather than contradict or widen canonical policy.

## Consultant challenge

**Result: PROCEED WITH BOUNDED PROTOTYPE.**

Decision: whether governance is sufficient to start implementation without either over-collecting or creating avoidable source-rights exposure.

Conclusion:

- the one-time evidence design is proportionate to the decision value sought;
- stopping on information gain avoids turning legal/source review into a recipe-count exercise;
- the large-corpus source and family-synthesis lanes have distinct value and should remain separate;
- required attribution now has a concrete fail-closed operational path;
- no scale/public recommendation authority is created by this closeout.

Change condition: re-open legal/Consultant review when a listed legal/source trigger materially changes the intended source/use/scale.

## Project Coach challenge

**Result: PROCEED / TERMINAL CONTRACT EXPLICIT.**

The implementation sequence is now objectively testable:

```text
source eligibility
→ bounded one-time observations
→ synthesis
→ expression-independence validation
→ attribution validation
→ prototype report
→ Consultant/Project Coach review
→ only then 10-family expansion
```

Machine regressions explicitly protect no-scraping, one-time collection, attribution fail-closed behavior, YouTube evidence boundaries, public-repository firewall and the 100k-ready versus rights-cleared distinction.

## Pre-development terminal state

`RECIPE_FAMILY_P0_PREDEVELOPMENT_GOVERNANCE_PASS__CARBONARA_HUMMUS_PROTOTYPE_NEXT`

Development may begin with the bounded Carbonara + Hummus prototype. This state does not authorize public recommendation activation, mass ingestion, billing, new shards, nutrition-authority widening, generic scraping/crawling or automatic 10-family expansion.
