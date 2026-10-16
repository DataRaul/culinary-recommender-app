# HoChiPants acquisition assessment — 2026-10-16

This package implements a reproducible, no-write assessment of the 13 finalized catalog records at `HoChiPants/open-recipe-archive@1d20e28de6df5bbe49447b3042336575f5b7bc01`. It is a separate repository from AdamBouhmad's ORA. Raw scrape/staging collections are outside this package.

All 13 have source-backed titles, ingredient items and sequential method steps. Six declare Allrecipes adaptations and remain `HOLD_THIRD_PARTY_ADAPTATION`. Seven have no named source: the pinned LICENSE dedicates original repository data under CC0, but absent source metadata does not independently establish authorship. They remain `CC0_DECLARATION_FOUND__ORIGIN_REVIEW_REQUIRED`. The publication-rights registry at this pin has no source entries. These are repository evidence classifications, not a legal opinion or permission to import. No source instructions, photographs or recipe bodies are republished here.

The existing pinned baseline loader reconstructs all 22,086 v8019 records from the four accepted source revisions. A new metadata-only export feeds the assessment. Every candidate is compared against every baseline record by normalized title and ingredient/method wording. There are zero matches in either screen. All baseline records have titles; 22,083 have complete ingredient/method wording fingerprints, and the remaining three are included with null hashes. Quantities are excluded because source schemas differ. A wording match would be a review candidate, not automatic deduplication; zero wording matches does not establish semantic novelty. Translations, variants, punctuation and cross-schema differences can evade this deliberately narrow screen. This verifies reconstruction, not current live D1 equality.

Reproduce from clean checkouts of the four pins already enforced by the existing discovery loader:

```sh
node scripts/run-corpus-scale-step8g-ora-next-source-discovery.mjs --ora=/pinned/ora --forkrecipe=/pinned/forkrecipe --unitools=/pinned/unitools --cc0=/pinned/cc0 --baseline-fingerprints=.tmp/v8019-fingerprints.json
node scripts/run-hochipants-acquisition-assessment.mjs /pinned/hochipants .tmp/v8019-fingerprints.json data/generated/step8g/hochipants-acquisition-assessment.json
node --test tests/acquisition-record-assessment.test.js
```

The source assessment reads pinned Git objects rather than mutable source worktree files; the baseline exporter rejects dirty checkouts. Generated assessment metadata records each recipe's path/hash and policy/catalog hashes without copying source prose. The report contains baseline indices for matching candidates, not source recipe content.

Next bounded package: review origin of the seven CC0-declared records and semantic/translated duplicate candidates without writes. The six adaptations stay held absent adequate record-specific rights evidence. A later clean cohort must separately pass capacity/prewrite and import authorization. Protected v8019, runtime, PR428/429/432, Based Cooking STOP and other lanes are preserved. PR432's exhausted budget is not reused or reset.
