# Corpus Scale Step 8G — Open Recipe Archive / Turabi Efendi 1864 bounded shelf audit

Status: **MEASUREMENT AUTHORIZED / NO D1 WRITE AUTHORITY**  
Date: 2026-09-16  
Rights marker: `PASS_RIGHTS_VERIFIED_BOUNDED_TURABI_EFENDI_1864_OTTOMAN_SHELF`

## Scope

This audit is deliberately narrow. It covers only the 442 records in the pinned Open Recipe Archive `ottoman-turkish` shelf whose record metadata identifies all of the following:

- source work: **A Turkish Cookery Book**;
- author/compiler: **Turabi Efendi**;
- source year: **1864**;
- source item: `https://archive.org/details/b21527830`;
- collection: `ottoman-turkish`;
- record-level licence state: `public-domain`;
- pinned Open Recipe Archive commit: `ae3bd2c009a8899dfe63b9166fa98ae3fa8041a8`.

It does **not** clear the rest of Open Recipe Archive, any modern edition or translation, or any broader claim that the archive's country/culture labels are canonical culinary-authenticity authority.

## Documentary rights basis

The Wellcome Collection identifies the same 1864 *Turkish cookery book* source and explicitly marks its re-use licence as **Public Domain Mark**. Its catalogue states that the digitized material was provided by the University of Leeds Library.

Documentary locator:

- `https://wellcomecollection.org/works/adw7e3d5`

Independent bibliographic corroboration:

- the National Library of Ireland catalogue identifies Turabi Efendi's *Turkish cookery book*, published/created in London in 1864;
- the University of Chicago Middle East collection catalogue independently lists `Turābī Efendī — Turkish Cookery Book — London, 1864`;
- the pinned Open Recipe Archive records point to Internet Archive item `b21527830`, retain `source_year: 1864`, `author: Turabi Efendi`, and `license: public-domain`.

These facts are sufficient for this bounded historical-source measurement gate. They do not confer rights clearance on unrelated archive shelves.

## Cultural-provenance constraint

This is a nineteenth-century English-language historical source. Its recipes and labels are useful historical evidence, but this lane does not treat one 1864 book as a canonical authority for modern Turkish or Ottoman culinary authenticity.

The measurement therefore freezes:

- `culturalAuthorityImported: false`;
- `historicalSourceLabelOnly: true`;
- `culturalAuthenticityAuthorityImported: false`.

The source's labels may be retained for provenance/search only.

## Fail-closed machine gate

The measurement runner requires:

- exact Open Recipe Archive commit;
- exactly 442 candidate rows;
- exact collection, source title, author, year, Internet Archive item and `public-domain` metadata on every candidate row;
- this document's explicit rights marker.

Any mismatch fails the rights gate. Repository-level claims alone are insufficient.

## Marginal-value baseline

The cohort is measured against the complete active **v8005 / 2,464-recipe protected composition**, plus the current 85-recipe public runtime for overlap detection:

- 501 UniTools protected recipes;
- 915 ForkRecipe protected child recipes;
- 226 `sylGauthier/recipes` CC0 protected child recipes;
- 713 Edward Abbott 1864 protected child recipes;
- 109 Bosse / Watanna 1914 protected child recipes;
- current public runtime titles are included for overlap detection but are not added to the protected count.

The measurement reports structural parseability, title uniqueness, title novelty against v8005, ingredient-phrase novelty and canonical ingredient ontology-resolution signals. It retains the established Step 8G thresholds: at least 95% parseable recipes, 80% unique normalized titles and 50% novel normalized titles.

## Boundaries

A measurement PASS earns only a separately governed prewrite/capacity design. It does not authorize:

- D1 writes or v8006 creation;
- public recommendation admission;
- cultural-authenticity claims;
- a third shard;
- a larger D1 request budget;
- billing or paid infrastructure;
- source nutrition/diet/allergen/scaling claims as application authority;
- Nutrition or YT-CUL mutation;
- Knowledge Core writes.

Because v8005 observed the current maximum of 16 D1 subqueries, any later prewrite must independently demonstrate that a v8006 write/read path remains within the existing ceiling. Failure is a valid stop; the limit must not be raised implicitly.
