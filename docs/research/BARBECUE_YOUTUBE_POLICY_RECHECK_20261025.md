# BBQ YouTube API policy recheck — 2026-10-25

Reviewed: https://developers.google.com/youtube/data/getting-started ; https://developers.google.com/youtube/data/guides/quota_and_compliance_audits ; https://developers.google.com/youtube/terms/developer-policies-guide ; https://developers.google.com/youtube/terms/revision-history ; https://developers.google.com/youtube/terms/api-services-terms-of-service .

Google documents a default 100 search.list calls/day. Existing owner-verified project quota contract remains 100/day; this review did not independently access the Google Cloud Console. No increase or second project authorized. Keep 16 calls/day, reserve 5, pacing 1000ms, no paid services, no automatic publication/app/KC/D1 admission. Existing source-reference-only storage restrictions unchanged.

The policy-date expiry hold is cleared based on current public policy and the preexisting owner-verified quota, not a new project-level console verification. The quota-date remains October 23, with no backfill or duplicate YouTube Search. Next normal scheduled run must fail closed on any provider/policy/quota error. Query exhaustion or pending review may still prevent new candidate discovery.
