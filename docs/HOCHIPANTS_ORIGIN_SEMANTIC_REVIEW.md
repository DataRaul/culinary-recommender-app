# HoChiPants origin and semantic review — source-history slice (2026-10-16)

## Decision

**Seven source-origin holds remain; no recipe becomes import-eligible.** A pinned GitHub history review adds traceable per-record source evidence to the prior PR433 rights/structure/literal-dedup assessment. This does not finish full-v8019 semantic or translation comparison, which is recorded as a separate unresolved acceptance condition. The six named Allrecipes adaptations remain held. No production, D1, recommendation or protected-corpus write is part of this package.

## Pinned source facts

Source: `HoChiPants/open-recipe-archive@1d20e28de6df5bbe49447b3042336575f5b7bc01`. Each of the seven unnamed-source records first appears in `e3c7e0dcdd77d92c74fdc3b10081a7937274347b`, the 2026-07-14 repository initialization commit with displayed author Austin Stephens / HoChiPants. Six are also in the file-specific history of `6e7c6f287dc87e44a47e6d043cebc089764d7c7d` (2026-08-21); strawberry overnight oats appears only in the initial commit. Those commits do **not** constitute an originality or rights attestation.

The pinned `LICENSE.md` declares original recipe and ingredient data CC0, not third-party material. `docs/CONTENT_POLICY.md` requires contributors to own rights and warns that source attribution is not permission. `scraping/config/publication-rights.json` has an empty `sources` object at this pin. No individual record has a named source. This supports **origin traceability**, not proven original authorship.

## Semantic comparison: full-corpus gate pending; three exceptions checked

PR433's exact-wording comparison already screened 22,086 reconstructed v8019 records: zero literal title matches and zero complete ingredient/method wording matches, with 22,083 complete wording fingerprints. That screen does **not** eliminate translated recipes, different names for the same technique, or near-identical ingredient/step combinations. This package records search terms for the seven records (for example *houmous*, *chickpea dip*, *banana loaf*, *caprese panini*, *sopa de lentejas*) strictly as candidate queries, **not** identified duplicates.

The three previously unnamed exceptions are now **identified by source identity and zero-based v8019 index**, without exposing recipe bodies: `eggs.md` (1490), `peanut-butter.md` (1569), and `spices-during-pregnancy.md` (1618). This follows from the pinned `sylGauthier/recipes@b12e481d1c220a13e0847a34e148d5872a16928e` Git tree (226 `src/*.md` files, lexical positions 74/153/202), the v8019 builder ordering (501 UniTools + 915 ForkRecipe before CC0), and the earlier normalization mapping showing zero parsed ingredients for all three. The pinned GitHub recursive tree was independently inspected on 2026-10-17 (230 tree entries, non-truncated; exactly 226 `src/*.md` files), confirming lexical positions 74/153/202 and derived zero-based v8019 indices 1490/1569/1618 using the previously documented cohort offset 1416. **This still does not replay the v8019 fingerprint export or confirm materialized generated-record content.** The source files themselves were then compared with all seven pinned HoChiPants candidate recipe JSON records (3 × 7 = 21 source-content pairs); no recipe-equivalent pair was identified. `eggs.md` covers cooking eggs, not the banana-cake method (which merely uses an egg); `peanut-butter.md` covers grinding roasted peanuts, unlike chickpea/tahini hummus; `spices-during-pregnancy.md` is non-recipe advice, not a candidate cooking process. This limited manual check clears only the three-source-file comparison subtask, **not** cross-corpus semantic novelty. Full v8019 reconstruction, multilingual/ingredient/method ranking, recipe-by-recipe adjudication, and origin/rights holds remain.

## Individual dispositions

| Recipe | Origin | Semantic / translated dedup | Import |
|---|---|---|---|
| Strawberry overnight oats | Unattested | Not executed; berry-oat/bircher aliases queued | HOLD |
| One-bowl banana cake | Unattested | Not executed; banana loaf/bread aliases queued | HOLD |
| Strawberry lemon spritz | Unattested | Not executed; lemonade/soda aliases queued | HOLD |
| Tomato cucumber salad | Unattested | Not executed; multilingual tomato-cucumber aliases queued | HOLD |
| Caprese grilled cheese | Unattested | Not executed; panini/toastie aliases queued | HOLD |
| Classic hummus | Unattested | Not executed; houmous/chickpea dip aliases queued | HOLD |
| Everyday lentil soup | Unattested | Not executed; lentil soup/pottage translations queued | HOLD |

Source-history and query details: `data/generated/step8g/hochipants-origin-semantic-review.json`. Prior literal assessment: `data/generated/step8g/hochipants-acquisition-assessment.json`.

## Validation and next gate

Added focused test `tests/hochipants-origin-semantic-review.test.js` to fail if origin labels, incomplete baseline coverage or import boundaries are misrepresented. No PR433 test results are re-claimed as new results. The three exceptional pinned source files have been manually compared with seven source candidates (21 pairs, no equivalence found); the actual full-v8019 semantic execution, pinned package-quality checker, final candidate reviews and new required CI are still pending. Accordingly, this is a **draft HOLD**, not a completed adoption.

Next authorized execution requires access to four clean pinned source checkouts and HoChiPants pin. Rebuild the baseline offline with `scripts/run-corpus-scale-step8g-ora-next-source-discovery.mjs`, verify the three derived missing-wording indices against the complete fingerprint export and confirm those three source identities against the actual reconstructed fingerprint export; then search all 22,086 baseline recipes for aliases and ingredients/method similarities, manually adjudicate seven recipe candidates and record rights disposition. Even after a candidate is distinct, separately gate rights and prewrite/capacity before any recipe import.
