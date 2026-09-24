import { createHash } from "node:crypto";
import { BARBECUE_PROGRAMME_ID, BARBECUE_WORKFLOW_PATH, BARBECUE_WORK_UNIT_SCHEMA } from "./barbecue-technique-corpus-control-plane.mjs";

const HARD_HOLDS=new Set(["BARBECUE_SEARCH_HOLD_RATE_LIMIT","BARBECUE_SEARCH_HOLD_POLICY_OR_QUOTA","BARBECUE_REVIEW_BACKLOG","BARBECUE_SEARCH_HOLD_PROVIDER_OTHER"]);

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
  }
  return {
    schemaVersion:BARBECUE_WORK_UNIT_SCHEMA,programmeId:BARBECUE_PROGRAMME_ID,workflow:BARBECUE_WORKFLOW_PATH,
    generatedAt,sourceStateFingerprint:fingerprint(state),primaryOutcome,
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
