# HoChiPants origin and semantic review — source-history slice (2026-10-16)

## Decision

**Seven source-origin holds remain; no recipe becomes import-eligible.** A pinned GitHub history review adds traceable per-record source evidence to the prior PR433 rights/structure/literal-dedup assessment. This does not finish full-v8019 semantic or translation comparison, which is recorded as a separate unresolved acceptance condition. The six named Allrecipes adaptations remain held. No production, D1, recommendation or protected-corpus write is part of this package.

## Pinned source facts

Source: `HoChiPants/open-recipe-archive@1d20e28de6df5bbe49447b3042336575f5b7bc01`. Each of the seven unnamed-source records first appears in `e3c7e0dcdd77d92c74fdc3b10081a7937274347b`, the 2026-07-14 repository initialization commit with displayed author Austin Stephens / HoChiPants. Six are also in the file-specific history of `6e7c6f287dc87e44a47e6d043cebc089764d7c7d` (2026-08-21); strawberry overnight oats appears only in the initial commit. Those commits do **not** constitute an originality or rights attestation.

The pinned `LICENSE.md` declares original recipe and ingredient data CC0, not third-party material. `docs/CONTENT_POLICY.md` requires contributors to own rights and warns that source attribution is not permission. `scraping/config/publication-rights.json` has an empty `sources` object at this pin. No individual record has a named source. This supports **origin traceability**, not proven original authorship.

## Semantic comparison: hypotheses, not results

PR433's exact-wording comparison already screened 22,086 reconstructed v8019 records: zero literal title matches and zero complete ingredient/method wording matches, with 22,083 complete wording fingerprints. That screen does **not** eliminate translated recipes, different names for the same technique, or near-identical ingredient/step combinations. This package records search terms for the seven records (for example *houmous*, *chickpea dip*, *banana loaf*, *caprese panini*, *sopa de lentejas*) strictly as candidate queries, **not** identified duplicates.

The three baseline records lacking complete wording fingerprints have not been identified from the committed fingerprint summary and have **not** received manual comparison. They are explicitly retained as mandatory exceptions. A complete semantic review needs the pinned offline full-corpus reconstruction, ingredient/technique comparison and manual checks against these three records. No semantic novelty result is asserted here.

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

Added focused test `tests/hochipants-origin-semantic-review.test.js` to fail if origin labels, incomplete baseline coverage or import boundaries are misrepresented. No PR433 test results are re-claimed as new results. Actual full-v8019 semantic execution, pinned package-quality checker, exact candidate reviews and required CI are pending. Accordingly, this is a **draft HOLD**, not a completed adoption.

Next authorized execution requires access to four clean pinned source checkouts and HoChiPants pin. Rebuild the baseline offline with `scripts/run-corpus-scale-step8g-ora-next-source-discovery.mjs`, locate all three missing-wording baseline indices/titles, search all 22,086 baseline recipes for aliases and ingredients/method similarities, manually adjudicate seven recipe candidates and record rights disposition. Even after a candidate is distinct, separately gate rights and prewrite/capacity before any recipe import.
