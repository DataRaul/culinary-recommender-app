import { createHash } from "node:crypto";

export const POLICY_ID = "CULINARY_REPOSITORY_WORK_UNIT_LIFECYCLE_V1";
export const WORKFLOW_PATH = ".github/workflows/yt-cul-5d-daily-discovery.yml";

const HARD_HOLDS = new Set([
  "DAILY_SEARCH_HOLD_REVIEW_BACKLOG",
  "DAILY_SEARCH_HOLD_LOW_MARGINAL_VALUE",
  "DAILY_SEARCH_HOLD_POLICY_OR_QUOTA"
]);

function fingerprint(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

export function deriveWorkUnitState(dailyState, { primaryOutcome = "success", generatedAt = new Date().toISOString() } = {}) {
  if (!dailyState || typeof dailyState !== "object") throw new Error("daily state is required");
  const completed = Array.isArray(dailyState.completedQuotaDays) ? dailyState.completedQuotaDays : [];
  const latestDay = completed.at(-1) ?? null;
  const hardHold = dailyState.hardHold ?? null;
  const readiness = dailyState.ytCul6ReadinessEarned === true;
  const failed = primaryOutcome !== "success";

  let closureStatus = "CLOSED_CONTINUE";
  let materialTransition = false;
  let successorAction = "WAIT_FOR_NEXT_YOUTUBE_QUOTA_DAY";
  let nextTriggerDisposition = "NEXT_QUOTA_DAY_SCHEDULED_WAKEUP";
  let schedulerDisposition = "CONTINUE_BOUNDED_WAKEUP";
  let reconciliation = "RUNTIME_STATE_CURRENT_NO_STATIC_RECONCILIATION_REQUIRED";

  if (failed) {
    closureStatus = "PRIMARY_RUN_FAILED";
    materialTransition = true;
    successorAction = "RECONCILE_CURRENT_DURABLE_STATE_BEFORE_RETRY";
    nextTriggerDisposition = "NO_EQUIVALENT_LIVE_RETRY_BEFORE_RECONCILIATION";
    schedulerDisposition = "RECONCILE_BEFORE_RETRY";
    reconciliation = "STATIC_ROADMAP_AND_HANDOVER_RECONCILIATION_REQUIRED_IF_CONTINUATION_CHANGES";
  } else if (readiness) {
    closureStatus = "YT_CUL_6_READINESS_EARNED";
    materialTransition = true;
    successorAction = "YT_CUL_6_READINESS_RECONCILIATION";
    nextTriggerDisposition = "SEPARATE_BOUNDED_SUCCESSOR_REQUIRED";
    schedulerDisposition = "RETIRE_OR_REPLACE_AFTER_READINESS_HANDOFF";
    reconciliation = "STATIC_ROADMAP_AND_HANDOVER_RECONCILIATION_REQUIRED";
  } else if (hardHold) {
    closureStatus = HARD_HOLDS.has(hardHold) ? hardHold : "DAILY_SEARCH_HOLD_OTHER";
    materialTransition = true;
    successorAction = `RESOLVE_${hardHold}`;
    nextTriggerDisposition = "NO_LIVE_SEARCH_UNTIL_HOLD_RESOLVED";
    schedulerDisposition = "HOLD_FAIL_CLOSED";
    reconciliation = "STATIC_ROADMAP_AND_HANDOVER_RECONCILIATION_REQUIRED";
  }

  return {
    schemaVersion: "culinary-repository-work-unit-state-v1",
    policyId: POLICY_ID,
    workUnitId: "YT_CUL_5E_ADAPTIVE_DAILY_DISCOVERY",
    workflow: WORKFLOW_PATH,
    generatedAt,
    sourceDailyStateFingerprint: fingerprint(dailyState),
    primaryOutcome,
    latestQuotaDate: dailyState.lastCompletedQuotaDate ?? latestDay?.quotaDate ?? null,
    latestDailyTerminalState: latestDay?.terminalState ?? null,
    closureStatus,
    materialTransition,
    roadmapHandoverReconciliation: reconciliation,
    successorAction,
    nextTriggerDisposition,
    schedulerDisposition,
    authority: {
      automaticKnowledgeCorePromotionAuthorized: false,
      automaticAppAdmissionAuthorized: false,
      automaticPublicationAuthorized: false,
      paidInfrastructureAuthorized: false
    }
  };
}

export function validateWorkUnitState(state) {
  if (state?.policyId !== POLICY_ID) throw new Error("invalid lifecycle policy id");
  if (state?.workflow !== WORKFLOW_PATH) throw new Error("invalid lifecycle workflow path");
  if (!state?.closureStatus || !state?.successorAction || !state?.schedulerDisposition) throw new Error("incomplete lifecycle closure state");
  if (state?.authority?.automaticKnowledgeCorePromotionAuthorized !== false) throw new Error("automatic Knowledge Core promotion must remain false");
  if (state?.authority?.automaticAppAdmissionAuthorized !== false) throw new Error("automatic app admission must remain false");
  if (state?.authority?.automaticPublicationAuthorized !== false) throw new Error("automatic publication must remain false");
  return state;
}
