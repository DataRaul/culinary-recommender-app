import test from "node:test";
import assert from "node:assert/strict";

import { buildStep8APopulationPlan } from "../scripts/corpus-scale-step8a-core.mjs";
import {
  STEP8G_FORKRECIPE_LAYER_VERSION,
  STEP8G_MAX_PROTECTED_D1_SUBQUERIES,
  STEP8G_PARENT_VERSION,
  buildStep8GComposition,
  buildStep8GRouteIndex,
  planStep8GProtectedHydration
} from "../scripts/corpus-scale-step8g-population-core.mjs";

const sha = char => char.repeat(64);

function parentManifest() {
  const entries = Array.from({ length: 501 }, (_, ordinal) => ({
    ordinal,
    recipeId: `unitools:test-${ordinal}`,
    bodySha256: sha(ordinal % 2 ? "a" : "b"),
    bodyBytes: 5000,
    sourceCohortId: "unitools-world-recipes-v1_1_0",
    shardNumber: ordinal % 2
  }));
  return {
    corpusVersion: STEP8G_PARENT_VERSION,
    recipeCount: 501,
    manifestSha256: sha("c"),
    source: { sourceCohortId: "unitools-world-recipes-v1_1_0" },
    routing: {
      shardCount: 2,
      descriptors: [
        { shardNumber: 0, rowCount: 251, totalBodyBytes: 251 * 5000 },
        { shardNumber: 1, rowCount: 250, totalBodyBytes: 250 * 5000 }
      ]
    },
    entries
  };
}

function layerPlan(entries = [
  { ordinal: 0, recipeId: "forkrecipe_alpha", bodySha256: sha("d"), bodyBytes: 7000, sourceCohortId: "FORKRECIPE_PINNED_STEP7E" },
  { ordinal: 1, recipeId: "forkrecipe_beta", bodySha256: sha("e"), bodyBytes: 8000, sourceCohortId: "FORKRECIPE_PINNED_STEP7E" }
]) {
  return buildStep8APopulationPlan({
    corpusVersion: STEP8G_FORKRECIPE_LAYER_VERSION,
    parentCorpusVersion: STEP8G_PARENT_VERSION,
    sourceCohorts: [{
      id: "FORKRECIPE_PINNED_STEP7E",
      sourceName: "ForkRecipe",
      sourceVersion: "pinned-test",
      admissionState: "STEP_8G_FORKRECIPE_MEASUREMENT_EARNED_COHORT_CANDIDATE",
      protectedPopulationAllowed: true,
      publicRuntimeActivationAuthorized: false,
      evidenceRefs: ["docs/CORPUS_SCALE_STEP8G_PROTECTED_SCALE_LOOP.md"]
    }],
    entries,
    recipeShardCount: 2,
    rowsPerWriteBatch: 10
  });
}

test("Step 8G composes an immutable parent plus new layer without rewriting parent rows", () => {
  const parent = parentManifest();
  const layer = layerPlan();
  const routeIndex = buildStep8GRouteIndex({ parentManifest: parent, layerPlan: layer });
  const composition = buildStep8GComposition({ parentManifest: parent, layerPlan: layer, routeIndex });

  assert.equal(composition.cumulativeRecipeCount, 503);
  assert.equal(composition.layers.length, 2);
  assert.equal(composition.layers[1].parentCorpusVersion, STEP8G_PARENT_VERSION);
  assert.equal(composition.invariants.immutableParentRowsRewritten, false);
  assert.equal(composition.invariants.newLayerWritesOnly, true);
  assert.equal(composition.invariants.thirdShardUsed, false);
  assert.equal(composition.capacity.avoidedDuplicateParentRows, 501);
  assert.ok(composition.capacity.layeredPhysicalBodyBytes < composition.capacity.naiveImmutableSnapshotBodyBytes);
});

test("route index rejects recipe-ID collision across immutable layers", () => {
  const parent = parentManifest();
  const layer = layerPlan([
    { ordinal: 0, recipeId: parent.entries[0].recipeId, bodySha256: sha("d"), bodyBytes: 7000, sourceCohortId: "FORKRECIPE_PINNED_STEP7E" }
  ]);
  assert.throws(() => buildStep8GRouteIndex({ parentManifest: parent, layerPlan: layer }), /recipe ID collision/);
});

test("mixed parent/layer hydration stays bounded and uses exact route then at most one query per shard", () => {
  const parent = parentManifest();
  const layer = layerPlan();
  const routeIndex = buildStep8GRouteIndex({ parentManifest: parent, layerPlan: layer });
  const probe = planStep8GProtectedHydration(routeIndex, [
    parent.entries[0].recipeId,
    parent.entries[1].recipeId,
    "forkrecipe_alpha",
    "forkrecipe_beta"
  ]);
  assert.equal(probe.pass, true);
  assert.equal(probe.fullCorpusScans, 0);
  assert.ok(probe.recipeShardSubqueries <= 2);
  assert.ok(probe.d1Subqueries <= STEP8G_MAX_PROTECTED_D1_SUBQUERIES);
  assert.equal(probe.routeIndexSubqueries, 1);
});

test("unknown recipe IDs fail closed before a recipe-body scan", () => {
  const parent = parentManifest();
  const layer = layerPlan();
  const routeIndex = buildStep8GRouteIndex({ parentManifest: parent, layerPlan: layer });
  const probe = planStep8GProtectedHydration(routeIndex, ["missing"]);
  assert.equal(probe.pass, false);
  assert.equal(probe.reason, "ROUTE_NOT_FOUND_FAIL_CLOSED");
});

test("hydration enforces the frozen candidate ceiling", () => {
  const parent = parentManifest();
  const layer = layerPlan();
  const routeIndex = buildStep8GRouteIndex({ parentManifest: parent, layerPlan: layer });
  const ids = routeIndex.routes.slice(0, 257).map(route => route.recipeId);
  assert.throws(() => planStep8GProtectedHydration(routeIndex, ids), /candidate limit exceeded/);
});
