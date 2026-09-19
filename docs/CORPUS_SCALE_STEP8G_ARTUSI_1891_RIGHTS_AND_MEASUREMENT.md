# Step 8G — Artusi 1891 work / Gutenberg 1922 edition rights and bounded measurement

Date: 2026-09-19

Status: `PASS_RIGHTS__V8009_MEASUREMENT_PASS__V8010_PREWRITE_CAPACITY_ONLY`

Pinned source repository: `AdamBouhmad/open-recipe-archive`

Pinned commit: `ae3bd2c009a8899dfe63b9166fa98ae3fa8041a8`

Exact ORA cohort:

- Collection: `cucina-italiana`
- Source work: *La scienza in cucina e l'arte di mangiar bene*
- ORA author: `Pellegrino Artusi`
- ORA source year: `1891`
- Source-year semantics: **work first-publication year**
- Exact source URL: `https://www.gutenberg.org/ebooks/59047`
- Exact digitized source: **1922, 25th edition**
- Gutenberg title-page recipe count: **790**, plus appendix
- Exact ORA candidate records: **829**
- ORA licence marker: `public-domain`

## Source identity and rights basis

Rights marker:

`PASS_RIGHTS_VERIFIED_BOUNDED_ARTUSI_1891_WORK_GUTENBERG_1922_EDITION`

The exact source packet is independently supportable rather than relying on ORA metadata alone.

1. Project Gutenberg eBook #59047 identifies Pellegrino Artusi (1820–1911), *La scienza in cucina e l'arte di mangiar bene*, and marks the eBook public domain in the United States:
   `https://www.gutenberg.org/ebooks/59047`

2. The exact Gutenberg transcription identifies itself as the **25th edition, 1922**, with **790 recipes** plus the appendix *La Cucina per gli stomachi deboli*:
   `https://www.gutenberg.org/files/59047/59047-h/59047-h.htm`

3. Casa Artusi records the first edition in **1891**, Artusi's author-controlled revision history through 1911, his death on 30 March 1911, and the definitive 1911 text at 790 recipes:
   `https://www.casartusi.it/it/files/dissapore-breve-biografia-di-pellegrino-artusi-30-03-23.pdf`
   `https://www.casartusi.it/it/files/hiroko-kudo-attualita-artusi-nel-contesto-nipponico.pdf`

4. EU Directive 2006/116/EC Article 1 provides the ordinary literary-work term as author life plus 70 years. Artusi's documented 1911 death is far outside that term:
   `https://eur-lex.europa.eu/eli/dir/2006/116`

The historical literary work is therefore treated as public domain for this bounded cohort. This classification does not rely on private deployment as a rights basis.

## 1891 versus 1922 provenance semantics

Marker:

`CLASSIFIED_SOURCE_YEAR_AS_WORK_FIRST_PUBLICATION__GUTENBERG_EDITION_1922_25TH`

The pinned ORA manifest describes the work as Artusi's book “(1891)” and stores `source_year: "1891"` on all 829 rows. The exact `source_url`, however, resolves to Gutenberg's 1922 25th-edition transcription.

This is not represented as an 1891 digitized edition. For this project's provenance:

- `source_year=1891` means **first publication year of the work**;
- `source_url=Gutenberg #59047` identifies the exact reused digitized text;
- digitized edition year = **1922**;
- digitized edition label = **25th edition**;
- later attribution/UI must display or otherwise retain both facts rather than collapsing them into a false “1891 edition” claim.

## 829 ORA records versus 790 numbered recipes

The row-count difference is not treated as proof of an edition mismatch or as proof that all 829 rows are source-grounded.

Marker:

`SOURCE_GROUNDING_SAMPLE_16_OF_16_PASS`

A deterministic 16-point sample distributed across the alphabetically ordered 829-row ORA cohort was checked against the exact Gutenberg transcription. All 16 sampled Italian titles were found in Gutenberg #59047, including records at the beginning, middle and end of the ORA collection.

Sampled source-grounded titles included:

