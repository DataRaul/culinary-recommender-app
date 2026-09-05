# YT-CUL-2 — Tiny Live Connectivity Canary Contract

Date: 2026-09-05

Status: `IMPLEMENTED_PENDING_LIVE_CANARY_RESULT`

## Activation boundary

YT-CUL-2 is allowed only after YT-CUL-1 has been completed outside Git history:

- one distinct Culinary Google Cloud project exists;
- YouTube Data API v3 is enabled for that project;
- the restricted API key is stored only as GitHub secret `CULINARY_YOUTUBE_API_KEY`;
- the project's actual assigned **Search Queries** daily limit has been verified in Google Cloud Console.

The canary runner receives that non-secret verified limit through repository variable `CULINARY_YOUTUBE_SEARCH_DAILY_LIMIT`. This is a transport for the already-required YT-CUL-1 fact, not a new quota assumption. Optional non-secret variable `CULINARY_YOUTUBE_PROJECT_IDENTITY` may record the Culinary project display identity; otherwise the canonical recommendation `culinary-youtube-discovery` is used.

## Live spend

The canary performs exactly one `search.list` request with `maxResults=1`. Current official YouTube documentation was rechecked on 2026-09-05 and states that `search.list` uses the granular Search Queries quota bucket at one call per request, with a documented default limit of 100/day. The verified project-specific limit remains authoritative.

The runner refuses to execute unless:

- `CULINARY_YOUTUBE_API_KEY` is present;
- `CULINARY_YOUTUBE_SEARCH_DAILY_LIMIT` is a positive integer greater than the protected five-call reserve;
- the project identity does not identify Blue Lagoon/music use;
- the policy recheck vintage is explicit.

No pagination is requested and no second API call is made.

## Credential and quota separation

Only `CULINARY_YOUTUBE_API_KEY` is mapped into the canary job. No Blue Lagoon credential is referenced or mapped. The durable summary records the Culinary client identity, verified assigned daily limit, five-call reserve, one planned/executed call and remaining pre-reserve capacity.

The key is sent through the `X-Goog-Api-Key` request header rather than embedded in the request URL, and neither the key nor its length/hash is emitted.

## Raw API Data boundary

The live response may contain YouTube API Data such as IDs, titles, descriptions and channel names. Those fields are never written to Git, workflow summaries or durable reports.

For the connectivity test only, the response is written to a runner-local temporary file with the existing seven-day transient TTL metadata, then deleted before the job exits. The durable canary result contains counts and control-plane facts only.

No artifact upload step exists for the transient payload.

## PASS

`PASS` requires all of the following:

1. preflight secret/quota/project checks pass;
2. one `search.list` request returns HTTP 200 and an expected `items` array;
3. exactly one Search Queries call is recorded;
4. the protected five-call reserve remains untouched;
5. transient raw API Data is deleted before job exit;
6. the durable summary contains no raw YouTube API metadata;
7. no Blue Lagoon credential or planner state participates.

Any preflight, policy/configuration, API, response-shape or cleanup failure is terminal for this canary attempt and must not escalate to YT-CUL-3.
