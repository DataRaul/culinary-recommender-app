# Corpus Scale Step 8G — Open Recipe Archive / Edward Abbott 1864 bounded source-work audit

Status: **MEASUREMENT AUTHORIZED / NO D1 WRITE AUTHORITY**  
Date: 2026-09-15  
Rights marker: `PASS_RIGHTS_VERIFIED_BOUNDED_ABBOTT_1864`

## Scope

This audit is deliberately narrow. It covers only Open Recipe Archive records whose pinned metadata identifies all of the following:

- source work: **The English and Australian Cookery Book**;
- author: **Edward Abbott (1801–1869)**;
- source year: **1864**;
- source item: `https://archive.org/details/b21505524`;
- record-level licence state: `public-domain`;
- pinned Open Recipe Archive commit: `ae3bd2c009a8899dfe63b9166fa98ae3fa8041a8`.

It does **not** clear the rest of Open Recipe Archive, any translated collection, any 1893 Australian source work, or the previously held `cocina-espanola` cohort.

## Documentary rights basis

The exact 1864 edition is independently identified by Open Library as Edward Abbott's *The English and Australian cookery book*, published in London by Sampson Low, Son, and Marston in 1864, with Internet Archive item ID `b21505524`.

Wellcome Collection exposes the same 1864 work from the University of Leeds Library and marks the work with the **Public Domain Mark**, explicitly stating that it may be used for any purpose without copyright restriction.

Relevant documentary locators:

- `https://openlibrary.org/books/OL33071900M/The_English_and_Australian_cookery_book`
- `https://wellcomecollection.org/works/ssuk23qw`
- `https://archive.org/details/b21505524`

The Open Recipe Archive record layer identifies the source work, source URL, author, year and `public-domain` state per recipe. Unlike the held Spanish collection, this bounded cohort does not introduce a modern translation layer: the source and packaged recipe text are English.

A sampled record (`collections/australian-table/recipes/an-irish-stew.md`) was reconciled against a digitized rendering of the 1864 text. The recipe's operative wording tracks the historical source while the package separates ingredient facts and segments the directions; the package does not introduce a new translated recipe expression. The measurement therefore treats the source-work text as public-domain source material while preserving the Open Recipe Archive transformation/provenance boundary.

## Fail-closed machine gate

The Step 8G measurement script selects candidate records by the exact source URL above, then requires every selected row to retain:

- exact source title;
- Edward Abbott author identity;
- source year `1864`;
- exact Internet Archive source item;
- record-level `public-domain` state.

Any selected row that violates one of those fields fails the rights gate. The script also requires this document's explicit rights marker. No inference from collection name alone is accepted.

## Marginal-value baseline

The candidate is measured against the complete current protected v8003 composition, not the older pre-v8003 baseline:

- 501 UniTools protected recipes;
- 915 ForkRecipe child protected recipes;
- 226 `sylGauthier/recipes` CC0 child protected recipes;
- current public recipe titles are included for overlap detection but public records are not counted as protected storage.

The measurement reports structural parseability, title uniqueness, title novelty against v8003, lexical ingredient novelty and ontology-resolution signals. It uses the same conservative structural/title thresholds as the preceding CC0 Step 8G measurement: 95% parseable, 80% unique normalized titles and 50% novel normalized titles.

## Boundaries

A measurement PASS means only that this exact source-work cohort has earned a **separately governed prewrite/population design**. It does not itself authorize:

- D1 writes;
- a new protected corpus version;
- public recommendation admission;
- a third shard;
- billing or paid infrastructure;
- source nutrition as nutrition authority;
- Knowledge Core writes.

If the measurement fails, Step 8G must treat that as a valid stop for this cohort rather than lowering thresholds or broadening rights assumptions.
