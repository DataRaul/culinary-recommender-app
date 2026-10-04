# V21 limited-evidence secondary lane — owner canary activation V1

Date: 2026-10-04

The owner explicitly authorized the next bounded owner-canary package after the dormant secondary-lane implementation passed. This package activates only a live owner canary, not the full 271-candidate secondary runtime.

The canary requires the authenticated account to exactly match the configured owner bootstrap email, explicit mode `limited_evidence_secondary`, and the exact fixed unrestricted V21 evaluation profile. Only the frozen top-20 probe for breakfast, lunch, dinner or snack can be returned. CI re-derives every probe from the exact 271-candidate runtime bundle and current deterministic scorer before merge.

Live hydration is read-only, bounded to at most 20 protected records and at most 8 total D1 subqueries including authentication. The full 271-candidate runtime bundle is not promoted. The validated 86-recipe primary runtime is unchanged, canary results cannot displace primary results, and the limited-metadata disclosure remains mandatory.

The kill switch is `CULINARY_LIMITED_EVIDENCE_SECONDARY_LANE_V1=0`; disabling it restores no-secondary behavior without data migration. No protected D1 write, full-corpus scan, third shard, paid infrastructure, Knowledge Core write, public recommendation widening or Barbecue mutation is authorized.

After deployment, the owner can use **Run secondary-lane canary** on `protected-corpus.html` to exercise all four meal types through the real owner session.

Terminal: `V21_LIMITED_EVIDENCE_SECONDARY_LANE_OWNER_CANARY_ACTIVATION_PASS__LIVE_OWNER_ACCEPTANCE_REQUIRED`

Next: `V21_LIMITED_EVIDENCE_SECONDARY_LANE_OWNER_LIVE_ACCEPTANCE_V1`
