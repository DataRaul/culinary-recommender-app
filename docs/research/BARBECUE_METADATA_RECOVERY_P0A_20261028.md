# BBQ metadata recovery — P0A preflight and gated P0B/P0C implementation

Date: 2026-10-28. Scope: existing `DataRaul/culinary-recommender-app`, roadmap PR #441.

## Inventory and reused controls

- Existing metadata-capable project identity: `CULINARY_YOUTUBE_PROJECT_IDENTITY`, API key contract: `CULINARY_YOUTUBE_API_KEY`, already wired to the scheduled Barbecue GitHub Actions workflow. The presence/value of a live secret in the current execution context is **not verified**. No secret was read or copied.
- Existing durable source: `data/generated/barbecue-technique-corpus-state.json`; existing config: `config/barbecue_technique_corpus_v1.json`; existing policy audit: `docs/research/BARBECUE_YOUTUBE_POLICY_RECHECK_20261025.md`; existing review audit: `scripts/audit-barbecue-review-queue.mjs`.
- Baseline: 44 pending candidate occurrences; five leaves, with chicken complete; 15 qualified source records in total (6 chicken + 2 brisket + 4 ribs + 1 fish + 2 vegetables). Last quota date October 28, 0 scheduled Search calls then. No active hard hold. `5zuQFx2J0jM` is a cross-leaf duplicate; two pork candidates share a previously-qualified channel.
- Google documentation identifies **one quota unit each** for `videos.list` and `channels.list` requests; **not** the `search.list` budget. Quota allocation and real-time use must be verified for the *existing project* in its Cloud Console; do not infer metadata headroom from the scheduled Search contract or a successful workflow.
- Existing protected reserve: >=5; pacing: >=1000 ms. Existing rights constraint: no copied recipe prose, raw API payload history, video, audio, images or transcripts. Existing official policy requires non-authorized API data to be deleted/refreshed within 30 days, and the metadata snapshot has a 30-day expiry.
- Official references: https://developers.google.com/youtube/data/reference/rest/v3/videos/list ; https://developers.google.com/youtube/data/reference/rest/v3/channels/list ; https://developers.google.com/youtube/data/determine_quota_cost ; https://developers.google.com/youtube/terms/developer-policies .

## Gate dispositions

- **P0A source inventory / software policy:** PASS for design and offline tests. **P0A live credential/quota:** HOLD `BLOCKED_LIVE_METADATA_ACCESS` / `BLOCKED_METADATA_QUOTA_UNVERIFIED` until the current job verifies its existing API key and an owner-attested existing-project Cloud Console check shows date-matched available metadata units minus two pilot requests still protects >=5 reserve units. No metadata calls were made in this preparation.
- **P0B:** Default-off `scripts/barbecue-metadata-review-adapter.mjs` implements metadata-only ID lookup for existing candidates; only 3 different pork-rib creator channels in the live scope; read-only `videos.list` and `channels.list` with field filtering; compact ID/status/expiry/review-pending evidence. No source admission.
- **P0C:** `tests/barbecue-metadata-review-adapter.test.js` is the deterministic test contract: full 44-candidate audit, cross-leaf/channel duplication, batches, negative ID scope, missing source, mismatched channel, provider/pagination errors, restart-safe charge reservations, expiry, no forbidden side effects. Passing CI must be checked against the exact PR head.
- **P0D:** Do not run until all live P0A gates, exact three IDs, available key, dated quota proof, >=5 reserve, and required CI pass. No duplicate Search or manual daily workflow dispatch.
- **P0E:** All sources remain `NEEDS_EVIDENCE` until actual source-specific relevance, independently verified creator credentials, and independence evidence are reviewed. API metadata alone cannot qualify a source.
- **P0F:** Merge only after required PR validation. Preserve the scheduler, record the missing live gate, and verify current main/next scheduled work-unit separately. No automatic promotion to public app, Knowledge Core, protected D1, or billing.

## Owner action if live gate remains blocked

Provide **only** non-secret Cloud Console evidence for the existing Culinary project: quota date, quota remaining for metadata endpoints, protected reserve, and confirmation that `CULINARY_YOUTUBE_API_KEY` is enabled for metadata reads in the permitted execution environment. Do not paste the API key. No automatic fallback to another project or paid quota.

## Evidence leads located independently of YouTube API (NOT qualification)

Three existing pork-rib candidate IDs have independent public-web cross-references. These are research leads only, **not** source qualification, not proof of current YouTube availability, and not a substitute for gated P0D and creator/channel identity matching.

| Existing candidate ref | Independent source-specific link | Independent competence reference | Unresolved before any QUALIFIED decision |
|---|---|---|---|
| `youtube:vEJrAdL8_cI` | https://www.bbq-brethren.com/threads/rub-deosnt-stick-to-fat.299187/ (discussion identifies Myron Mixon as presenter) | https://myronmixon.com/pages/about-myron | Confirm exact video and publisher against stored channel; distinguish competition instruction from general advice |
| `youtube:Fb9roj9CaxY` | https://www.bilibili.com/video/BV1ip4y1k7xK/ (third-party repost attributes an Eater feature to Rodney Scott; treat repost as untrusted identity lead) | https://www.jamesbeard.org/stories/the-2018-james-beard-award-winners (2018 Best Chef Southeast: Rodney Scott) | Verify exact original YouTube uploader, on-screen practitioner, independent source unit, pork-rib scope and provenance; Eater publisher != presenter |
| `youtube:6xUZleFdLn8` | https://cookingwithcheftuan.com/blog/f/make-delicious-bbq-ribs-at-home-like-a-pro (links exact video as Tuffy Stone's competition-rib technique) | https://www.weber.com/US/en/weber-ambassadors-Tuffy-Stone.html | Verify exact video uploader/creator channel, present availability, independently normalized technique and identity |

No YouTube `search.list`, `videos.list`, or `channels.list` call was made to collect these web leads. No new `QUALIFIED` or `REJECTED` decision was written; all affected candidates remain pending `NEEDS_EVIDENCE`. The third-party repost is a finding aid only and must not be admitted as a separate independent source.
