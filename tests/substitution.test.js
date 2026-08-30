import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_PROFILE, normalizeProfile } from "../src/domain/profile.js";
import { suggestSubstitutions, resolveAvailability } from "../src/domain/substitution.js";
import { RECIPES } from "../src/data/recipes.js";

test("substitution labels preserve explicit V1 quality type", () => {
  const options = suggestSubstitutions("feta", normalizeProfile(DEFAULT_PROFILE));
  assert.ok(options.some(item => item.type === "close_substitute"));
  assert.ok(options.some(item => item.type === "dietary_substitute"));
  assert.ok(options.every(item => item.note.length > 5));
});

test("unavailable ingredient is adapted when a supported safe substitute exists", () => {
  const recipe = RECIPES.find(item => item.id === "med_lentil_feta_salad");
  const profile = normalizeProfile({ ...DEFAULT_PROFILE, unavailableIngredientIds: ["feta"] });
  const result = resolveAvailability(recipe, profile);
  assert.equal(result.unresolved.length, 0);
  assert.equal(result.adaptations[0].from, "feta");
});

test("substitute conflicting with allergy is filtered", () => {
  const profile = normalizeProfile({ ...DEFAULT_PROFILE, unavailableIngredientIds: ["feta"], allergens: ["milk", "soy"] });
  const options = suggestSubstitutions("feta", profile);
  assert.equal(options.length, 0);
});
