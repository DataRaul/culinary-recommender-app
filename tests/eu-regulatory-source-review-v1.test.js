import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { INGREDIENTS } from "../src/data/ingredients.js";

const sourceReview = JSON.parse(
  await readFile(new URL("../config/eu_regulatory_source_review_v1.json", import.meta.url), "utf8")
);
const allergenAudit = JSON.parse(
  await readFile(new URL("../config/eu_regulatory_allergen_gap_audit_v1.json", import.meta.url), "utf8")
);

test("EU regulatory source review preserves zero-authority Lane 3 boundary", () => {
  assert.equal(sourceReview.id, "EU_REGULATORY_SOURCE_REVIEW_V1");
  assert.equal(sourceReview.reviews.length, 7);
  assert.equal(sourceReview.boundaries.protectedD1Reads, 0);
  assert.equal(sourceReview.boundaries.protectedD1Writes, 0);
  assert.equal(sourceReview.boundaries.recommendationAuthorityChanges, 0);
  assert.equal(sourceReview.boundaries.nutritionCompositionAuthorityChanges, 0);
  assert.equal(sourceReview.boundaries.allergenBehaviorChanges, 0);
  assert.equal(sourceReview.boundaries.publicRuntimeBehaviorChanges, 0);
  assert.equal(sourceReview.boundaries.knowledgeCoreWrites, 0);
  assert.equal(sourceReview.boundaries.barbecueMutations, 0);

  for (const review of sourceReview.reviews) {
    assert.equal(review.officialVerification, "PASS");
    assert.equal(review.directRecipeSafetyAuthority, false);
    assert.equal(review.bulkImportAuthorized, false);
    assert.ok(review.safeResearchUse.length > 0);
    assert.ok(review.reason);
  }
});

test("Annex II audit remains a truthful frozen pre-activation snapshot", () => {
  const actualTokens = [...new Set(Object.values(INGREDIENTS).flatMap(item => item.allergens || []))].sort();
  const preActivationTokens = actualTokens.filter(token => token !== "celery");
  assert.equal(Object.keys(INGREDIENTS).length, 136);
  assert.deepEqual(preActivationTokens, allergenAudit.appBaseline.allergenTokens);
  assert.equal(actualTokens.length, 10);
  assert.ok(actualTokens.includes("celery"));

  const rows = allergenAudit.euAnnexIiCategoryAudit;
  assert.equal(rows.length, 14);
  assert.equal(rows.filter(row => row.appToken !== null).length, 9);
  assert.equal(rows.filter(row => row.appToken === null).length, 5);
  assert.equal(allergenAudit.summary.categoryTokensPresent, 9);
  assert.equal(allergenAudit.summary.missingCategoryTokens, 5);
  assert.equal(allergenAudit.summary.behaviorChangeMade, false);
});

test("the frozen audit identifies the celery gap later closed by the separately authorized activation", () => {
  assert.ok(INGREDIENTS.celery);
  assert.deepEqual(INGREDIENTS.celery.allergens, ["celery"]);

  const celery = allergenAudit.euAnnexIiCategoryAudit.find(row => row.category === "CELERY");
  assert.equal(celery.appToken, null);
  assert.equal(celery.state, "MISSING_APP_ALLERGEN_TOKEN__CANONICAL_INGREDIENT_EXISTS");

  assert.equal(allergenAudit.boundaries.ingredientOntologyChanged, false);
  assert.equal(allergenAudit.boundaries.profileVocabularyChanged, false);
  assert.equal(allergenAudit.boundaries.recipeAllergenMetadataChanged, false);
  assert.equal(allergenAudit.boundaries.recommendationBehaviorChanged, false);
});