- Acciughe alla marinara
- Bastoncelli croccanti
- Budino Gabinetto
- Cieche alla pisana
- Croccante
- Fegato di maiale fritto
- Gelatina di fragole in gelo
- Lesso rifatto all'inglese
- Offelle di marmellata
- Pastine o capellini sul brodo di ombrina
- Pollo colle salsicce
- Risotto colle tinche
- Scannello annegato
- Storione in fricandò
- Tortino di petonciani
- Zuppa toscana di magro alla contadina

The Gutenberg source itself contains 790 numbered recipes plus appendix and other recipe-relevant material. The bounded sample removes the immediate source-grounding alarm but does **not** claim a 829/829 textual audit. Structural and marginal-value measurement remains separately required.

## Repository-layer reuse

The pinned ORA `LICENSE.md` must independently pass the existing repository-layer Unlicense/public-domain-dedication check before any downstream authority is earned.

This protects against treating the historical-work public-domain status as blanket permission for unrelated extraction/normalization additions.

## Attribution/disclosure classification

Marker:

`CLASSIFIED_READY_FOR_PRIVATE_CORPUS__UI_DISPLAY_DISTINGUISH_WORK_YEAR_AND_DIGITIZED_EDITION`

If this cohort later becomes user-visible, retain at minimum:

- historical work title;
- author: Pellegrino Artusi;
- work first-publication year: 1891;
- exact reused digitized source: Project Gutenberg eBook #59047;
- digitized edition: 25th edition, 1922;
- ORA repository provenance and pinned revision;
- reuse classification: historical work public domain + exact Gutenberg source + pinned ORA repository-layer Unlicense/public-domain dedication.

This does not authorize broader public corpus activation.

## Measurement contract

The bounded measurement must run against exact active protected `v8009` / **10,923** plus the unchanged public runtime.

It must fail closed unless all of the following pass:

- exact 829-row ORA source tuple;
- repository-layer reuse verification;
- attribution/disclosure classification;
- explicit 1891-work-year / 1922-digitized-edition classification;
- 16/16 deterministic source-grounding sample marker;
- exact single-source grouping;
- structural parseability threshold;
- title uniqueness threshold;
- marginal title novelty threshold against the full v8009 protected baseline.

Discovery already indicated 829/829 parseable rows, 806 distinct normalized titles, one exact baseline-title overlap, 805 novel normalized titles and strong marginal novelty. Discovery does not substitute for this source-specific rights-aware measurement.

## Boundaries

This document does **not** authorize:

- a v8010 prewrite;
- protected D1 population;
- public runtime or recommendation widening;
- a third shard;
- D1-query ceiling expansion;
- paid infrastructure or billing expansion;
- Nutrition, YT-CUL, Recipe Family or Knowledge Core mutation;
- cultural-authenticity, nutrition, allergen, dietary, scaling or medical authority.

Only a green deterministic bounded measurement may earn:

`SOURCE_SPECIFIC_PREWRITE_CAPACITY_MEASUREMENT_ONLY`


## Bounded measurement result

Workflow run `35434362009` / job `105874413351` completed successfully.

Terminal:

`STEP_8G_ORA_ARTUSI_1891_MEASUREMENT_EARNED_COHORT_CANDIDATE`

Measured against active protected `v8009` / 10,923:

- exact candidate rows: 829;
- parseable rows: 829 / 829;
- distinct normalized titles: 806;
- unique-title ratio: 0.9722557297949337;
- exact baseline-title overlaps: 1 (`brioches`);
- novel normalized titles: 805;
- novel-title ratio: 0.9987593052109182;
- distinct ingredient phrases: 2,877;
- novel ingredient phrases: 2,504;
- ontology-resolved occurrence ratio: 0.20348547717842325.

All rights, repository-reuse, attribution, work-year/edition-semantics, 16/16 source-grounding sample, exact-count, source-identity, structural-quality and culinary-coverage gates passed.

The measurement earns only:

`SOURCE_SPECIFIC_PREWRITE_CAPACITY_MEASUREMENT_ONLY`

It does not authorize protected population.

Canonical public-safe measurement evidence:
`data/generated/step8g/artusi-1891-v8009-measurement.json`.
