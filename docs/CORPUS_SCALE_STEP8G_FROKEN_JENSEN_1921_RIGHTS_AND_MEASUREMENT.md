# Step 8G — Frøken Jensen 1921 rights and bounded measurement

Date: 2026-09-19

Status: `PASS_RIGHTS__V8010_MEASUREMENT_PASS__V8011_PREWRITE_PASS__IMPLEMENTATION_EARNED`

Pinned source repository: `AdamBouhmad/open-recipe-archive`

Pinned commit: `ae3bd2c009a8899dfe63b9166fa98ae3fa8041a8`

Exact ORA cohort:

- Collection: `danske-kokken`
- Source work: *Frøken Jensens kogebog*
- ORA author: `Kristine Marie Jensen`
- ORA source year: `1921`
- Source-year semantics: **exact reused edition/printing year**
- Exact source URL: `https://archive.org/details/frkenjensensko00jens`
- Exact digitized edition: **23rd printing, 1921**
- Exact ORA candidate records: **1,372**
- ORA licence marker: `public-domain`

## Source identity and rights basis

Rights marker:

`PASS_RIGHTS_VERIFIED_BOUNDED_FROKEN_JENSEN_1921_23RD_PRINTING`

The exact source packet is independently supportable rather than relying on ORA metadata alone.

1. The Internet Archive item identifies *Frøken Jensens kogebog*, Kristine Marie Jensen, publication date 1921, Copenhagen publisher Gyldendalske Boghandel / Nordisk Forlag, and marks the item `NOT_IN_COPYRIGHT`:
   `https://archive.org/details/frkenjensensko00jens`

2. The exact OCR/title page states `TREOGTYVENDE OPLAG` (23rd printing) and the Roman-numeral year 1921:
   `https://archive.org/stream/frkenjensensko00jens/frkenjensensko00jens_djvu.txt`

3. Dansk Biografisk Leksikon records Kristine Marie Jensen as 17 July 1858–7 February 1923. Lex records that *Frøken Jensens Kogebog* first appeared in 1901 and reached 27 printings during Jensen's lifetime:
   `https://biografiskleksikon.lex.dk/Kristine_Marie_Jensen`
   `https://lex.dk/Fr%C3%B8ken_Jensens_Kogebog`

4. EU Directive 2006/116/EC Article 1 provides the ordinary literary-work term as author life plus 70 years:
   `https://eur-lex.europa.eu/eli/dir/2006/116/oj/eng`

Jensen died in 1923, so her identified authorial layer is outside the EU life-plus-70 term. The exact 1921 printing was published during her lifetime and the title page does not identify the later posthumous editorial layers that Lex says were introduced by the publisher in later editions.

This classification does not rely on private deployment as a rights basis.

## Provenance semantics

Marker:

`CLASSIFIED_SOURCE_YEAR_AS_EXACT_DIGITIZED_EDITION_1921_23RD_PRINTING`

For this cohort:

- `source_year=1921` is the year of the exact reused 23rd printing;
- first publication of the work was 1901;
- exact digitized source is Internet Archive item `frkenjensensko00jens`;
- later attribution/UI must preserve both the historical work identity and the exact 1921 edition/printing identity.

## Repository-layer reuse

The pinned ORA `LICENSE.md` must independently pass the existing repository-layer Unlicense/public-domain-dedication check before downstream authority is earned.

## Attribution/disclosure classification

Marker:

`CLASSIFIED_READY_FOR_PRIVATE_CORPUS__FROKEN_JENSEN_1921_EXACT_EDITION_ATTRIBUTION`

If this cohort later becomes user-visible, retain at minimum:

- historical work title;
- author: Kristine Marie Jensen;
- work first publication: 1901;
- exact reused edition/printing: 23rd printing, 1921;
- exact Internet Archive source;
- ORA repository provenance and pinned revision;
- reuse classification: authorial term expired + exact archive item not-in-copyright marker + pinned ORA repository-layer dedication.

This does not authorize broader public corpus activation.

## Measurement contract

The bounded measurement must run against exact active protected `v8010` / **11,752** plus the unchanged public runtime.

It must fail closed unless all of the following pass:

- exact 1,372-row ORA source tuple;
- repository-layer reuse verification;
- rights documentation;
- attribution/disclosure classification;
- exact 1921 / 23rd-printing edition classification;
- exact single-source grouping;
- structural parseability threshold;
- title uniqueness threshold;
- marginal title novelty threshold against the full v8010 protected baseline.

Fresh discovery already indicated 1,372 rows, 100% parseability, 1,297 novel normalized titles, and strong marginal novelty. Discovery does not substitute for this source-specific rights-aware measurement.

## Boundaries

This document does **not** authorize:

- a v8011 prewrite;
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

Workflow run `35462036487` / job `105947499302` completed successfully.

Terminal:

`STEP_8G_ORA_FROKEN_JENSEN_1921_MEASUREMENT_EARNED_COHORT_CANDIDATE`

Measured against active protected `v8010` / 11,752:

- exact candidate rows: 1,372;
- parseable rows: 1,372 / 1,372;
- distinct normalized titles: 1,301;
- unique-title ratio: 0.9482507288629738;
- exact baseline-title overlaps: 4;
- novel normalized titles: 1,297;
- novel-title ratio: 0.9969254419677172;
- distinct ingredient phrases: 3,942;
- novel ingredient phrases: 3,449;
- ontology-resolved occurrence ratio: 0.20641135445980668.

All rights, repository-reuse, attribution, exact-edition semantics, exact-count, source-identity, structural-quality and culinary-coverage gates passed.

The measurement earns only:

`SOURCE_SPECIFIC_PREWRITE_CAPACITY_MEASUREMENT_ONLY`

It does not authorize protected population.

Canonical public-safe measurement evidence:
`data/generated/step8g/froken-jensen-1921-v8010-measurement.json`.


## v8011 prewrite result

Workflow run `35462201611` / job `105947947623` completed successfully.

Terminal candidate:

`STEP_8G_FROKEN_JENSEN_V8011_PREWRITE_PASS_LIVE_PROTECTED_POPULATION_IMPLEMENTATION_EARNED`

Count contract:

- parent `v8010`: 11,752;
- Frøken Jensen child layer: 1,372;
- candidate `v8011`: **13,124**.

Existing topology/cost envelope remains valid:

- protected D1 shards: **2**;
- child rows by shard: 651 / 721;
- candidate cumulative rows by shard: 6,570 / 6,554;
- candidate cumulative body bytes by shard: 24,606,632 / 24,298,109;
- cumulative layered physical body bytes: 48,904,741;
- body batches: 139;
- maximum rows per batch: 10;
- maximum write request: 14,653 bytes versus 262,144 allowed;
- planned maximum D1 subqueries: **16 / 16**;
- limiting operation: `routeWriteFresh`;
- bounded eleven-layer hydration worst case: 12;
- D1-budget headroom assumed: false.

Every prewrite capacity/topology/count/request/body/ID gate passed. No live D1 write, public-runtime change, recommendation admission, third shard, D1-budget expansion or billing expansion occurred.

Canonical evidence:
`data/generated/step8g/froken-jensen-v8011-prewrite-evidence.json`.

Decision:

`EARN_V8011_LIVE_PROTECTED_POPULATION_IMPLEMENTATION_ON_EXISTING_TWO_SHARD_AND_16_QUERY_ENVELOPE`
