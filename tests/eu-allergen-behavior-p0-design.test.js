import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { INGREDIENTS } from "../src/data/ingredients.js";

const design = JSON.parse(
  await readFile(new URL("../config/eu_allergen_behavior_p0_design.json", import.meta.url), "utf8")
);
const exclusionsUi = await readFile(new URL("../src/exclusions-ui.js", import.meta.url), "utf8");

test("EU allergen P0 design is non-activating and owner-gated", () => {
  assert.equal(design.id, "EU_ALLERGEN_BEHAVIOR_P0_DESIGN_CONTRACT");
  assert.equal(design.activation.authorized, false);
  assert.equal(design.activation.ownerAuthorizationRequired, true);
  assert.equal(design.implementationGate, "EU_ALLERGEN_CELERY_P0_ACTIVATION");
  assert.equal(design.implementationGateState, "BLOCKED_PENDING_OWNER_AUTHORIZATION");
});

test("design identifies celery as the only P0 runtime token without mutating current behavior", () => {
  assert.deepEqual(design.p0Scope.newRuntimeAllergenTokens, ["celery"]);
  assert.ok(INGREDIENTS.celery);
  assert.deepEqual(INGREDIENTS.celery.allergens, []);
  assert.equal(exclusionsUi.includes('["celery", "Celery"]'), false);
});

test("sulphites and absent canonical identities stay deferred", () => {
  const deferred = Object.fromEntries(design.deferredCategories.map(item => [item.category, item.reason]));
  assert.match(deferred.SULPHUR_DIOXIDE_AND_SULPHITES, /threshold/i);
  assert.match(deferred.MUSTARD, /No canonical mustard ingredient/i);
  assert.match(deferred.LUPIN, /No canonical lupin ingredient/i);
  assert.match(deferred.MOLLUSCS, /No canonical mollusc ingredient/i);
});

test("design preserves zero-D1, no-KC and no-Barbecue boundary", () => {
  assert.equal(design.hardBoundaries.protectedD1Reads, 0);
  assert.equal(design.hardBoundaries.protectedD1Writes, 0);
  assert.equal(design.hardBoundaries.protectedRecipeBodyAccess, 0);
  assert.equal(design.hardBoundaries.nutritionCompositionAuthorityChanges, 0);
  assert.equal(design.hardBoundaries.knowledgeCoreWrites, 0);
  assert.equal(design.hardBoundaries.barbecueMutations, 0);
  assert.equal(design.hardBoundaries.paidInfrastructureOrApiChanges, 0);
});
