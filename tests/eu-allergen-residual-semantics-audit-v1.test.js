import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { INGREDIENTS } from "../src/data/ingredients.js";

const audit = JSON.parse(
  await readFile(new URL("../config/eu_allergen_residual_semantics_audit_v1.json", import.meta.url), "utf8")
);

test("Lane 3 residual allergen audit remains zero-runtime", () => {
  assert.equal(audit.id, "EU_ALLERGEN_RESIDUAL_SEMANTICS_AUDIT_V1");
  assert.equal(audit.lane, "LANE_3");
  assert.equal(audit.boundaries.ingredientOntologyChanges, 0);
  assert.equal(audit.boundaries.profileVocabularyChanges, 0);
  assert.equal(audit.boundaries.recipeAllergenMetadataChanges, 0);
  assert.equal(audit.boundaries.recommendationBehaviorChanges, 0);
  assert.equal(audit.boundaries.protectedD1Reads, 0);
  assert.equal(audit.boundaries.protectedD1Writes, 0);
  assert.equal(audit.boundaries.protectedRecipeBodyAccess, 0);
  assert.equal(audit.boundaries.nutritionCompositionAuthorityChanges, 0);
  assert.equal(audit.boundaries.knowledgeCoreWrites, 0);
  assert.equal(audit.boundaries.barbecueMutations, 0);
  assert.equal(audit.boundaries.paidInfrastructureOrApiChanges, 0);
});

test("all currently canonical Annex II named nut species already carry tree_nut", () => {
  const expected = {
    almond: "almonds",
    walnut: "walnuts",
    cashew: "cashews"
  };
  assert.deepEqual(audit.treeNutAudit.canonicalSpeciesPresent, expected);

  for (const ingredientId of Object.values(expected)) {
    assert.ok(INGREDIENTS[ingredientId]);
    assert.ok(INGREDIENTS[ingredientId].allergens.includes("tree_nut"));
  }

  for (const absent of ["hazelnuts", "pecans", "brazil_nuts", "pistachios", "macadamia"]) {
    assert.equal(INGREDIENTS[absent], undefined);
  }

  assert.deepEqual(INGREDIENTS.peanuts.allergens, ["peanut"]);
  assert.deepEqual(INGREDIENTS.coconut_milk.allergens, []);
  assert.deepEqual(INGREDIENTS.coconut_cream.allergens, []);
  assert.deepEqual(INGREDIENTS.desiccated_coconut.allergens, []);
  assert.equal(audit.treeNutAudit.runtimeChangeEarned, false);
});

test("current canonical gluten identities remain covered and no exact Annex II exception is canonical", () => {
  for (const ingredientId of ["barley", "oats"]) {
    assert.ok(INGREDIENTS[ingredientId].allergens.includes("gluten"));
  }

  for (const ingredientId of audit.glutenAudit.canonicalWheatDerivedProductsOrFamiliesPresent) {
    assert.ok(INGREDIENTS[ingredientId], ingredientId);
    assert.ok(INGREDIENTS[ingredientId].allergens.includes("gluten"), ingredientId);
  }

  for (const absent of ["wheat", "rye", "spelt", "khorasan"]) {
    assert.equal(INGREDIENTS[absent], undefined);
  }

  assert.equal(audit.glutenAudit.exactCanonicalExceptionIdentityPresent, false);
  assert.equal(audit.glutenAudit.runtimeChangeEarned, false);
  assert.equal(audit.nextGate, "NOT_SELECTED__FUTURE_ONTOLOGY_OR_THRESHOLD_SCHEMA_TRIGGER");
});
