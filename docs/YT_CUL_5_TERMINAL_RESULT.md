# YT-CUL-5 — Terminal Result

Date: 2026-09-05

Status: **PASS / YT_CUL_5_USEFUL_BUT_REVIEW_BOUND / ATLAS_EXPANSION_CADENCE_NOT_EARNED**

Live workflow run: `33987345201`

## Terminal decision

YT-CUL-5 successfully executed the preregistered bounded channel/playlist-first Atlas-discovery cadence, but it **did not earn a production Atlas-expansion cadence**.

The live lane proved that the YT-CUL-4 acquisition architecture continues to expose a large downstream discovery surface. It also exposed the next binding constraint more sharply: **independently reachable Recipe-structured pages are not automatically relevant World Recipe Atlas family evidence**.

Canonical result:

`YT_CUL_5_USEFUL_BUT_REVIEW_BOUND`

`YT_CUL_6` is not automatically earned or started.

## Live evidence

Safety/control validation before live spend: **38/38 PASS**.

Search quota:

- verified project Search Queries daily limit: `100`;
- successful Search calls before YT-CUL-5: `33`;
- YT-CUL-5 Search calls planned/executed: `10/10`;
- protected reserve: `5`;
- known successful Search calls through YT-CUL-5: `43`;
- remaining before protected reserve: `52`.

Lower-cost reads:

- `channels.list`: `1`;
- `playlistItems.list`: `26`;
- `videos.list`: `12`;
- total general reads: `39`.

Discovery funnel:

- preregistered focus areas: `5`;
- channel Search result slots: `11`;
- playlist Search result slots: `39`;
- unique transient channel candidates: `11`;
- unique transient playlist candidates: `39`;
- playlist surfaces inspected: `26`;
- transient unique video pointers: `568`;
- independent external-source pointers observed transiently: `812`;
- independent review attempts: `60`;
- independently reachable/reviewed external pages: `14`;
- independently confirmed Recipe-structured pages: `3`;
- unique confirmed source domains: `1`.

Search efficiency:

- YT-CUL-4 independently confirmed Recipe pages/Search call: `0.625`;
- YT-CUL-5 independently confirmed Recipe pages/Search call: `0.30`;
- ratio versus YT-CUL-4: `0.48`.

## Post-run semantic authority audit

The execution runner initially represented the three independently confirmed Recipe pages as three identity-oriented discovery handoffs. A post-run audit inspected what that actually proved.

All three confirmed Recipe pages came from one general recipe site. They demonstrated an independent recipe-source pathway, but the external pages themselves did **not** establish that the named recipes corresponded to the intended macro-region, family, meal-role, technique or variant gap. Treating them as Atlas-family nominations would therefore overstate the evidence.

The canonical authority correction is:

`INDEPENDENT_RECIPE_STRUCTURED_PAGE != ATLAS_FAMILY_RELEVANCE`

Accordingly:

- independent Recipe-source review pointers: `3`;
- verified Knowledge Core Atlas relevance mappings: `0`;
- canonical Atlas family candidates nominated: `0`;
- Atlas lifecycle promotions: `0`;
- Knowledge Core state changes: `0`;
- app handoffs/admissions: `0`;
- public recipes admitted: `0`.

The executed run's raw safe summary remains historical evidence. Its internal `atlasFamilyCandidatesNominated=3` interpretation is superseded for canonical decision purposes by the explicit post-run relevance gate in `scripts/youtube-culinary-atlas-relevance-gate.mjs`.

## What was learned

1. Channel/playlist-first acquisition remains efficient at reaching many videos and external pointers with limited Search spend.
2. Search breadth is no longer the principal bottleneck.
3. Independent page reachability and Recipe structured data are necessary but insufficient for Atlas-family relevance.
4. Source diversity was weak in this run: all confirmed Recipe pages came from one domain.
5. The next information-gain problem is **relevance + source-diversity review**, not simply more Search calls.

## Controls preserved

- raw YouTube API Data durable: `false`;
- transient raw payload deleted before job exit: `true`;
- unreviewed external URLs durable: `false`;
- YouTube statistics read: `false`;
- creator/authenticity/engagement scores: `false`;
- Search pagination: `false`;
- playlist pagination: `false`;
- audiovisual download: `false`;
- Blue Lagoon credential/quota/evidence cross-use: `false`;
- automatic Atlas promotion: `false`;
- automatic app admission: `false`;
- public runtime activation: `false`;
- gross YouTube results reported as recipes acquired: `false`.

## Rerun boundary

The live YT-CUL-5 workflow is closed after the terminal run. It no longer maps the YouTube API secret and cannot replay the stale `33` prior-call assumption.

Any later YouTube live phase must begin from the now-known `43` successful Search calls on the 2026-09-05 quota day if still operating in that quota vintage, perform a fresh policy/project-quota reconciliation, preregister its own bounded purpose, and preserve the five-call reserve.

## Next YouTube decision

Do **not** start YT-CUL-6 from this result.

A future continuation is earned only as a **review/relevance architecture improvement**, with the objective of converting independently reviewed recipe-source pointers into genuinely Atlas-relevant, source-diverse nominations through the canonical Knowledge Core review boundary. Additional raw Search spend is not justified until that review mapping is defined.
