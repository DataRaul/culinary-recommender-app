import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  POLICY_ID,
  deriveWorkUnitState,
  validateWorkUnitState
} from "../scripts/youtube-culinary-work-unit-lifecycle.mjs";

function baseState(overrides = {}) {
  return {
    schemaVersion: "youtube-culinary-daily-discovery-state-v1",
    phase: "YT-CUL-5D",
    programmeStatus: "ACTIVE",
    lastCompletedQuotaDate: "2026-09-07",
    completedQuotaDays: [
      {
        quotaDate: "2026-09-07",
        terminalState: "DAILY_DISCOVERY_QUOTA_PORTFOLIO_COMPLETE"
      }
    ],
    hardHold: null,
    ytCul6ReadinessEarned: false,
    ...overrides
  };
}

test("routine completed day closes into next bounded quota-day wake-up", () => {
  const state = validateWorkUnitState(
    deriveWorkUnitState(baseState(), {
      generatedAt: "2026-09-07T17:00:00.000Z",
      primaryOutcome: "success"
    })
  );
  assert.equal(state.policyId, POLICY_ID);
  assert.equal(state.closureStatus, "CLOSED_CONTINUE");
  assert.equal(state.materialTransition, false);
  assert.equal(state.successorAction, "WAIT_FOR_NEXT_YOUTUBE_QUOTA_DAY");
  assert.equal(state.schedulerDisposition, "CONTINUE_BOUNDED_WAKEUP");
});

test("hard hold requires material reconciliation and fail-closed scheduler", () => {
  const state = deriveWorkUnitState(
    baseState({ hardHold: "DAILY_SEARCH_HOLD_REVIEW_BACKLOG" })
  );
  assert.equal(state.closureStatus, "DAILY_SEARCH_HOLD_REVIEW_BACKLOG");
  assert.equal(state.materialTransition, true);
  assert.equal(state.schedulerDisposition, "HOLD_FAIL_CLOSED");
  assert.equal(state.nextTriggerDisposition, "NO_LIVE_SEARCH_UNTIL_HOLD_RESOLVED");
  assert.match(state.roadmapHandoverReconciliation, /REQUIRED/);
});

test("YT-CUL-6 readiness cannot silently become app admission", () => {
  const state = validateWorkUnitState(
    deriveWorkUnitState(baseState({ ytCul6ReadinessEarned: true }))
  );
  assert.equal(state.closureStatus, "YT_CUL_6_READINESS_EARNED");
  assert.equal(state.successorAction, "YT_CUL_6_READINESS_RECONCILIATION");
  assert.equal(state.schedulerDisposition, "RETIRE_OR_REPLACE_AFTER_READINESS_HANDOFF");
  assert.equal(state.authority.automaticKnowledgeCorePromotionAuthorized, false);
  assert.equal(state.authority.automaticAppAdmissionAuthorized, false);
  assert.equal(state.authority.automaticPublicationAuthorized, false);
});

test("primary failure closes into reconciliation before equivalent retry", () => {
  const state = deriveWorkUnitState(baseState(), { primaryOutcome: "failure" });
  assert.equal(state.closureStatus, "PRIMARY_RUN_FAILED");
  assert.equal(state.schedulerDisposition, "RECONCILE_BEFORE_RETRY");
  assert.equal(
    state.nextTriggerDisposition,
    "NO_EQUIVALENT_LIVE_RETRY_BEFORE_RECONCILIATION"
  );
});

test("every scheduled workflow is registered with closure and retirement semantics", async () => {
  const registry = JSON.parse(await readFile("config/work_unit_lifecycle.json", "utf8"));
  const workflowDir = new URL("../.github/workflows/", import.meta.url);
  const { readdir } = await import("node:fs/promises");
  const names = await readdir(workflowDir);
  const scheduled = [];
  for (const name of names.filter(name => name.endsWith(".yml"))) {
    const text = await readFile(new URL(name, workflowDir), "utf8");
    if (text.includes("schedule:")) scheduled.push(`.github/workflows/${name}`);
  }
  const registered = registry.scheduled_work_units.map(unit => unit.workflow).sort();
  assert.deepEqual(registered, scheduled.sort());
  assert.equal(registry.scheduled_wakeup_never_grants_execution_authority, true);
  assert.equal(registry.completion_requires_closure, true);
  assert.equal(registry.continuous_monitoring_required_for_correctness, false);
  for (const unit of registry.scheduled_work_units) {
    assert.ok(unit.durable_state.length > 0);
    assert.ok(unit.preflight_contract.length > 0);
    assert.ok(unit.closure_surfaces.length > 0);
    assert.ok(unit.successor_rule.length > 0);
    assert.ok(unit.retirement_rule.length > 0);
  }
});

test("scheduled workflow reconciles closure before persisting programme state", async () => {
  const workflow = await readFile(".github/workflows/yt-cul-5d-daily-discovery.yml", "utf8");
  const reconcileIndex = workflow.indexOf("Reconcile scheduled work-unit closure state");
  const persistIndex = workflow.indexOf("Persist cumulative policy-safe programme state");
  assert.ok(reconcileIndex > 0);
  assert.ok(persistIndex > reconcileIndex);
  assert.match(workflow, /YT_CUL_WORK_UNIT_STATE_PATH/);
  assert.match(workflow, /youtube-culinary-work-unit-state\.json/);
  assert.match(workflow, /reconcile-youtube-culinary-work-unit\.mjs/);
});
