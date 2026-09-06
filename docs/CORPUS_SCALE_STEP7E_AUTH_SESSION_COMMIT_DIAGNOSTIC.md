# Step 7E auth session commit diagnostic

Date: 2026-09-06

Status: **BOUNDED LIVE DIAGNOSTIC — NO STEP 7E TERMINAL CLAIM**

The production Step 7E canary remains blocked by a live authentication persistence contradiction: Google identity verification and authorization succeed, but a later authenticated request can observe `NO_SESSION`.

A generic same-origin production cookie acceptance probe already demonstrated that the browser accepts all tested secure first-party server cookie forms, including `__Host-`, `__Secure-`, plain Secure, and `__Host-` + HttpOnly cookies. Therefore this diagnostic targets only the real Google-session commit boundary.

The diagnostic:

- preserves canonical Google verification and private invitation authorization;
- preserves the signed `__Host-culinary_session` format and validation rules;
- adds one constant-value `__Host-culinary_auth_commit_probe=1` marker to the same successful 303 response, expiring after 120 seconds;
- redirects to a dedicated diagnostic page before ordinary session endpoints run;
- reports only whether the real session cookie is present, whether the marker is present, and the sanitized validation result;
- never reports account ID, email, Google credential, session token, cookie value, or recipe data;
- never clears the session cookie while collecting the diagnostic evidence.

Possible live classifications:

- marker false / session false: the successful auth redirect did not commit either cookie;
- marker true / session false: the redirect committed cookies generally, but the real session cookie was rejected or removed specifically;
- marker true / session true / validation non-AUTHORIZED: the real session cookie persisted but its token/account validation failed;
- marker true / session true / AUTHORIZED: the real session committed correctly and the previous failure lies after this boundary.

This diagnostic authorizes no billing, no new D1 database or recipe-body shard, no public ForkRecipe activation, no source nutrition/media authority, and no Knowledge Core write.
