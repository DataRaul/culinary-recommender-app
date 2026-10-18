# Wikibooks pinned-text acquisition — 2026-10-18

**Implementation and acquisition complete; recipe admission remains HOLD.**
No recipes were added to production. Historical owner baseline remains v8019 / 22,086; no live count verification was performed in this package.

The existing F2 discovery exhausted the source at **3,797** Cookbook pages. The new resumable sequential reader acquired every exact revision and the corresponding talk-page snapshot in **152** cached requests. Missing talk pages are explicit evidence, not a dropped check. Cache identity, requested revision coverage, content model and response hashes are verified before reuse. There was no per-chat recipe limit.

Conservative normalization extracted title, literal ingredient quantities, optionality, directions and supported supplementary sections. It rejects unresolved templates/HTML, nested recipe sections, incomplete lists, source notices and nonempty talk pages for explicit review rather than guessing. The resulting counts are:

| Outcome | Count |
|---|---:|
| Pinned source recipes acquired | 3,797 |
| Structurally extracted | 2,803 |
| Standard text-path notice screen passes, including structural holds | 2,422 |
| Structurally usable candidates without extraction/notice holds | 1,999 |
| Extraction or page-rights review holds | 1,798 |
| Candidate normalized-title match signals | 71 |
| Candidate ingredient/method wording match signals | 0 |
| Novelty/admission established | 0 |
| Production searchable delta / D1 writes | 0 / 0 |

All candidates were screened against all **22,086** pinned v8019 records. The canonical reconstruction verifies the four source commits and record counts, then the assessment verifies every exported fingerprint against its full reconstructed record. Literal wording coverage is 22,083; three existing structural exceptions remain explicit. Wording comparisons exclude heterogeneous quantity fields and do not establish semantic or translated novelty. The 1,999 candidates are **not** 1,999 rights-cleared novel admission-ready recipes.

`buildWikibooksPrewrite` now connects reviewed candidate text to the existing Step 8A two-shard, ten-row batch planner. It rejects absent/stale reviews, source or normalized-text changes, unresolved equivalence, notice/structure holds and unbound evidence hashes. Only review-qualified records can generate a proposed v8020 child plan. The synthetic test is a planner fixture, not a real cohort receipt. The wrapper grants no production write authority; capacity/quota preflight, source-body rendering/hydration, incremental FTS integration, CI, authorized population and owner acceptance remain unearned downstream gates. No live prewrite manifest or v8020 descriptor was generated.

## Durable artifacts and reuse

Public Git contains metadata, source pins, assessment counts, acquisition receipts and fingerprint hashes only. Recipe bodies and talk/source snapshots — including unresolved notices — are preserved in the private `Wikibooks_acquisition_20261018.tar.gz` working archive. Its exact identity is recorded in the app-lane checkpoint. Do not commit those bodies into this public repository or repeat discovery merely because a new chat starts.

The archive includes `recipes.json.gz` (all normalized candidates and their exact source/talk text), `source-cache.tar.gz` (all API responses and receipt), and `v8019-baseline-full.json` (the reconstructed protected baseline). Imported/adapted Wikibooks text remains CC BY-SA 4.0 where that text's page-specific rights path is satisfied; held notices are not waived. Images/media bytes are absent. Each record preserves source-page/revision links, contributor-history attribution, licence URL, modification disclosure, source/talk hashes and timestamps. Source nutrition, recommendations and safety claims are not imported as authority.

To recreate a private working assessment after restoring the archive:

```bash
mkdir -p .cache/wikibooks-20261018
# Extract source-cache.tar.gz into .cache/wikibooks-20261018 first.
node scripts/assess-wikibooks-text.mjs \
  data/generated/wikibooks-20261018/discovery.json \
  .cache/wikibooks-20261018 \
  /path/to/restored/v8019-baseline-full.json \
  .cache/wikibooks-review
```

If baseline reconstruction must be replayed, use the unchanged canonical source loading/count checks with the new explicit private export option:

```bash
node scripts/run-corpus-scale-step8g-ora-next-source-discovery.mjs \
  --ora=/pinned/ora --forkrecipe=/pinned/forkrecipe \
  --unitools=/pinned/unitools --cc0=/pinned/cc0 \
  --baseline-records=.cache/v8019-baseline-full.json
```

The next work is semantic/translated adjudication using these saved bodies and resolution of held page notices or extraction cases. Do not declare novelty from missing titles or from the 0 wording-match count. PR434, Soyer, Brain and Barbecue remain separate. No paid services, shards, full FTS rebuild, runtime changes, recommendation promotion or deployment were performed.
