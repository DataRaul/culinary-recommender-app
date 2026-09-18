# Step 8G — Menon 1801 *La Cuisinière bourgeoise* rights and bounded measurement

Date: 2026-09-18

Status: `PASS_RIGHTS__V8008_MEASUREMENT_PASS__V8009_PREWRITE_CAPACITY_ONLY`

Pinned source repository: `AdamBouhmad/open-recipe-archive`

Pinned commit: `ae3bd2c009a8899dfe63b9166fa98ae3fa8041a8`

Exact ORA cohort:

- Collection: `cuisine-francaise`
- Source work: *La Cuisinière bourgeoise*
- ORA author: `Menon`
- Source year: `1801`
- Exact source URL: `https://archive.org/details/b22019935`
- Exact candidate records: **752**
- ORA licence marker: `public-domain`

## Source identity and rights basis

Rights marker:

`PASS_RIGHTS_VERIFIED_BOUNDED_MENON_1801_CUISINIERE_BOURGEOISE`

The exact source packet is independently supportable rather than relying on ORA metadata alone.

1. The Bibliothèque nationale de France authority record identifies Joseph Menon (1700?–1771), French author of culinary works, and records his death on 14 July 1771:
   `https://catalogue.bnf.fr/ark:/12148/cb12517717v`

2. BnF catalogs *La Cuisinière bourgeoise* under Joseph Menon, including the original 1746 publication and later editions:
   `https://catalogue.bnf.fr/rechercher.do?index=AUT3&numNotice=12517717&typeNotice=p`

3. The exact Internet Archive item `b22019935` is independently described as an 1801 Paris edition of *La cuisiniere bourgeoise*, author Menon, and is marked Public Domain:
   `https://commons.wikimedia.org/wiki/File:La_cuisiniere_bourgeoise,_suivie_de_l%27office,_%C3%A0_l%27usage_de_tous_ceux_qui_se_m%C3%AAlent_de_la_d%C3%A9pense_des_maisons._Contenant_la_mani%C3%A8re_de_diss%C3%A9quer,_conna%C3%AEtre_et_servir_toutes_sortes_de_viandes_(IA_b22019935).pdf`

4. Current French Intellectual Property Code article L123-1 provides the ordinary author term as life plus seventy years. Menon's documented 1771 death is far outside that term:
   `https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000006069414/LEGISCTA000006161637/`

The source is therefore treated as a public-domain historical work for this bounded cohort. This classification does not rely on private deployment as a rights basis.

## Repository-layer reuse

The pinned ORA `LICENSE.md` states that the repository software is free and unencumbered and dedicated to the public domain under the Unlicense. The measurement gate must verify that exact pinned licence text before earning any downstream authority.

This repository-layer classification matters because ORA contains extraction/normalization material around the historical source. Historical public-domain status alone is not treated as blanket permission for unrelated third-party additions.

## Attribution/disclosure classification

Attribution/disclosure state:

`CLASSIFIED_READY_FOR_PRIVATE_CORPUS__UI_DISPLAY_STILL_DOWNSTREAM_TEST_REQUIRED`

If this cohort later becomes user-visible, retain at minimum:

- historical work title: *La Cuisinière bourgeoise*;
- author display: Joseph Menon / Menon;
- edition/source year: 1801;
- exact stable source reference: Internet Archive `b22019935`;
- ORA repository provenance and pinned revision;
- reuse classification: historical work public domain + pinned ORA repository layer Unlicense/public-domain dedication.

This classification is readiness for provenance-aware storage and later disclosure. It does not authorize broader public corpus activation.

## Measurement contract

The bounded measurement must run against the exact active protected baseline `v8008` / **10,171** recipes and the unchanged public runtime of 85 recipes.

It must fail closed unless all of the following pass:

- exact 752-row cohort identity;
- every candidate row matches the exact source URL/title/author/year/licence tuple;
- repository-layer reuse verification;
- attribution/disclosure classification;
- 100% source-specific grouping;
- structural parseability threshold;
- title uniqueness threshold;
- marginal title novelty threshold against the full v8008 protected baseline.

Discovery already indicated 100% parseability and strong novelty, but those discovery metrics do not substitute for this source-specific rights-aware measurement.

## Boundaries

This document does **not** authorize:

- a v8009 prewrite;
- protected D1 population;
- public runtime or recommendation widening;
- a third shard;
- any D1-query ceiling expansion;
- paid infrastructure or billing expansion;
- Nutrition, YT-CUL, Recipe Family or Knowledge Core mutation;
- cultural-authenticity, nutrition, allergen, dietary, scaling or medical authority.

Only a green deterministic bounded measurement may earn the next authority: source-specific prewrite/capacity measurement.


## Bounded measurement result

Workflow run `35342302108` / job `105590763587` completed successfully.

Terminal:

`STEP_8G_ORA_MENON_1801_MEASUREMENT_EARNED_COHORT_CANDIDATE`

Measured against active protected `v8008` / 10,171:

- exact candidate rows: 752;
- parseable rows: 752 / 752;
- distinct normalized titles: 730;
- unique-title ratio: 0.9707446808510638;
- exact baseline-title overlaps: 0;
- novel normalized titles: 730;
- novel-title ratio: 1.0;
- distinct ingredient phrases: 1,985;
- novel ingredient phrases: 1,426;
- ontology-resolved occurrence ratio: 0.27109400064164263.

All source-specific rights, repository-reuse, attribution, exact-count, source-identity, structural-quality and culinary-coverage gates passed.

The measurement earns only:

`SOURCE_SPECIFIC_PREWRITE_CAPACITY_MEASUREMENT_ONLY`

It does not authorize protected population.

Canonical public-safe measurement evidence:
`data/generated/step8g/menon-1801-v8008-measurement.json`.
