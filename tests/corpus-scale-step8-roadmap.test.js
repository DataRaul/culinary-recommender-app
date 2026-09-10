import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  STEP7A_BUDGETS,
  STEP7A_REQUIRED_CAPACITY,
  STEP7A_STRESS_CAPACITY,
  STEP7A_RECIPE_DATABASES,
  STEP7A_CONTROL_DATABASES,
  STEP7A_RESERVED_DATABASES,
  recipeDatabaseShardForId
} from "../scripts/corpus-scale-step7a-core.mjs";

const ROOT = resolve(import.meta.dirname, "..");
const roadmap = JSON.parse(
  readFileSync(resolve(ROOT, "config/corpus_scale_step8_roadmap.json"), "utf8")
);
const gates = new Map(roadmap.gates.map(gate => [gate.id, gate]));

function gate(id) {
  const value = gates.get(id);
  assert.ok(value, `missing Step 8 gate ${id}`);
  return value;
}

test("Step 8 inherits measured Step 7A capacity and safety budgets instead of inventing new limits", () => {
  assert.equal(roadmap.programme.requiredCapacity, STEP7A_REQUIRED_CAPACITY);
  assert.equal(roadmap.programme.stressCapacity, STEP7A_STRESS_CAPACITY);
  assert.equal(roadmap.programme.recipeBodyShardMax, STEP7A_RECIPE_DATABASES);
  assert.equal(roadmap.programme.controlDatabases, STEP7A_CONTROL_DATABASES);
  assert.equal(roadmap.programme.reservedDatabaseSlots, STEP7A_RESERVED_DATABASES);

  for (const [key, value] of Object.entries(roadmap.inheritedBudgets)) {
    assert.equal(value, STEP7A_BUDGETS[key], `Step 8 budget drift for ${key}`);
  }
});

test("Step 8 continues the pre-existing Step 8 lineage and does not invent Step 7F", () => {
  assert.equal(roadmap.entryTerminal, "STEP_7E_PROTECTED_500_SOURCE_PILOT_CANARY_PASS");
  assert.equal(roadmap.step7fDefined, false);
  assert.deepEqual([...gates.keys()], ["8A", "8B", "8C", "8D", "8E", "8F", "8G"]);
});

test("8B uses the minimum useful multi-shard topology and existing deterministic router supports it", () => {
  assert.equal(roadmap.programme.initialMultiShardCanaryShards, 2);
  assert.equal(gate("8B").initialRecipeBodyShardCount, 2);
  assert.equal(roadmap.programme.createAllRecipeBodyShardsUpFront, false);
  assert.ok(gate("8B").initialRecipeBodyShardCount < roadmap.programme.recipeBodyShardMax);

  const touched = new Set();
  for (let ordinal = 0; ordinal < 100; ordinal += 1) {
    touched.add(recipeDatabaseShardForId(`step8-canary-${ordinal}`, 2));
  }
  assert.deepEqual([...touched].sort(), [0, 1]);
});

test("8B and 8C are parallel after 8A; 8D requires both", () => {
  assert.deepEqual(gate("8B").dependsOn, ["8A"]);
  assert.deepEqual(gate("8C").dependsOn, ["8A"]);
  assert.ok(gate("8C").parallelWith.includes("8B"));
  assert.deepEqual(gate("8D").dependsOn, ["8B", "8C"]);
});

test("public activation is isolated to 8F and remains a human gate", () => {
  for (const candidate of roadmap.gates) {
    if (candidate.id === "8F") continue;
    assert.equal(candidate.publicRuntimeChangeAllowed, false, `${candidate.id} must not authorize public runtime change`);
  }
  assert.equal(gate("8F").publicRuntimeChangeAllowed, true);
  assert.equal(gate("8F").humanRequired, true);
  assert.deepEqual(gate("8F").dependsOn, ["8E"]);
});

test("continued protected scale learning does not require public activation", () => {
  assert.deepEqual(gate("8G").dependsOn, ["8D"]);
  assert.ok(gate("8G").doesNotDependOn.includes("8F"));
  assert.equal(gate("8G").publicRuntimeChangeAllowed, false);
});

test("cost, Nutrition, YouTube and Knowledge Core firewalls remain explicit", () => {
  const b = roadmap.boundaries;
  assert.equal(b.noBillingAuthorization, true);
  assert.equal(b.workersPaidAllowed, false);
  assert.equal(b.r2Allowed, false);
  assert.equal(b.zeroTrustAccessAllowed, false);
  assert.equal(b.nutritionBLaneIndependent, true);
  assert.equal(b.youtubeCulinaryStateMutableFromStep8, false);
  assert.equal(b.knowledgeCoreWriteAllowedFromAppLane, false);
  assert.equal(b.privateKnowledgeCoreRuntimeDependencyAllowed, false);
  assert.equal(b.sourceNutritionAuthorityImplicit, false);
  assert.equal(b.sourceDietaryAllergenInferenceImplicit, false);
  assert.equal(b.sourceRatioPromotionImplicit, false);
  assert.equal(b.automaticPublicRecommendationAdmission, false);
});

test("every Step 8 gate has explicit terminal outcomes and bounded earned authority", () => {
  for (const candidate of roadmap.gates) {
    assert.ok(candidate.terminalOutcomes.length >= 2, `${candidate.id} needs explicit PASS/HOLD-or-fail outcomes`);
    assert.ok(candidate.earnsOnPass.length >= 1, `${candidate.id} must state exactly what PASS earns next`);
  }
});

test("Step 8 evidence basis is repository-grounded", () => {
  for (const path of roadmap.evidenceBasis) {
    assert.equal(existsSync(resolve(ROOT, path)), true, `missing evidence basis file: ${path}`);
  }
});
