import { createHash } from "node:crypto";
import { BARBECUE_PROGRAMME_ID, BARBECUE_WORKFLOW_PATH, BARBECUE_WORK_UNIT_SCHEMA } from "./barbecue-technique-corpus-control-plane.mjs";

const HARD_HOLDS=new Set(["BARBECUE_SEARCH_HOLD_RATE_LIMIT","BARBECUE_SEARCH_HOLD_POLICY_OR_QUOTA","BARBECUE_REVIEW_BACKLOG","BARBECUE_SEARCH_HOLD_PROVIDER_OTHER"]);
const NO_QUERY_TERMINALS=new Set([
  "BARBECUE_SEARCH_PORTFOLIO_EXHAUSTED_REVIEW_PENDING",
  "BARBECUE_SEARCH_PORTFOLIO_EXHAUSTED_NO_REVIEW_CANDIDATES",
  "BARBECUE_DISCOVERY_WAITING_FOR_REVIEW_GATE",
  "BARBECUE_DISCOVERY_WAITING_FOR_SYNTHESIS"
]);

function fingerprint(value){return createHash("sha256").update(JSON.stringify(value)).digest("hex");}

export function deriveBarbecueWorkUnitState(state,{primaryOutcome="success",generatedAt=new Date().toISOString()}={}) {
  if (!state || typeof state!=="object") throw new Error("barbecue state is required");
  let closureStatus="CLOSED_CONTINUE";
  let materialTransition=false;
  let successorAction="WAIT_FOR_NEXT_BARBECUE_QUOTA_DAY";
  let nextTriggerDisposition="NEXT_QUOTA_DAY_SCHEDULED_WAKEUP";
  let schedulerDisposition="CONTINUE_BOUNDED_WAKEUP";
  let reconciliation="RUNTIME_STATE_CURRENT_NO_STATIC_RECONCILIATION_REQUIRED";
  if (primaryOutcome!=="success") {
    closureStatus="PRIMARY_RUN_FAILED";materialTransition=true;
    successorAction="RECONCILE_CURRENT_BARBECUE_STATE_BEFORE_RETRY";
    nextTriggerDisposition="NO_EQUIVALENT_LIVE_RETRY_BEFORE_RECONCILIATION";
    schedulerDisposition="RECONCILE_BEFORE_RETRY";
    reconciliation="STATIC_ROADMAP_AND_HANDOVER_RECONCILIATION_REQUIRED_IF_CONTINUATION_CHANGES";
  } else if (state.pilotPass===true) {
    closureStatus="BARBECUE_TECHNIQUE_CORPUS_PILOT_PASS";materialTransition=true;
    successorAction="BARBECUE_PILOT_CLOSEOUT_AND_EXPANSION_DECISION";
    nextTriggerDisposition="SEPARATE_BOUNDED_SUCCESSOR_REQUIRED";
    schedulerDisposition="RETIRE_OR_REPLACE_AFTER_PILOT_PASS";
    reconciliation="STATIC_ROADMAP_AND_HANDOVER_RECONCILIATION_REQUIRED";
  } else if (state.hardHold) {
    closureStatus=HARD_HOLDS.has(state.hardHold)?state.hardHold:"BARBECUE_SEARCH_HOLD_OTHER";materialTransition=true;
    successorAction=`RESOLVE_${closureStatus}`;
    nextTriggerDisposition="NO_LIVE_SEARCH_UNTIL_HOLD_RESOLVED";
    schedulerDisposition="HOLD_FAIL_CLOSED";
    reconciliation="STATIC_ROADMAP_AND_HANDOVER_RECONCILIATION_REQUIRED";
  } else if (NO_QUERY_TERMINALS.has(state.programmeStatus)) {
    closureStatus=state.programmeStatus;
    const days=state.completedQuotaDays ?? [];
    materialTransition=days.length<2 || days.at(-2)?.terminalState!==closureStatus;
    successorAction=closureStatus==="BARBECUE_DISCOVERY_WAITING_FOR_SYNTHESIS"
      ? "REVIEW_REQUIRED_SYNTHESIS_FOR_QUALIFIED_LEAVES"
      : closureStatus==="BARBECUE_SEARCH_PORTFOLIO_EXHAUSTED_NO_REVIEW_CANDIDATES"
        ? "OWNER_DECISION_REQUIRED_FOR_UNFILLED_SOURCE_GAPS"
        : "EVIDENCE_REVIEW_PENDING_BARBECUE_CANDIDATES";
    nextTriggerDisposition="SCHEDULED_SAFE_WAKEUP_NO_SEARCH_UNLESS_ELIGIBILITY_CHANGES";
    schedulerDisposition="CONTINUE_BOUNDED_ZERO_CALL_WAKEUP";
    reconciliation="STATIC_ROADMAP_AND_HANDOVER_RECONCILIATION_REQUIRED";
  }
  const lastDay=state.completedQuotaDays?.at(-1) ?? null;
  const acquisitionOutcome=NO_QUERY_TERMINALS.has(closureStatus) ? "NO_NEW_DISCOVERY_REVIEW_OR_DECISION_REQUIRED"
    : lastDay?.candidatePointersAdded>0 ? "NEW_CANDIDATE_POINTERS"
    : lastDay?.searchCalls>0 ? "SEARCH_EXECUTED_NO_NEW_POINTERS" : "NO_ACQUISITION_PROGRESS";
  return {
    schemaVersion:BARBECUE_WORK_UNIT_SCHEMA,programmeId:BARBECUE_PROGRAMME_ID,workflow:BARBECUE_WORKFLOW_PATH,
    generatedAt,sourceStateFingerprint:fingerprint(state),primaryOutcome,
    acquisitionOutcome,latestSearchCalls:lastDay?.searchCalls ?? 0,
    latestCandidatePointersAdded:lastDay?.candidatePointersAdded ?? 0,
    latestQuotaDate:state.lastCompletedQuotaDate ?? null,closureStatus,materialTransition,
    roadmapHandoverReconciliation:reconciliation,successorAction,nextTriggerDisposition,schedulerDisposition,
    authority:{automaticKnowledgeCorePromotionAuthorized:false,automaticAppAdmissionAuthorized:false,automaticPublicationAuthorized:false,paidInfrastructureAuthorized:false}
  };
}

export function validateBarbecueWorkUnitState(state) {
  if (state?.programmeId!==BARBECUE_PROGRAMME_ID) throw new Error("invalid barbecue programme id");
  if (state?.workflow!==BARBECUE_WORKFLOW_PATH) throw new Error("invalid barbecue workflow path");
  if (!state?.closureStatus || !state?.successorAction || !state?.schedulerDisposition) throw new Error("incomplete barbecue lifecycle closure");
  if (Object.values(state.authority ?? {}).some(value=>value!==false)) throw new Error("barbecue work-unit authority widened");
  return state;
}
