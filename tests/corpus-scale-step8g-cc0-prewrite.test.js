import test from "node:test";
import assert from "node:assert/strict";

import {
  STEP8G_CC0_EXPECTED_RECIPE_COUNT,
  buildStep8GCc0BodyPackets
} from "../scripts/corpus-scale-step8g-cc0-prewrite-core.mjs";

test("CC0 v8003 protected packets preserve raw source and fail closed on authority", () => {
  const entries = Array.from({ length: STEP8G_CC0_EXPECTED_RECIPE_COUNT }, (_, index) => ({
    fileName: `recipe-${String(index).padStart(3, "0")}.md`,
    rawMarkdown: `# Recipe ${index}\n\n## Ingredients\n- 1 onion\n\n## Directions\n1. Cook.\n`,
    parsed: { title: `Recipe ${index}`, ingredients: ["onion"], directions: ["Cook."], tags: [] }
  }));
  const packets = buildStep8GCc0BodyPackets(entries);
  assert.equal(packets.length, STEP8G_CC0_EXPECTED_RECIPE_COUNT);
  assert.equal(packets[0].recipeId, "cc0_sgauthier_recipe_000");
  const body = JSON.parse(packets[0].bodyJson);
  assert.match(body.sourceContent.rawMarkdown, /# Recipe 0/);
  assert.equal(body.authority.recommendationAdmissionAuthorized, false);
  assert.equal(body.authority.publicRuntimeActivationAuthorized, false);
  assert.equal(body.authority.ingredientOntologyAuthority, false);
  assert.equal(body.authority.nutritionAuthority, false);
});

test("CC0 v8003 packet IDs are deterministic under input reordering", () => {
  const entries = Array.from({ length: STEP8G_CC0_EXPECTED_RECIPE_COUNT }, (_, index) => ({
    fileName: `recipe-${String(index).padStart(3, "0")}.md`,
    rawMarkdown: `# Recipe ${index}\n`,
    parsed: { title: `Recipe ${index}`, ingredients: [], directions: [], tags: [] }
  }));
  const forward = buildStep8GCc0BodyPackets(entries).map(row => row.recipeId);
  const reverse = buildStep8GCc0BodyPackets([...entries].reverse()).map(row => row.recipeId);
  assert.deepEqual(forward, reverse);
});
