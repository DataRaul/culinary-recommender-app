# Corpus Scale Step 8C — Validation Evidence

Status: **PASS CANDIDATE / SECOND CURRENT-BASE VALIDATION REQUIRED**

Date: **2026-09-10**

Pull request: **#117**

Initial candidate head: `2e5aa209810ceab0bc11027b45e3a9848f58d321`

Initial PR validation run: **34513497653**

## Initial validation result

The Step 8C implementation and documentary source qualification passed the repository merge gate on the PR state first tested:

- `npm run validate`: **PASS**;
- Step 8C source-qualification tests: included in the repository test glob and **PASS**;
- Playwright/Chromium installation: **PASS**;
- full `npm run test:browser`: **PASS**;
- production smoke: correctly **SKIPPED** on the PR because Step 8C changes no production runtime;
- overall validation job: **PASS**.

## Source evidence frozen by the candidate

The qualified protected-input source remains:

- source: UniTools World Recipes Dataset;
- immutable repository commit: `1d09e9548d957dd0375301146a86dddf5e269c1b`;
- exact data blob: `a81e96415f09eac7fc0aec94a4da8d9f6d66d9ed`;
- publisher commit version: `1.1.0`;
- bounded cohort: 501 recipes / 127 countries;
- licence: CC BY-SA 4.0;
- normal public recommendation/runtime authority: false;
- source nutrition authority: false;
- media admission: false.

The publisher's current first-party data page was rechecked on 2026-09-10 and independently reports 501 recipes / 127 countries and CC BY-SA 4.0. It describes a later website v2.0 release dated 2026-09-02. That mutable release is not used as the identity of this Step 8C decision.

## Concurrent-base reconciliation

While PR #117 was validating, Step 8B machine prerequisites merged to `main` through PR #116 at merge commit:

`280d261979908b42a7522f3f036d958cc619bb41`

Step 8B and Step 8C changed disjoint Step-8 files and their authority contracts are complementary, but the project concurrency rule requires the final Step 8C candidate to be validated against the latest base rather than merely inferred compatible.

This evidence commit intentionally changes the PR head and therefore requires a fresh normal repository/browser validation run using the current `main` merge context before PR #117 may merge.

## Terminal evidence envelope

No Step 8C execution or adjacent-lane mutation occurred:

```json
{
  "repositoryOnly": true,
  "corpusPopulationPerformed": false,
  "createdRecipeBodyShards": 0,
  "publicRuntimeChanged": false,
  "billingAuthorizationObserved": false,
  "youtubeStateModified": false,
  "nutritionBLaneModified": false,
  "knowledgeCoreWritePerformed": false
}
```

Until the second current-base run passes and PR #117 merges, the terminal remains **PASS CANDIDATE**, not yet `STEP_8C_RIGHTS_CLEAN_SOURCE_COHORT_AVAILABLE` on `main`.
