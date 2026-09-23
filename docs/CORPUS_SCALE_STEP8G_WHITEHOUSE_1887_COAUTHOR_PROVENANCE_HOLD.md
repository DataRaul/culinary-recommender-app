# Step 8G — The Whitehouse Cookbook 1887 co-author provenance hold

Date: 2026-09-23

Status:

`HOLD_PROVENANCE_FAIL_CLOSED__WHITEHOUSE_1887__ORA_OMITS_HUGO_ZIEMANN_COAUTHOR`

## ORA discovery tuple

- collection: `ye-old-american`
- source title: *The Whitehouse Cookbook*
- ORA author: **F.L. Gillette**
- ORA source year: `1887`
- source URL: `https://www.gutenberg.org/ebooks/13923`
- pinned ORA commit: `ae3bd2c009a8899dfe63b9166fa98ae3fa8041a8`
- candidate recipes: **1,499**
- parseable ratio: **1.0**
- unique-title ratio: **0.9573048699132756**
- novel-title ratio: **0.8306620209059233**
- novel normalized titles: **1,192**

## Exact-source documentary findings

Project Gutenberg ebook 13923 identifies the 1887 work as authored by **F. L. Gillette and Hugo Ziemann**. The exact title page says:

- *The White House Cook Book*
- **BY MRS. F. L. GILLETTE AND HUGO ZIEMANN**
- Hugo Ziemann identified as steward of the White House
- 1887

The publishers' preface separately discusses the qualifications of both Ziemann and Gillette and describes the book's authorship as a material feature of the work.

Independent federal cultural-institution metadata likewise identifies the historical work as by **Hugo Ziemann and Mrs. F. L. Gillette**.

## ORA attribution conflict

The pinned ORA candidate tuple assigns the cohort the single author value:

`F.L. Gillette`

That omits Hugo Ziemann despite the exact source title page naming him as co-author.

This is a direct exact-source authorship/provenance conflict. It is not resolved by the work's age or by Project Gutenberg's U.S. public-domain marker. The current admission contract requires the exact reused source representation to carry a defensible authorship/provenance boundary.

Because the omitted co-author's contribution is not separated recipe-by-recipe in the ORA cohort, the project cannot safely reinterpret all 1,499 extracted recipes as solely attributable to Gillette.

## Disposition

Hold marker:

`HOLD_PROVENANCE_FAIL_CLOSED__ORA_SINGLE_AUTHOR_GILLETTE_CONFLICTS_WITH_EXACT_TWO_AUTHOR_GILLETTE_AND_ZIEMANN`

The exact source key is excluded from ranking until the source representation is corrected to preserve the co-authorship and a source-specific review can establish the contribution/rights boundary for the exact recipe cohort.

No marginal-value measurement is authorized while this hold remains. No v8019, production D1 write, public runtime/recommendation activation, YT-CUL mutation, third shard, billing expansion, Nutrition/Recipe Family mutation, or Knowledge Core write is earned.

## Documentary references

- Project Gutenberg ebook 13923 metadata: https://www.gutenberg.org/ebooks/13923
- exact Gutenberg 1887 title page and publishers' preface: https://www.gutenberg.org/files/13923/13923-h/13923-h.htm
- U.S. National Archives store description identifying both authors: https://estore.archives.gov/ford/product/white-house-cook-book
- Smithsonian Libraries metadata identifying Ziemann and Gillette: https://www.si.edu/object/siris_sil_341522
