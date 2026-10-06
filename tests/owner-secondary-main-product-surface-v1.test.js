import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { OWNER_CANARY_FIXED_PROFILE_V1 } from "../src/server/protected-corpus-limited-evidence-secondary-lane-owner-canary-manifest-v1.mjs";
import { executeOwnerSecondaryRollout } from "../src/server/protected-corpus-limited-evidence-secondary-lane-owner-rollout-v1.mjs";

test("normal product app wires the owner-only V21 secondary endpoint, not the canary page", () => {
  const app = readFileSync(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(app, /\/api\/protected-corpus\/limited-evidence-secondary/);
  assert.match(app, /Owner early access · V21/);
  assert.match(app, /More recipe ideas/);
  assert.match(app, /271 candidates/);
  assert.match(app, /Do not use this lane for allergy\/exclusion-sensitive decisions yet/);
  assert.doesNotMatch(app, /limited-evidence-secondary-canary/);
  assert.match(app, /buildOwnerSecondaryPlanFallback/);
  assert.match(app, /secondaryItems/);
  assert.match(app, /primary-first/);
  assert.match(app, /Raw source ingredients · not normalized/);
});

test("owner role is derived server-side from the configured bootstrap identity", () => {
  const session = readFileSync(new URL("../functions/api/auth/session.js", import.meta.url), "utf8");
  assert.match(session, /ownerBootstrapEmail/);
  assert.match(session, /normalizeInviteEmail\(current\.account\.email\) === ownerBootstrapEmail/);
  assert.match(session, /owner:/);
});

test("bounded owner rollout preserves hydrated recipe detail for the product card", async () => {
  const result = await executeOwnerSecondaryRollout({
    request: { mode:"limited_evidence_secondary", mealType:"breakfast", limit:1, cursor:"0", profile:OWNER_CANARY_FIXED_PROFILE_V1 },
    featureEnabled:true,
    hydrateTopK:async ids => ({
      results:ids.map(id => ({
        protectedRecipeId:id,
        title:"Fixture",
        ingredients:["1 fixture ingredient"],
        directions:["Cook fixture."],
        structuralState:"STRUCTURED",
        sourceProvenance:{sourceCohortId:"unitools-world-recipes-v1_1_0"}
      })),
      d1Subqueries:3,
      fullCorpusScans:0,
      rowsWritten:0
    })
  });
  assert.equal(result.pass,true);
  assert.deepEqual(result.secondaryLane.results[0].ingredients,["1 fixture ingredient"]);
  assert.deepEqual(result.secondaryLane.results[0].directions,["Cook fixture."]);
  assert.equal(result.secondaryLane.mayDisplacePrimary,false);
});

test("service worker refresh marker updates cached normal-product assets while preserving the established cache contract", () => {
  const sw = readFileSync(new URL("../sw.js", import.meta.url), "utf8");
  assert.match(sw, /v22-owner-secondary-planning-v1 refreshes cached app assets/);
  assert.match(sw, /culinary-recommender-v1-1-6-eu-celery-allergen-p0/);
});
