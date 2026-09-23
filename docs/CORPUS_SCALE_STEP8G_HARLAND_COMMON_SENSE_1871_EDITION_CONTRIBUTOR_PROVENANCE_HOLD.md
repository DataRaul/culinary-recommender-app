# Step 8G — Marion Harland / Common Sense in the Household exact-edition and contributor-provenance hold

Date: 2026-09-23

Status:

`HOLD_RIGHTS_PROVENANCE_FAIL_CLOSED__COMMON_SENSE_ORA_1871__GUTENBERG_48804_1883_REVISED_EDITION__UNNAMED_RECIPE_CONTRIBUTORS`

## Exact discovery tuple

- collection: `ye-old-american`
- source title: *Common Sense in the Household*
- ORA author: **Marion Harland**
- ORA source year: `1871`
- exact source URL: `https://www.gutenberg.org/ebooks/48804`
- pinned ORA commit: `ae3bd2c009a8899dfe63b9166fa98ae3fa8041a8`
- candidate recipes: **928**
- parseable ratio: **1.0**
- unique-title ratio: **0.9655172413793104**
- novel-title ratio: **0.8013392857142857**
- novel normalized titles: **718**
- ORA licence marker: `public-domain`

## Exact work / edition identity

The exact Project Gutenberg representation is not an 1871 printing. Its title page identifies *Common Sense in the Household: A Manual of Practical Housewifery*, by Marion Harland, **New York: Charles Scribner's Sons, 1883**.

The copyright page separately records an 1871 entry and an **1880 copyright**, and the text immediately presents an **"Introductory of Revised Edition"** dated October 1, 1880. Harland states that she used the new edition to alter the original volume in light of later culinary improvements, modify receipt wording and interpolate later receipts.

The ORA tuple therefore uses the first-publication/copyright year `1871` for a source URL whose exact digitized representation is an **1883 printing of a materially revised 1880 edition layer**.

Exact-edition marker:

`CLASSIFIED_COMMON_SENSE_GUTENBERG_48804__1883_PRINTING__1880_REVISED_EDITION_LAYER__ORA_YEAR_1871_MISMATCH`

Project Gutenberg's U.S. public-domain availability is source evidence only and is not treated as a substitute for the program's Spain-facing source-specific review.

## Authorship and contributor layer

The named author identity is clear: Marion Harland was the pen name of Mary Virginia Hawes Terhune, and independent Library of Congress authority records identify Harland as **1830–1922**.

Her own historical author term is not the blocker. Spain's current Copyright Act transitional provision 4 applies the duration under the 10 January 1879 Act to authors who died before 7 December 1987; Article 6 of the 1879 Act provided the author's life plus eighty years.

The exact book nevertheless documents a material source/contributor layer that the ORA row attribution does not preserve. Harland states that:

- a friend opened her own handwritten cooking manual to Harland;
- Harland spent years "gleaning" and taking contributions from friends;
- receipts she had not tested herself were obtained from unnamed "trustworthy housewives";
- the 1880 revision interpolated additional receipts that reached her after the original publication.

The pinned ORA representation assigns this 928-row cohort simply to **Marion Harland** and `source_year: 1871`; it does not identify which rows derive from the original 1871 layer, the later 1880 revision, the friend's manual, other friends, or unnamed household contributors.

This is a material exact-representation provenance ambiguity under the repository's standing fail-closed admission contract.

## Spain-facing disposition

Hold marker:

`ORA_SOURCE_YEAR_1871_CONFLICTS_WITH_EXACT_GUTENBERG_1883_REVISED_EDITION__UNNAMED_FRIEND_HOUSEWIFE_RECIPE_CONTRIBUTIONS`

Two independent provenance defects prevent admission of this exact ORA source tuple:

1. **edition mismatch:** ORA labels the exact source as 1871 while Gutenberg 48804 is an 1883 printing with an expressly revised 1880 layer; and
2. **flattened contributor lineage:** the source itself documents receipts from unnamed friends/housewives and later additions, while ORA does not preserve contribution-level boundaries.

The age of the historical work and expiry of Harland's own author term do not cure those exact-representation provenance defects under the current Legal Corpus First gate.

The exact source key is excluded until the candidate is rebuilt against a correctly identified edition with sufficient recipe-level provenance, or another documentary source representation clears the same gate.

This is **not** a finding that historical culinary facts, recipe ideas, or the underlying nineteenth-century work are presently protected. It is a fail-closed corpus-admission decision for this exact ORA representation.

No source-specific marginal-value measurement is authorized from this cohort while the hold remains. Therefore no v8019 prewrite, protected population, public activation, recommendation admission, Nutrition/Recipe Family/YT-CUL/Knowledge Core mutation, third shard, D1-budget expansion, or billing expansion is earned from this source.

## Documentary references

- Project Gutenberg ebook 48804: https://www.gutenberg.org/ebooks/48804
- exact Gutenberg HTML showing the 1883 title page, 1871/1880 copyright lines, revised-edition introduction and contributor statements: https://www.gutenberg.org/cache/epub/48804/pg48804-images.html
- Library of Congress authority-bearing records for Marion Harland (1830–1922): https://www.loc.gov/item/16004803/
- Spain Copyright Act, transitional provision 4: https://www.boe.es/buscar/act.php?id=BOE-A-1996-8930
- Spain 1879 Copyright Act, Article 6: https://www.boe.es/buscar/doc.php?id=BOE-A-1879-40001
- pinned ORA source examples: https://github.com/AdamBouhmad/open-recipe-archive/tree/ae3bd2c009a8899dfe63b9166fa98ae3fa8041a8/collections/ye-old-american/recipes
