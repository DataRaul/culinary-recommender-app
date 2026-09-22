# Step 8G — Amelia Simmons / American Cookery 1796 transcriber-provenance hold

Date: 2026-09-23

Status:

`HOLD_PROVENANCE_FAIL_CLOSED__AMERICAN_COOKERY_1796__UNNAMED_PRESS_PREPARER_ALTERATIONS__ORA_PRESERVES_UNCORRECTED_VALUES`

## Exact discovery tuple

- collection: `ye-old-american`
- source title: *American Cookery*
- ORA author: **Amelia Simmons**
- ORA source year: `1796`
- exact source URL: `https://www.gutenberg.org/ebooks/12815`
- pinned ORA commit: `ae3bd2c009a8899dfe63b9166fa98ae3fa8041a8`
- post-v8018 discovery rows: **122**
- parseable ratio: **1.0**
- unique-title ratio: **0.9344262295081968**
- novel-title ratio: **0.8947368421052632**
- novel normalized titles: **102**
- ORA licence marker: `public-domain`

## Exact work / edition identity

Independent bibliographic evidence identifies the historical work represented by the source as the Hartford 1796 first edition of *American Cookery*, printed by Hudson & Goodwin **for the author**, Amelia Simmons. The Library of Congress record identifies the same work, printer/place/year, notes that it was published according to Act of Congress, and records an **errata leaf** in the 1796 copy.

Project Gutenberg ebook 12815 reproduces that Hartford 1796 title-page identity and separately credits the modern electronic transcription/proofreading team. Project Gutenberg's U.S. public-domain classification is useful source evidence but is not used as the project's Spain-facing rights conclusion by itself.

Exact-edition marker:

`CLASSIFIED_EXACT_HARTFORD_1796_HUDSON_GOODWIN_FOR_AMELIA_SIMMONS__ERRATA_LEAF_PRESENT`

## Authorship and material press-preparer ambiguity

The title page identifies **Amelia Simmons** as author. However, the exact historical edition itself contains an advertisement/errata in which Simmons says that, because she could not prepare the work for press herself, another person was employed and entrusted with the receipts to prepare them for publication. She states that this person omitted essential material and substituted other material without her consent.

The errata then identifies concrete recipe-level corrections, including:

- Rice Pudding No. 2: one pound butter -> half pound; 14 eggs -> 8;
- Plain Cake: one quart emptins -> one pint;
- Another Plain Cake No. 5: nine pounds flour -> eighteen pounds;
- additional corrections to other puddings and pastes.

The unnamed press preparer is not sufficiently identified in the exact source to classify that person's contribution, authorship role, or any protectable editorial contribution independently. More importantly for this corpus, the pinned ORA representation does not consistently reconcile the errata back into the extracted recipes.

Pinned ORA examples:

- `collections/ye-old-american/recipes/plain-cake.md` retains **1 quart emptins**, while the 1796 errata says to read **1 pint**;
- `collections/ye-old-american/recipes/another-plain-cake.md` retains **9 pounds flour**, while the 1796 errata says to read **18 pounds**.

This is therefore not a merely theoretical contributor issue. The exact candidate representation contains recipe values that the named author explicitly corrected after attributing the incorrect values to an unnamed press preparer.

## Spain-facing rights boundary

Spain's current Copyright Act provides the ordinary life-plus-70 term in Article 26. Transitional provision 4 preserves the duration under the 10 January 1879 Act for authors who died before 7 December 1987; Article 6 of the 1879 Act provided an eighty-year post-mortem exploitation term.

The historical age of this 1796 material strongly indicates that ordinary exploitation terms are not a practical present-day barrier. Nevertheless, this repository does **not** convert that observation into a source-admission PASS because the active gate is rights **and provenance for the exact reused representation**, and the user's standing rule is to fail closed on material editor/contributor/edition ambiguity.

The unresolved issue is therefore the exact representation and attribution boundary: an unnamed press preparer materially altered recipe text, the author's errata identifies the alterations, and the ORA extraction demonstrably preserves at least some uncorrected altered values.

## Disposition

Hold marker:

`HOLD_PROVENANCE_FAIL_CLOSED__EXACT_1796_EDITION_UNNAMED_PRESS_PREPARER_ALTERATIONS__ORA_EXTRACT_PRESERVES_UNCORRECTED_RECIPE_VALUES`

The exact source key is excluded from candidate ranking until a bounded source-repair/provenance review can establish an authoritative corrected representation and a defensible attribution boundary for the exact recipe rows.

This is **not** a finding that historical recipe ideas, culinary facts, or the 1796 book as such are presently protected. It is a fail-closed corpus admission decision for this exact ORA representation.

No source-specific marginal-value measurement is authorized from this cohort while the hold remains. Therefore no v8019 prewrite, protected population, public activation, recommendation admission, Nutrition/Recipe Family/YT-CUL/Knowledge Core mutation, third shard, D1-budget expansion, or billing expansion is earned from *American Cookery* at this step.

## Documentary references

- Project Gutenberg ebook 12815, exact Hartford 1796 transcription including title page, advertisement and errata: https://www.gutenberg.org/ebooks/12815
- Project Gutenberg HTML text, including the advertisement/errata: https://www.gutenberg.org/cache/epub/12815/pg12815.html
- Library of Congress exact 1796 item record, including Hartford / Hudson & Goodwin / errata-leaf metadata: https://www.loc.gov/item/96126967/
- Library of Congress discussion of the 1796 errata and press-preparer dispute: https://blogs.loc.gov/bibliomania/2026/02/18/sugar-and-spice-and-everythingnot-so-nice/
- Spain Copyright Act, Article 26 and transitional provision 4: https://www.boe.es/buscar/act.php?id=BOE-A-1996-8930
- Spain 1879 Copyright Act, Article 6: https://www.boe.es/buscar/doc.php?id=BOE-A-1879-40001
- pinned ORA Plain Cake representation: https://github.com/AdamBouhmad/open-recipe-archive/blob/ae3bd2c009a8899dfe63b9166fa98ae3fa8041a8/collections/ye-old-american/recipes/plain-cake.md
- pinned ORA Another Plain Cake representation: https://github.com/AdamBouhmad/open-recipe-archive/blob/ae3bd2c009a8899dfe63b9166fa98ae3fa8041a8/collections/ye-old-american/recipes/another-plain-cake.md
