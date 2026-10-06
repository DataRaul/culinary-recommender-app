import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { projectProtectedPacketForDetail } from "../src/server/protected-corpus-search-v1.mjs";
import { OWNER_CANARY_FIXED_PROFILE_V1 } from "../src/server/protected-corpus-limited-evidence-secondary-lane-owner-canary-manifest-v1.mjs";
import { executeOwnerSecondaryRollout } from "../src/server/protected-corpus-limited-evidence-secondary-lane-owner-rollout-v1.mjs";

const route = {
  recipeId:"unitools:detail-fixture",
  corpusVersion:"v8001",
  shardNumber:0,
  sourceCohortId:"unitools-world-recipes-v1_1_0"
};

const ingredient = index => ({
  id:"ingredient-" + index,
  name:{ en:"Ingredient " + index },
  quantity:index,
  unit:"g",
  note:null
});
const step = index => ({
  text:{ en:"Source-backed method step " + index + "." },
  minutes:index
});
const packet = {
  identity:{ recipeId:route.recipeId },
  provenance:{
    sourceCohortId:route.sourceCohortId,
    sourceRecipeUrl:"https://example.test/detail-fixture",
    licenseId:"CC-BY-SA-4.0",
    attributionText:"Fixture"
  },
  recipe:{
    name:{ en:"Detail Fixture" },
    summary:{ en:"A source-backed summary." },
    baseServings:4,
    prepMinutes:25,
    cookMinutes:35,
    difficulty:"medium",
    ingredients:Array.from({length:11},(_,i)=>ingredient(i+1)),
    steps:Array.from({length:7},(_,i)=>step(i+1))
  }
};

test("V21 protected detail projection preserves every source ingredient, method step, and source timing", () => {
  const detail = projectProtectedPacketForDetail(packet, route);
  assert.equal(detail.ingredientCount, 11);
  assert.equal(detail.directionStepCount, 7);
  assert.equal(detail.ingredients.length, 11);
  assert.equal(detail.directions.length, 7);
  assert.equal(detail.methodSteps.length, 7);
  assert.deepEqual(detail.methodSteps.map(row => row.minutes), [1,2,3,4,5,6,7]);
  assert.deepEqual(detail.directions, detail.methodSteps.map(row => row.text));
  assert.equal(detail.summary, "A source-backed summary.");
  assert.equal(detail.servings, 4);
  assert.equal(detail.prepMinutes, 25);
  assert.equal(detail.cookMinutes, 35);
  assert.equal(detail.sourceDifficulty, "medium");
});

test("V21 owner secondary envelope does not silently truncate hydrated protected detail", async () => {
  const projected = projectProtectedPacketForDetail(packet, route);
  const result = await executeOwnerSecondaryRollout({
    request:{
      mode:"limited_evidence_secondary",
      mealType:"breakfast",
      limit:1,
      cursor:"0",
      profile:OWNER_CANARY_FIXED_PROFILE_V1
    },
    featureEnabled:true,
    hydrateTopK:async ids => ({
      results:ids.map(id => ({
        protectedRecipeId:id,
        title:projected.title,
        summary:projected.summary,
        servings:projected.servings,
        prepMinutes:projected.prepMinutes,
        cookMinutes:projected.cookMinutes,
        sourceDifficulty:projected.sourceDifficulty,
        ingredients:projected.ingredients,
        directions:projected.directions,
        methodSteps:projected.methodSteps,
        ingredientCount:projected.ingredientCount,
        directionStepCount:projected.directionStepCount,
        structuralState:projected.structuralState,
        sourceProvenance:{ sourceCohortId:route.sourceCohortId }
      })),
      d1Subqueries:3,
      fullCorpusScans:0,
      rowsWritten:0
    })
  });
  const item = result.secondaryLane.results[0];
  assert.equal(item.ingredients.length, 11);
  assert.equal(item.directions.length, 7);
  assert.equal(item.methodSteps.length, 7);
  assert.equal(item.directionStepCount, 7);
  assert.equal(item.sourceDifficulty, "medium");
  assert.equal(item.methodSteps.at(-1).text, "Source-backed method step 7.");
  assert.equal(item.methodSteps.at(-1).minutes, 7);
  assert.equal(result.secondaryLane.mayDisplacePrimary, false);
  assert.equal(result.metrics.rowsWritten, 0);
  assert.equal(result.metrics.fullCorpusScans, 0);
});

test("V21 normal owner product renders complete-source counts and labels genuinely sparse source without inventing text", () => {
  const app = readFileSync(new URL("../src/app.js", import.meta.url), "utf8");
  const api = readFileSync(new URL("../functions/api/protected-corpus/limited-evidence-secondary.js", import.meta.url), "utf8");
  assert.match(api, /methodSteps:Array\.isArray\(detail\.methodSteps\)/);
  assert.match(api, /directionStepCount/);
  assert.doesNotMatch(api, /directions[^\n]*\.slice\(|methodSteps[^\n]*\.slice\(/);
  assert.match(app, /item\.methodSteps/);
  assert.match(app, /Source detail ·/);
  assert.match(app, /method steps/);
  assert.match(app, /no extra steps have been invented/);
  assert.doesNotMatch(app, /methodSteps\.slice\(|directions\.slice\(/);
});
