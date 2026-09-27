# Culinary Brain C4 Real-v8018 Failure Loop V1

Date: **2026-09-27**

Status: **FAILURE MATRIX / REPAIR COHORT FREEZE**

## Purpose

C4 runs the exact pinned v8018 / 19,268 protected corpus through a fail-closed recommendation-readiness failure matrix. It does not admit protected recipes or alter the live scorer.

The first C4 unit classifies source/provenance, identity/normalization, hard dietary/allergen authority, nutrition/evidence, Brain calibration, reconciliation/authority, ranking/planner, abstention, runtime/performance and browser/UX.

## First repair boundary

Existing evidence shows only 112 protected recipes have every ingredient identity resolved, while reviewed dietary authority remains zero across v8018. C4 therefore freezes the exact 112-recipe identity-ready cohort before attempting any hard-authority repair.

The freeze is deterministic from the exact pinned source snapshots. The full recipe-key list remains a CI artifact; the compact committed evidence records its count, digest and source/cohort distribution.

No dietary, allergen or nutrition value is promoted by this unit. Canonical ingredient allergen metadata may be examined only as candidate evidence in the successor hard-authority tranche.

## Downstream semantics

Protected ranking/planner behavior is not diagnosed as defective while all protected records remain blocked by upstream hard-authority gates. C4 records that downstream state as not exercised, not as a ranking failure.

The successor is C4_HARD_AUTHORITY_REPAIR_TRANCHE_V1. P3 remains blocked until a bounded protected cohort earns the required hard ingredient, dietary/allergen and provenance semantics.

## Hard boundaries

No protected D1 reads or writes, no runtime protected-body reads, no protected-body rewrite, no public-runtime change, no recommendation admission, no Brain/C2 promotion, no nutrition or dietary/allergen authority promotion, no private Knowledge Core runtime dependency, no paid model/API, no third shard and no Barbecue mutation.
