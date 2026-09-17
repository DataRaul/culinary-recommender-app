# Recipe Family Synthesis P0 — Pre-development Governance Closeout

Status: **READY FOR PROTOTYPE / GOVERNANCE FROZEN BEFORE DEVELOPMENT**

This document closes the pre-development governance questions for Recipe Family Synthesis P0 before Carbonara + Hummus implementation begins. It is a companion to:

- `docs/RECIPE_FAMILY_SYNTHESIS_P0.md`;
- `docs/RECIPE_FAMILY_SOURCE_COMPLIANCE_GATE.md`;
- `docs/RECIPE_FAMILY_SYNTHESIS_ROADMAP_GATE.md`;
- `config/recipe_family_synthesis_p0.json`;
- `docs/CORPUS_SCALE_100K_REFERENCE_AND_SOURCE_ROADMAP.md`.

It records project policy and operational legal controls. It is **not legal advice, a warranty of legality, or a substitute for source-specific review when a trigger in the contract fires**.

## 1. Acquisition intent — no generic scraping/crawling lane

The project does **not** authorize generic web scraping or crawling of third-party recipe sites.

For this project, `scraping/crawling` means an unapproved general-purpose automated process that traverses or extracts third-party web pages outside the explicit governed acquisition modes.

The project also does not authorize:

- bypassing paywalls, authentication, access controls or technical restrictions;
- evading applicable Terms, rate/usage restrictions or source-specific permissions;
- rotating accounts/identities to defeat limits;
- downloading or warehousing protected recipe prose/media merely because a page is publicly viewable;
- reconstructing a third-party recipe database through substantial or repeated/systematic extraction.

Automated work is allowed only through the explicit governed modes already defined by P0 (`AUTOMATED_TDM`, `API_OPEN_DATA`, `LICENSED_REUSE`) after their source-specific preflight passes. An explicit governed TDM/API/licensed adapter is not a general scraping authorization.

Stating this intent is **not legally required and does not itself create a defence**. It is encoded because it prevents architecture drift and gives the repository a deterministic prohibition future implementation must obey.

## 2. Family evidence is a one-time bounded baseline by default

Recipe-family synthesis is **not a recurring web-refresh product**.

Default family acquisition policy:

1. obtain one strong reference source where one exists;
2. obtain approximately 3–5 genuinely independent practical preparations/observations;
3. normalize ingredient roles, quantities/ratios, times, temperatures and technique order;
4. classify recurring variants and disagreements;
5. stop when the reference/observed/recommended ranges and material variants are stable enough for the pilot objective.

The 3–5 observations should normally be **independent sources/preparations**, not repeated runs against the same publisher.

There is no scheduled Carbonara/Hummus refresh every few days, weeks or months. A later collection wave requires an explicit trigger such as:

- a material unresolved identity/execution contradiction;
- a new adaptation question that current evidence cannot answer;
- a source-use/legal state that must be rechecked because the source is being used again;
- a materially changed family model;
- an explicit owner-authorized research refresh.

Stable culinary facts are therefore acquired once, normalized, provenance-linked and then reused internally without repeatedly hitting the source.

## 3. Source disclosure and attribution gate

Internal provenance is mandatory for every material observation regardless of whether public attribution is legally required.

The source record must classify public-attribution obligation as:

- `REQUIRED`;
- `NOT_REQUIRED`;
- `UNKNOWN`.

And its public-attribution readiness as:

- `READY`;
- `NOT_APPLICABLE`;
- `UNSATISFIABLE`.

Operational rule:

```text
public attribution REQUIRED
+ attribution READY
→ source may proceed if all other gates pass

public attribution REQUIRED
+ attribution UNSATISFIABLE / UNKNOWN
→ reject the public/reusable use
```

A source that cannot satisfy a legally/licence/permission/Terms-required disclosure must not be admitted as public/reusable recipe content. It may only remain an evidence/validation source if that separate use is itself lawful and does not carry the unsatisfied disclosure obligation.

Typical cases:

- **CC BY / CC BY-SA / CC BY-NC-SA reused content:** public attribution/licence/change notices are required when the licensed material is shared/adapted according to the applicable licence;
- **public-domain source text:** copyright attribution is ordinarily not required as a condition of public-domain status, but the project still keeps provenance for auditability and culinary context;
- **standard-copyright evidence-only source:** public attribution is not automatically created merely because non-expressive facts informed the synthesis; internal provenance remains mandatory, and any source-specific Terms/permission conditions still control;
- **API/open-data source:** attribution/notice requirements come from the applicable API/data licence/terms and must be rendered when required.

The current app already renders a specific Wikibooks CC BY-SA provenance line. Before admitting any new public source class whose licence/terms require visible attribution, the public/runtime path must prove it can render the required creator/source, source URL where applicable, licence/basis and modification notice. Hard-coded Wikibooks attribution is not a generic licence renderer.

## 4. Public GitHub repository is not the same as gated runtime

