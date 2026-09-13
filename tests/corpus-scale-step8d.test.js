import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  STEP8D_CONTRACT_VERSION,
  STEP8D_EXPECTED_RECORD_COUNT,
  STEP8D_MANIFEST_VERSION,
  STEP8D_PACKET_SCHEMA_VERSION,
  buildStep8DArtifacts,
  buildStep8DProtectedPacket,
  validateStep8DPreWriteArtifacts,
  validateStep8DProtectedPacket
} from "../scripts/corpus-scale-step8d-core.mjs";

const contract = JSON.parse(readFileSync(new URL("../config/corpus_scale_step8d_contract.json", import.meta.url), "utf8"));
const clone = value => JSON.parse(JSON.stringify(value));

function recipeFor(index, overrides = {}) {
  return {
    slug: `recipe-${String(index).padStart(3, "0")}`,
    url: `https://theunitools.com/en/recipes/test/recipe-${index}`,
    country: index % 2 === 0 ? "ES" : "IT",
    name: { ru: `Рецепт ${index}`, en: `Recipe ${index}` },
    nativeName: null,
    summary: { ru: `Описание ${index}`, en: `Summary ${index}` },
    category: "main",
    diets: index % 3 === 0 ? ["vegetarian"] : [],
    difficulty: "easy",
    baseServings: 4,
    prepMinutes: 10,
    cookMinutes: 20,
    nutritionPerServing: { calories: 400 + index, protein: 10, fat: 12, carbs: 50 },
    ingredients: [
      {
        id: `ingredient-${index}`,
        name: { ru: `Ингредиент ${index}`, en: `Ingredient ${index}` },
        quantity: 100,
        unit: "g",
        scaling: index === 0 ? "damped" : "linear",
        note: null
      },
      {
        id: `salt-${index}`,
        name: { ru: "Соль", en: "Salt" },
        quantity: null,
        unit: "toTaste",
        scaling: "fixed",
        note: null
      }
    ],
    steps: [{ text: { ru: "Готовить.", en: "Cook." }, minutes: 5 }],
    photo: {
      url: `https://example.invalid/photo-${index}.jpg`,
      author: "Excluded",
      license: "CC BY-SA 4.0"
    },
    ...overrides
  };
}

function datasetFor(count = STEP8D_EXPECTED_RECORD_COUNT) {
  return {
    name: "UniTools World Recipes",
    version: "1.1.0",
    license: "CC BY-SA 4.0",
    counts: { recipes: count, countries: 127, ingredients: 755, steps: 3242 },
    recipes: Array.from({ length: count }, (_, index) => recipeFor(index))
  };
}

test("Step 8D machine contract is frozen to the pinned 501-record two-shard source", () => {
  assert.equal(contract.contractVersion, STEP8D_CONTRACT_VERSION);
  assert.equal(contract.source.recordCount, 501);
  assert.equal(contract.topology.recipeShardCount, 2);
  assert.equal(contract.topology.maxRowsPerWriteBatch, 10);
  assert.equal(contract.topology.maxD1SubqueriesPerProtectedRequest, 16);
  assert.equal(contract.topology.thirdShardAuthorized, false);
  assert.equal(contract.acceptanceCriteria.terminal, "STEP_8D_PROTECTED_POPULATION_PASS");
});

test("protected packet excludes media and quarantines source diet nutrition and scaling metadata", () => {
  const packet = buildStep8DProtectedPacket(recipeFor(0), { source: contract.source, ordinal: 0 });
  assert.equal(packet.packetSchemaVersion, STEP8D_PACKET_SCHEMA_VERSION);
  assert.equal(packet.identity.recipeId, "unitools:recipe-000");
  assert.equal(packet.recipe.photo, undefined);
  assert.equal(JSON.stringify(packet).includes("photo-0.jpg"), false);
  assert.deepEqual(packet.sourceMetadata.diets, ["vegetarian"]);
  assert.equal(packet.sourceMetadata.nutritionPerServing.calories, 400);
  assert.equal(packet.sourceMetadata.ingredientScaling[0].scaling, "damped");
  assert.equal(packet.authority.storageState, "PROTECTED_STORED_ONLY");
  assert.equal(packet.authority.publicRecommendationEligible, false);
  assert.equal(packet.authority.nutritionAuthority, "SOURCE_METADATA_ONLY_UNTRUSTED");
  assert.equal(packet.authority.dietaryAllergenAuthority, "SOURCE_METADATA_ONLY_UNTRUSTED");
  assert.equal(packet.authority.scalingAuthority, "SOURCE_METADATA_ONLY_UNTRUSTED");
  assert.equal(packet.authority.knowledgeCoreWriteAuthorized, false);
});

