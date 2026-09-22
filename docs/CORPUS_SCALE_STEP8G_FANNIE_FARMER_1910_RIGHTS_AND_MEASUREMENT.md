# Step 8G — Fannie Merritt Farmer / The Boston Cooking-School Cook Book rights and bounded measurement

Date: 2026-09-22

Status: `PASS_RIGHTS__V8016_MEASUREMENT_READY__NO_V8017_AUTHORITY`

Pinned source repository: `AdamBouhmad/open-recipe-archive`

Pinned commit: `ae3bd2c009a8899dfe63b9166fa98ae3fa8041a8`

Exact ORA cohort:

- collection: `ye-old-american`
- source work: *The Boston Cooking-School Cook Book*
- author: **Fannie Merritt Farmer**
- ORA source year: `1896`
- exact source URL: `https://www.gutenberg.org/ebooks/65061`
- exact candidate records from post-v8016 discovery: **1,776**
- ORA licence marker: `public-domain`

## Source identity and rights basis

Rights marker:

`PASS_RIGHTS_VERIFIED_BOUNDED_FANNIE_FARMER_1910_REVISED_EDITION_TERM_EXPIRED`

This is an operational source-admission classification for this exact cohort, not a general legal opinion, and it does not rely on ORA's licence marker alone.

1. Project Gutenberg ebook **#65061** identifies the author as Fannie Merritt Farmer (1857–1915), the title as *The Boston Cooking-School Cook Book*, and the copyright status as **Public domain in the USA**. Gutenberg states that the ebook was produced from images made available by the Internet Archive.

2. The exact Gutenberg text is not an 1896 scan. Its title page says **REVISED**, “with one hundred and twenty-five new recipes,” Little, Brown, and Company, Boston, **1910**. The same title page lists Farmer's copyright years beginning in 1896. Therefore ORA `source_year=1896` is treated as work-first-publication metadata, while the exact digitized edition behind the source URL is the 1910 revised edition.

3. No separate editor or reviser is identified on the exact 1910 title page for the reused text; the revised book remains attributed to Farmer. The project does not import modern introductions, annotations, transcriber-created material, images, or other third-party additions as source authority.

4. Spain's current Copyright Act, transitional provision 4, states that works by authors who died before 7 December 1987 retain the duration provided by the 10 January 1879 Act. Article 6 of the 1879 Act provided the author's rights for life and an eighty-year post-mortem term. Farmer died in 1915, so that exploitation term is long expired by 2026.

5. The project preserves the distinction between the work's first-publication year and the exact digitized edition, plus author, title, publisher/place, exact Gutenberg source and pinned ORA revision.

The exact 1910 revised authorial text is therefore classified as public domain for this bounded source cohort in the project's Spain-facing rights framework.

Independent exact-source classification marker:

`CLASSIFIED_PROJECT_GUTENBERG_65061_PUBLIC_DOMAIN_USA__AUTHOR_TERM_EXPIRED_SPAIN`

## Provenance semantics

Marker:

`CLASSIFIED_SOURCE_YEAR_1896_AS_WORK_FIRST_PUBLICATION__EXACT_DIGITIZED_1910_REVISED_EDITION`

The ORA metadata value `1896` is retained exactly for source identity matching, but it must not be described as the digitized-edition year. The digitized source is the 1910 revised edition.

The collection label `american-historical` is provenance only. It does not confer contemporary cultural-authenticity, nutrition, allergen, dietary, scaling or medical authority.

## Repository-layer reuse

The pinned ORA `LICENSE.md` independently contains the Unlicense/public-domain dedication used by the existing repository-reuse gate. Underlying historical-source rights are independently reviewed above; the repository licence is not used as a substitute for source rights.

## Attribution/disclosure classification

Marker:

`CLASSIFIED_READY_FOR_PRIVATE_CORPUS__FANNIE_FARMER_1910_EXACT_SOURCE_ATTRIBUTION`

If later user-visible, retain at minimum Fannie Merritt Farmer attribution, work title, work-first-publication year 1896, exact digitized-edition year 1910 and revised-edition label, publisher/place, Gutenberg #65061, ORA provenance/pinned revision, and the project reuse classification. This does not authorize broader public corpus activation.

## Measurement contract

The bounded measurement must run against exact active protected `v8016` / **17,011** plus the unchanged public runtime. It must fail closed unless exact count/source identity, repository reuse, source rights documentation, attribution, edition semantics, independent exact-source public-domain classification, structural quality and marginal novelty all pass.

Fresh no-write post-v8016 discovery found **1,776** rows, **1,609** novel normalized titles, and a novel-title ratio of approximately **0.93710**. Discovery itself does not clear rights or authorize ingestion.

## Boundaries

This document does **not** authorize protected D1 population, a v8017 prewrite, public runtime/recommendation widening, a third shard, D1-budget expansion, paid infrastructure, Nutrition/YT-CUL/Recipe Family/Knowledge Core mutation, or cultural-authenticity/nutrition/allergen/dietary/scaling/medical authority.

Only a green deterministic measurement may earn `SOURCE_SPECIFIC_PREWRITE_CAPACITY_MEASUREMENT_ONLY`.

Documentary references:

- exact Project Gutenberg source and public-domain status: https://www.gutenberg.org/ebooks/65061
- exact 1910 revised title page/text: https://www.gutenberg.org/files/65061/old/65061-h/65061-h.htm
- Spain Copyright Act, transitional provision 4: https://www.boe.es/buscar/act.php?id=BOE-A-1996-8930
- Spain 1879 Copyright Act, Article 6: https://www.boe.es/buscar/doc.php?id=BOE-A-1879-40001
