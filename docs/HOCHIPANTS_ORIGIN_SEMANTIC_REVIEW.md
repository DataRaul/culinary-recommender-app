# HoChiPants origin and semantic assessment — 2026-10-17

## Decision

**Zero recipes become import-eligible.** PR434 now reproduces the full pinned v8019 baseline, executes ranked multilingual ingredient/method retrieval across all seven × 22,086 pairs, and records 19 selected source-level comparisons. **Exhaustive semantic/translated deduplication remains HOLD.** A finite vocabulary and selected manual inspection cannot establish its recall. Seven individual origin/reuse holds and six named third-party adaptation holds remain. This is assessment progress, not acquisition or legal clearance; the PR remains draft pending its original outstanding gates.

## Baseline replay

The existing discovery loader reconstructed all **22,086** v8019 records from clean checkouts at:

| Input | Commit |
|---|---|
| AdamBouhmad/open-recipe-archive | `ae3bd2c009a8899dfe63b9166fa98ae3fa8041a8` |
| ForkRecipe baseline | `c32255266af39bd77444d39452f3df8088ac8fd9` |
| UniTools baseline | `1d09e9548d957dd0375301146a86dddf5e269c1b` |
| sylGauthier/recipes | `b12e481d1c220a13e0847a34e148d5872a16928e` |

The canonical compact-JSON fingerprint hash is exactly the prior PR433 value: `426e44c607151b19ec85aeab7993e0a098a55c84c63202e227df18ae4b71562a`. All 22,086 titles and 22,083 complete wording hashes reconcile. Zero-based exceptions are `eggs.md` **1490**, `peanut-butter.md` **1569**, and `spices-during-pregnancy.md` **1618**; their reconstructed filenames and ingredient/direction counts agree with the earlier source-tree identification. All three source files and reconstructed records were checked against all seven candidates (21 pairs), without an equivalent recipe pair identified in that limited set. Eggs and pregnancy advice have no parsed recipe method; peanut butter has eight method lines but no parsed ingredients. The original source inspection therefore remains necessary. No live D1 equality is claimed.

## Full-range ranked retrieval and manual findings

`data/generated/step8g/hochipants-semantic-ranked-matches.json` records **154,602** scores, the top 12 per candidate (84 retained ranks), and up to 30 supplementary title/alias hits per candidate. It publishes only titles, indices, concepts, counts, scores and findings, never source recipe prose. The explicit vocabulary covers English, Spanish, French, German, Danish, Swedish, Italian and Russian forms. It processes all available bilingual names, ingredient names and normalized cooking instructions, including ForkRecipe process-node instructions rather than only action labels.

Scoring is disclosed in the artifact. Scores are uncalibrated retrieval signals. Negation, optional ingredients, quantities, ordering, historical language and unknown synonyms remain unresolved. Not every retained rank or title hit was manually adjudicated. Absence from the retained ranks is not evidence of novelty.

| Candidate | Selected baseline comparisons | Finding / disposition |
|---|---|---|
| Strawberry overnight oats | 380 Bircher muesli; 12143 Havregrød | Related cold-soaked oat breakfast versus subsequently boiled porridge; dairy/fruit/process differences remain. Novelty HOLD. |
| One-bowl banana cake | 1428 and 546 banana bread; 1430 banana muffins | Close banana-batter mixing/baking family; form, ingredients and quantities differ. Not an exact-duplicate determination. Novelty HOLD. |
| Strawberry lemon spritz | 2025 Moselle Cup No. 2; 18452 Sauterne Cup | Fruit/soda/citrus overlap; alcoholic cups differ from the honey-sweetened alcohol-free preparation. Novelty HOLD outside inspected pairs. |
| Tomato cucumber salad | 18671 and 17582 tomato/cucumber salads; 13 Horiatiki | Related raw vegetable salad family with different dressings, presentation and additions. Novelty HOLD. |
| Caprese grilled cheese | 1370 Torta Caprese; 18678 Tomato Cream Toast; 708 Croque-Monsieur; 12574 Oste-Sandwiches | Cake-name false friend and distinct tomato toast; related cheese-sandwich variants differ in filling and cooking. Novelty HOLD. |
| Classic hummus | 47, 859 and 1520 hummus | Same chickpea/tahini dip family and closely related emulsification; dry/cooked starting state, seasoning and sequence differ. Novelty HOLD. |
| Everyday lentil soup | 945 Red Lentil Soup; 1530 Lebanese Lentil Soup | Related lentil/onion/lemon soups; lentil type, vegetables, spices and pureeing differ. Novelty HOLD. |