test("unexpected pinned scaling values are preserved verbatim rather than normalized into application authority", () => {
  const packet = buildStep8DProtectedPacket(recipeFor(1, {
    ingredients: [{
      id: "pepper",
      name: { ru: "Перец", en: "Pepper" },
      quantity: 1,
      unit: "tsp",
      scaling: "future-upstream-value",
      note: null
    }]
  }), { source: contract.source, ordinal: 1 });
  assert.equal(packet.sourceMetadata.ingredientScaling[0].scaling, "future-upstream-value");
  assert.equal(packet.authority.scalingAuthority, "SOURCE_METADATA_ONLY_UNTRUSTED");
});

test("exact 501-record transformation is deterministic and produces a descriptor-only two-shard manifest", () => {
  const dataset = datasetFor();
  const first = buildStep8DArtifacts(dataset, contract);
  const second = buildStep8DArtifacts(clone(dataset), clone(contract));
  assert.equal(first.manifest.manifestSchemaVersion, STEP8D_MANIFEST_VERSION);
  assert.equal(first.manifest.recipeCount, 501);
  assert.equal(first.packets.length, 501);
  assert.equal(first.manifest.routing.shardCount, 2);
  assert.ok(first.manifest.routing.descriptors.every(descriptor => descriptor.rowCount > 0));
  assert.equal(first.manifest.routing.descriptors.reduce((sum, descriptor) => sum + descriptor.rowCount, 0), 501);
  assert.ok(first.populationPlan.batches.every(batch => batch.rowCount <= 10));
  assert.equal(first.manifest.descriptorOnly, true);
  assert.equal(first.manifest.fullRecipeBodiesInManifest, false);
  assert.ok(first.manifest.entries.every(entry => entry.bodyJson === undefined));
  assert.equal(first.manifest.manifestSha256, second.manifest.manifestSha256);
  assert.equal(first.populationPlan.populationPlanSha256, second.populationPlan.populationPlanSha256);
  assert.deepEqual(first.manifest.entries, second.manifest.entries);

  const acceptance = validateStep8DPreWriteArtifacts(first);
  assert.equal(acceptance.pass, true);
  assert.equal(acceptance.liveWritesAllowed, true);
  assert.equal(acceptance.terminalCandidate, "STEP8D_PREWRITE_ACCEPTANCE_PASS");
});

test("stable IDs are source-slug based and duplicate slugs fail closed", () => {
  const dataset = datasetFor();
  dataset.recipes[500].slug = dataset.recipes[0].slug;
  assert.throws(() => buildStep8DArtifacts(dataset, contract), /Duplicate stable Step 8D recipeId/);
});

test("anything other than exactly 501 pinned records fails before population planning", () => {
  for (const count of [500, 502]) {
    assert.throws(() => buildStep8DArtifacts(datasetFor(count), contract), /requires exactly 501 recipes/);
  }
});

test("source snapshot identity mismatch fails closed", () => {
  const dataset = datasetFor();
  dataset.version = "2.0.0";
  assert.throws(() => buildStep8DArtifacts(dataset, contract), /Pinned dataset version mismatch/);
});

test("authority or media mutation makes a protected packet invalid", () => {
  const packet = buildStep8DProtectedPacket(recipeFor(0), { source: contract.source, ordinal: 0 });
  const publicPacket = clone(packet);
  publicPacket.authority.publicRecommendationEligible = true;
  assert.throws(() => validateStep8DProtectedPacket(publicPacket), /public-recommendation eligible/);

  const mediaPacket = clone(packet);
  mediaPacket.recipe.photo = { url: "https://example.invalid/x.jpg" };
  assert.throws(() => validateStep8DProtectedPacket(mediaPacket), /forbidden media/);
});