The repository is public. Therefore access gating in the application does **not** make material committed to GitHub private.

Rules:

- protected third-party recipe expression must not be committed to the public repository unless redistribution rights for that exact material are established;
- standard-copyright evidence remains normalized factual observations/provenance only and must not become a public recipe-text archive;
- gated database/runtime access protects protected runtime data, but does not cure an improper public GitHub disclosure;
- code, schemas, validators, non-protected normalized facts and lawful provenance metadata may remain public when their own rights/privacy state permits it.

## 5. Relationship to the large public/open corpus

`100k readiness` is an architecture/capacity target, **not a claim that one legally reusable 100,000-recipe database has already been approved**.

Current canonical source roadmap state:

- **Open Recipe Archive:** approximately 54,843 recipes across 31 collections; primary large-corpus candidate, but collection/source-book public-domain claims remain audit-gated before admission;
- **RecipeDB:** approximately 118,171 recipes; **salvage-only / conditional**, because the database-level licence does not by itself establish redistribution/rehosting rights for every underlying Food.com/AllRecipes recipe text;
- **Wikibooks / ForkRecipe / UniTools and other admitted cohorts:** supplementary sources under their own attribution/ShareAlike or other licence obligations.

The final admitted corpus may be below or above 100k. Rights, quality, provenance and recommendation value outrank row count.

Recipe Family Synthesis P0 is **not the mechanism for manufacturing 100k recipes**. It is a quality/intelligence layer that can sit on top of a rights-clean large corpus:

```text
rights-clean/open/public-domain base corpus
+
small bounded family/reference evidence
+
variant/technique observations
→ better normalized family ranges and app-owned adaptation logic
```

## 6. YouTube / authoritative culinary-source boundary

YouTube discovery may contribute **evidence**, not copied recipes.

Project policy:

- no automated scraping of the YouTube website;
- no unofficial transcript scraping/downloading or video/audio warehousing;
- use manual review or an explicitly permitted/authorized API/data path under its applicable terms;
- retain internal provenance such as channel/publisher, video URL/ID, access date and relevant timestamp/segment when practical;
- extract normalized culinary facts/claims only; do not persist creator prose, transcript, audio or video unless separate reuse rights explicitly permit it;
- a YouTube observation does not become canonical culinary truth merely because the creator is authoritative;
- preserve the existing requirement for independent non-YouTube evidence and `rightsProvenanceSafetyClear=true` before YouTube-derived discovery can contribute to `APP_AUTHORING_ELIGIBLE`.

YouTube may therefore help refine technique, variant, range or adaptation reasoning for a recipe family or for recipes already present in the large corpus, without importing the creator's recipe expression.

## 7. Legal anchors reviewed for this closeout

Primary/current anchors checked on 2026-09-17:

- Spain — Real Decreto-ley 24/2021, Article 67: text/data mining of lawfully accessible works; the general exception does not apply where rights are expressly reserved through machine-readable or other suitable means: `https://www.boe.es/eli/es/rdl/2021/11/02/24`;
- Spain — Texto Refundido de la Ley de Propiedad Intelectual, Articles 133–135: database sui-generis protection, substantial extraction/reuse, repeated/systematic extraction and the bounded rights of legitimate users: `https://www.boe.es/eli/es/rdlg/1996/04/12/1/con`;
- Creative Commons BY-SA 4.0: attribution, licence identification/link, indication of changes and ShareAlike when licensed material is shared/adapted: `https://creativecommons.org/licenses/by-sa/4.0/legalcode`;
- YouTube Terms of Service: automated access such as scrapers is restricted absent the stated exceptions/permission, and independent use of Content is not generally granted merely by viewing it through the Service: `https://www.youtube.com/static?template=terms`;
- YouTube API Services Terms: API access must follow the API Agreement, preserve required attribution/notices and does not grant general rights to reproduce/distribute audiovisual content outside the authorized API/service path: `https://developers.google.com/youtube/terms/api-services-terms-of-service`.

These anchors explain why the project separates **lawful access**, **automation/TDM state**, **database extraction**, **copyright/expression**, **contract/Terms**, **attribution**, and **public runtime/repository exposure** instead of treating “publicly viewable” as “free to ingest.”

## 8. Development unlock

Carbonara + Hummus development may start only after the machine config and validator encode this closeout and deterministic tests prove at minimum:

- generic scraping/crawling is not an authorized acquisition mode;
- one-time family baseline / no scheduled refresh is encoded;
- required-but-unsatisfiable public attribution fails closed;
- evidence-only/internal-provenance use remains distinguishable from reusable/public content;
- YouTube is evidence-only by default and cannot bypass rights/provenance gates;
- 100k readiness is not misrepresented as a 100k rights-cleared source;
- protected source expression is not authorized for the public repository;
- all prior P0 source-compliance tests remain green.

After that closeout passes, the next executable state remains:

`Carbonara + Hummus bounded prototype -> Consultant/Project Coach blocking review -> only then bounded 10-family expansion`.
