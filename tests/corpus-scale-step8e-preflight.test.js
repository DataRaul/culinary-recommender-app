import test from "node:test";
import assert from "node:assert/strict";

import { resolveStep8EIngredient, step8ETitleKey } from "../scripts/corpus-scale-step8e-core.mjs";

test("Step 8E ingredient readiness uses only the existing canonical alias index", () => {
  const olive = resolveStep8EIngredient({ id: "olive-oil", name: { en: "Olive oil" } });
  assert.equal(olive.status, "RESOLVED");
  assert.equal(olive.canonicalIngredientId, "olive_oil");

  const unknown = resolveStep8EIngredient({ id: "dragon-fruit-powder", name: { en: "Dragon fruit powder" } });
  assert.equal(unknown.status, "UNRESOLVED");
  assert.equal(unknown.canonicalIngredientId, null);
});

test("Step 8E ingredient readiness fails closed on conflicting source id and source name mappings", () => {
  const conflict = resolveStep8EIngredient({ id: "salmon", name: { en: "Firm tofu" } });
  assert.equal(conflict.status, "CONFLICT");
  assert.equal(conflict.canonicalIngredientId, null);
  assert.deepEqual(new Set(conflict.mappings), new Set(["salmon", "tofu_firm"]));
});

test("Step 8E exact-title duplicate key is deterministic and accent/punctuation insensitive", () => {
  assert.equal(step8ETitleKey("Crème brûlée!"), "creme brulee");
  assert.equal(step8ETitleKey("  Creme   brulee "), "creme brulee");
});
