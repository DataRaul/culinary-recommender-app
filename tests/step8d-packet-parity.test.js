import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { buildStep8DProtectedPacket as buildCorePacket } from "../scripts/corpus-scale-step8d-core.mjs";
import { buildStep8DProtectedPacket as buildSharedPacket } from "../src/shared/step8d-packet.mjs";

const contract = JSON.parse(readFileSync(new URL("../config/corpus_scale_step8d_contract.json", import.meta.url), "utf8"));

const recipe = {
  slug: "parity-fixture",
  url: "https://theunitools.com/en/recipes/test/parity-fixture",
  country: "ES",
  name: { ru: "Тест", en: "Test" },
  nativeName: "Test",
  summary: { ru: "Описание", en: "Summary" },
  category: "main",
  diets: ["vegetarian"],
  difficulty: "easy",
  baseServings: 4,
  prepMinutes: 10,
  cookMinutes: 20,
  nutritionPerServing: { calories: 400, protein: 10, fat: 12, carbs: 50 },
  ingredients: [
    {
      id: "pepper",
      name: { ru: "Перец", en: "Pepper" },
      quantity: 1,
      unit: "tsp",
      scaling: "damped",
      note: null
    }
  ],
  steps: [{ text: { ru: "Готовить.", en: "Cook." }, minutes: 5 }],
  photo: { url: "https://example.invalid/excluded.jpg", author: "Excluded", license: "CC BY-SA 4.0" }
};

test("browser-safe Step 8D packet transformer remains byte-identical to the frozen machine transformer", () => {
  const core = buildCorePacket(recipe, { source: contract.source, ordinal: 42 });
  const shared = buildSharedPacket(recipe, { source: contract.source, ordinal: 42 });
  assert.deepEqual(shared, core);
  assert.equal(JSON.stringify(shared), JSON.stringify(core));
  assert.equal(shared.sourceMetadata.ingredientScaling[0].scaling, "damped");
  assert.equal(JSON.stringify(shared).includes("excluded.jpg"), false);
});
