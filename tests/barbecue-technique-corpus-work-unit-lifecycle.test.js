import assert from "node:assert/strict";
import test from "node:test";
import { createInitialBarbecueState, loadBarbecueConfig, validateBarbecueConfig } from "../scripts/barbecue-technique-corpus-control-plane.mjs";
import { deriveBarbecueWorkUnitState, validateBarbecueWorkUnitState } from "../scripts/barbecue-technique-corpus-work-unit-lifecycle.mjs";

const config = validateBarbecueConfig(await loadBarbecueConfig());

test("routine barbecue work unit continues bounded wakeups", () => {
  const state = createInitialBarbecueState(config);
  const work = validateBarbecueWorkUnitState(deriveBarbecueWorkUnitState(state, { generatedAt: "2026-09-24T10:45:00.000Z" }));
  assert.equal(work.closureStatus, "CLOSED_CONTINUE");
  assert.equal(work.materialTransition, false);
  assert.equal(work.schedulerDisposition, "CONTINUE_BOUNDED_WAKEUP");
  assert.equal(work.authority.automaticPublicationAuthorized, false);
});

test("provider rate-limit hold is fail-closed", () => {
  const state = createInitialBarbecueState(config);
  state.hardHold = "BARBECUE_SEARCH_HOLD_RATE_LIMIT";
  const work = deriveBarbecueWorkUnitState(state);
  assert.equal(work.closureStatus, "BARBECUE_SEARCH_HOLD_RATE_LIMIT");
  assert.equal(work.materialTransition, true);
  assert.equal(work.nextTriggerDisposition, "NO_LIVE_SEARCH_UNTIL_HOLD_RESOLVED");
  assert.equal(work.schedulerDisposition, "HOLD_FAIL_CLOSED");
});

test("pilot PASS retires recurring acquisition into a bounded successor", () => {
  const state = createInitialBarbecueState(config);
  state.pilotPass = true;
  state.programmeStatus = "BARBECUE_TECHNIQUE_CORPUS_PILOT_PASS";
  const work = deriveBarbecueWorkUnitState(state);
  assert.equal(work.closureStatus, "BARBECUE_TECHNIQUE_CORPUS_PILOT_PASS");
  assert.equal(work.schedulerDisposition, "RETIRE_OR_REPLACE_AFTER_PILOT_PASS");
  assert.equal(work.nextTriggerDisposition, "SEPARATE_BOUNDED_SUCCESSOR_REQUIRED");
});

test("primary failure requires reconciliation before equivalent retry", () => {
  const state = createInitialBarbecueState(config);
  const work = deriveBarbecueWorkUnitState(state, { primaryOutcome: "failure" });
  assert.equal(work.closureStatus, "PRIMARY_RUN_FAILED");
  assert.equal(work.schedulerDisposition, "RECONCILE_BEFORE_RETRY");
  assert.equal(work.nextTriggerDisposition, "NO_EQUIVALENT_LIVE_RETRY_BEFORE_RECONCILIATION");
});
