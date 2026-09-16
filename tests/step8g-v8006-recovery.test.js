import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const page = readFileSync(new URL("../step8g-v8006-recover.html", import.meta.url), "utf8");

test("v8006 recovery is only eligible from already-active exact v8006", () => {
  assert.match(page, /pointer\?\.activeVersion!=="v8006"/);
  assert.match(page, /body\?\.verifiedRowCount!==EXPECTED_CHILD/);
  assert.match(page, /routes\?\.parentRouteCount!==EXPECTED_PARENT/);
  assert.match(page, /routes\?\.newRouteCount!==EXPECTED_CHILD/);
  assert.match(page, /routes\?\.totalRouteCount!==EXPECTED_COMPOSED/);
  assert.match(page, /routes\?\.verifiedBatchCount!==EXPECTED_ROUTE_BATCHES/);
  assert.match(page, /Stopped fail-closed without pointer mutation/);
});

test("v8006 recovery replays frozen bodies and routes idempotently before rollback proof", () => {
  assert.match(page, /result\.result\?\.status!=="VERIFIED_IDEMPOTENT_SKIP"/);
  assert.match(page, /442-body-idempotent-replays/);
  assert.match(page, /442-route-idempotent-replays/);
  assert.match(page, /already-active-v8006/);
  assert.match(page, /six-layer-hydration/);
  assert.match(page, /rollback-v8005/);
  assert.match(page, /rollback-fail-closed/);
  assert.match(page, /reactivate-v8006/);
});

test("v8006 recovery preserves protected-scale firewalls", () => {
  assert.match(page, /EXPECTED_CHILD=442/);
  assert.match(page, /EXPECTED_PARENT=2464/);
  assert.match(page, /EXPECTED_COMPOSED=2906/);
  assert.match(page, /EXPECTED_BODY_BATCHES=45/);
  assert.match(page, /EXPECTED_ROUTE_BATCHES=45/);
  assert.match(page, /publicRuntimeChanged:false/);
  assert.match(page, /recommendationAdmissionChanged:false/);
  assert.match(page, /thirdShardUsed:false/);
  assert.match(page, /billingExpansion:false/);
  assert.match(page, /culturalAuthenticityAuthorityImported:false/);
  assert.match(page, /STEP_8G_ORA_TURABI_V8006_PROTECTED_POPULATION_PASS/);
});