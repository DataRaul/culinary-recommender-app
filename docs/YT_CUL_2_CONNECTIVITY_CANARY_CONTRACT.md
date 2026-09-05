# YT-CUL-2 — Tiny Live Connectivity Canary Contract

Date: 2026-09-05

Status: `PASS / MERGED_GREEN`

Canonical implementation: PR #58, merged to `main` at `56104c104e63342772e0db4dbf21d8ebf8b471ca`.

Live canary evidence: workflow run `33984625070`, job `101355772558`.

## Activation boundary

YT-CUL-2 was allowed only after YT-CUL-1 completed outside Git history:

- one distinct Culinary Google Cloud project exists;
- YouTube Data API v3 is enabled for that project;
- the restricted API key is stored only as GitHub secret `CULINARY_YOUTUBE_API_KEY`;
- the project's actual assigned **Search Queries** daily limit was verified in Google Cloud Console as `100/day` on 2026-09-05.

The key itself is not stored or reproduced here.

## Live spend and result

Current official YouTube documentation was rechecked immediately before activation on 2026-09-05. The canary then performed exactly one `search.list` request with `maxResults=1`.

Terminal result:

- result: `PASS`;
- HTTP status: `200`;
- Search Queries daily limit: `100`;
- Search calls planned: `1`;
- Search calls executed: `1`;
- protected reserve: `5`;
- remaining acquisition capacity before the protected reserve after the canary: `94`;
- result slots observed: `1`.

The earlier fail-closed preflight attempt stopped before the live step because the non-secret quota value had not yet been supplied and therefore consumed `0` YouTube Search calls.

## Credential and quota separation

Only `CULINARY_YOUTUBE_API_KEY` was mapped into the canary job. No Blue Lagoon credential, quota ledger, planner state or evidence participated.

The API key was sent through the `X-Goog-Api-Key` request header rather than embedded in the request URL, and neither the key nor its length/hash was emitted.

## Raw API Data boundary

The live response may contain YouTube API Data such as IDs, titles, descriptions and channel names. Those fields were not written to Git, workflow summaries or durable reports.

For the connectivity test only, the response was written to a runner-local temporary file with seven-day transient TTL metadata, then deleted before the job exited. The durable canary result contained counts and control-plane facts only.

No artifact upload step existed for the transient payload.

## Validation

The dedicated canary safety suite passed `11/11` focused YT-CUL-0/YT-CUL-2 tests.

Normal pull-request validation passed, including `npm run validate` and browser acceptance. Post-merge main validation run `33984711330` also passed. GitHub Pages build/deploy run `33984710650` passed.

## PASS criteria resolution

All YT-CUL-2 PASS criteria are satisfied:

1. preflight secret/quota/project checks passed;
2. one `search.list` request returned HTTP 200 with the expected `items` array;
3. exactly one Search Queries call was recorded;
4. the protected five-call reserve remained untouched;
5. transient raw API Data was deleted before job exit;
6. the durable summary contained no raw YouTube API metadata;
7. no Blue Lagoon credential or planner state participated.

YT-CUL-2 is therefore complete. The next roadmap phase is `YT-CUL-3 — one-day bounded discovery pilot`; it is not part of this canary and has not been executed by this closeout.
