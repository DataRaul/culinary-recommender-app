import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  PROTECTED_SEARCH_EXPECTED_COUNT,
  PROTECTED_SEARCH_INDEX_BATCH_SIZE,
  PROTECTED_SEARCH_MAX_BOUND_PARAMETERS,
  PROTECTED_SEARCH_MAX_PAGE_SIZE,
  PROTECTED_SEARCH_SUMMARY_BOUND_PARAMETERS_PER_ROW,
  PROTECTED_SEARCH_TARGET_MAX_D1,
  boundedPageSize,
  normalizeProtectedSearchQuery,
  projectProtectedPacketForDetail,
  projectProtectedPacketForIndex
} from "../src/server/protected-corpus-search-v1.mjs";
import { onRequestGet as protectedGet, onRequestPost as protectedPost } from "../functions/api/protected-corpus/v1.js";

const SECRET = "0123456789abcdef0123456789abcdef";
const ORIGIN = "https://culinary-recommender-app.pages.dev";

function route(overrides = {}) {
  return {
    recipeId: "unitools:test-soup",
    corpusVersion: "v8001",
    shardNumber: 0,
    sourceCohortId: "unitools-world-recipes-v1_1_0",
    ...overrides
  };
}

test("P1 packet projection supports UniTools provenance without granting recommendation authority", () => {
  const packet = {
    identity: { recipeId:"unitools:test-soup" },
    provenance: {
      sourceCohortId:"unitools-world-recipes-v1_1_0",
      repository:"unitools/example",
      commit:"a".repeat(40),
      dataPath:"recipes.json",
      datasetVersion:"1.1.0",
      sourceRecipeUrl:"https://example.test/test-soup",
      licenseId:"CC0",
      attributionText:"Example source"
    },
    recipe: {
      name:{ en:"Test Soup" },
      ingredients:[{ id:"water", name:{en:"Water"}, quantity:1, unit:"cup" }],
      steps:[{ text:{en:"Simmer."}, minutes:10 }]
    },
    authority: { publicRecommendationEligible:false, automaticAppAdmissionAuthorized:false }
  };
  const projected = projectProtectedPacketForIndex(packet, route());
  assert.equal(projected.title, "Test Soup");
  assert.equal(projected.sourceUrl, "https://example.test/test-soup");
  assert.equal(projected.structuralState, "PARSEABLE");

  const detail = projectProtectedPacketForDetail(packet, route());
  assert.deepEqual(detail.ingredients, ["1 cup Water"]);
  assert.deepEqual(detail.directions, ["Simmer."]);
  assert.deepEqual(detail.authority, {
    protectedBrowseOnly:true,
    recommendationEligible:false,
    publicRuntimeActivated:false,
    nutritionAuthorityGranted:false,
    dietaryAllergenAuthorityGranted:false
  });
});

test("P1 projection supports historical source packets and fails soft on structural exceptions", () => {
  const historicalRoute = route({
    recipeId:"ora_example_partial",
    corpusVersion:"v8018",
    shardNumber:1,
    sourceCohortId:"ORA_EXAMPLE"
  });
  const packet = {
    canonicalRecipeId:"ora_example_partial",
    source:{
      cohortId:"ORA_EXAMPLE",
      sourceWork:"Historic Cookery",
      sourceAuthor:"Example Author",
      sourceYear:"1874",
      sourceUrl:"https://example.test/historic",
      licenseId:"public-domain"
    },
    sourceContent:{
      title:"Historic Partial Recipe",
      parsedIngredientsNonAuthoritative:[],
      parsedDirectionsNonAuthoritative:[]
    },
    authority:{ recommendationAdmissionAuthorized:false, publicRuntimeActivationAuthorized:false }
  };
  const projected = projectProtectedPacketForIndex(packet, historicalRoute);
  assert.equal(projected.title, "Historic Partial Recipe");
  assert.equal(projected.structuralState, "PARTIAL");
  assert.equal(projected.sourceWork, "Historic Cookery");
  assert.equal(projected.sourceAuthor, "Example Author");
  assert.equal(projected.sourceYear, "1874");
});

test("P1 projection fails closed on identity or source-cohort mismatch rather than inventing authority", () => {
  const packet = {
    canonicalRecipeId:"wrong-id",
    source:{ cohortId:"OTHER" },
    sourceContent:{ title:"Wrong" }
  };
  assert.throws(() => projectProtectedPacketForIndex(packet, route({ recipeId:"expected", sourceCohortId:"EXPECTED" })), /IDENTITY_MISMATCH/);
});