The 19 comparisons are individual ingredient-and-method findings in `hochipants-origin-semantic-review.json`. Family similarity alone does not reject useful variants under the acquisition-first roadmap. No exact duplicate or novel import candidate is certified here.

## Individual provenance and reuse rights

Pinned source: `HoChiPants/open-recipe-archive@1d20e28de6df5bbe49447b3042336575f5b7bc01`. All seven unsourced finalized records occur in initialization `e3c7e0dcdd77d92c74fdc3b10081a7937274347b` (2026-07-14; displayed author Austin Stephens / HoChiPants). Six also occur in file history at `6e7c6f287dc87e44a47e6d043cebc089764d7c7d`; strawberry oats has no later record commit. This traces Git history without establishing original authorship.

The pinned `LICENSE.md` covers original data with CC0 and excludes third-party material. `docs/CONTENT_POLICY.md` requires rights and distinguishes attribution from permission. `scraping/config/publication-rights.json` has no source entries. Each record therefore retains `HOLD_ORIGIN_UNATTESTED`; the six named Allrecipes adaptations retain their prior HOLD. These are evidence dispositions, not infringement findings.

Two later scraped candidates in the same pinned repository have the IDs `strawberry-overnight-oats` and `tomato-cucumber-salad`, attributed to Tastes Better From Scratch and retrieved on August 19. Their ingredients/methods differ from finalized records (oats scrape adds yogurt/chia/banana; salad scrape uses vinegar/basil). Finalized records precede those retrieval timestamps, but retrieval dates do not establish external publication dates or independent creation. Shared IDs and related dishes prove neither derivation nor originality. Record-level metadata locators and findings are retained without reproducing scraped prose. No external permission or author attestation was obtained.

## Reproduction and validation

The loader's optional `--local-review-records=/existing/scratch/directory/local-records.json` requires `--baseline-fingerprints`, all four clean source pins, an output outside the repository, and a nonexistent destination. It emits source-content-bearing normalized records **for local analysis only** with restrictive permissions. Never commit or publish that file. Existing fingerprint-only behavior is unchanged.

```bash
node scripts/run-corpus-scale-step8g-ora-next-source-discovery.mjs --ora=/pinned/ora --forkrecipe=/pinned/forkrecipe --unitools=/pinned/unitools --cc0=/pinned/cc0 --baseline-fingerprints=/scratch/fingerprints.json --local-review-records=/scratch/local-records.json
node scripts/run-hochipants-semantic-review.mjs /scratch/local-records.json /scratch/fingerprints.json /pinned/hochipants data/generated/step8g/hochipants-semantic-ranked-matches.json
node --test tests/acquisition-record-assessment.test.js tests/hochipants-origin-semantic-review.test.js tests/hochipants-semantic-review.test.js
```

Actual final QA and same-chat review/checker results are separate frozen quality sidecars under `docs/package_quality/evidence/hochipants-origin-review/`. Review-method readiness never clears candidate rights or exhaustive semantic novelty. Required CI is evaluated at the published head; old CI is not re-claimed for new code. Preserve PR428/429, PR432 HOLD/exhausted budget, Based Cooking STOP, Brain and Barbecue. No D1, protected corpus, runtime or import writes.

## Remaining gate

Keep PR434 draft while full semantic/translated dedup and per-record origin clearance remain unresolved. Continue from the exact replay and ranked findings rather than repeating reconstruction without changed inputs. Further adjudication must improve synonym/translation coverage and source-level evidence, and settle whether a useful variant is truly equivalent. No successor package or import is authorized by this report.
