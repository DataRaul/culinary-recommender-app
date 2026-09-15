# Corpus Scale Step 8G — Open Recipe Archive / Bosse & Watanna 1914 bounded shelf audit

Status: **MEASUREMENT AUTHORIZED / NO D1 WRITE AUTHORITY**  
Date: 2026-09-15  
Rights marker: `PASS_RIGHTS_VERIFIED_BOUNDED_BOSSE_WATANNA_1914_JAPANESE_SHELF`

## Scope

This audit is deliberately narrow. It covers only the 109 records in the pinned Open Recipe Archive `japanese-kitchen` shelf whose record metadata identifies all of the following:

- source work: **Chinese-Japanese Cook Book**;
- authors: **Sara Bosse & Onoto Watanna**;
- source year: **1914**;
- source item: `https://archive.org/details/chinesejapanesec00boss_0`;
- collection: `japanese-kitchen`;
- record-level licence state: `public-domain`;
- pinned Open Recipe Archive commit: `ae3bd2c009a8899dfe63b9166fa98ae3fa8041a8`.

It does **not** clear the rest of Open Recipe Archive, the separate `chinese-kitchen` shelf, any modern edition or introduction, or any broader cultural-authenticity claim.

## Documentary rights basis

Michigan State University Libraries' **Feeding America: The Historic American Cookbook Project** identifies *Chinese-Japanese Cook Book* by Sara Bosse and Onoto Watanna, published in 1914, and explicitly reports **Copyright Status: No Copyright**.

Documentary locator:

- `https://d.lib.msu.edu/fa/4705`

The Online Books Page at the University of Pennsylvania independently identifies the same 1914 Rand McNally work and links the Michigan State digitization, Gutenberg Canada text and HathiTrust page images:

- `https://onlinebooks.library.upenn.edu/webbin/book/lookupid?key=olbp53539`

The pinned Open Recipe Archive rows retain the exact Internet Archive source item, year, authors and `public-domain` state. The package is English-language historical source material rather than a modern translation layer.

## Cultural-provenance constraint

The 1914 book is a historical Chinese/Japanese-American adaptation, not a modern authority on Japanese culinary authenticity. University of Michigan contextual material describes it as a book split between Chinese and Japanese recipes and notes adaptation to Western tastes. Therefore this Step 8G cohort may preserve the archive's historical source labels for provenance/search, but those labels are **not** promoted to canonical cultural-authenticity authority.

The measurement explicitly freezes:

- `culturalAuthorityImported: false`;
- `historicalSourceLabelOnly: true`;
- `culturalAuthenticityAuthorityImported: false`.

This is a protected-corpus research cohort, not a claim that every recipe represents canonical modern Japanese cooking.

## Fail-closed machine gate

The measurement runner requires:

- exact Open Recipe Archive commit;
- exactly 109 candidate rows;
- exact collection, source title, authors, year, Internet Archive item and `public-domain` metadata on every candidate row;
- this document's explicit rights marker.

Any mismatch fails the rights gate. Repository-level claims alone are insufficient.

## Marginal-value baseline

The cohort is measured against the complete active **v8004 / 2,355-recipe protected composition**, plus the current 85-recipe public runtime for overlap detection:

- 501 UniTools protected recipes;
- 915 ForkRecipe protected child recipes;
- 226 `sylGauthier/recipes` CC0 protected child recipes;
- 713 Edward Abbott 1864 protected child recipes;
- current public runtime titles are included for overlap detection but are not added to the protected count.

The measurement reports structural parseability, title uniqueness, title novelty against v8004, ingredient-phrase novelty and canonical ingredient ontology-resolution signals. It retains the established Step 8G thresholds: at least 95% parseable recipes, 80% unique normalized titles and 50% novel normalized titles.

## Boundaries

A measurement PASS earns only a separately governed prewrite/capacity design. It does not authorize:

- D1 writes or v8005 creation;
- public recommendation admission;
- cultural-authenticity claims;
- a third shard;
- a larger D1 request budget;
- billing or paid infrastructure;
- source nutrition/diet/allergen/scaling claims as application authority;
- Nutrition or YT-CUL mutation;
- Knowledge Core writes.

Because v8004 observed the current maximum of 16 D1 subqueries, a later prewrite must independently demonstrate that any v8005 write/read path remains within the existing ceiling. Failure is a valid stop; the limit must not be raised implicitly.