test("P1 search query is bounded FTS syntax and page sizes stay bounded", () => {
  assert.equal(normalizeProtectedSearchQuery("  crème  brûlée soup "), '"crème"* AND "brûlée"* AND "soup"*');
  assert.equal(normalizeProtectedSearchQuery(""), null);
  assert.equal(normalizeProtectedSearchQuery("!!!"), null);
  assert.equal(boundedPageSize(999), PROTECTED_SEARCH_MAX_PAGE_SIZE);
  assert.equal(boundedPageSize(0), 24);
  assert.equal(PROTECTED_SEARCH_MAX_BOUND_PARAMETERS, 100);
  assert.equal(PROTECTED_SEARCH_SUMMARY_BOUND_PARAMETERS_PER_ROW, 13);
  assert.equal(PROTECTED_SEARCH_INDEX_BATCH_SIZE, 7);
  assert.ok(PROTECTED_SEARCH_INDEX_BATCH_SIZE * PROTECTED_SEARCH_SUMMARY_BOUND_PARAMETERS_PER_ROW <= PROTECTED_SEARCH_MAX_BOUND_PARAMETERS);
  assert.ok((PROTECTED_SEARCH_INDEX_BATCH_SIZE + 1) * PROTECTED_SEARCH_SUMMARY_BOUND_PARAMETERS_PER_ROW > PROTECTED_SEARCH_MAX_BOUND_PARAMETERS);
  assert.equal(PROTECTED_SEARCH_EXPECTED_COUNT, 19268);
  assert.equal(PROTECTED_SEARCH_TARGET_MAX_D1, 8);
});

test("P1 runtime uses keyset route pagination + FTS5 and contains no request-time full-corpus scan primitive", () => {
  const source = readFileSync(new URL("../src/server/protected-corpus-search-v1.mjs", import.meta.url), "utf8");
  assert.match(source, /USING fts5/);
  assert.match(source, /recipe_id > \?/);
  assert.match(source, /ORDER BY recipe_id/);
  assert.match(source, /LIMIT \?/);
  assert.match(source, /composition_version='v8015'/);
  assert.match(source, /composition_version='v8016' AND corpus_version='v8016'/);
  assert.match(source, /composition_version='v8017' AND corpus_version='v8017'/);
  assert.match(source, /composition_version='v8018' AND corpus_version='v8018'/);
  assert.doesNotMatch(source, /\bOFFSET\b/i);
  assert.doesNotMatch(source, /LIKE\s+['"]?%/i);
  assert.match(source, /fullCorpusScans:\s*0/g);
});

test("P1 API authenticates before any protected control/shard query on GET and POST", async () => {
  let prepares = 0;
  const failDb = { prepare(){ prepares += 1; throw new Error("must not query without session"); } };
  const env = {
    SESSION_SECRET: SECRET,
    CULINARY_CONTROL_DB: failDb,
    CULINARY_RECIPE_SHARD_00_DB: failDb,
    CULINARY_RECIPE_SHARD_01_DB: failDb
  };

  const getResponse = await protectedGet({
    request:new Request(`${ORIGIN}/api/protected-corpus/v1?action=browse`),
    env
  });
  assert.equal(getResponse.status, 401);
  const getBody = await getResponse.json();
  assert.equal(getBody.protectedDataReturned, false);
  assert.equal(getBody.fullCorpusScans, 0);

  const postResponse = await protectedPost({
    request:new Request(`${ORIGIN}/api/protected-corpus/v1`, {
      method:"POST",
      headers:{"content-type":"application/json"},
      body:JSON.stringify({ action:"index-batch" })
    }),
    env
  });
  assert.equal(postResponse.status, 401);
  assert.equal((await postResponse.json()).protectedDataReturned, false);
  assert.equal(prepares, 0);
});

test("P1 API source preserves public/recommendation firewalls and hard budget", () => {
  const source = readFileSync(new URL("../functions/api/protected-corpus/v1.js", import.meta.url), "utf8");
  assert.match(source, /publicRuntimeChanged:\s*false/);
  assert.match(source, /recommendationAdmissionChanged:\s*false/);
  assert.match(source, /HARD_D1_BUDGET_EXCEEDED/);
  assert.match(source, /missingShardBindings/);
  assert.match(source, /currentSessionAccount/);
  assert.doesNotMatch(source, /publicRuntimeChanged:\s*true|recommendationAdmissionChanged:\s*true/);
});

test("P1 owner browser is network-only and explicitly communicates protected-only authority", () => {
  const html = readFileSync(new URL("../protected-corpus.html", import.meta.url), "utf8");
  const sw = readFileSync(new URL("../sw.js", import.meta.url), "utf8");
  assert.match(html, /Private browse\/search over 19,268 protected recipes/);
  assert.match(html, /recommendation authority: not granted/i);
  assert.match(html, /\/api\/auth\/session/);
  assert.match(html, /\/api\/protected-corpus\/v1/);
  assert.match(html, /metrics\?\.d1Subqueries > 8/);
  assert.match(html, /batch\.reason \|\| batch\.error/);
  assert.match(html, /PROTECTED_CORPUS_P1_LIVE_OWNER_CANARY_PASS/);
  assert.match(html, /unitools:risotto-alla-milanese/);
  assert.match(html, /unitools:spaghetti-carbonara/);
  assert.match(html, /Number\(status\.indexedRecipeCount\) !== 19268/);
  assert.match(html, /Number\(status\.ftsRecipeCount\) !== 19268/);
  assert.match(html, /Number\(status\.structuralPartialCount\) !== 3/);
  assert.doesNotMatch(html, /canaryEvidence[^\n]*(?:account|email|session)/i);
  assert.match(sw, /"\/protected-corpus\.html"/);
});
